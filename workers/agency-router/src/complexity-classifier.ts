/**
 * Complexity Classifier - Task Complexity Assessment
 * Determines if a task is simple, moderate, or complex
 */

export interface ComplexityAssessment {
  level: "simple" | "moderate" | "complex";
  score: number;
  factors: string[];
  estimatedTokens: number;
  suggestedAgent: string;
}

const COMPLEXITY_INDICATORS = {
  simple: {
    keywords: [
      "quick",
      "simple",
      "easy",
      "trivial",
      "basic",
      "explain",
      "summarize",
      "list",
      "describe",
      "what is",
      "how do i",
      "find",
      "search",
    ],
    maxLength: 200,
    maxSentences: 3,
  },
  moderate: {
    keywords: [
      "implement",
      "integrate",
      "configure",
      "debug",
      "troubleshoot",
      "modify",
      "update",
      "improve",
      "enhance",
      "add",
      "change",
      "convert",
      "analyze",
      "review",
    ],
    maxLength: 800,
    maxSentences: 10,
  },
  complex: {
    keywords: [
      "design",
      "architect",
      "optimize",
      "refactor",
      "migrate",
      "distributed",
      "performance",
      "scalability",
      "security",
      "compliance",
      "multi-step",
      "strategic",
      "comprehensive",
      "advanced",
      "custom",
    ],
    minLength: 500,
  },
};

const AGENT_COMPLEXITY_MAPPING: Record<
  string,
  "simple" | "moderate" | "complex"
> = {
  codegen: "moderate",
  planning: "complex",
  security: "complex",
  infrastructure: "complex",
};

export class ComplexityClassifier {
  /**
   * Assess task complexity
   */
  static assessComplexity(
    text: string,
    agent?: string
  ): ComplexityAssessment {
    const normalizedText = text.toLowerCase();
    const lines = text.split("\n");
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim());
    const words = text.split(/\s+/);

    const factors: string[] = [];
    let complexityScore = 0;

    // Check length indicators
    if (text.length > 1500) {
      complexityScore += 2;
      factors.push("Long message (>1500 chars)");
    } else if (text.length > 500) {
      complexityScore += 1;
      factors.push("Medium message (500-1500 chars)");
    }

    // Check sentence count
    if (sentences.length > 10) {
      complexityScore += 2;
      factors.push("Multiple requirements (>10 sentences)");
    } else if (sentences.length > 5) {
      complexityScore += 1;
      factors.push("Several requirements (5-10 sentences)");
    }

    // Check for complex keywords
    const complexMatches = COMPLEXITY_INDICATORS.complex.keywords.filter((k) =>
      normalizedText.includes(k)
    );
    complexityScore += complexMatches.length * 2;
    if (complexMatches.length > 0) {
      factors.push(`Complex indicators: ${complexMatches.slice(0, 3).join(", ")}`);
    }

    // Check for moderate keywords
    const moderateMatches = COMPLEXITY_INDICATORS.moderate.keywords.filter((k) =>
      normalizedText.includes(k)
    );
    complexityScore += moderateMatches.length * 1;
    if (moderateMatches.length > 0) {
      factors.push(`Moderate indicators: ${moderateMatches.slice(0, 3).join(", ")}`);
    }

    // Check for code blocks or technical content
    const hasCodeBlocks = /```|<|>|{|}|\[|\]|=>|;/.test(text);
    if (hasCodeBlocks) {
      complexityScore += 1;
      factors.push("Contains code or technical syntax");
    }

    // Check for multiple topics
    const topics = this.detectTopics(normalizedText);
    if (topics.length > 2) {
      complexityScore += 1;
      factors.push(`Multiple topics: ${topics.join(", ")}`);
    }

    // Check for constraints/requirements
    const hasConstraints = /must|should|cannot|don't|constraint|requirement/.test(
      normalizedText
    );
    if (hasConstraints) {
      complexityScore += 1;
      factors.push("Contains explicit constraints");
    }

    // Determine level
    let level: "simple" | "moderate" | "complex";
    if (complexityScore >= 6) {
      level = "complex";
    } else if (complexityScore >= 3) {
      level = "moderate";
    } else {
      level = "simple";
    }

    // Agent-specific adjustments
    if (agent) {
      const agentSuggestedLevel = AGENT_COMPLEXITY_MAPPING[agent];
      if (agentSuggestedLevel === "complex" && level === "simple") {
        level = "moderate";
        factors.push(`Adjusted for ${agent} agent complexity baseline`);
      }
    }

    // Estimate tokens (rough: ~4 chars per token)
    const estimatedTokens = Math.ceil(text.length / 4);

    return {
      level,
      score: complexityScore,
      factors,
      estimatedTokens,
      suggestedAgent: this.suggestAgent(level),
    };
  }

  /**
   * Detect topics from text
   */
  private static detectTopics(text: string): string[] {
    const topicKeywords: Record<string, string[]> = {
      frontend: ["react", "vue", "angular", "component", "ui", "ux"],
      backend: ["node", "python", "api", "database", "server"],
      devops: ["kubernetes", "docker", "ci/cd", "deploy", "cloud"],
      security: ["security", "vulnerability", "encryption", "auth"],
      database: ["sql", "mongodb", "postgres", "query", "schema"],
    };

    const detected: string[] = [];
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some((k) => text.includes(k))) {
        detected.push(topic);
      }
    }

    return detected;
  }

  /**
   * Suggest best agent for complexity level
   */
  private static suggestAgent(
    level: "simple" | "moderate" | "complex"
  ): string {
    switch (level) {
      case "simple":
        return "codegen"; // Can handle simple tasks
      case "moderate":
        return "codegen"; // CodeGen is best for moderate tasks
      case "complex":
        return "planning"; // Planning agent better for complex/strategic
      default:
        return "codegen";
    }
  }

  /**
   * Get estimated cost based on complexity
   */
  static estimateCost(
    complexity: ComplexityAssessment,
    modelPricingPerMToken = 3 // $3 per million tokens
  ): number {
    const tokens = complexity.estimatedTokens;
    const baseCost = (tokens / 1_000_000) * modelPricingPerMToken;

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
   * Batch assess multiple messages
   */
  static assessBatch(
    messages: string[],
    agent?: string
  ): ComplexityAssessment[] {
    return messages.map((msg) => this.assessComplexity(msg, agent));
  }
}
