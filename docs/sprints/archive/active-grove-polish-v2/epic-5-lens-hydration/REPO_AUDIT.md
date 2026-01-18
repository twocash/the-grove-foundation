# Epic 5: Lens URL Hydration - Repository Audit

**Sprint**: active-grove-polish-v2
**Epic**: 5 - URL Lens Parameter Hydration
**Date**: 2024-12-23
**Status**: Planning

---

## Executive Summary

This audit documents a **critical architectural seam** in The Grove's lens management system. What appears to be a simple SSR hydration bug (`?lens=engineer` URL parameter not respected on tree click) reveals a deeper issue: **two competing state management paradigms** that must eventually converge.

This epic fixes the immediate bug while **intentionally establishing a migration pattern** toward the newer, cleaner architecture. Every decision here should be evaluated against the question: "Does this move us toward a unified, declarative engagement system?"

---

## Current Architecture: Two Systems

### System 1: NarrativeEngineContext (Legacy Monolith)

**Location**: `hooks/NarrativeEngineContext.tsx`
**Lines**: 694
**Created**: Early in project, before architectural patterns stabilized

**Responsibilities** (too many):
- Session state management (`activeLens`, `exchangeCount`, `visitedCards`)
- localStorage persistence
- Schema loading from API
- Lens selection (`selectLens()`)
- Journey navigation (start, advance, exit)
- Card threading
- Entropy detection state
- First-time user detection
- Referrer tracking
- URL parameter parsing (partial, broken by SSR)

**The Problem**: This file violates single-responsibility principle. It's a "god context" that knows too much and does too much. Any change risks unintended side effects.

```typescript
// Evidence of scope creep - 694 lines doing everything:
export const NarrativeEngineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 40+ useState calls
  // 20+ useCallback definitions  
  // 15+ useEffect hooks
  // Complex interdependencies between all of them
}
```

**URL Parameter Handling (The Bug)**:
```typescript
// Line 163-177: getInitialLens() attempts to read URL params
const getInitialLens = (): string | null => {
  if (typeof window === 'undefined') return null;  // ← SSR returns null
  // ... URL param logic that never runs on server
};

// Line 256-263: useState initializer runs ONCE during SSR
const [session, setSession] = useState<TerminalSession>(() => ({
  ...DEFAULT_TERMINAL_SESSION,
  activeLens: getInitialLens()  // ← null on server, preserved on hydration
}));

// Line 315-333: useEffect only restores from localStorage, not URL params
useEffect(() => {
  const storedLens = localStorage.getItem(STORAGE_KEY_LENS);
  // ... no URL param re-check here
}, []);
```

**Result**: URL param is read during SSR (returns null), React hydration preserves null, client-side useEffect doesn't re-check URL params, lens stays null.

---

### System 2: useQuantumInterface (New Pattern)

**Location**: `src/surface/hooks/useQuantumInterface.ts`
**Lines**: 99
**Created**: v0.13/v0.14, part of "Reality Projector" feature

**Responsibilities** (focused):
- Read lens state from NarrativeEngine
- Resolve "reality" (personalized content) based on lens
- Handle custom lens LLM generation
- Provide isCollapsing state for animations

**The Pattern We Want**:
```typescript
// Clean, focused, single-purpose
export const useQuantumInterface = (): UseQuantumInterfaceReturn => {
  const { session, schema, getPersonaById } = useNarrativeEngine();
  
  // One job: turn lens → reality
  const resolveReality = useCallback(async (lensId: string | null) => {
    // ... focused logic
  }, [dependencies]);

  return { reality, activeLens, quantumTrigger, isCollapsing };
};
```

**Why This Works**:
- Single responsibility
- Declarative inputs → outputs
- No side effects beyond its domain
- Easy to test, easy to reason about

---

## The Symptom vs. The Disease

### Symptom (What User Sees)
1. User visits `https://the-grove.ai/?lens=engineer`
2. Headline personalizes correctly ("LOCAL HUMS. CLOUD BREAKS THROUGH.")
3. User clicks seedling
4. **Bug**: Lens picker appears instead of skipping to Terminal

### Disease (Architectural)
- NarrativeEngine's SSR handling is broken
- No clean separation between "reading URL params" and "managing session state"
- useQuantumInterface correctly personalizes content (it re-resolves on mount)
- But session.activeLens (source of truth for navigation) is wrong

### Why Headline Works But Navigation Doesn't
```
useQuantumInterface:
  - Has useEffect that resolves reality on mount
  - Calls resolveReality(session.activeLens) 
  - ALSO reads schema.lensRealities for personalization
  - The reality resolution happens AFTER hydration
  
GenesisPage.handleTreeClick:
  - Reads activeLens from useQuantumInterface
  - Which reads session.activeLens from NarrativeEngine
  - Which is still null from SSR
```

---

## Files Affected

### Primary (Will Modify)
| File | Change | Risk |
|------|--------|------|
| `src/surface/hooks/useLensHydration.ts` | **NEW FILE** - Hydration bridge | LOW |
| `src/surface/pages/GenesisPage.tsx` | Add useLensHydration() call | LOW |

### Secondary (Context Only)
| File | Role | Change? |
|------|------|---------|
| `hooks/NarrativeEngineContext.tsx` | Legacy monolith with SSR bug | NO - don't touch |
| `src/surface/hooks/useQuantumInterface.ts` | Clean pattern to follow | NO - reference only |
| `data/default-personas.ts` | Lens validation source | NO - reference only |

---

## Technical Deep Dive: SSR Hydration

### The React SSR Contract
```
1. Server renders HTML with initial state
2. Client hydrates, expecting SAME initial state
3. useEffect runs AFTER hydration (client-only)
4. useState initializers DON'T re-run on hydration
```

### What NarrativeEngine Does Wrong
```typescript
// This runs on BOTH server and client:
const [session, setSession] = useState(() => ({
  activeLens: getInitialLens()  // null on server, null preserved on client
}));

// This runs ONLY on client, but doesn't check URL:
useEffect(() => {
  const storedLens = localStorage.getItem(STORAGE_KEY_LENS);
  if (storedLens) setSession(prev => ({ ...prev, activeLens: storedLens }));
}, []);
```

### The Fix Pattern
```typescript
// New hook runs ONLY on client, DOES check URL:
useEffect(() => {
  if (typeof window === 'undefined') return;
  if (session.activeLens) return;  // Don't override existing
  
  const lensParam = new URLSearchParams(window.location.search).get('lens');
  if (lensParam && isValidLens(lensParam)) {
    selectLens(lensParam);  // Use existing mutator
  }
}, []);
```

---

## Why NOT Patch NarrativeEngineContext?

1. **Risk**: 694 lines of interconnected state. Any change could break journeys, entropy, persistence.

2. **Debt**: Adding more logic to the monolith increases future migration cost.

3. **Pattern**: We want to establish that NEW features use NEW patterns, not pile onto legacy.

4. **Isolation**: A separate hook can be:
   - Tested independently
   - Deprecated cleanly when NarrativeEngine is refactored
   - Enhanced without touching core state management

---

## Migration Path Context

This epic is **Step 1** of a larger migration. Future steps (not in this sprint):

### Phase 1: Isolate Concerns (Current)
- [x] useQuantumInterface for reality resolution
- [ ] **useLensHydration for URL params** ← THIS EPIC
- [ ] useLensState for clean state management
- [ ] useLensPersistence for localStorage

### Phase 2: Create Unified Engagement Context
- [ ] New `EngagementContext` with declarative state machine
- [ ] Clean separation: state, persistence, URL handling, analytics
- [ ] NarrativeEngine becomes thin wrapper during transition

### Phase 3: Deprecate Legacy
- [ ] Move consumers off NarrativeEngine
- [ ] Delete legacy code
- [ ] Single source of truth

**Every fix we make should ask**: Does this make Phase 2/3 easier or harder?

---

## Validation Requirements

### Must Work
- [ ] `/?lens=engineer` → Tree click skips picker, opens Terminal
- [ ] `/?lens=academic` → Headline shows academic copy, Terminal opens directly
- [ ] Invalid lens (`/?lens=invalid`) → Falls through to picker
- [ ] No lens param → Shows picker as before
- [ ] Lens already in localStorage → URL param doesn't override

### Console Output
```
[LensHydration] URL param detected: engineer
[LensHydration] Hydrating lens to session
[ActiveGrove] Tree clicked → unlocked (lens exists: engineer)
```

---

## Next Document

See **SPEC.md** for goals, acceptance criteria, and migration documentation requirements.
