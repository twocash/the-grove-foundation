# STORY_BREAKDOWN.md — engagement-orchestrator-v1

## Sprint Overview

**Total estimated time:** 6-8 hours
**Stories:** 7
**Risk level:** Medium (new system, parallel to existing)

---

## Epic 1: Schema Foundation

### Story 1.1: Create Moment Schema (GroveObject Pattern)
**Estimate:** 45 minutes
**Priority:** P0 (blocks everything)

**Tasks:**
- [ ] Create `src/core/schema/moment.ts`
- [ ] Import `GroveObject`, `GroveObjectMeta` from `./grove-object`
- [ ] Define `MomentSurface` enum
- [ ] Define `NumericRange` schema with refinement
- [ ] Define `MomentTrigger` schema (all condition types)
- [ ] Define `PromptDefinition` schema
- [ ] Define `MomentContent` schema with variants
- [ ] Define `MomentAction` schema
- [ ] Define `MomentPayload` schema (the T in GroveObject<T>)
- [ ] Define `MomentMetaSchema` (Zod version of GroveObjectMeta)
- [ ] Define `MomentSchema` combining meta + payload
- [ ] Export `Moment` type as `GroveObject<MomentPayload>`
- [ ] Export `isMoment` type guard
- [ ] Update `src/core/schema/index.ts` to export moment

**Acceptance Criteria:**
```typescript
// This should compile and validate
import { Moment, MomentSchema } from '@core/schema';

const moment: Moment = {
  meta: {
    id: 'test',
    type: 'moment',
    title: 'Test Moment',
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    status: 'active'
  },
  payload: {
    trigger: { stage: ['ARRIVAL'] },
    content: { type: 'text', body: 'Hello' },
    surface: 'overlay',
    actions: []
  }
};

MomentSchema.parse(moment); // Should not throw
```

**Files:**
- CREATE: `src/core/schema/moment.ts`
- MODIFY: `src/core/schema/index.ts`

---

## Epic 2: Core Engine

### Story 2.1: Implement Moment Evaluator
**Estimate:** 1 hour
**Priority:** P0 (blocks hook)

**Tasks:**
- [ ] Create `src/core/engagement/moment-evaluator.ts`
- [ ] Implement `inRange()` helper
- [ ] Implement `matchesContextValue()` helper
- [ ] Implement `evaluateTrigger()` with all conditions:
  - [ ] Stage check (OR logic)
  - [ ] Numeric range checks
  - [ ] Flag checks (AND logic)
  - [ ] Context checks (lens, journey, hasCustomLens)
  - [ ] Probability check
- [ ] Implement `getEligibleMoments()`:
  - [ ] Filter by enabled
  - [ ] Filter by surface
  - [ ] Filter by cooldown
  - [ ] Filter by once flag
  - [ ] Evaluate triggers
  - [ ] Sort by priority

**Acceptance Criteria:**
```typescript
// Should return eligible: true for matching conditions
const result = evaluateTrigger(
  { stage: ['ARRIVAL'], exchangeCount: { min: 5 } },
  { stage: 'ARRIVAL', exchangeCount: 7, flags: {} }
);
expect(result.eligible).toBe(true);

// Should return eligible: false with reason
const result2 = evaluateTrigger(
  { flags: { shown: false } },
  { flags: { shown: true } }
);
expect(result2.eligible).toBe(false);
expect(result2.reason).toContain('Flag');
```

**Files:**
- CREATE: `src/core/engagement/moment-evaluator.ts`

---

### Story 2.2: Implement Moment Loader
**Estimate:** 30 minutes
**Priority:** P0 (blocks hook)

**Tasks:**
- [ ] Create `src/data/moments/moment-loader.ts`
- [ ] Use Vite `import.meta.glob` for `.moment.json` files
- [ ] Implement `loadMoments()`:
  - [ ] Glob import all `**/*.moment.json` files
  - [ ] Validate each with `MomentSchema.parse()`
  - [ ] Filter to `meta.status === 'active'`
  - [ ] Log validation errors
  - [ ] Return valid moments array
- [ ] Implement `loadAllMoments()` (includes draft/archived)
- [ ] Create `src/data/moments/index.ts` barrel export
- [ ] Update `src/core/engagement/index.ts` exports

**Acceptance Criteria:**
```typescript
import { loadMoments } from '@data/moments';

const moments = loadMoments();
console.log(moments.length); // 5+ active moments
console.log(moments[0].meta.id); // Accessing via GroveObject pattern
```

**Files:**
- CREATE: `src/data/moments/moment-loader.ts`
- CREATE: `src/data/moments/index.ts`
- MODIFY: `src/core/engagement/index.ts`

---

### Story 2.3: Extend Engagement State
**Estimate:** 45 minutes
**Priority:** P0 (blocks hook)

**Tasks:**
- [ ] Update `src/core/engagement/machine.ts`:
  - [ ] Add `flags` to context (initial values)
  - [ ] Add `momentCooldowns` to context
  - [ ] Add `SET_FLAG` event type
  - [ ] Add `SET_COOLDOWN` event type
  - [ ] Add `setFlag` action
  - [ ] Add `setCooldown` action
- [ ] Update `src/core/engagement/context.ts`:
  - [ ] Add `flags` to context value type
  - [ ] Add `momentCooldowns` to context value type
  - [ ] Add `setFlag` to actions hook
  - [ ] Add `setCooldown` to actions hook
  - [ ] Wire actions to machine send

**Acceptance Criteria:**
```typescript
const { flags, setFlag } = useEngagementActions();
setFlag('testFlag', true);
// flags.testFlag should now be true
```

**Files:**
- MODIFY: `src/core/engagement/machine.ts`
- MODIFY: `src/core/engagement/context.ts`

---

### Story 2.4: Add Moment Telemetry
**Estimate:** 20 minutes
**Priority:** P1

**Tasks:**
- [ ] Update `hooks/useEngagementBus.ts`:
  - [ ] Add `momentShown` emit function
  - [ ] Add `momentActioned` emit function
  - [ ] Add `momentDismissed` emit function
  - [ ] Add event types to interface

**Acceptance Criteria:**
```typescript
const emit = useEngagementEmit();
emit.momentShown('test-moment', 'overlay');
// Event bus receives 'moment.shown' event
```

**Files:**
- MODIFY: `hooks/useEngagementBus.ts`

---

## Epic 3: Data Layer

### Story 3.1: Create Core Moment Files
**Estimate:** 1 hour
**Priority:** P1

**Tasks:**
- [ ] Create directory structure:
  - [ ] `src/data/moments/core/`
  - [ ] `src/data/moments/engagement/`
  - [ ] `src/data/moments/education/`
- [ ] Create `core/welcome-arrival.moment.json`:
  - [ ] meta: id, type:'moment', title, status:'active', tags:['onboarding']
  - [ ] payload.trigger: ARRIVAL stage, welcomeCompleted: false
  - [ ] payload.surface: welcome
  - [ ] payload.content: heading, body, 3 action prompts
  - [ ] payload.actions: show-lens-picker, start-wizard, select-freestyle
- [ ] Create `core/simulation-reveal.moment.json`:
  - [ ] meta: id, type:'moment', title, icon:'Sparkles', tags:['reveal']
  - [ ] payload.trigger: journeysCompleted >= 1, simulationRevealed: false
  - [ ] payload.surface: overlay
  - [ ] payload.content: component type, lens variants
  - [ ] payload.actions: acknowledge, how-it-works
- [ ] Create `core/custom-lens-offer.moment.json`:
  - [ ] meta: id, type:'moment', title, tags:['engagement']
  - [ ] payload.trigger: exchangeCount >= 8, hasCustomLens: false
  - [ ] payload.surface: inline
  - [ ] payload.content: card with heading, body, icon
  - [ ] payload.actions: accept, dismiss
- [ ] Create `engagement/entropy-journey-offer.moment.json`:
  - [ ] meta: id, type:'moment', title, tags:['guidance']
  - [ ] payload.trigger: entropy >= 0.7, onEvent: exchange.completed
  - [ ] payload.surface: inline
  - [ ] payload.content: card
  - [ ] payload.actions: accept, dismiss
- [ ] Create `education/first-sprout-prompt.moment.json`:
  - [ ] meta: id, type:'moment', title, tags:['feature-discovery']
  - [ ] payload.trigger: exchangeCount >= 3, sproutsCaptured: 0
  - [ ] payload.surface: toast
  - [ ] payload.content: text
  - [ ] payload.actions: dismiss

**Acceptance Criteria:**
- All JSON files parse without error
- All moments pass `MomentSchema.parse()` validation
- Each moment has unique `meta.id`
- All `meta.type` fields are `'moment'`
- All `meta.status` fields are `'active'`
- `loadMoments()` returns 5 moments

**Files:**
- CREATE: `src/data/moments/core/welcome-arrival.moment.json`
- CREATE: `src/data/moments/core/simulation-reveal.moment.json`
- CREATE: `src/data/moments/core/custom-lens-offer.moment.json`
- CREATE: `src/data/moments/engagement/entropy-journey-offer.moment.json`
- CREATE: `src/data/moments/education/first-sprout-prompt.moment.json`

---

## Epic 4: Surface Layer

### Story 4.1: Implement useMoments Hook
**Estimate:** 1 hour
**Priority:** P0

**Tasks:**
- [ ] Create `src/surface/hooks/useMoments.ts`
- [ ] Import dependencies:
  - [ ] momentRegistry from @core/engagement
  - [ ] getEligibleMoments from @core/engagement
  - [ ] useEngagementContext, useEngagementActions
  - [ ] useEngagementEmit
- [ ] Implement `useMoments()`:
  - [ ] Accept surface and limit options
  - [ ] Subscribe to registry via useSyncExternalStore
  - [ ] Compute eligible moments via useMemo
  - [ ] Track moment shown via telemetry
  - [ ] Implement `executeAction()`:
    - [ ] Look up moment and action
    - [ ] Apply setFlags side effects
    - [ ] Mark once moments as shown
    - [ ] Update cooldown
    - [ ] Emit telemetry
    - [ ] Return action for caller
  - [ ] Implement `dismissMoment()` convenience wrapper
  - [ ] Return moments, activeMoment, handlers

**Acceptance Criteria:**
```typescript
function TestComponent() {
  const { activeMoment, executeAction, dismissMoment } = useMoments({ surface: 'overlay' });
  
  if (activeMoment) {
    return <button onClick={() => executeAction(activeMoment.id, 'accept')}>Accept</button>;
  }
  return null;
}
```

**Files:**
- CREATE: `src/surface/hooks/useMoments.ts`

---

### Story 4.2: Implement MomentCard Component
**Estimate:** 45 minutes
**Priority:** P1

**Tasks:**
- [ ] Create `src/surface/components/MomentRenderer/` directory
- [ ] Create `MomentCard.tsx`:
  - [ ] Accept moment, onAction, onDismiss, variant props
  - [ ] Resolve lens variants for content
  - [ ] Render heading with optional icon
  - [ ] Render body text
  - [ ] Render action buttons with variants
  - [ ] Style for overlay vs inline vs toast
- [ ] Create `component-registry.ts`:
  - [ ] Define componentMap with lazy imports
  - [ ] Register SimulationReveal, CustomLensOffer
  - [ ] Export getMomentComponent, registerMomentComponent
- [ ] Create `index.ts` barrel export
- [ ] Update `src/surface/components/index.ts`

**Acceptance Criteria:**
```tsx
<MomentCard
  moment={testMoment}
  onAction={(id) => console.log('action:', id)}
  onDismiss={() => console.log('dismissed')}
  variant="overlay"
/>
// Renders styled card with heading, body, buttons
```

**Files:**
- CREATE: `src/surface/components/MomentRenderer/index.ts`
- CREATE: `src/surface/components/MomentRenderer/MomentCard.tsx`
- CREATE: `src/surface/components/MomentRenderer/component-registry.ts`
- MODIFY: `src/surface/components/index.ts`

---

## Epic 5: Integration

### Story 5.1: Verify Loading and Integration
**Estimate:** 30 minutes
**Priority:** P1

**Tasks:**
- [ ] Verify `loadMoments()` returns all active moments
- [ ] Verify `useMoments({ surface: 'overlay' })` works in test component
- [ ] Add console logging for debugging:
  - [ ] Log moment count on load
  - [ ] Log evaluation results when moments change
- [ ] Test with browser dev tools:
  - [ ] Check network tab for JSON imports
  - [ ] Verify console shows loaded moments

**Acceptance Criteria:**
```typescript
// In browser console after app mounts:
import { loadMoments } from './src/data/moments';
const moments = loadMoments();
console.log('Loaded:', moments.length); // Should be 5
console.log('First:', moments[0].meta.id); // Should log moment ID
```

**Files:**
- No new files - verification only
- Optional: Add temporary test component

---

## Story Dependency Graph

```
Story 1.1 (Schema - GroveObject pattern)
    │
    ├──▶ Story 2.1 (Evaluator)
    │        │
    │        └──▶ Story 4.1 (useMoments)
    │                  │
    │                  └──▶ Story 4.2 (MomentCard)
    │
    ├──▶ Story 2.2 (Moment Loader)
    │        │
    │        └──▶ Story 3.1 (Moment JSON Files)
    │                  │
    │                  └──▶ Story 5.1 (Verification)
    │
    └──▶ Story 2.3 (Engagement State)
              │
              └──▶ Story 4.1 (useMoments)

Story 2.4 (Telemetry) ──▶ Story 4.1 (useMoments)
```

---

## Execution Order

**Phase 1: Foundation (2 hours)**
1. Story 1.1: Schema
2. Story 2.1: Evaluator
3. Story 2.2: Registry

**Phase 2: State Integration (1 hour)**
4. Story 2.3: Engagement State
5. Story 2.4: Telemetry

**Phase 3: Data (1 hour)**
6. Story 3.1: Moment Definitions

**Phase 4: Surface (2 hours)**
7. Story 4.1: useMoments Hook
8. Story 4.2: MomentCard Component

**Phase 5: Integration (30 min)**
9. Story 5.1: Provider Init

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Schema validation errors | Write schema incrementally, test each type |
| Evaluator edge cases | Add unit tests for each condition type |
| State not updating | Verify XState transitions in inspector |
| Hook not re-rendering | Check useSyncExternalStore subscription |
| JSON load failure | Wrap in try/catch, log errors |

---

## Definition of Done

Sprint complete when:
- [ ] All schema types exported from @core/schema
- [ ] Evaluator passes unit tests for all trigger types
- [ ] Registry loads moments from JSON
- [ ] Engagement state includes flags and cooldowns
- [ ] Telemetry events emit for moment lifecycle
- [ ] useMoments hook returns correct moments per surface
- [ ] MomentCard renders for text/card content types
- [ ] Console shows 5+ moments loaded on app start
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No console errors in browser

---

*Story breakdown complete. Ready for EXECUTION_PROMPT.md.*
