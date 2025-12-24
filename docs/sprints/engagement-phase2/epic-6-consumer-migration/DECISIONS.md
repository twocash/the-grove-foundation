# Architectural Decision Records — Epic 6: Consumer Migration

## ADR-067: EngagementProvider Inside NarrativeEngineProvider

### Status
Accepted

### Context
Where should EngagementProvider be positioned relative to NarrativeEngineProvider?

### Options Considered

1. **Inside NarrativeEngine** — EngagementProvider nested within
2. **Outside NarrativeEngine** — EngagementProvider wraps NarrativeEngine
3. **Sibling** — Parallel at same level
4. **Replace** — Remove NarrativeEngine, use only Engagement

### Decision
Install EngagementProvider inside NarrativeEngineProvider.

### Rationale
- NarrativeEngineProvider may have dependencies
- Engagement is additive, not replacement
- Allows gradual migration
- Minimizes risk of breaking existing functionality

```typescript
<NarrativeEngineProvider>
  <EngagementProvider>
    {children}
  </EngagementProvider>
</NarrativeEngineProvider>
```

### Consequences

**Positive:**
- Both contexts available everywhere
- Non-disruptive installation
- Gradual migration possible

**Negative:**
- Two providers to maintain (temporarily)
- Potential for mixed usage

---

## ADR-068: Full Component Migration, No Mixing

### Status
Accepted

### Context
When migrating a component, should we migrate all engagement state or allow partial migration?

### Options Considered

1. **Full migration** — All lens/journey/entropy from new hooks
2. **Partial migration** — Some from old, some from new
3. **Gradual** — Migrate one state type at a time

### Decision
Migrate all engagement state in a component at once.

### Rationale
- Prevents state synchronization bugs
- Clear ownership per component
- Easier to verify correctness
- Simpler mental model

```typescript
// GOOD: All from new hooks
const { lens, selectLens } = useLensState({ actor });
const { journey, isActive } = useJourneyState({ actor });
const { entropy } = useEntropyState({ actor });

// BAD: Mixed sources
const { lens } = useNarrativeEngine();  // OLD
const { selectLens } = useLensState({ actor });  // NEW
// These won't sync!
```

### Consequences

**Positive:**
- No state divergence
- Clear migration boundaries
- Easy rollback per component

**Negative:**
- Larger individual changes
- Can't migrate incrementally within component

---

## ADR-069: Keep NarrativeEngineContext for Non-Engagement Features

### Status
Accepted

### Context
Should we migrate ALL features from NarrativeEngineContext or just engagement (lens/journey/entropy)?

### Options Considered

1. **Engagement only** — Only lens/journey/entropy
2. **Full migration** — All features to new system
3. **Phased** — Engagement now, rest later

### Decision
Migrate only engagement features (lens, journey, entropy). Keep NarrativeEngineContext for messages, loading, and other features.

### Rationale
- Scope control — Epic focused on engagement
- NarrativeEngine handles other concerns (messages, AI responses)
- Separation of concerns is correct
- Full migration would require new architecture for messages

### Consequences

**Positive:**
- Focused scope
- Less risk
- Faster delivery

**Negative:**
- Two contexts remain
- Potential confusion about which to use

---

## ADR-070: Prioritize Simple Consumers First

### Status
Accepted

### Context
In what order should consumers be migrated?

### Options Considered

1. **Simple first** — Single-state consumers first
2. **Critical first** — Most important components first
3. **All at once** — Big bang migration
4. **Random** — No particular order

### Decision
Migrate simple consumers first (those using only one state type).

### Rationale
- Validates migration pattern with low risk
- Builds confidence before complex cases
- Issues caught early are easier to debug
- Creates template for later migrations

### Migration order:
1. Components using only `lens`
2. Components using only `journey`
3. Components using only `entropy`
4. Components using multiple state types

### Consequences

**Positive:**
- Risk managed
- Pattern validated early
- Clear progression

**Negative:**
- May leave complex components for later
- Longest overall timeline

---

## ADR-071: E2E Tests Verify Migration, Not Behavior

### Status
Accepted

### Context
What should migration E2E tests focus on?

### Options Considered

1. **Migration verification** — Tests that migration works
2. **Behavior tests** — Full functionality testing
3. **Regression tests** — Verify nothing broke
4. **All of the above** — Comprehensive

### Decision
E2E tests for migration should verify the system works, not retest existing behavior.

### Rationale
- Existing E2E tests cover behavior
- Migration tests check integration
- Avoid test duplication
- Keep Epic focused

```typescript
// Migration test (verify works)
test('app loads with EngagementProvider', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});

// NOT behavior retest
test('lens selection shows correct content', ...); // Already covered
```

### Consequences

**Positive:**
- Focused tests
- No duplication
- Clear purpose

**Negative:**
- May miss edge cases
- Relies on existing tests for behavior
