# Handoff: Tier Progression Sprint Coordination

**Date:** 2026-01-15
**Sprint:** sprout-tier-progression-v1 (Phase 0 of Observable Knowledge System EPIC)
**Status:** Design input ready, awaiting UI/UX Designer completion

---

## What Just Happened

1. **Strategic Vision Documented**
   - Created EPIC vision: Knowledge as Observable System
   - Identified 5 strategic unlocks (observable metabolism, emergent quality, programmable curation, distributed standards, knowledge markets)
   - Documented 7 implementation phases

2. **EPIC Created in Notion**
   - URL: https://www.notion.so/2ea780a78eef8175acbcf077a0c19ecb
   - Status: 💡 idea
   - Priority: 🟠 high
   - Effort: 🏔️ epic
   - Domain: core
   - DEX Compliant: ✅

3. **Design Input Prepared**
   - Created comprehensive design brief for UI/UX Designer
   - 8 design questions to answer
   - 5 deliverables requested (tier badge, progression flow, GardenTray, provenance panel, design system)

4. **PM Briefing Created**
   - Detailed instructions for Product Manager to draft updated sprint brief
   - 7 architecture decisions to make
   - Coordination with UX Chief on DEX alignment
   - Success criteria defined

---

## Documents Created

| Document | Purpose | Audience |
|----------|---------|----------|
| `.agent/status/VISION_KNOWLEDGE_AS_OBSERVABLE_SYSTEM.md` | Full strategic vision (7 phases) | All stakeholders |
| `.agent/status/FEATURE_IDEA_DECLARATIVE_LIFECYCLE.md` | Technical concept (config-driven lifecycle) | Engineers, PM |
| `.agent/status/DESIGN_INPUT_TIER_PROGRESSION.md` | Design questions and deliverables | UI/UX Designer |
| `.agent/status/PM_BRIEFING_UPDATED_SPRINT_DRAFT.md` | Product brief creation instructions | Product Manager |
| Notion EPIC page | Strategic roadmap and phases | Product Pod, User |

---

## Workflow: What Happens Next

### Step 1: UI/UX Designer Completes Design (IN PROGRESS)

**Designer delivers:**
1. Tier badge component (GardenTray, Finishing Room)
2. Tier progression flow (promotion journey)
3. GardenTray integration (with tier badges)
4. Provenance panel enhancement (tier metadata)
5. Tier design system (colors, icons, typography)

**Designer answers:**
- Badge style (pill, chip, icon+text?)
- Color strategy (green gradient, distinct colors?)
- Animation approach (celebrate or subtle?)
- GardenTray treatment (filter/group or chronological?)
- Education strategy (tooltips, onboarding, help docs?)

**Design input document:** `.agent/status/DESIGN_INPUT_TIER_PROGRESSION.md`

---

### Step 2: Product Manager Drafts Updated Sprint Brief (NEXT)

**Once design is complete, PM creates:**
- Product brief: `docs/sprints/sprout-tier-progression-v1/PRODUCT_SPEC.md`

**PM incorporates:**
- Strategic vision (observable knowledge system)
- Design decisions (from UI/UX Designer)
- Phase 0 scope (foundation, not full vision)
- Architecture decisions (7 key choices)

**PM coordinates with:**
- UX Chief: DEX alignment review
- Designer: Visual spec integration
- Randy: Scope validation

**PM briefing document:** `.agent/status/PM_BRIEFING_UPDATED_SPRINT_DRAFT.md`

---

### Step 3: UX Chief Reviews DEX Alignment (AFTER PM DRAFT)

**UX Chief validates:**
- Declarative Sovereignty: Config foundation or hardcoded?
- Provenance Infrastructure: Tier change timestamps?
- Capability Agnosticism: Model-agnostic architecture?
- Organic Scalability: Supports Phases 1-7?

**UX Chief signs off or requests changes**

---

### Step 4: User Story Refinery Extracts Stories (AFTER UX SIGN-OFF)

**Run:** `/user-story-refinery` on updated product brief

**Generates:**
- 6-8 user stories with Gherkin acceptance criteria
- INVEST assessment per story
- Test scaffolding requirements
- Critical flow analysis

---

### Step 5: Foundation Loop Creates Execution Artifacts (AFTER STORIES)

**Run:** `/grove-foundation-loop` on sprint

**Generates:**
- Architecture decision records
- Implementation plan
- Technical specifications
- Execution handoff document

---

### Step 6: Developer Executes Sprint

**Developer implements:**
- Database migration (tier field)
- API changes (promotion updates tier)
- Frontend components (tier badges, progression UI)
- E2E tests (tier progression flow)

---

## Key Architecture Decisions (PM Must Resolve)

### 1. Config Foundation in Phase 0?
**Option A:** Hardcode 5-tier model (fast)
**Option B:** Build LifecycleEngine with hardcoded config (strategic)

**Randy's recommendation:** Option B (enables Phases 1-7)

---

### 2. GardenTray Functionality
**Option A:** Display only (badges)
**Option B:** Display + filter
**Option C:** Display + filter + sort

**Randy's recommendation:** Option A Phase 0, add B later if needed

---

### 3. Tier History Tracking
**Option A:** Current tier only
**Option B:** Tier + timestamp
**Option C:** Full tier progression history

**Randy's recommendation:** Option A Phase 0, add C in Phase 2 with retrieval metrics

---

### 4. Education Strategy
**Option A:** No education (users figure it out)
**Option B:** Tooltips on hover
**Option C:** Onboarding overlay

**Randy's recommendation:** Option B + help docs

---

### 5. Progression Feedback
**Option A:** Silent update
**Option B:** Toast notification
**Option C:** In-line animation
**Option D:** Celebration modal

**Randy's recommendation:** Designer decides based on mockups

---

### 6. API Design
**Option A:** Modify existing promotion endpoint
**Option B:** Create new tier-specific endpoint

**Randy's recommendation:** Option A (modify existing)

---

### 7. Migration Strategy
**Question:** How do existing sprouts get tier assigned?

**Options:**
- All completed sprouts default to "sprout" tier
- Query status and infer tier (active → sprout, promoted → sapling)
- Manual operator assignment

**Randy's recommendation:** Default all to "sprout", user promotes to sapling

---

## Success Criteria (Full Sprint)

**Phase 0 is complete when:**
- ✅ Tier field added to ResearchSprout schema
- ✅ Promotion action sets tier to "sapling"
- ✅ Tier badges visible in GardenTray
- ✅ Tier shown in Finishing Room provenance panel
- ✅ Promotion preview shows tier change
- ✅ User receives tier progression feedback
- ✅ E2E tests pass for tier progression flow
- ✅ No performance regression

**User can:**
- See tier at a glance (GardenTray badge)
- Understand what tier means (tooltips)
- Promote sprout to sapling (action panel)
- Observe tier change (visual feedback)

---

## Out of Scope (Deferred to Future Phases)

**Phase 0 does NOT include:**
- ❌ Declarative lifecycle config UI (Phase 1)
- ❌ Observable signals tracking (Phase 2)
- ❌ Auto-advancement engine (Phase 3)
- ❌ Multiple lifecycle models (Phase 4)
- ❌ Cross-grove federation (Phase 5)
- ❌ AI curation agents (Phase 6)
- ❌ Attribution economy (Phase 7)

**But Phase 0 architecture enables all of these.**

---

## The Big Picture

### Not This:
"Make tier badges visible in the UI"

### This:
**Build the foundation for an observable, programmable knowledge system where:**
- Quality emerges from usage patterns (no gatekeepers)
- AI agents participate in curation (programmable)
- Groves federate via tier mapping (decentralized)
- Knowledge has a metabolism (observable lifecycle)

**Phase 0 is the first step toward knowledge as a living system.**

---

## Next Agent to Run

**Recommendation:** Wait for UI/UX Designer to complete design deliverables, then spawn Product Manager.

**Command:**
```bash
/product-manager draft product brief for sprout-tier-progression-v1 based on:
- .agent/status/VISION_KNOWLEDGE_AS_OBSERVABLE_SYSTEM.md
- .agent/status/PM_BRIEFING_UPDATED_SPRINT_DRAFT.md
- (Designer deliverables when ready)
```

**Then:** UX Chief reviews → User Story Refinery → Foundation Loop → Developer

---

## Randy's Status

**What I did:**
1. Compiled sprout lifecycle epic (identified gap)
2. Created strategic vision (observable knowledge system)
3. Documented EPIC in Notion (7-phase roadmap)
4. Prepared design input (8 questions for UI/UX Designer)
5. Prepared PM briefing (architecture decisions + coordination)
6. Created this handoff (workflow clarity)

**What I'm NOT doing:**
- Writing code (code-freeze rule)
- Creating designs (Designer's role)
- Making DEX decisions (UX Chief's authority)
- Extracting user stories (User Story Refinery's job)

**My role:** Documentation, coordination, strategic vision articulation

**Status:** COMPLETE. Handoff to Designer → PM → UX Chief → Refinery → Loop → Developer

---

*Handoff prepared by Randy - Chief of Staff v1.2*
*"We're not building a feature. We're building the foundation for knowledge federation."*
