# Agency Router Deployment Guide

Complete step-by-step guide for deploying Agency Router Worker to Cloudflare.

## Prerequisites

- Cloudflare account (Enterprise recommended for optimal performance)
- Wrangler CLI 3.28+
- Node.js 18+
- Access to D1 and KV namespaces

## Step 1: Install Dependencies

```bash
cd workers/agency-router
npm install
```

## Step 2: Create Cloudflare Resources

### D1 Database

```bash
# Create the skill graph database
wrangler d1 create skill-graph --remote

# Note the database ID from output (save for wrangler.toml)
```

### KV Namespaces

```bash
# Create routing cache namespace
wrangler kv:namespace create routing-cache --remote

# Create audit log namespace
wrangler kv:namespace create audit-logs --remote

# Note the namespace IDs for wrangler.toml
```

## Step 3: Update Configuration

Edit `wrangler.toml` with your resource IDs:

```toml
[[d1_databases]]
binding = "SKILL_GRAPH_DB"
database_name = "skill-graph"
database_id = "YOUR_DB_ID_HERE"

[[kv_namespaces]]
binding = "ROUTING_CACHE"
id = "YOUR_KV_ID_HERE"

[[kv_namespaces]]
binding = "AUDIT_LOG"
id = "YOUR_AUDIT_LOG_ID_HERE"
```

## Step 4: Initialize D1 Schema

```bash
# Create tables
wrangler d1 execute skill-graph --file=./schema.sql --remote
```

Or create the schema file first (`schema.sql`):

```sql
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  keywords JSON,
  domains JSON,
  cost_per_token REAL,
  max_tokens INTEGER,
  enabled BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS skill_files (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  agent TEXT NOT NULL,
  description TEXT,
  keywords JSON,
  FOREIGN KEY (agent) REFERENCES agents(id)
);

CREATE TABLE IF NOT EXISTS routing_audit_log (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  message_hash TEXT NOT NULL,
  message TEXT,
  agent TEXT NOT NULL,
  confidence REAL,
  complexity TEXT,
  estimated_cost REAL,
  cached BOOLEAN,
  latency REAL,
  user_id TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_timestamp (timestamp),
  INDEX idx_agent (agent),
  INDEX idx_user_id (user_id)
);

-- Insert default agents
INSERT OR IGNORE INTO agents (id, name, description, keywords, domains, cost_per_token, max_tokens, enabled)
VALUES
  ('codegen', 'Code Generation Agent', 'Expert in code implementation, debugging, and testing', '["implement", "build", "code", "debug", "test"]', '["javascript", "typescript", "python"]', 0.003, 4000, 1),
  ('planning', 'Planning & Strategy Agent', 'Expert in project planning, roadmapping, and strategic thinking', '["plan", "strategy", "roadmap", "design"]', '["project management"]', 0.002, 8000, 1),
  ('security', 'Security & Compliance Agent', 'Expert in security analysis, threat modeling, and compliance', '["security", "vulnerability", "penetration", "compliance"]', '["security"]', 0.004, 6000, 1),
  ('infrastructure', 'Infrastructure & DevOps Agent', 'Expert in infrastructure, deployment, and operations', '["infrastructure", "deploy", "kubernetes", "docker"]', '["cloud", "devops"]', 0.003, 5000, 1);
```

## Step 5: Build and Test Locally

```bash
# Development server
npm run dev

# The worker will be available at http://localhost:8787

# Test the health endpoint
curl http://localhost:8787/health

# Test routing
curl -X POST http://localhost:8787/api/route \
  -H "Content-Type: application/json" \
  -d '{"message": "I need to implement a REST API endpoint"}'
```

## Step 6: Run Tests

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run all tests
npm test
```

Ensure all tests pass before deploying to production.

## Step 7: Deploy to Staging

```bash
# Deploy to staging environment
npm run deploy

# Verify staging deployment
curl https://agency-router.ACCOUNT.workers.dev/health
```

## Step 8: Deploy to Production

```bash
# Deploy to production
npm run deploy:prod

# Verify production deployment
curl https://agency-router-prod.ACCOUNT.workers.dev/health
```

## Step 9: Monitor and Verify

### Check Logs

```bash
# Stream logs from production
wrangler tail --env production

# View recent logs
wrangler logs --env production
```

### Test Endpoints

```bash
# Health check
curl https://agency-router.ACCOUNT.workers.dev/health

# Route a message
curl -X POST https://agency-router.ACCOUNT.workers.dev/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Implement a React component with TypeScript",
    "userId": "test-user"
  }'

# Get routing stats
curl https://agency-router.ACCOUNT.workers.dev/api/routing-stats

# Get agents
curl https://agency-router.ACCOUNT.workers.dev/api/agents
```

### Monitor Performance

```bash
# View D1 query statistics
wrangler d1 insights skill-graph --env production

# View KV performance
# Available in Cloudflare Dashboard > Workers > agency-router > KV Namespaces
```

## Step 10: Setup Custom Domain (Optional)

```bash
# Route custom domain to worker
wrangler publish --name agency-router

# Update DNS in Cloudflare Dashboard:
# Add route: agency.yourdomain.com -> agency-router
```

## Monitoring and Maintenance

### Daily Tasks

- Check error rates: `wrangler tail --env production`
- Monitor latency: Check analytics dashboard
- Verify cache hit rate: `GET /api/routing-stats`

### Weekly Tasks

- Review audit logs for unusual routing patterns
- Update agent keywords if needed
- Check D1 storage usage
- Clean up old audit logs (>30 days)

### Monthly Tasks

- Review routing accuracy metrics
- Optimize keyword definitions
- Update skill files as needed
- Performance optimization review

## Troubleshooting

### Worker Not Responding

```bash
# Check worker status
wrangler deployments list

# Check recent logs
wrangler tail --format pretty

# Redeploy
npm run deploy:prod
```

### High Latency

1. Check D1 performance
2. Check KV cache hit rate
3. Reduce message complexity threshold
4. Add more worker instances

### Database Connection Issues

```bash
# Test D1 connection
wrangler d1 execute skill-graph --command "SELECT COUNT(*) FROM agents;"

# Check database status
wrangler d1 info skill-graph
```

### Memory Issues

- Reduce batch size in `/api/analyze`
- Enable KV caching
- Optimize keyword matching algorithm

## Rollback Procedure

```bash
# List deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback

# Or deploy specific commit
git checkout PREVIOUS_COMMIT_HASH
npm run deploy:prod
```

## Performance Optimization

### Database Optimization

```sql
-- Analyze query performance
EXPLAIN QUERY PLAN
SELECT * FROM routing_audit_log WHERE agent = 'codegen' ORDER BY timestamp DESC;

-- Vacuum to optimize storage
VACUUM;

-- Check index usage
PRAGMA index_list(routing_audit_log);
```

### Caching Strategy

- TTL: 1 hour (3600 seconds)
- Strategy: Hash-based exact match
- Warm cache with common messages
- Monitor cache hit rate target: >60%

### Complexity Thresholds

- Simple: <3 keywords + <500 chars
- Moderate: 3-5 keywords + 500-1500 chars
- Complex: >5 keywords or >1500 chars

## Scaling Considerations

### Small Volume (<1K requests/day)
- 1 worker instance
- KV cache only
- D1 standard plan

### Medium Volume (1K-10K requests/day)
- 2-3 worker instances
- KV cache + D1
- D1 business plan

### High Volume (>10K requests/day)
- Auto-scaling 3-10 instances
- KV + D1 with read replicas
- D1 enterprise plan
- Consider Durable Objects for state

## Support and Debugging

### Enable Debug Logging

Edit `src/index.ts`:

```typescript
const DEBUG = true; // Enable debug logs

if (DEBUG) {
  console.log(`Routing message: ${message.substring(0, 50)}...`);
}
```

### Get Help

- Cloudflare Workers Documentation: https://developers.cloudflare.com/workers/
- D1 Troubleshooting: https://developers.cloudflare.com/d1/troubleshooting/
- GitHub Issues: https://github.com/cline/openclaw/issues

## Next Steps

1. Integrate with Personal Assistant Worker
2. Connect to Skill Graph Loader (Worker 3)
3. Setup analytics dashboard
4. Configure cost tracking
5. Enable advanced features (A/B testing, ML routing)
