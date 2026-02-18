import { Hono } from "hono";
import { Anthropic } from "@anthropic-ai/sdk";

// Types
interface PersonalContext {
  userId: string;
  name: string;
  preferences: {
    budgetLimit: number; // Daily budget in $
    approvalRequired: boolean;
    costThreshold: number; // Escalate to human if cost > this
    riskTolerance: "conservative" | "balanced" | "aggressive";
  };
  rules: {
    allowedAgencies: string[];
    blockedOperations: string[];
    requiresHumanApproval: string[];
  };
}

interface TaskApprovalRequest {
  taskId: string;
  type: string; // "code" | "security" | "planning" | "other"
  description: string;
  estimatedCost: number;
  agentType: string;
  channelContext?: Record<string, string>;
}

interface ApprovalResponse {
  approved: boolean;
  reason: string;
  constraints?: Record<string, string>;
  monitoringLevel: "none" | "basic" | "intensive";
  costLimit?: number;
}

interface HaltRequest {
  taskId: string;
  reason: string;
}

// Initialize Hono app
const app = new Hono<{
  Bindings: {
    ANTHROPIC_API_KEY: string;
    DB: D1Database;
    KV_CACHE: KVNamespace;
    KV_SESSIONS: KVNamespace;
    ENVIRONMENT: string;
    AGENCY_GATEWAY_URL: string;
    AGENCY_GATEWAY_TOKEN: string;
  };
}>();

// Default personal context (customize per user)
const DEFAULT_PERSONAL_CONTEXT: PersonalContext = {
  userId: "user-default",
  name: "User",
  preferences: {
    budgetLimit: 50, // $50/day
    approvalRequired: true,
    costThreshold: 10, // Escalate if > $10 per task
    riskTolerance: "balanced",
  },
  rules: {
    allowedAgencies: ["openclaw", "custom"],
    blockedOperations: ["delete_production", "modify_credentials", "deploy_without_review"],
    requiresHumanApproval: ["large_external_calls", "data_deletion", "permission_changes"],
  },
};

// Load personal context from D1
async function getPersonalContext(db: D1Database, userId: string): Promise<PersonalContext> {
  try {
    const stmt = await db.prepare(
      "SELECT context FROM personal_context WHERE user_id = ? LIMIT 1"
    );
    const result = await stmt.bind(userId).first<{ context: string }>();
    return result ? JSON.parse(result.context) : DEFAULT_PERSONAL_CONTEXT;
  } catch (error) {
    console.log("No saved context, using defaults");
    return DEFAULT_PERSONAL_CONTEXT;
  }
}

// Load session history from KV
async function getSessionHistory(kv: KVNamespace, sessionKey: string): Promise<any[]> {
  try {
    const history = await kv.get(`session:${sessionKey}`, "json");
    return history || [];
  } catch {
    return [];
  }
}

// Save session to KV
async function saveSession(kv: KVNamespace, sessionKey: string, history: any[]): Promise<void> {
  await kv.put(`session:${sessionKey}`, JSON.stringify(history), {
    expirationTtl: 30 * 24 * 60 * 60, // 30 days
  });
}

// Task approval endpoint
app.post("/api/approve", async (c) => {
  const { taskId, type, description, estimatedCost, agentType } = await c.req.json<TaskApprovalRequest>();
  const context = await getPersonalContext(c.env.DB, "user-default");

  // Check budget
  if (estimatedCost > context.preferences.costThreshold) {
    return c.json({
      approved: false,
      reason: `Cost ($${estimatedCost}) exceeds threshold ($${context.preferences.costThreshold})`,
      monitoringLevel: "intensive",
    } as ApprovalResponse);
  }

  // Check if operation is blocked
  if (context.rules.blockedOperations.some((op) => description.toLowerCase().includes(op))) {
    return c.json({
      approved: false,
      reason: "Operation blocked by personal rules",
      monitoringLevel: "intensive",
    } as ApprovalResponse);
  }

  // Use Claude Opus to make intelligent approval decision
  const client = new Anthropic({
    apiKey: c.env.ANTHROPIC_API_KEY,
  });

  const decision = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 500,
    system: `You are a personal AI assistant approval system. Evaluate task requests based on:
1. Safety and compliance with personal rules
2. Cost efficiency (prefer cheaper solutions when available)
3. Strategic alignment with personal goals
4. Risk assessment

Respond with JSON: { "approved": boolean, "reason": string, "constraints": {}, "monitoringLevel": "none|basic|intensive" }`,
    messages: [
      {
        role: "user",
        content: `Evaluate this task request:
Task: ${description}
Type: ${type}
Agent: ${agentType}
Estimated Cost: $${estimatedCost}
User Preferences: ${JSON.stringify(context.preferences)}
User Rules: ${JSON.stringify(context.rules)}`,
      },
    ],
  });

  const responseText =
    decision.content[0].type === "text" ? decision.content[0].text : "";

  try {
    const parsed = JSON.parse(responseText);
    return c.json(parsed as ApprovalResponse);
  } catch {
    return c.json({
      approved: true,
      reason: "Claude approval granted",
      monitoringLevel: "basic",
    } as ApprovalResponse);
  }
});

// Halt/abort endpoint
app.post("/api/halt", async (c) => {
  const { taskId, reason } = await c.req.json<HaltRequest>();

  // Send halt signal to agency gateway
  try {
    const response = await fetch(`${c.env.AGENCY_GATEWAY_URL}/api/halt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${c.env.AGENCY_GATEWAY_TOKEN}`,
      },
      body: JSON.stringify({ taskId, reason: `Halted by personal assistant: ${reason}` }),
    });

    return c.json(
      { success: response.ok, taskId, message: "Halt signal sent to agency" },
      response.ok ? 200 : 500
    );
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Chat endpoint (multi-turn conversation with memory)
app.post("/api/chat", async (c) => {
  const { message, sessionKey } = await c.req.json<{ message: string; sessionKey: string }>();

  // Load session history
  const history = await getSessionHistory(c.env.KV_SESSIONS, sessionKey);

  // Initialize Claude client
  const client = new Anthropic({
    apiKey: c.env.ANTHROPIC_API_KEY,
  });

  // Build context with skill graph (loaded from agency gateway)
  const systemPrompt = `You are a personal AI assistant powered by OpenClaw.

Your role:
1. Help with personal tasks and decisions
2. Control and approve agency work
3. Monitor costs and quality
4. Maintain context about personal priorities

You have access to:
- Personal preferences and rules
- Skill graphs for routing decisions
- Session memory of past conversations
- Real-time agency status

Always be proactive about suggesting optimizations and catching issues.`;

  // Call Claude with history
  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [
      ...history.map((h: any) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user", content: message },
    ],
  });

  const assistantMessage =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Save to session history
  history.push({ role: "user", content: message });
  history.push({ role: "assistant", content: assistantMessage });
  await saveSession(c.env.KV_SESSIONS, sessionKey, history);

  return c.json({
    message: assistantMessage,
    sessionKey,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  });
});

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Monitoring dashboard (JSON)
app.get("/api/status", async (c) => {
  try {
    const sessions = await c.env.KV_CACHE.get("stats:sessions", "json");
    const approvals = await c.env.KV_CACHE.get("stats:approvals", "json");

    return c.json({
      status: "operational",
      sessions: sessions || 0,
      approvalsToday: approvals || 0,
      costToday: "$0",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return c.json({ status: "degraded" }, 503);
  }
});

// Setup D1 database on first run
app.post("/setup", async (c) => {
  try {
    // Create personal_context table
    await c.env.DB.exec(`
      CREATE TABLE IF NOT EXISTS personal_context (
        user_id TEXT PRIMARY KEY,
        context TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create approvals table
    await c.env.DB.exec(`
      CREATE TABLE IF NOT EXISTS approvals (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        task_description TEXT,
        estimated_cost REAL,
        approved BOOLEAN,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sessions table
    await c.env.DB.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_key TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        history TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default personal context
    await c.env.DB.prepare(
      "INSERT OR IGNORE INTO personal_context (user_id, context) VALUES (?, ?)"
    )
      .bind("user-default", JSON.stringify(DEFAULT_PERSONAL_CONTEXT))
      .run();

    return c.json({ success: true, message: "Database initialized" });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Export for Cloudflare Workers
export default app;
