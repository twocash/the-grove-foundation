# SPEC: kinetic-suggested-prompts-v1

**Sprint:** kinetic-suggested-prompts-v1  
**Author:** Claude (Foundation Loop v2)  
**Created:** 2025-01-04  
**Status:** 🟡 Planning

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 2: Specification |
| **Status** | 🟡 In Progress |
| **Blocking Issues** | None |
| **Last Updated** | 2025-01-04T20:30:00Z |
| **Next Action** | Complete SPEC, then ARCHITECTURE.md |
| **Attention Anchor** | Wire 4D context to inline navigation |

---

## Attention Anchor

**Re-read this block before every major decision.**

- **We are building:** Inline suggested prompts that use 4D context to surface relevant next steps
- **Success looks like:** 2-4 contextual prompts render at end of responses; clicking auto-submits
- **We are NOT:** Building LLM-generated prompts, Active Rhetoric, or rewriting Kinetic Stream
- **Current phase:** Planning
- **Next action:** Define component hierarchy and data flow

---

## Goal

Transform the suggested prompts experience from a disconnected floating widget into contextually-aware inline navigation that feels like a natural continuation of exploration. Wire the existing 4D Context Fields system (`selectPrompts()`) to populate `NavigationBlock` at the end of responses.

**Core insight:** The infrastructure exists. This sprint is integration work, not creation.

---

## Non-Goals

Explicit scope exclusions (from REQUIREMENTS.md):

1. **LLM-generated fork labels** — Use library prompts only
2. **Active Rhetoric highlights** — Orange clickable terms (separate sprint)
3. **Cognitive state streaming** — "thinking..." indicators (separate sprint)
4. **Full Kinetic Stream rewrite** — Incremental improvement only
5. **Journey system enhancement** — Deprecating, not improving
6. **New prompt creation** — 60 prompts already exist

---

## Patterns Extended (MANDATORY)

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Prompt selection | Context Fields (`selectPrompts`) | Wire to response finalization |
| State aggregation | Engagement Machine | Create `useContextState` adapter |
| Navigation rendering | NavigationBlock component | Already exists - feed it data |
| Fork types | JourneyFork schema | Add PromptObject → JourneyFork adapter |
| Auto-submit | `handleForkSelect` action | Already wired in machine |

---

## Acceptance Criteria

### P0: Must Have (Sprint Gate)

- [ ] **AC-1:** `useContextState` hook aggregates EngagementContext → ContextState
- [ ] **AC-2:** `promptToFork` adapter converts PromptObject → JourneyFork
- [ ] **AC-3:** `useNavigationPrompts` hook returns scored prompts as JourneyFork[]
- [ ] **AC-4:** NavigationBlock renders at end of completed responses
- [ ] **AC-5:** Clicking fork auto-submits `executionPrompt` (no Enter required)
- [ ] **AC-6:** Base prompts surface without lens (fallback works)
- [ ] **AC-7:** Lens-specific prompts surface when lens active

### P1: Should Have

- [ ] **AC-8:** Fork type inferred correctly (deep_dive, pivot, apply, challenge)
- [ ] **AC-9:** Visual variants render (default, glow, subtle, urgent)
- [ ] **AC-10:** Entropy stabilization prompts appear when entropy > 0.7
- [ ] **AC-11:** Topic affinities influence selection

### P2: Nice to Have

- [ ] **AC-12:** Analytics track impressions, selections
- [ ] **AC-13:** Cooldown prevents repeated prompts
- [ ] **AC-14:** Floating widget deprecated (hidden via flag)

---

## Architecture Overview

### Component Hierarchy

```
TerminalChat
├── StreamRenderer
│   └── ResponseBlock
│       ├── GlassPanel (content)
│       └── NavigationBlock (NEW: 4D-aware)
│           └── ForkButton × N
└── CommandInput
```

### Data Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│EngagementContext │────▶│  useContextState │────▶│   ContextState   │
│   (XState)       │     │    (adapter)     │     │   (aggregated)   │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                                          │
                                                          ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  libraryPrompts  │────▶│  selectPrompts   │────▶│  PromptObject[]  │
│   (60 prompts)   │     │   (scorer)       │     │   (ranked)       │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                                          │
                                                          ▼
                         ┌──────────────────┐     ┌──────────────────┐
                         │  promptToFork    │────▶│  JourneyFork[]   │
                         │   (adapter)      │     │  (for render)    │
                         └──────────────────┘     └──────────────────┘
                                                          │
                                                          ▼
                                                  ┌──────────────────┐
                                                  │ NavigationBlock  │
                                                  │  (renders pills) │
                                                  └──────────────────┘
                                                          │
                                                          ▼
                                                  ┌──────────────────┐
                                                  │ USER.SELECT_FORK │
                                                  │ (auto-submit)    │
                                                  └──────────────────┘
```

### Key Files

| File | Role |
|------|------|
| `src/core/context-fields/useContextState.ts` | Aggregate 4D state |
| `src/core/context-fields/adapters.ts` | PromptObject → JourneyFork |
| `src/explore/hooks/useNavigationPrompts.ts` | Selection hook |
| `components/Terminal/Stream/blocks/ResponseBlock.tsx` | Render integration |

---

## ContextState Aggregation

Map from `EngagementContext` to `ContextState`:

```typescript
function aggregateContextState(engagement: EngagementContext): ContextState {
  return {
    stage: computeStage(engagement),              // From session state
    entropy: engagement.entropy,                  // Direct
    activeLensId: engagement.lens,                // Direct
    activeMoments: evaluateMoments(engagement),   // From moment evaluator
    interactionCount: engagement.streamHistory.length,
    topicsExplored: engagement.topicExplorations.map(t => t.topicId),
    sproutsCaptured: engagement.sproutCaptures.length,
    offTopicCount: 0  // TODO: track separately
  };
}
```

**Stage computation:**
```typescript
function computeStage(engagement: EngagementContext): Stage {
  const count = engagement.streamHistory.length;
  if (count === 0) return 'genesis';
  if (count < 5) return 'exploration';
  if (engagement.sproutCaptures.length > 0) return 'advocacy';
  return 'synthesis';
}
```

---

## PromptObject → JourneyFork Adapter

```typescript
function promptToFork(prompt: PromptObject): JourneyFork {
  return {
    id: prompt.id,
    label: prompt.label,
    type: inferForkType(prompt),
    queryPayload: prompt.executionPrompt,
    context: prompt.description
  };
}

function inferForkType(prompt: PromptObject): JourneyForkType {
  // Entropy-reactive prompts are challenges
  if (prompt.targeting.entropyWindow?.min > 0.6) return 'challenge';
  
  // Topic-connected prompts are pivots
  if (prompt.topicAffinities.length > 0) return 'pivot';
  
  // Synthesis/reflection prompts are apply
  if (prompt.tags.some(t => ['synthesis', 'reflection', 'contribution'].includes(t))) {
    return 'apply';
  }
  
  // Default: deep dive
  return 'deep_dive';
}
```

---

## Integration Point

**Where to inject:** After response finalization, before render.

**Option selected:** Post-finalization hook in `useNavigationPrompts`

```typescript
// In ResponseBlock or parent component
const { prompts } = useNavigationPrompts();
const forks = item.navigation ?? prompts;  // Merge strategy
```

**Alternative (machine-level):** Modify `finalizeResponse` action to call selector. Rejected because:
- Adds async complexity to machine
- Couples machine to React hooks
- Harder to test in isolation

---

## Testing Strategy

### Unit Tests

**File:** `tests/unit/context-fields-integration.test.ts`

```typescript
describe('useContextState', () => {
  it('aggregates engagement context to ContextState', () => { ... });
  it('computes stage from interaction count', () => { ... });
  it('extracts topics from explorations', () => { ... });
});

describe('promptToFork', () => {
  it('converts PromptObject to JourneyFork', () => { ... });
  it('infers deep_dive for default prompts', () => { ... });
  it('infers challenge for high-entropy prompts', () => { ... });
});
```

### Integration Tests

**File:** `tests/integration/navigation-prompts.test.tsx`

```typescript
describe('useNavigationPrompts', () => {
  it('returns prompts matching current context', () => { ... });
  it('filters by active lens', () => { ... });
  it('respects entropy windows', () => { ... });
});
```

### E2E Tests

**File:** `tests/e2e/suggested-prompts.spec.ts`

```typescript
test('inline prompts appear after response', async ({ page }) => {
  await page.goto('/explore');
  await sendMessage(page, 'What is the Grove?');
  await expect(page.getByTestId('navigation-block')).toBeVisible();
  await expect(page.getByTestId('fork-button')).toHaveCount({ min: 2, max: 4 });
});

test('clicking prompt auto-submits', async ({ page }) => {
  const fork = page.getByTestId('fork-button').first();
  await fork.click();
  // Should immediately start generating response
  await expect(page.getByTestId('response-block').last()).toContainText(/loading|thinking/i);
});
```

---

## Migration Notes

### Feature Flag

```typescript
// config/features.ts
export const FEATURES = {
  INLINE_NAVIGATION_PROMPTS: true,  // Enable new system
  FLOATING_SUGGESTION_WIDGET: false // Disable legacy
};
```

### Rollback Plan

1. Set `INLINE_NAVIGATION_PROMPTS: false`
2. Set `FLOATING_SUGGESTION_WIDGET: true`
3. No code changes required

---

## Open Questions

1. **Prompt count:** Fixed at 3, or adaptive (2-4)?
   - **Decision:** Start with 3, make configurable later

2. **Merge strategy:** Library prompts + parsed forks, or library only?
   - **Decision:** Library prompts only for MVP; parsed forks are separate content system

3. **Mobile layout:** Vertical stack or horizontal scroll?
   - **Decision:** Defer to existing NavigationBlock flex-wrap behavior

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Prompt click-through | ~5% | 25%+ |
| Average session turns | ~3 | 5+ |
| Time to first click | N/A | <30s |

---

## Next: ARCHITECTURE.md

Proceed to detailed architecture with:
- File structure
- Type definitions
- Integration sequence
- Error handling

