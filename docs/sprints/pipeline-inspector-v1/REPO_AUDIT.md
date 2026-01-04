# Repository Audit: pipeline-inspector-v1
**Date:** 2025-01-03
**Sprint:** pipeline-inspector-v1
**Scope:** PipelineMonitor console, Inspector integration, Copilot commands, Document enrichment

---

## Executive Summary

The Pipeline Monitor console exists but lacks Inspector Panel and Copilot integration. The primary technical debt is tier terminology misalignment between UI (`seedling`, `oak`) and database schema (`seed`, `tree`). This sprint adds enrichment capabilities while fixing the terminology and aligning with Knowledge Commons architecture.

---

## Current State Analysis

### Console Structure

```
src/bedrock/consoles/PipelineMonitor/
├── DocumentCard.tsx       → Individual document display (needs tier fix)
├── DocumentsView.tsx      → Collection view with filters (needs tier fix)
├── HubSuggestions.tsx     → AI hub generation
├── JourneySynthesis.tsx   → AI journey synthesis
├── PipelineMonitor.tsx    → Main console component
├── ProcessingQueue.tsx    → Embedding status display
├── UploadModal.tsx        → File upload interface
├── pipeline.config.ts     → Status definitions
└── index.ts               → Module exports
```

### Console Factory Integration Status

**Current:** PipelineMonitor is NOT integrated with console-factory pattern.
**Required:** Must integrate for Inspector Panel and Copilot support.

### Database Schema

**Location:** `supabase/migrations/001_kinetic_pipeline.sql`

**Current columns:**
- id, title, content, content_length, file_type, source_url
- tier (with canonical values in DB), embedding_status
- created_at, updated_at

**Missing enrichment columns:** keywords, summary, document_type, named_entities, questions_answered, temporal_class, retrieval_count, utility_score, editorial_notes, provenance fields

### Tier Terminology Debt

| Layer | Current Values | Canonical Values |
|-------|----------------|------------------|
| Database schema | seed, sprout, sapling, tree, grove | ✓ Correct |
| UI filters (DocumentsView.tsx) | seedling, sapling, oak | ✗ Wrong |
| DocumentCard rendering | seedling, sapling, oak | ✗ Wrong |

**Lines requiring fixes:**
- DocumentsView.tsx:122-125 (tier filter options)
- DocumentCard.tsx (tier display logic)

---

## Files Requiring Modification

### Must Modify

| File | Changes | Reason |
|------|---------|--------|
| `DocumentsView.tsx` | Fix tier filter values | ADR-001 compliance |
| `DocumentCard.tsx` | Fix tier display | ADR-001 compliance |
| `PipelineMonitor.tsx` | Add Inspector/Copilot integration | Sprint goal |
| `pipeline.config.ts` | Add inspector configuration | Bedrock pattern |

### Must Create

| File | Purpose |
|------|---------|
| `supabase/migrations/004_document_enrichment.sql` | Add enrichment columns |
| `src/bedrock/primitives/TagArray.tsx` | Keyword chip management |
| `src/bedrock/primitives/GroupedChips.tsx` | Entity categorization |
| `src/bedrock/primitives/UtilityBar.tsx` | Usage signal display |
| `src/app/api/knowledge/enrich/route.ts` | AI enrichment endpoint |

### Integration Points

| System | Integration Type | Status |
|--------|------------------|--------|
| BedrockLayout | Console wrapper | ✓ Available |
| BedrockInspector | Panel component | ✓ Available |
| BedrockCopilot | AI assistance | ✓ Available |
| console-factory | Config generation | Needs wiring |

---

## Existing Patterns to Extend

### Pattern 4: Token Namespaces

**Use:** `--card-*` tokens for new primitive components (TagArray, GroupedChips, UtilityBar)

### Pattern 7: Object Model (GroveObjectMeta)

**Note:** Documents should eventually implement GroveObjectMeta. This sprint adds enrichment fields that align with future unification.

### Pattern 6: Component Composition

**Use:** Compose BedrockInspector with InspectorSection components for document inspector.

---

## Technical Debt Identified

### High Priority (Must Fix This Sprint)

1. **Tier terminology mismatch** - UI uses non-canonical names
2. **No console-factory integration** - Blocks Inspector/Copilot
3. **No enrichment columns** - Can't store AI extraction results

### Medium Priority (Future Sprint)

1. **Document type doesn't implement GroveObjectMeta** - Pattern 7 alignment
2. **No retrieval tracking** - Can't compute utility scores
3. **Favorites stored in localStorage** - Should use user-preferences.ts

### Low Priority (Tech Debt Backlog)

1. **HubSuggestions/JourneySynthesis not using Copilot pattern** - Legacy AI integration
2. **No visual regression baselines** - Should capture before sprint

---

## API Endpoints

### Existing

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/knowledge/documents` | GET | List documents |
| `/api/knowledge/upload` | POST | Upload document |

### Required (This Sprint)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/knowledge/documents/[id]` | PATCH | Update document fields |
| `/api/knowledge/enrich` | POST | AI extraction (keywords, summary, entities) |

---

## Test Coverage

### Existing

- No dedicated tests for PipelineMonitor console

### Required (This Sprint)

- Tier terminology compliance test
- Copilot command preview confirmation test
- Inspector field save/load test

---

## DEX Compliance Audit

| Principle | Current State | Required Changes |
|-----------|---------------|------------------|
| Declarative Sovereignty | Partial - filters in code | Inspector config should be declarative |
| Capability Agnosticism | N/A (no AI integration yet) | Enrichment should work with any model |
| Provenance | Missing | Add source_context, enriched_by tracking |
| Organic Scalability | Good - existing tier system | Utility score enables quality emergence |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Tier fix breaks existing data | Low | Medium | Migration handles data fix |
| Copilot preview flow too slow | Medium | Low | Batch all extractions in single call |
| Utility score gaming | Low | Low | Log-based formula resists manipulation |

---

## Pre-Sprint Verification

- [ ] Visual regression baselines captured
- [ ] Database backup available
- [ ] All existing tests pass
- [ ] ADR-001 reviewed and accepted
