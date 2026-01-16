# S4-SL-TierProgression: Product Pod Handoff

**Date:** 2026-01-15
**Status:** 🎯 Ready for Execution
**Prepared By:** Randy (Chief of Staff)

---

## Current State

| Item | Status |
|------|--------|
| Epic created in Notion | ✅ Sprout Lifecycle v1 |
| Sprint created in Notion | ✅ S4-SL-TierProgression |
| SFR sprints linked | ✅ S1-S3 have Parent Spec |
| Design review | ✅ DESIGN_SPEC.md + DESIGN_DECISIONS.md |
| Product brief | ✅ S4_PRODUCT_BRIEF.md |
| DEX compliance | ✅ APPROVED by UX Chief |
| User stories | ✅ 8 stories with Gherkin ACs |
| Execution artifacts | ✅ Foundation Loop complete (9 artifacts) |

---

## What the Sprint Does

**Goal:** Make the botanical lifecycle visible and functional

**Scope:**
- Add tier field to ResearchSprout schema (if not present)
- Wire "Add to Field" promotion to set tier = sapling
- Display tier badges in GardenTray cards
- Display tier badge in Finishing Room header

**Out of Scope:**
- Agent requeue (Path 1 - future)
- Multi-sprout synthesis (Path 3 - future)
- Community knowledge (Path 4 - future)

---

## Design Questions Being Addressed

The UI/UX Designer is working on:

1. **Badge Component** - Icon vs emoji, colors, size variants
2. **GardenTray Integration** - Badge placement on sprout cards
3. **Finishing Room Header** - Prominent tier display
4. **Promotion Feedback** - Animation when sprout → sapling
5. **Progression Indicator** - Show path to next tier?

**Expected Output:** `docs/sprints/sprout-tier-progression-v1/DESIGN_SPEC.md`

---

## DEX Alignment Questions for UX Chief

1. **Declarative Sovereignty:** Is tier advancement user-controlled or automatic?
   - Current thinking: Promotion (sapling) is explicit user action
   - Tree/Grove could be automatic based on usage signals

2. **Provenance:** Should badge show HOW tier was achieved?
   - "Promoted by you" vs "Auto-advanced"

3. **Organic Scalability:** Will pattern work for custom tiers?

---

## Product Manager Brief Points

When PM engages, key decisions needed:

### Priority
- Is this P0 (must have for next release) or P1 (important but flexible)?

### Scope Confirmation
- Confirm: Manual promotion only for v1 (no auto-advancement to tree/grove)
- Confirm: No refinement loop integration (that's Path 1)

### Success Metrics
- What signals indicate this sprint succeeded?
- Promotion rate? User understanding of tiers?

### Dependencies
- Confirm no backend changes needed (tier field exists in schema)
- Confirm RAG write API already sets tier (or needs update)

---

## Notion Links

| Page | URL |
|------|-----|
| Sprout Lifecycle v1 (Epic) | https://www.notion.so/2e9780a78eef81fa856cf85f313c722d |
| S4-SL-TierProgression | https://www.notion.so/2e9780a78eef81e1be07c2afe30b16da |
| Product Pod Brief | `.agent/status/PRODUCT_POD_BRIEF_LIFECYCLE.md` |
| Epic Compilation | `.agent/status/SPROUT_LIFECYCLE_EPIC_COMPILATION.md` |

---

## Workflow Status

```
Designer completes DESIGN_SPEC.md      ✅ DONE
         │
         ▼
UX Chief reviews DEX alignment         ✅ APPROVED
         │
         ▼
Product Manager finalizes brief        ✅ DONE
         │
         ▼
/user-story-refinery → Gherkin ACs     ✅ 8 stories
         │
         ▼
/grove-foundation-loop → Execution     ✅ 9 artifacts
         │
         ▼
Update Notion status → 🎯 ready        ✅ DONE
         │
         ▼
Developer executes sprint              ⏳ NEXT
```

---

## Execution Artifacts

| Artifact | Path |
|----------|------|
| Specification | `docs/sprints/sprout-tier-progression-v1/SPEC.md` |
| Execution Guide | `docs/sprints/sprout-tier-progression-v1/EXECUTION_PROMPT.md` |
| Sprint Index | `docs/sprints/sprout-tier-progression-v1/INDEX.md` |

---

## To Start Development

```
/grove-execution-protocol S4-SL-TierProgression
```

Then follow `EXECUTION_PROMPT.md`.

---

*Handoff prepared by Randy - Chief of Staff v1.2*
*Updated 2026-01-15: All artifacts complete*
