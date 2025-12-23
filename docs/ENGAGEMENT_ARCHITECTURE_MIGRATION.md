# Engagement Architecture Migration Guide

**Document Owner**: Grove Foundation Team
**Created**: 2024-12-23
**Last Updated**: 2024-12-23
**Status**: ACTIVE - Living Document

---

## Executive Summary

The Grove's engagement system currently relies on `NarrativeEngineContext` - a 694-line React context that handles too many responsibilities. This document outlines the migration path from this monolithic architecture to a modern, declarative, composable engagement system.

**Why This Matters**: Every bug fix in the legacy system increases technical debt. Every feature addition makes future migration harder. This guide ensures all work moves us forward, not backward.

---

## Current State: The Monolith

### NarrativeEngineContext Responsibilities

```
hooks/NarrativeEngineContext.tsx (694 lines)
├── Session State Management
│   ├── activeLens (current lens ID)
│   ├── exchangeCount (conversation turns)
│   ├── visitedCards (card history)
│   └── visitedNodes (journey node history)
├── Schema Loading
│   └── Fetches /api/narrative, handles V1→V2 migration
├── Lens Management
│   ├── selectLens() - sets active lens
│   ├── getPersona() - gets persona by ID
│   ├── getEnabledPersonas() - lists available personas
│   └── getActiveLensData() - gets current lens data
├── Journey Navigation
│   ├── startJourney() - begins a journey
│   ├── advanceNode() - moves to next node
│   ├── exitJourney() - abandons journey
│   └── Various getters for journey state
├── Card Threading
│   ├── getPersonaCards() - cards for a persona
│   ├── getNextCards() - continuation cards
│   └── Thread position management
├── Entropy Detection
│   ├── entropyState - current entropy levels
│   ├── evaluateEntropy() - calculates entropy
│   └── Injection/dismissal state
├── Persistence
│   ├── localStorage for lens
│   ├── localStorage for session
│   ├── localStorage for entropy
│   └── sessionStorage for referrer
├── URL Parameter Handling
│   ├── getInitialLens() - reads ?lens= (BROKEN BY SSR)
│   ├── getInitialShare() - reads ?share=
│   └── captureReferrer() - reads ?r=
└── First-Time User Detection
    └── Various cleanup and detection logic
```

### The Problem

1. **Single Responsibility Violation**: One context doing 10+ different jobs
2. **SSR Brittleness**: URL param handling broken by hydration timing
3. **Coupling**: Can't change lens logic without risking journeys
4. **Testability**: 40+ useState, 20+ useCallback - impossible to unit test
5. **Cognitive Load**: No one can hold 694 lines in their head

---

## Target State: Composable Engagement

### Architecture Vision

```
src/core/engagement/
├── EngagementContext.tsx        # Thin coordinator (< 100 lines)
├── machine.ts                   # XState state machine
├── config.ts                    # Declarative configuration
├── hooks/
│   ├── useLensState.ts          # Lens selection & management
│   ├── useJourneyState.ts       # Journey navigation
│   ├── useEntropyState.ts       # Entropy detection
│   ├── useThreadState.ts        # Card threading
│   └── usePersistence.ts        # Storage abstraction
├── hydration/
│   ├── useLensHydration.ts      # URL ?lens= params
│   ├── useShareHydration.ts     # URL ?share= params
│   └── useReferrerTracking.ts   # URL ?r= params
└── types.ts                     # Clean type definitions
```

### Design Principles

1. **Single Responsibility**: Each hook does ONE thing well
2. **Declarative**: Behavior configured, not coded
3. **SSR-Safe**: Hydration handled explicitly in hydration hooks
4. **Testable**: Each hook can be unit tested in isolation
5. **Composable**: Mix and match hooks for different pages/features

---

## Migration Phases

### Phase 1: Bridge Hooks (Current - Q1 2025)

**Goal**: Fix immediate issues without modifying legacy code

**Pattern**: Create isolated hooks that use NarrativeEngine's mutators

**Implemented**:
| Hook | Status | Purpose |
|------|--------|---------|
| `useQuantumInterface` | ✅ Done | Reality resolution (v0.13) |
| `useLensHydration` | 🔄 Sprint | URL lens hydration |

**Planned**:
| Hook | Sprint | Purpose |
|------|--------|---------|
| `useJourneyHydration` | TBD | URL journey deep links |
| `useShareHydration` | TBD | Custom lens sharing |
| `useReferrerTracking` | TBD | Attribution capture |

**Success Criteria**:
- [ ] No modifications to NarrativeEngineContext.tsx
- [ ] Each hook is < 100 lines
- [ ] Each hook has migration documentation
- [ ] All URL-based features work correctly

### Phase 2: New Engagement Context (Q2 2025)

**Goal**: Create parallel system, begin consumer migration

**Deliverables**:

```typescript
// src/core/engagement/EngagementContext.tsx
// Thin coordinator that composes hooks

export function EngagementProvider({ children }: Props) {
  const lens = useLensState();
  const journey = useJourneyState();
  const entropy = useEntropyState();
  const thread = useThreadState();
  
  return (
    <EngagementContext.Provider value={{
      ...lens,
      ...journey,
      ...entropy,
      ...thread
    }}>
      {children}
    </EngagementContext.Provider>
  );
}
```

```typescript
// src/core/engagement/machine.ts
// Declarative state machine

export const engagementMachine = createMachine({
  id: 'engagement',
  initial: 'anonymous',
  states: {
    anonymous: {
      on: {
        SELECT_LENS: 'lensActive',
        URL_LENS_DETECTED: 'lensActive',
        SHARE_DETECTED: 'customLensActive'
      }
    },
    lensActive: {
      entry: ['persistLens', 'trackLensSelection'],
      on: {
        START_JOURNEY: 'journeyActive',
        CHANGE_LENS: 'lensActive',
        CLEAR_LENS: 'anonymous'
      }
    },
    journeyActive: {
      on: {
        ADVANCE: 'journeyActive',
        COMPLETE: 'journeyComplete',
        ABANDON: 'lensActive'
      }
    }
    // ... etc
  }
});
```

**Migration Strategy**:
1. New pages (e.g., future dashboard) use EngagementContext
2. GenesisPage + Terminal get adapter layer
3. Both systems share localStorage keys
4. Gradually move consumers

**Success Criteria**:
- [ ] New context fully functional
- [ ] GenesisPage works with new context via adapter
- [ ] Terminal works with new context via adapter
- [ ] Zero regressions from Phase 1

### Phase 3: Legacy Deprecation (Q3 2025)

**Goal**: Remove NarrativeEngineContext entirely

**Steps**:
1. Migrate ALL consumers to EngagementContext
2. Delete bridge hooks (useLensHydration, etc.)
3. Delete NarrativeEngineContext.tsx
4. Delete orphaned helpers
5. Update all imports

**Success Criteria**:
- [ ] NarrativeEngineContext.tsx deleted
- [ ] All 694 lines replaced with < 500 lines total
- [ ] Full test coverage on new system
- [ ] No localStorage key changes (seamless upgrade)

---

## Decision Framework

### When to Modify NarrativeEngineContext

**NEVER** modify NarrativeEngineContext.tsx directly unless:
1. Critical production bug with no bridge workaround
2. Security vulnerability
3. Explicit Phase 2/3 migration work

For all other changes, create a bridge hook.

### When to Create a Bridge Hook

Create a bridge hook when:
1. Need new URL parameter handling
2. Need to fix SSR/hydration issues
3. Need to add pre-processing before NarrativeEngine
4. Need to add post-processing after NarrativeEngine

Bridge hooks should:
- Use NarrativeEngine's existing mutators
- Be < 100 lines including documentation
- Have extensive header docs explaining migration context
- Be placed in `src/surface/hooks/` or `src/core/engagement/hydration/`

### When to Wait for Phase 2

Wait for Phase 2 when:
1. Need to change core state structure
2. Need to change persistence format
3. Need to refactor journey navigation
4. Need to add new state machines

Document the requirement and add to Phase 2 backlog.

---

## Bridge Hook Template

```typescript
/**
 * use[Feature]Hydration - [One line description]
 * 
 * ============================================================================
 * ARCHITECTURAL CONTEXT - READ BEFORE MODIFYING
 * ============================================================================
 * 
 * This hook exists because of [SPECIFIC PROBLEM].
 * 
 * LEGACY SYSTEM (NarrativeEngineContext):
 * - [Why we can't modify it]
 * 
 * THIS HOOK IS A BRIDGE:
 * - [What it does]
 * - [When it will be deprecated]
 * 
 * ============================================================================
 * MIGRATION PATH
 * ============================================================================
 * 
 * Phase 1 (Current): This hook
 * Phase 2 (Future): [What replaces it]
 * Phase 3 (Future): This hook deleted
 * 
 * ============================================================================
 * WHEN TO MODIFY THIS FILE
 * ============================================================================
 * 
 * YES: [Appropriate changes]
 * NO: [Changes that should wait for Phase 2]
 * 
 * ============================================================================
 */

import { useEffect, useRef } from 'react';
import { useNarrativeEngine } from '../../../hooks/useNarrativeEngine';

export function use[Feature]Hydration(): void {
  const { /* mutators */ } = useNarrativeEngine();
  const hasRun = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasRun.current) return;
    hasRun.current = true;

    // Implementation
    console.log('[Feature] [Action]');
  }, []);
}

export default use[Feature]Hydration;
```

---

## Tracking

### Phase 1 Progress

| Item | Status | Sprint | Notes |
|------|--------|--------|-------|
| useQuantumInterface | ✅ | v0.13 | Reality resolution |
| useLensHydration | 🔄 | polish-v2 | URL ?lens= fix |
| useJourneyHydration | 📋 | - | URL ?journey= |
| useShareHydration | 📋 | - | URL ?share= enhancement |

### Known Issues (Deferred to Phase 2)

| Issue | Why Deferred |
|-------|--------------|
| Journey state not URL-persistent | Requires state machine redesign |
| Entropy calculation expensive | Requires optimization pass |
| Custom lens IDs not stable | Requires ID generation rethink |

---

## Related Documents

- `docs/sprints/active-grove-polish-v2/epic-5-lens-hydration/` - Current sprint
- `hooks/NarrativeEngineContext.tsx` - Legacy code (do not modify)
- `src/surface/hooks/useQuantumInterface.ts` - Example of clean hook

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-23 | Initial document, Phase 1 defined | Sprint: polish-v2 |
