---
title: "Security Agent (Threat Analyst)"
description: "Reviews security, threat models, hardens systems, audits RLS policies"
keywords: ["security", "vulnerability", "threat", "audit", "encryption", "authentication", "compliance"]
aliases: ["hacker-agent", "pentest-ai", "security-specialist"]
type: "claim"
model: "Ollama Qwen 14B"
agentId: "hacker_agent"
complexity: "complex"
relatedAgents: ["pm", "codegen"]
relatedChannels: ["signal", "slack", "discord", "web"]
---

# Security Agent — Threat Analyst

## Role

The Security Agent (codenamed "Pentest AI") specializes in **security auditing, vulnerability assessment, threat modeling, and system hardening**. It is the primary agent for all security-related concerns and acts as the gatekeeper for production deployments.

**Model:** Ollama Qwen 14B (14B parameter LLM)
**Availability:** High priority, critical for production
**Response time:** Thorough (takes time to analyze deeply)

---

## Primary Responsibilities

### 1. Security Auditing
Comprehensive security reviews of systems and code:
- Code review for security vulnerabilities (XSS, CSRF, injection)
- Architecture review for security flaws (authentication, authorization)
- Configuration audits (environment variables, secrets management)
- RLS (Row-Level Security) policy audit (Supabase/PostgreSQL)

**Example triggers:**
- "Review our authentication implementation for CSRF vulnerabilities"
- "Audit our RLS policies; are they secure?"
- "Check this API for injection attacks"
- "Review the Supabase configuration for security issues"

### 2. Vulnerability Assessment
Identifying and rating security issues:
- Static code analysis for common vulnerabilities (OWASP Top 10)
- Dependency scanning for known vulnerabilities
- Penetration testing scenarios
- Risk scoring and prioritization

**Example triggers:**
- "Scan this codebase for vulnerabilities"
- "What are the security risks in this design?"
- "Is our password reset flow secure?"
- "Check for common web vulnerabilities in this endpoint"

### 3. Threat Modeling
Designing security strategies for systems:
- Identifying assets and threats
- Risk assessment (likelihood × impact)
- Designing threat mitigations
- Creating security roadmaps

**Example triggers:**
- "Threat model our user authentication system"
- "What security considerations do we need for payments?"
- "Design a security strategy for data exports"

### 4. System Hardening
Implementing and verifying security controls:
- Authentication & authorization (OAuth2, JWT, RBAC)
- Encryption (TLS, data-at-rest, secrets management)
- Input validation and sanitization
- Rate limiting and DDoS protection
- Audit logging and monitoring

**Example triggers:**
- "How should we encrypt user PII?"
- "Implement rate limiting for the API"
- "Set up secure session management"
- "Add input validation to prevent injection"

### 5. Compliance & Best Practices
Ensuring regulatory and industry adherence:
- OWASP Top 10 alignment
- GDPR/CCPA data privacy
- SOC 2 compliance
- Security best practices (CWE, CVSS)

**Example triggers:**
- "Are we GDPR compliant?"
- "What's our plan for handling user data requests?"
- "Verify this meets SOC 2 requirements"

---

## Keyword Patterns

**Strong signals** (highest confidence for Security routing):

```
security, vulnerability, exploit, penetration, audit, xss, csrf,
injection, pentest, hack, breach, secure, threat, attack,
threat_modeling, risk, malware, payload, sanitize, encrypt,
cryptography, authentication, authorization, access control,
sql injection, rls, row_level_security, policy
```

**Additional security keywords:**
```
owasp, cwe, cvss, vulnerability_scan, pentest, security_review,
threat_assessment, hardening, compliance, gdpr, ccpa, soc2,
vulnerability_management, security_incident, breach_response,
zero_trust, principle_of_least_privilege, defense_in_depth
```

**Confidence scoring:**
- Single security keyword: +0.6 to base score (strongest signal)
- Multiple security keywords: +0.5 (multiplicative)
- Security audit domain (3+ keywords): +0.7 (highest priority)
- "Vulnerability", "exploit", "threat": +0.7 each
- "Audit": +0.6

---

## Agent Skills (Claimed Expertise)

| Skill | Description |
|-------|-------------|
| **Security Scanning** | Automated vulnerability detection and SAST tools |
| **Vulnerability Assessment** | Manual code review for security flaws |
| **Penetration Testing** | Simulating real-world attack scenarios |
| **OWASP** | Top 10 vulnerabilities and mitigation strategies |
| **Security Best Practices** | Industry standards (CWE, CVSS, secure coding) |
| **Threat Modeling** | Asset identification, threat analysis, risk scoring |
| **Secure Architecture** | Designing systems for security (defense in depth, zero trust) |
| **RLS Audit** | Row-level security policy review (Supabase/PostgreSQL) |
| **Database Security** | Encryption, access control, audit logging for databases |
| **Cryptography** | Encryption algorithms, key management, hashing |
| **Authentication** | OAuth2, JWT, SAML, multi-factor authentication |
| **Authorization** | RBAC, ABAC, principle of least privilege |
| **Input Validation** | Prevention of injection, XSS, CSRF attacks |
| **Secrets Management** | Secure handling of API keys, credentials, tokens |

---

## Complexity Level

**Specialized for:** COMPLEX security tasks

The Security agent is optimized for:
- **Complex:** Full security audits, threat modeling, architecture review
- **Moderate:** Code review for vulnerabilities, RLS policy audits
- **Simple:** Quick security questions, best practice recommendations

**Lower complexity tasks:**
- Simple security questions may be handled by other agents
- But Security provides the most thorough analysis

---

## Interaction Patterns

### Pattern 1: Pre-Implementation Security Review
```
User (Slack):
"We're building a password reset flow.
Can you threat model it before CodeGen implements?"

Security Response:
1. Identify assets (passwords, tokens, user identities)
2. Identify threats (token theft, replay attacks, brute force)
3. Assess likelihood and impact
4. Propose mitigations (secure token generation, TTL, rate limiting)
5. Recommend implementation (CodeGen can build)
6. Define verification steps
```

### Pattern 2: Code Security Audit
```
User (Discord):
"Review this OAuth2 implementation. Is it secure?"

Security Response:
1. Analyze OIDC flow (authorization code, PKCE, etc.)
2. Check for common issues (CSRF, token leakage, replay)
3. Verify token handling (secure storage, expiry, rotation)
4. Recommend hardening steps
5. Provide security checklist for CodeGen
```

### Pattern 3: RLS Policy Audit
```
User (Telegram):
"Are our Supabase RLS policies secure?"

Security Response:
1. Review current RLS policies
2. Identify over-permissive rules
3. Check for missing policies (default deny)
4. Verify user isolation (users can't access others' data)
5. Recommend fixes (CodeGen implements)
```

### Pattern 4: Vulnerability Incident Response
```
User (Signal):
"We found a SQL injection vulnerability in production.
How do we fix it?"

Security Response:
1. Assess immediate risk (exploitability, impact)
2. Recommend emergency mitigation (WAF rule, rollback)
3. Root cause analysis (which parameters vulnerable?)
4. Propose fix strategy (parameterized queries, input validation)
5. Coordinate with PM for rollout, CodeGen for implementation
```

---

## Channel Preferences

| Channel | Best Use | Context Leverage |
|---------|----------|------------------|
| **Signal** | Sensitive security discussions | Encrypted, 1:1 focus |
| **Slack** | Security reviews in threads | Full history, audit trail |
| **Discord** | Security team channels | Role-based access, moderation |
| **Web UI** | Security audit dashboards | Session persistence, structured workflows |
| **Email** | Incident notifications | Formal record-keeping |

---

## Integration with Other Agents

### Security + [[agent-codegen]]
- **Security identifies issue** → **CodeGen implements fix**
- **CodeGen writes code** → **Security audits**
- **Security recommends hardening** → **CodeGen implements**

**Example workflow:**
```
CodeGen: Implements authentication
→ Security: Audits for CSRF, XSS, injection
→ Security: Finds CSRF vulnerability, recommends fix
→ CodeGen: Implements CSRF token + SameSite cookie
→ Security: Re-audits, approves for production
```

### Security + [[agent-pm]]
- **PM plans security work** → **Security defines threat model**
- **Security identifies risks** → **PM rescopes timeline**
- **Security orchestrates security fixes** across multiple agents

**Example workflow:**
```
User: "Add payment processing"
→ PM: Plans timeline, identifies security gates
→ Security: Threat model payment flow, identify PCI compliance needs
→ PM: Incorporates security requirements into timeline
→ CodeGen: Implements with Security oversight
→ Security: Final audit before production
```

---

## OWASP Top 10 Expertise

| Vulnerability | Security Capability |
|---------------|-------------------|
| **Injection** | Input validation, parameterized queries, escaping |
| **Broken Authentication** | OAuth2, JWT, MFA implementation and audit |
| **Sensitive Data Exposure** | Encryption at-rest and in-transit, secrets management |
| **XML External Entities (XXE)** | XML parser configuration, entity disabling |
| **Broken Access Control** | RLS policies, RBAC, authorization testing |
| **Security Misconfiguration** | Configuration hardening, security headers, TLS |
| **XSS** | Input validation, output encoding, CSP headers |
| **Insecure Deserialization** | Safe deserialization, input validation |
| **Using Components with Known Vulnerabilities** | Dependency scanning, patch management |
| **Insufficient Logging & Monitoring** | Audit logging, security monitoring, alerting |

---

## Fallback & Escalation

**When Security is not appropriate:**
- Code implementation → Route to [[agent-codegen]]
- Planning security work → Route to [[agent-pm]]
- Data queries → Route to [[agent-codegen]]

**When other agents escalate to Security:**
- CodeGen: "Found potential vulnerability; please audit?"
- PM: "Security requirements not clear; can you assess risk?"
- Any agent: Security concerns, compliance questions, incident response

---

## Quality Metrics

**What good Security routing looks like:**
- ✅ Requests with "security", "vulnerability", "threat" → Security
- ✅ "Audit" requests → Security
- ✅ "Penetration test" → Security
- ✅ RLS policy questions → Security
- ✅ Compliance questions → Security

**What bad routing looks like:**
- ❌ Simple security question → Security (overkill, but acceptable)
- ❌ Code implementation → Security
- ❌ Bug fix → Security
- ❌ Planning → Security (should be PM)

---

## Sensitive Data Handling

The Security agent is trained to:
- **Detect sensitive data** (API keys, passwords, tokens, PII)
- **Avoid exposure** (never log secrets, use placeholders)
- **Redact in responses** (show only necessary information)
- **Recommend secure practices** (secrets management tools)

**Security protocol:**
- If user shares secrets in conversation, Security warns and recommends rotation
- Security uses placeholders: `REDACTED_API_KEY`, `REDACTED_PASSWORD`
- Sensitive data is marked with `[SENSITIVE]` prefix in analysis

---

## Context Awareness

The Security agent benefits from:
- **Code context:** Source code for vulnerability analysis
- **Architecture diagrams:** Understanding system design
- **Threat landscape:** Known vulnerabilities, recent exploits
- **Compliance requirements:** GDPR, CCPA, SOC 2, etc.
- **User expertise:** Is this a security professional or developer?

See [[sensitive-data-detection]] for how to protect sensitive information.
See [[context-preservation]] for how to maintain context across audits.

---

## Example Queries (High Security Confidence)

| Query | Keywords | Confidence |
|-------|----------|-----------|
| "Audit our RLS policies" | audit, RLS | 0.96 |
| "Threat model payment processing" | threat model | 0.94 |
| "Review for CSRF vulnerabilities" | CSRF, vulnerability | 0.95 |
| "Is our password reset secure?" | security | 0.85 |
| "Check for injection attacks" | injection, attack | 0.93 |
| "Penetration test this API" | penetration test | 0.97 |
| "Implement OAuth2 securely" | OAuth2, securely | 0.80 |

---

## Implementation Notes

**For routing system:**
1. **Highest confidence signals:** "security", "vulnerability", "threat", "audit", "penetration"
2. **Always prioritize security keywords** over other signals
3. **Security routing override:** If security keywords present, route to Security regardless of other signals
4. **Confidence scoring:** Security keywords have highest weight
5. **Escalation:** Security → PM on policy/timeline decisions

**For session management:**
- Redact sensitive data from logs
- Track security audits and findings
- Link related vulnerabilities (similar issues)
- Preserve threat model artifacts

---

## Related Files

- [[domain-routing-strategy]] — How Security fits in overall routing
- [[task-complexity-assessment]] — Security specializes in complex analysis
- [[keyword-matching-strategy]] — Security keywords with highest priority
- [[sensitive-data-detection]] — How to detect and protect sensitive data
- [[context-preservation]] — How to maintain security audit context
- [[agent-pm]] — Planning partner for security initiatives
- [[agent-codegen]] — Implementation partner for security hardening

---

**Created:** 2026-02-18
**Model:** Ollama Qwen 14B
**Status:** Production Ready
**Last verified:** 2026-02-18
**Priority:** CRITICAL (always audit before production deployment)
