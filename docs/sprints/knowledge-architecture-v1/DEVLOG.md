# Knowledge Architecture Rationalization — Development Log

## Session Info
- **Date:** 2025-12-21
- **Sprint:** knowledge-architecture-v1
- **Status:** Planning Complete

## Planning Artifacts
- [x] REPO_AUDIT.md
- [x] SPEC.md
- [x] ARCHITECTURE.md
- [x] MIGRATION_MAP.md
- [x] DECISIONS.md
- [x] SPRINTS.md
- [x] EXECUTION_PROMPT.md

## Problem Statement

The Terminal's knowledge system (`narratives.json`) conflates 8 distinct concerns in a single 773-line file:

1. Presentation (lenses, messaging)
2. Feature flags
3. Legacy topic hubs
4. Default context config
5. GCS file mapping
6. Knowledge hubs (new)
7. Journeys
8. Nodes

This violates separation of concerns and makes the system hard to understand, maintain, and extend. Additionally:
- Two hub concepts exist (`topicHubs` and `hubs`) with different schemas
- Hub paths are inconsistent (`hubs/x/` vs `knowledge/`)
- The `architecture` journey has no linked hub
- No schema validation exists

## Solution

Split `narratives.json` into domain-specific files:

```
data/
├── schema/grove-knowledge-ontology.md    # Self-documenting architecture
├── exploration/{journeys,nodes}.json     # Navigation topology
├── knowledge/{hubs,default-context}.json # Semantic geography
├── presentation/lenses.json              # UI messaging
└── infrastructure/{gcs-mapping,feature-flags}.json
```

Key fixes:
- Create `technical-architecture` hub for orphan journey
- Standardize all hub paths to `hubs/{id}/`
- Create schema validator
- Make architecture self-documenting (ontology doc is RAG content)

## Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Split by domain | Matches conceptual model |
| 2 | Merge hubs, deprecate topicHubs | Single source of truth |
| 3 | Enforce `hubs/{id}/` paths | Predictability |
| 4 | Require hub for all journeys | Deterministic RAG |
| 5 | Schema as RAG content | Self-documenting |
| 6 | Fallback to unified file | Safe migration |

## Execution Log

### Epic 1: Schema Foundation
- [ ] Story 1.1: Create directory structure
- [ ] Story 1.2: Create ontology document
- **Build:** Pending
- **Notes:** N/A

### Epic 2: Knowledge Layer
- [ ] Story 2.1: Extract hubs
- [ ] Story 2.2: Extract default context
- **Build:** Pending
- **Notes:** N/A

### Epic 3: Exploration Layer
- [ ] Story 3.1: Extract journeys
- [ ] Story 3.2: Extract nodes
- **Build:** Pending
- **Notes:** N/A

### Epic 4: Presentation Layer
- [ ] Story 4.1: Extract lenses
- **Build:** Pending
- **Notes:** N/A

### Epic 5: Infrastructure Layer
- [ ] Story 5.1: Extract GCS mapping
- [ ] Story 5.2: Extract feature flags
- **Build:** Pending
- **Notes:** N/A

### Epic 6: Server Integration
- [ ] Story 6.1: Create knowledge config loader
- [ ] Story 6.2: Update fetchRagContext
- **Build:** Pending
- **Notes:** N/A

### Epic 7: Validation & Docs
- [ ] Story 7.1: Create schema validator
- [ ] Story 7.2: Mark narratives.json deprecated
- [ ] Story 7.3: Update journey builder guide
- **Build:** Pending
- **Notes:** N/A

### Epic 8: GCS Migration
- [ ] Story 8.1: Move translation-emergence content
- [ ] Story 8.2: Create technical-architecture hub
- [ ] Story 8.3: Update GCS mapping
- **Build:** N/A (GCS ops)
- **Notes:** Defer until after local validation

## Smoke Test
- [ ] Server starts without errors
- [ ] Terminal loads landing page
- [ ] Journey selection works
- [ ] Deterministic Mode works (simulation → meta-philosophy)
- [ ] Discovery Mode works ("ratchet" → ratchet-effect)
- [ ] New architecture journey loads technical-architecture hub
- [ ] Schema validator passes

## Session Notes

**Planning session completed 2025-12-21**

This sprint addresses a fundamental architectural debt: the knowledge system that powers Grove's "exploration architecture" thesis was itself poorly architected. The refactoring makes the architecture self-documenting — the schema explains itself through the system it defines.

The key insight: separation of concerns isn't just good engineering practice, it's essential for declarative systems. When journeys, hubs, and nodes are clearly separated, non-developers can understand and modify the exploration graph without touching code.

The backward-compatibility fallback (if new files missing, use narratives.json) enables safe incremental migration. GCS content moves can happen after local validation.

## Follow-up Items
- [ ] GCS file moves (translation-emergence, technical-architecture)
- [ ] Consider adding `attractors` field to hubs for better discovery
- [ ] Consider `tags.json` taxonomy for Discovery Mode optimization
- [ ] Add ontology doc to RAG content (create knowledge-architecture hub?)
- [ ] Remove narratives.json fallback after validation period

## Time Log
| Phase | Start | End | Duration |
|-------|-------|-----|----------|
| Planning | 2025-12-21 | 2025-12-21 | ~45 min |
| Execution | | | |
| Testing | | | |
| **Total** | | | |
