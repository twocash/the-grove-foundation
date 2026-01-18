# Specification: Active Grove Polish v2

## Goals

### G1: Fix Critical Reload Bug
Users returning with a previously-set lens can navigate through all sections without getting stuck.

### G2: Improve Quote Carousel UX
Slow down card transitions for readability. Add section context.

### G3: Redesign Diary Entry Section (AhaDemo)
Update copy, fix scaling, streamline to single CTA with proper Terminal integration.

### G4: Polish Foundation Section Layout
Reorder elements for better visual hierarchy, apply consistent styling.

## Non-Goals

- Redesigning the overall split layout architecture
- Adding new sections or features
- Changing the state machine fundamentals
- Mobile-specific optimizations (future sprint)
- Automated testing for UI components (future sprint)

## Acceptance Criteria

### AC1: Reload Flow (Critical)
```gherkin
GIVEN a user has previously selected a lens
WHEN they refresh the page and click the sapling
THEN the Terminal opens with their lens active
AND they can click the sapling to advance to Section 2
AND they can navigate through all sections normally
```

### AC2: Fresh Visit Flow (Regression Check)
```gherkin
GIVEN a new user with no lens set
WHEN they click the sapling
THEN the Terminal opens with lens picker
WHEN they select a lens
THEN the headline morphs via WaveformCollapse
AND sections unlock after animation completes
```

### AC3: Quote Carousel Timing
```gherkin
GIVEN the user is viewing Section 2 (ProblemStatement)
WHEN quote cards auto-advance
THEN each card displays for at least 6 seconds
AND the section has a contextual headline
```

### AC4: Diary Entry Redesign
```gherkin
GIVEN the user is viewing Section 4 (AhaDemo)
THEN the diary text fits within the viewport in split mode
AND only one CTA button is visible ("Ask The Grove: How does Grove know when to call for backup?")
AND clicking the CTA opens Terminal with the visible query
AND the underlying prompt includes the full context about hybrid routing
```

### AC5: Foundation Layout
```gherkin
GIVEN the user is viewing the "Why This Works" section
THEN "Want to go deeper?" appears ABOVE the three buttons
AND the text is orange/accent colored and centered
AND the sapling appears BELOW the buttons
AND there is no pink strikethrough styling
```

## Test Requirements

### Manual Test Script
1. Clear localStorage, fresh visit → complete flow
2. With lens set, refresh → verify can navigate all sections
3. Time quote carousel transitions (should be ~6s)
4. Verify diary section fits viewport without scroll in split mode
5. Click diary CTA → verify Terminal shows correct query
6. Verify Foundation layout matches spec

### Automated (Future)
- E2E test for reload flow once pattern is stable
