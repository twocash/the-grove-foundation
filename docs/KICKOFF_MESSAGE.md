# How to Kick Off a Sprint - Exact Message

## Message to Sprintmaster

Invoke the Sprintmaster skill and say:

---

```
invoke sprintmaster

**Kick Off: EPIC5-SL-Federation Sprint Workflow**

**Context:**
We're implementing the new 7-stage sequential handoff system (see docs/SPRINT_WORKFLOW.md).

**Sprint to Run Through Workflow:**
- **Name:** EPIC5-SL-Federation
- **Full Title:** S9-SL-Federation [EPIC Phase 5]
- **EPIC:** Knowledge as Observable System (Phase 5 of 7)
- **Goal:** Cross-grove federation protocol

**Workflow Instructions:**
Please start **Stage 1: SPEC_v1.md** creation following the template in docs/SPRINT_WORKFLOW.md.

**Requirements for SPEC_v1.md:**
1. Sprint overview and goals
2. Key deliverables
3. Dependencies (S7 AutoAdvancement ✅, S7.5 JobConfig in progress)
4. Success criteria
5. Initial architecture thoughts

**Timeline:**
- Stage 1: SPEC_v1.md (1 day)
- Then handoff to Product Manager for Stage 2

**Documentation:**
- See docs/SPRINT_NAMING_CONVENTION.md for naming
- See docs/SPRINT_WORKFLOW.md for full workflow
- See docs/WORKFLOW_QUICKSTART.md for stage instructions

**Output Location:**
docs/sprints/epic5-federation-v1/SPEC_v1.md

**Status:** Begin Stage 1 now
```

---

## What Happens Next

**Sprintmaster will:**
1. Create SPEC_v1.md following template
2. Document initial goals and scope
3. Identify dependencies
4. Prepare questions for Product Manager

**Then:**
1. Handoff email to Product Manager
2. Product Manager creates REQUIREMENTS.md (Stage 2)
3. Designer creates DESIGN_SPEC.md (Stage 3)
4. UI Chief reviews (Stage 4)
5. UX Chief strategic review (Stage 5)
6. Product Manager sprint prep (Stage 6)
7. Create NOTION_ENTRY.md (Stage 7)

**Result:** Complete sprint package ready for Notion and execution!

---

## Alternative: Kick Off EPIC6

If you want to run EPIC6-SL-AICuration instead:

```
invoke sprintmaster

**Kick Off: EPIC6-SL-AICuration Sprint Workflow**

**Sprint:** EPIC6-SL-AICuration (S10-SL-AICuration [EPIC Phase 6])
**Goal:** AI curation agents for programmable knowledge curation

**Instructions:** Same as above, but for EPIC6 instead of EPIC5

**Output Location:**
docs/sprints/epic6-aicuration-v1/SPEC_v1.md
```

---

## What If You Want to Start with a Different Sprint

Just change the sprint name in the message:

```
invoke sprintmaster

**Kick Off: {Sprint Name} Sprint Workflow**

**Sprint:** {Full name}
**Goal:** {What it does}

**Instructions:** [Same as above]

**Output Location:**
docs/sprints/{sprint-dir}/SPEC_v1.md
```

---

## Summary

**To kick off ANY sprint through the workflow:**

1. Say: `invoke sprintmaster`
2. Give sprint name and context
3. Ask for Stage 1: SPEC_v1.md
4. Reference the workflow docs
5. Specify output location

**That's it!** The sprintmaster will handle the rest and hand off to Product Manager for Stage 2.
