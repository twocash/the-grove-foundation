# Sprint Breakdown: Grove Object Model v1

**Sprint:** grove-object-model-v1  
**Total Estimate:** 12 hours  
**Recommended Sessions:** 3 (4 hours each)

---

## Epic Overview

| Epic | Focus | Estimate | Session |
|------|-------|----------|---------|
| 1 | Schema & Types | 2h | 1 |
| 2 | Storage & Collection | 3h | 1 |
| 3 | Card Components | 4h | 2 |
| 4 | Integration & Testing | 2h | 3 |
| 5 | Documentation | 1h | 3 |

---

## Epic 1: Schema & Types (2 hours)

**Goal:** Define GroveObjectMeta and extend Journey

### Story 1.1: Create grove-object.ts
**File:** `src/core/schema/grove-object.ts`  
**Estimate:** 45 min

**Tasks:**
- [ ] Create file with GroveObjectType union
- [ ] Define GroveObjectStatus type
- [ ] Define GroveObjectProvenance interface
- [ ] Define GroveObjectMeta interface
- [ ] Define GroveObject<T> generic interface
- [ ] Add isGroveObjectMeta type guard
- [ ] Export all types

**Acceptance:**
- TypeScript compiles
- Types available for import

---

### Story 1.2: Extend Journey Interface
**File:** `src/core/schema/narrative.ts`  
**Estimate:** 45 min

**Tasks:**
- [ ] Import GroveObjectMeta from grove-object.ts
- [ ] Modify Journey to extend Omit<GroveObjectMeta, 'type'>
- [ ] Add `type: 'journey'` as literal
- [ ] Ensure existing Journey fields remain
- [ ] Verify no breaking changes to consumers

**Acceptance:**
- Existing code using Journey still compiles
- Journey has all GroveObjectMeta fields
- `journey.type === 'journey'` (narrowed)

---

### Story 1.3: Build Verification
**Estimate:** 30 min

**Tasks:**
- [ ] Run `pnpm build`
- [ ] Fix any type errors
- [ ] Run `pnpm test`
- [ ] Fix any test failures

**Acceptance:**
- Clean build
- All existing tests pass

---

## Epic 2: Storage & Collection (3 hours)

**Goal:** Favorites storage and useGroveObjects hook

### Story 2.1: Create user-preferences.ts
**File:** `src/lib/storage/user-preferences.ts`  
**Estimate:** 30 min

**Tasks:**
- [ ] Create file with storage key constants
- [ ] Implement getFavorites()
- [ ] Implement isFavorite()
- [ ] Implement setFavorite()
- [ ] Implement toggleFavorite()
- [ ] Add SSR guard (typeof window check)

**Acceptance:**
- Favorites persist in localStorage
- Works in browser, doesn't crash in SSR

---

### Story 2.2: Create normalizeJourney Function
**File:** `src/surface/hooks/useGroveObjects.ts` (partial)  
**Estimate:** 30 min

**Tasks:**
- [ ] Create normalizeJourney function
- [ ] Map all GroveObjectMeta fields
- [ ] Include favorite status from localStorage
- [ ] Return GroveObject<Journey>

**Acceptance:**
- normalizeJourney(journey) returns valid GroveObject
- Favorite status merged from localStorage

---

### Story 2.3: Create useGroveObjects Hook
**File:** `src/surface/hooks/useGroveObjects.ts`  
**Estimate:** 90 min

**Tasks:**
- [ ] Define UseGroveObjectsOptions interface
- [ ] Define UseGroveObjectsResult interface
- [ ] Implement hook consuming NarrativeEngine
- [ ] Add type filtering
- [ ] Add status filtering
- [ ] Add tags filtering
- [ ] Add favorite filtering
- [ ] Add sorting (createdAt, updatedAt, title)
- [ ] Add setFavorite action
- [ ] Add isFavorite helper

**Acceptance:**
- Hook returns normalized Journey objects
- All filters work
- Sorting works
- setFavorite updates localStorage

---

### Story 2.4: Collection Hook Tests
**Estimate:** 30 min

**Tasks:**
- [ ] Test normalizeJourney mapping
- [ ] Test type filtering
- [ ] Test favorite filtering
- [ ] Test sorting

**Acceptance:**
- Core functionality covered by tests

---

## Epic 3: Card Components (4 hours)

**Goal:** GroveObjectCard with type dispatch

### Story 3.1: Create CardShell Component
**File:** `src/surface/components/GroveObjectCard/CardShell.tsx`  
**Estimate:** 60 min

**Tasks:**
- [ ] Create component structure
- [ ] Implement Visual State Matrix (--card-* tokens)
- [ ] Add header with icon and title
- [ ] Add favorite button
- [ ] Add footer with status and tags
- [ ] Handle click propagation

**Acceptance:**
- Uses Sprint 6 --card-* tokens
- Visual states work (default, inspected, active)
- Favorite star toggles

---

### Story 3.2: Create JourneyContent Component
**File:** `src/surface/components/GroveObjectCard/JourneyContent.tsx`  
**Estimate:** 45 min

**Tasks:**
- [ ] Create component accepting Journey payload
- [ ] Display description (line-clamp)
- [ ] Display estimated minutes
- [ ] Display target "aha" moment
- [ ] Match existing JourneyCard styling

**Acceptance:**
- Journey-specific fields rendered
- Consistent with existing card designs

---

### Story 3.3: Create GenericContent Component
**File:** `src/surface/components/GroveObjectCard/GenericContent.tsx`  
**Estimate:** 30 min

**Tasks:**
- [ ] Create fallback component
- [ ] Display description
- [ ] Display type badge
- [ ] Handle missing fields gracefully

**Acceptance:**
- Unknown types render something useful
- No crashes for minimal objects

---

### Story 3.4: Create GroveObjectCard Main Component
**File:** `src/surface/components/GroveObjectCard/index.tsx`  
**Estimate:** 60 min

**Tasks:**
- [ ] Create CONTENT_RENDERERS registry
- [ ] Register JourneyContent for 'journey'
- [ ] Implement type dispatch logic
- [ ] Compose CardShell with content
- [ ] Export component and types

**Acceptance:**
- Journey objects render JourneyContent
- Unknown types render GenericContent
- Props passed through to CardShell

---

### Story 3.5: Card Component Tests
**Estimate:** 45 min

**Tasks:**
- [ ] Test CardShell visual states
- [ ] Test JourneyContent rendering
- [ ] Test type dispatch

**Acceptance:**
- Components render without errors
- Visual states apply correct classes

---

## Epic 4: Integration & Testing (2 hours)

**Goal:** Wire everything together, verify end-to-end

### Story 4.1: Create Demo Page/Story
**Estimate:** 45 min

**Tasks:**
- [ ] Create test page or Storybook story
- [ ] Load journeys via useGroveObjects
- [ ] Render with GroveObjectCard
- [ ] Test favorite toggle
- [ ] Test filter controls

**Acceptance:**
- Can see journey cards
- Favorites work end-to-end
- Filters work

---

### Story 4.2: Integration with Existing UI
**Estimate:** 45 min

**Tasks:**
- [ ] Identify one place to use GroveObjectCard
- [ ] Replace or add alongside existing card
- [ ] Verify no regressions

**Acceptance:**
- GroveObjectCard works in production context
- Existing functionality preserved

---

### Story 4.3: End-to-End Verification
**Estimate:** 30 min

**Tasks:**
- [ ] Manual test: view journeys
- [ ] Manual test: favorite a journey
- [ ] Manual test: refresh, favorite persists
- [ ] Manual test: filter by favorite
- [ ] Manual test: sort by date/title

**Acceptance:**
- All happy paths work
- No console errors

---

## Epic 5: Documentation (1 hour)

**Goal:** Pattern 7 documented, sprint closed

### Story 5.1: Add Pattern 7 to PROJECT_PATTERNS.md
**File:** `PROJECT_PATTERNS.md`  
**Estimate:** 30 min

**Tasks:**
- [ ] Write Pattern 7 section
- [ ] List files and purposes
- [ ] Document extension points
- [ ] Add DO/DON'T guidance
- [ ] Reference ADRs

**Acceptance:**
- Pattern 7 fully documented
- New developers can extend the model

---

### Story 5.2: Update Sprint DEVLOG
**File:** `docs/sprints/grove-object-model-v1/DEVLOG.md`  
**Estimate:** 15 min

**Tasks:**
- [ ] Record execution timeline
- [ ] Note any deviations from plan
- [ ] Document lessons learned

**Acceptance:**
- Sprint history captured

---

### Story 5.3: PR and Merge
**Estimate:** 15 min

**Tasks:**
- [ ] Create PR with sprint summary
- [ ] Link to sprint artifacts
- [ ] Merge to main

**Acceptance:**
- Code merged
- Sprint complete

---

## Commit Sequence

```
1. feat(schema): add GroveObjectMeta base types
2. feat(schema): extend Journey with GroveObjectMeta
3. feat(storage): add user preferences with favorites
4. feat(hooks): add useGroveObjects collection hook
5. feat(components): add CardShell with visual states
6. feat(components): add JourneyContent renderer
7. feat(components): add GenericContent fallback
8. feat(components): add GroveObjectCard with type dispatch
9. test: add Object Model unit tests
10. docs: add Pattern 7 to PROJECT_PATTERNS.md
```

---

## Session Plan

### Session 1 (4 hours)
- Epic 1: Schema & Types (2h)
- Epic 2: Storage & Collection (2h of 3h)

### Session 2 (4 hours)
- Epic 2: Finish Collection Hook (1h)
- Epic 3: Card Components (3h)

### Session 3 (4 hours)
- Epic 3: Card Tests (1h)
- Epic 4: Integration & Testing (2h)
- Epic 5: Documentation (1h)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| NarrativeEngine hook changes | Keep normalizer separate, don't modify engine |
| Sprint 6 tokens not ready | This sprint depends on Sprint 6; execute after |
| localStorage quota | Cap favorites at 1000 |
| Type inference issues | Use explicit generic params |

---

## Dependencies

**Must be complete before starting:**
- Sprint 6 (card-system-unification-v1) for `--card-*` tokens

**Can run in parallel:**
- Nothing blocks on this sprint

---

*Sprint breakdown complete. Ready for execution.*
