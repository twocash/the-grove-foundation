# Sprint Index: pipeline-inspector-v1

**Status:** Planning Complete, Ready for Execution  
**Date:** 2025-01-03  
**Est. Hours:** ~20

---

## Sprint Overview

Extend PipelineMonitor console with Inspector Panel and Copilot support, aligned with Knowledge Commons architecture.

### Goals
- Fix tier terminology (seedling→seed, oak→tree)
- Add Inspector Panel for document metadata editing
- Add Copilot commands for AI enrichment
- Track quality signals (utility score, retrieval counts)

### Non-Goals
- Hybrid retrieval search (optional, future)
- Sprout↔Document direct coupling (future sprint)
- Network-level Grove tier adoption (future)

---

## Artifact Index

| Artifact | Purpose | Status |
|----------|---------|--------|
| [SPEC.md](SPEC.md) | Full specification, requirements | ✅ Complete |
| [ADR-001-*.md](ADR-001-knowledge-commons-unification.md) | Tier unification decision | ✅ Accepted |
| [DEVELOPMENT_CONTRACT.md](DEVELOPMENT_CONTRACT.md) | Binding constraints | ✅ Active |
| [REPO_AUDIT.md](REPO_AUDIT.md) | Current state analysis | ✅ Complete |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Target state design | ✅ Complete |
| [MIGRATION_MAP.md](MIGRATION_MAP.md) | File-by-file change plan | ✅ Complete |
| [DECISIONS.md](DECISIONS.md) | ADR consolidation | ✅ Complete |
| [SPRINTS.md](SPRINTS.md) | Epic/story breakdown | ✅ Complete |
| [EXECUTION_PROMPT.md](EXECUTION_PROMPT.md) | Claude CLI handoff | ✅ Complete |
| [DEVLOG.md](DEVLOG.md) | Execution tracking | 📝 Active |
| [CONTINUATION_PROMPT.md](CONTINUATION_PROMPT.md) | Session handoff | ✅ Complete |

---

## Quick Start for Execution

### Claude CLI
```bash
cd C:\GitHub\the-grove-foundation
# Open EXECUTION_PROMPT.md and follow step-by-step
```

### Key Commands
```bash
# Build gate
npm run build && npm test && npx tsc --noEmit

# Tier compliance check
grep -rn "seedling\|\"oak\"\|'oak'" src/
```

---

## Epic Summary

| # | Epic | Hours | Status |
|---|------|-------|--------|
| 1 | Schema & Types | 2 | Not Started |
| 2 | Tier Fix | 1 | Not Started |
| 3 | New Primitives | 3 | Not Started |
| 4 | Inspector Integration | 3 | Not Started |
| 5 | Copilot Integration | 4 | Not Started |
| 6 | API Endpoints | 4 | Not Started |
| 7 | Tests | 3 | Not Started |
| | **Total** | **~20** | |

---

## Critical Files to Modify

```
supabase/migrations/004_document_enrichment.sql  ← CREATE
src/bedrock/consoles/PipelineMonitor/
├── types.ts                    ← CREATE
├── document-inspector.config.ts ← CREATE
├── document-copilot.config.ts   ← CREATE
├── copilot-handlers.ts          ← CREATE
├── DocumentsView.tsx           ← MODIFY (tier fix)
├── DocumentCard.tsx            ← MODIFY (tier fix)
└── PipelineMonitor.tsx         ← MODIFY (integration)
src/bedrock/primitives/
├── TagArray.tsx                ← CREATE
├── GroupedChips.tsx            ← CREATE
└── UtilityBar.tsx              ← CREATE
src/app/api/knowledge/
├── documents/[id]/route.ts     ← CREATE
└── enrich/route.ts             ← CREATE
```

---

## Authority Chain

```
DEVELOPMENT_CONTRACT.md (binding constraints)
        ↓
ADR-001-*.md (architectural authority)
        ↓
SPEC.md (requirements)
        ↓
ARCHITECTURE.md (design)
        ↓
EXECUTION_PROMPT.md (implementation)
```

When in doubt, refer up the chain.
