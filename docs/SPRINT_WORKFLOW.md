# Sprint Workflow: Sequential Handoff System

**Date:** 2026-01-16
**Purpose:** Clean sequential handoffs with clear ownership at each stage

---

## The Workflow

### Stage 1: Sprintmaster - Spec v1
**Owner:** Sprintmaster
**Deliverable:** Initial sprint specification
**Duration:** 1 day
**Output:** `SPEC_v1.md`

**Contents:**
- Sprint overview and goals
- Key deliverables
- Dependencies
- Success criteria
- Initial architecture thoughts

**Handoff to:** Product Manager

---

### Stage 2: Product Manager - Requirements Definition
**Owner:** Product Manager
**Deliverable:** Detailed requirements
**Duration:** 1-2 days
**Output:** `REQUIREMENTS.md`

**Contents:**
- User stories
- Acceptance criteria
- Business logic
- Data requirements
- Integration points

**Handoff to:** Designer

---

### Stage 3: Designer - UI/UX Input
**Owner:** Designer
**Deliverable:** Design specifications
**Duration:** 2-3 days
**Output:** `DESIGN_SPEC.md`

**Contents:**
- Wireframes
- Component specifications
- Interaction patterns
- Design system alignment
- Accessibility considerations

**Handoff to:** UI Chief

---

### Stage 4: UI Chief - Interface Review
**Owner:** UI Chief
**Deliverable:** Interface approval
**Duration:** 1 day
**Output:** `UI_REVIEW.md`

**Contents:**
- Interface validation
- Design system compliance
- Component patterns
- Consistency checks
- Revision requests (if needed)

**Handoff to:** UX Chief

---

### Stage 5: UX Chief - Strategic Analysis
**Owner:** UX Chief
**Deliverable:** Strategic feedback & vision alignment
**Duration:** 1 day
**Output:** `UX_STRATEGIC_REVIEW.md`

**Contents:**
- DEX compliance verification
- Vision alignment
- Strategic recommendations
- Architecture guidance
- Risk assessment

**Feedback to:** Product Manager

---

### Stage 6: Product Manager - Sprint Prep
**Owner:** Product Manager
**Deliverable:** User stories + Execution contract
**Duration:** 1-2 days
**Output:** `USER_STORIES.md` + `GROVE_EXECUTION_CONTRACT.md`

**Contents:**
- Gherkin acceptance criteria
- Test specifications
- Build gates
- Execution plan
- Handoff documentation

**Handoff to:** Notion

---

### Stage 7: Notion Posting
**Owner:** Product Manager
**Deliverable:** Notion entry ready for copy-paste
**Duration:** 30 minutes
**Output:** `NOTION_ENTRY.md`

**Contents:**
- **MANDATORY:** Developer execution prompt at TOP in formatted code block
- Pre-formatted Notion page content
- All artifacts linked
- Status: "🎯 ready"
- Developer handoff instructions

**Requirements:**
- Execution prompt MUST be at the very top in a code block
- Format: Pre-formatted with clear copy-paste instructions
- Include: Sprint name, responsibilities, execution path, status update location
- See S8-SL-MultiModel example for correct format

**Deliverable:** User can copy-paste into Notion when ready

---

## Total Timeline

**Duration:** 6-8 days
**Parallel Work Possible:** Yes (Stages 1-3 can start immediately)

---

## Handoff Checklist

### Sprintmaster → Product Manager
- [ ] SPEC_v1.md complete
- [ ] Goals clearly defined
- [ ] Dependencies identified
- [ ] Questions documented

### Product Manager → Designer
- [ ] REQUIREMENTS.md complete
- [ ] User stories written
- [ ] Acceptance criteria defined
- [ ] Integration points clear

### Designer → UI Chief
- [ ] DESIGN_SPEC.md complete
- [ ] Wireframes created
- [ ] Components specified
- [ ] Design system checked

### UI Chief → UX Chief
- [ ] UI_REVIEW.md complete
- [ ] Interface validated
- [ ] Patterns approved
- [ ] Consistency verified

### UX Chief → Product Manager
- [ ] UX_STRATEGIC_REVIEW.md complete
- [ ] DEX compliance verified
- [ ] Vision alignment confirmed
- [ ] Strategic recommendations provided

### Product Manager → Notion
- [ ] USER_STORIES.md complete
- [ ] GROVE_EXECUTION_CONTRACT.md complete
- [ ] NOTION_ENTRY.md formatted
- [ ] **MANDATORY:** Developer execution prompt at TOP in code block
- [ ] All artifacts linked

---

## Template Files

### SPEC_v1.md Template

```markdown
# Sprint: {Sprint Name}

## Overview
**Sprint:** {name}
**EPIC Phase:** {phase}
**Effort:** {size}
**Dependencies:** {list}

## Goals
{3-5 bullet points}

## Key Deliverables
{List of deliverables}

## Success Criteria
{How we know it's done}

## Initial Architecture
{Thoughts on approach}

## Open Questions
{What we need to figure out}
```

### REQUIREMENTS.md Template

```markdown
# Requirements: {Sprint Name}

## User Stories
{List in Gherkin format}

## Acceptance Criteria
{Testable criteria}

## Business Logic
{How it works}

## Data Requirements
{What data is needed}

## Integration Points
{What it connects to}

## Constraints
{What we can't change}

## Assumptions
{What we're assuming}
```

### DESIGN_SPEC.md Template

```markdown
# Design Specification: {Sprint Name}

## Wireframes
{Screenshots or links}

## Component Specifications
{List of components}

## json-render Components (if applicable)
**Required for:** Analytics dashboards, status displays, read-only information UIs

### Catalog Components
| Component | Props | Purpose |
|-----------|-------|---------|
| {ComponentName} | {prop list} | {what it displays} |

### Render Tree Structure
```
root
├── HeaderComponent (title, subtitle)
├── MetricRow (metrics[])
│   ├── MetricCard (label, value, color)
│   └── MetricCard (label, value, color)
└── StatusSection (status, timestamp)
```

### Reused from Existing Catalogs
- [ ] SignalsCatalog: MetricCard, MetricRow, QualityGauge
- [ ] ResearchCatalog: ResearchHeader, AnalysisBlock
- [ ] JobStatusCatalog: JobPhaseIndicator, JobProgressBar

### New Components Required
{List any new catalog components needed}

## Factory Pattern Compliance (if building console/object UI)

### GroveObject Compliance
- [ ] Object follows meta+payload structure
- [ ] Meta includes: id, type, title, status, timestamps
- [ ] Status uses standard values: active, draft, archived, pending

### Console Factory Compliance
- [ ] Layout follows standard: Header → Metrics → Toolbar → Collection → Inspector
- [ ] Cards implement ObjectCardProps (selected, isFavorite, onClick, onFavoriteToggle)
- [ ] Editor implements ObjectEditorProps (object, onEdit, hasChanges, singletonOps)
- [ ] Metrics use MetricCard/MetricRow patterns

### Cross-Screen Consistency
- [ ] Card shows: icon, title, status badge, truncated description
- [ ] Editor has: title field, description field, status actions
- [ ] Inspector panel matches existing consoles
- [ ] Toolbar follows: Search | Filters | Favorites | Sort | View Mode

## Interaction Patterns
{How users interact}

## Design System
{What we're using}

## Accessibility
{A11y considerations}

## States
{Loading, error, empty, etc.}
```

### UI_REVIEW.md Template

```markdown
# UI Review: {Sprint Name}

## Interface Validation
{Does it meet requirements?}

## Design System Compliance
{Is it consistent?}

## Component Patterns
{Are we reusing correctly?}

## Consistency Checks
{Everything aligned?}

## Revisions Needed
{What needs fixing}

## Approval
✅ APPROVED / ❌ CHANGES REQUIRED
```

### UX_STRATEGIC_REVIEW.md Template

```markdown
# UX Strategic Review: {Sprint Name}

## DEX Compliance
- [ ] Declarative Sovereignty
- [ ] Capability Agnosticism
- [ ] Provenance as Infrastructure
- [ ] Organic Scalability

## Vision Alignment
{Does this align with Grove vision?}

## Strategic Recommendations
{What should we change?}

## Architecture Guidance
{Any technical guidance?}

## Risk Assessment
{What could go wrong?}

## Final Decision
✅ APPROVED / ❌ REVISIONS REQUIRED
```

### USER_STORIES.md Template

```markdown
# User Stories & E2E Tests: {Sprint Name}

## Story Format
```
Given-When-Then (Gherkin)
```

## Test Coverage
- Unit tests
- Integration tests
- E2E tests with visual verification (MANDATORY)
- Visual regression tests

## E2E Test Specification (MANDATORY)

Every user story MUST include:

1. **Playwright Test Skeleton**
   - Test file path: `tests/e2e/{sprint-name}/{epic}.spec.ts`
   - Test for happy path, empty state, error state

2. **Visual Verification Points**
   | State | Screenshot | Description |
   |-------|------------|-------------|
   | Initial | `{feature}-initial.png` | First render |
   | Populated | `{feature}-populated.png` | With data |
   | Empty | `{feature}-empty.png` | No data |
   | Error | `{feature}-error.png` | Error state |

3. **Test Data Seeding (MANDATORY)**

   **CRITICAL:** Seed localStorage with realistic, non-zero values BEFORE navigating.

   | Data Type | localStorage Key | Example Values |
   |-----------|------------------|----------------|
   | Tokens | `grove-token-balance` | `{ balance: 125, pending: 15 }` |
   | Tier | `grove-user-tier` | `{ current: 'developing', progress: 0.67 }` |
   | Badges | `grove-badges` | `[{ id: 'early-adopter', earnedAt: '2026-01-10' }]` |
   | Streak | `grove-streak-data` | `{ current: 7, longest: 14 }` |
   | Metrics | `grove-engagement-state` | `{ exchanges: 42, reveals: 8 }` |

   **Setup Pattern:**
   ```typescript
   test.beforeEach(async ({ page }) => {
     await page.addInitScript(() => {
       localStorage.setItem('grove-token-balance', JSON.stringify({ balance: 125 }));
       localStorage.setItem('grove-user-tier', JSON.stringify({ current: 'developing' }));
     });
   });
   ```

   **Rules:**
   - NO zeros or empty arrays (unless testing empty state)
   - Use realistic values (not round numbers like 100, 1000)
   - Include multiple items in lists (2-3 badges, not 1)
   - Show mid-journey progression (67%, not 0% or 100%)

4. **Test Data Requirements**
   | Test | Data Needed | Setup Method |
   |------|-------------|--------------|
   | Happy path | Seeded localStorage | beforeEach hook |
   | Empty state | Cleared localStorage | Clear before test |

## Screenshots Are EVIDENCE

⚠️ **Screenshots must prove the feature works.** Ask: "Could this be taken without the feature existing?"

| ❌ INVALID | ✅ VALID |
|------------|----------|
| Generic page load | Dashboard showing "125 tokens", "developing tier" |
| Empty state | Attribution chain: Grove-A → Grove-B with 60%/40% |
| Navigation screenshot | BEFORE (100) and AFTER (150) token screenshots |

## Acceptance Criteria
{Detailed criteria per story in Gherkin format}
```

### GROVE_EXECUTION_CONTRACT.md Template

```markdown
# Grove Execution Contract: {Sprint Name}

## Handoff Summary
{What we're delivering}

## Build Gates
```bash
npm run build && npm test && npx playwright test
```

## QA Gates (Mandatory)

### Gate 1: Pre-Development
- [ ] Baseline tests pass
- [ ] Console clean (zero errors)
- [ ] Baseline screenshots verified

### Gate 2: Mid-Sprint (Daily)
- [ ] Changed components tested
- [ ] Console clean after changes
- [ ] Core user journey verified

### Gate 3: Pre-Merge (Epic Complete)
- [ ] All tests green
- [ ] Console audit: ZERO errors
- [ ] Error boundary testing complete
- [ ] Network monitoring: All requests successful
- [ ] Full user journey passes
- [ ] Performance within thresholds

### Gate 4: Sprint Complete
- [ ] All QA gates passed
- [ ] Cross-browser testing (Chrome, mobile)
- [ ] Accessibility audit (keyboard nav)
- [ ] Visual regression tests pass (Playwright screenshots)
- [ ] E2E tests with visual verification pass
- [ ] All screenshot baselines captured and verified
- [ ] Performance check (Lighthouse > 90)

## Console Error Policy
**ZERO TOLERANCE** - Any console errors/warnings = QA failure

Critical errors:
- Error, TypeError, ReferenceError
- Network request failures
- React component crashes

## Key Files to Modify
{List of files}

## Verification Steps
1. Complete Gate 2 after each epic
2. Complete Gate 3 before merging
3. Complete Gate 4 before sprint complete
4. Document all QA results in DEVLOG.md

## Rollback Plan
{How to undo if needed}

## Attention Anchor
**We are building:** {one sentence}
**Success looks like:** {primary criterion}
**We are NOT:** {non-goals}

## QA Documentation
See:
- `docs/QA_STANDARDS.md` - Full QA protocol
- `docs/QA_CHECKLIST.md` - Quick reference
```

### NOTION_ENTRY.md Template

```markdown
<code>
🚀 DEVELOPER HANDOFF PROMPT

Copy and paste this into a new terminal for the developer:

---
You are acting as DEVELOPER for sprint: {Sprint Name}.

Your responsibilities:
- Execute sprint phases per EXECUTION_PROMPT
- Implement code changes per specification
- Write status updates to .agent/status/current/
- Capture screenshots for visual verification
- Complete REVIEW.html with acceptance criteria evidence
- Run tests and fix failures

Execute per: docs/sprints/{sprint-folder}/GROVE_EXECUTION_CONTRACT.md
Write status to: .agent/status/current/{NNN}-{timestamp}-developer.md
Template: .agent/status/ENTRY_TEMPLATE.md
Reference: .agent/roles/developer.md

On completion: Write COMPLETE entry with test results.
You do NOT update Notion directly - Sprintmaster handles that.
---
</code>

# {Sprint Name}: {Title}

## Sprint Status
**Status:** 🎯 ready
**Planning Complete:** {date}
**Artifacts:** {list}
**Phase:** Ready for Developer Handoff

## Goal
{2-3 sentences}

## Scope
{What we're doing}

## Value
{Why it matters}

## Dependencies
{What we need}

## Key Deliverables
- [ ] {deliverable 1}
- [ ] {deliverable 2}

## Acceptance Criteria
- [ ] {criterion 1}
- [ ] {criterion 2}

## Implementation Plan
1. {step 1}
2. {step 2}

## Artifacts
- [SPEC_v1.md](docs/sprints/{sprint-folder}/SPEC_v1.md)
- [REQUIREMENTS.md](docs/sprints/{sprint-folder}/REQUIREMENTS.md)
- [DESIGN_SPEC.md](docs/sprints/{sprint-folder}/DESIGN_SPEC.md)
- [UI_REVIEW.md](docs/sprints/{sprint-folder}/UI_REVIEW.md)
- [UX_STRATEGIC_REVIEW.md](docs/sprints/{sprint-folder}/UX_STRATEGIC_REVIEW.md)
- [USER_STORIES.md](docs/sprints/{sprint-folder}/USER_STORIES.md)
- [GROVE_EXECUTION_CONTRACT.md](docs/sprints/{sprint-folder}/GROVE_EXECUTION_CONTRACT.md)

## Next Steps
1. Assign developer
2. Begin execution
3. Track in DEVLOG.md

## Notes
{Any additional info}
```

---

## Workflow Example

### EPIC4-SL-MultiModel

**Day 1:** Sprintmaster creates SPEC_v1.md
**Day 2-3:** Product Manager defines requirements
**Day 4-6:** Designer creates wireframes and specs
**Day 7:** UI Chief reviews interface
**Day 8:** UX Chief strategic review
**Day 9-10:** Product Manager finalizes stories + contract
**Day 11:** Notion entry ready for copy-paste

**Total:** 11 days from spec to ready-to-execute

---

## Advantages of This System

1. **Clear Ownership** - Each stage has a specific owner
2. **Handoff Clarity** - Checklists ensure nothing is missed
3. **Quality Gates** - Each stage reviews the previous stage's work
4. **Sequential Flow** - Easy to understand and track
5. **Notion Integration** - Final output ready to copy-paste
6. **Template-Driven** - Consistent artifacts at each stage
7. **Time-Boxed** - Clear duration expectations
8. **User-Friendly** - Developer gets complete package

---

## Integration with Sprint Pipeline

This workflow produces **"Ready for Execution"** sprints for our pipeline:

```
Sequential Handoff Workflow
         ↓
Stage 7: NOTION_ENTRY.md
         ↓
Notion Database: Status = 🎯 ready
         ↓
Sprint Pipeline: Track 3 (Ready)
         ↓
Developer Assignment
         ↓
Sprint Pipeline: Track 1 (Execution)
```

---

## Example: Copy-Paste to Notion

User gets this in NOTION_ENTRY.md:

```markdown
# EPIC4-SL-MultiModel: Custom Lifecycle Models

## Sprint Status
**Status:** 🎯 ready
**Planning Complete:** 2026-01-16
**Artifacts:** 8 files

[... full content ...]
```

User copies, pastes into Notion, assigns developer, done! ✅

---

## Summary

**This workflow eliminates:**
- Confusion about what stage we're in
- Missing handoffs
- Incomplete artifacts
- Developer questions during execution

**This workflow provides:**
- Clear sequential stages
- Quality gates at each step
- Complete handoff packages
- Ready-to-execute sprints
- Notion copy-paste convenience

---

---

## Stage 8: Status Sync (NEW - 2026-01-18)

**Owner:** Developer / Sprintmaster
**Trigger:** Any Notion status change
**Duration:** 5 minutes
**Output:** Updated `STATUS.md`

**When to Sync:**
- Sprint moves to 🚀 in-progress
- Sprint moves to ✅ complete
- Sprint moves to 📦 archived
- Any blocking issue occurs

**Actions:**
1. Update local `STATUS.md` with new status and date
2. Update Notion page content if it differs from database property
3. Add completion notes (PR number, key achievements)
4. Update DEVLOG.md with milestone entry

**STATUS.md Template:**
```markdown
# Sprint Status: {Sprint Name}

## Current Status
**Status:** {emoji} {status}
**Last Synced:** {ISO date}
**Notion Page:** {URL}

## Timeline
| Stage | Date | Notes |
|-------|------|-------|
| Created | {date} | {notes} |
| Ready | {date} | {notes} |
| In Progress | {date} | {notes} |
| Complete | {date} | {notes} |

## Completion Summary (if complete)
- **PR:** #{number} merged to {branch}
- **Key Achievements:** {list}
```

**Why This Matters:**
- Local visibility without Notion query
- Git history of state changes
- Prevents working on wrong sprints
- Audit trail for project management

---

**Document Owner:** Product Manager
**Review Frequency:** After each sprint
**Last Updated:** 2026-01-18T10:00:00Z
