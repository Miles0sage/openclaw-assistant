---
title: "Telegram Channel Context"
description: "Direct/group messages with minimal context enable fast but less informed routing"
keywords: ["telegram", "direct-message", "groups", "fast", "minimal-context"]
aliases: ["telegram-context", "telegram-routing"]
type: "claim"
platform: "Telegram"
contextRichness: "low"
latency: "low"
relatedAgents: ["codegen"]
---

# Telegram Channel Context

## Channel Characteristics

**Platform:** Telegram (Messaging app, mobile-first)
**Context Richness:** LOW (direct messages, minimal history)
**User Volume:** Very High (quick questions, fast turnaround)
**Message Latency:** Low (immediate dispatch)
**Best For:** Quick bug fixes, data queries, fast coordination

---

## Context Provided by Telegram

### 1. Chat Type (Direct vs Group)
Telegram conversations are either direct (1:1) or group messages:
- **Direct messages (1:1):** Personal request from known user
- **Group messages:** Team discussion, potentially more context
- **Supergroups:** Larger team chats with threading (rare in this setup)

**Routing advantage:**
- Direct message from engineer → CodeGen likely
- Direct message from manager → PM likely
- Group message → May need context from multiple participants

### 2. Minimal Message History
Unlike Slack/Discord, Telegram provides:
- **Limited history:** Only recent messages (configurable retention)
- **No threading:** Messages are linear (can't organize discussions)
- **No reactions:** Basic emoji support only (no structured feedback)
- **User identity:** Message sender ID (may not have full profile)

**Routing disadvantage:**
- Less context available for complex decision-making
- Messages are standalone, not part of organized thread
- Quick turnaround expected (users accustomed to short responses)

### 3. User Context (Limited)
Telegram provides basic user information:
- **User ID** (numeric identifier)
- **User name** (Telegram username if set)
- **Chat history** (limited by retention settings)
- **First/last name** (if provided)

**Routing advantage:**
- Can recognize recurring users
- User ID can link to previous conversations
- Username may hint at role (e.g., @engineer_alice → technical request)

### 4. Message Types
Telegram supports various message types:
- **Text messages** (primary)
- **Code snippets** (can share code inline)
- **Files** (logs, screenshots, documents)
- **Links** (GitHub, Jira, etc.)

**Routing advantage:**
- File attachments provide context (error logs → CodeGen)
- Links to GitHub issues/PRs (implementation context)

---

## Telegram-Specific Routing Rules

### Rule 1: Fast Dispatch
Telegram expects quick responses; prioritize speed over thoroughness.

```
Examples:
"Fix this bug" → CodeGen immediately (30 min response target)
"Plan this" → PM immediately (planning summary, not full breakdown)
"Is this secure?" → Security (but may defer complex audit)
```

### Rule 2: Prefer CodeGen for Quick Fixes
Most Telegram requests are simple/moderate complexity → CodeGen default.

```
Example:
User: "Why is the login broken?"
→ CodeGen (quick diagnosis)
→ If complex, escalate to PM
```

### Rule 3: Escalate to Richer Channels
Complex discussions should escalate to Slack/Discord for full context.

```
Example:
Telegram: "We need to redesign the API"
CodeGen/PM: "This needs detailed planning; move to Slack?"
→ Create Slack thread for full discussion
→ Return to Telegram with summary after
```

### Rule 4: Preserve Session Continuity
Link Telegram conversations to other channels if user escalates.

```
Example:
Telegram: User starts task
→ CodeGen provides initial direction
→ User: "Can you help more on Slack?"
→ Create Slack thread, maintain session context
```

---

## Response Formatting for Telegram

**Responses are brief and direct:**
- Keep under 2000 characters (Telegram message limit)
- Use markdown for formatting (bold, code blocks)
- Include clear next steps
- Offer to move to Slack/Discord if complex

**Example response:**
```
🔧 **Issue:** Login returns 500 error

**Diagnosis:** Database connection timeout
(Based on: error log you shared)

**Quick Fix:**
```python
# Add connection pooling in database.py
db = asyncpg.create_pool(
    dsn="...",
    max_size=20
)
```

**Timeline:** 30 min implementation

**Next:** Test on staging, then production deploy

Need detailed planning? → Move to Slack #deployments for full coordination
```

---

## Telegram Integration Details

### Message Dispatch
- **Incoming:** User sends message to Telegram bot → OpenClaw gateway
- **Routing:** Quick intent classification (minimal context)
- **Agent processing:** Fast response expected
- **Response:** Telegram message sent back to user

### Session Management
- **Session key:** `telegram:{user_id}:{chat_id}`
- **History:** Limited to recent messages (configurable)
- **User identity:** Telegram user ID
- **Context:** Minimal; supplement with linked Slack/Discord sessions

### Latency Considerations
- **Message receive → routing:** ~50ms (fast)
- **Intent classification:** ~30ms (minimal context)
- **Agent response:** Fast (CodeGen optimized for speed)
- **Response send:** ~100ms
- **Total:** <200ms (fastest of all channels)

---

## Example Telegram Workflows

### Workflow 1: Quick Bug Fix (CodeGen Direct)
```
User: "The API returns 500 on checkout"
  └─ File: error_log.txt

Telegram context: Minimal
User: Unknown or recurring user
Message type: Direct message with attachment

Routing: CodeGen (0.85 confidence, speed priority)

CodeGen Response:
  • Analyzes error log
  • "Database timeout from payment processing"
  • Quick fix: "Add retry logic + connection pool"
  • Timeline: "30 min to implement"

User: "Can you do it now?"
CodeGen: "On it; will test on staging first"
```

### Workflow 2: Escalation to Slack (PM Coordination)
```
User: "Should we migrate to PostgreSQL?"

Telegram context: Simple yes/no question
Routing: PM (planning keyword detected)

PM Response:
  • "This is complex; let's discuss in Slack"
  • "Moving to #planning channel"

Slack:
#planning channel → Full discussion
PM: Creates detailed analysis
  • Current setup analysis
  • PostgreSQL pros/cons
  • Migration timeline (4-6 weeks)
  • Resource requirements (2 engineers)

Back to Telegram:
PM: "Discussed in Slack; recommendation: [summary]"
```

### Workflow 3: Data Query (CodeGen Direct)
```
User: "How many orders yesterday?"

Telegram context: Simple data lookup
Routing: CodeGen (database keywords)

CodeGen Response:
```
SELECT COUNT(*) FROM orders
WHERE DATE(created_at) = CURRENT_DATE - 1;

**Result:** 247 orders yesterday

📈 Trend: 15% increase from previous day
```

User: "Any security concerns with this query?"
→ Escalates to Security if needed
```

### Workflow 4: Escalation to Security (Threat Question)
```
User: "Is OAuth2 secure enough?"

Telegram context: Security question
Routing: Security (security keyword)

Security Response:
  • "OAuth2 is solid; depends on implementation"
  • "Key questions: PKCE? Secure token storage?"
  • "Move to Slack #security for full audit?"

If user agrees:
Slack: Full threat modeling discussion
→ CodeGen implementation recommendations
→ Security final sign-off
```

---

## Telegram Best Practices for Agents

### DO:
- ✅ Respond quickly (under 30 min target)
- ✅ Keep responses brief (under 2000 characters)
- ✅ Use markdown formatting
- ✅ Provide clear next steps
- ✅ Offer to move to Slack/Discord for complex discussions
- ✅ Use code blocks for code snippets
- ✅ Handle file attachments (logs, screenshots)

### DON'T:
- ❌ Assume extensive context (users may not provide full history)
- ❌ Request long back-and-forth explanations
- ❌ Offer full planning (move to Slack for that)
- ❌ Expect users to paste full error logs (ask for file upload)
- ❌ Ignore mobile usability (keep responses mobile-friendly)

---

## Integration with Agent Router

**Telegram-specific routing logic:**

```python
def route_telegram_message(message, context):
    # Telegram has minimal context; route quickly

    # Extract what context we have
    user_id = message.from_user.id
    is_group = message.chat.type == "group"

    # Check for security keywords (highest priority)
    if has_security_keywords(message.text):
        return route_to_agent("security", confidence=0.80)

    # Check for planning keywords
    if has_planning_keywords(message.text):
        return route_to_agent("pm", confidence=0.70)

    # Default to CodeGen for speed (most requests are implementation)
    return route_to_agent("codegen", confidence=0.75)
```

---

## Channel Characteristics Comparison

| Metric | Telegram | Slack | Discord |
|--------|----------|-------|---------|
| **Context Richness** | 2/10 | 9/10 | 9/10 |
| **Response Latency Target** | <200ms | 500ms | 500ms |
| **History Retention** | Low | High | High |
| **Threading** | None | Rich | Rich |
| **User Volume** | Very High | Medium | High |
| **Best Use** | Quick fixes | Planning | Team dev |

---

## Related Files

- [[domain-routing-strategy]] — Telegram in overall routing
- [[channel-slack]] — Rich context comparison
- [[channel-discord]] — Rich context comparison
- [[agent-codegen]] — Primary Telegram agent
- [[agent-pm]] — Secondary (for escalation)
- [[agent-security]] — Secondary (for security questions)

---

**Created:** 2026-02-18
**Platform:** Telegram
**Status:** Active Production
**High Volume:** Yes (most user requests)
**Last verified:** 2026-02-18
