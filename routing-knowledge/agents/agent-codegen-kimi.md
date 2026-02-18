---
title: "CodeGen Agent (Kimi 2.5)"
description: "Cost-effective code generation using Deepseek Kimi 2.5 - 70-80% cheaper than Claude"
keywords: ["implement", "code", "debug", "test", "optimize", "refactor", "kimi", "deepseek"]
aliases: ["codegen-kimi", "kimi-coder", "deepseek-code"]
type: "claim"
model: "deepseek-coder-2.5"
provider: "deepseek"
costPerMToken: 0.27
savings: "70-80% vs Claude Sonnet"
---

# CodeGen Agent: Kimi 2.5

The CodeGen agent powered by **Deepseek Kimi 2.5** handles all implementation tasks with extended reasoning capability.

## When to Route Here

Keywords indicating CodeGen (Kimi):
- **Implementation:** implement, code, function, class, method, build, create, write
- **Debugging:** debug, fix, error, bug, issue, crash, exception, trace
- **Testing:** test, unit test, integration test, test suite, coverage
- **Refactoring:** refactor, optimize, performance, cleanup, improve
- **DevOps:** deploy, script, automation, pipeline, build, docker, container

Example requests:
- "Implement a REST API endpoint for user registration"
- "Debug this TypeScript error in my React component"
- "Write unit tests for the auth module"
- "Optimize database query performance"
- "Refactor this function to be more maintainable"

## Capabilities

✅ **Full Code Implementation** — Features, modules, complete systems
✅ **Bug Fixing** — Root cause analysis, error resolution
✅ **Testing** — Unit, integration, e2e test generation
✅ **Performance** — Optimization, profiling, improvements
✅ **DevOps** — Docker, CI/CD, deployment scripts
✅ **Extended Reasoning** — Deep analysis of code problems

## Cost Advantage

| Metric | Kimi 2.5 | Claude Sonnet | Savings |
|--------|----------|---------------|---------|
| Input | $0.27/M | $3/M | **91%** |
| Output | $1.10/M | $15/M | **93%** |
| Typical Task | ~$0.15 | ~$1.50 | **90%** |

**Example:** Generating 1000 lines of code:
- Kimi 2.5: ~$0.50
- Claude Sonnet: ~$5.00
- **Savings: $4.50 per task**

## How Routing Selects This Agent

The [[keyword-matching-strategy]] scores incoming messages:
- "implement" keyword → CodeGen match (high confidence)
- "debug" keyword → CodeGen match (high confidence)
- Complexity assessment → If moderate-high, CodeGen chosen
- Cost optimization → Prefer Kimi 2.5 for code tasks (70-80% cheaper)

## Thinking Process

Kimi 2.5 uses extended thinking to reason through complex code problems:
- Problem analysis (understand requirements)
- Solution design (architecture, approach)
- Implementation planning (step-by-step)
- Code generation (write solution)
- Verification (test, edge cases)

Budget: 2,000 thinking tokens per request

## Related Claims

- [[task-complexity-assessment]] — Determines if CodeGen should handle this
- [[agent-pm]] — For architectural decisions before coding
- [[keyword-matching-strategy]] — How we detect code-related requests
- [[cost-optimization-scenarios]] — Why Kimi 2.5 saves money
- [[deepseek-kimi-integration]] — Full Deepseek setup guide

## Integration Notes

- **Model:** `deepseek-coder-2.5`
- **API:** Deepseek API (free tier available)
- **Auth:** `DEEPSEEK_API_KEY` environment variable
- **Input Tokens:** 64K context window
- **Output Tokens:** 8K per request
- **Thinking Tokens:** 2K budget (optional, improves reasoning)

---

**Status:** ✅ Ready for production use
**Cost Efficiency:** Best for code generation tasks
**Alternative:** [[agent-codegen]] (Claude - more expensive but good backup)
