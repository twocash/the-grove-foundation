# Kinetic Foundation v1.0 — Repository Audit

**Sprint:** `kinetic-foundation-v1`  
**Date:** December 24, 2024  
**Auditor:** Claude Desktop (via deep dive analysis)

---

## Repository Overview

**Repository:** `the-grove-foundation`  
**Primary Stack:** React 18, TypeScript 5, Vite, Tailwind CSS  
**Backend:** Express.js server with Google Cloud Storage  
**Testing:** Vitest (unit), Playwright (E2E)

---

## Architecture Summary

### Foundation Module Structure

```
src/foundation/
├── FoundationWorkspace.tsx      # Main workspace layout (85 lines)
├── FoundationNav.tsx            # Sidebar navigation
├── FoundationHeader.tsx         # Header bar
├── FoundationUIContext.tsx      # Inspector state management (153 lines)
├── FoundationInspector.tsx      # Inspector router (132 lines)
├── components/
│   ├── DataPanel.tsx            # Panel wrapper (59 lines)
│   ├── GlowButton.tsx           # Button primitive (114 lines)
│   └── MetricCard.tsx           # Stat card (76 lines)
├── consoles/
│   ├── NarrativeArchitect.tsx   # Content management (571 lines) ⭐
│   ├── SproutQueue.tsx          # Moderation queue (146 lines)
│   ├── KnowledgeVault.tsx       # RAG documents (223 lines)
│   ├── HealthDashboard.tsx      # System health (540 lines)
│   └── EngagementBridge.tsx     # Engagement monitoring (333 lines)
├── hooks/
│   ├── useNarrativeSchema.ts    # Schema management (337 lines) ⭐
│   └── useSproutQueue.ts        # Queue management (201 lines)
└── inspectors/
    ├── JourneyInspector.tsx     # Journey details (167 lines) ✅
    ├── NodeInspector.tsx        # Node details (192 lines) ✅
    └── SproutReviewInspector.tsx # Sprout moderation (215 lines) ✅
```

### Shared Components

```
src/shared/
├── CollectionHeader.tsx         # Search/filter bar (106 lines) ✅
├── layout/
│   ├── ThreeColumnLayout.tsx    # Three-column grid (68 lines) ✅
│   └── InspectorPanel.tsx       # Inspector wrapper (99 lines) ✅
├── feedback/
│   ├── EmptyState.tsx           # Empty state display ✅
│   ├── LoadingSpinner.tsx       # Loading indicator ✅
│   └── StatusBadge.tsx          # Status badges ✅
└── forms/
    ├── TextInput.tsx
    ├── TextArea.tsx
    ├── Select.tsx
    ├── Checkbox.tsx
    ├── Toggle.tsx
    └── Slider.tsx
```

---

## Key Files Analysis

### NarrativeArchitect.tsx (571 lines) — Primary Extraction Target

**Current Responsibilities:**
- V2.1 schema support (journeys, nodes)
- V2.0 schema support (cards, personas)
- Inline ViewToggle component (~50 lines)
- Inline JourneyList component (~45 lines)
- Inline PersonaList component (~35 lines)
- Inline NodeGrid component (~60 lines)
- Inline CardGrid component (~45 lines)
- Metrics row
- Save to Production with GitHub sync

**DEX Compliance Issues:**
- ❌ Inline components should be shared
- ❌ Schema types not unified under DEXObject
- ❌ No kinetic metadata fields

**Extraction Targets:**
1. ViewToggle → `SegmentedControl`
2. JourneyList/PersonaList → `ObjectList`
3. NodeGrid/CardGrid → `ObjectGrid`

### useNarrativeSchema.ts (337 lines) — Hook to Refactor

**Current Responsibilities:**
- Fetch from `/api/narrative`
- V1 → V2 migration
- CRUD operations
- Save to `/api/admin/narrative`
- GitHub sync status

**DEX Compliance Issues:**
- ❌ No central registry pattern
- ❌ State managed locally, not subscribable
- ❌ Type definitions not DEXObject-based

**Refactor Target:**
- Become facade over DEXRegistry
- Keep public API stable

### FoundationUIContext.tsx (153 lines) — Inspector State

**Current Implementation:**
```typescript
type FoundationInspectorMode =
  | { type: 'none' }
  | { type: 'journey'; journeyId: string }
  | { type: 'node'; nodeId: string }
  | { type: 'persona'; personaId: string }
  | { type: 'card'; cardId: string }
  | { type: 'sprout-review'; sproutId: string }
  | { type: 'rag-document'; documentId: string }
  | { type: 'audio-track'; trackId: string }
  | { type: 'settings'; section: string };
```

**Status:** ✅ Working correctly, no changes needed

---

## Pattern Inventory

### Patterns to Extract

| Pattern | Source | Target | Lines Saved |
|---------|--------|--------|-------------|
| View toggle | NarrativeArchitect | SegmentedControl | ~50 |
| List with selection | NarrativeArchitect | ObjectList | ~80 |
| Grid with cards | NarrativeArchitect | ObjectGrid | ~105 |
| **Total** | | | **~235** |

### Patterns Already Extracted ✅

| Pattern | Component | Status |
|---------|-----------|--------|
| Three-column layout | ThreeColumnLayout | ✅ Working |
| Inspector wrapper | InspectorPanel | ✅ Working |
| Search/filter bar | CollectionHeader | ✅ Working |
| Stat card | MetricCard | ✅ Working |
| Panel wrapper | DataPanel | ✅ Working |
| Button | GlowButton | ✅ Working |
| Empty state | EmptyState | ✅ Working |

---

## Type System Analysis

### Current Schema Types (data/narratives-schema.ts)

```typescript
// V2.1 Types
interface Journey { id, title, description, status, version, entryNodeId, ... }
interface JourneyNode { id, label, query, journeyId, sequenceOrder, ... }
interface TopicHub { id, title, tags, priority, enabled, ... }

// V2.0 Types
interface Persona { id, publicLabel, description, enabled, ... }
interface Card { id, query, contextSnippet, personas, next, ... }
```

### Missing DEX Fields

Current types lack:
- `proposedBy: 'human' | 'agent'`
- `approvedBy?: string`
- `telemetryScore?: number`
- `evolutionHistory?: DEXVersionEntry[]`

### Type Migration Strategy

1. Create `DEXObject` base interface
2. Create extended types (`DEXJourney`, `DEXNode`, etc.)
3. Keep existing types for backward compatibility
4. Add conversion functions

---

## Test Coverage Analysis

### Current Test Files

```
tests/
├── unit/
│   └── (limited coverage)
├── e2e/
│   ├── foundation/
│   │   └── narrative-architect.spec.ts
│   └── ...
└── vitest.config.ts
```

### Coverage Gaps

- ❌ No unit tests for DEX types (to be created)
- ❌ No unit tests for registry (to be created)
- ❌ No component tests for shared components
- ✅ E2E tests for NarrativeArchitect flows exist

### Test Files to Create

```
tests/unit/core/schema/dex.test.ts
tests/unit/core/registry/DEXRegistry.test.ts
tests/unit/shared/SegmentedControl.test.tsx
tests/unit/shared/ObjectList.test.tsx
tests/unit/shared/ObjectGrid.test.tsx
```

---

## Technical Debt Identified

### High Priority

1. **Inline components in NarrativeArchitect** — Blocks reuse
2. **No unified type system** — Multiple similar types with different shapes
3. **No central state management** — Each hook manages own state

### Medium Priority

1. **Limited unit test coverage** — Relying on E2E tests
2. **Console layout inconsistency** — Each console has different structure
3. **Inspector placeholders** — Some inspectors not implemented

### Low Priority

1. **V2.0 schema support** — Legacy, can deprecate later
2. **Form components not integrated** — Using but not standardized

---

## Dependencies

### NPM Dependencies (relevant)

```json
{
  "react": "^18.2.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.4.0",
  "@google-cloud/storage": "^7.0.0",
  "@google/genai": "^0.1.0",
  "express": "^4.18.0",
  "lucide-react": "^0.263.1"
}
```

### External Services

- Google Cloud Storage (GCS) — Schema persistence
- Gemini API — AI capabilities
- GitHub API — Sync-back to repository

---

## Build Configuration

### Vite Config

```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@core': '/src/core',
      '@shared': '/src/shared',
      '@foundation': '/src/foundation',
    }
  }
})
```

### TypeScript Config

```json
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["./src/core/*"],
      "@shared/*": ["./src/shared/*"]
    }
  }
}
```

---

## Audit Summary

### What's Working ✅

1. Three-panel layout with inspector
2. NarrativeArchitect full functionality
3. Inspector navigation (journey → node)
4. Save to Production with GitHub sync
5. E2E test coverage for main flows

### What Needs Work ❌

1. Extract inline components to shared
2. Create unified DEX type system
3. Create central registry pattern
4. Add unit test coverage

### Risk Assessment

| Area | Risk Level | Notes |
|------|------------|-------|
| Component extraction | Low | Additive change, no deletions |
| Type system | Low | New types alongside existing |
| Registry pattern | Medium | Core infrastructure |
| Hook refactor | Low | Internal change, API stable |

---

## Recommendations

1. **Start with Epic 1 (DEX Types)** — Foundation for everything else
2. **Epic 2 and 3 can parallel** — No dependencies between them
3. **Test after each epic** — Catch issues early
4. **Keep backward compatibility** — No breaking changes

---

## Files to Create

```
src/core/schema/dex.ts
src/core/registry/DEXRegistry.tsx
src/core/registry/useDEXRegistry.ts
src/core/registry/index.ts
src/shared/SegmentedControl.tsx
src/shared/ObjectList.tsx
src/shared/ObjectGrid.tsx
tests/unit/core/schema/dex.test.ts
tests/unit/core/registry/DEXRegistry.test.ts
```

## Files to Modify

```
src/core/schema/index.ts          # Add DEX exports
src/shared/index.ts               # Add component exports
src/foundation/consoles/NarrativeArchitect.tsx  # Use new components
src/foundation/hooks/useNarrativeSchema.ts      # Delegate to registry
```
