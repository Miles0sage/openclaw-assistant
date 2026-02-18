---
title: "Extending Agents (Adding New Agents)"
description: "How to add new agents to the routing system"
keywords: ["extending", "new-agents", "customization", "scaling"]
aliases: ["add-agents", "agent-extension", "custom-agents"]
type: "guide"
complexity: "moderate"
---

# Extending Agents — Adding New Agents to OpenClaw

## Overview

This guide explains how to add new agents to the OpenClaw routing system. The process involves:

1. Creating an agent claim file (markdown)
2. Defining agent skills and keywords
3. Updating the routing configuration
4. Testing the new agent

---

## Step 1: Create Agent Claim File

Agent claim files are markdown files with YAML frontmatter that define:
- Agent identity and role
- Keywords that trigger this agent
- Supported skills
- Complexity level handled

### 1A: File Naming
Create a file in `routing-knowledge/agents/` named:
```
agent-{agent-slug}.md
```

Example: `agent-database-specialist.md`

### 1B: Frontmatter (Required)

```yaml
---
title: "Agent Name (Brief Description)"
description: "150-char summary of what this agent does"
keywords: ["keyword1", "keyword2", "keyword3"]  # Primary detection keywords
aliases: ["alternative-name", "nickname"]
type: "claim"
model: "Model name (e.g., Claude Opus, Ollama Qwen)"
agentId: "internal_identifier"  # Used in routing
complexity: "simple|moderate|complex"
relatedAgents: ["pm", "codegen", "security"]  # Which agents this works with
relatedChannels: ["slack", "discord", "web"]  # Best channels
---
```

### 1C: Content Structure

```markdown
# Agent Name — Role Title

## Role
[2-3 sentence summary of what this agent does]

**Model:** [Agent model/LLM]
**Availability:** [Always/on-demand/high-priority]
**Response time:** [Fast/Medium/Thorough]

---

## Primary Responsibilities

### 1. [Responsibility 1]
[Description + examples]

### 2. [Responsibility 2]
[Description + examples]

[More responsibilities...]

---

## Keyword Patterns

**Strong signals** (high confidence):
```
keyword1, keyword2, keyword3, ...
```

**Confidence scoring:**
- Single keyword: +X to base score
- Multiple keywords: +Y (multiplicative)
- Domain context: +Z

---

## Agent Skills

| Skill | Description |
|-------|-------------|
| **Skill 1** | What it does |
| **Skill 2** | What it does |

---

## Complexity Level

**Specialized for:** SIMPLE/MODERATE/COMPLEX

[Explanation of when to use this agent]

---

## Integration with Other Agents

### Agent + [[Other Agent]]
[How they work together]

---

## Quality Metrics

**What good routing looks like:**
- ✅ Condition 1
- ✅ Condition 2

**What bad routing looks like:**
- ❌ Condition 1

---

## Related Files

- [[domain-routing-strategy]]
- [[agent-pm]], [[agent-codegen]]

---
```

---

## Step 2: Example — Adding a Database Agent

### Step 2A: Create the Claim File

Create `/root/openclaw-assistant/routing-knowledge/agents/agent-database.md`:

```markdown
---
title: "Database Agent (Data Specialist)"
description: "Queries databases, optimizes performance, manages schemas"
keywords: ["query", "sql", "database", "schema", "optimize", "index", "performance"]
aliases: ["db-agent", "data-specialist"]
type: "claim"
model: "Claude Sonnet 3.5"
agentId: "database_agent"
complexity: "moderate"
relatedAgents: ["codegen", "security"]
relatedChannels: ["slack", "discord", "telegram"]
---

# Database Agent — Data Specialist

## Role

The Database Agent specializes in **database operations, query optimization, schema design, and data analysis**. It acts as the expert for all data-related tasks and works closely with CodeGen for application-level integration.

**Model:** Claude Sonnet 3.5
**Availability:** High throughput
**Response time:** Fast (optimized for queries)

---

## Primary Responsibilities

### 1. Query Execution & Optimization
- Writing and optimizing SQL queries
- Performance tuning and indexing
- Explaining query plans

### 2. Schema Design
- Designing database schemas
- Normalization and relationships
- Migration planning

### 3. Data Analysis
- Aggregations and reporting
- Trend analysis
- Data quality checks

---

## Keyword Patterns

**Strong signals:**
```
query, sql, database, schema, optimize, index, select,
insert, update, delete, join, aggregate, transaction
```

**Confidence boost:** +0.5 per database keyword

---

## Agent Skills

| Skill | Description |
|-------|-------------|
| **SQL** | Writing optimized SQL queries |
| **Schema Design** | Designing normalized database schemas |
| **Performance** | Query optimization and indexing |
| **Analysis** | Data aggregation and reporting |

---

## Complexity Level

**Specialized for:** MODERATE

Database agent handles data queries and basic optimization.
Complex schema redesigns → escalate to PM + Database Agent.

---

## Integration with Other Agents

### Database Agent + [[agent-codegen]]
CodeGen writes application code; Database Agent optimizes queries.

### Database Agent + [[agent-pm]]
PM coordinates schema migrations; Database Agent executes.

---

## Related Files

- [[keyword-matching-strategy]] — Database keywords
- [[agent-codegen]] — Implementation partner

---
```

---

## Step 3: Update Routing Configuration

### 3A: Add Agent to routing_adapter.py

Edit `/root/openclaw-assistant/src/routing_adapter.py`:

```python
# Add keywords to class definition
DATABASE_KEYWORDS = [
    "query", "sql", "database", "schema", "optimize", "index",
    "select", "insert", "update", "delete", "join", "aggregate"
]

# In _extract_keywords method, add:
for keyword in self.DATABASE_KEYWORDS:
    if self._match_keyword(normalized, keyword):
        keywords["database"].append(keyword)

# In AGENT_MAP, add:
agent_map = {
    "security": "hacker_agent",
    "development": "coder_agent",
    "planning": "project_manager",
    "database": "database_agent",  # NEW
}
```

### 3B: Add Keywords to Domain Scores

```python
# In _calculate_domain_scores, add:
# Database
if keywords["database"]:
    base_score = 0.5
    multiplier = 1.0 + (len(keywords["database"]) * 0.06)
    scores["database"] = min(0.98, base_score * multiplier)
```

---

## Step 4: Testing

### 4A: Unit Tests

```python
# test_database_agent.py
import pytest
from routing_adapter import SkillGraphRouter

@pytest.fixture
def router():
    return SkillGraphRouter()

def test_database_routing(router):
    """Test database agent routing"""
    result = router.route("Query orders from Q4")
    assert result.agentId == "database_agent"
    assert result.confidence > 0.80

def test_database_escalation(router):
    """Test escalation from database to PM"""
    result = router.route("Redesign the entire database schema")
    assert result.agentId == "project_manager"  # Escalates due to complexity
    assert result.complexity == "complex"

def test_database_with_security(router):
    """Test database with security implications"""
    result = router.route("Query encrypted customer data securely")
    # Security keywords take priority
    assert result.agentId == "hacker_agent" or result.agentId == "database_agent"
```

### 4B: Manual Testing

```bash
python3 -c "
from src.routing_adapter import select_agent

# Test database queries
result = select_agent('What orders were created in January?')
print('Query test:', result['agentId'])

# Test optimization
result = select_agent('Optimize this slow SQL query')
print('Optimization test:', result['agentId'])

# Test schema
result = select_agent('Design a users table with authentication')
print('Schema test:', result['agentId'])
"
```

---

## Step 5: Integration Checklist

Before deploying new agent:

- [ ] Agent claim file created (`agents/agent-*.md`)
- [ ] Frontmatter complete (keywords, model, agentId, complexity)
- [ ] Keywords defined and documented
- [ ] Updated routing_adapter.py with new keywords
- [ ] Updated domain scores calculation
- [ ] Updated AGENT_MAP
- [ ] Unit tests created and passing
- [ ] Manual tests completed
- [ ] Related agent integrations documented
- [ ] Updated domain-routing-strategy.md (optional, for visibility)

---

## Advanced: Specialized Agent Categories

### Pattern 1: Specialist Agent
Handles one specific domain really well.

**Example:** Database Agent
```yaml
complexity: "moderate"
keywords: ["sql", "query", "database", "schema"]
relatedAgents: ["codegen", "pm"]
```

### Pattern 2: Coordinator Agent
Orchestrates multiple other agents.

**Example:** PM Agent (already exists)
```yaml
complexity: "complex"
keywords: ["plan", "estimate", "coordinate"]
relatedAgents: ["codegen", "security", "database"]
```

### Pattern 3: Reviewer Agent
Reviews work from other agents.

**Example:** Quality Assurance Agent (hypothetical)
```yaml
complexity: "moderate"
keywords: ["review", "audit", "test", "quality"]
relatedAgents: ["codegen", "security", "database"]
```

---

## Troubleshooting New Agent Routing

### Problem: Agent Not Being Selected
1. Check keywords are in the file
2. Verify keywords are extracted correctly: `router._extract_keywords("test query")`
3. Check domain scores: `router._calculate_domain_scores(keywords)`
4. Verify agent_map includes new agent

### Problem: Wrong Confidence Score
1. Review keyword weights in CONFIDENCE_SCORING
2. Check for conflicting keywords (security overrides others)
3. Test complexity assessment separately

### Problem: Conflicts with Existing Agents
1. Check keyword overlap with other agents
2. Adjust priority rules in `_select_agent()`
3. Document integration path in [[domain-routing-strategy]]

---

## Example: Multi-Agent Workflow with New Database Agent

```
User (Slack): "Build a real-time analytics dashboard"
  ├─ Keywords: ["build", "analytics", "real-time", "dashboard"]
  ├─ Complexity: "moderate"
  └─ Routing: PM (planning)

PM (Response): "This needs coordination:
  1. Database: design analytics schema
  2. CodeGen: build API + frontend
  3. Security: audit data access
  "

Database Agent: Designs schema for analytics data
CodeGen: Builds API and dashboard
Security: Audits data access patterns
PM: Coordinates phases and timeline
```

---

## Related Files

- [[index.md]] — Main hub
- [[domain-routing-strategy.md]] — Overall routing framework
- [[agent-pm.md]], [[agent-codegen.md]], [[agent-security.md]] — Existing agents
- [[router-integration-guide.md]] — Integration details

---

**Created:** 2026-02-18
**Status:** Production Ready
**Last verified:** 2026-02-18
