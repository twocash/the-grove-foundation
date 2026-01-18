# Repository Audit — v0.13 Quantum Interface

## Sprint Focus
Connect the static Genesis landing page to the Narrative Engine, enabling lens-based content morphing. "The Reality Tuner" becomes visible.

## Current State Summary

### v0.12e Delivered (Prerequisites Complete)
| Deliverable | Status | Evidence |
|-------------|--------|----------|
| Genesis default experience | ✅ | `SurfaceRouter.tsx` defaults to Genesis |
| HeroContent interface | ✅ | `HeroHook.tsx` exports `HeroContent` type |
| Quote interface | ✅ | `ProblemStatement.tsx` exports `Quote` type |
| Content prop injection | ✅ | Both components accept optional content props |
| Type exports | ✅ | `genesis/index.ts` barrel exports interfaces |

### Files to Create (New)

| File | Purpose |
|------|---------|
| `src/data/quantum-content.ts` | Superposition Map: lens ID → content realities |
| `src/surface/hooks/useQuantumInterface.ts` | Hook: listens to activeLens, returns collapsed reality |
| `src/surface/components/effects/WaveformCollapse.tsx` | Animation: un-type/pause/re-type effect |
| `src/surface/components/effects/index.ts` | Barrel export for effects |

### Files to Modify

| File | Lines | Change |
|------|-------|--------|
| `src/surface/pages/GenesisPage.tsx` | 1-166 | Wire useQuantumInterface, pass content props |
| `src/surface/components/genesis/HeroHook.tsx` | 23-27 | Add `trigger` prop for animation reset |
| `src/surface/components/genesis/ProblemStatement.tsx` | 36-41 | Add `trigger` + `tension` props |
| `src/surface/components/genesis/index.ts` | 14-15 | Export new interfaces |

---

## Detailed File Analysis

### Genesis Components (Ready for Wiring)

#### `src/surface/components/genesis/HeroHook.tsx`
**Lines:** 95  
**Current Props:**
```typescript
interface HeroHookProps {
  onScrollNext?: () => void;
  content?: HeroContent;  // ✅ Already accepts content
}
```
**Needed Changes:**
- Add `trigger?: any` prop to force animation restart on lens change
- Reset `visibleSubtext` state when trigger changes

#### `src/surface/components/genesis/ProblemStatement.tsx`
**Lines:** 149  
**Current Props:**
```typescript
interface ProblemStatementProps {
  className?: string;
  quotes?: Quote[];  // ✅ Already accepts quotes
}
```
**Needed Changes:**
- Add `trigger?: any` prop for animation restart
- Add `tension?: string[]` prop for dynamic tension text
- Reset `visibleCards` and `showTension` state when trigger changes

---

### Narrative Engine (Data Source)

#### `hooks/useNarrativeEngine.ts`
**Lines:** 604  
**Relevant Exports:**
```typescript
session: TerminalSession;        // Contains activeLens
getActiveLensData: () => Persona | null;  // Returns full lens object
```
**Key State:**
- `session.activeLens: string | null` — Current lens ID
- Persisted to `localStorage: grove-terminal-lens`

#### `src/core/schema/lens.ts`
**Lines:** 343  
**ArchetypeId Union:**
```typescript
export type ArchetypeId =
  | 'academic'
  | 'engineer'
  | 'concerned-citizen'
  | 'geopolitical'
  | 'big-ai-exec'
  | 'family-office';
```

---

### Page Container

#### `src/surface/pages/GenesisPage.tsx`
**Lines:** 166  
**Current Structure:**
- Imports Genesis components
- Manages Terminal state
- Tracks scroll depth analytics
- No lens awareness

**Integration Point (Line ~33):**
```typescript
const GenesisPage: React.FC = () => {
  // ← INSERT: const { reality, quantumTrigger } = useQuantumInterface();
  const [activeSection] = useState<SectionId>(SectionId.STAKES);
```

**Component Rendering (Lines 120-145):**
```typescript
<HeroHook />  // ← Pass content={reality.hero} trigger={quantumTrigger}
<ProblemStatement />  // ← Pass quotes={reality.problem.quotes} tension={...}
```

---

## Directory Structure After Sprint

```
src/
├── data/
│   └── quantum-content.ts        # NEW: Superposition map
├── surface/
│   ├── hooks/
│   │   ├── useScrollAnimation.ts
│   │   └── useQuantumInterface.ts  # NEW: Reality tuner hook
│   ├── components/
│   │   ├── genesis/
│   │   │   ├── HeroHook.tsx        # MODIFIED: +trigger prop
│   │   │   ├── ProblemStatement.tsx # MODIFIED: +trigger, +tension
│   │   │   └── index.ts            # MODIFIED: export tension type
│   │   └── effects/
│   │       ├── WaveformCollapse.tsx # NEW: Typewriter animation
│   │       └── index.ts             # NEW: Barrel export
│   └── pages/
│       └── GenesisPage.tsx         # MODIFIED: Wire hook + props
```

---

## Technical Dependencies

| Dependency | Required By | Status |
|------------|-------------|--------|
| `useNarrativeEngine` | `useQuantumInterface` | ✅ Available |
| `ArchetypeId` type | `quantum-content.ts` | ✅ Exported from `types/lens.ts` |
| `HeroContent` type | `quantum-content.ts` | ✅ Exported from `genesis/index.ts` |
| `Quote` type | `quantum-content.ts` | ✅ Exported from `genesis/index.ts` |
| React 18 | `useEffect` patterns | ✅ Installed |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Animation jank on slow devices | Medium | Low | Debounce lens changes, skip animation if not visible |
| localStorage race condition | Low | Medium | Read lens from hook, not direct localStorage |
| Custom lens IDs not mapped | Medium | Low | Fallback to DEFAULT_REALITY |
| Memory leak in animation | Low | Medium | Cleanup timers in useEffect return |

---

## Build Verification Baseline

```bash
npm run build  # Must pass before sprint begins
```

**Current Status:** ✅ Passing (v0.12e verified)
