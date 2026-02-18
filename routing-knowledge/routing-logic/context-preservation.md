---
title: "Context Preservation"
description: "Maintaining conversation history and session state across multi-turn interactions"
keywords: ["context", "session", "history", "state", "persistence", "handoff"]
aliases: ["conversation-history", "session-management", "state-preservation"]
type: "guide"
complexity: "moderate"
relatedAgents: ["pm", "codegen", "security"]
relatedChannels: ["slack", "discord", "telegram", "web"]
---

# Context Preservation

## Overview

Context preservation maintains conversation history and session state across:
- Multiple agent messages in same conversation
- Handoffs between agents
- Different channels/platforms
- Multi-turn workflows

---

## Session State Structure

Each conversation session stores:

```python
@dataclass
class SessionState:
    """Complete session context for routing and conversation"""

    # Identity
    session_id: str  # Format: platform:user_id:chat_id
    user_id: str
    channel: str  # slack, discord, telegram, web, etc.
    timestamp: datetime

    # Conversation history
    messages: List[Message]  # Full message history
    current_turn: int  # Which message we're on
    turns_count: int  # Total turns in conversation

    # Routing context
    current_agent: str  # Who's responding now
    previous_agents: List[str]  # Who responded before
    escalation_path: List[str]  # Agents involved in escalation
    confidence_history: List[float]  # Routing confidence per turn

    # Domain context
    detected_intent: str  # planning, development, security, data
    task_complexity: str  # simple, moderate, complex
    keywords: List[str]  # Detected keywords

    # Channel-specific context
    thread_id: Optional[str]  # Slack/Discord thread
    channel_context: Dict[str, Any]  # Platform-specific metadata
        # Slack: mentions, reactions, channel_topic
        # Discord: roles, guild_id, category
        # Telegram: group_id, message_id

    # Task context
    task_summary: Optional[str]  # Brief description of task
    subtasks: List[str]  # Breakdown of work
    dependencies: List[str]  # What must happen first
    timeline_estimate: Optional[str]  # Estimated duration

    # Decisions made
    plan_approved: bool = False
    security_review_done: bool = False
    implementation_complete: bool = False
```

---

## Session Lifecycle

### Phase 1: Session Creation
When user starts a conversation:

```python
def create_session(channel: str, user_id: str, chat_id: str) -> SessionState:
    """Create new session"""

    session_id = f"{channel}:{user_id}:{chat_id}"

    return SessionState(
        session_id=session_id,
        user_id=user_id,
        channel=channel,
        timestamp=datetime.now(),
        messages=[],
        current_turn=0,
        previous_agents=[],
        escalation_path=[],
        confidence_history=[]
    )
```

### Phase 2: Message Receipt & Storage
Store every message in session:

```python
def add_message(session: SessionState, message: Message) -> None:
    """Store message in session history"""

    session.messages.append(message)
    session.current_turn += 1
    session.turns_count = len(session.messages)
```

### Phase 3: Agent Routing
Use full session history for routing decision:

```python
def route_with_context(session: SessionState, new_message: str) -> str:
    """Route based on current message + full history"""

    # Analyze full conversation
    full_text = "\n".join([m.text for m in session.messages[-10:]])  # Last 10 messages

    # Extract intent from full context
    intent = classify_intent(full_text)
    complexity = assess_complexity(full_text, session=session)

    # Consider previous agent (don't assign same if escalation)
    exclude_agent = session.current_agent if session.escalation_path else None

    # Route
    agent = select_best_agent(
        new_message,
        intent=intent,
        complexity=complexity,
        context=session,
        exclude=exclude_agent
    )

    return agent
```

### Phase 4: Agent Response
Agent processes request with context:

```python
def agent_respond(session: SessionState, agent_id: str) -> str:
    """
    Agent responds with full session context.
    Can reference previous messages, decisions, etc.
    """

    # Load full context
    history = session.messages
    previous_decisions = session.escalation_path
    task_summary = session.task_summary

    # Generate response (agent-specific)
    response = agent.generate_response(
        query=history[-1].text,
        context=session,
        history=history
    )

    # Store agent response in session
    session.messages.append(Message(
        role="agent",
        agent=agent_id,
        text=response,
        timestamp=datetime.now()
    ))

    # Update session state
    session.current_agent = agent_id
    session.previous_agents.append(agent_id)
    session.escalation_path.append(agent_id)

    return response
```

### Phase 5: Session Persistence
Save session to disk (optional):

```python
def save_session(session: SessionState) -> None:
    """Persist session to disk for recovery"""

    path = f"/tmp/openclaw_sessions/{session.session_id}.json"
    with open(path, "w") as f:
        json.dump(session.to_dict(), f, indent=2)
```

---

## Context Usage Patterns

### Pattern 1: Reference Previous Decisions
Agent can reference earlier decisions in conversation:

```
Turn 1 (User): "Plan the API redesign"
Turn 2 (PM): "Estimated 4 weeks. Steps: [1] Schema design, [2] API development, [3] Testing"
Turn 3 (User): "What about security?"
Turn 4 (PM Context): "As mentioned in step [2], we need security audit.
                     Escalating to @security_agent for threat model..."
```

### Pattern 2: Escalation Context
When escalating, provide full context:

```
CodeGen → Security escalation:
Session context: Full implementation + security concerns
Security receives: Implementation details + CodeGen's concerns
Security can: Audit specific code, not start from scratch
```

### Pattern 3: Multi-Turn Workflow
Track task completion through multiple turns:

```
Turn 1 (User): "Build the checkout flow"
       Agent: CodeGen
       Status: Planning

Turn 2 (User): "Is it secure?"
       Escalation: CodeGen → Security
       Status: Implementation + Security Review

Turn 3 (User): "Can you deploy?"
       Escalation: Security → PM (coordinate deployment)
       Status: Pre-deployment

Turn 4 (PM): Validates all checks passed, coordinates deployment
       Status: Deployment in progress
```

---

## Slack Context Preservation

Slack provides thread context for free:

```python
def preserve_slack_context(message):
    """Load full Slack thread context"""

    thread_history = client.conversations_replies(
        channel=message.channel,
        ts=message.thread_ts
    )

    return {
        "thread_id": message.thread_ts,
        "participants": extract_users(thread_history),
        "reactions": extract_reactions(thread_history),
        "full_history": thread_history
    }
```

**Advantage:** Slack automatically organizes context by thread
**Usage:** Reply in thread to preserve conversation organization

---

## Discord Context Preservation

Discord threads + message embeds:

```python
def preserve_discord_context(message):
    """Load Discord thread and guild context"""

    # Thread context
    thread = message.channel  # If in thread
    thread_messages = thread.history(limit=100)

    # Guild context
    guild = message.guild
    roles = message.author.roles

    # Channel context
    channel_category = message.channel.category

    return {
        "thread_id": thread.id if thread else None,
        "thread_messages": thread_messages,
        "guild": guild.name,
        "user_roles": [r.name for r in roles],
        "channel_category": channel_category.name,
        "full_history": thread_messages or [message]
    }
```

---

## Telegram Context Preservation

Telegram has limited history; use session ID:

```python
def preserve_telegram_context(message, session_store):
    """
    Telegram has limited message history.
    Use session storage for full context.
    """

    session_id = f"telegram:{message.from_user.id}:{message.chat.id}"

    # Load session from storage
    session = session_store.load(session_id)

    # Add new message
    session.messages.append(Message(
        text=message.text,
        user=message.from_user.username,
        timestamp=message.date
    ))

    # Save updated session
    session_store.save(session)

    return {
        "session_id": session_id,
        "history": session.messages[-20:],  # Last 20 messages
        "task_summary": session.task_summary
    }
```

---

## Web Context Preservation

Web UI maintains full session state:

```python
def preserve_web_context(session_key: str, state_manager):
    """
    Web UI can maintain rich session context.
    Provides structured forms + full history.
    """

    session = state_manager.get(session_key)

    return {
        "session_key": session_key,
        "user": session.user,
        "form_data": session.form_data,  # Structured input
        "conversation": session.messages,
        "task_progress": session.progress,
        "attachments": session.files
    }
```

---

## Cross-Channel Context Handoff

When user moves from one channel to another:

```python
def handoff_context(old_channel: str, new_channel: str, user_id: str):
    """
    Transfer session context between channels.
    Example: User starts in Telegram, wants to discuss in Slack.
    """

    # Create session for new channel
    old_session_id = f"{old_channel}:{user_id}:*"
    new_session_id = f"{new_channel}:{user_id}:*"

    # Load old session
    old_session = load_session(old_session_id)

    # Create new session with old context
    new_session = create_session(new_channel, user_id, "new_chat_id")
    new_session.messages = old_session.messages  # Preserve history
    new_session.task_summary = old_session.task_summary
    new_session.escalation_path = old_session.escalation_path

    # Save new session
    save_session(new_session)

    return {
        "old_session": old_session_id,
        "new_session": new_session_id,
        "context_transferred": True
    }
```

---

## Context Restoration on Error

If agent/connection drops, restore from session:

```python
def restore_session_on_error(session_id: str):
    """
    Restore session if agent crashes or connection drops.
    Prevents losing conversation state.
    """

    # Load session from disk
    session = load_session_from_disk(session_id)

    # Reconstruct context
    context = {
        "messages": session.messages,
        "current_agent": session.current_agent,
        "previous_agents": session.previous_agents,
        "task_summary": session.task_summary,
        "decisions": session.escalation_path
    }

    # Notify user
    notify_user(f"Restored conversation context. Last agent: {session.current_agent}")

    # Prompt for next step
    return prompt_next_step(session)
```

---

## Privacy & Sensitivity

### Sensitive Data Handling

```python
def filter_sensitive_data(session: SessionState) -> SessionState:
    """
    Remove/redact sensitive data from session before storage.
    """

    filtered_messages = []

    for message in session.messages:
        # Redact API keys, passwords, tokens
        redacted_text = redact_secrets(message.text)

        # Redact PII if user requested
        if session.privacy_mode:
            redacted_text = redact_pii(redacted_text)

        filtered_messages.append(
            Message(text=redacted_text, role=message.role)
        )

    session.messages = filtered_messages
    return session
```

### Data Retention

```python
def cleanup_old_sessions(retention_days: int = 30):
    """Delete sessions older than retention period"""

    cutoff = datetime.now() - timedelta(days=retention_days)

    for session_file in os.listdir("/tmp/openclaw_sessions/"):
        path = os.path.join("/tmp/openclaw_sessions/", session_file)
        if os.path.getmtime(path) < cutoff.timestamp():
            os.remove(path)
```

---

## Session State Example

Complete example of session evolution:

```
Turn 1:
  User: "Fix the slow API"
  Session.task_summary = "Diagnose and fix slow API"
  Routing: CodeGen (0.82 confidence)

Turn 2:
  CodeGen: "Database query is N+1. Needs redesign."
  Session.escalation_path = ["CodeGen"]
  Session.detected_issue = "N+1 query"

Turn 3:
  User: "How long will redesign take?"
  Session.previous_messages = [Turn 1, Turn 2]
  Routing: PM (0.85 confidence, escalation detected)

Turn 4:
  PM: "Estimated 2 days. Will coordinate CodeGen on implementation."
  Session.timeline_estimate = "2 days"
  Session.escalation_path = ["CodeGen", "PM"]

Turn 5:
  User: "Any security implications?"
  Session.full_context available to Security
  Routing: Security (0.88 confidence, multi-agent workflow)

Turn 6:
  Security: "No major concerns; recommend password hash update."
  Session.security_review_done = True
  Session.escalation_path = ["CodeGen", "PM", "Security"]

Turn 7:
  PM: "All gates passed. Deploying tomorrow."
  Session.implementation_complete = True
  Session.plan_approved = True
```

---

## Related Files

- [[domain-routing-strategy]] — Context in overall routing
- [[channel-slack]] — Slack thread context
- [[channel-discord]] — Discord thread context
- [[channel-telegram]] — Session storage for Telegram
- [[fallback-routing]] — Context affects fallback decisions

---

**Created:** 2026-02-18
**Status:** Production Ready
**Session Retention:** 30 days default
**Last verified:** 2026-02-18
