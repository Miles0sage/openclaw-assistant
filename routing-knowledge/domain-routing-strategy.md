---
title: "Domain Routing Strategy"
description: "Overview of routing decision points and agent/channel relationships"
keywords: ["strategy", "agent-selection", "intent-routing", "domain-mapping"]
aliases: ["routing-strategy", "domain-moc", "routing-domains"]
type: "moc"
relatedAgents: ["pm", "codegen", "security"]
relatedChannels: ["slack", "discord", "telegram", "signal", "web", "imessage", "matrix"]
---

# Domain Routing Strategy

This MOC organizes the routing system by decision points and domain-specific paths. Use this to understand how messages flow from channels to agents.

## Routing Domains (by Intent)

### 1. Planning & Coordination
**Agent:** [[agent-pm]] (Primary)

**Triggered by keywords:** plan, timeline, schedule, roadmap, strategy, architecture, design, approach, workflow, process, milestone, deadline, estimate, estimation, breakdown, decompose, coordinate, manage, organize, project, phase, sprint, agile

**Typical flows:**
- Slack: User asks "Can you estimate the timeline for the rewrite?"
- Discord: Team planning message → PM coordinates across agents
- Web UI: Admin creates project → PM validates scope

**Context preservation:** [[context-preservation]] ensures PM has full task breakdown history

---

### 2. Development & Implementation
**Agent:** [[agent-codegen]] (Primary)

**Triggered by keywords:** code, implement, function, fix, bug, api, endpoint, build, typescript, fastapi, python, javascript, react, nextjs, database, query, schema, testing, test, deploy, deployment, frontend, backend, full-stack, refactor, refactoring, clean_code, git, repository, json, yaml, xml, rest, graphql, websocket

**Typical flows:**
- GitHub PR review → CodeGen analyzes changes
- Slack: "Debug this TypeError in the login flow"
- Discord: Feature request with implementation details
- Telegram: Quick bug fix request

**Complexity assessment:** [[task-complexity-assessment]] determines if work is:
- **Simple** (bug fix, small feature) → CodeGen directly
- **Moderate** (full feature) → CodeGen with PM oversight
- **Complex** (system redesign) → PM orchestrates CodeGen + Security

---

### 3. Security & Hardening
**Agent:** [[agent-security]] (Primary)

**Triggered by keywords:** security, vulnerability, exploit, penetration, audit, xss, csrf, injection, pentest, hack, breach, secure, threat, attack, threat_modeling, risk, malware, payload, sanitize, encrypt, cryptography, authentication, authorization, access control, sql injection, rls, row_level_security, policy

**Typical flows:**
- Slack: "Can you review this auth implementation for CSRF?"
- Discord: Security team requests RLS policy audit
- Signal: Sensitive threat discussion
- Web dashboard: Security scan results

**Special handling:** [[sensitive-data-detection]] prevents exposure of credentials/secrets

---

### 4. Data Access & Queries
**Agent:** [[agent-codegen]] (with Database Skills)

**Triggered by keywords:** query, fetch, select, insert, update, delete, table, column, row, data, supabase, postgresql, postgres, sql, database, appointments, clients, services, transactions, orders, customers, call_logs, schema, rls, subscription, real_time

**Typical flows:**
- Slack: "What appointments are scheduled for tomorrow?"
- Discord: "Can you query the orders table for Q4?"
- Telegram: Direct data lookup

**Fallback:** If query is complex, escalate to [[agent-pm]] for orchestration

---

## Channel → Agent Routing Paths

### [[channel-slack]]
- **Context:** Thread history, @mentions, reaction tracking
- **Common agents:** PM (coordination), CodeGen (reviews), Security (audits)
- **Routing rule:** Use thread context for multi-turn conversations
- **Example:** Thread → PM coordinates features, CodeGen implements, Security reviews

### [[channel-discord]]
- **Context:** Guild roles, channel topics, rich embeds
- **Common agents:** CodeGen (primary), PM (for guild-level planning)
- **Routing rule:** Check guild role; security-focused guilds → Security agent
- **Example:** #security channel → Security agent; #dev channel → CodeGen

### [[channel-telegram]]
- **Context:** Direct messages, group chats, minimal history
- **Common agents:** CodeGen (primary), PM (quick coordination)
- **Routing rule:** High volume, quick turnaround; escalate to PM if group discussion
- **Example:** 1:1 message → CodeGen; Group message → PM

### [[channel-signal]]
- **Context:** Encrypted, user context, sensitive by default
- **Common agents:** Security (primary), PM (sensitive coordination)
- **Routing rule:** Assume sensitive; route to Security or PM
- **Example:** Threat discussion → Security; Sensitive project chat → PM

### [[channel-web]]
- **Context:** Session state, structured forms, admin context
- **Common agents:** All (depends on form type)
- **Routing rule:** Use form type; project creation → PM, code upload → CodeGen, audit → Security
- **Example:** Project form → PM; Code review form → CodeGen; Audit form → Security

### [[channel-imessage]]
- **Context:** Local macOS/iOS context, rich media
- **Common agents:** PM (user coordination), CodeGen (quick fixes)
- **Routing rule:** Shorter responses; technical escalation to Slack/Discord
- **Example:** "Can you help me understand this error?" → CodeGen

### [[channel-matrix]]
- **Context:** Federated rooms, threading, enterprise structure
- **Common agents:** PM (primary for org-level), CodeGen (team-level)
- **Routing rule:** Check room topic; coordinate across teams via PM
- **Example:** #planning room → PM; #development room → CodeGen

---

## Decision Points (Routing Tree)

```
┌─ Incoming Message (any channel)
│
├─ Step 1: Assess Complexity [[task-complexity-assessment]]
│  ├─ Simple (lookup, clarification)
│  ├─ Moderate (feature, fix)
│  └─ Complex (architecture, coordination)
│
├─ Step 2: Match Keywords [[keyword-matching-strategy]]
│  ├─ Security keywords detected?
│  │  └─ YES → Route to [[agent-security]] (high confidence)
│  ├─ Dev keywords detected?
│  │  └─ YES → Route to [[agent-codegen]]
│  ├─ Planning keywords detected?
│  │  └─ YES → Route to [[agent-pm]]
│  └─ Database keywords detected?
│     └─ YES → Route to [[agent-codegen]] (database mode)
│
├─ Step 3: Extract Channel Context
│  ├─ Slack? Use thread history
│  ├─ Discord? Check guild role
│  ├─ Telegram? Minimal context
│  ├─ Signal? Assume sensitive
│  ├─ Web? Check form type
│  ├─ iMessage? Brief responses
│  └─ Matrix? Check room topic
│
├─ Step 4: Calculate Confidence [[keyword-matching-strategy]]
│  ├─ High confidence (>0.85)? → Route directly
│  ├─ Medium confidence (0.6-0.85)? → Route with PM override option
│  └─ Low confidence (<0.6)? → [[fallback-routing]] escalation
│
├─ Step 5: Preserve Context [[context-preservation]]
│  └─ Load session history, previous decisions
│
└─ Route to Agent & Format Response
   └─ Use channel-specific formatting (Slack threads, Discord embeds, etc.)
```

---

## Agent Specialization Map

### [[agent-pm]]
```
┌─────────────────────────────────────────┐
│ Project Manager (Claude Sonnet 3.5)     │
│ "Team Coordinator"                      │
├─────────────────────────────────────────┤
│ Primary Intents:                        │
│  • Planning & roadmap                   │
│  • Timeline estimation                  │
│  • Task decomposition                   │
│  • Agent coordination                   │
│  • Escalation & review                  │
│                                         │
│ Triggered by:                           │
│  • "plan", "timeline", "roadmap"        │
│  • "estimate", "estimate", "breakdown"  │
│  • "coordinate", "schedule", "design"   │
│                                         │
│ Confidence modifiers:                   │
│  • Multiple keywords → +0.3             │
│  • Planning domain → +0.4               │
│  • Low complexity + PM keyword → +0.5   │
└─────────────────────────────────────────┘
```

### [[agent-codegen]]
```
┌─────────────────────────────────────────┐
│ CodeGen (Ollama Qwen 32B)               │
│ "Implementation Expert"                 │
├─────────────────────────────────────────┤
│ Primary Intents:                        │
│  • Code implementation                  │
│  • Bug fixing & debugging               │
│  • Testing & QA                         │
│  • Database queries                     │
│  • Deployment & DevOps                  │
│                                         │
│ Triggered by:                           │
│  • "code", "implement", "fix", "bug"    │
│  • "api", "database", "query", "test"   │
│  • "deploy", "refactor", "build"        │
│                                         │
│ Confidence modifiers:                   │
│  • Implementation keyword → +0.5        │
│  • Tech stack mention → +0.3            │
│  • Moderate complexity → +0.4           │
└─────────────────────────────────────────┘
```

### [[agent-security]]
```
┌─────────────────────────────────────────┐
│ Security (Ollama Qwen 14B)              │
│ "Threat Analyst"                        │
├─────────────────────────────────────────┤
│ Primary Intents:                        │
│  • Security auditing                    │
│  • Vulnerability assessment             │
│  • Threat modeling                      │
│  • RLS policy review                    │
│  • Compliance & best practices          │
│                                         │
│ Triggered by:                           │
│  • "security", "vulnerability", "threat"│
│  • "audit", "exploit", "pentest"        │
│  • "encryption", "authentication"       │
│                                         │
│ Confidence modifiers:                   │
│  • Security keyword → +0.6              │
│  • Multiple security keywords → +0.3    │
│  • Signal channel → +0.2                │
└─────────────────────────────────────────┘
```

---

## Channel Characteristics

| Channel | Latency | Context Richness | User Volume | Best For |
|---------|---------|------------------|-------------|----------|
| Slack | Medium | High (threads, mentions) | Medium | Team coordination |
| Discord | Medium | High (roles, embeds) | High | Dev teams |
| Telegram | Low | Low | Very High | Quick requests |
| Signal | Low | Medium | Low | Sensitive discussion |
| Web | High | Very High (session, forms) | Low | Complex workflows |
| iMessage | Low | Low | Low | Quick personal tasks |
| Matrix | Medium | High (federation, rooms) | Medium | Enterprise |

---

## Routing Rules (Summary)

1. **Security always takes priority** — If security keywords present, route to [[agent-security]] regardless of other signals
2. **Database queries route to CodeGen** — Except complex multi-table joins → PM orchestration
3. **Planning keywords → PM** — Especially for "estimate", "timeline", "roadmap"
4. **Development keywords → CodeGen** — Except complex architecture → PM
5. **Channel context matters** — Slack threads, Discord roles, Signal encryption inform agent choice
6. **Escalation on low confidence** — If <0.6 confidence, see [[fallback-routing]]

---

## Next Steps

- Review [[task-complexity-assessment]] to understand complexity scoring
- Study [[keyword-matching-strategy]] for keyword patterns
- Check [[router-integration-guide]] to implement this in code
- See [[extending-agents]] to add new agents

---

**Last updated:** 2026-02-18
**Routing domains:** 4 (Planning, Development, Security, Data)
**Agents:** 3 specialized models
**Channels:** 7+ platforms
