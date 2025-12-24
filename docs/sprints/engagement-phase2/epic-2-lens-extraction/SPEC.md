# Specification — Epic 2: Lens State Extraction

## Overview

Extract lens state management from NarrativeEngineContext into a focused `useLensState` hook that syncs bidirectionally with the XState engagement machine. This creates the first "adapter" that bridges the new machine with the existing system.

## Goals

1. Create `useLensState` hook with URL and localStorage hydration
2. Implement bidirectional sync with engagement machine
3. Add persistence utilities for localStorage
4. Maintain backward compatibility with existing consumers
5. Add comprehensive tests for hook behavior

## Non-Goals

- Modifying NarrativeEngineContext consumers (Epic 6)
- Removing lens code from NarrativeEngineContext (Epic 6)
- Adding new lens types or validation
- Changing UI components

## Success Criteria

After this epic:
1. `useLensState` hook works independently
2. Hook syncs with engagement machine
3. URL parameters hydrate lens correctly
4. localStorage persistence works
5. All existing E2E tests pass (no regressions)

## Acceptance Criteria

### Functional Requirements

- [ ] AC-1: Hook returns `{ lens, lensSource, selectLens, isHydrated }`
- [ ] AC-2: URL parameter `?lens=X` sets lens on mount
- [ ] AC-3: localStorage `grove-lens` restores lens if no URL param
- [ ] AC-4: `selectLens(lens)` updates machine and persists
- [ ] AC-5: Hook subscribes to machine state changes
- [ ] AC-6: Hydration priority: URL > localStorage > null

### Test Requirements (MANDATORY)

- [ ] AC-T1: Unit tests for hook initialization
- [ ] AC-T2: Unit tests for URL hydration
- [ ] AC-T3: Unit tests for localStorage hydration
- [ ] AC-T4: Unit tests for machine sync
- [ ] AC-T5: All tests pass: `npm test`
- [ ] AC-T6: E2E tests pass: `npx playwright test`
- [ ] AC-T7: Health check passes: `npm run health`

### DEX Compliance

- [ ] AC-D1: Valid lenses defined in config, not hardcoded
- [ ] AC-D2: Persistence strategy is declarative
- [ ] AC-D3: Hook is pure adapter, no business logic

## Hook API Design

### useLensState

```typescript
interface UseLensStateOptions {
  actor: Actor<typeof engagementMachine>;
}

interface UseLensStateReturn {
  lens: string | null;
  lensSource: 'url' | 'localStorage' | 'selection' | null;
  selectLens: (lens: string) => void;
  isHydrated: boolean;
}

function useLensState(options: UseLensStateOptions): UseLensStateReturn;
```

### Usage Example

```typescript
import { useLensState } from '@/core/engagement';

function LensPicker({ actor }) {
  const { lens, selectLens, isHydrated } = useLensState({ actor });
  
  if (!isHydrated) return <Loading />;
  
  return (
    <select value={lens || ''} onChange={e => selectLens(e.target.value)}>
      {lenses.map(l => <option key={l} value={l}>{l}</option>)}
    </select>
  );
}
```

## Persistence Utilities

### API

```typescript
// src/core/engagement/persistence.ts

const STORAGE_KEYS = {
  lens: 'grove-lens',
  journey: 'grove-journey',  // Future
} as const;

function getLens(): string | null;
function setLens(lens: string): void;
function clearLens(): void;

function isBrowser(): boolean;
```

## Hydration Flow

```
Mount
  │
  ▼
Check URL params
  │
  ├─► Has ?lens=X ──► Validate ──► send(SELECT_LENS, { source: 'url' })
  │                      │
  │                      └─► Invalid ──► Continue
  │
  ▼
Check localStorage
  │
  ├─► Has grove-lens ──► Validate ──► send(SELECT_LENS, { source: 'localStorage' })
  │                          │
  │                          └─► Invalid ──► Clear invalid, continue
  │
  ▼
Set isHydrated = true
  │
  ▼
Subscribe to machine
```

## Dependencies

| Package | Purpose | Status |
|---------|---------|--------|
| xstate | Machine library | ✅ Installed (v5.25.0) |
| @xstate/react | React bindings | ❌ Need to add |
| @testing-library/react-hooks | Hook testing | ❌ Need to add |

## File Structure

```
src/core/engagement/
├── index.ts                    # Add hook export
├── machine.ts                  # Unchanged
├── persistence.ts              # NEW: localStorage utilities
└── hooks/
    ├── index.ts                # NEW: Hook exports
    └── useLensState.ts         # NEW: Lens state hook

tests/unit/
├── engagement-machine.test.ts  # Existing (24 tests)
├── use-lens-state.test.ts      # NEW: Hook tests
└── persistence.test.ts         # NEW: Persistence tests
```

## Health Check Addition

```json
{
  "id": "lens-state-hook-valid",
  "name": "Lens State Hook Valid",
  "category": "engagement",
  "type": "e2e-behavior",
  "test": "engagement-behaviors.spec.ts:lens selection persists",
  "impact": "Lens state management broken",
  "inspect": "npx vitest run tests/unit/use-lens-state.test.ts"
}
```

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Hook/machine race condition | Medium | Medium | Hydration flag |
| SSR localStorage error | Low | High | isBrowser() check |
| Invalid stored lens | Low | Low | Validation on restore |
| Actor not provided | Low | High | Runtime error with message |

## Out of Scope

- Consumer migration (Epic 6)
- Journey state extraction (Epic 3)
- Entropy state extraction (Epic 4)
- UI changes
- New lens types
