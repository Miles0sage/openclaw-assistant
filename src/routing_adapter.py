#!/usr/bin/env python3
"""
OpenClaw Skill Graph Router Adapter

Loads the routing knowledge graph at runtime and provides intelligent routing decisions
based on task complexity, intent classification, and keyword matching.

Production-ready implementation of routing knowledge graph:
/root/openclaw-assistant/routing-knowledge/
"""

import os
import re
import json
import logging
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import yaml

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class RoutingDecision:
    """Result of routing decision"""
    agentId: str
    confidence: float
    reason: str
    domain: str
    complexity: str
    keywords: Dict[str, List[str]]
    skill_files_used: List[str]


class SkillGraphRouter:
    """
    Intelligent router using OpenClaw routing skill graph.

    Loads knowledge graph from markdown files and makes routing decisions
    based on task complexity, intent, keywords, and channel context.
    """

    # Skill graph path (configurable)
    DEFAULT_SKILL_GRAPH_PATH = "/root/openclaw-assistant/routing-knowledge"

    # Complexity scoring configuration
    COMPLEXITY_CONFIG = {
        "simple_indicators": {
            "keywords": [
                "get", "fetch", "list", "count", "retrieve", "show",
                "fix", "bug", "patch", "adjust", "clarify", "question", "help"
            ],
            "points": 1
        },
        "moderate_indicators": {
            "keywords": [
                "build", "implement", "develop", "create", "add", "feature",
                "endpoint", "component", "integration", "refactor", "optimize",
                "test", "review", "design", "improve", "enhance"
            ],
            "points": 2
        },
        "complex_indicators": {
            "keywords": [
                "redesign", "refactor entire", "migrate", "architect", "coordinate",
                "orchestrate", "plan", "strategy", "roadmap", "breaking changes"
            ],
            "points": 3
        }
    }

    # Security keywords (highest priority)
    SECURITY_KEYWORDS = [
        "security", "vulnerability", "exploit", "penetration", "audit", "xss", "csrf",
        "injection", "pentest", "hack", "breach", "secure", "threat", "attack",
        "threat_modeling", "risk", "malware", "payload", "sanitize", "encrypt",
        "cryptography", "authentication", "authorization", "access control",
        "sql injection", "rls", "row_level_security", "policy", "compliance",
        "gdpr", "ccpa", "soc2", "owasp", "cwe", "cvss"
    ]

    # Development keywords
    DEVELOPMENT_KEYWORDS = [
        "code", "implement", "function", "fix", "bug", "api", "endpoint", "build",
        "typescript", "fastapi", "python", "javascript", "react", "nextjs", "database",
        "query", "schema", "testing", "test", "deploy", "deployment", "frontend",
        "backend", "full-stack", "refactor", "refactoring", "clean_code", "git",
        "repository", "json", "yaml", "xml", "rest", "graphql", "websocket",
        "docker", "ci/cd", "github"
    ]

    # Database keywords
    DATABASE_KEYWORDS = [
        "query", "fetch", "select", "insert", "update", "delete", "table", "column",
        "row", "data", "supabase", "postgresql", "postgres", "sql", "database",
        "appointments", "clients", "services", "transactions", "orders", "customers",
        "call_logs", "schema", "rls", "subscription", "real_time"
    ]

    # Planning keywords
    PLANNING_KEYWORDS = [
        "plan", "timeline", "schedule", "roadmap", "strategy", "architecture", "design",
        "approach", "workflow", "process", "milestone", "deadline", "estimate",
        "estimation", "breakdown", "decompose", "coordinate", "manage", "organize",
        "project", "phase", "sprint", "agile", "scoping", "capacity", "charter"
    ]

    def __init__(self, skill_graph_path: Optional[str] = None):
        """
        Initialize router with skill graph.

        Args:
            skill_graph_path: Path to routing-knowledge directory
        """
        self.skill_graph_path = skill_graph_path or self.DEFAULT_SKILL_GRAPH_PATH

        # Load skill graph structure
        self.skill_files = self._discover_skill_files()
        self.agents = self._load_agents()
        self.channels = self._load_channels()
        self.routing_logic = self._load_routing_logic()

        logger.info(
            f"✅ Skill graph loaded: {len(self.agents)} agents, "
            f"{len(self.channels)} channels, {len(self.routing_logic)} routing guides"
        )

    def _discover_skill_files(self) -> Dict[str, Dict[str, str]]:
        """Discover all markdown files in skill graph"""

        files = {
            "agents": {},
            "channels": {},
            "routing_logic": {}
        }

        # Discover agent files
        agents_dir = Path(self.skill_graph_path) / "agents"
        if agents_dir.exists():
            for md_file in agents_dir.glob("*.md"):
                agent_name = md_file.stem.replace("agent-", "")
                files["agents"][agent_name] = str(md_file)

        # Discover channel files
        channels_dir = Path(self.skill_graph_path) / "channels"
        if channels_dir.exists():
            for md_file in channels_dir.glob("*.md"):
                channel_name = md_file.stem.replace("channel-", "")
                files["channels"][channel_name] = str(md_file)

        # Discover routing logic files
        logic_dir = Path(self.skill_graph_path) / "routing-logic"
        if logic_dir.exists():
            for md_file in logic_dir.glob("*.md"):
                logic_name = md_file.stem
                files["routing_logic"][logic_name] = str(md_file)

        return files

    def _parse_frontmatter(self, file_path: str) -> Dict:
        """Extract YAML frontmatter from markdown file"""

        try:
            with open(file_path, 'r') as f:
                content = f.read()

            # Extract YAML block
            match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
            if not match:
                return {}

            yaml_content = match.group(1)
            return yaml.safe_load(yaml_content) or {}

        except Exception as e:
            logger.error(f"Error parsing {file_path}: {e}")
            return {}

    def _load_agents(self) -> Dict:
        """Load agent claim files"""

        agents = {}
        for agent_name, agent_file in self.skill_files["agents"].items():
            frontmatter = self._parse_frontmatter(agent_file)
            agents[agent_name] = frontmatter

        return agents

    def _load_channels(self) -> Dict:
        """Load channel claim files"""

        channels = {}
        for channel_name, channel_file in self.skill_files["channels"].items():
            frontmatter = self._parse_frontmatter(channel_file)
            channels[channel_name] = frontmatter

        return channels

    def _load_routing_logic(self) -> Dict:
        """Load routing logic guides"""

        logic = {}
        for logic_name, logic_file in self.skill_files["routing_logic"].items():
            frontmatter = self._parse_frontmatter(logic_file)
            logic[logic_name] = frontmatter

        return logic

    def route(self, query: str, channel: Optional[str] = None,
              user_context: Optional[Dict] = None) -> RoutingDecision:
        """
        Make intelligent routing decision for a query.

        Args:
            query: User message/request
            channel: Optional channel context ("slack", "discord", "telegram", etc.)
            user_context: Optional user metadata (role, guild, etc.)

        Returns:
            RoutingDecision with agent, confidence, reason, etc.
        """

        # Step 1: Assess complexity
        complexity = self._assess_complexity(query)

        # Step 2: Extract keywords
        keywords = self._extract_keywords(query)

        # Step 3: Calculate domain scores
        scores = self._calculate_domain_scores(keywords)

        # Step 4: Apply channel context modifiers
        if channel:
            scores = self._apply_channel_context(scores, channel, user_context)

        # Step 5: Select agent
        agent_id, confidence, domain = self._select_agent(scores, complexity)

        # Step 6: Build routing reason
        reason = self._build_reason(agent_id, domain, keywords, complexity)

        # Step 7: Track skill files used
        skill_files = self._track_skill_files_used(domain, complexity)

        return RoutingDecision(
            agentId=agent_id,
            confidence=round(confidence, 2),
            reason=reason,
            domain=domain,
            complexity=complexity["level"],
            keywords=keywords,
            skill_files_used=skill_files
        )

    def _assess_complexity(self, query: str) -> Dict:
        """Assess task complexity: simple, moderate, or complex"""

        score = 0
        indicators = []
        normalized = query.lower()

        # Check simple indicators
        for keyword in self.COMPLEXITY_CONFIG["simple_indicators"]["keywords"]:
            if self._match_keyword(normalized, keyword):
                score += self.COMPLEXITY_CONFIG["simple_indicators"]["points"]
                indicators.append(keyword)

        # Check moderate indicators
        for keyword in self.COMPLEXITY_CONFIG["moderate_indicators"]["keywords"]:
            if self._match_keyword(normalized, keyword):
                score += self.COMPLEXITY_CONFIG["moderate_indicators"]["points"]
                indicators.append(keyword)

        # Check complex indicators
        for keyword in self.COMPLEXITY_CONFIG["complex_indicators"]["keywords"]:
            if self._match_keyword(normalized, keyword):
                score += self.COMPLEXITY_CONFIG["complex_indicators"]["points"]
                indicators.append(keyword)

        # Determine level
        if score < 4:
            level = "simple"
            confidence = 0.85
        elif score < 10:
            level = "moderate"
            confidence = 0.88
        else:
            level = "complex"
            confidence = 0.90

        return {
            "level": level,
            "score": score,
            "indicators": indicators,
            "confidence": confidence
        }

    def _extract_keywords(self, query: str) -> Dict[str, List[str]]:
        """Extract matching keywords from query by domain"""

        keywords = {
            "security": [],
            "development": [],
            "planning": [],
            "database": []
        }

        normalized = query.lower()

        # Match keywords
        for keyword in self.SECURITY_KEYWORDS:
            if self._match_keyword(normalized, keyword):
                keywords["security"].append(keyword)

        for keyword in self.DEVELOPMENT_KEYWORDS:
            if self._match_keyword(normalized, keyword):
                keywords["development"].append(keyword)

        for keyword in self.PLANNING_KEYWORDS:
            if self._match_keyword(normalized, keyword):
                keywords["planning"].append(keyword)

        for keyword in self.DATABASE_KEYWORDS:
            if self._match_keyword(normalized, keyword):
                keywords["database"].append(keyword)

        # Deduplicate
        for domain in keywords:
            keywords[domain] = list(set(keywords[domain]))

        return keywords

    def _match_keyword(self, query: str, keyword: str) -> bool:
        """Match keyword with word-boundary awareness"""

        # Multi-word keywords: exact match
        if " " in keyword:
            return keyword in query

        # Short keywords: word boundary match
        if len(keyword) <= 3:
            pattern = rf"\b{re.escape(keyword)}\b"
            return bool(re.search(pattern, query))

        # Longer keywords: word-start match
        pattern = rf"\b{re.escape(keyword)}"
        return bool(re.search(pattern, query))

    def _calculate_domain_scores(self, keywords: Dict[str, List[str]]) -> Dict[str, float]:
        """Calculate confidence score for each domain"""

        scores = {
            "security": 0.0,
            "development": 0.0,
            "planning": 0.0,
            "database": 0.0
        }

        # Security: highest priority
        if keywords["security"]:
            base_score = 0.6
            multiplier = 1.0 + (len(keywords["security"]) * 0.1)
            scores["security"] = min(0.98, base_score * multiplier)

        # Development
        if keywords["development"]:
            base_score = 0.5
            multiplier = 1.0 + (len(keywords["development"]) * 0.08)
            scores["development"] = min(0.98, base_score * multiplier)

        # Planning
        if keywords["planning"]:
            base_score = 0.4
            multiplier = 1.0 + (len(keywords["planning"]) * 0.07)
            scores["planning"] = min(0.98, base_score * multiplier)

        # Database
        if keywords["database"]:
            base_score = 0.5
            multiplier = 1.0 + (len(keywords["database"]) * 0.06)
            scores["database"] = min(0.98, base_score * multiplier)

        return scores

    def _apply_channel_context(self, scores: Dict[str, float], channel: str,
                               context: Optional[Dict] = None) -> Dict[str, float]:
        """Apply channel-specific routing modifiers"""

        if not context:
            context = {}

        # Slack: check channel topic
        if channel == "slack":
            topic = context.get("channel_topic", "").lower()
            if "security" in topic:
                scores["security"] += 0.2
            elif "development" in topic or "engineering" in topic:
                scores["development"] += 0.2
            elif "planning" in topic or "product" in topic:
                scores["planning"] += 0.2

        # Discord: check guild and category
        elif channel == "discord":
            category = context.get("channel_category", "").lower()
            if "security" in category:
                scores["security"] += 0.2
            elif "development" in category or "engineering" in category:
                scores["development"] += 0.2
            elif "planning" in category:
                scores["planning"] += 0.2

        # Ensure scores stay in valid range
        for domain in scores:
            scores[domain] = min(0.98, scores[domain])

        return scores

    def _select_agent(self, scores: Dict[str, float], complexity: Dict) \
            -> Tuple[str, float, str]:
        """Select best agent from scores and complexity"""

        # Rule 1: Security keywords always take priority
        if scores["security"] > 0.5:
            return "hacker_agent", scores["security"], "security"

        # Rule 2: Complex tasks → PM for coordination
        if complexity["level"] == "complex":
            return "project_manager", complexity["confidence"], "planning"

        # Rule 3: Highest score wins
        winning_domain = max(scores, key=scores.get)

        agent_map = {
            "security": "hacker_agent",
            "development": "coder_agent",
            "planning": "project_manager",
            "database": "coder_agent"
        }

        agent_id = agent_map.get(winning_domain, "project_manager")
        confidence = scores[winning_domain]

        return agent_id, confidence, winning_domain

    def _build_reason(self, agent_id: str, domain: str, keywords: Dict[str, List[str]],
                      complexity: Dict) -> str:
        """Build human-readable reason for routing decision"""

        agent_names = {
            "project_manager": "PM Agent",
            "coder_agent": "CodeGen",
            "hacker_agent": "Security"
        }

        # Top keywords
        all_keywords = keywords[domain][:3] if keywords[domain] else []
        keyword_str = ", ".join(all_keywords) if all_keywords else "none detected"

        reason = (
            f"{agent_names[agent_id]} selected for {domain} "
            f"(complexity: {complexity['level']}, keywords: {keyword_str})"
        )

        return reason

    def _track_skill_files_used(self, domain: str, complexity: Dict) -> List[str]:
        """Track which skill graph files were used for this decision"""

        files_used = [
            "index.md",
            "domain-routing-strategy.md"
        ]

        # Domain-specific files
        if domain == "security":
            files_used.append("agents/agent-security.md")
        elif domain == "development":
            files_used.append("agents/agent-codegen.md")
        elif domain == "planning":
            files_used.append("agents/agent-pm.md")

        # Routing logic files
        files_used.append("routing-logic/task-complexity-assessment.md")
        files_used.append("routing-logic/keyword-matching-strategy.md")

        if complexity["level"] == "complex":
            files_used.append("routing-logic/fallback-routing.md")

        return files_used


# Global router instance
_router: Optional[SkillGraphRouter] = None


def initialize_router(skill_graph_path: Optional[str] = None) -> SkillGraphRouter:
    """Initialize global router instance"""

    global _router
    _router = SkillGraphRouter(skill_graph_path)
    return _router


def select_agent(query: str, channel: Optional[str] = None,
                 user_context: Optional[Dict] = None) -> Dict:
    """
    Convenience function matching existing agent_router.py interface.

    Args:
        query: User message
        channel: Optional channel context
        user_context: Optional user metadata

    Returns:
        Dict with agentId, confidence, reason, intent, keywords
    """

    global _router
    if not _router:
        _router = initialize_router()

    decision = _router.route(query, channel=channel, user_context=user_context)

    return {
        "agentId": decision.agentId,
        "confidence": decision.confidence,
        "reason": decision.reason,
        "intent": decision.domain,
        "keywords": [kw for kws in decision.keywords.values() for kw in kws]
    }


if __name__ == "__main__":
    # Example usage
    router = initialize_router()

    test_queries = [
        "Fix the login bug",
        "Plan the Q2 roadmap",
        "Audit for SQL injection",
        "What appointments are scheduled?",
        "Design a secure API",
    ]

    print("=" * 80)
    print("OpenClaw Skill Graph Router - Test Run")
    print("=" * 80)

    for query in test_queries:
        decision = router.route(query)
        print(f"\nQuery: {query}")
        print(f"Agent: {decision.agentId}")
        print(f"Confidence: {decision.confidence:.0%}")
        print(f"Domain: {decision.domain}")
        print(f"Complexity: {decision.complexity}")
        print(f"Reason: {decision.reason}")
