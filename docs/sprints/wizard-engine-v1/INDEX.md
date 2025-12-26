# Sprint: wizard-engine-v1

**Status:** Planning Complete  
**Duration:** ~4-5 hours  
**Pattern:** 10 (Declarative Wizard Engine)  
**DEX Compliance:** ✅ Full

## Sprint Navigation

| Artifact | Purpose | Status |
|----------|---------|--------|
| [INDEX.md](./INDEX.md) | This file | ✅ |
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Current state analysis | ✅ |
| [SPEC.md](./SPEC.md) | Requirements & scope | ✅ |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical design | ✅ |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | File changes | ✅ |
| [DECISIONS.md](./DECISIONS.md) | ADRs | ✅ |
| [SPRINTS.md](./SPRINTS.md) | Epic/story breakdown | ✅ |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | CLI handoff | ✅ |
| [DEVLOG.md](./DEVLOG.md) | Execution tracking | 🔲 |

## The Mission

Extract the CustomLensWizard's implicit architecture into a **Declarative Wizard Engine** that can power any multi-step personalization flow from JSON schema.

## Why This Matters

**Current state:** CustomLensWizard hard-codes its flow logic. Every new wizard (journeys, onboarding, preferences) would require duplicate engineering work.

**Target state:** New wizards are JSON files. Domain experts create personalization flows without code changes. The engine interprets; the schema defines.

**DEX alignment:** This is textbook Declarative Sovereignty—domain expertise belongs in configuration, not code.

## Quick Start

```bash
# Navigate to sprint docs
cd C:\GitHub\the-grove-foundation\docs\sprints\wizard-engine-v1

# For execution, start with
cat EXECUTION_PROMPT.md
```

---

*Created: December 2024*
*Sprint: wizard-engine-v1*
