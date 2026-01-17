# Workflow Quick Start Guide

**Date:** 2026-01-16
**Purpose:** How to run the sequential handoff workflow

---

## Quick Reference

### The 7-Stage Workflow

```
1. Sprintmaster     → SPEC_v1.md
        ↓
2. Product Manager → REQUIREMENTS.md
        ↓
3. Designer        → DESIGN_SPEC.md
        ↓
4. UI Chief       → UI_REVIEW.md
        ↓
5. UX Chief       → UX_STRATEGIC_REVIEW.md
        ↓
6. Product Manager → USER_STORIES.md + GROVE_EXECUTION_CONTRACT.md
        ↓
7. Product Manager → NOTION_ENTRY.md (copy-paste ready!)
```

**Timeline:** 6-8 days
**Parallel:** Stages 1-3 can start immediately

---

## How to Run a Sprint Through This Workflow

### Step 1: Identify Sprint
Decide which sprint to run through workflow:
- Next in EPIC sequence
- Dependencies resolved
- Team capacity available

**Example:** EPIC4-SL-MultiModel

---

### Step 2: Stage 1 - Sprintmaster Creates SPEC_v1
**Owner:** Sprintmaster
**Duration:** 1 day

**Actions:**
1. Read EPIC context
2. Review previous sprint handoffs
3. Create SPEC_v1.md using template
4. Document initial goals and scope
5. Identify dependencies
6. Prepare questions for Product Manager

**Output:** `docs/sprints/{sprint}/SPEC_v1.md`

**Handoff:** Email SPEC_v1.md to Product Manager

---

### Step 3: Stage 2 - Product Manager Defines Requirements
**Owner:** Product Manager
**Duration:** 1-2 days

**Actions:**
1. Read SPEC_v1.md
2. Write user stories in Gherkin format
3. Define acceptance criteria
4. Document business logic
5. Specify data requirements
6. Identify integration points

**Output:** `docs/sprints/{sprint}/REQUIREMENTS.md`

**Handoff:** Email REQUIREMENTS.md to Designer

---

### Step 4: Stage 3 - Designer Creates Design Spec
**Owner:** Designer
**Duration:** 2-3 days

**Actions:**
1. Read REQUIREMENTS.md
2. Create wireframes (Figma or sketch)
3. Specify components
4. Define interaction patterns
5. Check design system alignment
6. Document accessibility considerations

**Output:** `docs/sprints/{sprint}/DESIGN_SPEC.md`

**Handoff:** Email DESIGN_SPEC.md to UI Chief

---

### Step 5: Stage 4 - UI Chief Reviews Interface
**Owner:** UI Chief
**Duration:** 1 day

**Actions:**
1. Read DESIGN_SPEC.md
2. Review wireframes
3. Validate interface against requirements
4. Check design system compliance
5. Verify component patterns
6. Ensure consistency

**Output:** `docs/sprints/{sprint}/UI_REVIEW.md`

**Handoff:** Email UI_REVIEW.md to UX Chief

---

### Step 6: Stage 5 - UX Chief Strategic Review
**Owner:** UX Chief
**Duration:** 1 day

**Actions:**
1. Read UI_REVIEW.md + all previous artifacts
2. Verify DEX compliance (4 pillars)
3. Check vision alignment
4. Provide strategic recommendations
5. Architecture guidance
6. Risk assessment

**Output:** `docs/sprints/{sprint}/UX_STRATEGIC_REVIEW.md`

**Feedback:** Email UX_STRATEGIC_REVIEW.md to Product Manager

---

### Step 7: Stage 6 - Product Manager Sprint Prep
**Owner:** Product Manager
**Duration:** 1-2 days

**Actions:**
1. Read UX_STRATEGIC_REVIEW.md
2. Incorporate feedback into user stories
3. Finalize Gherkin acceptance criteria
4. Create test specifications
5. Define build gates
6. Write GROVE_EXECUTION_CONTRACT.md

**Output:**
- `docs/sprints/{sprint}/USER_STORIES.md`
- `docs/sprints/{sprint}/GROVE_EXECUTION_CONTRACT.md`

**Handoff:** Prepare NOTION_ENTRY.md

---

### Step 8: Stage 7 - Create Notion Entry
**Owner:** Product Manager
**Duration:** 30 minutes

**Actions:**
1. Compile all artifacts
2. Create NOTION_ENTRY.md using template
3. Pre-format for Notion
4. Include all links
5. Set status to "🎯 ready"

**Output:** `docs/sprints/{sprint}/NOTION_ENTRY.md`

**Deliverable:** User copies content and pastes into Notion

---

## Example: Running EPIC4 Through Workflow

### Day 1 (Today): Stage 1
**Sprintmaster creates SPEC_v1.md**

### Day 2-3: Stage 2
**Product Manager writes REQUIREMENTS.md**

### Day 4-6: Stage 3
**Designer creates DESIGN_SPEC.md**

### Day 7: Stage 4
**UI Chief reviews interface**

### Day 8: Stage 5
**UX Chief strategic review**

### Day 9-10: Stage 6
**Product Manager sprint prep**

### Day 11: Stage 7
**Create NOTION_ENTRY.md**

**Result:** Complete sprint package ready for Notion and developer assignment!

---

## Handoff Email Templates

### Template 1: Sprintmaster → Product Manager

```
Subject: Sprint Workflow - Stage 1 Complete: SPEC_v1.md

Hi Product Manager,

SPEC_v1.md for EPIC4-SL-MultiModel is ready for your review.

File: docs/sprints/epic4-multimodel-v1/SPEC_v1.md

Key points:
- Multi-model lifecycle support
- A/B testing framework
- 6 major deliverables

Please review and proceed to Stage 2: Requirements Definition.

Thanks!
Sprintmaster
```

### Template 2: Product Manager → Designer

```
Subject: Sprint Workflow - Stage 2 Complete: REQUIREMENTS.md

Hi Designer,

REQUIREMENTS.md for EPIC4-SL-MultiModel is ready for your review.

File: docs/sprints/epic4-multimodel-v1/REQUIREMENTS.md

Key points:
- 12 user stories defined
- Gherkin acceptance criteria
- Integration with S7 AutoAdvancement

Please review and proceed to Stage 3: Design Specification.

Thanks!
Product Manager
```

### Template 3: Designer → UI Chief

```
Subject: Sprint Workflow - Stage 3 Complete: DESIGN_SPEC.md

Hi UI Chief,

DESIGN_SPEC.md for EPIC4-SL-MultiModel is ready for your review.

File: docs/sprints/epic4-multimodel-v1/DESIGN_SPEC.md

Key points:
- ModelCard and ModelEditor wireframes
- ExperienceConsole integration
- Analytics dashboard design

Please review and proceed to Stage 4: UI Review.

Thanks!
Designer
```

### Template 4: UI Chief → UX Chief

```
Subject: Sprint Workflow - Stage 4 Complete: UI_REVIEW.md

Hi UX Chief,

UI_REVIEW.md for EPIC4-SL-MultiModel is ready for your strategic review.

File: docs/sprints/epic4-multimodel-v1/UI_REVIEW.md

Key points:
- Interface validated
- Design system compliant
- Components specified

Please review and proceed to Stage 5: Strategic Analysis.

Thanks!
UI Chief
```

### Template 5: UX Chief → Product Manager

```
Subject: Sprint Workflow - Stage 5 Complete: UX_STRATEGIC_REVIEW.md

Hi Product Manager,

UX_STRATEGIC_REVIEW.md for EPIC4-SL-MultiModel is complete.

File: docs/sprints/epic4-multimodel-v1/UX_STRATEGIC_REVIEW.md

Key points:
- DEX compliance verified ✅
- Vision alignment confirmed ✅
- Ready for sprint prep

Please incorporate feedback and proceed to Stage 6: Sprint Preparation.

Thanks!
UX Chief
```

### Template 6: Product Manager → User

```
Subject: Sprint Ready: EPIC4-SL-MultiModel

Hi,

NOTION_ENTRY.md for EPIC4-SL-MultiModel is ready!

File: docs/sprints/epic4-multimodel-v1/NOTION_ENTRY.md

All 7 stages complete:
✅ SPEC_v1.md
✅ REQUIREMENTS.md
✅ DESIGN_SPEC.md
✅ UI_REVIEW.md
✅ UX_STRATEGIC_REVIEW.md
✅ USER_STORIES.md
✅ GROVE_EXECUTION_CONTRACT.md

Copy the content from NOTION_ENTRY.md and paste into Notion.

Ready for developer assignment! 🚀

Thanks!
Product Manager
```

---

## Tips for Success

### For Sprintmasters
- Keep SPEC_v1.md focused on goals, not implementation
- Document dependencies clearly
- Ask questions early

### For Product Managers
- Write user stories in Gherkin format
- Make acceptance criteria testable
- Get feedback from UX Chief before finalizing

### For Designers
- Create wireframes early
- Check design system before presenting
- Think about accessibility

### For UI Chiefs
- Review against requirements, not preferences
- Check consistency across the system
- Be specific about needed changes

### For UX Chiefs
- Focus on strategic alignment
- Verify DEX compliance
- Provide actionable feedback

### For Everyone
- Read previous stages' artifacts
- Ask questions if unclear
- Respect timelines
- Provide constructive feedback

---

## Quality Checklist

### Before Each Handoff
- [ ] Read all previous stage artifacts
- [ ] Complete your stage's template
- [ ] Review for completeness
- [ ] Prepare handoff email
- [ ] Update status in master tracking

### Before Notion Posting
- [ ] All 7 stages complete
- [ ] All artifacts in sprint directory
- [ ] NOTION_ENTRY.md formatted
- [ ] Copy-paste tested
- [ ] Status: "🎯 ready"

---

## Summary

**This workflow provides:**
1. Clear sequential stages
2. Specific owners for each stage
3. Complete handoff packages
4. Quality gates
5. Notion copy-paste convenience

**Result:** Professional sprint packages ready for execution!

---

**Document Owner:** Product Manager
**Last Updated:** 2026-01-16T18:45:00Z
