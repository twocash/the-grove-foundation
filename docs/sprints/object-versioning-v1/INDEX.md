# Object Versioning v1

**Sprint Name:** `object-versioning-v1`  
**Status:** Ready for Execution  
**Created:** 2024-12-26  
**Estimated Effort:** 6-7 hours

---

## Vision

Every modification to a Grove object creates an immutable version record with full provenance. Changes persist across browser sessions. Users see version indicators showing when and how content was modified. The system implements DEX Pillar III (Provenance as Infrastructure) at the storage layer.

---

## The Problem

The Copilot Configurator (Sprint 7) delivered natural language editing with diff preview and explicit confirmation. But changes only exist in React state—refreshing the page loses all edits.

**Current State:**
```
User input → Copilot → JSON Patch → Apply → React state updated → ❌ Lost on refresh
```

**Required State:**
```
User input → Copilot → JSON Patch → Apply → Version created → Persisted → ✅ Survives refresh
```

---

## Success Criteria

1. **Persistence:** Objects modified via Copilot persist across browser refresh
2. **Provenance:** Each modification creates a version record with actor, source, timestamp, and the patch applied
3. **Visibility:** Users see version indicator ("v3 • Modified 2 min ago via Copilot")
4. **Abstraction:** Storage logic is isolated in a service layer (not React components) for future A2UI compatibility

---

## Scope

### In Scope
- Version record schema with GUID + ordinal
- IndexedDB storage with localStorage caching
- Copilot integration (create version on Apply)
- Version indicator in ObjectInspector header
- Auto-create "v1 - System Import" for baseline objects
- 50-version retention limit per object (MVP)

### Out of Scope (Future Sprints)
- Version history panel UI
- Diff viewer between versions
- Restore to previous version
- Cross-tab synchronization
- Cloud sync
- Conflict resolution

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Version retention | 50 per object | MVP limit; noted in comments for future expansion |
| Baseline import | Auto-create v1 | Ensures provenance chain from first load |
| Actor model ID | `hybrid-local` / `hybrid-cloud` | Future-proof routing params; UI shows friendly labels |
| Session ID | Use engagement session | Prepares for user management integration |
| Optimistic UI | Confirm immediately | MVP simplicity; persist-wait noted for future |

---

## Architecture Summary

```
┌────────────────────────────────────────────────────────────────────┐
│                    VERSIONING ARCHITECTURE                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐     ┌───────────────────┐     ┌─────────────────┐ │
│  │  Copilot    │ ──► │ VersionedObject   │ ──► │  IndexedDB      │ │
│  │  useCopilot │     │     Store         │     │  + localStorage │ │
│  └─────────────┘     │   (interface)     │     │   (impl)        │ │
│                      └───────────────────┘     └─────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│                      ┌───────────────────┐                         │
│                      │ ObjectVersion     │                         │
│                      │ + VersionActor    │                         │
│                      │ + VersionSource   │                         │
│                      │ + JsonPatch       │                         │
│                      └───────────────────┘                         │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## Patterns Extended

| Pattern | Extension |
|---------|-----------|
| **Pattern 7: Object Model** | Add versioning metadata to GroveObjectMeta |
| **versioned-artifact.ts** | Add ObjectVersion with provenance, keep existing VersionedArtifact |
| **user-preferences.ts** | Follow `grove:` prefix pattern for localStorage |
| **DEX Pillar III** | Full implementation of provenance chain |

---

## Sprint Artifacts

| File | Purpose |
|------|---------|
| INDEX.md | This document (vision + scope) |
| REPO_AUDIT.md | Current state analysis |
| SPEC.md | Detailed requirements |
| ARCHITECTURE.md | Technical design |
| DECISIONS.md | Architectural decision records |
| MIGRATION_MAP.md | File changes required |
| SPRINTS.md | Epic breakdown with build gates |
| EXECUTION_PROMPT.md | Self-contained handoff for execution |
| DEVLOG.md | Execution tracking |

---

## Roadmap Context

This is sprint 1 of the Inspector Architecture Evolution:

1. **object-versioning-v1** ← This sprint
2. **inspector-surface-v1** — Extract InspectorSurface interface for A2UI compatibility
3. **version-history-ui-v1** — Version history panel and restore capability
4. **a2ui-evaluation-checkpoint** — Decision point on protocol adoption (Q2 2025)

---

*Canonical location: `docs/sprints/object-versioning-v1/INDEX.md`*
