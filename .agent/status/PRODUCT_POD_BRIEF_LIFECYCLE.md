# Product Pod Brief: Complete the Sprout Lifecycle

**Prepared For:** Product Pod Review  
**Date:** 2026-01-15  
**Context:** S3||SFR-Actions complete, lifecycle gaps identified

---

## TL;DR

We built a beautiful workshop (Sprout Finishing Room modal), but users can't actually **grow** or **promote** sprouts through their lifecycle. The agentic loop is incomplete.

---

## Current State: What Works

✅ Explore → Ask questions  
✅ Inspiration → Capture response  
✅ Sprout → Research executes  
✅ Results → View in 3-column modal (Finishing Room)  
✅ Archive → Save to personal garden  
✅ Export → Download as markdown  
✅ Note → Add private annotations

---

## Current State: What's Broken

The user said: **"Explore → Inspiration! → Sprout → Results → Grow More or Move to Garden as 'sapling'"**

### ❌ "Grow More" (Refinement Loop)
**What user expects:** Click "Revise & Resubmit" → Research agent re-runs with my feedback → New version appears

**What actually happens:** Toast confirmation, nothing else. Stubbed.

**Why:** No research agent queue integration

---

### ❌ "Move to Garden as Sapling" (Tier Progression)
**What user expects:** Click "Promote" → Sprout becomes "sapling" → Shows up in knowledge base with tier badge

**What actually happens:** Content goes to RAG, but sprout tier doesn't change. Still shows as "sprout" forever.

**Why:** Tier field not wired to promotion action

---

### ❌ Full Botanical Lifecycle
**Expected tiers:**
- seed (raw capture)
- sprout (researched)
- sapling (promoted to knowledge base)
- tree (proven valuable)
- grove (foundational)

**Actual:** Only "pending/active/completed/archived" status, no tier progression

---

## The Gap

```
USER'S MENTAL MODEL:
Capture → Research → Review → [Grow More OR Promote to Garden]
                               ↓                ↓
                         More Research    Sapling (in knowledge base)
                               ↓
                         Repeat cycle → Eventually Tree → Grove

WHAT WE BUILT:
Capture → Research → Review → [Stub   OR   RAG write (no tier change)]
                               ↓                ↓
                         Toast only      Content in RAG but still "sprout"
```

---

## Four Paths Forward

### Path 1: Refinement Loop (Agent Requeue)
**Sprint:** sprout-refinement-loop-v1  
**Scope:** Wire "Revise & Resubmit" to research agent queue  
**Dependency:** Backend research agent queue service  
**Value:** Completes "Grow More" path  
**Effort:** Medium (depends on agent queue readiness)

---

### Path 2: Tier Progression (Sprout → Sapling)
**Sprint:** sprout-tier-progression-v1  
**Scope:** Add tier field to sprouts, update on promotion, display badges  
**Dependency:** None (DB schema already supports it)  
**Value:** Makes botanical lifecycle visible and functional  
**Effort:** Small

---

### Path 3: Multi-Sprout Synthesis
**Sprint:** sprout-synthesis-v1  
**Scope:** Compare view, merge multiple sprouts, parent/child relationships  
**Dependency:** None  
**Value:** Enables complex research workflows  
**Effort:** Large

---

### Path 4: Community Knowledge Integration
**Sprint:** knowledge-commons-integration-v1  
**Scope:** Promoted saplings visible to community, citation tracking  
**Dependency:** Community browser infrastructure  
**Value:** Closes full knowledge commons loop  
**Effort:** Large

---

## Randy's Recommendation

**Start with Path 2: Tier Progression**

**Why:**
1. **No backend dependencies** - Can ship immediately
2. **Makes lifecycle visible** - Users see their sprouts become saplings
3. **Small effort** - 4-6 user stories, quick win
4. **Sets up Path 1** - When agent queue is ready, refinement loop naturally fits into tier system
5. **User expectation alignment** - "Move to Garden as sapling" is exactly what users expect

**What it unlocks:**
- Users understand sprout maturity (seed → sprout → sapling → tree → grove)
- Knowledge base has tier metadata for future features
- GardenTray shows tier badges (visual progress)
- Foundation for automatic tier advancement (tree when high retrieval, grove when cited)

---

## Questions for Product Pod

### For Product Manager:
1. Is research agent queue ready for Path 1 (refinement loop)?
2. What's the priority: functional lifecycle (Path 2) or refinement loop (Path 1)?
3. When do we want community knowledge sharing (Path 4)?

### For UI/UX Designer:
1. How should tier badges appear in GardenTray and Finishing Room?
2. What's the visual language for tier progression?
3. Do we need tier progression animation (sprout → sapling transition)?

### For UX Chief (DEX Alignment):
1. Is tier progression sufficiently **declarative**? (User explicitly promotes)
2. Does automatic tree/grove advancement violate sovereignty?
3. How does this align with provenance infrastructure pillar?

---

## Next Steps

1. **Product Pod reviews this brief** (today)
2. **Product Manager drafts product brief** for chosen path
3. **UI/UX Designer creates wireframes** for tier UI
4. **UX Chief signs off** on DEX alignment
5. **Run `/user-story-refinery`** to extract stories
6. **Run `/grove-foundation-loop`** to create execution artifacts
7. **Developer executes sprint**

---

## Reference Documents

- **Full lifecycle compilation:** `.agent/status/SPROUT_LIFECYCLE_EPIC_COMPILATION.md`
- **Original product spec:** `docs/sprints/sprout-finishing-room-v1/PRODUCT_SPEC.md`
- **User stories:** `docs/sprints/sprout-finishing-room-v1/USER_STORIES.md`
- **Canonical tiers:** `docs/sprints/pipeline-inspector-v1/ADR-001-knowledge-commons-unification.md`

---

*Product Pod brief prepared by Randy - Chief of Staff v1.2*  
*"The modal is ready. The lifecycle is not."*
