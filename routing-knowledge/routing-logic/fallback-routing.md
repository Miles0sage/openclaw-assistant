---
title: "Fallback Routing & Escalation"
description: "How to handle low-confidence routing and escalate to appropriate agents"
keywords: ["fallback", "escalation", "low-confidence", "human-review", "ambiguity"]
aliases: ["escalation-logic", "low-confidence-routing", "exception-handling"]
type: "guide"
complexity: "simple"
relatedAgents: ["pm", "codegen", "security"]
---

# Fallback Routing & Escalation

## Overview

Fallback routing handles cases where the confidence score is low (<0.6) or signals are ambiguous. This document defines:
1. Low-confidence fallback rules
2. Escalation paths
3. Multi-agent coordination
4. Human review triggers

---

## Confidence Threshold Rules

### Confidence Tiers

| Tier | Confidence | Action |
|------|-----------|--------|
| **High** | >0.85 | Route directly to agent |
| **Medium** | 0.60-0.85 | Route with override option |
| **Low** | <0.60 | Escalate or fallback |

---

## Low-Confidence Fallback Rules

### Rule 1: Confidence <0.60 → Ask for Clarification
If no domain has >0.60 confidence, ask user to clarify intent.

```python
def low_confidence_fallback(query: str, scores: dict):
    if max(scores.values()) < 0.60:
        return {
            "action": "clarify",
            "message": "I'm not sure which agent is best for this. Can you clarify? Are you asking about: (1) Planning, (2) Implementation, (3) Security, or (4) Data?",
            "agent": None
        }
```

**Example:**
```
User: "The thing is weird"
Extracted keywords: None/unclear
Scores: All <0.60
Response: "I'm not sure what you're asking. Are you experiencing a bug,
          planning a feature, or asking about security?"
```

### Rule 2: Multiple High Scores → Route to PM for Triage
If two domains have similar high scores (within 0.1), escalate to PM.

```python
def multi_domain_conflict(scores: dict):
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    if len(sorted_scores) >= 2:
        score_diff = sorted_scores[0][1] - sorted_scores[1][1]
        if score_diff < 0.1 and sorted_scores[0][1] > 0.70:
            return {
                "action": "escalate_to_pm",
                "reason": "Multi-domain match; PM will triage",
                "candidate_agents": sorted_scores[:2],
                "agent": "project_manager"
            }
```

**Example:**
```
Query: "Implement a secure API"
Dev score: 0.75 (implement, api)
Security score: 0.70 (secure)
Difference: 0.05 (< 0.1 threshold)
Action: Escalate to PM
Response: "This involves both implementation and security.
          Let me get our PM to coordinate CodeGen and Security review."
```

### Rule 3: Ambiguous Scope → Default to PM
If user hasn't specified scope, default to PM for breakdown.

```python
def ambiguous_scope(query: str):
    vague_words = ["fix", "check", "help", "look at", "why"]
    if any(word in query.lower() for word in vague_words):
        if len(query) < 50:  # Short query = likely ambiguous
            return ("project_manager", 0.65)
```

**Example:**
```
Query: "Help with this"
Scope: Ambiguous
Response: "I need more details. Can you describe:
          (1) What's the issue? (2) What's the impact? (3) What's the timeline?"
Agent: PM (with clarification request)
```

---

## Escalation Paths

### Escalation 1: Simple → Moderate
When CodeGen encounters moderate-complexity work during simple task:

```python
def escalate_simple_to_moderate(initial_analysis: str) -> str:
    """
    Example: User asked for "quick fix" but it requires refactoring.
    """
    return {
        "original_agent": "codegen",
        "escalated_to": "project_manager",
        "reason": "Initial diagnosis shows this is more complex than a simple fix",
        "recommendation": "PM will scope full effort and coordinate"
    }
```

**Example:**
```
User: "Fix the slow login"
CodeGen diagnosis: "This isn't just slow—the entire auth flow needs redesign"
CodeGen escalation: "@pm_agent This needs planning; can you estimate?"
PM takes over: Coordinates full auth redesign
```

### Escalation 2: Development → Security
When CodeGen detects security concerns:

```python
def escalate_dev_to_security(concern: str) -> str:
    """
    Example: Implementation has security implications.
    """
    return {
        "original_agent": "codegen",
        "escalated_to": "hacker_agent",
        "reason": f"Security concern detected: {concern}",
        "timeline": "Security review before production deployment"
    }
```

**Example:**
```
User: "Implement password reset flow"
CodeGen: "I've built the basic flow, but security implications need review.
         @security_agent Can you audit for CSRF, token handling, email validation?"
Security: Audits implementation and approves/recommends changes
```

### Escalation 3: Development → PM (Scope Too Large)
When CodeGen realizes scope exceeds simple implementation:

```python
def escalate_dev_to_pm(scope: str):
    return {
        "original_agent": "codegen",
        "escalated_to": "project_manager",
        "reason": "Scope requires decomposition and coordination",
        "example": "Feature requires 3 engineers for 2 weeks; needs planning"
    }
```

**Example:**
```
User: "Build a real-time notification system"
CodeGen: "This is bigger than I initially thought. Needs:
         - WebSocket setup (backend)
         - Frontend notification UI
         - Database schema for notification queue
         - Testing strategy
         This is a 2-week project; @pm_agent can you plan this?"
PM: Creates detailed plan, coordinates with CodeGen on implementation
```

---

## Multi-Agent Coordination Triggers

### Trigger 1: Code Review (CodeGen + Security)
When implementation needs security audit:

```python
trigger_condition = (
    keywords.contains("implement") and
    keywords.contains("security") or
    agent_request == "review"
)

workflow = {
    "step1": "CodeGen implements feature",
    "step2": "Security audits code",
    "step3": "CodeGen addresses security concerns",
    "step4": "Security final approval"
}
```

### Trigger 2: Feature Development (PM + CodeGen)
When feature requires planning + implementation:

```python
trigger_condition = (
    complexity == "moderate" or "complex" and
    keywords.contains("implement")
)

workflow = {
    "step1": "PM breaks down feature into tasks",
    "step2": "CodeGen implements each task",
    "step3": "PM validates against requirements",
    "step4": "CodeGen deploys"
}
```

### Trigger 3: Security Incident (PM + CodeGen + Security)
When security issue affects production:

```python
trigger_condition = (
    keywords.contains("vulnerability") or "exploit" and
    keywords.contains("production")
)

workflow = {
    "step1": "Security assesses risk (critical/high/medium)",
    "step2": "PM coordinates response timeline",
    "step3": "CodeGen implements fix",
    "step4": "Security verifies fix",
    "step5": "PM coordinates deployment"
}
```

---

## Ambiguity Resolution Examples

### Example 1: "Fix This"
```
Query: "Fix this" (with code snippet attached)

Step 1: Extract context
  • Code snippet → technical
  • "Fix" keyword → development
  • No scope → ambiguous

Step 2: Assess confidence
  Score: 0.65 (medium confidence)

Step 3: Action
  Confidence >= 0.60 → Route to CodeGen
  CodeGen: "I can help. What's the error? Are you seeing a specific message?"

If more context needed:
  CodeGen: "This might be bigger than I thought. Can you provide:
           - Error message
           - Steps to reproduce
           - What did you expect?"
```

### Example 2: "Secure This"
```
Query: "Secure this API"

Step 1: Extract context
  • "Secure" keyword → security
  • "API" keyword → development
  • Scope: Ambiguous (what aspect of security?)

Step 2: Assess confidence
  Security: 0.65
  Development: 0.60
  Difference: 0.05 (close!)

Step 3: Action
  Escalate to PM (multi-domain conflict)
  PM: "This needs both development hardening and security audit. Let me coordinate.
       First, @security_agent threat model this API. Then @codegen implements recommendations."
```

### Example 3: "Plan the Rewrite"
```
Query: "Plan the rewrite"

Step 1: Extract context
  • "Plan" keyword → planning
  • "Rewrite" keyword → architecture change
  • Scope: Implies complexity

Step 2: Assess confidence
  Planning: 0.85 (high confidence)

Step 3: Action
  Route to PM (0.85 confidence)
  PM: "Let me break this down. Can you tell me:
       1. Current pain points with existing system?
       2. Timeline expectations?
       3. What systems depend on this?"

  (After clarification)
  PM creates detailed plan → CodeGen implements by phase → Security reviews
```

---

## Human Review Triggers

Request human review (escalate to Slack/Discord team) when:

| Trigger | Condition | Action |
|---------|-----------|--------|
| **Conflict** | Multiple agents disagree on approach | Bring to team discussion |
| **High Risk** | Security + large scope + tight deadline | Human decision on trade-offs |
| **Ambiguous Requirements** | User can't clarify intent | Schedule alignment meeting |
| **Resource Constraint** | Estimated effort > available capacity | Plan sprint/phasing |
| **Compliance Question** | GDPR/CCPA/SOC2 implications unclear | Legal/compliance review |
| **Production Issue** | Customer-facing bug with no clear fix | Incident response team |

```python
def trigger_human_review(routing_result: dict) -> bool:
    """Check if human review should be requested"""

    # High risk: security + large scope
    if routing_result["agent"] == "hacker_agent" and complexity == "complex":
        return True

    # Multiple agents needed with conflicting recommendations
    if len(routing_result.get("candidate_agents", [])) > 2:
        return True

    # Production issue
    if "production" in query.lower() and "issue" in query.lower():
        return True

    return False
```

---

## Fallback Routing Algorithm (Complete)

```python
def route_with_fallback(query: str, context: dict = None) -> dict:
    """
    Route with fallback handling for low confidence.
    """

    # Step 1: Extract keywords
    keywords = extract_keywords(query)
    scores = calculate_domain_scores(keywords)

    # Step 2: Check confidence
    max_confidence = max(scores.values())

    # Step 3: Apply fallback rules
    if max_confidence < 0.60:
        # Low confidence → ask for clarification
        return {
            "action": "clarify",
            "message": "Can you provide more context? Are you asking about planning, implementation, security, or data?",
            "agent": None,
            "confidence": max_confidence
        }

    # Check for multi-domain conflict
    sorted_domains = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    if len(sorted_domains) >= 2:
        score_diff = sorted_domains[0][1] - sorted_domains[1][1]
        if score_diff < 0.1 and sorted_domains[0][1] > 0.70:
            # Multi-domain conflict → PM triage
            return {
                "action": "route",
                "agent": "project_manager",
                "confidence": 0.75,
                "reason": "Multi-domain match; PM will coordinate"
            }

    # Step 4: Route to best agent
    winning_domain = sorted_domains[0][0]
    agent = DOMAIN_TO_AGENT[winning_domain]
    confidence = sorted_domains[0][1]

    return {
        "action": "route",
        "agent": agent,
        "confidence": confidence,
        "domain": winning_domain
    }
```

---

## Related Files

- [[domain-routing-strategy]] — Fallback in overall routing
- [[task-complexity-assessment]] — Complexity affects escalation
- [[keyword-matching-strategy]] — Keyword confidence affects fallback
- [[context-preservation]] — Maintaining context during escalation
- [[agent-pm]] — PM handles escalations

---

**Created:** 2026-02-18
**Status:** Production Ready
**Last verified:** 2026-02-18
