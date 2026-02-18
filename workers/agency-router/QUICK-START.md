# Agency Router Quick Start

Get the Agency Router Worker running in 5 minutes.

## Setup (2 minutes)

```bash
cd workers/agency-router
npm install
```

## Development (1 minute)

```bash
npm run dev
# Opens at http://localhost:8787
```

## Test (1 minute)

```bash
# Simple routing test
curl -X POST http://localhost:8787/api/route \
  -H "Content-Type: application/json" \
  -d '{"message": "Implement a REST API endpoint"}'

# Response:
{
  "agent": "codegen",
  "confidence": 0.92,
  "reason": "Keywords: implement, api matched CodeGen agent",
  "skillFilesUsed": ["agent-codegen"],
  "estimatedCost": 2.50,
  "complexity": "moderate",
  "latency": 12.34,
  "cached": false
}
```

## Deploy (1 minute)

```bash
npm run deploy           # Deploy to staging
npm run deploy:prod      # Deploy to production
```

## API Examples

### Route a Message
```bash
curl -X POST http://localhost:8787/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Design a microservices architecture",
    "userId": "user-123"
  }'
```

### Analyze Without Routing
```bash
curl -X POST http://localhost:8787/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"message": "Fix the bug in authentication"}'
```

### View Stats
```bash
curl http://localhost:8787/api/routing-stats
```

### Get All Agents
```bash
curl http://localhost:8787/api/agents
```

### Health Check
```bash
curl http://localhost:8787/health
```

## Key Agents

| Agent | Best For | Example |
|-------|----------|---------|
| **codegen** | Code implementation, debugging | "Implement a login function" |
| **planning** | Project planning, strategy | "Create a project roadmap" |
| **security** | Security analysis, compliance | "Penetration test the API" |
| **infrastructure** | DevOps, deployment, scaling | "Deploy to Kubernetes" |

## Sample Test Messages

```bash
# CodeGen (should route to: codegen)
"I need to implement a REST API with error handling"

# Planning (should route to: planning)
"Create a project plan with milestones and timeline"

# Security (should route to: security)
"Perform a penetration test and identify vulnerabilities"

# Infrastructure (should route to: infrastructure)
"Set up Kubernetes cluster with CI/CD pipeline"
```

## Performance Targets

- Latency: <50ms p50, <100ms p95
- Cache Hit Rate: 50%+ (after warm-up)
- Routing Accuracy: 85%+

## Running Tests

```bash
npm test                # All tests
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests only
```

## Environment Variables

```bash
# Cloudflare bindings (configured in wrangler.toml)
SKILL_GRAPH_DB=skill-graph      # D1 database
ROUTING_CACHE=routing-cache     # KV namespace
AUDIT_LOG=audit-logs            # KV namespace
```

## Troubleshooting

### Worker won't start
```bash
npm install
npm run build
npm run dev
```

### Tests failing
```bash
npm test -- --reporter=verbose
```

### High latency
- Check if using local D1 or remote
- Reduce keyword set size
- Enable KV caching

## Next Steps

1. ✅ Local development running
2. Deploy to staging: `npm run deploy`
3. Integrate with Personal Assistant Worker
4. Setup audit log cleanup jobs
5. Configure monitoring alerts

## Files Overview

- `src/index.ts` - Main Hono app + API endpoints
- `src/router-engine.ts` - Routing logic + agent definitions
- `src/keyword-matcher.ts` - 52+ keyword matching
- `src/complexity-classifier.ts` - Task complexity detection
- `src/cache.ts` - KV caching + audit logging
- `wrangler.toml` - Cloudflare configuration

## Key Features

✅ Intelligent routing (4 agents, 52+ keywords)
✅ Sub-100ms latency
✅ KV-based caching
✅ Complete audit trail
✅ Cost estimation
✅ Complexity detection
✅ Fallback logic
✅ Production-ready

## Get Help

- See `README.md` for complete API documentation
- See `DEPLOYMENT.md` for production deployment
- Check `src/**/*.test.ts` for usage examples

---

Built with ❤️ for OpenClaw Agency Platform
