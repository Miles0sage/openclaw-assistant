# Custom Domain Setup for overseerclaw.uk

## Workers Deployed

```
Personal Assistant: https://personal-assistant.amit-shah-5201.workers.dev
Agency Router:      https://agency-router.amit-shah-5201.workers.dev
```

## Custom Domain Routing (overseerclaw.uk)

### Option 1: Use Subdomains (Recommended)

```
https://assistant.overseerclaw.uk     → Personal Assistant Worker
https://router.overseerclaw.uk         → Agency Router Worker
https://telegram.overseerclaw.uk       → Existing (your agency gateway)
```

### Option 2: Use Paths (Same Domain)

```
https://overseerclaw.uk/assistant/*    → Personal Assistant Worker
https://overseerclaw.uk/router/*       → Agency Router Worker
https://overseerclaw.uk/telegram/*     → Existing (your agency gateway)
```

---

## Setup Steps (Cloudflare Dashboard)

### 1. Add Worker Route for Personal Assistant

Go to: **Cloudflare Dashboard → Workers & Pages → personal-assistant → Triggers → Routes**

Click **Add Route**:
- **Route:** `assistant.overseerclaw.uk/*`
- **Zone:** overseerclaw.uk
- **Click Save**

### 2. Add Worker Route for Agency Router

Go to: **Cloudflare Dashboard → Workers & Pages → agency-router → Triggers → Routes**

Click **Add Route**:
- **Route:** `router.overseerclaw.uk/*`
- **Zone:** overseerclaw.uk
- **Click Save**

### 3. Verify DNS Records

Make sure these DNS records exist in Cloudflare:
```
Name: assistant
Type: CNAME
Target: personal-assistant.amit-shah-5201.workers.dev

Name: router
Type: CNAME
Target: agency-router.amit-shah-5201.workers.dev
```

(Cloudflare usually adds these automatically)

---

## Test Custom Domains

```bash
# Test Personal Assistant
curl https://assistant.overseerclaw.uk/health

# Test Agency Router
curl https://router.overseerclaw.uk/health

# Test chat on custom domain
curl -X POST https://assistant.overseerclaw.uk/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "sessionKey": "user:miles:session1"
  }'
```

---

## Update wrangler.toml (Optional)

To hardcode routes in config:

**workers/personal-assistant/wrangler.toml:**
```toml
[env.production]
name = "personal-assistant-prod"
routes = [
  { pattern = "assistant.overseerclaw.uk/*", zone_name = "overseerclaw.uk" }
]
```

**workers/agency-router/wrangler.toml:**
```toml
[env.production]
name = "agency-router-prod"
routes = [
  { pattern = "router.overseerclaw.uk/*", zone_name = "overseerclaw.uk" }
]
```

Then deploy:
```bash
wrangler deploy --env production
```

---

## Architecture After Custom Domain Setup

```
User Request
    ↓
https://assistant.overseerclaw.uk  →  Personal Assistant Worker
                                        ├─ D1 (personal context)
                                        ├─ KV (sessions, cache)
                                        └─ Anthropic (Claude Opus)

https://router.overseerclaw.uk     →  Agency Router Worker
                                        ├─ Skill graph routing
                                        └─ Agent selection

https://telegram.overseerclaw.uk   →  Existing Agency Gateway (VPS)
                                        ├─ 3 Agents (PM, CodeGen, Security)
                                        └─ Telegram integration
```

---

## What to Test Before Committing

✅ Personal Assistant health: `curl https://assistant.overseerclaw.uk/health`
✅ Agency Router health: `curl https://router.overseerclaw.uk/health`
✅ Chat endpoint: `POST /api/chat` with session key
✅ Approval endpoint: `POST /api/approve` with task details
✅ Routing endpoint: `POST /api/route` with message
✅ Session persistence: Send message, verify it's stored in KV
✅ D1 database: Tables created and accessible

---

## Files to Commit

Before pushing to GitHub:

```
/root/openclaw-assistant/
├── workers/
│   ├── personal-assistant/
│   │   ├── wrangler.toml (WITH D1 + KV IDs)
│   │   ├── package.json
│   │   └── src/
│   │       └── index.ts
│   └── agency-router/
│       ├── wrangler.toml
│       ├── package.json
│       └── src/
│           ├── index.ts
│           ├── router-engine.ts
│           ├── keyword-matcher.ts
│           ├── complexity-classifier.ts
│           └── cache.ts
├── routing-knowledge/ (15 markdown files)
├── CLOUDFLARE_DEPLOY.md
├── CLOUDFLARE_5WORKERS_STRATEGY.md
└── CLOUDFLARE_CUSTOM_DOMAIN.md (THIS FILE)

.gitignore additions:
├── dist/
├── node_modules/
├── .wrangler/
├── .dev.vars
└── *.log
```

---

## Secrets Already Set

✅ ANTHROPIC_API_KEY
✅ AGENCY_GATEWAY_TOKEN
✅ AGENCY_GATEWAY_URL

(These are in Cloudflare, NOT in GitHub - NEVER commit secrets!)

---

## Next Steps

1. ✅ **D1 + KV Setup** — DONE
2. ✅ **Workers Deployed** — DONE
3. ✅ **Secrets Configured** — DONE
4. ⏳ **Custom Domain Routes** — Add via dashboard
5. ⏳ **Test All Endpoints** — Run test suite
6. ⏳ **Commit to GitHub** — Stage files
7. ⏳ **Push to Production** — GitHub → Auto-deploy (if CI/CD set up)

---

## Troubleshooting

### Custom domain not working?

**Check:**
1. DNS records added in Cloudflare
2. Routes added to Workers
3. Firewall rules (should allow *.overseerclaw.uk)
4. SSL certificate (should auto-issue)
5. Try `curl -v` to see full response

### Sessions not persisting?

**Check:**
1. KV namespace is linked in wrangler.toml
2. D1 database is linked in wrangler.toml
3. Secrets are set (ANTHROPIC_API_KEY, etc.)
4. Check worker logs: `wrangler tail --name personal-assistant`

### D1 queries failing?

**Check:**
1. Database is created: `wrangler d1 info personal-assistant`
2. Schema is initialized: Call `/setup` endpoint first
3. Tables exist: Query should return data
4. Logs for errors: `wrangler tail --name personal-assistant --format pretty`

---

## Cost Estimate (Monthly)

| Resource | Cost |
|----------|------|
| 5 Workers (your plan) | $50-150 |
| D1 Database | $0 (free tier, <25GB) |
| KV Namespaces | $0 (free tier, <25 total) |
| Custom domain | $0 (already owned) |
| Anthropic API | ~$5-10 (approval calls) |
| **Total** | **~$55-160/mo** |

(All within your existing 5-worker subscription)
