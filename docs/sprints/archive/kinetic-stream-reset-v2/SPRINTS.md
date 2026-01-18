# Sprint Breakdown: Kinetic Stream Reset v2

**Sprint:** kinetic-stream-reset-v2
**Date:** December 28, 2025

---

## Scope Adjustment

Per REPO_AUDIT.md, the original 3-week/3-sprint plan is **compressed** to a single focused sprint. Most infrastructure already exists.

| Original Plan | Revised Plan | Rationale |
|---------------|--------------|-----------|
| Sprint 1: Schema + Machine + Parsers | Epic 1: Schema & Parser | Machine mostly done |
| Sprint 2: Polymorphic Renderer | N/A | Already complete |
| Sprint 3: Glass Experience | Epic 2: Components & Polish | Glass system exists |

---

## Epic 1: Schema & Parser Foundation

**Goal:** Enhanced types and navigation extraction.

### Story 1.1: Discriminated Union Types

**Files:**
- `src/core/schema/stream.ts`

**Tasks:**
1. Define `QueryStreamItem` interface
2. Define `ResponseStreamItem` interface
3. Define `NavigationStreamItem` interface
4. Define `SystemStreamItem` interface
5. Create `StreamItem` union type
6. Add `JourneyFork` and `JourneyForkType`
7. Add `PivotContext` interface
8. Enhance type guards with proper narrowing
9. Ensure backward compatibility with existing `fromChatMessage`

**Acceptance Criteria:**
- [ ] All type guards narrow correctly in switch statements
- [ ] Existing code compiles without changes
- [ ] Unit tests pass for type guards

**Estimate:** 2 hours

---

### Story 1.2: Navigation Parser

**Files:**
- `src/core/transformers/NavigationParser.ts` (NEW)

**Tasks:**
1. Create NavigationParser.ts file
2. Implement `parseNavigation()` function
3. Implement JSON block extraction
4. Implement structured text fallback
5. Implement `inferForkType()` for missing types
6. Implement `normalizeFork()` for field defaults
7. Write unit tests

**Acceptance Criteria:**
- [ ] Extracts JSON `<navigation>` blocks
- [ ] Handles structured text format (`→ Label`)
- [ ] Returns clean content without navigation block
- [ ] Infers fork types from label text
- [ ] All unit tests pass

**Estimate:** 2 hours

---

### Story 1.3: Machine Event Integration

**Files:**
- `src/core/engagement/types.ts`
- `src/core/engagement/machine.ts`

**Tasks:**
1. Add `USER.CLICK_PIVOT` event type
2. Add `USER.SELECT_FORK` event type
3. Implement `handlePivotClick` action
4. Implement `handleForkSelect` action
5. Add event handlers to machine `on` block
6. Integrate NavigationParser in `finalizeResponse`
7. Write integration tests

**Acceptance Criteria:**
- [ ] Pivot click creates query with PivotContext
- [ ] Fork select creates query with fork payload
- [ ] Navigation array populated on response items
- [ ] Integration tests pass

**Estimate:** 2 hours

---

## Epic 2: Component Enhancement

**Goal:** Visual fork system and interaction handlers.

### Story 2.1: NavigationBlock Rewrite

**Files:**
- `components/Terminal/Stream/blocks/NavigationBlock.tsx`

**Tasks:**
1. Create `ForkButton` component
2. Add fork type icons (↓ → ✓)
3. Implement fork grouping by type
4. Change props from `item` to `forks: JourneyFork[]`
5. Add `onSelect` callback prop
6. Apply CSS variant classes
7. Write component tests

**Acceptance Criteria:**
- [ ] Renders forks grouped by type (deep_dive first)
- [ ] Each fork shows correct icon
- [ ] Click calls onSelect with fork object
- [ ] Empty forks returns null
- [ ] Visual hierarchy visible (primary/secondary/tertiary)

**Estimate:** 2 hours

---

### Story 2.2: ResponseBlock Enhancement

**Files:**
- `components/Terminal/Stream/blocks/ResponseBlock.tsx`

**Tasks:**
1. Add `onForkSelect` prop
2. Import `hasNavigation` type guard
3. Add inline NavigationBlock mount point
4. Pass `item.navigation` to NavigationBlock
5. Ensure NavigationBlock only shows when not streaming
6. Update component tests

**Acceptance Criteria:**
- [ ] Navigation appears after response content
- [ ] Navigation hidden during streaming
- [ ] Fork clicks propagate to parent
- [ ] Existing `suggestedPaths` still works (legacy)

**Estimate:** 1 hour

---

### Story 2.3: StreamRenderer Wiring

**Files:**
- `components/Terminal/Stream/StreamRenderer.tsx`
- `components/Terminal/TerminalChat.tsx`

**Tasks:**
1. Add `onForkSelect` prop to StreamRenderer
2. Update `onSpanClick` to include responseId
3. Pass props through StreamBlock switch
4. Update TerminalChat handlers
5. Verify event flow end-to-end

**Acceptance Criteria:**
- [ ] Fork select events reach TerminalChat
- [ ] Span click includes source response ID
- [ ] No console errors on interaction

**Estimate:** 1 hour

---

### Story 2.4: CSS Token Addition

**Files:**
- `styles/globals.css`

**Tasks:**
1. Add `--fork-*` custom properties
2. Add `.fork-button` base class
3. Add variant classes (primary/secondary/tertiary)
4. Add hover states
5. Test in browser

**Acceptance Criteria:**
- [ ] Primary buttons use clay/orange theme
- [ ] Secondary buttons use subtle glass
- [ ] Tertiary buttons are ghost style
- [ ] Hover states work correctly

**Estimate:** 30 minutes

---

## Epic 3: Testing & Validation

**Goal:** Comprehensive test coverage.

### Story 3.1: Unit Test Suite

**Files:**
- `tests/unit/stream-schema.test.ts`
- `tests/unit/navigation-parser.test.ts`
- `tests/unit/rhetorical-parser.test.ts` (regression)

**Tasks:**
1. Write type guard tests
2. Write NavigationParser tests
3. Verify RhetoricalParser still works
4. Run coverage report

**Acceptance Criteria:**
- [ ] All unit tests pass
- [ ] >80% coverage on new code

**Estimate:** 1 hour

---

### Story 3.2: Integration Tests

**Files:**
- `tests/integration/stream-machine.test.ts`
- `tests/integration/navigation-block.test.tsx`

**Tasks:**
1. Write machine event tests
2. Write NavigationBlock render tests
3. Test fork click propagation

**Acceptance Criteria:**
- [ ] All integration tests pass
- [ ] Event handlers work correctly

**Estimate:** 1 hour

---

### Story 3.3: E2E Validation

**Files:**
- `tests/e2e/kinetic-stream.spec.ts`

**Tasks:**
1. Test query submission flow
2. Test concept span visibility
3. Test pivot click behavior
4. Test fork rendering (conditional)
5. Test fork click behavior

**Acceptance Criteria:**
- [ ] All E2E tests pass (or skip gracefully)
- [ ] Manual smoke test successful

**Estimate:** 1 hour

---

## Sprint Summary

| Epic | Stories | Total Estimate |
|------|---------|----------------|
| Epic 1: Schema & Parser | 3 | 6 hours |
| Epic 2: Components | 4 | 4.5 hours |
| Epic 3: Testing | 3 | 3 hours |
| **Total** | **10** | **13.5 hours** |

---

## Story Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                         EPIC 1                                   │
│                                                                  │
│    ┌──────────────┐                                             │
│    │ Story 1.1    │                                             │
│    │ Types        │──────┬─────────────────┐                    │
│    └──────────────┘      │                 │                    │
│           │              │                 │                    │
│           ▼              ▼                 ▼                    │
│    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│    │ Story 1.2    │ │ Story 1.3    │ │ Story 2.1    │          │
│    │ Parser       │ │ Machine      │ │ NavBlock     │          │
│    └──────────────┘ └──────────────┘ └──────────────┘          │
│           │              │                 │                    │
│           └──────────────┼─────────────────┘                    │
│                          │                                       │
│                          ▼                                       │
│                   ┌──────────────┐                              │
│                   │ Story 2.2    │                              │
│                   │ ResponseBlk  │                              │
│                   └──────────────┘                              │
│                          │                                       │
│                          ▼                                       │
│                   ┌──────────────┐                              │
│                   │ Story 2.3    │                              │
│                   │ Wiring       │                              │
│                   └──────────────┘                              │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         EPIC 3                                   │
│                                                                  │
│    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│    │ Story 3.1    │ │ Story 3.2    │ │ Story 3.3    │          │
│    │ Unit Tests   │ │ Integration  │ │ E2E          │          │
│    └──────────────┘ └──────────────┘ └──────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Story 2.4 (CSS) can run in parallel with Story 2.1
```

---

## Build Gates

After each story, run:

```bash
# Type check
npx tsc --noEmit

# Unit tests for affected files
npm test -- --testPathPattern="<pattern>"

# Full build
npm run build
```

After Epic 2 complete:

```bash
# All tests
npm test

# E2E
npx playwright test
```

---

## Definition of Done

Each story is done when:

1. [ ] Code compiles without errors
2. [ ] Tests pass (unit/integration as applicable)
3. [ ] No console errors in browser
4. [ ] Code reviewed (self-review for solo work)
5. [ ] Commits follow conventional format

Sprint is done when:

1. [ ] All stories complete
2. [ ] All tests pass (npm test + playwright)
3. [ ] Build succeeds (npm run build)
4. [ ] Manual smoke test passed
5. [ ] EXECUTION_PROMPT.md complete

---

*Sprint breakdown complete. Proceed to EXECUTION_PROMPT.md.*
