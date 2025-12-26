# Inspector Surface v1

**Sprint Name:** `inspector-surface-v1`  
**Status:** Ready for Execution  
**Created:** 2024-12-26  
**Prerequisite:** object-versioning-v1  
**Estimated Effort:** 3-4 hours

---

## Vision

Create a thin abstraction layer between Inspector UI components and data/versioning operations. This preserves A2UI protocol optionality without blocking current development or changing user-visible behavior.

---

## The Problem

The ObjectInspector currently has tight coupling between React components and data operations:

```
ObjectInspector.tsx
    ↓ direct hook calls
useCopilot.ts + useVersionedObject.ts
    ↓ direct store calls
VersionedObjectStore
```

This works but creates two issues:
1. **Testing friction:** Can't easily mock data layer for component tests
2. **Renderer lock-in:** Switching to A2UI later would require rewriting components

---

## The Solution

Extract an `InspectorSurface` interface that defines the contract:

```
ObjectInspector.tsx
    ↓ context consumption
InspectorSurface (interface)
    ↓
ReactInspectorSurface (implementation)
    ↓
Existing hooks + VersionedObjectStore
```

**Key insight:** We're not adding abstraction for abstraction's sake. We're documenting the implicit contract that already exists, making it explicit and swappable.

---

## Success Criteria

1. **No behavior changes:** All existing functionality preserved
2. **Clean interface:** `InspectorSurface` defines data + action + versioning operations
3. **React implementation:** `ReactInspectorSurface` wraps existing hooks
4. **Context injection:** Components consume surface via React Context
5. **A2UI documented:** Interface methods map to A2UI concepts in comments

---

## Scope

### In Scope
- `InspectorSurface` interface definition
- `ReactInspectorSurface` implementation
- `InspectorSurfaceContext` and provider
- `useInspectorSurface` hook
- Wire `ObjectInspector` through context
- A2UI mapping documentation

### Out of Scope
- A2UI implementation (future, if protocol matures)
- New Inspector features
- Changes to Copilot interaction flow
- Performance optimizations

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Interface granularity | Single interface | Simpler; can split later if needed |
| Injection pattern | React Context | Idiomatic; cleaner than prop drilling |
| Hook strategy | Surface wraps hooks | Minimal disruption to existing code |
| Naming | InspectorSurface | Matches "surface" terminology (Genesis, Terminal) |

---

## Roadmap Context

This is sprint 2 of the Inspector Architecture Evolution:

1. **object-versioning-v1** ← Completed/In Progress
2. **inspector-surface-v1** ← This sprint
3. **version-history-ui-v1** — Version history panel and restore
4. **a2ui-evaluation-checkpoint** — Decision on protocol adoption (Q2 2025)

---

## Sprint Artifacts

| File | Purpose |
|------|---------|
| INDEX.md | This document |
| REPO_AUDIT.md | Current state analysis |
| SPEC.md | Detailed requirements |
| ARCHITECTURE.md | Technical design |
| DECISIONS.md | ADRs |
| MIGRATION_MAP.md | File changes |
| SPRINTS.md | Epic breakdown |
| EXECUTION_PROMPT.md | Self-contained handoff |
| DEVLOG.md | Execution tracking |

---

*Canonical location: `docs/sprints/inspector-surface-v1/INDEX.md`*
