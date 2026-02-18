/**
 * Router Engine - Main routing logic using skill graph and keyword matching
 * Loads skill graph from D1 or falls back to static config
 */

import { KeywordMatcher, AgentScore } from "./keyword-matcher";
import { ComplexityClassifier, ComplexityAssessment } from "./complexity-classifier";

export interface Agent {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  domains: string[];
  costPerToken?: number;
  maxTokens?: number;
  enabled: boolean;
}

export interface RoutingDecision {
  agent: string;
  confidence: number;
  reason: string;
  skillFilesUsed: string[];
  estimatedCost: number;
  complexity: string;
  latency: number;
  timestamp: string;
  matchedKeywords: string[];
  fallbackReason?: string;
}

export interface SkillFile {
  id: string;
  name: string;
  agent: string;
  description: string;
  keywords: string[];
}

const STATIC_AGENTS: Agent[] = [
  {
    id: "codegen",
    name: "Code Generation Agent",
    description: "Expert in code implementation, debugging, and testing",
    keywords: [
      "implement",
      "build",
      "code",
      "debug",
      "test",
      "function",
      "api",
      "optimize",
      "refactor",
    ],
    domains: ["javascript", "typescript", "python", "rust", "go"],
    costPerToken: 0.003,
    maxTokens: 4000,
    enabled: true,
  },
  {
    id: "planning",
    name: "Planning & Strategy Agent",
    description: "Expert in project planning, roadmapping, and strategic thinking",
    keywords: [
      "plan",
      "strategy",
      "roadmap",
      "design",
      "architecture",
      "timeline",
      "proposal",
    ],
    domains: ["project management", "architecture"],
    costPerToken: 0.002,
    maxTokens: 8000,
    enabled: true,
  },
  {
    id: "security",
    name: "Security & Compliance Agent",
    description: "Expert in security analysis, threat modeling, and compliance",
    keywords: [
      "security",
      "vulnerability",
      "exploit",
      "threat",
      "penetration",
      "encryption",
      "compliance",
    ],
    domains: ["security", "compliance"],
    costPerToken: 0.004,
    maxTokens: 6000,
    enabled: true,
  },
  {
    id: "infrastructure",
    name: "Infrastructure & DevOps Agent",
    description: "Expert in infrastructure, deployment, and operations",
    keywords: [
      "infrastructure",
      "deploy",
      "cloud",
      "kubernetes",
      "docker",
      "ci/cd",
      "monitoring",
    ],
    domains: ["cloud", "devops", "kubernetes"],
    costPerToken: 0.003,
    maxTokens: 5000,
    enabled: true,
  },
];

const STATIC_SKILL_FILES: SkillFile[] = [
  {
    id: "task-complexity-assessment",
    name: "Task Complexity Assessment",
    agent: "planning",
    description: "Assess complexity and determine routing path",
    keywords: ["complexity", "assessment", "routing"],
  },
  {
    id: "agent-codegen",
    name: "Code Generation Strategies",
    agent: "codegen",
    description: "Strategies for code implementation",
    keywords: ["code", "generate", "implement"],
  },
  {
    id: "keyword-matching-strategy",
    name: "Keyword Matching Strategy",
    agent: "planning",
    description: "Strategy for keyword-based routing",
    keywords: ["matching", "strategy", "routing"],
  },
  {
    id: "security-threat-modeling",
    name: "Security Threat Modeling",
    agent: "security",
    description: "Threat modeling and risk assessment",
    keywords: ["threat", "security", "risk"],
  },
  {
    id: "infrastructure-deployment",
    name: "Infrastructure Deployment",
    agent: "infrastructure",
    description: "Deployment strategies and patterns",
    keywords: ["deploy", "infrastructure", "cloud"],
  },
];

const CONFIDENCE_THRESHOLDS = {
  high: 0.75,
  medium: 0.5,
  low: 0.3,
};

const FALLBACK_AGENT = "planning"; // Default to planning if unsure

export class RouterEngine {
  private agents: Map<string, Agent> = new Map();
  private skillFiles: Map<string, SkillFile> = new Map();

  constructor(
    private db?: D1Database,
    agents: Agent[] = STATIC_AGENTS,
    skillFiles: SkillFile[] = STATIC_SKILL_FILES
  ) {
    // Initialize agents
    agents.forEach((agent) => {
      this.agents.set(agent.id, agent);
    });

    // Initialize skill files
    skillFiles.forEach((skill) => {
      this.skillFiles.set(skill.id, skill);
    });
  }

  /**
   * Load agents from D1 database
   */
  async loadAgentsFromDB(): Promise<void> {
    if (!this.db) {
      console.log("No D1 database provided, using static agents");
      return;
    }

    try {
      const stmt = this.db.prepare(
        "SELECT * FROM agents WHERE enabled = 1 ORDER BY name"
      );
      const result = await stmt.all();

      for (const agent of result.results || []) {
        const agentObj = agent as unknown as Record<string, unknown>;
        this.agents.set(agentObj.id as string, {
          id: agentObj.id as string,
          name: agentObj.name as string,
          description: agentObj.description as string,
          keywords: JSON.parse((agentObj.keywords as string) || "[]"),
          domains: JSON.parse((agentObj.domains as string) || "[]"),
          costPerToken: agentObj.cost_per_token as number | undefined,
          maxTokens: agentObj.max_tokens as number | undefined,
          enabled: true,
        });
      }
      console.log(`Loaded ${this.agents.size} agents from D1`);
    } catch (err) {
      console.warn("Failed to load agents from D1, using static config:", err);
    }
  }

  /**
   * Load skill files from D1 database
   */
  async loadSkillFilesFromDB(): Promise<void> {
    if (!this.db) {
      console.log("No D1 database provided, using static skill files");
      return;
    }

    try {
      const stmt = this.db.prepare("SELECT * FROM skill_files ORDER BY name");
      const result = await stmt.all();

      for (const skill of result.results || []) {
        const skillObj = skill as unknown as Record<string, unknown>;
        this.skillFiles.set(skillObj.id as string, {
          id: skillObj.id as string,
          name: skillObj.name as string,
          agent: skillObj.agent as string,
          description: skillObj.description as string,
          keywords: JSON.parse((skillObj.keywords as string) || "[]"),
        });
      }
      console.log(`Loaded ${this.skillFiles.size} skill files from D1`);
    } catch (err) {
      console.warn("Failed to load skill files from D1:", err);
    }
  }

  /**
   * Main routing logic
   */
  async route(
    message: string,
    userId?: string,
    context?: Record<string, unknown>
  ): Promise<RoutingDecision> {
    const startTime = performance.now();

    // Score agents using keyword matching
    const agentScores = KeywordMatcher.scoreMessage(message);
    const confidence = KeywordMatcher.getConfidenceScore(agentScores);

    // Assess complexity
    const complexity = ComplexityClassifier.assessComplexity(message);

    // Get top agent
    const topScore = agentScores[0];
    let selectedAgent = topScore?.agent || FALLBACK_AGENT;

    // Apply complexity-based logic
    if (complexity.level === "complex" && selectedAgent !== "planning") {
      // Complex tasks might benefit from planning agent
      const planningScore = agentScores.find((a) => a.agent === "planning");
      if (planningScore && planningScore.score >= 20) {
        // If planning agent has reasonable score, route to planning for complex tasks
        selectedAgent = "planning";
      }
    }

    // Get matched keywords
    const matchedKeywords = topScore?.matches
      .slice(0, 5)
      .map((m) => m.keyword) || [];

    // Estimate cost
    const estimatedCost = this.estimateCost(selectedAgent, complexity);

    // Find relevant skill files
    const skillFilesUsed = this.findRelevantSkills(
      selectedAgent,
      matchedKeywords
    );

    // Build reason
    const reason = this.buildReason(
      selectedAgent,
      matchedKeywords,
      confidence,
      complexity.level
    );

    const latency = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      agent: selectedAgent,
      confidence: Math.round(confidence * 100) / 100,
      reason,
      skillFilesUsed,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      complexity: complexity.level,
      latency,
      timestamp: new Date().toISOString(),
      matchedKeywords,
    };
  }

  /**
   * Find relevant skill files for agent
   */
  private findRelevantSkills(
    agentId: string,
    keywords: string[]
  ): string[] {
    const relevant: string[] = [];

    for (const [skillId, skill] of this.skillFiles.entries()) {
      if (skill.agent !== agentId) {continue;}

      // Check if skill keywords overlap with message keywords
      const overlap = skill.keywords.some((k) =>
        keywords.some((mk) => mk.includes(k) || k.includes(mk))
      );

      if (overlap) {
        relevant.push(skillId);
      }
    }

    // Return top 3 most relevant
    return relevant.slice(0, 3);
  }

  /**
   * Build human-readable reason
   */
  private buildReason(
    agent: string,
    keywords: string[],
    confidence: number,
    complexity: string
  ): string {
    if (keywords.length === 0) {
      return `Routed to ${agent} (fallback, low keyword match)`;
    }

    const keywordList = keywords.slice(0, 3).join(", ");
    const confidenceLevel =
      confidence >= 0.75 ? "high" : confidence >= 0.5 ? "medium" : "low";

    return `Keywords: ${keywordList} matched ${agent} agent (${confidenceLevel} confidence, ${complexity} complexity)`;
  }

  /**
   * Estimate cost for routing decision
   */
  private estimateCost(agentId: string, complexity: ComplexityAssessment): number {
    const agent = this.agents.get(agentId);
    if (!agent?.costPerToken) {return 0.5;}

    const tokens = complexity.estimatedTokens;
    const baseCost = (tokens / 1000) * agent.costPerToken;

    // Apply complexity multiplier
    const multiplier =
      complexity.level === "simple"
        ? 1.0
        : complexity.level === "moderate"
          ? 1.5
          : 2.5;

    return baseCost * multiplier;
  }

  /**
   * Get all available agents
   */
  getAgents(): Agent[] {
    return Array.from(this.agents.values()).filter((a) => a.enabled);
  }

  /**
   * Get agent by ID
   */
  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  /**
   * Get all skill files
   */
  getSkillFiles(): SkillFile[] {
    return Array.from(this.skillFiles.values());
  }

  /**
   * Health check
   */
  getHealth(): Record<string, unknown> {
    return {
      status: "healthy",
      agentCount: this.agents.size,
      skillFileCount: this.skillFiles.size,
      fallbackAgent: FALLBACK_AGENT,
      timestamp: new Date().toISOString(),
    };
  }
}
