/**
 * Unit tests for KeywordMatcher
 */

import { describe, it, expect } from "vitest";
import { KeywordMatcher } from "./keyword-matcher";

describe("KeywordMatcher", () => {
  describe("scoreMessage", () => {
    it("should score codegen agent high for implementation keywords", () => {
      const message = "I need to implement a new API endpoint with debugging support";
      const scores = KeywordMatcher.scoreMessage(message);

      expect(scores[0].agent).toBe("codegen");
      expect(scores[0].score).toBeGreaterThan(40);
    });

    it("should score planning agent high for strategy keywords", () => {
      const message = "Help me create a project roadmap and design document for the new system";
      const scores = KeywordMatcher.scoreMessage(message);

      expect(scores[0].agent).toBe("planning");
      expect(scores[0].score).toBeGreaterThan(40);
    });

    it("should score security agent high for security keywords", () => {
      const message = "We need to perform a penetration test and fix a security vulnerability";
      const scores = KeywordMatcher.scoreMessage(message);

      expect(scores[0].agent).toBe("security");
      expect(scores[0].score).toBeGreaterThan(40);
    });

    it("should score infrastructure agent high for devops keywords", () => {
      const message = "Deploy the application to Kubernetes using Docker containers with CI/CD";
      const scores = KeywordMatcher.scoreMessage(message);

      expect(scores[0].agent).toBe("infrastructure");
      expect(scores[0].score).toBeGreaterThan(40);
    });

    it("should return empty array for empty message", () => {
      const scores = KeywordMatcher.scoreMessage("");
      expect(scores).toHaveLength(4); // All agents returned with score 0
      expect(scores.every((s) => s.score === 0)).toBe(true);
    });

    it("should match compound keywords", () => {
      const message = "Create a design document with acceptance criteria";
      const scores = KeywordMatcher.scoreMessage(message);

      const matches = scores.flatMap((s) => s.matches.map((m) => m.keyword));
      expect(matches).toContain("design document");
      expect(matches).toContain("acceptance criteria");
    });
  });

  describe("getConfidenceScore", () => {
    it("should return high confidence for clear winner", () => {
      const scores = KeywordMatcher.scoreMessage(
        "I need to implement a function with debugging"
      );
      const confidence = KeywordMatcher.getConfidenceScore(scores);

      expect(confidence).toBeGreaterThan(0.6);
      expect(confidence).toBeLessThanOrEqual(1);
    });

    it("should return low confidence for weak matches", () => {
      const scores = KeywordMatcher.scoreMessage("Hello world");
      const confidence = KeywordMatcher.getConfidenceScore(scores);

      expect(confidence).toBeLessThan(0.5);
    });

    it("should return 0 for empty scores", () => {
      const confidence = KeywordMatcher.getConfidenceScore([]);
      expect(confidence).toBe(0);
    });
  });

  describe("extractDomain", () => {
    it("should extract javascript domain", () => {
      const domain = KeywordMatcher.extractDomain("Build a React component in JavaScript");
      expect(domain).toBe("javascript");
    });

    it("should extract kubernetes domain", () => {
      const domain = KeywordMatcher.extractDomain("Deploy to Kubernetes cluster");
      expect(domain).toBe("kubernetes");
    });

    it("should return null for unknown domain", () => {
      const domain = KeywordMatcher.extractDomain("General question");
      expect(domain).toBeNull();
    });
  });

  describe("detectComplexity", () => {
    it("should detect simple tasks", () => {
      const complexity = KeywordMatcher.detectComplexity("What is React?");
      expect(complexity).toBe("simple");
    });

    it("should detect moderate tasks", () => {
      const complexity = KeywordMatcher.detectComplexity(
        "Debug the login function and add tests"
      );
      expect(complexity).toBe("moderate");
    });

    it("should detect complex tasks", () => {
      const complexity = KeywordMatcher.detectComplexity(
        "Refactor the architecture for scalability and performance optimization"
      );
      expect(complexity).toBe("complex");
    });
  });

  describe("edge cases", () => {
    it("should handle case insensitivity", () => {
      const scores1 = KeywordMatcher.scoreMessage("IMPLEMENT A FUNCTION");
      const scores2 = KeywordMatcher.scoreMessage("implement a function");

      expect(scores1[0].agent).toBe(scores2[0].agent);
      expect(Math.abs(scores1[0].score - scores2[0].score)).toBeLessThan(1);
    });

    it("should handle special characters", () => {
      const scores = KeywordMatcher.scoreMessage(
        "Implement a @new #API endpoint! With? Debugging."
      );

      expect(scores[0].agent).toBe("codegen");
      expect(scores[0].score).toBeGreaterThan(20);
    });

    it("should handle very long messages", () => {
      const longMessage = "implement ".repeat(100);
      const scores = KeywordMatcher.scoreMessage(longMessage);

      expect(scores[0].agent).toBe("codegen");
      expect(scores[0].score).toBeGreaterThan(50);
    });
  });
});
