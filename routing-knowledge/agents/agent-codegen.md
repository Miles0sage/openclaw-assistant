---
title: "CodeGen Agent (Implementation Specialist)"
description: "Implements features, debugs code, tests, optimizes, and handles database queries"
keywords: ["implementation", "debugging", "testing", "deployment", "coding", "refactoring", "optimization"]
aliases: ["coder-agent", "codegen-pro", "development-agent"]
type: "claim"
model: "Ollama Qwen 32B"
agentId: "coder_agent"
complexity: "moderate"
relatedAgents: ["pm", "security"]
relatedChannels: ["slack", "discord", "telegram", "web"]
---

# CodeGen Agent — Implementation Specialist

## Role

The CodeGen Agent (codenamed "CodeGen Pro") specializes in **code implementation, debugging, testing, deployment, and optimization**. It is the primary agent for converting designs into working code and handling all development-related tasks.

**Model:** Ollama Qwen 32B (32B parameter LLM)
**Availability:** High throughput, quick responses
**Response time:** Fast (optimized for iterative development)

---

## Primary Responsibilities

### 1. Code Implementation
Writing production-ready code across the stack:
- Building APIs (FastAPI, Node.js, TypeScript)
- Frontend development (React, Next.js, TypeScript)
- Database schema design (PostgreSQL, Supabase)
- Infrastructure as code (Docker, CI/CD)

**Example triggers:**
- "Implement OAuth2 authentication with JWT"
- "Build a React component for the dashboard"
- "Create a FastAPI endpoint for user management"
- "Write a database migration for the orders table"

### 2. Bug Fixing & Debugging
Identifying root causes and fixing issues:
- Analyzing error stacktraces
- Reproducing bugs in isolated environments
- Implementing targeted fixes
- Writing regression tests

**Example triggers:**
- "Fix this TypeError in the login flow"
- "Debug why the database query times out"
- "This API endpoint returns 500; what's wrong?"
- "The WebSocket connection closes unexpectedly"

### 3. Testing & Quality Assurance
Ensuring code reliability:
- Writing unit tests (Vitest, Jest, Pytest)
- Integration tests (API contracts)
- End-to-end testing (Cypress, Playwright)
- Performance testing and optimization

**Example triggers:**
- "Write tests for this authentication module"
- "Can you verify this code passes all quality gates?"
- "Optimize this query; it's running slow"
- "What test coverage do we have?"

### 4. Refactoring & Code Cleanup
Improving code health:
- Removing technical debt
- Improving performance
- Enhancing readability
- Modernizing deprecated patterns

**Example triggers:**
- "Refactor this monolithic function into smaller pieces"
- "Modernize this old Promise-based code to async/await"
- "Clean up the build pipeline; it's fragile"

### 5. Deployment & DevOps
Managing production releases:
- Building Docker images
- Setting up CI/CD pipelines
- Configuring environments
- Managing secrets and credentials

**Example triggers:**
- "Deploy this to production"
- "Set up GitHub Actions for automated testing"
- "Configure Vercel for the Next.js app"
- "Help me containerize this service"

### 6. Database Operations
Querying and maintaining data:
- Writing SQL queries
- Optimizing performance
- Managing RLS (Row-Level Security) policies
- Real-time subscriptions

**Example triggers:**
- "What appointments are scheduled for tomorrow?"
- "Query the orders table for Q4 revenue"
- "Optimize this N+1 query"
- "Set up real-time subscription to the appointments table"

---

## Keyword Patterns

**Strong signals** (high confidence for CodeGen routing):

```
code, implement, function, fix, bug, api, endpoint, build, typescript,
fastapi, python, javascript, react, nextjs, database, query, schema,
testing, test, deploy, deployment, frontend, backend, full-stack,
refactor, refactoring, clean_code, git, repository, json, yaml, xml,
rest, graphql, websocket, docker, kubernetes, ci/cd, github, npm, pip
```

**Database-specific keywords:**
```
query, fetch, select, insert, update, delete, table, column, row, data,
supabase, postgresql, postgres, sql, database, appointments, clients,
services, transactions, orders, customers, call_logs, schema, rls,
subscription, real_time
```

**Confidence scoring:**
- Single implementation keyword: +0.4 to base score
- Technology mention (NextJS, FastAPI, etc.): +0.3
- "Fix" or "bug": +0.5
- Database keywords: +0.4 (unless complex multi-agent work)
- Multiple development keywords: +0.5

---

## Agent Skills (Claimed Expertise)

| Skill | Description |
|-------|-------------|
| **NextJS** | Full-stack React framework with SSR, API routes, deployment |
| **FastAPI** | Python async web framework for building APIs |
| **TypeScript** | Type-safe JavaScript for scale |
| **React** | Component-based UI library and patterns |
| **Tailwind CSS** | Utility-first CSS for rapid UI development |
| **PostgreSQL** | Relational database design and optimization |
| **Supabase** | PostgreSQL + real-time + auth + storage |
| **Clean Code** | Writing readable, maintainable, tested code |
| **Testing** | Unit, integration, E2E testing across frameworks |
| **Code Analysis** | PR review, static analysis, security scanning |
| **Function Calling** | Building tools for agents and API clients |
| **Git Automation** | Commit best practices, branching strategies |
| **Docker** | Containerization and deployment |
| **CI/CD** | Automated testing and deployment pipelines |

---

## Complexity Level

**Specialized for:** MODERATE to SIMPLE tasks

The CodeGen agent is optimized for:
- **Moderate:** Features, multi-file changes, integration work
- **Simple:** Bug fixes, data queries, small features

**Higher complexity tasks:**
- Complex architecture → escalate to [[agent-pm]]
- Security audits → escalate to [[agent-security]]
- Multi-team coordination → escalate to [[agent-pm]]

---

## Interaction Patterns

### Pattern 1: Direct Implementation Request
```
User (Slack):
"Implement a password reset flow using email verification"

CodeGen Response:
1. Clarify requirements (email provider, token expiry)
2. Propose implementation strategy
3. Write API endpoints (FastAPI or Node.js)
4. Write frontend form (React component)
5. Provide test cases
6. Suggest deployment checklist
```

### Pattern 2: Bug Fix with Root Cause Analysis
```
User (Discord):
"Our WebSocket connection keeps disconnecting.
Here's the error: 'ECONNRESET'"

CodeGen Response:
1. Ask for logs/reproduce steps
2. Analyze WebSocket library version
3. Identify root cause (timeout, server close, etc.)
4. Propose fix (keep-alive, reconnect logic)
5. Implement with tests
6. Verify in different environments
```

### Pattern 3: Database Query
```
User (Telegram):
"How many orders did we get in January?"

CodeGen Response:
1. Write SQL query (with date range)
2. Execute against Supabase
3. Return results (formatted)
4. Suggest optimization if needed
```

### Pattern 4: Escalation to PM
```
User (Slack):
"Redesign the entire API architecture"

CodeGen → PM (escalation):
"This is too big for implementation; needs planning.
Escalating for decomposition and timeline."

PM Response:
1. Plans phases (API v1 → v2 → deprecate v1)
2. Estimates timeline (8 weeks)
3. Routes implementation back to CodeGen (phase by phase)
```

---

## Channel Preferences

| Channel | Best Use | Context Leverage |
|---------|----------|------------------|
| **Slack** | Code reviews in threads | Full conversation history, inline code |
| **Discord** | Development team chat | Multiple channels per feature, rich embeds |
| **Telegram** | Quick bug fixes | Fast turnaround, minimal context |
| **Web UI** | Code upload/review forms | Structured workflows, session persistence |
| **GitHub** | PR review | Diffs, commit history, CI status |
| **Discord** | Live debugging sessions | Screen share, real-time feedback |

---

## Integration with Other Agents

### CodeGen + [[agent-pm]]
- **PM provides design** → **CodeGen implements**
- **CodeGen identifies issues** → **PM rescopes timeline**
- **CodeGen delivers code** → **PM validates against plan**

**Example workflow:**
```
PM: "Plan feature X: 2 weeks"
→ CodeGen: Implements based on plan
  Week 1: API endpoints
  Week 2: Frontend + testing
→ CodeGen: Discovers edge case requiring redesign
→ PM: Rescopes to 2.5 weeks, approves new approach
```

### CodeGen + [[agent-security]]
- **CodeGen writes code** → **Security audits**
- **Security finds issues** → **CodeGen fixes**
- **CodeGen implements security** → **Security verifies**

**Example workflow:**
```
CodeGen: Implements authentication
→ Security: Audits for CSRF, XSS, injection
→ Security: Recommends using SameSite cookie + CSRF token
→ CodeGen: Implements recommendations
→ Security: Re-verifies, approves for production
```

### CodeGen as Escalator
When CodeGen encounters complex requirements:
- **Unclear scope** → Escalate to PM for clarification
- **Security concerns** → Escalate to Security for review
- **Multi-agent coordination** → Escalate to PM for orchestration

---

## Fallback & Escalation

**When CodeGen is not appropriate:**
- Complex planning → Route to [[agent-pm]]
- Security audits → Route to [[agent-security]]
- Strategic architecture → Route to [[agent-pm]]

**When CodeGen should escalate:**
- Feature scope too large → Escalate to PM
- Security implications unclear → Escalate to Security
- Multi-system changes → Escalate to PM

---

## Quality Metrics

**What good CodeGen routing looks like:**
- ✅ Requests with "fix", "bug", "implement", "code" → CodeGen
- ✅ Database queries → CodeGen
- ✅ "Refactor" or "optimize" → CodeGen
- ✅ Test writing requests → CodeGen
- ✅ Deployment questions → CodeGen

**What bad routing looks like:**
- ❌ Strategic planning → CodeGen (should be PM)
- ❌ Security audits → CodeGen (should be Security)
- ❌ High-level architecture → CodeGen (should be PM)

---

## Context Awareness

The CodeGen agent benefits from:
- **Code context:** File paths, code snippets, Git history
- **Error context:** Stacktraces, logs, reproduction steps
- **Session history:** Previous fixes, similar bugs
- **Channel context:** Slack threads show full issue discussion
- **User expertise:** Is this a junior or senior developer?

See [[context-preservation]] for how to maintain context.

---

## Example Queries (High CodeGen Confidence)

| Query | Keywords | Confidence |
|-------|----------|-----------|
| "Fix this TypeError in login" | fix, TypeError, bug | 0.95 |
| "Implement OAuth2 with JWT" | implement, OAuth2, JWT | 0.92 |
| "Write tests for auth module" | write, tests, test | 0.88 |
| "Query orders for Q4" | query, orders | 0.85 |
| "Optimize this slow database query" | optimize, query, database | 0.90 |
| "Deploy to production" | deploy, production | 0.87 |
| "Refactor this monolithic function" | refactor | 0.80 |

---

## Implementation Notes

**For routing system:**
1. **High confidence signals:** "fix", "bug", "implement", "code", "deploy", "query"
2. **Confidence boost:** Technical keywords (NextJS, FastAPI, etc.)
3. **Confidence boost:** Database keywords for data queries
4. **Fallback:** If ambiguous scope, check for planning/security keywords
5. **Escalation:** CodeGen → PM on architecture/multi-team work

**For session management:**
- Preserve code snippets and error messages (context for debugging)
- Track previous fixes (avoid repeating mistakes)
- Link to related issues (help with similar bugs)

---

## Technology Stack (Supported)

**Frontend:**
- React, Next.js, TypeScript, Tailwind CSS
- Framer Motion, TanStack Query, Zustand
- Testing: Vitest, Jest, Cypress, Playwright

**Backend:**
- FastAPI (Python), Node.js/Express, TypeScript
- Database: PostgreSQL, Supabase
- Testing: Pytest, Vitest

**DevOps:**
- Docker, Kubernetes (basics)
- GitHub Actions, Vercel, Cloudflare Workers
- AWS, GCP, Azure (basics)

---

## Related Files

- [[domain-routing-strategy]] — How CodeGen fits in overall routing
- [[task-complexity-assessment]] — CodeGen specializes in moderate complexity
- [[keyword-matching-strategy]] — Development/database keywords for CodeGen matching
- [[context-preservation]] — How to maintain code context
- [[agent-pm]] — Planning partner
- [[agent-security]] — Security review partner

---

**Created:** 2026-02-18
**Model:** Ollama Qwen 32B
**Status:** Production Ready
**Last verified:** 2026-02-18
