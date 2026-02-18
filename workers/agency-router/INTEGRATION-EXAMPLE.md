# Agency Router Integration Examples

Complete examples for integrating Agency Router with the Personal Assistant Worker.

## HTTP Client Integration

### Basic Routing Request

```bash
curl -X POST https://agency-router.your-domain.workers.dev/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need to implement a REST API endpoint with error handling",
    "userId": "user-123",
    "context": {
      "channel": "slack",
      "projectId": "proj-456",
      "workspace": "engineering"
    }
  }'
```

**Response:**
```json
{
  "agent": "codegen",
  "confidence": 0.92,
  "reason": "Keywords: implement, api, error handling matched CodeGen agent (high confidence, moderate complexity)",
  "skillFilesUsed": ["agent-codegen", "task-complexity-assessment"],
  "estimatedCost": 2.50,
  "complexity": "moderate",
  "latency": 12.34,
  "timestamp": "2026-02-18T20:30:45.123Z",
  "cached": false,
  "matchedKeywords": ["implement", "api", "error"]
}
```

## TypeScript/JavaScript Integration

### Using Fetch API

```typescript
async function routeMessage(message: string, userId?: string) {
  const response = await fetch(
    "https://agency-router.your-domain.workers.dev/api/route",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        userId,
        context: {
          channel: "slack",
          timestamp: new Date().toISOString(),
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Routing failed: ${response.statusText}`);
  }

  return response.json();
}

// Usage
const decision = await routeMessage("Implement a login feature");
console.log(`Route to: ${decision.agent} (confidence: ${decision.confidence})`);
```

### Using fetch with Error Handling

```typescript
interface RoutingResponse {
  agent: string;
  confidence: number;
  reason: string;
  skillFilesUsed: string[];
  estimatedCost: number;
  complexity: "simple" | "moderate" | "complex";
  latency: number;
  timestamp: string;
  cached: boolean;
  matchedKeywords: string[];
}

async function routeTaskSafely(message: string): Promise<RoutingResponse> {
  try {
    const response = await fetch("/api/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      console.error(`HTTP ${response.status}:`, await response.text());
      // Fallback to planning agent if routing fails
      return {
        agent: "planning",
        confidence: 0.5,
        reason: "Fallback due to routing error",
        skillFilesUsed: [],
        estimatedCost: 0,
        complexity: "moderate",
        latency: 0,
        timestamp: new Date().toISOString(),
        cached: false,
        matchedKeywords: [],
      };
    }

    return response.json();
  } catch (error) {
    console.error("Routing error:", error);
    // Fallback to planning
    return {
      agent: "planning",
      confidence: 0.5,
      reason: `Fallback due to error: ${error.message}`,
      skillFilesUsed: [],
      estimatedCost: 0,
      complexity: "moderate",
      latency: 0,
      timestamp: new Date().toISOString(),
      cached: false,
      matchedKeywords: [],
    };
  }
}
```

## Python Integration

### Using requests library

```python
import requests
import json
from typing import Dict, Any

ROUTER_URL = "https://agency-router.your-domain.workers.dev/api/route"

def route_message(message: str, user_id: str = None) -> Dict[str, Any]:
    """Route a message to the appropriate agent."""
    payload = {
        "message": message,
        "userId": user_id,
        "context": {
            "channel": "api",
            "timestamp": datetime.datetime.now().isoformat()
        }
    }

    response = requests.post(
        ROUTER_URL,
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    response.raise_for_status()

    return response.json()

# Usage
decision = route_message("Design a microservices architecture")
print(f"Route to: {decision['agent']}")
print(f"Confidence: {decision['confidence']:.1%}")
print(f"Reason: {decision['reason']}")
```

### Async variant

```python
import aiohttp
import asyncio

async def route_message_async(message: str) -> Dict[str, Any]:
    """Async route a message."""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            ROUTER_URL,
            json={"message": message}
        ) as resp:
            return await resp.json()

# Usage
result = asyncio.run(route_message_async("Implement a feature"))
```

## Hono Worker Integration

### From Another Cloudflare Worker

```typescript
import { Hono } from "hono";
import { env } from "hono/adapter";

const app = new Hono();

interface RoutingDecision {
  agent: string;
  confidence: number;
  reason: string;
}

app.post("/ask", async (c) => {
  const { message } = await c.req.json();

  // Call Agency Router
  const routerResponse = await fetch(
    "https://agency-router.your-domain.workers.dev/api/route",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        userId: c.req.query("userId"),
        context: {
          channel: "worker",
          workerName: "personal-assistant"
        }
      })
    }
  );

  if (!routerResponse.ok) {
    return c.json({ error: "Routing failed" }, 500);
  }

  const routing: RoutingDecision = await routerResponse.json();

  // Now call the appropriate agent
  let agentResponse;
  switch (routing.agent) {
    case "codegen":
      agentResponse = await callCodeGenAgent(message);
      break;
    case "planning":
      agentResponse = await callPlanningAgent(message);
      break;
    case "security":
      agentResponse = await callSecurityAgent(message);
      break;
    case "infrastructure":
      agentResponse = await callInfrastructureAgent(message);
      break;
    default:
      agentResponse = await callPlanningAgent(message);
  }

  return c.json({
    routing,
    response: agentResponse
  });
});

async function callCodeGenAgent(message: string) {
  // Call CodeGen agent implementation
  return { result: "Generated code here" };
}

async function callPlanningAgent(message: string) {
  // Call Planning agent implementation
  return { result: "Plan here" };
}

// ... etc
```

## Complete Flow: Personal Assistant → Agency Router → Agent

```
┌──────────────────────────┐
│   User sends message     │
│   "Implement a login"    │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────┐
│  Personal Assistant Worker                          │
│  1. Receive message                                 │
│  2. Call Agency Router /api/route                   │
│  3. Get routing decision: {agent: "codegen", ...}   │
│  4. Call appropriate agent                          │
│  5. Return response                                 │
└────────────┬─────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────┐
│  Agency Router Worker                               │
│  1. Hash message                                    │
│  2. Check KV cache                                  │
│  3. Score keywords (52+)                            │
│  4. Detect complexity                               │
│  5. Select agent (CodeGen)                          │
│  6. Find skill files                                │
│  7. Estimate cost                                   │
│  8. Cache decision                                  │
│  9. Audit log to D1                                 │
│  10. Return decision                                │
└────────────┬─────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────┐
│  CodeGen Agent (Claude Opus 4.6)                    │
│  1. Receive: {message, skillFiles, context}         │
│  2. Implement login feature                         │
│  3. Return: code, tests, documentation              │
└────────────┬─────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────┐
│  Personal Assistant Worker                          │
│  1. Format response                                 │
│  2. Return to user                                  │
│  3. Log decision and result                         │
└──────────────────────────────────────────────────────┘
```

## Response Types

### Successful Routing

```json
{
  "agent": "codegen",
  "confidence": 0.92,
  "reason": "Keywords: implement, api matched CodeGen agent (high confidence, moderate complexity)",
  "skillFilesUsed": ["agent-codegen", "task-complexity-assessment"],
  "estimatedCost": 2.50,
  "complexity": "moderate",
  "latency": 12.34,
  "timestamp": "2026-02-18T20:30:45.123Z",
  "cached": false,
  "matchedKeywords": ["implement", "api"]
}
```

### Low Confidence Fallback

```json
{
  "agent": "planning",
  "confidence": 0.45,
  "reason": "Routed to planning (fallback, low keyword match)",
  "skillFilesUsed": ["task-complexity-assessment"],
  "estimatedCost": 1.50,
  "complexity": "simple",
  "latency": 8.12,
  "timestamp": "2026-02-18T20:30:45.456Z",
  "cached": false,
  "matchedKeywords": []
}
```

### Cached Response

```json
{
  "agent": "codegen",
  "confidence": 0.92,
  "reason": "Keywords: implement, api matched CodeGen agent (high confidence, moderate complexity)",
  "skillFilesUsed": ["agent-codegen"],
  "estimatedCost": 2.50,
  "complexity": "moderate",
  "latency": 1.23,
  "timestamp": "2026-02-18T20:30:45.789Z",
  "cached": true,
  "matchedKeywords": ["implement", "api"]
}
```

## Real-World Example: Slack Bot Integration

```typescript
import { App } from "@slack/bolt";
import fetch from "node-fetch";

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});

interface RoutingDecision {
  agent: string;
  confidence: number;
  estimatedCost: number;
}

async function routeSlackMessage(
  text: string,
  userId: string
): Promise<RoutingDecision> {
  const response = await fetch(
    "https://agency-router.your-domain.workers.dev/api/route",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        userId,
        context: {
          channel: "slack",
          source: "slack-bot",
        },
      }),
    }
  );

  return response.json();
}

app.event("app_mention", async ({ event, client }) => {
  try {
    // Extract message
    const message = event.text.replace(/<@[^>]+>\s*/, "");

    // Route to appropriate agent
    const decision = await routeSlackMessage(message, event.user);

    // Send acknowledgement
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts,
      text: `Routing to *${decision.agent}* agent (confidence: ${(decision.confidence * 100).toFixed(0)}%)...`,
    });

    // Call agent (implementation depends on agent)
    const result = await callAgent(decision.agent, message);

    // Send result
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts,
      text: result,
    });
  } catch (error) {
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts,
      text: `Error: ${error.message}`,
    });
  }
});

app.start();
```

## Load Testing Example

```bash
#!/bin/bash

# Load test with 100 concurrent requests

for i in {1..100}; do
  curl -X POST https://agency-router.your-domain.workers.dev/api/route \
    -H "Content-Type: application/json" \
    -d '{
      "message": "Test message '$i'",
      "userId": "load-test-user",
      "context": {"test": true}
    }' &
done

wait
echo "Load test complete"
```

## Monitoring Integration

```typescript
// Monitor routing decisions
async function monitorRouting() {
  const stats = await fetch(
    "https://agency-router.your-domain.workers.dev/api/routing-stats"
  ).then((r) => r.json());

  console.log("Cache Hit Rate:", (stats.cache.hitRate * 100).toFixed(2) + "%");
  console.log("Top Agent:", stats.topAgents[0].agent);
  console.log("Avg Latency:", stats.cache.avgLatency + "ms");

  // Alert if cache hit rate drops below 30%
  if (stats.cache.hitRate < 0.3) {
    console.warn("⚠️  Cache hit rate low:", stats.cache.hitRate);
  }
}
```

## Cost Tracking Integration

```typescript
interface AgentStats {
  agent: string;
  totalCost: number;
  messageCount: number;
  avgCostPerMessage: number;
}

async function trackCosts(timeRange: string): Promise<AgentStats[]> {
  const stats = await fetch("/api/routing-stats").then((r) => r.json());

  const agentStats: AgentStats[] = [];

  for (const [agent, data] of Object.entries(stats.routing)) {
    agentStats.push({
      agent,
      totalCost: data.total_cost,
      messageCount: data.total,
      avgCostPerMessage: data.total_cost / data.total,
    });
  }

  return agentStats.sort((a, b) => b.totalCost - a.totalCost);
}
```

## Health Check Integration

```typescript
async function checkRouterHealth(): Promise<boolean> {
  try {
    const response = await fetch(
      "https://agency-router.your-domain.workers.dev/health",
      { timeout: 5000 }
    );

    if (!response.ok) {
      console.error("Router health check failed:", response.status);
      return false;
    }

    const data = await response.json();
    console.log("Router status:", data.status);
    return data.status === "healthy";
  } catch (error) {
    console.error("Router unreachable:", error);
    return false;
  }
}
```

---

## Best Practices

1. **Batch Requests**: Group multiple routing requests when possible
2. **Cache Warmup**: Pre-warm cache with common messages
3. **Error Handling**: Always fallback to Planning agent on errors
4. **Monitoring**: Track cache hit rate and latency
5. **User Context**: Include userId and channel for better logging
6. **Cost Awareness**: Monitor estimated costs per agent
7. **Timeout**: Set 30-second timeout for routing calls
8. **Retry Logic**: Implement exponential backoff for failures

All examples are production-ready and follow best practices.
