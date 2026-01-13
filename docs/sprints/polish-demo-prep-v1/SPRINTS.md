# SPRINTS: Polish and Demo Prep (polish-demo-prep-v1)

## Epic Overview

| Epic | Focus | Stories | Priority |
|------|-------|---------|----------|
| Epic 1 | Error Handling | US-G001, US-G002, US-G003, US-G004, US-G005 | P0/P1 |
| Epic 2 | Loading & Progress | US-G006, US-G007 | P0/P1 |
| Epic 3 | Demo Prep | US-G008, US-G009 | P0/P1 |

---

## Epic 1: Error Handling

### Attention Checkpoint
Before starting this epic, verify:
- [ ] SPEC.md Live Status shows correct phase
- [ ] Pipeline tests pass: `npm test -- --grep pipeline`
- [ ] Goal alignment: Error handling for graceful degradation

### Story 1.1: Search API Timeout Handling (US-G001)

**As a** researcher using sprout
**I want to** see a helpful message when search times out
**So that** I know what happened and can try again

**Tasks:**
1. Add `ErrorDisplay` component with timeout-specific messaging
2. Add retry callback prop to progress display
3. Map `phase: 'timeout'` to user-friendly copy
4. Add retry button that re-submits the sprout

**Acceptance Criteria:**
```gherkin
Scenario: Search API timeout displays friendly message
  Given a research sprout is executing
  When the search API times out after 90 seconds
  Then the UI displays "Research is taking longer than expected"
  And a "Try Again" button is visible
  And clicking "Try Again" re-submits the sprout
```

**Files to Touch:**
- `src/explore/components/ErrorDisplay.tsx` (CREATE)
- `src/explore/hooks/useResearchProgress.ts` (EXTEND)

---

### Story 1.2: No Results Found State (US-G002)

**As a** researcher
**I want to** see a helpful message when no evidence is found
**So that** I can refine my query

**Tasks:**
1. Detect `evidenceBundle.totalSources === 0` case
2. Add empty state UI with suggestions
3. Offer query refinement tips

**Acceptance Criteria:**
```gherkin
Scenario: No results found shows helpful message
  Given a research sprout completes
  When the evidence bundle contains zero sources
  Then the UI displays "No evidence found for this query"
  And query refinement suggestions are shown
  And a "Try Different Query" button is visible
```

**Files to Touch:**
- `src/explore/components/EmptyState.tsx` (CREATE)
- `src/explore/components/ResultsDisplay.tsx` (EXTEND)

---

### Story 1.3: Partial Evidence Handling (US-G003)

**As a** researcher
**I want to** see results even when some branches fail
**So that** I get partial value from completed research

**Tasks:**
1. Pipeline already returns partial evidence on failure
2. Add UI to show which branches succeeded/failed
3. Writer agent should work with partial evidence
4. Show warning banner about incomplete research

**Acceptance Criteria:**
```gherkin
Scenario: Partial evidence produces document with warning
  Given a research sprout with 4 branches
  When 2 branches complete and 2 branches fail
  Then the document is generated from successful branches
  And a warning banner shows "2 of 4 research branches failed"
  And the document includes only verified sources
```

**Files to Touch:**
- `src/explore/services/research-pipeline.ts` (verify existing)
- `src/explore/components/PartialResultsBanner.tsx` (CREATE)

---

### Story 1.4: Writer Timeout Handling (US-G004)

**As a** researcher
**I want to** see evidence even if document generation times out
**So that** I can still access the research findings

**Tasks:**
1. On writer timeout, display collected evidence
2. Add "View Raw Evidence" fallback
3. Offer retry for writing phase only

**Acceptance Criteria:**
```gherkin
Scenario: Writer timeout shows evidence with retry option
  Given research completed successfully
  When the writer agent times out
  Then the evidence bundle is displayed
  And a "Retry Document Generation" button is visible
  And clicking retry attempts writing again with same evidence
```

**Files to Touch:**
- `src/explore/components/EvidenceFallback.tsx` (CREATE)

---

### Story 1.5: Network Disconnection Recovery (US-G005)

**As a** researcher
**I want to** recover gracefully from network issues
**So that** I don't lose progress on long research

**Tasks:**
1. Detect network disconnection during pipeline
2. Show reconnection UI
3. Implement exponential backoff retry
4. Preserve state for resume

**Acceptance Criteria:**
```gherkin
Scenario: Network disconnection shows recovery UI
  Given a research pipeline is executing
  When network connectivity is lost
  Then the UI shows "Connection lost. Reconnecting..."
  And reconnection is attempted with exponential backoff
  And progress resumes when connection restored
```

**Files to Touch:**
- `src/explore/hooks/useNetworkStatus.ts` (CREATE)
- `src/explore/services/research-pipeline.ts` (EXTEND)

---

### Build Gate (Epic 1)
```bash
npm test -- --grep "error|timeout|network"
```

---

## Epic 2: Loading & Progress

### Attention Checkpoint
Before starting this epic, verify:
- [ ] SPEC.md Live Status shows "Epic 2"
- [ ] Epic 1 tests pass
- [ ] Goal alignment: Professional loading experience

### Story 2.1: Skeleton Loading UI (US-G006)

**As a** user
**I want to** see loading placeholders during data fetch
**So that** the UI feels responsive

**Tasks:**
1. Create skeleton component for result cards
2. Create skeleton for document preview
3. Add shimmer animation
4. Replace spinners with skeletons where appropriate

**Acceptance Criteria:**
```gherkin
Scenario: Skeleton UI during initial load
  Given the results panel is loading
  When data is being fetched
  Then skeleton placeholders animate in card positions
  And skeletons match final layout dimensions
```

**Files to Touch:**
- `src/explore/components/SkeletonCard.tsx` (CREATE)
- `src/explore/components/SkeletonDocument.tsx` (CREATE)

---

### Story 2.2: Progress Indicators Throughout (US-G007)

**As a** researcher
**I want to** see clear progress during research
**So that** I know the system is working

**Tasks:**
1. Display current phase prominently (Research → Writing → Complete)
2. Show branch-level progress (3 of 4 branches complete)
3. Add estimated time remaining
4. Animate phase transitions

**Acceptance Criteria:**
```gherkin
Scenario: Progress indicators show detailed status
  Given a research pipeline is executing
  Then the current phase is displayed prominently
  And branch completion shows "X of Y branches complete"
  And phase transitions animate smoothly
```

**Files to Touch:**
- `src/explore/components/ProgressDisplay.tsx` (EXTEND)
- `src/explore/hooks/useResearchProgress.ts` (EXTEND)

---

### Build Gate (Epic 2)
```bash
npm test -- --grep "skeleton|progress|loading"
```

---

## Epic 3: Demo Prep

### Attention Checkpoint
Before starting this epic, verify:
- [ ] SPEC.md Live Status shows "Epic 3"
- [ ] Epics 1-2 tests pass
- [ ] Goal alignment: Demo-ready deliverables

### Story 3.1: Demo Script and Recording (US-G008)

**As a** stakeholder
**I want to** see a demo video of the complete flow
**So that** I can understand the v1.0 capabilities

**Tasks:**
1. Write demo script with narration points
2. Prepare sample queries that showcase features
3. Record screen capture with voiceover
4. Edit and export final video

**Deliverables:**
- `docs/sprints/polish-demo-prep-v1/DEMO_SCRIPT.md`
- `docs/sprints/polish-demo-prep-v1/demo-video.mp4` (or link)

**Acceptance Criteria:**
```gherkin
Scenario: Demo video shows complete lifecycle
  Given the demo script is prepared
  When the video is recorded
  Then it shows: sprout command → research → writing → document
  And the total duration is under 3 minutes
  And narration explains each phase
```

---

### Story 3.2: Known Limitations Documentation (US-G009)

**As a** stakeholder
**I want to** understand v1.0 limitations
**So that** I have realistic expectations

**Tasks:**
1. Document rate limits and quotas
2. Document unsupported query types
3. Document known edge cases
4. Create FAQ for common questions

**Deliverables:**
- `docs/sprints/polish-demo-prep-v1/LIMITATIONS.md`

**Acceptance Criteria:**
```gherkin
Scenario: Limitations document is comprehensive
  Given the documentation is written
  Then it covers rate limits, quotas, and timeouts
  And it lists unsupported query types
  And it answers common stakeholder questions
```

---

### Build Gate (Epic 3)
```bash
# No code tests - documentation review
ls docs/sprints/polish-demo-prep-v1/DEMO_SCRIPT.md
ls docs/sprints/polish-demo-prep-v1/LIMITATIONS.md
```

---

## Commit Sequence

1. `feat(explore): Add error handling components (US-G001, US-G002)`
2. `feat(explore): Add partial evidence handling (US-G003)`
3. `feat(explore): Add timeout recovery (US-G004, US-G005)`
4. `feat(explore): Add skeleton loading UI (US-G006)`
5. `feat(explore): Enhance progress indicators (US-G007)`
6. `docs: Add demo script and limitations (US-G008, US-G009)`

---

## Final Build Gate

```bash
npm run build && npm test && npx playwright test
```

Expected outcome: All tests pass, no TypeScript errors, demo video recorded.
