# Epic 5: Lens URL Hydration - Architecture

**Sprint**: active-grove-polish-v2
**Epic**: 5 - URL Lens Parameter Hydration
**Date**: 2024-12-23

---

## Overview

This document describes both the **immediate architecture** for Epic 5 and the **strategic migration path** from the legacy NarrativeEngineContext to a modern, declarative engagement system. Future developers and Claude sessions should use this as the canonical reference for understanding why architectural decisions were made.

---

## Current State: The NarrativeEngine Monolith

### The Problem in One Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NarrativeEngineContext.tsx (694 lines)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │    Lens      │  │   Journey    │  │   Entropy    │  │    Cards     │   │
│  │   State      │  │  Navigation  │  │  Detection   │  │  Threading   │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │                 │           │
│         └────────────────┴────────────────┴────────────────┘           │
│                              │                                           │
│                    ┌─────────▼─────────┐                                 │
│                    │  session object   │ ← Single useState, 15+ fields   │
│                    └─────────┬─────────┘                                 │
│                              │                                           │
│  ┌──────────────┐  ┌────────▼────────┐  ┌──────────────┐                │
│  │ localStorage │◄─┤   useEffects    │─►│  API calls   │                │
│  │  (4 keys)    │  │   (6 effects)   │  │  (schema)    │                │
│  └──────────────┘  └─────────────────┘  └──────────────┘                │
│                                                                          │
│  Problems:                                                               │
│  • God object pattern - knows too much                                  │
│  • SSR hydration broken for URL params                                  │
│  • Any change risks cascading side effects                              │
│  • Impossible to test individual concerns                               │
│  • 40+ useState, 20+ useCallback, 15+ useEffect                        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Specific Architectural Violations

| Violation | Evidence | Impact |
|-----------|----------|--------|
| Single Responsibility | One context handles lens, journey, entropy, cards, persistence | Can't modify one without risking others |
| SSR Awareness | useState initializer reads window (undefined on server) | URL params broken |
| Separation of Concerns | Business logic mixed with React state | Hard to reason about |
| Testability | Everything coupled to React context | No unit tests possible |
| Declarative Config | Logic hardcoded, not configurable | Requires code changes for behavior changes |

---

## Target State: Declarative Engagement Architecture

### Vision: Hooks as Focused Units

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Future Engagement Architecture                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    EngagementContext (Coordinator)                   │   │
│  │  • Thin orchestration layer                                         │   │
│  │  • Composes focused hooks                                           │   │
│  │  • Declarative state machine                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │              │              │              │                      │
│         ▼              ▼              ▼              ▼                      │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐               │
│  │ useLens  │   │useJourney│   │useEntropy│   │useThread │               │
│  │  State   │   │   Nav    │   │ Detect   │   │  Cards   │               │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘               │
│       │              │              │              │                      │
│       ▼              ▼              ▼              ▼                      │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐               │
│  │ useLens  │   │useJourney│   │useEntropy│   │useThread │               │
│  │Persistence│   │Persistence│  │Persistence│  │Analytics │               │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘               │
│                                                                          │
│  Benefits:                                                               │
│  • Each hook has ONE job                                                │
│  • SSR-safe by design                                                   │
│  • Testable in isolation                                                │
│  • Declaratively configured                                             │
│  • Easy to modify or replace                                            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Declarative State Machine

Instead of imperative state updates scattered across effects, the target uses XState-style declarative machines:

```typescript
// Future: engagement-machine.ts
const engagementMachine = {
  initial: 'anonymous',
  states: {
    anonymous: {
      on: {
        SELECT_LENS: 'lensSelected',
        URL_LENS_DETECTED: 'lensSelected'  // ← URL param is just another event
      }
    },
    lensSelected: {
      entry: ['persistLens', 'trackSelection'],
      on: {
        START_JOURNEY: 'journeyActive',
        OPEN_TERMINAL: 'exploring'
      }
    },
    journeyActive: {
      on: {
        COMPLETE_JOURNEY: 'journeyComplete',
        ABANDON_JOURNEY: 'exploring'
      }
    },
    // ... etc
  }
};
```

### Configuration-Driven Behavior

Instead of hardcoded logic, behavior comes from schema:

```typescript
// Future: engagement-config.ts (loaded from GCS or API)
const engagementConfig = {
  urlParameters: {
    lens: {
      validate: (value) => VALID_ARCHETYPES.includes(value),
      action: 'SELECT_LENS',
      fallback: 'show-picker'
    },
    share: {
      validate: (value) => isValidShareCode(value),
      action: 'LOAD_SHARED_REALITY',
      fallback: 'ignore'
    },
    journey: {
      validate: (value) => journeyExists(value),
      action: 'START_JOURNEY',
      fallback: 'ignore'
    }
  },
  persistence: {
    lens: { storage: 'localStorage', key: 'grove-lens' },
    journey: { storage: 'sessionStorage', key: 'grove-journey' },
    entropy: { storage: 'localStorage', key: 'grove-entropy' }
  }
};
```

---

## Migration Path: Three Phases

### Phase 1: Bridge Hooks (Current - Q1 2025)

**Goal**: Fix immediate issues without touching legacy code

**Pattern**: Create isolated hooks that:
- Use NarrativeEngine's mutators (selectLens, startJourney, etc.)
- Don't add to NarrativeEngine's responsibilities  
- Are documented as "bridge" code with deprecation path

**Hooks in Phase 1**:
| Hook | Status | Purpose |
|------|--------|---------|
| `useQuantumInterface` | ✅ Done | Reality resolution |
| `useLensHydration` | 🔄 This Epic | URL param hydration |
| `useJourneyHydration` | 📋 Future | URL journey params |
| `useReferrerTracking` | 📋 Future | Attribution capture |

**Success Criteria**:
- No modifications to NarrativeEngineContext.tsx
- Each hook is <100 lines
- Each hook has migration documentation
- All URL params work correctly

### Phase 2: Engagement Context (Q2 2025)

**Goal**: Create new system alongside legacy, begin migration

**Deliverables**:
```
src/core/engagement/
├── EngagementContext.tsx    # New coordinator
├── machine.ts               # XState state machine
├── config.ts                # Declarative configuration
├── hooks/
│   ├── useLensState.ts      # Lens management
│   ├── useJourneyState.ts   # Journey management
│   ├── useEntropyState.ts   # Entropy management
│   └── usePersistence.ts    # Storage abstraction
└── types.ts                 # Clean type definitions
```

**Migration Strategy**:
1. New pages use EngagementContext
2. Legacy pages keep NarrativeEngine
3. Both share localStorage (compatible keys)
4. Gradual consumer migration

**Success Criteria**:
- New context fully functional
- GenesisPage migrated
- Terminal uses new context via adapter
- Zero regressions

### Phase 3: Legacy Deprecation (Q3 2025)

**Goal**: Remove NarrativeEngineContext entirely

**Steps**:
1. Migrate all consumers to EngagementContext
2. Delete bridge hooks (useLensHydration, etc.)
3. Delete NarrativeEngineContext.tsx
4. Clean up orphaned code

**Success Criteria**:
- NarrativeEngineContext deleted
- Single engagement system
- <2000 lines total for engagement (vs 694 for legacy monolith)
- Full test coverage

---

## Epic 5: Immediate Architecture

### Component Interaction

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GenesisPage.tsx                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  // 1. First: Hydrate lens from URL                                        │
│  useLensHydration();  ────────────────────────────────┐                    │
│                                                        │                    │
│  // 2. Then: Get reality (will see hydrated lens)     ▼                    │
│  const { activeLens } = useQuantumInterface(); ◄──────┤                    │
│                                                        │                    │
│  // 3. handleTreeClick uses activeLens                │                    │
│  if (activeLens) setFlowState('unlocked');           │                    │
│                                                        │                    │
└────────────────────────────────────────────────────────┼────────────────────┘
                                                         │
         ┌───────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       useLensHydration.ts (NEW)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  useEffect(() => {                                                         │
│    // 1. Read URL param                                                    │
│    const lens = urlParams.get('lens');                                     │
│                                                                             │
│    // 2. Validate                                                          │
│    if (!VALID_ARCHETYPES.includes(lens)) return;                          │
│                                                                             │
│    // 3. Hydrate via NarrativeEngine mutator                              │
│    selectLens(lens);  ─────────────────────────────────┐                  │
│  }, []);                                                │                  │
│                                                         │                  │
└─────────────────────────────────────────────────────────┼──────────────────┘
                                                          │
                                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   NarrativeEngineContext.tsx (UNCHANGED)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  selectLens = (personaId) => {                                             │
│    setSession(prev => ({                                                   │
│      ...prev,                                                              │
│      activeLens: personaId  ◄──── This triggers re-render                 │
│    }));                                                                    │
│  };                                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Timing & Order of Operations

```
1. Page Request
   └─► Server renders HTML (activeLens = null from SSR)

2. Client Hydration
   └─► React hydrates, preserving SSR state (activeLens still null)

3. useEffect Phase (in order of component tree)
   ├─► useLensHydration fires
   │   └─► Reads URL param 'engineer'
   │   └─► Calls selectLens('engineer')
   │   └─► NarrativeEngine updates session.activeLens = 'engineer'
   │   └─► Re-render triggered
   │
   └─► useQuantumInterface fires
       └─► Sees session.activeLens = 'engineer'
       └─► Resolves engineer reality
       └─► Returns activeLens = 'engineer'

4. User Interaction
   └─► User clicks seedling
   └─► handleTreeClick reads activeLens = 'engineer'
   └─► Skips picker, goes to 'unlocked'
   └─► Terminal opens with personalized experience
```

---

## File Structure After Epic 5

```
src/surface/
├── hooks/
│   ├── useQuantumInterface.ts    # Reality resolution (existing)
│   └── useLensHydration.ts       # URL param hydration (NEW)
├── pages/
│   └── GenesisPage.tsx           # Modified: imports useLensHydration
└── components/
    └── genesis/
        └── ...                    # Unchanged
```

---

## Technical Decisions

See **DECISIONS.md** for ADRs explaining:
- Why bridge hook vs patching NarrativeEngine
- Why validate against DEFAULT_PERSONAS
- Why not support custom lens URLs in this epic
- Why useRef for idempotency guard

---

## Future Considerations

### URL Parameters to Support

| Param | Current | Future | Notes |
|-------|---------|--------|-------|
| `?lens=` | Epic 5 | Phase 1 | Archetype selection |
| `?share=` | Existing | Keep | Custom lens sharing |
| `?journey=` | Not supported | Phase 1 | Deep link to journey |
| `?node=` | Not supported | Phase 2 | Deep link to specific card |
| `?ref=` | Existing | Keep | Referrer tracking |

### Questions for Future Architects

1. Should URL params override localStorage? (Current: Yes)
2. Should we support lens aliases? (e.g., `?lens=tech` → `engineer`)
3. Should invalid lens trigger analytics event?
4. Should we hash lens params for shorter URLs?

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| URL lens works | 100% | Manual testing |
| No regressions | 0 bugs | Existing tests pass |
| Documentation quality | High | This doc reviewed |
| Migration path clear | Yes | Future sprint references this |

---

## Next Document

See **MIGRATION_MAP.md** for file-by-file changes and **DECISIONS.md** for ADRs.
