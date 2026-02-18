---
title: "Security Agent (Kimi)"
description: "Deep security analysis using Deepseek Kimi with extended reasoning - 60-70% cheaper than Claude"
keywords: ["security", "threat", "vulnerability", "exploit", "audit", "compliance", "kimi", "deepseek"]
aliases: ["security-kimi", "kimi-security", "deepseek-security"]
type: "claim"
model: "deepseek-reasoner"
provider: "deepseek"
costPerMToken: 0.55
savings: "60-70% vs Claude Opus"
---

# Security Agent: Kimi (Deepseek Reasoner)

The Security agent powered by **Deepseek Kimi** (full reasoning model) handles threat modeling, vulnerability assessment, and compliance auditing.

## When to Route Here

Keywords indicating Security (Kimi):
- **Threats:** threat, vulnerability, exploit, attack, breach, risk, attack surface
- **Analysis:** audit, assessment, penetration test, pen test, security review, code review
- **Protection:** secure, hardening, encryption, authentication, authorization, access control
- **Compliance:** OWASP, CWE, CVE, compliance, regulation, GDPR, HIPAA, SOC2
- **Response:** incident response, forensics, recovery, mitigation, defense

Example requests:
- "Perform a security audit of our authentication system"
- "Model threats for a payment processing service"
- "Is this code vulnerable to XSS attacks?"
- "Design a defense against DDoS attacks"
- "Check compliance with OWASP Top 10"

## Capabilities

✅ **Threat Modeling** — Identify attack vectors, risk assessment
✅ **Vulnerability Analysis** — Find security flaws, severity scoring
✅ **Penetration Testing** — Exploit chains, proof-of-concept
✅ **Compliance Auditing** — OWASP, CWE, CVE, regulatory standards
✅ **Secure Coding** — Code review, vulnerability fixes
✅ **Extended Reasoning** — Deep analysis of complex security issues

## Cost Advantage

| Metric | Kimi (Reasoner) | Claude Opus | Savings |
|--------|-----------------|-------------|---------|
| Input | $0.55/M | $15/M | **96%** |
| Output | $2.19/M | $60/M | **96%** |
| Typical Audit | ~$2.00 | ~$15.00 | **87%** |

**Example:** Security audit of 2000 LOC:
- Kimi: ~$2.00
- Claude Opus: ~$15.00
- **Savings: $13.00 per audit**

## Thinking Process

Kimi uses **extended reasoning** (up to 10K thinking tokens) for deep security analysis:

1. **Threat Assessment** — Identify who, what, when, where, how
2. **Attack Surface Mapping** — External entry points, internal access
3. **Vulnerability Analysis** — Known CVEs, code flaws, design issues
4. **Risk Calculation** — Likelihood × Impact = Risk Level
5. **Mitigation Design** — Controls, detective measures, response plan
6. **Compliance Mapping** — Standards applicability, gap analysis

Budget: 10,000 thinking tokens per request

## How Routing Selects This Agent

The [[keyword-matching-strategy]] scores incoming messages:
- "security" keyword → Security match (high confidence)
- "threat" keyword → Security match (high confidence)
- "vulnerability" keyword → Security match (very high confidence)
- Complexity assessment → If high/critical, Security agent needed
- Cost optimization → Prefer Kimi for deep reasoning (60-70% cheaper than Opus)

## Related Claims

- [[task-complexity-assessment]] — Determines if Security should handle this
- [[agent-pm]] — For policy decisions after security audit
- [[keyword-matching-strategy]] — How we detect security-related requests
- [[sensitive-data-detection]] — Protecting personal/sensitive information
- [[deepseek-kimi-integration]] — Full Deepseek setup guide

## Integration Notes

- **Model:** `deepseek-reasoner` (full Kimi model, best for reasoning)
- **API:** Deepseek API (free tier available, higher limits for paid)
- **Auth:** `DEEPSEEK_API_KEY` environment variable
- **Input Tokens:** 128K context window (best for long code reviews)
- **Output Tokens:** 16K per request
- **Thinking Tokens:** 10K budget (uses extended reasoning)

## Example Usage

```typescript
// Deepseek Security Analysis
const deepseekClient = new DeepseekClient(process.env.DEEPSEEK_API_KEY, "deepseek-reasoner");

const result = await deepseekClient.analyzeSecurityThreat(
  "Our API accepts JSON with user input. Is it vulnerable to JSON injection?",
  "We use JSON.parse() without sanitization",
  8000  // thinking budget
);

console.log("Analysis:", result.analysis);
console.log("Reasoning:", result.thinking);
console.log("Tokens used:", result.tokensUsed);
```

---

**Status:** ✅ Ready for production use
**Cost Efficiency:** Best for deep security analysis
**Advantage:** Extended reasoning finds subtle vulnerabilities
**Alternative:** [[agent-security]] (Claude Opus - more expensive but good backup)
