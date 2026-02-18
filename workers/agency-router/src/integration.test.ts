/**
 * Integration tests for RouterEngine and full routing flow
 */

import { describe, it, expect, beforeEach } from "vitest";
import { RouterEngine, Agent, SkillFile, RoutingDecision } from "./router-engine";
import { RoutingCache } from "./cache";
import { ComplexityClassifier } from "./complexity-classifier";

describe("RouterEngine Integration", () => {
  let engine: RouterEngine;

  beforeEach(() => {
    engine = new RouterEngine();
  });

  describe("route function", () => {
    it("should route code implementation tasks to codegen", async () => {
      const decision = await engine.route(
        "I need to implement a REST API endpoint with error handling"
      );

      expect(decision.agent).toBe("codegen");
      expect(decision.confidence).toBeGreaterThan(0.5);
      expect(decision.reason).toContain("Keywords");
    });

    it("should route planning tasks to planning agent", async () => {
      const decision = await engine.route(
        "Create a project roadmap with milestones and timeline for Q2 2026"
      );

      expect(decision.agent).toBe("planning");
      expect(decision.confidence).toBeGreaterThan(0.5);
    });

    it("should route security tasks to security agent", async () => {
      const decision = await engine.route(
        "Perform a penetration test and identify security vulnerabilities in our API"
      );

      expect(decision.agent).toBe("security");
      expect(decision.confidence).toBeGreaterThan(0.5);
    });

    it("should route infrastructure tasks to infrastructure agent", async () => {
      const decision = await engine.route(
        "Set up Kubernetes cluster with Docker containers and CI/CD pipeline"
      );

      expect(decision.agent).toBe("infrastructure");
      expect(decision.confidence).toBeGreaterThan(0.5);
    });

    it("should estimate costs correctly", async () => {
      const decision = await engine.route(
        "Implement a complex feature with multiple components"
      );

      expect(decision.estimatedCost).toBeGreaterThan(0);
      expect(decision.estimatedCost).toBeLessThan(100);
    });

    it("should include matched keywords in response", async () => {
      const decision = await engine.route(
        "Debug and fix the authentication function"
      );

      expect(decision.matchedKeywords).toHaveLength(2);
      expect(decision.matchedKeywords).toEqual(
        expect.arrayContaining(["debug", "fix"])
      );
    });

    it("should measure latency", async () => {
      const decision = await engine.route("Sample message");

      expect(decision.latency).toBeGreaterThan(0);
      expect(decision.latency).toBeLessThan(1000); // Should be < 1 second
    });

    it("should handle edge case with empty message", async () => {
      const decision = await engine.route("");

      expect(decision.agent).toBeDefined();
      expect(decision.confidence).toBeGreaterThanOrEqual(0);
      expect(decision.confidence).toBeLessThanOrEqual(1);
    });

    it("should route complex tasks differently", async () => {
      const simpleDecision = await engine.route("What is a variable?");
      const complexDecision = await engine.route(
        "Design a distributed system architecture for real-time processing with scalability and fault tolerance"
      );

      expect(simpleDecision.complexity).toBe("simple");
      expect(complexDecision.complexity).toBe("complex");
    });

    it("should include timestamps in decisions", async () => {
      const decision = await engine.route("Test message");

      expect(decision.timestamp).toBeDefined();
      expect(new Date(decision.timestamp).getTime()).toBeGreaterThan(0);
    });
  });

  describe("agent management", () => {
    it("should return all enabled agents", () => {
      const agents = engine.getAgents();

      expect(agents).toHaveLength(4);
      expect(agents.map((a) => a.id)).toEqual(
        expect.arrayContaining([
          "codegen",
          "planning",
          "security",
          "infrastructure",
        ])
      );
    });

    it("should get specific agent by id", () => {
      const agent = engine.getAgent("codegen");

      expect(agent).toBeDefined();
      expect(agent?.name).toBe("Code Generation Agent");
      expect(agent?.keywords).toContain("implement");
    });

    it("should return undefined for unknown agent", () => {
      const agent = engine.getAgent("unknown");
      expect(agent).toBeUndefined();
    });
  });

  describe("skill files", () => {
    it("should return all skill files", () => {
      const skills = engine.getSkillFiles();

      expect(skills.length).toBeGreaterThan(0);
      expect(skills.some((s) => s.agent === "codegen")).toBe(true);
      expect(skills.some((s) => s.agent === "planning")).toBe(true);
    });

    it("should find relevant skill files for agent", async () => {
      const decision = await engine.route(
        "Implement and debug the payment processing function"
      );

      expect(decision.skillFilesUsed).toHaveLength(
        Math.min(3, engine.getSkillFiles().length)
      );
    });
  });

  describe("health checks", () => {
    it("should report healthy status", () => {
      const health = engine.getHealth();

      expect(health.status).toBe("healthy");
      expect(health.agentCount).toBeGreaterThan(0);
      expect(health.skillFileCount).toBeGreaterThan(0);
    });
  });
});

describe("RoutingCache", () => {
  let cache: RoutingCache;

  beforeEach(() => {
    cache = new RoutingCache();
  });

  describe("caching", () => {
    it("should generate consistent hashes for same message", async () => {
      const message = "Test message for hashing";
      const hash1 = await RoutingCache.generateHash(message);
      const hash2 = await RoutingCache.generateHash(message);

      expect(hash1).toBe(hash2);
    });

    it("should generate different hashes for different messages", async () => {
      const hash1 = await RoutingCache.generateHash("Message 1");
      const hash2 = await RoutingCache.generateHash("Message 2");

      expect(hash1).not.toBe(hash2);
    });

    it("should handle cache miss gracefully", async () => {
      const cached = await cache.get("nonexistent-hash");
      expect(cached).toBeNull();
    });
  });

  describe("cache statistics", () => {
    it("should track hits and misses", async () => {
      const hash = "test-hash";
      const decision = {
        agent: "codegen",
        confidence: 0.85,
        reason: "Test",
        timestamp: Date.now(),
        ttl: 3600,
        hash,
      };

      await cache.set(hash, decision);
      await cache.get(hash); // Hit
      await cache.get("other-hash"); // Miss

      const stats = cache.getStats();
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.misses).toBeGreaterThan(0);
    });

    it("should calculate hit rate correctly", async () => {
      const decision = {
        agent: "codegen",
        confidence: 0.85,
        reason: "Test",
        timestamp: Date.now(),
        ttl: 3600,
        hash: "test",
      };

      await cache.set("test", decision);
      await cache.get("test");
      await cache.get("test");
      await cache.get("miss");

      const stats = cache.getStats();
      expect(stats.hitRate).toBe(2 / 3);
    });
  });
});

describe("ComplexityClassifier", () => {
  describe("complexity assessment", () => {
    it("should classify simple tasks", () => {
      const assessment = ComplexityClassifier.assessComplexity("What is React?");

      expect(assessment.level).toBe("simple");
      expect(assessment.score).toBeLessThan(3);
    });

    it("should classify moderate tasks", () => {
      const assessment = ComplexityClassifier.assessComplexity(
        "Implement a login feature with validation"
      );

      expect(assessment.level).toBe("moderate");
    });

    it("should classify complex tasks", () => {
      const assessment = ComplexityClassifier.assessComplexity(
        "Design and architect a distributed microservices system with auto-scaling, load balancing, and fault tolerance"
      );

      expect(assessment.level).toBe("complex");
    });

    it("should estimate tokens correctly", () => {
      const assessment = ComplexityClassifier.assessComplexity(
        "Simple message"
      );

      expect(assessment.estimatedTokens).toBeGreaterThan(0);
      expect(assessment.estimatedTokens).toBeLessThan(100);
    });

    it("should suggest appropriate agents", () => {
      const simple = ComplexityClassifier.assessComplexity("What is coding?");
      const complex = ComplexityClassifier.assessComplexity(
        "Design an enterprise architecture"
      );

      expect(simple.suggestedAgent).toBe("codegen");
      expect(complex.suggestedAgent).toBe("planning");
    });
  });

  describe("cost estimation", () => {
    it("should estimate costs", () => {
      const assessment = ComplexityClassifier.assessComplexity(
        "Implement a feature"
      );
      const cost = ComplexityClassifier.estimateCost(assessment);

      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(10);
    });

    it("should apply complexity multiplier", () => {
      const simple = ComplexityClassifier.assessComplexity("Hi");
      const complex = ComplexityClassifier.assessComplexity(
        "Design a complex distributed system with many requirements"
      );

      const simpleCost = ComplexityClassifier.estimateCost(simple);
      const complexCost = ComplexityClassifier.estimateCost(complex);

      expect(complexCost).toBeGreaterThan(simpleCost);
    });
  });
});

describe("Latency Performance", () => {
  it("routing should be under 100ms", async () => {
    const engine = new RouterEngine();
    const startTime = performance.now();

    await engine.route("Test message for latency");

    const latency = performance.now() - startTime;
    expect(latency).toBeLessThan(100);
  });

  it("batch routing should be efficient", async () => {
    const engine = new RouterEngine();
    const messages = [
      "Implement a feature",
      "Design a system",
      "Fix a bug",
      "Deploy the application",
      "Review security",
    ];

    const startTime = performance.now();

    for (const msg of messages) {
      await engine.route(msg);
    }

    const latency = (performance.now() - startTime) / messages.length;
    expect(latency).toBeLessThan(100); // Average per message
  });
});
