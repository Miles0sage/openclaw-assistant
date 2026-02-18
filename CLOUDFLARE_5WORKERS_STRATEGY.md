# Cloudflare 5-Worker Strategy — Maximize Your Paid Plan

You're paying for 5 Workers. Here's how to use all 5 efficiently across your infrastructure:

## Worker Allocation

```
Worker 1: Personal Assistant (Approval System)
Worker 2: Agency Router (Task Distribution)
Worker 3: Skill Graph Loader (Knowledge Base)
Worker 4: Monitoring Dashboard (Real-time Stats)
Worker 5: Webhook Aggregator (Incoming Channels)
```

---

## Worker 1: Personal Assistant ✅ (READY TO DEPLOY)

**What it does:**
- Approves/rejects agency tasks
- Chat interface with memory (D1 + KV)
- Halt signals to agency
- Cost control + budget enforcement

**File:** `/openclaw-assistant/workers/personal-assistant/`

**Deploy:**
```bash
cd workers/personal-assistant
wrangler deploy --name personal-assistant
# URL: https://personal-assistant.your-domain.com
```

**Endpoints:**
- `POST /api/approve` — Task approval
- `POST /api/halt` — Stop task
- `POST /api/chat` — Chat with memory
- `GET /health` — Health check

---

## Worker 2: Agency Router (NEW)

**What it does:**
- Routes incoming requests to best agent
- Uses skill graph keywords for routing
- Load balances across agent pool
- 90%+ accuracy routing (from skill graph)

**Build this next:**

**File structure:**
```
workers/agency-router/
├── wrangler.toml
├── package.json
├── src/
│   ├── index.ts (Hono app)
│   ├── router.ts (Skill graph router)
│   ├── agents.ts (Agent pool)
│   └── metrics.ts (Latency tracking)
```

**Key features:**
- Load skill graph from D1 (not hardcoded)
- Route by: keyword match + complexity + channel
- Log routing decisions to KV for audit trail
- Auto-fallback if primary agent down
- <100ms routing latency (target)

**Deploy:**
```bash
wrangler deploy --name agency-router
# URL: https://agency-router.your-domain.com
```

**API:**
```bash
POST /api/route
{
  "message": "Implement feature X",
  "channel": "slack",
  "complexity": "moderate"
}

Response:
{
  "agent": "codegen",
  "confidence": 0.92,
  "skillFilesUsed": ["task-complexity-assessment", "agent-codegen"],
  "routingLatency": 12
}
```

---

## Worker 3: Skill Graph Loader (NEW)

**What it does:**
- Loads skill graph from D1/R2
- Serves skill graph as JSON API
- Indexes keywords for fast search
- Cache warming on startup

**Why separate?**
- Skill graph is static, can be cached aggressively
- Router doesn't need to reload entire graph per request
- Easy to update without restarting router

**File structure:**
```
workers/skill-graph-loader/
├── wrangler.toml
├── package.json
├── src/
│   ├── index.ts (Hono app)
│   ├── loader.ts (D1 → JSON)
│   └── cache.ts (KV caching)
```

**Deploy:**
```bash
wrangler deploy --name skill-graph-loader
# URL: https://skill-graph.your-domain.com
```

**API:**
```bash
GET /api/graph  # Full skill graph (cached)
GET /api/agents  # All agents + keywords
GET /api/channels  # All channels + context
GET /api/search?q=implement  # Search by keyword
```

**Cache Strategy:**
- Full graph: 24-hour TTL
- Index: 1-hour TTL
- Search results: 30-minute TTL

---

## Worker 4: Monitoring Dashboard (NEW)

**What it does:**
- Real-time stats (requests, costs, approvals)
- Health checks for all workers + agency gateway
- SLA tracking (uptime, latency, accuracy)
- JSON API + optional HTML dashboard

**Why separate?**
- Don't slow down other workers with monitoring overhead
- Can run health checks independently
- Nice-to-have traffic doesn't block critical workers

**File structure:**
```
workers/monitoring-dashboard/
├── wrangler.toml
├── package.json
├── src/
│   ├── index.ts (Hono app)
│   ├── metrics.ts (Collect from KV)
│   ├── health.ts (Probe all endpoints)
│   └── dashboard.html (Optional web UI)
```

**Deploy:**
```bash
wrangler deploy --name monitoring-dashboard
# URL: https://monitor.your-domain.com
```

**API:**
```bash
GET /api/stats  # Daily stats
{
  "requests": 5203,
  "avgRoutingLatency": 23,
  "approvalRate": 0.92,
  "costToday": "$12.50",
  "workerStatus": {
    "personal-assistant": "healthy",
    "agency-router": "healthy",
    "skill-graph-loader": "healthy",
    "webhook-aggregator": "healthy",
    "agency-gateway": "healthy"
  }
}

GET /api/sla  # SLA tracking
{
  "uptime7d": 99.97,
  "avgLatency": 34,
  "routingAccuracy": 0.918,
  "costTrend": "stable"
}

GET /health  # Simple health check
GET /dashboard  # HTML dashboard (optional)
```

---

## Worker 5: Webhook Aggregator (NEW)

**What it does:**
- Single entry point for all incoming webhooks
- Telegram bot updates
- Slack events
- Discord interactions
- Routes to appropriate handler worker

**Why separate?**
- Isolates webhook traffic from critical workers
- Can retry/queue failed webhooks
- Easy to scale independently
- Deduplication + rate limiting

**File structure:**
```
workers/webhook-aggregator/
├── wrangler.toml
├── package.json
├── src/
│   ├── index.ts (Hono app)
│   ├── handlers.ts (Channel handlers)
│   ├── queue.ts (Webhook queue)
│   └── dedup.ts (Deduplication)
```

**Deploy:**
```bash
wrangler deploy --name webhook-aggregator
# URL: https://webhooks.your-domain.com
```

**API:**
```bash
POST /telegram/:botId  # Telegram webhooks
POST /slack/:workspaceId  # Slack webhooks
POST /discord/:guildId  # Discord webhooks

# Each webhook:
# - Deduplicates by ID
# - Queues to appropriate worker
# - Returns 200 immediately (async processing)
```

**Queue to Workers:**
```
Webhook → Dedup → Queue (KV)
             ↓
    ┌────────┼────────┐
    ↓        ↓        ↓
Personal  Agency   Skill
Assistant Router   Graph
```

---

## Architecture Diagram

```
5 Cloudflare Workers
├─ Worker 1: Personal Assistant (Approval)
│   ├─ D1 (personal context, approvals)
│   ├─ KV (sessions, stats)
│   └─ Anthropic (Claude Opus decisions)
│
├─ Worker 2: Agency Router (Intelligent routing)
│   ├─ Calls Skill Graph Loader
│   ├─ KV (routing cache, decisions)
│   └─ Logs to D1 (audit trail)
│
├─ Worker 3: Skill Graph Loader (Knowledge base)
│   ├─ D1 (graph data)
│   ├─ KV (indexed keywords, cache)
│   └─ R2 (full graph backup)
│
├─ Worker 4: Monitoring Dashboard (Stats)
│   ├─ Reads KV (metrics)
│   ├─ Calls all workers (health checks)
│   └─ D1 (historical stats)
│
└─ Worker 5: Webhook Aggregator (Ingress)
    ├─ Deduplication (KV)
    ├─ Queue (KV or Durable Objects)
    └─ Routes to Workers 1-4

All Workers
    ↓
Shared Resources
├─ D1 Database (approvals, graph, context)
├─ KV Namespaces (sessions, metrics, cache, queue)
└─ R2 Storage (backups, large files)
    ↓
Agency Gateway (VPS)
└─ Runs actual agents (PM, CodeGen, Security)
```

---

## Setup Steps

### Phase 1: Personal Assistant (NOW) ✅
```bash
cd workers/personal-assistant
wrangler deploy --name personal-assistant
# Test: curl https://personal-assistant.your-domain.com/health
```

### Phase 2: Agency Router (THIS WEEK)
```bash
mkdir workers/agency-router
# Create files (provided below)
wrangler deploy --name agency-router
# Test routing with skill graph
```

### Phase 3: Skill Graph Loader (THIS WEEK)
```bash
mkdir workers/skill-graph-loader
# Create files
wrangler deploy --name skill-graph-loader
# Load graph from routing-knowledge/
```

### Phase 4: Monitoring Dashboard (NEXT)
```bash
mkdir workers/monitoring-dashboard
wrangler deploy --name monitoring-dashboard
# Check all workers healthy
```

### Phase 5: Webhook Aggregator (FINAL)
```bash
mkdir workers/webhook-aggregator
wrangler deploy --name webhook-aggregator
# Configure Telegram/Slack/Discord webhooks
```

---

## Shared Resources (All Workers Use)

### D1 Database Tables
```sql
CREATE TABLE personal_context (...)          -- Worker 1
CREATE TABLE approvals (...)                 -- Worker 1
CREATE TABLE skill_graph (...)               -- Worker 3
CREATE TABLE routing_decisions (...)         -- Worker 2
CREATE TABLE metrics (...)                   -- Worker 4
```

### KV Namespaces
```
KV_SESSIONS          -- Worker 1 (personal chat history)
KV_CACHE             -- Worker 3 (skill graph cache)
KV_ROUTING_CACHE     -- Worker 2 (routing decisions)
KV_METRICS           -- Worker 4 (stats/SLA data)
KV_WEBHOOK_QUEUE     -- Worker 5 (pending webhooks)
KV_DEDUP             -- Worker 5 (webhook deduplication)
```

### R2 Storage (Optional)
```
personal-assistant-backups/  -- D1 backups
skill-graph-full.json        -- Full graph backup
metrics-archive/             -- Historical metrics
```

---

## Cost Breakdown (Your 5 Workers)

| Resource | Cost |
|----------|------|
| **5 Workers** | $0.50/M requests (you pay fixed fee) |
| D1 Database | $0.75/GB over 25GB (you'll use <1GB) |
| KV Storage | $0.50/GB/mo over 25 namespaces (you'll use <100MB) |
| R2 Storage | $0.015/GB (optional backups) |
| Durable Objects | $0.15/GB/mo (optional, for queue) |
| **Total** | **$0-10/month** (all fits in your paid plan) |

**What you're getting:**
- 5 dedicated workers
- Unlimited API calls between workers
- Global CDN caching
- 99.99% uptime SLA
- Custom domain routing
- All included in your fixed fee

---

## Scaling Strategy

As usage grows:
- Worker 1 (Personal): Scales automatically (stateless)
- Worker 2 (Router): Caches skill graph (low CPU)
- Worker 3 (Skill Graph): Mostly cache hits (fast)
- Worker 4 (Monitor): Lightweight probing (low cost)
- Worker 5 (Webhooks): Queues to KV (handles spikes)

None of these should hit rate limits if implemented efficiently.

---

## Next Steps

1. **NOW:** Deploy Worker 1 (Personal Assistant) — 10 min setup
2. **This week:** Deploy Worker 2 (Agency Router) using skill graph
3. **This week:** Deploy Worker 3 (Skill Graph Loader) with D1
4. **Next:** Deploy Worker 4 (Monitoring) and Worker 5 (Webhooks)

Want me to build Worker 2 next? 👊
