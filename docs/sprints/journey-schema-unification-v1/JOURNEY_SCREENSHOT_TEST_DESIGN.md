# Journey Screenshot Test Design

**Purpose:** Automated visual regression tests for journey flows

---

## Proposed Test File

**Location:** `tests/e2e/journey-screenshots.spec.ts`

## Test Approach

### 1. Parameterized Journey Test
Run the same test flow against all 6 journeys, capturing screenshots at:
- Initial journey state (after clicking pill)
- Each waypoint display
- Completion state

### 2. Screenshot Naming Convention
```
journey-{journeyId}-waypoint-{index}.png
journey-{journeyId}-complete.png
```

### 3. Test Flow
1. Navigate to `/terminal`
2. Select lens (engineer for consistency)
3. Click journey pill
4. Capture initial screenshot
5. Loop: advance waypoint → capture screenshot
6. Capture completion state

---

## Implementation Notes

**Requires:** Journey pills to be clickable and XState to transition properly (the fix we're planning)

**Dependencies:**
- `getCanonicalJourney()` working correctly
- XState journey flow functional
- Terminal UI rendering journey content

**Screenshot Config:**
```typescript
await expect(page).toHaveScreenshot(`journey-${journeyId}-waypoint-${i}.png`, {
  maxDiffPixelRatio: 0.01,  // 1% tolerance for dynamic content
  timeout: 10000,
});
```

---

## Recommendation

**Do not create this test until the journey-schema-unification sprint is complete.**

The current broken state (journey pills crash) means:
1. Test will fail immediately
2. Screenshots will be of error states
3. Baseline captures will be invalid

**Sequence:**
1. Complete `journey-schema-unification-v1` sprint
2. Verify journey pills work manually
3. Create screenshot test
4. Capture baselines with `--update-snapshots`

---

## Draft Test Code

See: `journey-screenshots.spec.ts.draft` (for inclusion after fix)
