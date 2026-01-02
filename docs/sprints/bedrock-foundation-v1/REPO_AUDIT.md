# Repository Audit: bedrock-foundation-v1

**Sprint:** bedrock-foundation-v1  
**Date:** December 30, 2024  
**Auditor:** Foundation Loop  

---

## Executive Summary

This audit examines the Grove codebase to inform the Bedrock sprint—a clean-room implementation of administrative consoles that will eventually replace the Foundation surface.

**Key Finding:** The existing Foundation surface (`src/foundation/`) is tightly coupled to legacy patterns. Rather than refactor, we implement Bedrock as a parallel system following the "strangler fig" pattern, then deprecate Foundation once feature parity is achieved.

---

## Current Architecture

### Directory Structure (Relevant)

```
src/
├── core/
│   ├── schema/
│   │   ├── grove-object.ts          ← GroveObjectMeta definition (USE)
│   │   └── narrative.ts             ← LensReality types (N/A for admin)
│   └── engagement/                   ← XState machines (N/A for admin)
│
├── foundation/                       ← LEGACY - Do not import
│   ├── components/                   ← Coupled to old patterns
│   ├── contexts/                     ← Legacy state management
│   └── ...
│
├── lib/
│   └── storage/
│       └── user-preferences.ts      ← Favorites storage (USE)
│
├── app/
│   ├── globals.css                  ← Token definitions (USE --card-*)
│   └── bedrock/                     ← Route placeholder (CREATE)
│
└── bedrock/                         ← TARGET - Create this
```

### Existing Patterns to Leverage

| Pattern | Location | Status | Notes |
|---------|----------|--------|-------|
| GroveObjectMeta | `src/core/schema/grove-object.ts` | ✅ Stable | Base for all Bedrock types |
| Card tokens | `src/app/globals.css` | ✅ Stable | `--card-*` namespace |
| Favorites | `src/lib/storage/user-preferences.ts` | ✅ Stable | localStorage with optional sync |

### Patterns to Avoid

| Pattern | Location | Why Avoid |
|---------|----------|-----------|
| Foundation contexts | `src/foundation/contexts/` | Tightly coupled to legacy |
| Foundation components | `src/foundation/components/` | Would create import dependency |
| Old card implementations | Various | Don't match GroveObject model |

---

## Technical Debt Identified

### 1. No Reusable Collection View

**Current state:** Each surface implements its own filter/sort/display logic.

**Debt:** Duplicated logic, inconsistent UX, hard to maintain.

**Resolution:** Create `useCollectionView` hook as canonical pattern.

### 2. No Admin Console Pattern

**Current state:** Foundation has ad-hoc layouts.

**Debt:** New admin surfaces require reinventing structure.

**Resolution:** Create `BedrockLayout` as canonical three-column shell.

### 3. No Copilot Integration Pattern

**Current state:** No standard for AI-assisted editing.

**Debt:** Each feature would implement differently.

**Resolution:** Create `BedrockCopilot` with standard context protocol.

### 4. No Undo/Redo Infrastructure

**Current state:** Edits are immediate with no recovery.

**Debt:** User mistakes require manual correction.

**Resolution:** Create `usePatchHistory` hook for all editors.

---

## API Assessment

### Current Endpoints (Relevant)

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/lenses` | GET | Exists | Returns lens array |
| `/api/lenses/:id` | GET | Exists | Returns single lens |
| `/api/lenses` | POST | Exists | Creates lens |
| `/api/lenses/:id` | PATCH | Partial | Needs GroveObject envelope |
| `/api/lenses/:id` | DELETE | Exists | Deletes lens |

### API Changes Needed

1. Standardize response envelope to `{ data: GroveObject, meta: {} }`
2. Accept JSON Patch format for PATCH operations
3. Return version numbers for optimistic locking

---

## File Impact Analysis

### Files to Create

```
src/bedrock/
├── primitives/
│   ├── BedrockLayout.tsx           NEW
│   ├── BedrockNav.tsx              NEW
│   ├── BedrockInspector.tsx        NEW
│   ├── BedrockCopilot.tsx          NEW
│   ├── ConsoleHeader.tsx           NEW
│   ├── MetricsRow.tsx              NEW
│   └── StatCard.tsx                NEW
├── components/
│   ├── FilterBar.tsx               NEW
│   ├── ObjectGrid.tsx              NEW
│   ├── ObjectList.tsx              NEW
│   ├── ObjectCard.tsx              NEW
│   ├── FavoriteToggle.tsx          NEW
│   ├── ViewModeToggle.tsx          NEW
│   └── EmptyState.tsx              NEW
├── patterns/
│   ├── useCollectionView.ts        NEW
│   ├── usePatchHistory.ts          NEW
│   ├── useBedrockCopilot.ts        NEW
│   ├── GroveApi.ts                 NEW
│   └── collection-view.types.ts    NEW
├── context/
│   ├── BedrockUIContext.tsx        NEW
│   └── BedrockCopilotContext.tsx   NEW
├── consoles/
│   └── LensWorkshop/
│       ├── index.ts                NEW
│       ├── LensWorkshop.tsx        NEW
│       ├── LensWorkshop.config.ts  NEW
│       ├── LensGrid.tsx            NEW
│       ├── LensCard.tsx            NEW
│       ├── LensEditor.tsx          NEW
│       └── LensCopilotActions.ts   NEW
├── types/
│   ├── lens.ts                     NEW
│   ├── console.types.ts            NEW
│   └── copilot.types.ts            NEW
└── config/
    └── navigation.ts               NEW

src/app/bedrock/
├── layout.tsx                      NEW
├── page.tsx                        NEW (redirect to /bedrock/lenses)
└── lenses/
    └── page.tsx                    NEW
```

### Files to Modify

| File | Change |
|------|--------|
| `src/core/schema/grove-object.ts` | Add Lens payload type |
| `src/app/globals.css` | Add Bedrock-specific tokens if needed |
| `src/server.js` | Add/update lens API endpoints |

### Files to NOT Touch

- Everything in `src/foundation/` (strangler fig boundary)
- Explore surface files (different concern)
- Terminal surface files (different concern)

---

## Test Coverage Assessment

### Existing Tests

| Area | Coverage | Notes |
|------|----------|-------|
| E2E: Foundation | Partial | Legacy tests, may not apply |
| E2E: Genesis | Good | Visual regression baselines exist |
| Unit: Hooks | Minimal | Most hooks untested |

### Tests Needed for Bedrock

| Test Type | Files |
|-----------|-------|
| Unit | `useCollectionView.test.ts` |
| Unit | `usePatchHistory.test.ts` |
| Unit | `GroveApi.test.ts` |
| Integration | `LensWorkshop.integration.test.ts` |
| E2E | `bedrock-lenses.spec.ts` |
| Visual | `bedrock-baseline.spec.ts` |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Pattern drift from spec | Medium | High | Follow LENS_WORKSHOP_REFERENCE.md exactly |
| Foundation import leakage | Medium | High | ESLint rule to block imports |
| API envelope inconsistency | Low | Medium | Create GroveApi class first |
| Copilot complexity | High | Medium | Build patch generator before UI |

---

## Recommendations

1. **Start with data layer** — Build `useCollectionView`, `usePatchHistory`, `GroveApi` before any UI
2. **Test hooks in isolation** — Unit tests prove logic before wiring to components
3. **Add ESLint rule** — Block any import from `src/foundation/`
4. **Follow reference exactly** — LENS_WORKSHOP_REFERENCE.md is canonical

---

## Conclusion

The codebase is ready for Bedrock. Key infrastructure exists (GroveObjectMeta, card tokens, favorites storage). The sprint creates new canonical patterns that future consoles will reuse. Clean-room implementation ensures no coupling to legacy Foundation.

**Proceed to SPEC.md.**
