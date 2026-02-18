# Deploy OpenClaw Assistant to Northflank

## Quick Start (2 minutes)

### 1. **Northflank Dashboard**

- Go to https://northflank.com/dashboard
- Click **New Project** (or use existing "Overseer-Openclaw")
- Click **New Service**
- Select **GitHub Repository**
- Connect repo: `Miles0sage/openclaw-assistant`
- Branch: `main`
- Build pack: **Node.js** (auto-detect)

### 2. **Environment Variables**

Add these secrets in Northflank:

```
ANTHROPIC_API_KEY=<your-key>
GATEWAY_TOKEN=<random-uuid>
TELEGRAM_BOT_TOKEN=<optional>
```

### 3. **Build Settings**

- Build command: `pnpm install && pnpm build`
- Start command: `pnpm openclaw gateway run --bind 0.0.0.0 --port 18789 --loglevel info`
- Port: **18789**
- Memory: **512Mi**
- CPU: **250m**

### 4. **Health Check**

- Path: `/health`
- Port: `18789`
- Interval: `30s`

### 5. **Deploy**

- Click Deploy
- Wait ~5 min for build + start
- Get public URL from Northflank (e.g., `https://openclaw-assistant-xxx.northflank.app`)

---

## What You Get

✅ **Native OpenClaw Gateway** — Full multi-channel AI agent platform
✅ **Personal Assistant Setup** — Configured with Claude Opus
✅ **Telegram Integration** — Ready to connect bot
✅ **Session Memory** — Persistent context across messages
✅ **Auto-scaling** — 1-3 instances based on load

---

## After Deployment

### Connect Telegram Bot

```bash
export GATEWAY_URL=https://your-service.northflank.app
export GATEWAY_TOKEN=<token-from-northflank>
export TELEGRAM_BOT_TOKEN=<your-bot-token>

pnpm openclaw telegram pair --gateway-url $GATEWAY_URL --gateway-token $GATEWAY_TOKEN
```

### Test Gateway Health

```bash
curl https://your-service.northflank.app/health
```

### Next: Add Personal Assistant Logic

Once the native OpenClaw is running, we'll add:

1. **Approval System** — Personal assistant approves agency tasks
2. **Kimi Integration** — Deepseek models for cost savings
3. **Monitoring Dashboard** — Real-time task tracking
4. **Halt Signals** — Stop running tasks immediately

---

## Troubleshooting

### Build Fails

- Check logs: Northflank dashboard → Service → Logs
- Ensure `pnpm-lock.yaml` exists (it does)
- Node 22+ required

### Gateway won't start

- Check health check is at `/health` not root
- Verify `PORT=18789` env var set
- Look for "listening on port 18789" in logs

### Need to restart

- Northflank dashboard → Service → Restart

---

## Cost Estimate

- **Build:** ~2 min × $0.0005/min = ~$0.001
- **Running:** 512Mi × $0.05/Gi/hr = ~$0.03/hr ≈ $25/mo
- **Bandwidth:** ~$0.10/GB (minimal for personal use)
- **Total:** ~$30-40/month

(Way cheaper than running locally + Ngrok)
