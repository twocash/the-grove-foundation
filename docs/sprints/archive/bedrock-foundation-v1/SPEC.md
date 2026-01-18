# Specification: bedrock-foundation-v1

**Sprint:** bedrock-foundation-v1  
**Version:** 1.0  
**Date:** December 30, 2024  

---

## Mission

Build the **Lens Workshop** as the reference implementation for all Bedrock consoles, establishing canonical patterns for admin interfaces.

---

## Goals

1. **Create reusable primitives** — BedrockLayout, BedrockNav, BedrockInspector, BedrockCopilot
2. **Create reusable hooks** — useCollectionView, usePatchHistory, GroveApi
3. **Build complete Lens Workshop** — Full CRUD with filter/sort/favorite and Copilot
4. **Establish patterns** — Every decision becomes template for future consoles

## Non-Goals

1. ❌ Migrate existing Foundation functionality (future sprint)
2. ❌ Build other consoles (Garden, Journey Studio, etc.)
3. ❌ Implement real-time collaboration (WebSockets)
4. ❌ Build local model routing (Copilot uses Gemini)

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Object identity | Pattern 7: GroveObject | Add `LensPayload` type |
| Card styling | Pattern 4: Token Namespaces | Use `--card-*` tokens |
| Favorites storage | Pattern 7: useGroveObjects | Use `user-preferences.ts` |

## New Patterns Proposed

### Pattern: Bedrock Console

**Why existing patterns insufficient:** No admin console pattern exists. Foundation is coupled to legacy.

**DEX Compliance:**
- **Declarative Sovereignty:** Console config (nav, metrics, filters, copilot) in JSON
- **Capability Agnosticism:** Manual editing works; Copilot enhances
- **Provenance:** All objects have GroveObjectMeta
- **Organic Scalability:** New console = config + card + editor

**Components:**
- `BedrockLayout` — Three-column shell
- `ConsoleConfig` — Declarative console definition
- `useCollectionView` — Reusable filter/sort/favorite
- `usePatchHistory` — Undo/redo via inverse patches
- `BedrockCopilot` — AI assistant with context protocol

---

## Canonical Source Audit

| Capability | Canonical Home | Current | Recommendation |
|------------|----------------|---------|----------------|
| Object types | `src/core/schema/grove-object.ts` | Exists | **USE** |
| Card tokens | `globals.css --card-*` | Exists | **USE** |
| Favorites | `user-preferences.ts` | Exists | **USE** |
| Three-column layout | None | N/A | **CREATE** in Bedrock |
| Collection view | None | N/A | **CREATE** as hook |
| Copilot | None | N/A | **CREATE** |
| Patch history | None | N/A | **CREATE** |

### No Duplication Certification

I confirm this sprint creates new canonical homes in `src/bedrock/` without duplicating existing capabilities. The strangler fig boundary (`src/foundation/`) is respected—no imports cross that boundary.

---

## Acceptance Criteria

### AC1: Primitives Render

```gherkin
Given I navigate to /bedrock/lenses
Then I see BedrockLayout with three columns
And ConsoleHeader shows "Lens Workshop"
And MetricsRow shows 4 stat cards
And BedrockNav shows navigation items
And BedrockInspector is collapsed (no selection)
```

**Test:** `npx playwright test tests/e2e/bedrock-primitives.spec.ts`

### AC2: Collection View Works

```gherkin
Given lenses exist in the system
When I view the Lens Workshop
Then I see lenses in a grid
When I type in the search box
Then the grid filters to matching lenses
When I click a sort option
Then the grid reorders accordingly
When I click the favorite star on a lens
Then it is marked as favorite
When I toggle "Show favorites only"
Then only favorited lenses appear
```

**Test:** `npx playwright test tests/e2e/bedrock-collection.spec.ts`

### AC3: CRUD Operations Work

```gherkin
Given I am in Lens Workshop
When I click "New Lens"
Then a new lens is created
And it appears in the grid
And it is selected in the inspector

Given a lens is selected
When I edit a field in the inspector
Then the change is saved
And the grid reflects the change

Given a lens is selected
When I press Ctrl+Z
Then the last change is undone

Given a lens is selected
When I click Delete and confirm
Then the lens is removed from the grid
```

**Test:** `npx playwright test tests/e2e/bedrock-crud.spec.ts`

### AC4: Copilot Integration Works

```gherkin
Given a lens is selected
And Copilot panel is visible
When I type "set description to 'For engineers'"
And I click Apply
Then the description field updates to "For engineers"

Given a lens is selected
When I type an invalid command in Copilot
Then I see an error message
And the lens is unchanged
```

**Test:** `npx playwright test tests/e2e/bedrock-copilot.spec.ts`

### AC5: No Foundation Imports

```gherkin
Given the bedrock directory exists
When I search for imports from 'foundation'
Then I find zero matches
```

**Test:** `npm run lint` (ESLint rule)

---

## Resolved Design Decisions

These decisions are final. See LENS_WORKSHOP_REFERENCE.md for details.

| Decision | Answer | Rationale |
|----------|--------|-----------|
| API structure | REST with GroveObject envelopes | Existing server.js pattern |
| Real-time | Optimistic UI, no WebSockets | Complexity avoidance |
| Favorites | localStorage primary | Existing user-preferences.ts |
| Copilot model | Gemini (simulated) | Until local/cloud split |
| Undo/redo | Mandatory, inverse patch stack | Workshop tools need it |
| LensFilter operators | equals, contains, in, not, range, exists | Expanded for dates/numbers |

---

## Technical Constraints

1. **Clean-room implementation** — Zero imports from `src/foundation/`
2. **GroveObject schema** — All entities use GroveObjectMeta
3. **DEX compliance** — All four pillars must pass
4. **Token usage** — Use existing `--card-*` namespace
5. **API consistency** — All endpoints return GroveObject envelope

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| GroveObjectMeta type | ✅ Exists | `src/core/schema/grove-object.ts` |
| Card tokens | ✅ Exists | `--card-*` in globals.css |
| Favorites storage | ✅ Exists | `user-preferences.ts` |
| Lens API endpoints | ⚠️ Partial | Need envelope standardization |
| Gemini API | ✅ Available | For Copilot |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Pattern reusability | 80%+ | Future console uses Bedrock primitives |
| Test coverage | 90%+ | Unit tests on hooks |
| Zero Foundation imports | 0 | ESLint enforcement |
| CRUD latency | <200ms | API response time |
| Copilot accuracy | 80%+ | Valid patches generated |

---

## Out of Scope

- Multi-user collaboration
- Offline support
- Mobile-optimized layout
- Accessibility audit (future sprint)
- Internationalization

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| `LENS_WORKSHOP_REFERENCE.md` | **Canonical implementation guide** |
| `BEDROCK_SPRINT_CONTRACT.md` | Binding constraints |
| `Trellis_Architecture_Bedrock_Addendum.md` | Philosophy |
| `PROJECT_PATTERNS.md` | Pattern catalog |

---

**Proceed to ARCHITECTURE.md.**
