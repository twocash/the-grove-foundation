# Repository Audit — Epic 1: Engagement State Machine

## Audit Date: 2024-12-23

## Current State Summary

Epic 0 established Health integration with E2E test reporting. Epic 1 introduces the declarative state machine that will eventually replace NarrativeEngineContext's imperative state management. This epic runs **parallel** to the existing context—no consumers change yet.

## Epic 0 Completion Status

| Component | Status | Verification |
|-----------|--------|--------------|
| e2e-behavior check type | ✅ Complete | Health API resolves tests |
| Health config v1.1 | ✅ Complete | 3 engagement checks |
| POST /api/health/report | ✅ Complete | 5 integration tests |
| Playwright reporter | ✅ Complete | 55 tests reported |

## Current State Management Analysis

### NarrativeEngineContext.tsx

**Location:** `hooks/NarrativeEngineContext.tsx`
**Lines:** ~694 (estimated from Phase 2 roadmap)

**State Variables (to be captured in machine):**
```typescript
// Lens state
const [currentLens, setCurrentLens] = useState<string | null>(null);
const [lensSource, setLensSource] = useState<'url' | 'localStorage' | 'selection' | null>(null);

// Journey state  
const [currentJourney, setCurrentJourney] = useState<Journey | null>(null);
const [journeyProgress, setJourneyProgress] = useState<number>(0);
const [isJourneyActive, setIsJourneyActive] = useState(false);

// Terminal state
const [isTerminalOpen, setIsTerminalOpen] = useState(false);
const [terminalMode, setTerminalMode] = useState<'chat' | 'journey'>('chat');

// Entropy state
const [conversationEntropy, setConversationEntropy] = useState(0);
const [entropyThreshold, setEntropyThreshold] = useState(0.7);
```

**Implicit States (derived from combinations):**
- Anonymous: No lens selected
- Lens Active: Lens selected, no journey
- Journey Active: In a journey
- Journey Complete: Journey finished
- High Entropy: Conversation complexity exceeded threshold

### DEX Violations in Current Implementation

| Violation | Location | Issue |
|-----------|----------|-------|
| Hardcoded transitions | Multiple handlers | `if (lens) setCurrentLens(lens)` |
| Implicit state machine | No formal definition | States inferred from variable combos |
| Scattered guards | Throughout context | Business logic in callbacks |
| No persistence strategy | Ad-hoc localStorage | Not declarative |

### State Transition Inventory

From code analysis, these transitions exist:

| From State | Event | To State | Side Effects |
|------------|-------|----------|--------------|
| anonymous | SELECT_LENS | lensActive | Persist, track source |
| lensActive | START_JOURNEY | journeyActive | Load journey, reset progress |
| lensActive | CHANGE_LENS | lensActive | Persist new lens |
| journeyActive | ADVANCE_STEP | journeyActive | Increment progress |
| journeyActive | COMPLETE_JOURNEY | journeyComplete | Mark complete |
| journeyActive | EXIT_JOURNEY | lensActive | Clear journey |
| * | OPEN_TERMINAL | * | Set terminal open |
| * | CLOSE_TERMINAL | * | Set terminal closed |
| * | UPDATE_ENTROPY | * | Recalculate entropy |

## File Structure Analysis

### Relevant Files

| File | Purpose | Lines | Relevance |
|------|---------|-------|-----------|
| `hooks/NarrativeEngineContext.tsx` | Current state management | ~694 | Source of truth for states |
| `data/infrastructure/engagement-config.json` | Does not exist yet | 0 | Will define machine config |
| `src/core/engagement/` | Does not exist yet | 0 | New machine location |
| `tests/e2e/engagement-behaviors.spec.ts` | E2E tests | ~200 | Verify behavior during migration |

### Dependencies to Add

| Package | Purpose | Version |
|---------|---------|---------|
| `xstate` | State machine library | ^5.x |
| `@xstate/react` | React bindings | ^4.x |

## Test Coverage Assessment

### Current E2E Coverage (from Health)

| Check | Test Reference | Status |
|-------|----------------|--------|
| lens-picker-shown | engagement-behaviors.spec.ts:lens picker | pass |
| url-lens-hydration | engagement-behaviors.spec.ts:URL lens | pass |
| terminal-opens | engagement-behaviors.spec.ts:terminal | pass |

### Test Gaps for State Machine

| Gap | Needed Test | Priority |
|-----|-------------|----------|
| State transitions | Machine unit tests | High |
| Persistence | localStorage integration | Medium |
| Parallel states | Terminal + journey | Medium |
| Guards | Transition conditions | High |

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| XState learning curve | Medium | Low | v5 docs, examples |
| Parallel system complexity | Medium | Medium | Clear boundaries |
| State explosion | Low | High | Flat structure |
| E2E test brittleness | Low | Medium | Behavior-focused tests |

## Architecture Recommendations

### 1. XState v5 (Not v4)
- Cleaner API, better TypeScript
- `createMachine` and `createActor` pattern
- Built-in persistence support

### 2. Flat State Structure
```
engagement
├── anonymous
├── lensActive
├── journeyActive
└── journeyComplete

(Not nested: engagement.lens.active.journey.step1)
```

### 3. Parallel States for Terminal
```
engagement (parallel)
├── session (sequential: anonymous → lensActive → ...)
└── terminal (sequential: closed → open)
```

### 4. Context for Data
```typescript
context: {
  lens: string | null,
  lensSource: 'url' | 'localStorage' | 'selection' | null,
  journey: Journey | null,
  journeyProgress: number,
  entropy: number
}
```

## Files to Create (Epic 1)

| File | Purpose |
|------|---------|
| `src/core/engagement/machine.ts` | XState machine definition |
| `src/core/engagement/types.ts` | TypeScript types |
| `src/core/engagement/actions.ts` | Machine actions |
| `src/core/engagement/guards.ts` | Transition guards |
| `tests/unit/engagement-machine.test.ts` | Machine unit tests |
| `data/infrastructure/engagement-config.json` | Declarative config (optional) |

## Success Criteria for Epic 1

1. XState machine defined with all states
2. Machine can be instantiated and tested in isolation
3. Unit tests verify all transitions
4. No changes to NarrativeEngineContext (parallel)
5. Health check added for machine validity
