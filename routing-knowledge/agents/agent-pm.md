---
title: "PM Agent (Project Manager)"
description: "Handles planning, estimation, task decomposition, and agent coordination"
keywords: ["planning", "timeline", "estimation", "coordination", "decomposition", "roadmap", "design"]
aliases: ["project-manager", "pm-agent", "cybershield-pm"]
type: "claim"
model: "Claude Sonnet 3.5"
agentId: "project_manager"
complexity: "complex"
relatedAgents: ["codegen", "security"]
relatedChannels: ["slack", "discord", "web", "signal", "matrix"]
---

# PM Agent — Project Manager

## Role

The PM Agent (codenamed "Cybershield PM") specializes in **planning, task decomposition, timeline estimation, and cross-agent coordination**. It acts as the orchestrator for complex multi-step projects and serves as the escalation point for ambiguous or high-complexity requests.

**Model:** Claude Sonnet 3.5 (latest)
**Availability:** Always ready for coordination
**Response time:** Medium (considers context deeply)

---

## Primary Responsibilities

### 1. Planning & Roadmapping
The PM agent is responsible for:
- Breaking down large projects into milestones
- Creating timelines and dependency maps
- Identifying blockers and risks
- Recommending sequencing for parallel vs. serial work

**Example triggers:**
- "Can you help me plan a Q2 feature roadmap?"
- "What's the timeline for migrating to Postgres?"
- "How should we structure the team for this project?"

### 2. Task Decomposition & Estimation
Converting high-level requests into actionable subtasks:
- Analyzing complexity (simple, moderate, complex)
- Estimating effort (hours, days, weeks)
- Identifying skill requirements
- Recommending agent involvement

**Example triggers:**
- "Estimate the effort to add OAuth2 authentication"
- "Break down this refactor into sprints"
- "What's required for a secure production deployment?"

### 3. Agent Coordination & Orchestration
Managing multi-agent workflows:
- Deciding which agents to involve (CodeGen, Security, etc.)
- Sequencing agent work (e.g., PM planning → CodeGen implementation → Security review)
- Reviewing results from other agents
- Handling handoffs between agents

**Example triggers:**
- "Can you coordinate our team to ship this feature?"
- "What's our rollout strategy for this security patch?"
- "Help me review the architecture before CodeGen starts"

### 4. Quality Assurance & Review
Acting as a gatekeeper for quality:
- Reviewing implementation plans from CodeGen
- Validating security review results
- Checking alignment with project goals
- Identifying scope creep

**Example triggers:**
- "Review this implementation plan for issues"
- "Is this approach sound for the API redesign?"
- "What questions should I ask CodeGen about this PR?"

---

## Keyword Patterns

**Strong signals** (high confidence for PM routing):

```
plan, timeline, schedule, roadmap, strategy, architecture, design,
approach, workflow, process, milestone, deadline, estimate,
estimation, breakdown, decompose, coordinate, manage, organize,
project, phase, sprint, agile, scoping, capacity, roadmap, charter
```

**Confidence scoring:**
- Single keyword: +0.3 to base score
- Multiple keywords: +0.4 (multiplicative)
- Planning domain (5+ related keywords): +0.5
- Explicit "estimate" or "timeline": +0.6

---

## Agent Skills (Claimed Expertise)

| Skill | Description |
|-------|-------------|
| **Task Decomposition** | Breaking complex problems into subtasks with dependencies |
| **Timeline Estimation** | Predicting effort and duration based on complexity |
| **Quality Assurance** | Reviewing work from other agents; catching issues early |
| **Client Communication** | Explaining technical decisions to non-technical stakeholders |
| **Team Coordination** | Managing workflows across multiple agents |
| **Agent Coordination** | Orchestrating CodeGen, Security, Database agents |
| **Workflow Optimization** | Improving process efficiency and parallelization |

---

## Complexity Level

**Specialized for:** COMPLEX tasks

The PM agent is optimized for high-complexity requests that require:
- Multi-step planning
- Cross-agent coordination
- Strategic decision-making
- Risk assessment and mitigation
- Scope management

**Lower complexity tasks:**
- Simple planning questions may route to [[agent-codegen]] for quick answers
- Basic estimates may be handled by other agents
- But PM provides the most thorough planning analysis

---

## Interaction Patterns

### Pattern 1: Direct Planning Request
```
User (Slack):
"We need to redesign the authentication flow.
Can you create a plan?"

PM Response:
1. Analyze current flow (questions)
2. Propose new design (with rationale)
3. Create timeline (weeks/sprints)
4. Identify risks (blockers, complexity)
5. Recommend team (CodeGen for impl, Security for review)
6. Define success criteria
```

### Pattern 2: Escalation from CodeGen
```
CodeGen (via agent-router):
"User asked to 'redesign the entire API'.
Complexity unclear. Escalating to PM."

PM Response:
1. Clarify scope with follow-up questions
2. Estimate effort range
3. Break into phases
4. Recommend whether CodeGen implements all or PM orchestrates
```

### Pattern 3: Pre-Implementation Review
```
User (Discord):
"Here's my architecture proposal for the new billing system.
Is it sound?"

PM Response:
1. Review for feasibility
2. Identify potential issues
3. Suggest improvements
4. Validate alignment with project goals
5. Flag concerns for Security review (if needed)
```

---

## Channel Preferences

| Channel | Best Use | Context Leverage |
|---------|----------|------------------|
| **Slack** | Detailed planning in threads | Full history, @mentions for team context |
| **Discord** | Guild-level strategy | Role context, multiple channels for phases |
| **Web UI** | Structured project forms | Session persistence, form workflows |
| **Signal** | Sensitive strategic discussions | Encrypted, 1:1 focus |
| **Matrix** | Enterprise planning | Federated rooms, org hierarchy |
| **Telegram** | Quick timeline questions | Less ideal; brief responses only |
| **iMessage** | Personal project chat | Short messages; escalate to Slack |

---

## Integration with Other Agents

### PM + [[agent-codegen]]
- **PM** provides design → **CodeGen** implements
- **CodeGen** raises questions → **PM** clarifies scope
- **CodeGen** delivers code → **PM** validates against plan

**Example workflow:**
```
User: "Build a real-time dashboard for orders"
→ PM: Estimates 2 weeks, breaks into:
     Week 1: API + WebSocket setup (CodeGen)
     Week 2: Frontend + testing (CodeGen)
→ CodeGen: Implements each phase
→ PM: Reviews, verifies timeline adherence
```

### PM + [[agent-security]]
- **PM** identifies security concerns → **Security** audits
- **Security** finds issues → **PM** rescopes timeline
- **PM** oversees security fixes

**Example workflow:**
```
User: "Release authentication changes"
→ PM: Plans rollout, identifies security review gates
→ Security: Audits auth changes, finds CSRF issue
→ PM: Rescopes sprint, coordinates fix → Security re-review
```

### PM as Orchestrator
- **PM** receives ambiguous request
- **PM** clarifies scope, estimates complexity
- **PM** routes subtasks to CodeGen + Security
- **PM** coordinates work, manages dependencies

---

## Fallback & Escalation

**When PM is not appropriate:**
- Simple bug fix → Route to [[agent-codegen]]
- Security audit → Route to [[agent-security]]
- Data query → Route to [[agent-codegen]] (with database skills)
- Quick clarification → Route to relevant specialist

**When other agents escalate to PM:**
- CodeGen: "This refactor is too big for a single task; coordinate?"
- Security: "These findings affect multiple systems; plan remediation?"
- Any agent: Ambiguous scope, high complexity, or multi-agent coordination needed

---

## Quality Metrics

**What good PM routing looks like:**
- ✅ Requests containing "plan", "estimate", "timeline", "roadmap" routed to PM
- ✅ Multi-keyword planning requests (2+ keywords) → PM with high confidence
- ✅ Ambiguous requests (unclear scope) → PM for clarification
- ✅ Complex requests (architecture, design) → PM for orchestration
- ✅ Escalations from CodeGen/Security → PM for coordination

**What bad routing looks like:**
- ❌ Simple bug fix routed to PM
- ❌ Basic data query routed to PM
- ❌ Quick clarification routed to PM (scalability issue)
- ❌ PM routed to CodeGen for planning

---

## Context Awareness

The PM agent benefits from:
- **Session history:** Previous planning decisions, rejected approaches
- **Channel context:** Slack threads show full conversation history
- **User context:** Who is the requester? (team lead? developer? manager?)
- **Project context:** What project/product is this for?
- **Team context:** Who will execute the plan? (skill levels, availability)

See [[context-preservation]] for how to maintain context across multi-turn conversations.

---

## Example Queries (High PM Confidence)

| Query | Keywords | Confidence |
|-------|----------|-----------|
| "Plan the timeline for migrating databases" | plan, timeline, migrate | 0.95 |
| "Break down this feature into sprints" | break down, sprints | 0.90 |
| "Estimate effort: redesign auth flow" | estimate, effort, design | 0.92 |
| "What's the roadmap for Q2?" | roadmap | 0.85 |
| "Coordinate a security audit + hotfix" | coordinate | 0.88 |
| "Is this architecture sound?" | architecture | 0.75 |

---

## Implementation Notes

**For routing system:**
1. **High confidence signals:** "plan", "estimate", "timeline", "roadmap", "decompose"
2. **Confidence boost:** Multiple planning keywords (multiplicative)
3. **Fallback:** If low confidence on planning, check for secondary keywords (dev/security)
4. **Escalation:** CodeGen/Security → PM on ambiguous scope or multi-agent work

**For session management:**
- Preserve full conversation history for PM (planning decisions reference back to previous context)
- Track accepted/rejected plans (inform future estimates)
- Link related projects (roadmap continuity)

---

## Related Files

- [[domain-routing-strategy]] — How PM fits in overall routing
- [[task-complexity-assessment]] — PM specializes in complexity assessment
- [[keyword-matching-strategy]] — Planning keywords for PM matching
- [[context-preservation]] — How to maintain planning context
- [[agent-codegen]] — Execution partner
- [[agent-security]] — Security review partner

---

**Created:** 2026-02-18
**Model:** Claude Sonnet 3.5
**Status:** Production Ready
**Last verified:** 2026-02-18
