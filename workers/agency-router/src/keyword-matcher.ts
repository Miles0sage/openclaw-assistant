/**
 * Keyword Matcher - Intent Detection and Agent Scoring
 * Matches 52+ keywords across 4 intent domains to score agents
 */

export interface KeywordMatch {
  keyword: string;
  agent: string;
  confidence: number;
  domain: string;
}

export interface AgentScore {
  agent: string;
  score: number;
  matches: KeywordMatch[];
  primaryDomain: string;
}

const KEYWORD_SETS: Record<string, Record<string, string[]>> = {
  codegen: {
    implementation: [
      "implement",
      "build",
      "code",
      "develop",
      "create",
      "write",
      "function",
      "method",
      "class",
      "component",
      "api",
      "endpoint",
      "route",
      "debug",
      "fix",
      "error",
      "bug",
      "optimize",
      "refactor",
      "performance",
      "test",
      "unit test",
      "integration test",
      "deploy",
      "release",
      "setup",
      "configure",
      "installation",
      "library",
      "framework",
      "javascript",
      "typescript",
      "python",
      "node.js",
      "react",
      "vue",
      "angular",
      "rust",
      "go",
      "java",
      "database",
      "sql",
      "query",
    ],
  },
  planning: {
    strategy: [
      "plan",
      "strategy",
      "roadmap",
      "timeline",
      "project",
      "workflow",
      "process",
      "architecture",
      "design",
      "design document",
      "proposal",
      "requirement",
      "scope",
      "milestone",
      "deadline",
      "goal",
      "objective",
      "task",
      "deliverable",
      "stakeholder",
      "team",
      "resource",
      "budget",
      "cost",
      "estimate",
      "schedule",
      "phase",
      "sprint",
      "epic",
      "user story",
      "acceptance criteria",
      "risk",
      "constraint",
      "dependency",
      "communication",
      "review",
      "approval",
      "governance",
    ],
  },
  security: {
    security: [
      "security",
      "vulnerability",
      "exploit",
      "attack",
      "threat",
      "risk",
      "penetration test",
      "audit",
      "compliance",
      "encryption",
      "authentication",
      "authorization",
      "permission",
      "access control",
      "sensitive data",
      "privacy",
      "breach",
      "secure",
      "secure coding",
      "owasp",
      "cwe",
      "cve",
      "malware",
      "phishing",
      "injection",
      "xss",
      "csrf",
      "token",
      "jwt",
      "api key",
      "credential",
      "secret",
      "tls",
      "ssl",
      "certificate",
      "firewall",
      "ddos",
      "intrusion",
      "forensic",
      "incident response",
      "hardening",
      "defense",
    ],
  },
  infrastructure: {
    operations: [
      "infrastructure",
      "deploy",
      "cloud",
      "aws",
      "azure",
      "gcp",
      "cloudflare",
      "kubernetes",
      "docker",
      "container",
      "ci/cd",
      "github actions",
      "jenkins",
      "gitlab",
      "devops",
      "terraform",
      "infrastructure as code",
      "monitoring",
      "logging",
      "observability",
      "metrics",
      "alerting",
      "uptime",
      "sla",
      "disaster recovery",
      "backup",
      "load balancer",
      "cdn",
      "database",
      "cache",
      "queue",
      "message broker",
      "api gateway",
      "reverse proxy",
      "ssl",
      "certificate",
      "dns",
      "domain",
      "network",
      "scaling",
      "auto-scaling",
    ],
  },
};

const AGENT_PRIMARY_DOMAINS: Record<string, string[]> = {
  codegen: ["implementation"],
  planning: ["strategy"],
  security: ["security"],
  infrastructure: ["operations"],
};

const DEFAULT_CONFIDENCE = 0.85;
const KEYWORD_WEIGHT = 1.0;
const COMPOUND_KEYWORD_BOOST = 0.15;

export class KeywordMatcher {
  /**
   * Extract and score keywords from text
   */
  static scoreMessage(text: string): AgentScore[] {
    const normalizedText = text.toLowerCase();
    const words = this.tokenize(normalizedText);
    const compounds = this.extractCompoundKeywords(normalizedText);
    const allKeywords = new Set([...words, ...compounds]);

    const agentScores: Map<string, AgentScore> = new Map();

    // Score each agent based on keyword matches
    for (const [agent, domains] of Object.entries(KEYWORD_SETS)) {
      const matches: KeywordMatch[] = [];
      let totalScore = 0;
      const domainScores: Record<string, number> = {};

      for (const [domain, keywords] of Object.entries(domains)) {
        domainScores[domain] = 0;

        for (const keyword of keywords) {
          // Check single keyword matches
          if (allKeywords.has(keyword)) {
            const baseConfidence = DEFAULT_CONFIDENCE;
            const match: KeywordMatch = {
              keyword,
              agent,
              confidence: baseConfidence,
              domain,
            };
            matches.push(match);
            domainScores[domain] += baseConfidence;
            totalScore += baseConfidence;
          }

          // Check phrase matches (compound keywords)
          if (normalizedText.includes(keyword)) {
            const phraseBoost = KEYWORD_WEIGHT * COMPOUND_KEYWORD_BOOST;
            domainScores[domain] += phraseBoost;
            totalScore += phraseBoost;
          }
        }
      }

      // Normalize score to 0-100
      const normalizedScore = Math.min(100, (totalScore / 10) * 10);

      // Determine primary domain
      const primaryDomain = Object.entries(domainScores).toSorted(
        ([, a], [, b]) => b - a
      )[0]?.[0] || "unknown";

      agentScores.set(agent, {
        agent,
        score: normalizedScore,
        matches,
        primaryDomain,
      });
    }

    // Sort by score descending
    return Array.from(agentScores.values()).toSorted((a, b) => b.score - a.score);
  }

  /**
   * Tokenize text into words
   */
  private static tokenize(text: string): string[] {
    return text
      .split(/\s+/)
      .map((word) => word.replace(/[^\w]/g, ""))
      .filter((word) => word.length > 2);
  }

  /**
   * Extract compound keywords (multi-word phrases)
   */
  private static extractCompoundKeywords(text: string): string[] {
    const compounds: string[] = [];

    // Check for common compound phrases
    const compoundPatterns = [
      "design document",
      "unit test",
      "integration test",
      "user story",
      "acceptance criteria",
      "api gateway",
      "reverse proxy",
      "load balancer",
      "message broker",
      "disaster recovery",
      "auto scaling",
      "infrastructure as code",
      "ci/cd",
      "github actions",
      "penetration test",
      "access control",
      "sensitive data",
      "secure coding",
      "api key",
      "jwt token",
      "ssl certificate",
      "node.js",
      "sql query",
    ];

    for (const pattern of compoundPatterns) {
      if (text.includes(pattern)) {
        compounds.push(pattern);
      }
    }

    return compounds;
  }

  /**
   * Get confidence score for matched keywords
   */
  static getConfidenceScore(scores: AgentScore[]): number {
    if (scores.length === 0) {return 0;}

    const topScore = scores[0].score;
    const secondScore = scores[1]?.score || 0;

    // High confidence if top agent significantly outscores others
    if (topScore >= 50 && topScore - secondScore >= 20) {
      return Math.min(0.95, 0.7 + (topScore / 100) * 0.25);
    }

    // Medium confidence if scores are closer
    if (topScore >= 30) {
      return 0.6 + (topScore / 100) * 0.35;
    }

    // Low confidence for weak matches
    return Math.min(0.5, topScore / 100);
  }

  /**
   * Extract domain from message (e.g., 'javascript', 'kubernetes')
   */
  static extractDomain(text: string): string | null {
    const normalizedText = text.toLowerCase();

    const domains = [
      "javascript",
      "typescript",
      "python",
      "node.js",
      "react",
      "vue",
      "angular",
      "rust",
      "go",
      "java",
      "kubernetes",
      "docker",
      "aws",
      "azure",
      "gcp",
      "cloudflare",
      "github",
      "gitlab",
    ];

    for (const domain of domains) {
      if (normalizedText.includes(domain)) {
        return domain;
      }
    }

    return null;
  }

  /**
   * Detect complexity level from keywords
   */
  static detectComplexity(text: string): "simple" | "moderate" | "complex" {
    const normalizedText = text.toLowerCase();

    const complexIndicators = [
      "distributed",
      "concurrency",
      "performance",
      "optimization",
      "architecture",
      "refactor",
      "redesign",
      "integration",
      "migration",
      "scalability",
    ];

    const moderateIndicators = [
      "debug",
      "test",
      "configure",
      "setup",
      "deploy",
      "review",
    ];

    let complexityScore = 0;

    for (const indicator of complexIndicators) {
      if (normalizedText.includes(indicator)) {
        complexityScore += 2;
      }
    }

    for (const indicator of moderateIndicators) {
      if (normalizedText.includes(indicator)) {
        complexityScore += 1;
      }
    }

    // Based on keyword matches
    if (complexityScore >= 4) {
      return "complex";
    } else if (complexityScore >= 2) {
      return "moderate";
    } else {
      return "simple";
    }
  }
}
