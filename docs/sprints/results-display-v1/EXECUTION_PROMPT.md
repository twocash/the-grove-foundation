# Results Display v1 - Execution Prompt

**Copy this entire file to a new Claude CLI context window.**

---

## BINDING CONTRACT

**You are bound by the Bedrock Sprint Contract v1.2.**

Before proceeding, acknowledge these non-negotiable requirements:

### Article IX: Visual Verification Requirements
- Code that compiles is NOT proof that features work
- Screenshots are REQUIRED evidence for all UI work
- A sprint is NOT COMPLETE until visual verification passes

### Required Artifacts
| Artifact | Location | Status |
|----------|----------|--------|
| Screenshots | `docs/sprints/results-display-v1/screenshots/` | [ ] Required |
| REVIEW.html | `docs/sprints/results-display-v1/REVIEW.html` | [ ] Required |
| Playwright tests | `tests/visual-qa/results-display.spec.ts` | [ ] Required |

### Prohibited Practices
1. **Code-only completion** — BLOCKED
2. **Deferred verification** — BLOCKED
3. **"It compiles so it works"** — BLOCKED
4. **Missing REVIEW.html** — BLOCKED
5. **PENDING status at completion** — BLOCKED

### DEX Compliance (Must Pass All 4)
Every feature must answer YES to:
1. Can non-technical user modify via config?
2. What happens if model hallucinates?
3. Can every fact trace to source?
4. Can new types use this without code changes?

**Violation of this contract blocks merge.**

---

## Context

You are continuing work on **The Grove Foundation** project. Your task is to execute **Sprint 5: Results Display v1**.

**Previous sprints completed:**
- Sprint 1: Evidence Collection Engine ✅
- Sprint 2: Writer Agent Foundation ✅
- Sprint 3: Pipeline Integration v1 🚀 (in progress)
- Experience Console Cleanup v1 ✅

**This sprint:** Beautiful ResearchDocument rendering in GardenInspector.

---

## Your Mission

Execute the Results Display sprint following these phases:

### Phase 0: Pre-work (Verify Context)
1. Read the spec: `docs/sprints/results-display-v1/SPEC.md`
2. Read ResearchDocument schema: `src/core/schema/research-document.ts`
3. Read GardenInspector: `src/explore/GardenInspector.tsx`
4. Confirm you understand the document structure (position, analysis, citations)

### Phase 1: CitationBlock Component
Create `src/explore/components/CitationBlock.tsx`:
- Display citation index `[1]`
- Title linked to source URL
- Domain badge (e.g., "wikipedia.org")
- Snippet preview (truncated)
- "Accessed" timestamp
- Hover state reveals full snippet

### Phase 2: PositionCard Component
Create position statement display:
- Large, prominent quote block
- Gradient background (purple/blue)
- Rounded corners with subtle border
- Confidence score badge in corner

### Phase 3: AnalysisSection Component
Create markdown analysis renderer:
- Use existing markdown library (react-markdown or similar)
- Inline citations as superscript `[1]`, `[2]`
- Clicking citation scrolls to CitationsSection
- Proper typography (line-height, spacing)

### Phase 4: ResearchResultsView Component
Create `src/explore/components/ResearchResultsView.tsx`:
- Compose PositionCard, AnalysisSection, CitationsSection
- Handle empty/insufficient evidence state
- Copy to clipboard functionality
- "Add to Knowledge Base" button (disabled for v1)

### Phase 5: GardenInspector Integration
Modify `src/explore/GardenInspector.tsx`:
- Add new view mode: 'results'
- Show ResearchResultsView when sprout is completed
- Add back button to return to list
- Handle loading state while document loads

### Phase 6: Visual QA Testing
Create `tests/visual-qa/results-display.spec.ts`:
- Test complete document display
- Test position statement rendering
- Test citations section expand/collapse
- Test copy to clipboard
- Test insufficient evidence state
- Test mobile layout

### Phase 7: Documentation
Complete sprint docs:
- Capture all screenshots
- Create `REVIEW.html` with AC-to-evidence mapping
- Update Notion sprint status

---

## Key Files

**Create:**
- `src/explore/components/CitationBlock.tsx`
- `src/explore/components/PositionCard.tsx`
- `src/explore/components/AnalysisSection.tsx`
- `src/explore/components/CitationsSection.tsx`
- `src/explore/components/ResearchResultsView.tsx`
- `tests/visual-qa/results-display.spec.ts`
- `docs/sprints/results-display-v1/REVIEW.html`

**Modify:**
- `src/explore/GardenInspector.tsx`

**Read (don't modify unless necessary):**
- `src/core/schema/research-document.ts`
- `src/explore/services/writer-agent.ts`

---

## Acceptance Criteria

### US-E001: Display Position Statement
```gherkin
Scenario: Position statement prominently displayed
  Given I have a completed ResearchDocument
  When I view the results in GardenInspector
  Then the position statement should appear as a prominent quote block
  And it should have a gradient background
  And it should show the confidence score badge
```

### US-E002: Render Markdown Analysis
```gherkin
Scenario: Analysis renders as formatted markdown
  Given a ResearchDocument with markdown analysis
  When I view the results
  Then headings should be properly formatted
  And bullet points should render correctly
  And inline citations [1], [2] should be superscript links
```

### US-E003: Show Clickable Citations
```gherkin
Scenario: Citations are clickable and informative
  Given a document with 3 citations
  When I view the citations section
  Then I should see [1], [2], [3] listed
  And each should show title, domain, and snippet
  And clicking the title should open the source URL
  And clicking inline [1] in analysis should scroll to citation [1]
```

### US-E004: Copy Document to Clipboard
```gherkin
Scenario: Copy formats document for pasting
  Given I'm viewing a research document
  When I click "Copy to Clipboard"
  Then the document should be copied in markdown format
  And it should include position, analysis, and citations
  And I should see a success toast
```

### US-E005: Handle Insufficient Evidence
```gherkin
Scenario: Graceful handling of insufficient evidence
  Given a document with status "insufficient-evidence"
  When I view the results
  Then I should see a special empty state
  And it should explain why evidence was insufficient
  And it should suggest refining the query
```

### US-E006: Display Confidence Indicator
```gherkin
Scenario: Confidence score is visible
  Given a document with confidenceScore 0.85
  When I view the results
  Then I should see a confidence indicator
  And it should show "High Confidence" or similar
  And color should reflect score (green for high, yellow for medium)
```

### US-E007: Mobile Responsive Layout
```gherkin
Scenario: Results display on mobile
  Given a viewport width of 375px
  When I view a research document
  Then all content should be readable
  And citations should stack vertically
  And copy button should be accessible
```

---

## Design Reference

### Color Palette
- Position card gradient: `from-purple-50 to-blue-50` (light) / `from-purple-900/20 to-blue-900/20` (dark)
- High confidence: `green-500`
- Medium confidence: `yellow-500`
- Low confidence: `red-500`
- Citation badge: `slate-100` / `slate-800`

### Typography
- Position: `text-lg font-medium leading-relaxed`
- Analysis: `text-sm leading-7 prose prose-slate`
- Citation title: `text-sm font-medium hover:underline`
- Citation snippet: `text-xs text-slate-500 line-clamp-2`

### Spacing
- Section gaps: `space-y-6`
- Card padding: `p-4` or `p-6`
- Citation list: `space-y-3`

---

## Bedrock Verification

**Before starting:**
- [ ] On `main` or feature branch
- [ ] No imports from `src/foundation/`
- [ ] ResearchDocument schema understood

**After each phase:**
- [ ] Component renders correctly
- [ ] TypeScript compiles without errors
- [ ] Visual appearance matches design

**Final verification (Article IX):**
- [ ] All screenshots captured in `screenshots/` directory
- [ ] REVIEW.html shows each AC mapped to evidence
- [ ] All AC status badges are PASS (not PENDING)
- [ ] Playwright visual QA tests pass
- [ ] `npm run build` passes
- [ ] Sign-off recorded with timestamp

---

## Important Notes

1. **Keep LLM placeholders** — Don't wire real LLM calls. Display is the goal.

2. **Use mock data** — Create a mock ResearchDocument for development/testing.

3. **Mobile-first** — Build responsive from the start, not as afterthought.

4. **Citation scroll** — Use `scrollIntoView` with smooth behavior for citation clicks.

5. **Copy format** — When copying, format as clean markdown suitable for pasting into docs.

6. **Update Notion** — When complete, update Sprint Execution Tracker status.

---

## Sprint Contract

- **Codename:** results-display-v1
- **Branch:** Create `feature/results-display-v1` if needed
- **Commit style:** `feat(explore): Results Display v1 - [description]`

---

## Start Command

```bash
cd C:\GitHub\the-grove-foundation
```

Then read the SPEC.md and begin Phase 0.

**Remember: Visual verification is MANDATORY. No exceptions.**

Good luck!
