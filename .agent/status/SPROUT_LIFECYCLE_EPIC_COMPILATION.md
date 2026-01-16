# Sprout Lifecycle Epic - Complete Vision

**Compiled By:** Randy (Chief of Staff)  
**Date:** 2026-01-15  
**Context:** User request for full agentic loop closure

---

## Executive Summary

**We just completed:** S3||SFR-Actions (viewing results + basic actions)  
**Epic scope:** Full sprout lifecycle from capture → growth → promotion → knowledge commons  
**Status:** Partial implementation - modal built, lifecycle progression NOT built

---

## The Complete Lifecycle Vision

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPROUT LIFECYCLE                              │
└─────────────────────────────────────────────────────────────────┘

1. EXPLORE (Surface Experience)
   User: Asks questions, gets responses
   └─► Magnetic Pill appears (capture affordance)

2. INSPIRATION! (Capture Moment)
   User: "This is valuable!" → Clicks capture
   └─► Sprout created with status: 'pending'

3. SPROUT (Research Execution)
   System: Research pipeline executes
   Status progression: pending → active → completed
   └─► GardenTray shows notification (🌻 Ready)

4. RESULTS (Finishing Room) ← WE ARE HERE
   User: Views research document in 3-column modal
   Actions available:
   - Revise & Resubmit (refinement loop)
   - Archive to Garden
   - Add Private Note
   - Export as Markdown
   └─► User must choose next step...

5. GROW MORE (Refinement Loop) ← NOT BUILT
   User: "This needs more depth"
   Actions:
   - Revise & Resubmit (creates new research sprout)
   - Spawn child sprouts (explore sub-questions)
   - Merge multiple sprouts (synthesis)
   Status: sprout → sprout (revised)
   └─► Back to step 3 (research execution)

6. MOVE TO GARDEN AS SAPLING (Promotion) ← PARTIALLY BUILT
   User: "This is garden-worthy"
   Actions:
   - Promote to Field (US-D005 - checklist for RAG)
   - Publish to Commons (future - share with community)
   Status progression: sprout → sapling → tree → grove
   └─► Knowledge accumulation complete

7. KNOWLEDGE COMMONS (Future Vision)
   Community: Discovers, references, builds on saplings
   Lifecycle: sapling → tree (proven valuable) → grove (foundational)
```

---

## What We Built (S1-S3)

### ✅ S1-SFR-Shell (4 stories)
- Modal foundation, layout, a11y
- Open/close behavior
- Status bar

### ✅ S2||SFR-Display (8 stories)  
- Provenance panel (Lens, Cognitive Routing, Knowledge Sources)
- Document viewer (json-render powered)
- Raw JSON toggle
- Citations with links

### ✅ S3||SFR-Actions (6 stories)
- Revise & Resubmit form (STUBBED - no agent requeue)
- Archive to Garden
- Add Private Note
- Export Document
- Promotion checklist (US-D005 - Add to Field)
- Engagement events

**Total:** 18 user stories delivered

---

## What's MISSING (Lifecycle Gaps)

### Gap 1: "Grow More" - Refinement Loop
**Current state:** Revise & Resubmit shows toast confirmation but doesn't actually requeue to research agent

**Needed:**
- Agent queue integration
- Research sprout revision with context
- Parent/child sprout relationships
- Sprout merging (synthesis)
- Sub-question spawning

**Backend dependency:** Research agent queue service

---

### Gap 2: Lifecycle Progression - Sprout → Sapling → Tree → Grove

**Current state:** 
- Sprouts have status: `pending | active | completed | archived`
- No concept of "promotion tier" or "knowledge maturity"

**Botanical lifecycle tiers (from canonical specs):**

| Tier | Meaning | When Applied |
|------|---------|--------------|
| **seed** | Raw capture, unprocessed | Initial capture (not yet researched) |
| **sprout** | Has research document attached | After research pipeline completes |
| **sapling** | Promoted to knowledge base | User explicitly promotes via "Add to Field" |
| **tree** | Proven valuable through use | High retrieval count, positive utility trend |
| **grove** | Foundational knowledge | Community consensus, citations |

**What exists:**
- Database schema supports tier field (seed/sprout/sapling/tree/grove)
- Pipeline Inspector has tier dropdowns
- Knowledge Commons uses tiers for RAG

**What's missing:**
- Sprout tier field NOT wired to lifecycle actions
- No UI showing tier progression
- No automatic tier advancement (tree, grove)
- Promotion checklist doesn't set tier=sapling

---

### Gap 3: Multi-Sprout Operations

**Vision:**
- Compare multiple sprouts side-by-side
- Merge sprouts into synthesis document
- Track sprout families (parent → children)

**Current state:** Only single-sprout view

---

### Gap 4: Community Knowledge Loop

**Vision:**
- Saplings visible in community knowledge browser
- Other explorers can reference your promoted sprouts
- Citation tracking (who built on your sapling?)
- Grove designation through community consensus

**Current state:** Promotion to RAG is private to your grove

---

## Canonical Lifecycle Documentation

### From `server-side-capture-v1/SPEC.md`:
```sql
lifecycle TEXT DEFAULT 'sprout' CHECK (lifecycle IN ('sprout', 'sapling', 'tree'))
```

### From `pipeline-inspector-v1/ADR-001`:
```
All Grove content follows the botanical lifecycle:
- seed: Raw upload, pending validation
- sprout: Validated, has metadata
- sapling: Searchable in RAG, proven useful once
- tree: High utility, frequent retrieval
- grove: Foundational, cited by others
```

### From `sprout-declarative-v1/SPEC.md`:
```typescript
/** Growth stage in botanical lifecycle */
export type SproutStage = 
  | 'germinating'    // Creating initial capture
  | 'sprouting'      // Research pipeline running
  | 'rooting'        // Results available, being reviewed (sapling equivalent)
  | 'branching'      // Spawning child investigations
  | 'flowering'      // Ready for promotion
  | 'fruiting'       // Promoted to commons
  | 'seeding'        // Being referenced by others
  | 'dormant';       // Archived
```

---

## What Should Come Next (Priority Order)

### Option 1: Close the Refinement Loop (Agent Requeue)

**Sprint:** `sprout-refinement-loop-v1`

**Scope:**
- Wire "Revise & Resubmit" to research agent queue
- Support sprout revision with parent context
- Track revision count, show version history
- Update GardenTray when revised sprout completes

**Backend dependency:** Research agent queue service

**User stories:**
- US-F001: Submit revision creates new research job
- US-F002: Revised sprout shows parent relationship
- US-F003: Version history viewable in Finishing Room
- US-F004: Notification when revised sprout completes

**Value:** Completes the "Grow More" path in lifecycle

---

### Option 2: Implement Tier Progression (Sprout → Sapling)

**Sprint:** `sprout-tier-progression-v1`

**Scope:**
- Add tier field to ResearchSprout schema
- Update "Add to Field" to set tier=sapling on promotion
- Display tier badge in GardenTray and Finishing Room
- Track tier advancement (automatic tree/grove promotion)

**User stories:**
- US-G001: Sprout tier stored and displayed
- US-G002: Promotion sets tier to "sapling"
- US-G003: Tier badge shows lifecycle stage
- US-G004: Auto-advance to "tree" based on utility signals

**Value:** Makes botanical lifecycle visible and functional

---

### Option 3: Multi-Sprout Operations

**Sprint:** `sprout-synthesis-v1`

**Scope:**
- Compare view (2-3 sprouts side-by-side)
- Merge operation (create synthesis from multiple sprouts)
- Parent/child relationship visualization
- Sprout family tree view

**User stories:**
- US-H001: Select multiple sprouts from GardenTray
- US-H002: Compare view shows sprouts side-by-side
- US-H003: Merge action creates synthesis document
- US-H004: Family tree shows sprout relationships

**Value:** Enables complex research workflows

---

### Option 4: Community Knowledge Integration

**Sprint:** `knowledge-commons-integration-v1`

**Scope:**
- Promoted saplings appear in community browser
- Citation tracking (who referenced your sapling)
- Grove designation workflow
- Public/private toggle for promoted content

**User stories:**
- US-I001: Promoted saplings visible to community
- US-I002: Citation count tracked
- US-I003: Grove designation voting/consensus
- US-I004: Privacy controls for promoted content

**Value:** Closes the full knowledge commons loop

---

## Backend Service Readiness Assessment

| Service | Needed For | Status | Notes |
|---------|-----------|--------|-------|
| Research Agent Queue | Refinement Loop | ❓ Unknown | Need to verify with backend team |
| RAG Write API | Promotion (Add to Field) | ✅ Available | `POST /api/knowledge/upload` exists |
| Sprout Tier Storage | Tier Progression | ✅ Available | Database schema supports it |
| Citation Tracking | Commons Integration | ❌ Not Built | Future work |
| Community Browser | Commons Integration | ❌ Not Built | Future work |

---

## Recommended Next Sprint

**Based on backend readiness and user value:**

### If Research Agent Queue is ready: Option 1 (Refinement Loop)
**Why:** Completes the "Grow More" path, highest user value for research workflow

### If Agent Queue NOT ready: Option 2 (Tier Progression)  
**Why:** Makes botanical lifecycle functional, no backend dependencies beyond existing RAG API

### Alternative: Small polish sprint
**Focus:** Bug fixes, auto-refresh issue, minor UX improvements

---

## Product Pod Review Needed

**Questions for Product Pod:**

1. **Backend Readiness:** Is research agent queue ready for revision submissions?
2. **Lifecycle Priority:** Should we focus on refinement loop or tier progression?
3. **Community Features:** When do we want to expose promoted saplings to other users?
4. **Multi-Sprout:** Is synthesis/comparison a priority for v1.x?

**Recommended Process:**
1. User reviews this compilation
2. Spawn Product Pod (`/product-manager`, `/ui-ux-designer`, `/user-experience-chief`)
3. Draft product brief for next sprint
4. Run `/user-story-refinery` to extract stories
5. Run `/grove-foundation-loop` to create execution artifacts

---

*Sprout Lifecycle Epic compilation by Randy - Chief of Staff v1.2*  
*"We built the workshop. Now we need the tools to make things grow."*
