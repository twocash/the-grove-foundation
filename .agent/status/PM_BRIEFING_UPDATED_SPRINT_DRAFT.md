# PM Briefing: Create Updated Sprint Draft (Tier Progression v1)

**To:** Product Manager
**From:** Randy (Chief of Staff)
**Date:** 2026-01-15
**Context:** Phase 0 of Knowledge as Observable System EPIC
**Notion EPIC:** https://www.notion.so/2ea780a78eef8175acbcf077a0c19ecb

---

## Your Task

**Create updated product brief for `sprout-tier-progression-v1` sprint that:**
1. Incorporates the strategic vision (observable knowledge system)
2. Integrates design decisions from UI/UX Designer
3. Scopes Phase 0 appropriately (foundation, not full vision)
4. Sets up architecture for Phases 1-7
5. Gets UX Chief sign-off on DEX alignment

---

## What You Have

### Strategic Context
- **Vision doc:** `.agent/status/VISION_KNOWLEDGE_AS_OBSERVABLE_SYSTEM.md`
- **Feature concept:** `.agent/status/FEATURE_IDEA_DECLARATIVE_LIFECYCLE.md`
- **Lifecycle compilation:** `.agent/status/SPROUT_LIFECYCLE_EPIC_COMPILATION.md`
- **Product Pod brief:** `.agent/status/PRODUCT_POD_BRIEF_LIFECYCLE.md`

### Current State Analysis
- **S3||SFR-Actions complete:** Finishing Room modal with actions works
- **Gap identified:** Users can VIEW results but can't GROW them (no tier progression)
- **User expectation:** "Grow More or Move to Garden as sapling"
- **Two bugs fixed:** Data source mismatch, modal stacking

### Design Input
- **Design brief:** `.agent/status/DESIGN_INPUT_TIER_PROGRESSION.md`
- **Designer deliverables:** (Wait for UI/UX Designer to complete)
  - Tier badge component
  - Tier progression flow
  - GardenTray integration
  - Provenance panel enhancement

---

## What You're Creating

**Product brief for sprout-tier-progression-v1 sprint**

Location: `docs/sprints/sprout-tier-progression-v1/PRODUCT_SPEC.md`

---

## Key Scoping Decisions

### Phase 0 = Foundation, Not Full Vision

**Include in Phase 0:**
- ✅ Tier field added to ResearchSprout schema
- ✅ Promotion action sets tier to "sapling"
- ✅ Tier badges visible in GardenTray
- ✅ Tier shown in Finishing Room provenance panel
- ✅ Visual tier progression in action panel
- ✅ 5-tier botanical model (hardcoded: seed/sprout/sapling/tree/grove)

**Explicitly OUT of Phase 0 (future phases):**
- ❌ Declarative lifecycle config (Phase 1)
- ❌ Auto-advancement engine (Phase 3)
- ❌ Retrieval tracking (Phase 2)
- ❌ Multiple lifecycle models (Phase 4)
- ❌ Cross-grove federation (Phase 5)
- ❌ AI curation agents (Phase 6)
- ❌ Attribution economy (Phase 7)

**Phase 0 Goal:** Prove the concept. Make tiers visible. Wire promotion to tier change. Ship quickly.

---

## Architecture Decisions to Make

### 1. Tier Field Implementation

**Question:** Where does tier live?

**Options:**
- A) Add `tier` column to Supabase `research_sprouts` table
- B) Store tier in sprout metadata JSON
- C) Compute tier dynamically (not stored)

**Recommendation:** Option A (database column)
- Queryable (filter by tier)
- Indexable (performance)
- Future-proof (supports auto-advancement)

**Decision needed from you:**
- Migration strategy? (default all completed sprouts to "sprout" tier)
- Backward compatibility? (old sprouts without tier field)

---

### 2. Hardcoded vs. Config-Driven (Phase 0 Scope)

**Strategic vision:** Declarative lifecycle config

**Phase 0 reality:** Ship faster with hardcoded 5-tier botanical model

**Question:** Do we build config foundation in Phase 0 or wait for Phase 1?

**Option A: Hardcoded (Ship Fast)**
```typescript
// Simple, direct
if (action === 'promote') {
  sprout.tier = 'sapling';
}
```

**Option B: Config Foundation (Strategic)**
```typescript
// More complex, but enables future
const lifecycle = DEFAULT_BOTANICAL_LIFECYCLE; // hardcoded for now
const nextTier = lifecycle.resolveTransition(sprout, 'promote');
sprout.tier = nextTier;
```

**Randy's take:** Option B. Extra complexity is minimal, unlocks Phases 1-7.

**Decision needed from you:**
- Do we build `LifecycleEngine` in Phase 0? (with single hardcoded config)
- Or just hardcode and refactor in Phase 1?
- Trade-off: Ship speed vs. technical debt

---

### 3. Tier Display in GardenTray

**Design will decide visual treatment, but YOU decide functional scope:**

**Question:** What tier functionality does GardenTray need?

**Options:**
- A) Display only (show tier badge, no interaction)
- B) Display + filter (show badge, add tier filter pills)
- C) Display + filter + sort (badge, filter, sort by maturity)
- D) Display + grouping (group sprouts by tier in sections)

**Recommendation:** Start with A (display only), add B in future if needed

**Decision needed from you:**
- Phase 0 scope: Just badges, or also filtering?
- UX complexity vs. user value trade-off

---

### 4. Tier Progression Feedback

**Question:** How does user know tier changed?

**Options:**
- A) Silent update (badge changes, no notification)
- B) Toast notification ("Sprout promoted to Sapling!")
- C) In-line animation (badge morphs with transition)
- D) Celebration modal (confetti, success message)

**Recommendation:** Option B or C (depends on design)

**Decision needed from you:**
- What level of celebration is appropriate?
- Balance: Delight vs. professional tone
- Consider: This is meaningful progression, but happens frequently

---

### 5. Provenance Panel Tier History

**Question:** Do we show tier history or just current tier?

**Current tier only:**
```
Tier: Sapling 🌿
```

**With history:**
```
Tier: Sapling 🌿
Promoted: Jan 15, 2026
History: seed → sprout (Jan 10) → sapling (Jan 15)
```

**Trade-offs:**
- History adds value (user sees progression)
- History adds complexity (need to track timestamps)
- History takes space (provenance panel already dense)

**Recommendation:** Phase 0 = current tier only. Add history in Phase 2 (with retrieval metrics).

**Decision needed from you:**
- Include tier history in Phase 0 or defer?

---

### 6. Education & Tooltips

**Question:** How do we teach users about tiers?

**Options:**
- A) No education (users figure it out)
- B) Tooltips on hover (tier definitions)
- C) Onboarding overlay (first-time user sees tier explanation)
- D) Help page (documentation, link from modal)

**Recommendation:** Option B (tooltips) + D (help docs)

**Decision needed from you:**
- What's the minimum viable education?
- Do we need onboarding overlay or just tooltips?

---

### 7. Backend Changes Required

**Database migration:**
```sql
ALTER TABLE research_sprouts
  ADD COLUMN tier TEXT DEFAULT 'sprout'
  CHECK (tier IN ('seed', 'sprout', 'sapling', 'tree', 'grove'));
```

**API changes:**
- Promotion endpoint updates tier field
- Sprout fetch includes tier in response
- GardenTray query fetches tier

**Decision needed from you:**
- Do we need new API endpoints or modify existing?
- Migration strategy for existing sprouts?

---

## Product Brief Structure (Recommended)

### Section 1: Executive Summary
- One-sentence vision (observable knowledge system)
- Phase 0 scope (tier field + badges + promotion)
- Why this matters (closes lifecycle loop, sets up federation)

### Section 2: Problem Statement
- Current state: Users can't see knowledge maturity
- User pain: Sprouts feel static, no growth
- Business impact: Lifecycle incomplete, federation blocked

### Section 3: Solution Overview
- 5-tier botanical model (seed → grove)
- Tier field in database
- Promotion action updates tier
- Visual badges in UI
- Foundation for future phases

### Section 4: User Stories (6-8 stories)
**Epic breakdown:**
- US-T001: Tier field added to sprouts (backend)
- US-T002: Promotion action sets tier to sapling
- US-T003: Tier badge shown in GardenTray
- US-T004: Tier shown in provenance panel
- US-T005: Promotion preview shows tier change
- US-T006: Tier progression feedback (toast/animation)
- US-T007: Tier tooltips for education
- US-T008: E2E test for tier progression

### Section 5: Technical Specification
- Database schema changes
- API modifications
- Frontend component updates
- Lifecycle engine (if Phase 0) or direct implementation

### Section 6: Design Requirements
- Reference design deliverables from UI/UX Designer
- Tier badge component spec
- Tier progression flow
- GardenTray integration
- Provenance panel enhancement

### Section 7: Out of Scope (Defer to Future Phases)
- Auto-advancement engine (Phase 3)
- Observable signals tracking (Phase 2)
- Multiple lifecycle models (Phase 4)
- Cross-grove federation (Phase 5)

### Section 8: Success Metrics
- Tier field successfully added (migration complete)
- Promotion sets tier to sapling (100% of promotions)
- Tier badges visible (user survey: can identify tier?)
- No performance regression (GardenTray load time)

### Section 9: DEX Alignment Review
- Get UX Chief sign-off
- Declarative Sovereignty: Config foundation (if Phase 0) or hardcoded?
- Provenance: Tier changes tracked with timestamps
- Capability Agnosticism: Tier engine model-agnostic?
- Organic Scalability: Architecture supports future phases?

### Section 10: Risks & Mitigation
- Risk: Over-engineering Phase 0 (spending too long)
- Mitigation: Ship minimal viable tier system
- Risk: Under-architecting (technical debt in Phase 1)
- Mitigation: Build lifecycle engine foundation
- Risk: User confusion (what's a "sapling"?)
- Mitigation: Tooltips + education

---

## Open Questions for You to Resolve

1. **Config Foundation:** Build `LifecycleEngine` in Phase 0 or hardcode?
2. **GardenTray Scope:** Just badges or also filtering?
3. **Tier History:** Show progression timeline or just current tier?
4. **Education Level:** Tooltips only or onboarding overlay?
5. **Celebration:** Silent update, toast, or animation?
6. **Migration Strategy:** How do existing sprouts get tier assigned?
7. **API Design:** New endpoints or modify existing?
8. **Success Metrics:** How do we measure tier visibility/understanding?

---

## Coordination with UX Chief

**Before finalizing product brief, consult UX Chief on:**

### DEX Pillar: Declarative Sovereignty
**Question:** Does Phase 0 need declarative config foundation, or can we hardcode?

**UX Chief should weigh:**
- Hardcoded = faster shipping, but creates technical debt
- Config = slower Phase 0, but aligns with DEX, enables Phases 1-7
- Trade-off: Speed vs. sovereignty

### DEX Pillar: Provenance as Infrastructure
**Question:** Do we track tier change timestamps in Phase 0?

**UX Chief should decide:**
- Tier field only: `tier: 'sapling'`
- Tier + timestamp: `tier: 'sapling', tierChangedAt: '2026-01-15T...'`
- Full provenance: `tierHistory: [{tier: 'sprout', timestamp: '...'}, {tier: 'sapling', timestamp: '...'}]`

### DEX Pillar: Capability Agnosticism
**Question:** Is hardcoded 5-tier model capability-agnostic?

**UX Chief should verify:**
- Different models (academic, research, creative) can swap in later
- Tier progression logic isn't tied to specific model/agent
- Future AI agents can participate in curation

---

## Timeline & Dependencies

**Dependencies:**
1. UI/UX Designer completes design deliverables
2. UX Chief provides DEX alignment sign-off
3. Product Manager (you) drafts product brief
4. User Story Refinery extracts stories
5. Foundation Loop creates execution artifacts
6. Developer implements sprint

**Recommended flow:**
```
Designer finishes → PM drafts brief → UX Chief reviews →
User Story Refinery → Foundation Loop → Developer executes
```

**Your deliverable timing:**
- Wait for designer's tier badge component + progression flow mockups
- Draft product brief incorporating design decisions
- Submit to UX Chief for DEX review
- Finalize brief with UX Chief feedback
- Hand off to User Story Refinery

---

## Success Criteria for Your Product Brief

**Brief is complete when:**
- ✅ Strategic vision articulated (observable knowledge system)
- ✅ Phase 0 scope clearly bounded (foundation, not full vision)
- ✅ User stories extracted (6-8 stories)
- ✅ Technical spec detailed (database, API, frontend)
- ✅ Design requirements integrated (references designer deliverables)
- ✅ DEX alignment verified (UX Chief sign-off)
- ✅ Out of scope explicit (Phases 1-7 deferred)
- ✅ Risks identified and mitigated
- ✅ Success metrics defined

**User Story Refinery can extract:**
- Acceptance criteria in Gherkin format
- Test scaffolding requirements
- INVEST assessment for each story

**Foundation Loop can generate:**
- Sprint execution artifacts
- Architecture decision records
- Implementation plan

---

## Reference Materials

**Strategic Vision:**
- `.agent/status/VISION_KNOWLEDGE_AS_OBSERVABLE_SYSTEM.md`
- `.agent/status/FEATURE_IDEA_DECLARATIVE_LIFECYCLE.md`

**Current State:**
- `.agent/status/SPROUT_LIFECYCLE_EPIC_COMPILATION.md`
- `.agent/status/PRODUCT_POD_BRIEF_LIFECYCLE.md`

**Design:**
- `.agent/status/DESIGN_INPUT_TIER_PROGRESSION.md`
- (Wait for designer deliverables)

**Technical:**
- ADR-001: `docs/sprints/pipeline-inspector-v1/ADR-001-knowledge-commons-unification.md`
- ResearchSprout schema: `src/core/schema/sprout.ts`
- GardenTray: `src/explore/components/GardenTray/`
- Finishing Room: `src/surface/components/modals/SproutFinishingRoom/`

---

## PM Role Clarity

**You own:**
- Product brief creation (WHAT and WHY)
- Scope decisions (Phase 0 boundaries)
- Success metrics (how do we measure?)
- Stakeholder alignment (UX Chief, Designer, User)

**You coordinate:**
- Designer for visual spec
- UX Chief for DEX alignment
- User Story Refinery for story extraction
- Foundation Loop for execution artifacts

**You do NOT:**
- Write code (Developer does that)
- Create designs (UI/UX Designer does that)
- Verify DEX compliance (UX Chief does that)
- Extract user stories (User Story Refinery does that)

**Your output:** Product brief that enables execution

---

*PM briefing prepared by Randy - Chief of Staff*
*"You're not just scoping a sprint. You're architecting the foundation for decentralized knowledge federation."*
