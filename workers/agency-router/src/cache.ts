/**
 * Routing Cache - KV-based caching for routing decisions
 * Reduces latency for repeated similar messages
 */

export interface CachedRoutingDecision {
  agent: string;
  confidence: number;
  reason: string;
  timestamp: number;
  ttl: number;
  hash: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  avgLatency: number;
}

const CACHE_TTL_SECONDS = 3600; // 1 hour
const HASH_ALGORITHM = "SHA-256";

export class RoutingCache {
  private cache: Map<string, CachedRoutingDecision> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalRequests: 0,
    avgLatency: 0,
  };

  constructor(private kvNamespace?: KVNamespace) {}

  /**
   * Generate a hash for the message
   */
  static async generateHash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Get cached decision from memory or KV
   */
  async get(messageHash: string): Promise<CachedRoutingDecision | null> {
    // Check in-memory cache first
    const cached = this.cache.get(messageHash);
    if (cached && !this.isExpired(cached)) {
      this.stats.hits++;
      this.updateStats();
      return cached;
    }

    // Fall back to KV store
    if (this.kvNamespace) {
      try {
        const kvCached = await this.kvNamespace.get(
          `routing:${messageHash}`,
          "json"
        );
        if (kvCached && !this.isExpired(kvCached as CachedRoutingDecision)) {
          // Restore to memory cache
          this.cache.set(messageHash, kvCached as CachedRoutingDecision);
          this.stats.hits++;
          this.updateStats();
          return kvCached as CachedRoutingDecision;
        }
      } catch (err) {
        console.warn("KV cache read failed:", err);
      }
    }

    this.stats.misses++;
    this.updateStats();
    return null;
  }

  /**
   * Store routing decision in cache
   */
  async set(
    messageHash: string,
    decision: CachedRoutingDecision
  ): Promise<void> {
    // Store in memory
    this.cache.set(messageHash, decision);

    // Store in KV
    if (this.kvNamespace) {
      try {
        await this.kvNamespace.put(`routing:${messageHash}`, JSON.stringify(decision), {
          expirationTtl: CACHE_TTL_SECONDS,
          metadata: {
            agent: decision.agent,
            timestamp: decision.timestamp,
          },
        });
      } catch (err) {
        console.warn("KV cache write failed:", err);
      }
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(decision: CachedRoutingDecision): boolean {
    const age = Date.now() - decision.timestamp;
    return age > decision.ttl * 1000;
  }

  /**
   * Clear expired entries
   */
  async cleanup(): Promise<number> {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl * 1000) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0,
      avgLatency: 0,
    };
  }

  /**
   * Update hit rate
   */
  private updateStats(): void {
    this.stats.totalRequests = this.stats.hits + this.stats.misses;
    this.stats.hitRate = this.stats.totalRequests > 0
      ? this.stats.hits / this.stats.totalRequests
      : 0;
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    this.cache.clear();
    if (this.kvNamespace) {
      try {
        // KV doesn't have a clear all method, so we'd need to track keys separately
        // For now, just clear memory
        console.log("Memory cache cleared. KV cache will expire naturally.");
      } catch (err) {
        console.warn("Cache clear failed:", err);
      }
    }
  }
}

/**
 * Audit Log - Track all routing decisions to D1
 */
export interface AuditLogEntry {
  id: string;
  timestamp: number;
  messageHash: string;
  message: string;
  agent: string;
  confidence: number;
  complexity: string;
  estimatedCost: number;
  cached: boolean;
  latency: number;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export class AuditLogger {
  constructor(private kvNamespace?: KVNamespace, private db?: D1Database) {}

  /**
   * Log a routing decision
   */
  async log(entry: AuditLogEntry): Promise<void> {
    // Log to KV for quick access
    if (this.kvNamespace) {
      try {
        const key = `audit:${entry.timestamp}:${entry.id}`;
        await this.kvNamespace.put(key, JSON.stringify(entry), {
          expirationTtl: 2592000, // 30 days
        });
      } catch (err) {
        console.warn("Audit log to KV failed:", err);
      }
    }

    // Log to D1 for persistent storage
    if (this.db) {
      try {
        const stmt = this.db.prepare(
          `INSERT INTO routing_audit_log (timestamp, message_hash, message, agent, confidence, complexity, estimated_cost, cached, latency, user_id, metadata)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );

        stmt.bind(
          entry.timestamp,
          entry.messageHash,
          entry.message,
          entry.agent,
          entry.confidence,
          entry.complexity,
          entry.estimatedCost,
          entry.cached ? 1 : 0,
          entry.latency,
          entry.userId || null,
          entry.metadata ? JSON.stringify(entry.metadata) : null
        );

        await stmt.run();
      } catch (err) {
        console.warn("Audit log to D1 failed:", err);
      }
    }
  }

  /**
   * Get audit logs for a message
   */
  async getLogsForMessage(messageHash: string, limit = 10): Promise<AuditLogEntry[]> {
    if (!this.db) {return [];}

    try {
      const stmt = this.db.prepare(
        `SELECT * FROM routing_audit_log
         WHERE message_hash = ?
         ORDER BY timestamp DESC
         LIMIT ?`
      );

      const result = await stmt.bind(messageHash, limit).all();
      return (result.results || []) as unknown as AuditLogEntry[];
    } catch (err) {
      console.warn("Failed to fetch audit logs:", err);
      return [];
    }
  }

  /**
   * Get routing statistics
   */
  async getRoutingStats(
    timeRangeMs = 86400000 // 24 hours
  ): Promise<Record<string, unknown>> {
    if (!this.db) {return {};}

    try {
      const since = Date.now() - timeRangeMs;
      const stmt = this.db.prepare(
        `SELECT
           agent,
           COUNT(*) as total,
           AVG(confidence) as avg_confidence,
           AVG(latency) as avg_latency,
           SUM(estimated_cost) as total_cost
         FROM routing_audit_log
         WHERE timestamp > ?
         GROUP BY agent
         ORDER BY total DESC`
      );

      const result = await stmt.bind(since).all();
      return (result.results as unknown as Record<string, unknown>) || {};
    } catch (err) {
      console.warn("Failed to fetch routing stats:", err);
      return {};
    }
  }

  /**
   * Get top agents by usage
   */
  async getTopAgents(limit = 10): Promise<Array<Record<string, unknown>>> {
    if (!this.db) {return [];}

    try {
      const stmt = this.db.prepare(
        `SELECT
           agent,
           COUNT(*) as total,
           AVG(confidence) as avg_confidence
         FROM routing_audit_log
         GROUP BY agent
         ORDER BY total DESC
         LIMIT ?`
      );

      const result = await stmt.bind(limit).all();
      return result.results || [];
    } catch (err) {
      console.warn("Failed to fetch top agents:", err);
      return [];
    }
  }
}
