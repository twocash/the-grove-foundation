# v0.14 Reality Projector — SPRINTS

## Epic Overview

| Epic | Description | Stories | Est. Hours |
|------|-------------|---------|------------|
| Epic 1 | Core Infrastructure | 3 | 4 |
| Epic 2 | Generative Collapse | 4 | 6 |
| Epic 3 | Visual Polish | 2 | 2 |
| Epic 4 | Viral Loop | 4 | 4 |
| Epic 5 | Integration & Wiring | 3 | 3 |
| Epic 6 | Verification | 1 | 2 |
| **Total** | | **17** | **21** |

---

## Epic 1: Core Infrastructure

### Story 1.1: Install LZ-String Dependency

```bash
npm install lz-string
npm install --save-dev @types/lz-string
```

### Story 1.2: Create Rhetorical Skeleton Module

**File:** `src/core/transformers/RhetoricalSkeleton.ts`

Defines constraint patterns and COLLAPSE_SYSTEM_PROMPT for reality generation.

### Story 1.3: Create Reality Cache Module

**File:** `src/core/cache/RealityCache.ts`

Dual-layer cache (memory + sessionStorage) with hash-based keys.

---

## Epic 2: Generative Collapse

### Story 2.1: Create RealityCollapser Service

**File:** `src/core/transformers/RealityCollapser.ts`

Main service orchestrating generation with timeout, caching, and deduplication.

### Story 2.2: Create /api/collapse Endpoint

**File:** `server.js` (add after `/api/generate-lens`, ~line 1680)

Server-side endpoint for reality generation via Gemini.

### Story 2.3: Update useQuantumInterface Hook

**File:** `src/surface/hooks/useQuantumInterface.ts`

Integrate RealityCollapser, add `isCollapsing` state.

### Story 2.4: Update quantum-content.ts

**File:** `src/data/quantum-content.ts`

Keep SUPERPOSITION_MAP for archetypes, add comment about hybrid resolution.

---

## Epic 3: Visual Polish

### Story 3.1: Add Tuning Phase to WaveformCollapse

**File:** `src/surface/components/effects/WaveformCollapse.tsx`

Add `isGenerating` prop, implement scanning cursor (▓▒░▒).

### Story 3.2: Wire isCollapsing to HeroHook

**Files:** 
- `src/surface/components/genesis/HeroHook.tsx` - Add `isCollapsing` prop
- `src/surface/pages/GenesisPage.tsx` - Pass through from hook

---

## Epic 4: Viral Loop

### Story 4.1: Create Lens Serializer Utility

**File:** `src/utils/lensSerializer.ts`

`serializeLens()`, `deserializeLens()`, `generateShareUrl()` functions.

### Story 4.2: Handle ?share= Parameter

**File:** `hooks/useNarrativeEngine.ts`

Add `getInitialShare()` helper, create ephemeral lens from share param.

### Story 4.3: Add Share Button to Terminal Header

**File:** `components/Terminal/TerminalHeader.tsx`

"Share This View" button visible for custom lenses.

### Story 4.4: Add Shared Lens Badge

**File:** `components/Terminal/LensBadge.tsx`

"Viewing: [Label]" badge for ephemeral/shared lenses.

---

## Epic 5: Integration & Wiring

### Story 5.1: Wire GenesisPage to isCollapsing

**File:** `src/surface/pages/GenesisPage.tsx`

Pass `isCollapsing` from `useQuantumInterface` to `HeroHook`.

### Story 5.2: Add getPersonaById to useNarrativeEngine

**File:** `hooks/useNarrativeEngine.ts`

Expose method to get persona/lens by ID.

### Story 5.3: Update Core Index Exports

**File:** `src/core/index.ts`

Export transformers and cache modules.

---

## Epic 6: Verification

### Story 6.1: Manual Test Suite

**Test Checklist:**

- [ ] `/` → "YOUR AI." (Base Reality)
- [ ] `/?lens=engineer` → "LATENCY IS THE MIND KILLER." (instant)
- [ ] Custom lens → tuning indicator → generated content
- [ ] Custom lens refresh → instant (cached)
- [ ] Timeout/error → fallback to Base Reality
- [ ] Share button → URL copied
- [ ] Share URL in incognito → works
- [ ] Invalid share → fallback
- [ ] `npm run build` passes

---

## Implementation Sequence

```
Phase 1: Infrastructure (Stories 1.1-1.3) → BUILD
Phase 2: Generation (Stories 2.1-2.4) → BUILD
Phase 3: Visual (Stories 3.1-3.2) → BUILD
Phase 4: Viral (Stories 4.1-4.4) → BUILD
Phase 5: Integration (Stories 5.1-5.3) → BUILD
Phase 6: Verification (Story 6.1) → SHIP
```

---

## Commit Sequence

```
feat(v0.14): add lz-string dependency
feat(v0.14): create rhetorical skeleton constraints
feat(v0.14): implement reality cache layer
feat(v0.14): create reality collapser service
feat(v0.14): add /api/collapse endpoint
feat(v0.14): update useQuantumInterface for generative collapse
feat(v0.14): add tuning phase to WaveformCollapse
feat(v0.14): wire isCollapsing through components
feat(v0.14): implement lens serializer for sharing
feat(v0.14): handle ?share= URL parameter
feat(v0.14): add share button to terminal header
feat(v0.14): add shared lens viewing badge
test(v0.14): complete manual verification
```
