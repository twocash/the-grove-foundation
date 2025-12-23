# Epic 5: Lens URL Hydration - Migration Map

**Sprint**: active-grove-polish-v2
**Epic**: 5 - URL Lens Parameter Hydration
**Date**: 2024-12-23

---

## Summary

| Action | Files | Risk |
|--------|-------|------|
| CREATE | 1 | LOW |
| MODIFY | 1 | LOW |
| DELETE | 0 | - |

---

## File Changes

### 1. CREATE: `src/surface/hooks/useLensHydration.ts`

**Purpose**: Bridge SSR hydration gap for URL lens parameters

**Size**: ~80 lines (including extensive documentation)

**Content Structure**:
```
Lines 1-50:    Header documentation (migration context, when to modify)
Lines 51-55:   Imports
Lines 56-58:   Constants (VALID_ARCHETYPES)
Lines 59-95:   useLensHydration function
Lines 96-97:   Export
```

**Key Implementation**:
```typescript
import { useEffect, useRef } from 'react';
import { useNarrativeEngine } from '../../../hooks/useNarrativeEngine';
import { DEFAULT_PERSONAS } from '../../../data/default-personas';

const VALID_ARCHETYPES = Object.keys(DEFAULT_PERSONAS);

export function useLensHydration(): void {
  const { session, selectLens } = useNarrativeEngine();
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    const params = new URLSearchParams(window.location.search);
    const lensParam = params.get('lens');
    
    if (!lensParam) return;
    if (!VALID_ARCHETYPES.includes(lensParam)) return;
    if (session.activeLens === lensParam) return;

    console.log('[LensHydration] Hydrating from URL:', lensParam);
    selectLens(lensParam);
  }, []);
}
```

---

### 2. MODIFY: `src/surface/pages/GenesisPage.tsx`

**Current State**: Uses useQuantumInterface but doesn't hydrate URL lens params

**Changes**:

#### 2a. Add Import (Line ~17)
```typescript
// BEFORE (around line 17, after other imports):
import { useQuantumInterface } from '../hooks/useQuantumInterface';

// AFTER:
import { useQuantumInterface } from '../hooks/useQuantumInterface';
import { useLensHydration } from '../hooks/useLensHydration';
```

#### 2b. Add Hook Call (Line ~96)
```typescript
// BEFORE (around line 96):
  // Quantum Interface - lens-reactive content (v0.14: includes isCollapsing for tuning visual)
  const { reality, quantumTrigger, isCollapsing, activeLens } = useQuantumInterface();

// AFTER:
  // Bridge SSR gap for URL lens params (see hook for migration context)
  useLensHydration();

  // Quantum Interface - lens-reactive content (v0.14: includes isCollapsing for tuning visual)
  const { reality, quantumTrigger, isCollapsing, activeLens } = useQuantumInterface();
```

**Why This Order Matters**:
- `useLensHydration` fires its useEffect first (component tree order)
- Sets `session.activeLens` via `selectLens()`
- `useQuantumInterface` then reads the updated session
- By the time component renders, `activeLens` is correct

---

## Files NOT Modified

| File | Why Not |
|------|---------|
| `hooks/NarrativeEngineContext.tsx` | Legacy monolith - too risky to modify |
| `src/surface/hooks/useQuantumInterface.ts` | Already correct, just reads session |
| `data/default-personas.ts` | Only read for validation |
| `components/Terminal.tsx` | Not involved in URL param flow |

---

## Dependency Graph

```
useLensHydration.ts (NEW)
├── imports from: hooks/useNarrativeEngine
├── imports from: data/default-personas
└── used by: GenesisPage.tsx

GenesisPage.tsx (MODIFIED)
├── imports from: useLensHydration (NEW)
├── imports from: useQuantumInterface (existing)
└── passes activeLens to: handleTreeClick, HeroHook
```

---

## Rollback Plan

If issues arise:

1. **Quick Rollback**: Remove useLensHydration() call from GenesisPage.tsx
2. **Full Rollback**: Delete useLensHydration.ts file
3. **Verification**: Visit `/` and `/?lens=engineer` - both should show picker

---

## Testing Checklist

After implementation:

- [ ] `npm run build` succeeds
- [ ] `npm run dev` starts without errors
- [ ] `/?lens=engineer` → console shows hydration log
- [ ] `/?lens=engineer` → tree click skips picker
- [ ] `/` → tree click shows picker (no regression)
- [ ] `/?lens=invalid` → tree click shows picker (graceful fallback)

---

## Post-Implementation

1. Commit with message: `feat(lens): URL parameter hydration for deep links`
2. Deploy to preview
3. Test all lens URLs
4. Document in DEVLOG.md
