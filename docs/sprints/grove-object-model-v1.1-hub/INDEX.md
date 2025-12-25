# Sprint: Grove Object Model v1.1 — Hub Normalization

**Sprint ID:** grove-object-model-v1.1-hub  
**Status:** Planning  
**Time Budget:** 2-3 hours  
**Predecessor:** grove-object-model-v1 (Sprint 7)

---

## Sprint Navigation

| Artifact | Purpose | Status |
|----------|---------|--------|
| [SPEC.md](./SPEC.md) | Requirements & scope | ✅ |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | File-by-file changes | ✅ |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | CLI handoff | ✅ |
| [DEVLOG.md](./DEVLOG.md) | Execution tracking | ✅ |

---

## Overview

This sprint extends the Object Model (Pattern 7) to include **TopicHub**.

Hubs are knowledge clusters—collections of documents organized around a topic (e.g., "Ratchet Effect", "Simulation Theory"). They're central to Grove's RAG architecture and deserve first-class object status.

---

## Why Hubs Matter

Hubs are where **knowledge lives**. They're the raw material that journeys draw from, that agents synthesize, that the knowledge commons accumulates. Normalizing hubs means:

- **Favorites:** Users can star hubs they reference frequently
- **Filtering:** Show only active hubs, or find drafts needing review
- **Provenance:** Track who created a hub and when (especially for AI-generated hubs)
- **Unified rendering:** HubCard in admin and explore interfaces

---

## Current State (from Sprint 7 Audit)

TopicHub already has most GroveObjectMeta fields:

| Field | Present | Notes |
|-------|---------|-------|
| id | ✅ | |
| title | ✅ | |
| description | ❌ | Uses `expertFraming` instead |
| icon | ❌ | Missing |
| createdAt | ✅ | |
| updatedAt | ✅ | |
| createdBy | ❌ | Missing |
| status | ✅ | 'active' / 'draft' / 'archived' |
| tags | ⚠️ | Present but for RAG routing |
| favorite | ❌ | User-local, via localStorage |

**Work required:** Extend type, add normalizer, add renderer.

---

## Scope

### In Scope
1. Extend TopicHub to implement GroveObjectMeta
2. Add `normalizeHub()` function
3. Add `HubContent` renderer component
4. Register hub in `CONTENT_RENDERERS`
5. Update `useGroveObjects` to include hubs

### Out of Scope
- Hub creation UI
- Hub editing UI
- RAG system changes

---

## Success Criteria

- [ ] `useGroveObjects({ types: ['hub'] })` returns normalized hubs
- [ ] `GroveObjectCard` renders hub with HubContent
- [ ] Can favorite a hub
- [ ] Build passes, tests pass

---

*Extension sprint following Pattern 7 methodology.*
