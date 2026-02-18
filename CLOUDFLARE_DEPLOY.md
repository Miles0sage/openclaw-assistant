# Deploy Personal Assistant to Cloudflare Workers

## Quick Start (10 minutes)

### 1. **Install Wrangler**
```bash
npm install -g wrangler
wrangler login  # Sign in to your Cloudflare account
```

### 2. **Create D1 Database**
```bash
cd workers/personal-assistant
wrangler d1 create personal-assistant
# Copy the database_id to wrangler.toml
```

### 3. **Create KV Namespaces**
```bash
wrangler kv:namespace create KV_CACHE
wrangler kv:namespace create KV_SESSIONS

# For production:
wrangler kv:namespace create KV_CACHE --preview false
wrangler kv:namespace create KV_SESSIONS --preview false
```

Copy the IDs to `wrangler.toml`

### 4. **Set Environment Variables**
```bash
wrangler secret put ANTHROPIC_API_KEY
# Paste your Anthropic API key, press Ctrl+D

wrangler secret put AGENCY_GATEWAY_TOKEN
# Paste your agency gateway token

wrangler secret put AGENCY_GATEWAY_URL
# Paste your agency gateway URL (e.g., https://agency.your-domain.com)
```

### 5. **Build & Deploy**
```bash
npm install
npm run build
wrangler deploy
```

Output: `Deployed to https://personal-assistant.your-domain.com`

### 6. **Initialize Database**
```bash
curl -X POST https://personal-assistant.your-domain.com/setup
# Response: {"success": true, "message": "Database initialized"}
```

---

## Architecture

```
User/Agency
    ↓
Cloudflare Worker (personal-assistant)
    ├─ D1 Database (personal context, approvals, sessions)
    ├─ KV Cache (sessions, stats)
    └─ Anthropic Claude Opus (approval decisions)
    ↓
Agency Gateway (your VPS)
```

---

## API Endpoints

### **POST /api/approve**
Agency asks for task approval
```bash
curl -X POST https://personal-assistant.your-domain.com/api/approve \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task-123",
    "type": "code",
    "description": "Implement new feature X",
    "estimatedCost": 5.50,
    "agentType": "CodeGen"
  }'
```

**Response:**
```json
{
  "approved": true,
  "reason": "Within budget and aligned with goals",
  "constraints": {"maxDuration": "2 hours"},
  "monitoringLevel": "basic",
  "costLimit": 10
}
```

### **POST /api/halt**
Stop a running task immediately
```bash
curl -X POST https://personal-assistant.your-domain.com/api/halt \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task-123",
    "reason": "Cost exceeded budget"
  }'
```

### **POST /api/chat**
Chat with personal assistant (with memory)
```bash
curl -X POST https://personal-assistant.your-domain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What's the status of my projects?",
    "sessionKey": "user:miles:2026-02-18"
  }'
```

### **GET /health**
Health check
```bash
curl https://personal-assistant.your-domain.com/health
```

### **GET /api/status**
Monitoring dashboard (JSON)
```bash
curl https://personal-assistant.your-domain.com/api/status
```

---

## Pricing Breakdown (Your 5 Paid Workers)

| Resource | Free Tier | Your Cost |
|----------|-----------|-----------|
| **Workers** | 100K requests/day | $0.50/M requests (you're paying for 5) |
| **D1** | 25GB free | $0.75/GB over (personal = <1GB) |
| **KV** | 25 namespaces free | $0.50/GB/mo (you're using <100MB) |
| **R2** | — | Pay-as-you-go ($0.015/GB) |
| **Durable Objects** | — | Optional, $0.15/GB/mo |

**Total Personal Assistant Cost:** $0-5/month (all free tier)

**What You're Already Paying For:**
- 5 Worker slots: ~$50-150/month depending on requests
- Custom domain: ~$5-10/month
- **Total infrastructure:** ~$50-160/month

---

## Features

✅ **Approval System** — Tasks routed through personal assistant
✅ **Cost Control** — Daily budgets + per-task thresholds
✅ **Multi-turn Chat** — Conversation memory via KV (30-day history)
✅ **Halt Signals** — Stop running tasks immediately
✅ **Claude Opus Decisions** — Intelligent approval reasoning
✅ **Audit Trail** — All approvals logged to D1
✅ **Session Persistence** — Context survives worker restarts
✅ **Status Dashboard** — Real-time stats (JSON API)

---

## Integration with Agency Gateway

In your agency gateway code, add before running tasks:

```python
# Example: Python FastAPI

@app.post("/api/run-task")
async def run_task(task: Task):
    # Check with personal assistant first
    response = await http_client.post(
        "https://personal-assistant.your-domain.com/api/approve",
        json={
            "taskId": task.id,
            "type": task.type,
            "description": task.description,
            "estimatedCost": estimate_cost(task),
            "agentType": task.agent_type
        },
        headers={"Authorization": f"Bearer {PERSONAL_ASSISTANT_TOKEN}"}
    )

    approval = response.json()

    if not approval["approved"]:
        return {"error": approval["reason"]}, 403

    # Apply constraints if any
    if approval.get("constraints"):
        task = apply_constraints(task, approval["constraints"])

    # Run task with monitoring level
    monitoring_level = approval.get("monitoringLevel", "basic")
    result = await run_agent(task, monitoring_level=monitoring_level)

    return result
```

---

## Customization

### Change Personal Preferences
Edit `DEFAULT_PERSONAL_CONTEXT` in `src/index.ts`:
- `budgetLimit` — Daily API spend limit
- `costThreshold` — When to require human approval
- `riskTolerance` — "conservative" | "balanced" | "aggressive"
- `blockedOperations` — Forbidden tasks
- `requiresHumanApproval` — High-risk operations

### Add Custom Rules
```typescript
context.rules.requiresHumanApproval = [
  "large_external_calls",
  "data_deletion",
  "permission_changes",
  "your_custom_rule"
];
```

### Change Approval Logic
Modify the Claude system prompt in `/api/approve` to add custom decision criteria.

---

## Monitoring

### View Logs
```bash
wrangler tail  # Real-time logs
```

### Check Database
```bash
wrangler d1 execute personal-assistant --remote \
  "SELECT * FROM approvals WHERE DATE(created_at) = DATE('now')"
```

### Check KV
```bash
wrangler kv:key list --namespace-id YOUR_KV_ID
```

---

## Troubleshooting

### "Database not found"
```bash
wrangler d1 create personal-assistant
# Copy database_id to wrangler.toml
wrangler deploy
```

### "KV namespace not found"
```bash
wrangler kv:namespace create KV_CACHE
wrangler kv:namespace create KV_SESSIONS
# Copy IDs to wrangler.toml
```

### "Anthropic API key invalid"
```bash
wrangler secret put ANTHROPIC_API_KEY
# Re-enter your valid API key
```

### "Agency gateway unreachable"
Check:
1. `AGENCY_GATEWAY_URL` is correct
2. `AGENCY_GATEWAY_TOKEN` matches agency gateway config
3. Agency gateway is running and public

### Logs show timeout errors
Increase `cpu_ms` in `wrangler.toml`:
```toml
[limits]
cpu_ms = 50000  # Increase to 100000 if needed
```

---

## Next Steps

1. ✅ Deploy Personal Assistant Worker (this guide)
2. Integrate with Agency Gateway (add approval checks)
3. Add Skill Graph Routing (use `/openclaw-assistant/routing-knowledge/`)
4. Setup Telegram/Discord bots for direct personal assistant access
5. Build monitoring dashboard (Grafana + Cloudflare analytics)

---

## Cost Summary (Monthly)

| Item | Cost |
|------|------|
| Workers (5 paid) | $50-150 |
| Domain | $5-10 |
| D1 (personal assistant) | $0 |
| KV (personal assistant) | $0 |
| Anthropic API (approval calls) | ~$2-5 |
| **Total** | **~$60-170/mo** |

(Everything fits in your existing 5 paid Workers + free tier resources)

---

## Production Checklist

- [ ] Database initialized (`/setup` endpoint called)
- [ ] All secrets set (ANTHROPIC_API_KEY, AGENCY_GATEWAY_TOKEN, etc.)
- [ ] KV namespaces created and linked
- [ ] Custom domain configured (optional)
- [ ] Health check passes (`/health` endpoint)
- [ ] Agency gateway integrated (calls `/api/approve` before tasks)
- [ ] Monitoring dashboard setup (`/api/status` endpoint)
- [ ] Logs configured (wrangler tail working)
- [ ] Backup plan for D1 data (export regularly)
