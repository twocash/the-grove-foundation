# Specification — v0.13 Quantum Interface

## Sprint Goal
Activate the "Reality Tuner." Connect the static Genesis landing page to the Narrative Engine, allowing it to morph dynamically based on the active lens selection (The Observer Effect).

## Strategic Context

### From Static to Quantum
We are evolving from a "Static Site" to a "Quantum Interface."

| Phase | Status | What It Delivers |
|-------|--------|------------------|
| v0.12e | ✅ Complete | Substrate (warm bone paper, content prop interfaces) |
| v0.13 | This Sprint | Superposition logic (lens → content mapping, animation) |
| v0.14 | Future | Extended realities (more screens, deeper customization) |

### The Observer Effect
When a user selects a lens in the Terminal (or Reality Tuner), they are making an observation that collapses the landing page from superposition (default content) into a specific reality (lens-targeted content).

**The metaphor is functional:** The page literally changes based on who is observing it.

### Why This Matters
Different audiences have radically different entry points to The Grove:

| Audience | Primary Hook | Problem Framing |
|----------|--------------|-----------------|
| Default | "YOUR AI." | Tech CEO paternalism |
| Engineer | "LATENCY IS THE MIND KILLER." | Infrastructure constraints |
| Academic | "THE EPISTEMIC COMMONS." | Knowledge enclosure |
| Investor | "THE NEXT INFRASTRUCTURE PLAY." | Market positioning |

A single static landing page can't resonate with all audiences. The Quantum Interface makes the page adaptive.

---

## Architecture Overview

### A. The Substrate (Data Layer)
**File:** `src/data/quantum-content.ts`

Maps `ArchetypeId` → `LensReality`. Contains:
- Default Reality (base Grove copy)
- Collapsed Realities (lens-specific variations)

### B. The Observer (State Layer)
**File:** `src/surface/hooks/useQuantumInterface.ts`

- Listens to `useNarrativeEngine().session.activeLens`
- Detects state changes (lens selection)
- Returns `currentReality` and `quantumTrigger` for components

### C. The Collapse (Visual Layer)
**File:** `src/surface/components/effects/WaveformCollapse.tsx`

- Visualizes the "measurement" event
- Un-type → Pause → Re-type animation sequence
- Blinking grove-forest cursor indicates "machine thought"

### D. The Wiring (Integration Layer)
**File:** `src/surface/pages/GenesisPage.tsx`

- Calls `useQuantumInterface()`
- Passes content props to HeroHook, ProblemStatement
- Components animate on trigger change

---

## Data Model

### LensReality Interface
```typescript
export interface LensReality {
  hero: HeroContent;
  problem: {
    quotes: Quote[];
    tension: string[];  // The "What if..." text
  };
}
```

### Superposition Map
```typescript
export const SUPERPOSITION_MAP: Partial<Record<ArchetypeId | 'freestyle', LensReality>> = {
  'engineer': { /* Engineer-specific content */ },
  'academic': { /* Academic-specific content */ },
  'family-office': { /* Investor-specific content */ },
  // ... other archetypes
};
```

### Resolution Logic
```typescript
export const getReality = (lensId: string | null): LensReality => {
  if (!lensId) return DEFAULT_REALITY;
  
  // Custom lenses map to 'freestyle' reality (or default)
  const key = lensId.startsWith('custom-') ? 'freestyle' : lensId;
  return SUPERPOSITION_MAP[key] || DEFAULT_REALITY;
};
```

---

## Scope

### In Scope
- Content map for 3 archetypes: `engineer`, `academic`, `family-office`
- `useQuantumInterface` hook
- WaveformCollapse animation component
- GenesisPage wiring (HeroHook, ProblemStatement)
- Trigger prop for animation restart on lens change

### Out of Scope
- Content for all 6 archetypes (defer to v0.14)
- Animation for screens 3-6 (ProductReveal, AhaDemo, etc.)
- Lens picker UI on Genesis page (stays in Terminal)
- Persistence of "last viewed reality" separate from activeLens
- A/B testing of content variations

### Stretch Goals
- WaveformCollapse component with variable speed
- Subtle background color tint per lens
- Analytics event: `reality_collapsed` with lens ID

---

## Acceptance Criteria

### Core Functionality (AC-1 to AC-4)
- [ ] AC-1: With no lens selected, Genesis shows DEFAULT_REALITY
- [ ] AC-2: Selecting "Engineer" lens → headline becomes "LATENCY IS THE MIND KILLER."
- [ ] AC-3: Selecting "Academic" lens → headline becomes "THE EPISTEMIC COMMONS."
- [ ] AC-4: Deselecting lens (Freestyle) → returns to DEFAULT_REALITY

### Animation (AC-5 to AC-7)
- [ ] AC-5: Text visually backspaces (un-types) when lens changes
- [ ] AC-6: Brief pause (400ms) between un-type and re-type
- [ ] AC-7: New text types in with blinking cursor

### Persistence (AC-8 to AC-9)
- [ ] AC-8: Refreshing page with persisted lens loads correct reality immediately
- [ ] AC-9: Clearing localStorage resets to DEFAULT_REALITY

### Fallback (AC-10 to AC-11)
- [ ] AC-10: Unknown lens ID falls back to DEFAULT_REALITY
- [ ] AC-11: Custom lens IDs (`custom-*`) use 'freestyle' or DEFAULT_REALITY

### Build & Regression (AC-12 to AC-14)
- [ ] AC-12: `npm run build` passes
- [ ] AC-13: No console errors in browser
- [ ] AC-14: Classic experience (`?experience=classic`) unaffected

---

## Files to Change

| File | Change Type | Purpose |
|------|-------------|---------|
| `src/data/quantum-content.ts` | **CREATE** | Superposition map and resolution function |
| `src/surface/hooks/useQuantumInterface.ts` | **CREATE** | State hook for lens → reality mapping |
| `src/surface/components/effects/WaveformCollapse.tsx` | **CREATE** | Typewriter animation component |
| `src/surface/components/effects/index.ts` | **CREATE** | Barrel export |
| `src/surface/pages/GenesisPage.tsx` | **MODIFY** | Wire hook, pass content props |
| `src/surface/components/genesis/HeroHook.tsx` | **MODIFY** | Add trigger prop, reset animation |
| `src/surface/components/genesis/ProblemStatement.tsx` | **MODIFY** | Add trigger + tension props |
| `src/surface/components/genesis/index.ts` | **MODIFY** | Export TensionContent type |

---

## Success Metrics

### Qualitative
- Landing page feels "alive" and responsive to lens selection
- Animation is subtle but noticeable (not jarring)
- Different audiences get different entry points

### Quantitative (Stretch)
- Track `reality_collapsed` events per lens
- Measure time-on-page by reality (do lens-specific pages engage better?)
- A/B test: lens-targeted vs. generic for known-archetype visitors

---

## Dependencies

| Dependency | Source | Risk |
|------------|--------|------|
| `useNarrativeEngine` | `hooks/useNarrativeEngine.ts` | Low - stable API |
| `HeroContent`, `Quote` | `genesis/index.ts` | Low - v0.12e delivered |
| `ArchetypeId` | `types/lens.ts` | Low - stable type |
| `session.activeLens` | localStorage persistence | Low - already working |

---

## Post-Sprint: v0.14 Candidates

1. **Extend content map** — Add realities for `concerned-citizen`, `geopolitical`, `big-ai-exec`
2. **More screens** — Apply quantum interface to ProductReveal, AhaDemo, Foundation
3. **Lens picker on Genesis** — Float lens selector above fold
4. **Dynamic CTA** — Change call-to-action based on lens
5. **Analytics integration** — Full funnel tracking by reality
