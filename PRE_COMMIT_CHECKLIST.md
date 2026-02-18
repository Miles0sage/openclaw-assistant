# Pre-Commit Checklist — Before Pushing to GitHub

## ✅ Deployment Status

- [x] Personal Assistant Worker deployed
- [x] Agency Router Worker deployed
- [x] D1 database created (ID: 9cf10366-f49c-4532-89c2-8859e1ed9673)
- [x] KV namespaces created (CACHE + SESSIONS)
- [x] Secrets configured (ANTHROPIC_API_KEY, GATEWAY_TOKEN, GATEWAY_URL)
- [x] Chat endpoint working (tested)
- [x] Health checks passing

## ⏳ Before Commit: Complete These

### 1. **Custom Domain Routes** (5 min)
- [ ] Go to Cloudflare Dashboard
- [ ] Add route: `assistant.overseerclaw.uk/*` → personal-assistant worker
- [ ] Add route: `router.overseerclaw.uk/*` → agency-router worker
- [ ] Verify DNS records created automatically
- [ ] Test: `curl https://assistant.overseerclaw.uk/health`
- [ ] Test: `curl https://router.overseerclaw.uk/health`

### 2. **Test All Endpoints** (10 min)

**Personal Assistant:**
```bash
# Health
curl https://assistant.overseerclaw.uk/health

# Chat (session memory)
curl -X POST https://assistant.overseerclaw.uk/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What projects am I working on?","sessionKey":"test-session"}'

# Approval
curl -X POST https://assistant.overseerclaw.uk/api/approve \
  -H "Content-Type: application/json" \
  -d '{"taskId":"test","type":"code","description":"test","estimatedCost":5,"agentType":"CodeGen"}'

# Status
curl https://assistant.overseerclaw.uk/api/status
```

**Agency Router:**
```bash
# Health
curl https://router.overseerclaw.uk/health

# Routing
curl -X POST https://router.overseerclaw.uk/api/route \
  -H "Content-Type: application/json" \
  -d '{"message":"Implement REST API","channel":"slack"}'

# Stats
curl https://router.overseerclaw.uk/api/routing-stats
```

### 3. **Session Persistence Test** (5 min)

```bash
# First message
curl -X POST https://assistant.overseerclaw.uk/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Remember: I work on OpenClaw","sessionKey":"test-session"}'

# Second message (should remember context)
curl -X POST https://assistant.overseerclaw.uk/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What did I just tell you?","sessionKey":"test-session"}'

# Verify response includes context from first message
```

### 4. **Database Initialization** (2 min)

```bash
# Initialize D1 schema (if not already done)
curl -X POST https://assistant.overseerclaw.uk/setup

# Verify tables created
wrangler d1 execute personal-assistant --remote "SELECT name FROM sqlite_master WHERE type='table';"
```

### 5. **File Organization** (5 min)

- [ ] All source code in place
  - [x] workers/personal-assistant/ (complete)
  - [x] workers/agency-router/ (complete)
  - [x] routing-knowledge/ (15 markdown files)
- [ ] All docs updated
  - [x] CLOUDFLARE_DEPLOY.md
  - [x] CLOUDFLARE_5WORKERS_STRATEGY.md
  - [x] CLOUDFLARE_CUSTOM_DOMAIN.md
  - [x] README.md (update if needed)
- [ ] .gitignore set up correctly
  ```
  dist/
  node_modules/
  .wrangler/
  .dev.vars
  *.log
  .env
  wrangler.lock
  ```

### 6. **Security Check** (5 min)

- [ ] NO secrets in wrangler.toml (use `wrangler secret put`)
- [ ] NO API keys in source code
- [ ] NO .env files committed
- [ ] NO database IDs in comments (they're in toml, which is ok)
- [ ] Review wrangler.toml files:
  ```bash
  grep -r "ANTHROPIC_API_KEY\|moltbot-secure-token\|https://telegram" workers/ || echo "✅ No secrets found"
  ```

### 7. **Git Status Check** (2 min)

```bash
cd /root/openclaw-assistant

# Check what will be committed
git status

# See diff
git diff --stat

# Should NOT include:
# - node_modules/
# - dist/ (unless needed)
# - .wrangler/
# - Any .env files
# - wrangler.lock
```

### 8. **Update Repo Metadata** (3 min)

- [ ] Update README.md with deployment status
  ```markdown
  ## Status

  - ✅ Personal Assistant Worker (D1 + KV)
  - ✅ Agency Router Worker (intelligent routing)
  - ✅ Skill Graph (15 markdown files)
  - ✅ Custom domains configured
  - ✅ Secrets in Cloudflare (not in repo)

  ## Deployment

  Personal Assistant: https://assistant.overseerclaw.uk
  Agency Router: https://router.overseerclaw.uk
  ```

- [ ] Add commit message template:
  ```
  feat: Deploy Personal Assistant + Agency Router to Cloudflare Workers

  - Personal Assistant Worker with D1 session storage + KV caching
  - Agency Router Worker with 52+ keyword intelligent routing
  - OpenClaw skill graph (15 markdown files)
  - Custom domain routes (assistant.overseerclaw.uk, router.overseerclaw.uk)
  - All secrets managed in Cloudflare (not in repo)

  Deployment Status:
  - ✅ Health checks passing
  - ✅ Chat endpoint working with session memory
  - ✅ Approval system ready
  - ✅ Routing engine operational
  ```

### 9. **CI/CD Check** (Optional, 5 min)

- [ ] GitHub Actions workflow (if you want auto-deploy)
  - Create `.github/workflows/deploy.yml`
  - Set secrets: CLOUDFLARE_API_TOKEN
  - Auto-deploy on push to main

### 10. **Final Verification** (5 min)

```bash
# From /root/openclaw-assistant/

# 1. List files to be committed
git add -A
git diff --cached --stat

# 2. Count lines of code
find workers/routing-knowledge -name "*.md" -o -name "*.ts" -o -name "*.toml" | wc -l

# 3. Verify no secrets
git diff --cached | grep -i "anthropic\|token\|secret" && echo "❌ SECRETS FOUND!" || echo "✅ No secrets in diff"

# 4. Quick syntax check
find workers -name "*.ts" -exec node -c {} \; 2>&1 | head -5

# 5. wrangler.toml validation
wrangler deploy --dry-run --name personal-assistant 2>&1 | tail -10
```

## 🚀 Ready to Commit?

When all above are checked:

```bash
cd /root/openclaw-assistant

# Stage all files
git add -A

# Verify what's being committed
git diff --cached --stat

# Commit
git commit -m "feat: Deploy Personal Assistant + Agency Router to Cloudflare Workers

- Personal Assistant Worker with D1 session storage + KV caching
- Agency Router Worker with 52+ keyword intelligent routing
- OpenClaw skill graph (15 markdown files)
- Custom domain routes configured
- All secrets securely stored in Cloudflare

Deployed to:
- https://assistant.overseerclaw.uk (Personal Assistant)
- https://router.overseerclaw.uk (Agency Router)
"

# Push
git push origin main
```

## What NOT to Commit

❌ `node_modules/` — Use npm install on deployment
❌ `dist/` — Build on deployment
❌ `.wrangler/` — Local build artifacts
❌ `.env` — Local environment variables
❌ `wrangler.lock` — Lock file
❌ Secrets/API keys — Use Cloudflare secret manager
❌ Database IDs in code — Keep in wrangler.toml only

## What TO Commit

✅ `workers/*/src/*.ts` — Source code
✅ `workers/*/wrangler.toml` — Config (NO SECRETS)
✅ `workers/*/package.json` — Dependencies
✅ `routing-knowledge/*.md` — Skill graph
✅ Documentation (*.md files)
✅ `.gitignore` — Git rules
✅ `README.md` — Project overview

---

## Timeline

- ⏳ **Immediate** (before commit): Custom domain routes + endpoint tests
- ⏳ **5 minutes**: File organization + security check
- ⏳ **2 minutes**: Final verification + commit
- ✅ **Done**: Pushed to GitHub

**Start with step 1 (Custom Domains)** and work through the list. Let me know when you're ready to commit! 👊
