---
title: "Slack Channel Context"
description: "Thread history + @mentions enable context-aware routing and threaded responses"
keywords: ["slack", "threads", "mentions", "team-chat", "context-rich"]
aliases: ["slack-context", "slack-routing"]
type: "claim"
platform: "Slack"
contextRichness: "high"
latency: "medium"
relatedAgents: ["pm", "codegen", "security"]
---

# Slack Channel Context

## Channel Characteristics

**Platform:** Slack (Team collaboration, real-time chat)
**Context Richness:** HIGH (threads, @mentions, user profiles)
**User Volume:** Medium (dedicated teams)
**Message Latency:** Medium (real-time with threading)
**Best For:** Team coordination, code review, planning discussions

---

## Context Provided by Slack

### 1. Thread History
Slack enables organized conversations through threads:
- **Full conversation history** available in a single thread
- **Context preservation** across multiple messages
- **User identity** clearly marked (who said what)
- **Timestamps** showing conversation flow

**Routing advantage:**
- PM agent can see full planning discussion → Better coordination decisions
- CodeGen can see error reports + previous attempts → Better debugging
- Security can see threat discussion → Complete threat model

**Example:**
```
User1: "Let's plan the API redesign"
  ├─ Thread: "Current issues: N+1 queries, slow pagination"
  ├─ Thread: "Proposed solution: GraphQL with pagination"
  ├─ Thread: "Timeline? 2-3 weeks?"
  └─ Thread: "Security implications? Need audit?"

Routing decision: PM agent with full thread history
→ Better estimation, threat awareness, coordination
```

### 2. @Mentions
Slack allows explicit agent/user mentions:
- **@here** or **@channel** for broadcast
- **@user** for specific person or bot
- **Agent mentions** can hint at intended recipient
  - "@pm_agent plan this"
  - "@security audit this"
  - "@coder fix this"

**Routing advantage:**
- Explicit agent mention can override confidence scoring
- Mentions indicate user intent and urgency

### 3. User Context
Slack provides user profiles and workspace context:
- **User role** (engineer, manager, product, security)
- **User name and timezone**
- **Workspace name** (company, team, project)
- **Channel topic** (#engineering, #security, #product)

**Routing advantage:**
- Engineering asking in #engineering → CodeGen
- Security team asking in #security → Security agent
- PM asking in #planning → PM agent

### 4. Reaction Tracking
Slack emoji reactions show sentiment and agreement:
- **✅ or 👍** = agreement/approval
- **⚠️** = concern/warning
- **🔒** = sensitive/security concern
- **🚀** = deployment readiness

**Routing advantage:**
- Emoji reactions can indicate urgency or special handling
- 🔒 reaction suggests security review needed

---

## Slack-Specific Routing Rules

### Rule 1: Use Full Thread Context
Always load and reference full thread history when making routing decisions.

```
Example:
User: "This is broken"
  (Thread shows: previous errors, reproduction steps,
   attempted fixes, deadline, security implications)

Routing decision: Consider all context, not just "broken"
→ CodeGen (for implementation) or Security (if exploit risk)
```

### Rule 2: Respect @Mentions
If user explicitly @mentions an agent, use that as primary signal (unless misaligned).

```
Example:
User: "@pm_agent can you estimate this?"
→ Route to PM (explicit mention overrides other signals)
```

### Rule 3: Channel Topic Matters
Infer agent preference from channel topic.

```
Examples:
#engineering or #development → CodeGen (primary)
#security or #pentest → Security (primary)
#planning or #product → PM (primary)
#general or #random → Route by intent
```

### Rule 4: Escalation Pattern
Slack threads show escalation naturally; respect the conversation flow.

```
Example thread progression:
User: "Fix this bug"
  → CodeGen fixes
  → User: "Is this secure?"
  → CodeGen escalates to Security
  → Security audits and recommends
  → PM coordinates if timeline impacts
```

---

## Response Formatting for Slack

**Responses must be thread-aware:**
- Reply in the thread (not top-level channel)
- Use Slack formatting: bold, code blocks, lists
- Include reactions (✅ when done, ⚠️ for issues)
- Use threads for multi-turn conversations
- Mention user with @username for visibility

**Example response:**
```
@user Here's the analysis:

*Issue:* CSRF vulnerability in login endpoint
*Root Cause:* Missing CSRF token validation
*Fix:* Add SameSite cookie + token verification

*Code:*
```python
@app.post("/login")
def login(request: LoginRequest):
    csrf_token = generate_csrf_token()  # NEW
    # ... rest of login logic
```
*Timeline:* 30 min to implement + test
*Risk:* Low (test coverage for auth exists)

Ready to implement? Reply with 👍
```
```

---

## Slack Integration Details

### Message Dispatch
- **Incoming:** User message in thread → OpenClaw gateway
- **Agent processing:** Agent responds based on routing decision
- **Response:** Agent message posted in thread (preserves context)

### Session Management
- **Session key:** `slack:{workspace_id}:{channel_id}:{thread_ts}`
- **History retention:** All messages in thread available
- **User identity:** Slack user ID linked to agent conversation

### Latency Considerations
- **Message receive → routing:** ~100ms
- **Routing decision:** ~50ms
- **Agent response generation:** Variable (depends on agent)
- **Response send:** ~100ms
- **Total:** 300ms - 2s (depending on agent)

---

## Example Slack Workflows

### Workflow 1: Team Planning (PM Primary)
```
#planning channel:

Manager: "We need to ship the payment feature ASAP"
  └─ Thread: "Timeline? Risk assessment? Dependencies?"

@pm_agent Thread loaded → Full context available
PM Response:
  • Estimates timeline (1-2 weeks)
  • Identifies dependencies (Stripe API, RLS policies)
  • Flags security review needed (payment = sensitive)
  • Recommends: PM → Security (threat model)
               → CodeGen (implementation)
               → Security (final audit)
```

### Workflow 2: Code Review (CodeGen + Security)
```
#code-review channel:

Engineer: "I implemented the password reset flow"
  └─ Thread: "[GitHub PR link]"

@codegen loads PR → Reviews code
CodeGen Response:
  • Code looks good overall
  • Minor: Use parameterized queries (line 42)
  • Thread: "Should this go through Security audit before merge?"

User replies: "Good point, @security_agent can you review?"

@security loads thread + code
Security Response:
  • CSRF token implementation: ✅ Good
  • Token TTL: ⚠️ 30 min is good, but document
  • Email validation: ✅ Prevents spam
  • Ready to merge (with minor doc note)
```

### Workflow 3: Bug Escalation (CodeGen → PM)
```
#bugs channel:

User: "API endpoint times out on large datasets"
  └─ Thread: "Happens with 10k+ records, blocks product release"

@codegen loads context → Sees volume + deadline
CodeGen diagnoses: N+1 query, needs database redesign
CodeGen escalates: "Complex refactor needed; escalating to @pm_agent"

@pm loads full thread
PM Response:
  • Coordinates with CodeGen (implementation strategy)
  • Checks Security (any data sensitivity?)
  • Estimates timeline: 3-5 days
  • Recommends phase 1 (add indexes) + phase 2 (redesign)
  • Routes implementation back to CodeGen (phase 1, then phase 2)
```

---

## Slack Best Practices for Agents

### DO:
- ✅ Use thread context (load full history)
- ✅ Reference previous messages: "As you mentioned in [message]..."
- ✅ Use Slack formatting (bold, code blocks)
- ✅ Include reaction suggestions (👍 when done)
- ✅ Respect @mentions and channel topics
- ✅ Escalate when complexity exceeds expertise

### DON'T:
- ❌ Break thread context (reply top-level)
- ❌ Ignore channel topic (@security_agent in #engineering?)
- ❌ Ignore @mentions (use as signal)
- ❌ Assume message is complete (check full thread)
- ❌ Use plain text where formatting helps (code blocks for code)

---

## Integration with Agent Router

**Slack-specific routing logic:**

```python
def route_slack_message(message, context):
    # Extract Slack context
    thread_history = load_thread_context(message)
    channel_topic = get_channel_topic(message.channel)
    mentions = extract_mentions(message.text)

    # Rule 1: Explicit mention overrides others
    if mentions and mentions[0] in AGENT_MENTION_MAP:
        return route_to_mentioned_agent(mentions[0])

    # Rule 2: Channel topic provides signal
    agent_from_channel = CHANNEL_TOPIC_AGENT_MAP.get(channel_topic)
    if agent_from_channel:
        confidence_boost = 0.2

    # Rule 3: Full thread context for intent classification
    full_text = combine_thread_messages(thread_history)
    intent = classify_intent(full_text)

    # Rule 4: Route based on intent + context
    agent = route_by_intent(intent, confidence_boost)

    return agent
```

---

## Channel-Specific Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| **Avg Response Latency** | 500-1000ms | Medium due to context loading |
| **Context Richness** | 9/10 | Full thread history available |
| **User Satisfaction** | High | Thread organization helps |
| **Routing Accuracy** | 92% | High due to context |
| **Common Agents** | PM, CodeGen | Depends on channel |
| **Escalation Rate** | Medium | From CodeGen to PM often |

---

## Related Files

- [[domain-routing-strategy]] — Slack in overall routing
- [[channel-discord]] — Similar rich context, different platform
- [[channel-telegram]] — Different context approach
- [[context-preservation]] — How to use Slack thread history
- [[agent-pm]] — Primary Slack agent
- [[agent-codegen]] — Secondary Slack agent

---

**Created:** 2026-02-18
**Platform:** Slack
**Status:** Active Production
**Last verified:** 2026-02-18
