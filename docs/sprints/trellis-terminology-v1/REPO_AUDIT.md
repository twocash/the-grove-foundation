# Repository Audit — trellis-terminology-v1

## Audit Date: 2025-12-21
## Sprint Type: Documentation & Branding Migration

## Summary

The Grove project has rebranded its core architectural framework from "DAIRE" (Domain-Agnostic Information Refinement Engine) to **Trellis Architecture** with the **DEX (Declarative Exploration) Standard**. This sprint completes the terminology migration across all project files.

**Why the rebrand matters:**
- "DAIRE" is forgettable corporate acronym-speak
- "Trellis" is evocative, memorable, and extensible (Legal Trellis, Academic Trellis)
- The organic metaphor (seeds, soil, vines, fruit, gardeners) makes abstract concepts tangible
- Brand survivability: developers want to contribute to "Trellis," not "DAIRE"

## Files Requiring Updates

### Code Files (Production)
| File | Issue | Priority |
|------|-------|----------|
| `lib/health-validator.js:4` | "Implements DAIRE principles" | High |
| `server.js:1686` | "DAIRE" comment in health section | High |
| `src/foundation/consoles/HealthDashboard.tsx:414` | "DAIRE Alignment" panel title | High |

### Documentation (Sprint Artifacts)
| File | Issue | Priority |
|------|-------|----------|
| `docs/sprints/health-dashboard-v1/DEVLOG.md:13,16,52` | Mixed DAIRE/Trellis references | Medium |
| `docs/sprints/health-dashboard-v1/MIGRATION_MAP.md:5,10,141` | "DAIRE" in descriptions | Medium |
| `docs/sprints/health-dashboard-v1/SPRINTS.md:208` | "DAIRE Alignment" section | Medium |
| `docs/sprints/health-dashboard-v1/EXECUTION_PROMPT.md` | Already migrated (verify) | Low |

### Already Updated (Verification Only)
| File | Status |
|------|--------|
| `SKILL.md` | ✅ Updated to Trellis/DEX terminology |
| `docs/sprints/health-dashboard-v1/REPO_AUDIT.md` | ✅ Updated |
| `docs/sprints/health-dashboard-v1/SPEC.md` | ✅ Updated |
| `docs/sprints/health-dashboard-v1/ARCHITECTURE.md` | ✅ Updated |
| `docs/sprints/health-dashboard-v1/DECISIONS.md` | ✅ Updated |

### Standalone Skill Package
| File | Issue | Priority |
|------|-------|----------|
| `C:\GitHub\grove-foundation-loop-skill\SKILL.md` | No Trellis/DEX terminology | High |
| `C:\GitHub\grove-foundation-loop-skill\references\*.md` | May need Trellis alignment | Medium |

### Tests
| File | Issue | Priority |
|------|-------|----------|
| `tests/integration/health-api.test.ts` | Uses "attribution" (correct), but no DAIRE refs | Verify |
| `tests/unit/health-config.test.ts` | Check for terminology | Verify |

## New Files to Create

| File | Purpose |
|------|---------|
| `docs/architecture/TRELLIS.md` | Canonical Trellis Architecture reference (First Order Directives) |
| `docs/architecture/DEX-STANDARD.md` | DEX Standard specification |

## Terminology Migration Map

| Old Term | New Term | Context |
|----------|----------|---------|
| DAIRE | Trellis Architecture | The framework name |
| DAIRE principles | DEX Standard | The four principles |
| "Declarative Configuration" | "Declarative Sovereignty" | Principle I |
| "Attribution Preservation" | "Provenance as Infrastructure" | Principle III |
| "Three-Layer Separation" | "DEX Stack" / "Three-Layer Abstraction" | Architecture |
| "Progressive Enhancement" | "Organic Scalability" | Principle IV |
| (new) | "Capability Agnosticism" | Principle II |
| (new) | "Human-AI Symbiosis" / "The Gardener" | Principle IV addition |

## Trellis Terminology Reference

| Term | Definition |
|------|------------|
| **Trellis** | The structural framework (architecture) supporting the DEX stack |
| **DEX** | Declarative Exploration — methodology separating intent from inference |
| **Trellis Frame** | Engine layer — fixed infrastructure, low change velocity |
| **Substrate** | Corpus layer — variable input, medium change velocity |
| **Conditions** | Configuration layer — DEX definitions, high change velocity |
| **Vine** | Execution capability (LLM, RAG) — interchangeable and ephemeral |
| **Sprout** | Atomic unit of captured insight |
| **Grove** | Accumulated, refined knowledge base |
| **Gardener** | Human applying judgment (pruning) to AI-generated possibilities (growth) |
| **Superposition Collapse** | Human attention transforming AI outputs into validated insights |

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking existing code | Low | High | Search-replace with context verification |
| Incomplete migration | Medium | Low | Comprehensive audit first |
| Inconsistent terminology | Medium | Medium | Create canonical reference docs |
