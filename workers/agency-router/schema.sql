-- Agency Router D1 Schema
-- Tables for agent management, skill files, and audit logging

-- Agents Table
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  keywords JSON,
  domains JSON,
  cost_per_token REAL,
  max_tokens INTEGER,
  enabled BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Skill Files Table
CREATE TABLE IF NOT EXISTS skill_files (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  agent TEXT NOT NULL,
  description TEXT,
  keywords JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent) REFERENCES agents(id)
);

-- Routing Audit Log Table
CREATE TABLE IF NOT EXISTS routing_audit_log (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  message_hash TEXT NOT NULL,
  message TEXT,
  agent TEXT NOT NULL,
  confidence REAL,
  complexity TEXT,
  estimated_cost REAL,
  cached BOOLEAN,
  latency REAL,
  user_id TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_timestamp (timestamp),
  INDEX idx_agent (agent),
  INDEX idx_user_id (user_id),
  INDEX idx_message_hash (message_hash)
);

-- Performance Metrics Table (optional, for advanced analytics)
CREATE TABLE IF NOT EXISTS routing_metrics (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  agent TEXT NOT NULL,
  latency_p50 REAL,
  latency_p95 REAL,
  latency_p99 REAL,
  cache_hit_rate REAL,
  total_requests INTEGER,
  error_count INTEGER,
  avg_confidence REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_timestamp (timestamp),
  INDEX idx_agent (agent)
);

-- Insert default agents
INSERT OR IGNORE INTO agents (id, name, description, keywords, domains, cost_per_token, max_tokens, enabled)
VALUES
  (
    'codegen',
    'Code Generation Agent',
    'Expert in code implementation, debugging, testing, and optimization',
    JSON('["implement", "build", "code", "develop", "create", "write", "function", "method", "class", "component", "api", "endpoint", "route", "debug", "fix", "error", "bug", "optimize", "refactor", "performance", "test", "unit test", "integration test", "deploy", "release", "setup", "configure", "installation", "library", "framework", "javascript", "typescript", "python", "node.js", "react", "vue", "angular", "rust", "go", "java", "database", "sql", "query"]'),
    JSON('["javascript", "typescript", "python", "rust", "go", "java"]'),
    0.003,
    4000,
    1
  ),
  (
    'planning',
    'Planning & Strategy Agent',
    'Expert in project planning, roadmapping, architecture design, and strategic thinking',
    JSON('["plan", "strategy", "roadmap", "timeline", "project", "workflow", "process", "architecture", "design", "design document", "proposal", "requirement", "scope", "milestone", "deadline", "goal", "objective", "task", "deliverable", "stakeholder", "team", "resource", "budget", "cost", "estimate", "schedule", "phase", "sprint", "epic", "user story", "acceptance criteria", "risk", "constraint", "dependency", "communication", "review", "approval", "governance"]'),
    JSON('["project management", "architecture", "strategy"]'),
    0.002,
    8000,
    1
  ),
  (
    'security',
    'Security & Compliance Agent',
    'Expert in security analysis, threat modeling, vulnerability assessment, and compliance',
    JSON('["security", "vulnerability", "exploit", "attack", "threat", "risk", "penetration test", "audit", "compliance", "encryption", "authentication", "authorization", "permission", "access control", "sensitive data", "privacy", "breach", "secure", "secure coding", "owasp", "cwe", "cve", "malware", "phishing", "injection", "xss", "csrf", "token", "jwt", "api key", "credential", "secret", "tls", "ssl", "certificate", "firewall", "ddos", "intrusion", "forensic", "incident response", "hardening", "defense"]'),
    JSON('["security", "compliance", "privacy"]'),
    0.004,
    6000,
    1
  ),
  (
    'infrastructure',
    'Infrastructure & DevOps Agent',
    'Expert in infrastructure management, cloud deployment, monitoring, and operations',
    JSON('["infrastructure", "deploy", "cloud", "aws", "azure", "gcp", "cloudflare", "kubernetes", "docker", "container", "ci/cd", "github actions", "jenkins", "gitlab", "devops", "terraform", "infrastructure as code", "monitoring", "logging", "observability", "metrics", "alerting", "uptime", "sla", "disaster recovery", "backup", "load balancer", "cdn", "database", "cache", "queue", "message broker", "api gateway", "reverse proxy", "ssl", "certificate", "dns", "domain", "network", "scaling", "auto-scaling"]'),
    JSON('["cloud", "devops", "kubernetes", "docker"]'),
    0.003,
    5000,
    1
  );

-- Insert default skill files
INSERT OR IGNORE INTO skill_files (id, name, agent, description, keywords)
VALUES
  (
    'task-complexity-assessment',
    'Task Complexity Assessment',
    'planning',
    'Framework for assessing task complexity and determining optimal routing path',
    JSON('["complexity", "assessment", "routing", "difficulty", "scope"]')
  ),
  (
    'agent-codegen',
    'Code Generation Strategies',
    'codegen',
    'Strategies and patterns for code implementation and generation',
    JSON('["code", "generate", "implement", "algorithm", "pattern"]')
  ),
  (
    'keyword-matching-strategy',
    'Keyword Matching Strategy',
    'planning',
    'Strategy for keyword-based intelligent routing of tasks to agents',
    JSON('["matching", "strategy", "routing", "keyword", "nlp"]')
  ),
  (
    'security-threat-modeling',
    'Security Threat Modeling',
    'security',
    'Threat modeling, risk assessment, and security analysis framework',
    JSON('["threat", "security", "risk", "vulnerability", "modeling"]')
  ),
  (
    'infrastructure-deployment',
    'Infrastructure Deployment',
    'infrastructure',
    'Deployment strategies, patterns, and best practices for cloud infrastructure',
    JSON('["deploy", "infrastructure", "cloud", "kubernetes", "docker"]')
  ),
  (
    'performance-optimization',
    'Performance Optimization',
    'codegen',
    'Techniques for performance profiling, optimization, and benchmarking',
    JSON('["performance", "optimize", "benchmark", "profile", "latency"]')
  ),
  (
    'testing-strategies',
    'Testing Strategies',
    'codegen',
    'Comprehensive testing approaches: unit, integration, and end-to-end testing',
    JSON('["test", "unit", "integration", "e2e", "qa"]')
  ),
  (
    'architecture-design',
    'Architecture Design',
    'planning',
    'System architecture design, patterns, and scalability considerations',
    JSON('["architecture", "design", "scalability", "pattern", "microservices"]')
  );

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_routing_audit_timestamp ON routing_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_routing_audit_agent ON routing_audit_log(agent);
CREATE INDEX IF NOT EXISTS idx_routing_audit_user ON routing_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_routing_audit_hash ON routing_audit_log(message_hash);
CREATE INDEX IF NOT EXISTS idx_agents_enabled ON agents(enabled);
CREATE INDEX IF NOT EXISTS idx_skill_files_agent ON skill_files(agent);
