/**
 * Agency Router Worker - Main Cloudflare Worker
 * Routes tasks to appropriate agents using skill graph and keyword matching
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { RouterEngine } from "./router-engine";
import { KeywordMatcher } from "./keyword-matcher";
import { ComplexityClassifier } from "./complexity-classifier";
import { RoutingCache, AuditLogger, CachedRoutingDecision } from "./cache";

// Define environment bindings (all optional for initial deployment)
interface Env {
  SKILL_GRAPH_DB?: D1Database;
  ROUTING_CACHE?: KVNamespace;
  AUDIT_LOG?: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

// Global state
let routerEngine: RouterEngine;
let routingCache: RoutingCache;
let auditLogger: AuditLogger;
let isInitialized = false;

/**
 * Initialize router on first request
 */
async function initializeRouter(env: Env): Promise<void> {
  if (isInitialized) {return;}

  try {
    routerEngine = new RouterEngine(env.SKILL_GRAPH_DB);
    routingCache = new RoutingCache(env.ROUTING_CACHE);
    auditLogger = new AuditLogger(env.AUDIT_LOG, env.SKILL_GRAPH_DB);

    // Load from D1 if available
    await routerEngine.loadAgentsFromDB();
    await routerEngine.loadSkillFilesFromDB();

    isInitialized = true;
    console.log("Router initialized successfully");
  } catch (err) {
    console.warn("Router initialization error (falling back to static):", err);
    routerEngine = new RouterEngine();
    routingCache = new RoutingCache();
    auditLogger = new AuditLogger();
    isInitialized = true;
  }
}

/**
 * CORS middleware
 */
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
}));

/**
 * Health check endpoint
 */
app.get("/health", async (c) => {
  if (!isInitialized) {
    return c.json(
      {
        status: "initializing",
        timestamp: new Date().toISOString(),
      },
      503
    );
  }

  return c.json({
    status: "healthy",
    service: "agency-router",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    initialized: isInitialized,
    agents: routerEngine.getAgents().length,
    skillFiles: routerEngine.getSkillFiles().length,
  });
});

/**
 * Main routing endpoint
 * POST /api/route
 * Body: { message: string, userId?: string, context?: object }
 */
app.post("/api/route", async (c) => {
  const startTime = performance.now();

  try {
    // Initialize on first request
    await initializeRouter(c.env);

    const body = (await c.req.json()) as Record<string, unknown>;
    const message = body.message as string;
    const userId = body.userId as string | undefined;
    const context = body.context as Record<string, unknown> | undefined;

    if (!message) {
      return c.json(
        {
          error: "Missing required field: message",
          code: "INVALID_REQUEST",
        },
        400
      );
    }

    // Check cache
    const messageHash = await RoutingCache.generateHash(message);
    let cached = false;
    let routingDecision: any = await routingCache.get(messageHash);

    if (routingDecision) {
      cached = true;
      console.log(`Cache hit for message: ${messageHash.slice(0, 8)}...`);
      // Enhance cached decision with additional fields for response
    } else {
      // Route message
      routingDecision = await routerEngine.route(message, userId, context);

      // Cache the decision
      await routingCache.set(messageHash, {
        agent: routingDecision.agent,
        confidence: routingDecision.confidence,
        reason: routingDecision.reason,
        timestamp: Date.now(),
        ttl: 3600,
        hash: messageHash,
      });
    }

    const latency = Math.round((performance.now() - startTime) * 100) / 100;

    // Log to audit trail
    await auditLogger.log({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      messageHash,
      message: message.substring(0, 500), // Store first 500 chars
      agent: routingDecision.agent,
      confidence: routingDecision.confidence,
      complexity: routingDecision.complexity || "unknown",
      estimatedCost: routingDecision.estimatedCost || 0,
      cached,
      latency,
      userId,
      metadata: context,
    });

    return c.json(
      {
        agent: routingDecision.agent,
        confidence: routingDecision.confidence,
        reason: routingDecision.reason,
        skillFilesUsed: routingDecision.skillFilesUsed || [],
        estimatedCost: routingDecision.estimatedCost || 0,
        complexity: routingDecision.complexity || "unknown",
        latency,
        timestamp: routingDecision.timestamp || new Date().toISOString(),
        cached,
        matchedKeywords: routingDecision.matchedKeywords || [],
      },
      200
    );
  } catch (err) {
    console.error("Routing error:", err);
    return c.json(
      {
        error: "Routing failed",
        code: "ROUTING_ERROR",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * Analyze message endpoint
 * POST /api/analyze
 * Returns complexity, keywords, and estimated cost without routing
 */
app.post("/api/analyze", async (c) => {
  try {
    const body = (await c.req.json()) as Record<string, unknown>;
    const message = body.message as string;

    if (!message) {
      return c.json(
        { error: "Missing required field: message", code: "INVALID_REQUEST" },
        400
      );
    }

    // Score agents
    const agentScores = KeywordMatcher.scoreMessage(message);
    const confidence = KeywordMatcher.getConfidenceScore(agentScores);

    // Assess complexity
    const complexity = ComplexityClassifier.assessComplexity(message);
    const estimatedCost = ComplexityClassifier.estimateCost(complexity);

    // Extract domain
    const domain = KeywordMatcher.extractDomain(message);

    return c.json({
      complexity: {
        level: complexity.level,
        score: complexity.score,
        factors: complexity.factors,
        estimatedTokens: complexity.estimatedTokens,
      },
      agents: agentScores.map((score) => ({
        agent: score.agent,
        score: score.score,
        domain: score.primaryDomain,
        matches: score.matches.slice(0, 5).map((m) => ({
          keyword: m.keyword,
          confidence: m.confidence,
          domain: m.domain,
        })),
      })),
      confidence: Math.round(confidence * 100) / 100,
      domain,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Analysis error:", err);
    return c.json(
      {
        error: "Analysis failed",
        code: "ANALYSIS_ERROR",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * Routing statistics endpoint
 * GET /api/routing-stats
 */
app.get("/api/routing-stats", async (c) => {
  await initializeRouter(c.env);

  const cacheStats = routingCache.getStats();
  const auditStats = await auditLogger.getRoutingStats();
  const topAgents = await auditLogger.getTopAgents(5);

  return c.json({
    cache: {
      hits: cacheStats.hits,
      misses: cacheStats.misses,
      hitRate: Math.round(cacheStats.hitRate * 10000) / 100,
      totalRequests: cacheStats.totalRequests,
      avgLatency: Math.round(cacheStats.avgLatency * 100) / 100,
    },
    routing: auditStats,
    topAgents,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Get agents endpoint
 * GET /api/agents
 */
app.get("/api/agents", async (c) => {
  await initializeRouter(c.env);

  return c.json({
    agents: routerEngine.getAgents().map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      keywords: agent.keywords,
      domains: agent.domains,
      costPerToken: agent.costPerToken,
      enabled: agent.enabled,
    })),
    count: routerEngine.getAgents().length,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Get skill files endpoint
 * GET /api/skill-files
 */
app.get("/api/skill-files", async (c) => {
  await initializeRouter(c.env);

  return c.json({
    skillFiles: routerEngine.getSkillFiles().map((skill) => ({
      id: skill.id,
      name: skill.name,
      agent: skill.agent,
      description: skill.description,
      keywords: skill.keywords,
    })),
    count: routerEngine.getSkillFiles().length,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Keyword search endpoint
 * GET /api/keyword-search?q=<keyword>
 */
app.get("/api/keyword-search", async (c) => {
  await initializeRouter(c.env);

  const keyword = c.req.query("q") || "";
  if (!keyword || keyword.length < 2) {
    return c.json({ error: "Search term must be at least 2 characters" }, 400);
  }

  const agents = routerEngine
    .getAgents()
    .filter((agent) =>
      agent.keywords.some((k) => k.includes(keyword.toLowerCase()))
    );

  const skills = routerEngine
    .getSkillFiles()
    .filter((skill) =>
      skill.keywords.some((k) => k.includes(keyword.toLowerCase())) ||
      skill.name.toLowerCase().includes(keyword.toLowerCase())
    );

  return c.json({
    keyword,
    agents: agents.map((a) => ({
      id: a.id,
      name: a.name,
      matches: a.keywords.filter((k) => k.includes(keyword.toLowerCase())),
    })),
    skills: skills.map((s) => ({
      id: s.id,
      name: s.name,
      agent: s.agent,
      matches: s.keywords.filter((k) => k.includes(keyword.toLowerCase())),
    })),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Clear cache endpoint (admin only)
 * POST /api/admin/clear-cache
 */
app.post("/api/admin/clear-cache", async (c) => {
  await initializeRouter(c.env);

  try {
    await routingCache.clearAll();
    routingCache.resetStats();

    return c.json({
      success: true,
      message: "Cache cleared successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Clear cache error:", err);
    return c.json(
      {
        success: false,
        error: "Failed to clear cache",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * 404 handler
 */
app.notFound((c) => {
  return c.json(
    {
      error: "Not found",
      code: "NOT_FOUND",
      path: c.req.path,
      availableEndpoints: [
        "POST /api/route",
        "POST /api/analyze",
        "GET /api/routing-stats",
        "GET /api/agents",
        "GET /api/skill-files",
        "GET /api/keyword-search",
        "GET /health",
      ],
    },
    404
  );
});

/**
 * Error handler
 */
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json(
    {
      error: "Internal server error",
      code: "INTERNAL_ERROR",
      message: err instanceof Error ? err.message : "Unknown error",
    },
    500
  );
});

export default app;
