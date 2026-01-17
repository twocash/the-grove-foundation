# Product Manager Strategic Briefing: S7-SL-AutoAdvancement

**Sprint:** S7-SL-AutoAdvancement - Programmable Curation Engine  
**EPIC:** Knowledge as Observable System (Phase 3 of 7)  
**Date:** 2026-01-16  
**Status:** Pre-Sprint Strategic Kickoff  

---

## Executive Summary

**What we're building:** An advancement criteria engine that automatically progresses sprout tiers based on observable usage signals.

**Why it matters:** This is the PIVOT moment where Grove transforms from **manual knowledge capture** → **living knowledge metabolism**. Quality emerges from USE, not gatekeeping.

**Strategic position:** Phase 3 of 7 in the Knowledge as Observable System EPIC. We're past infrastructure (S5: config, S6: signals) and entering **intelligence** (automatic curation).

**Vision alignment:** "AI agents become CURATORS, not just generators."

---

## The Big Picture: Knowledge as Observable System

### Where We've Been (Phases 0-2)

| Phase | Sprint | Achievement |
|-------|--------|-------------|
| **Phase 0** | S4-TierProgression | Tier badges visible, manual promotion (`promotedAt` field) |
| **Phase 1** | S5-LifecycleEngine | Declarative tier config in Supabase, ExperienceConsole management |
| **Phase 2** | S6-ObservableSignals | Usage tracking (retrievals, citations, query diversity) |

**Current state:** We can DEFINE lifecycles (S5) and OBSERVE usage (S6), but tiers still require **manual promotion**.

### Where We Are (Phase 3) ⚡ THIS SPRINT

**S7-AutoAdvancement: The Intelligence Layer**

Transform from:
```
❌ Operator manually reviews sprout → clicks "Promote to Tree" → tier changes
```

To:
```
✅ System observes 50+ retrievals, 10+ citations, 5+ query contexts
   → Evaluates advancement criteria (declarative rules)
   → Automatically advances seed → sprout → sapling → tree
   → Notifies operator of change (with override controls)
```

**Key insight:** "Quality emerges from usage, not manual curation."

### Where We're Going (Phases 4-7)

| Phase | Sprint | Vision |
|-------|--------|--------|
| **Phase 4** | S8-MultiModel | Custom lifecycle models (academic, creative, research) |
| **Phase 5** | S9-Federation | Cross-grove tier mapping (my.tree ≈ your.published) |
| **Phase 6** | S10-AICuration | AI agents PROPOSE advancements, learn quality patterns |
| **Phase 7** | S11-Attribution | Token rewards proportional to tier, knowledge economy |

**This sprint unlocks the entire vision.** Without auto-advancement, we can't scale to Phase 6 (AI curation) or Phase 7 (attribution economy).

---

## Strategic Context: The Thesis

### The Grove Foundation Thesis

**Problem:** How do LOCAL groves participate in GLOBAL knowledge network without centralized control?

**Answer:** Declarative lifecycle config with tier-based federation.

**Example:**
```javascript
My grove (botanical): seed → sprout → sapling → tree → grove
Your grove (academic): hypothesis → tested → published → canonical

Network mapping: my.tree ≈ your.published

When you retrieve my tree-tier content:
├─ Attribution recorded
├─ My tier recognized  
├─ Value flows
└─ No platform middleman
```

**This sprint is critical infrastructure for that future.**

### Why Auto-Advancement Matters

**Without it:**
- Operators must manually review every sprout for promotion
- Quality assessment = human bottleneck
- Can't scale to thousands of sprouts
- Can't demonstrate "emergent quality" thesis

**With it:**
- System learns what "quality" means from actual USE
- Retrieval patterns + utility scores = automatic tier advancement
- Scales to millions of sprouts
- Operators AUDIT, don't CURATE (10x efficiency)
- Proof point for "AI as curator" vision

**DEX embodiment:** Declarative rules replace procedural gating. Behavior changes via config, not code.

---

## v1.0 Architecture Alignment 🚨 CRITICAL

### 🛡️ Drift Detector Active

This sprint MUST use v1.0 reference implementation patterns. Here's what that means:

#### ✅ CORRECT Architecture

| Component | v1.0 Pattern |
|-----------|--------------|
| **Storage** | Supabase `advancement_rules` table (JSONB payload) |
| **UI** | `/bedrock/consoles/ExperienceConsole` (NOT Foundation RealityTuner) |
| **Data Access** | `useGroveData('advancement-rule')` hook |
| **Config Management** | ExperienceConsole factory (SINGLETON enforcement) |
| **Execution Engine** | Pure TypeScript in `src/core/engine/advancementEvaluator.ts` |

#### ❌ FROZEN - Do NOT Reference

| Legacy Path | Status | v1.0 Equivalent |
|-------------|--------|-----------------|
| `/foundation/*` | FROZEN | `/bedrock/*` |
| `RealityTuner` console | FROZEN | ExperienceConsole |
| GCS `infrastructure/*.json` | DEPRECATED | Supabase tables |
| `server.js` endpoints | DEPRECATED | GroveDataProvider |

**Why this matters:** Foundation layer is FROZEN per strangler fig migration. New features must use Bedrock patterns to build the v1.0 reference implementation.

**Reference:** `.agent/roles/user-experience-chief-DRIFT_DETECTOR.md`

---

## The json-render Opportunity 🔥 HOT TECH

### Strategic Pattern Momentum

**Last 3 sprints:**
- **S1-SFR-Shell:** Introduced json-render pattern (catalog + registry + renderer)
- **S2-SFR-Display:** Used for research document rendering
- **S5-LifecycleEngine:** Approved for Phase 4+ (template gallery, visual editor)

**What is json-render?**
- Locally-owned pattern (not npm dependency)
- **Catalog:** Zod schemas define valid structures
- **Registry:** React components render catalog types
- **Renderer:** Tree walker connects catalog → components

**Where it lives:** `src/surface/components/modals/SproutFinishingRoom/json-render/`

### S7 Strategic Fit: EXCELLENT

**Advancement rules are PERFECT substrate for json-render:**

```typescript
// Catalog: Define advancement rule schemas
export const AdvancementRuleSchema = z.object({
  id: z.string(),
  fromTier: z.string(),
  toTier: z.string(),
  criteria: z.array(z.object({
    signal: z.enum(['retrievals', 'citations', 'queryDiversity', 'utilityScore']),
    operator: z.enum(['>=', '>', '==', '<', '<=']),
    threshold: z.number(),
  })),
});

// Registry: Visual rule builder components
export const AdvancementRegistry = {
  AdvancementRule: RuleCard,
  Criteria: CriteriaRow,
  SignalSelector: SignalDropdown,
};

// Renderer: Transform config → interactive UI
<Renderer tree={ruleTree} registry={AdvancementRegistry} />
```

**Benefits:**
1. **Phase 3 (this sprint):** JSON config → visual rule display
2. **Phase 4+:** Drag-and-drop rule builder
3. **Phase 6:** AI-generated advancement rules (catalog constrains LLM output)
4. **Phase 7:** Template gallery for rule patterns

**Recommendation:** 
- **Phase 3 (MVP):** JSON-based rules, basic display in ExperienceConsole
- **Phase 4+:** Add json-render catalog for visual rule builder

This creates the **substrate** for future intelligence while shipping functional value immediately.

---

## Core Sprint Deliverables

### 1. Advancement Criteria Schema

**Supabase Table:** `advancement_rules`

```typescript
interface AdvancementRule {
  id: string;
  lifecycleModelId: string;  // Reference to lifecycle config
  fromTier: string;          // e.g., "seed"
  toTier: string;            // e.g., "sprout"
  criteria: {
    signal: 'retrievals' | 'citations' | 'queryDiversity' | 'utilityScore';
    operator: '>=' | '>' | '==' | '<' | '<=';
    threshold: number;
  }[];
  logicOperator: 'AND' | 'OR';  // How criteria combine
  isEnabled: boolean;
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
  };
}
```

**Example rule:**
```json
{
  "id": "seed-to-sprout",
  "fromTier": "seed",
  "toTier": "sprout",
  "criteria": [
    { "signal": "retrievals", "operator": ">=", "threshold": 10 },
    { "signal": "citations", "operator": ">=", "threshold": 3 }
  ],
  "logicOperator": "AND"
}
```

**DEX embodiment:** Declarative rules, not procedural code. Operators can modify thresholds without deployment.

### 2. Advancement Evaluation Engine

**Location:** `src/core/engine/advancementEvaluator.ts` (pure TypeScript, NO React)

**Core function:**
```typescript
export function evaluateAdvancement(
  sprout: Sprout,
  signals: ObservableSignals,
  rules: AdvancementRule[]
): { shouldAdvance: boolean; toTier: string; reason: string } | null
```

**Process:**
1. Get sprout's current tier
2. Find applicable rules (fromTier matches current)
3. Evaluate each rule's criteria against signals
4. Return first matching rule (OR-logic) or null

**Key design:** Pure function, testable, no side effects.

### 3. Automatic Progression Pipeline

**Trigger:** Cron job or event-based (on signal update)

**Flow:**
```
1. Fetch all sprouts with active advancement rules
2. For each sprout:
   a. Get observable signals (S6 data)
   b. Evaluate advancement criteria
   c. If match found:
      - Update sprout.tier
      - Update sprout.promotedAt
      - Log advancement event
      - Queue notification
3. Emit notifications to operators
```

**Error handling:** Rollback on failure, log advancement attempts.

### 4. ExperienceConsole Integration

**New card type:** `advancement-rule`

**UI Components:**
- `AdvancementRuleCard.tsx` - Grid card (follows FeatureFlagCard pattern)
- `AdvancementRuleEditor.tsx` - Inspector (criteria builder, preview)
- `AdvancementHistoryPanel.tsx` - Show recent auto-advancements

**Registry entry:**
```typescript
// src/bedrock/config/component-registry.ts
'advancement-rule': {
  label: 'Advancement Rules',
  card: AdvancementRuleCard,
  editor: AdvancementRuleEditor,
  allowMultipleActive: true,  // Multiple rules can be active
  icon: 'trending-up',
}
```

### 5. Operator Controls

**Override mechanisms:**
- **Disable rule:** Set `isEnabled: false` in ExperienceConsole
- **Manual override:** Operator can force tier change (bypasses rules)
- **Audit trail:** All auto-advancements logged with rule ID + criteria met

**Notification system:**
- Slack/email digest: "10 sprouts auto-advanced to tree tier today"
- ExperienceConsole badge: "5 new auto-advancements"
- Click → see details panel with rule + signals

---

## DEX Alignment Verification

| Pillar | Embodiment in S7 |
|--------|------------------|
| **Declarative Sovereignty** | Advancement behavior defined in Supabase config, not code. Operators change thresholds without deployment. |
| **Capability Agnosticism** | Evaluation engine is pure TypeScript. Works with any model executing the curation logic. Rules don't assume specific AI capabilities. |
| **Provenance as Infrastructure** | Every auto-advancement logged with: rule ID, criteria met, signal values, timestamp. Full audit trail. |
| **Organic Scalability** | New advancement rules added via ExperienceConsole. New signal types extend schema. No core changes for new lifecycle models. |

**Grade:** EXCELLENT - All 4 pillars naturally embodied.

---

## Dependencies & Blockers

### Hard Dependency: S6-ObservableSignals

**Status:** 💡 idea (not yet started)

**What S7 needs from S6:**
- `observable_signals` Supabase table with:
  - `sproutId` (foreign key)
  - `retrievalCount` (number)
  - `citationCount` (number)
  - `queryDiversityScore` (0-1 float)
  - `utilityScore` (0-1 float, user ratings)
  - `lastUpdated` (timestamp)

**Critical path:** **S6 MUST complete before S7 starts.**

**Recommendation:** 
1. Prioritize S6 in sprint queue
2. S7 Product Brief includes "assumes S6 observable_signals schema exists"
3. If S6 delayed, S7 can use MOCK signals for development (hardcoded values)

---

## Strategic Goals for This Sprint

### Primary Goal: Proof of Concept

**Success metric:** At least ONE advancement rule (seed → sprout) runs automatically and advances sprouts based on mock or real signals.

**Why this matters:** Demonstrates "emergent quality" thesis. Proves the system can LEARN what quality means from usage.

### Secondary Goals

1. **Operator Confidence:** Operators can see, edit, and disable advancement rules via ExperienceConsole
2. **Audit Trail:** Full provenance for auto-advancements (who, when, why, which rule)
3. **Override Controls:** Operators can manually force tier changes when rules fail
4. **Scalability Foundation:** Architecture supports Phase 6 (AI-proposed rules) and Phase 7 (attribution economy)

### Non-Goals (Defer to Later Phases)

- ❌ Visual rule builder (json-render powered) → Phase 4
- ❌ AI-generated advancement rules → Phase 6
- ❌ Cross-grove tier mapping → Phase 5
- ❌ Token rewards for tier advancement → Phase 7

**Focus:** Nail the CORE engine. Make it work, make it observable, make it overrideable.

---

## json-render Integration Strategy

### Phase 3 (This Sprint): Foundation

**What to ship:**
```typescript
// Basic JSON display in ExperienceConsole
<pre>{JSON.stringify(advancementRule, null, 2)}</pre>

// Simple criteria list
{rule.criteria.map(c => (
  <div>{c.signal} {c.operator} {c.threshold}</div>
))}
```

**Why basic is OK:** We're validating the ENGINE, not the UI. Functional beats fancy.

### Phase 4+: json-render Enhancement

**When S8-MultiModel adds template gallery, THEN add:**

```typescript
// Catalog: Define advancement rule components
export const AdvancementCatalog = {
  AdvancementRule: AdvancementRuleSchema,
  Criteria: CriteriaSchema,
  SignalThreshold: SignalThresholdSchema,
};

// Registry: Visual rule builder
export const AdvancementRegistry = {
  AdvancementRule: ({ element }) => <RuleCard rule={element.props} />,
  Criteria: ({ element }) => <CriteriaRow criteria={element.props} />,
};

// Transform config → render tree
const tree = advancementRuleToRenderTree(rule);
<Renderer tree={tree} registry={AdvancementRegistry} />
```

**Benefits:**
- Drag-and-drop criteria builder
- Live preview of rule evaluation
- Template gallery (common patterns)
- AI-generated rules constrained by catalog

**Strategic value:** json-render becomes the SUBSTRATE for intelligence (AI rule generation in Phase 6).

---

## Product Brief Requirements

### What PM Needs to Deliver (Foundation Loop Input)

1. **Use Cases** - 3-5 concrete scenarios:
   - Academic grove: citation threshold for "peer-reviewed" tier
   - Research grove: retrieval count for "validated" tier
   - Creative grove: utility score for "masterwork" tier

2. **User Personas:**
   - **Operator:** Manages advancement rules, audits auto-advancements
   - **Gardener:** Sees tier badges update automatically, trusts system
   - **AI Curator (future):** Proposes new rules based on patterns

3. **Success Metrics:**
   - % of sprouts auto-advanced (target: 80%+)
   - False positive rate (wrong tier assignments) < 5%
   - Operator override rate (manual corrections) < 10%
   - Median time seed → tree (observable trend)

4. **UI Flows:**
   - ExperienceConsole: Create/edit advancement rule
   - ExperienceConsole: View advancement history
   - ExperienceConsole: Override automatic advancement
   - Explore: Tier badge updates in real-time (cache invalidation)

5. **Data Schema:**
   - `advancement_rules` table structure
   - `advancement_events` log table
   - Integration with `observable_signals` (S6)
   - Integration with `lifecycle_configs` (S5)

6. **Non-Functional Requirements:**
   - Evaluation latency: < 100ms per sprout
   - Batch processing: Support 1000+ sprouts
   - Rollback capability: Undo bulk advancements
   - A/B testing: Compare rule variants

### Advisory Council Questions (Pre-Brief)

**Strategic alignment:**
1. Does auto-advancement align with "knowledge metabolism" vision?
2. Should operators AUDIT or APPROVE auto-advancements? (Pull vs push model)
3. What's the fallback if signals are insufficient? (Default to manual?)

**Technical feasibility:**
4. Can we launch without S6 (using mock signals)? Or hard blocker?
5. Should advancement be event-driven (on signal update) or cron-based (daily batch)?
6. What's the rollback strategy if a rule produces bad advancements?

**User experience:**
7. How do gardeners discover why a sprout advanced? (Provenance UI)
8. Should tier changes trigger notifications? (Email, Slack, in-app)
9. What's the operator mental model: "approval queue" or "exception handling"?

---

## Timeline & Sequencing

### Critical Path

```
Week 1: S6-ObservableSignals (BLOCKER)
  ├─ Design observable_signals schema
  ├─ Implement tracking hooks
  └─ Supabase migration + seed data

Week 2-3: S7-AutoAdvancement (THIS SPRINT)
  ├─ Product Brief (PM)
  ├─ Foundation Loop (Sprintmaster)
  ├─ UX Chief approval (DEX + drift check)
  ├─ Implementation (Developer)
  └─ E2E testing (QA)

Week 4+: S8-MultiModel (NEXT EPIC PHASE)
  └─ json-render enhancement for rule builder
```

**Recommendation:** If S6 not ready, S7 can use **mock signals** (hardcoded values) to prove engine works. Real signals integrated when S6 completes.

---

## Key Decision Points for PM

### 1. S6 Dependency Strategy

**Option A:** Hard blocker - wait for S6 to complete  
**Option B:** Mock signals - ship S7 engine, backfill real signals later  

**Recommendation:** **Option B** - Prove engine works with mocks. Reduces S6 pressure. Faster iteration.

### 2. Evaluation Trigger Model

**Option A:** Event-driven - evaluate on every signal update  
**Option B:** Cron-based - batch evaluate daily/hourly  

**Recommendation:** **Option B** - Daily batch at 2am. Avoids race conditions. Predictable load. Operators review in morning.

### 3. Operator Interaction Model

**Option A:** Approval queue - operators must APPROVE each auto-advancement  
**Option B:** Exception handling - auto-advancements happen, operators AUDIT and override if wrong  

**Recommendation:** **Option B** - Trust the system, audit exceptions. Aligns with "emergent quality" thesis. Operators steward, don't gatekeep.

### 4. json-render Timing

**Option A:** Full catalog + visual builder in S7  
**Option B:** JSON display in S7, catalog in S8  

**Recommendation:** **Option B** - Ship functional engine first. Add visual polish in Phase 4 when building template gallery.

---

## Risks & Mitigations

### Risk 1: S6 Delay

**Impact:** Can't evaluate real advancement criteria without observable signals.

**Mitigation:** 
- Use mock signals (hardcoded: 50 retrievals, 10 citations)
- Prove engine works conceptually
- Integrate real signals when S6 completes

### Risk 2: False Positives (Wrong Tier Assignments)

**Impact:** Sprouts auto-advance prematurely, operators lose trust.

**Mitigation:**
- Conservative thresholds initially (high bar for advancement)
- Operator override UI (easy to revert)
- A/B test rules before production rollout
- Audit trail shows which rule fired (debug bad rules)

### Risk 3: Complexity Creep (Over-Engineering)

**Impact:** Sprint scope expands to visual builders, AI generation, federation.

**Mitigation:**
- **Phase discipline:** This is Phase 3 of 7. Nail the engine, defer polish.
- **Non-goals explicit:** No visual builder (Phase 4+), no AI rules (Phase 6+)
- **UX Chief enforces:** "Ship substrate, not features."

### Risk 4: Drift to Foundation RealityTuner

**Impact:** Implementation uses frozen legacy patterns instead of v1.0 Bedrock.

**Mitigation:**
- UX Chief drift detector active
- Pre-approval checklist: NO /foundation paths, NO GCS storage
- Developer uses ExperienceConsole factory pattern
- Design artifacts specify Supabase + Bedrock explicitly

---

## Success Criteria

### Sprint Success (Phase 3 Complete)

✅ **Functional:**
- [ ] At least 1 advancement rule (seed → sprout) exists in Supabase
- [ ] Evaluation engine runs and advances sprouts based on mock/real signals
- [ ] Auto-advancements logged with full provenance (rule, criteria, timestamp)
- [ ] Operators can view/edit/disable rules via ExperienceConsole

✅ **Technical:**
- [ ] `advancement_rules` Supabase table created
- [ ] `src/core/engine/advancementEvaluator.ts` evaluates criteria correctly
- [ ] `useGroveData('advancement-rule')` hook provides CRUD
- [ ] Registry entry in `component-registry.ts`
- [ ] E2E test: create rule → auto-advance sprout → verify tier change

✅ **DEX:**
- [ ] All 4 pillars verified by UX Chief
- [ ] NO references to Foundation/RealityTuner/GCS (drift check passes)
- [ ] Configuration changes tier behavior without code deployment

✅ **Strategic:**
- [ ] Demonstrates "quality emerges from usage" thesis
- [ ] Substrate for Phase 6 (AI-proposed rules) and Phase 7 (attribution)
- [ ] Operators trust system to auto-curate (audit, not approve)

### EPIC Success (All 7 Phases Complete)

**Vision delivered:** Grove transforms from knowledge capture tool → living knowledge metabolism where:
- Quality emerges from observable usage patterns (no gatekeepers)
- AI agents curate and propose advancements (scalable intelligence)
- Groves federate in decentralized knowledge economy (local → global)

**This sprint is Phase 3 of that vision.**

---

## Next Steps for Product Manager

### 1. Advisory Council Consultation (Optional)

Review strategic alignment questions (see section above). Get feedback on:
- Operator interaction model (approve vs audit)
- S6 dependency strategy (wait vs mock)
- json-render timing (Phase 3 vs Phase 4)

### 2. Product Brief Creation

**Inputs:**
- This strategic briefing
- S6-ObservableSignals schema (when available)
- S5-LifecycleEngine patterns (ExperienceConsole, GroveObject)

**Outputs:**
- Use cases (3-5 scenarios)
- User flows (ExperienceConsole + Explore)
- Data schema (advancement_rules, advancement_events)
- Success metrics (auto-advancement %, false positives, operator trust)

**Template:** Follow S5-LifecycleEngine PRODUCT_BRIEF_FINAL.md structure

### 3. Handoff to UI/UX Designer

**Request wireframes for:**
- AdvancementRuleCard (grid view)
- AdvancementRuleEditor (inspector panel)
- AdvancementHistoryPanel (audit trail)
- Override controls (manual tier change)

**Design constraints:**
- Quantum Glass v1.0 (NOT Living Glass v2)
- ExperienceConsole factory pattern
- Follows FeatureFlagCard/Editor patterns

### 4. UX Chief Pre-Review

**Before Foundation Loop, ask UX Chief:**
- DEX alignment check (4 pillars)
- Drift detector review (no Foundation references)
- json-render strategy validation (Phase 3 vs 4 timing)

### 5. Foundation Loop Trigger

**Once brief + designs approved:**
- Sprintmaster packages artifacts
- User Story Refinery extracts Gherkin ACs
- Developer receives execution prompt
- QA validates auto-advancement + provenance

---

## Closing Thoughts: The Pivot Moment

**What we've built so far:**
- S4: Tier badges (visibility)
- S5: Declarative lifecycle config (flexibility)
- S6: Observable signals (data foundation)

**What we're building now:**
- S7: Automatic advancement (intelligence)

**What this unlocks:**
- S8: Custom lifecycle models (academic, creative, research)
- S9: Cross-grove federation (tier mapping)
- S10: AI curation agents (propose rules, learn patterns)
- S11: Attribution economy (token rewards)

**This sprint is the HINGE.** Without auto-advancement:
- We're a knowledge CAPTURE tool (static)
- Operators are bottlenecks (manual curation)
- Can't scale to millions of sprouts

**With auto-advancement:**
- We're a knowledge METABOLISM (living system)
- Quality EMERGES from usage (no gatekeepers)
- Scales infinitely (AI curators)

**The thesis being proven:** "AI agents as curators, not just generators."

**Your job as PM:** Craft a brief that honors this vision while shipping incremental, testable value. Phase 3 of 7. Nail the engine. Build the substrate. Trust the process.

---

## References

| Document | Purpose |
|----------|---------|
| [S7 Sprint Page](https://www.notion.so/2ea780a78eef8129a586f3035e4f8947) | Sprint details, blockers |
| [EPIC Overview](https://www.notion.so/2ea780a78eef8175acbcf077a0c19ecb) | 7-phase vision, strategic context |
| S5-LifecycleEngine PRODUCT_BRIEF_FINAL.md | Pattern reference (schema, ExperienceConsole) |
| S5-LifecycleEngine UX_CHIEF_APPROVAL.md | json-render strategy, v1.0 patterns |
| `.agent/roles/user-experience-chief-DRIFT_DETECTOR.md` | Architecture guardrails |
| `CLAUDE.md` | v1.0 architecture, drift detector summary |

---

## Quick Reference: json-render Pattern

**What it is:** Locally-owned pattern (not npm package) for declarative UI rendering.

**Three pieces:**
1. **Catalog:** Zod schemas define valid structures (`AdvancementRuleSchema`)
2. **Registry:** React components render catalog types (`RuleCard`, `CriteriaRow`)
3. **Renderer:** Tree walker connects catalog → components

**Where it lives:** `src/surface/components/modals/SproutFinishingRoom/json-render/`

**Strategic value:**
- AI-generated configs constrained by catalog (no hallucinations)
- Visual builders with drag-and-drop (Phase 4+)
- Template galleries (Phase 4+)
- Substrate for intelligence (AI rule generation in Phase 6)

**S7 recommendation:** Basic JSON display (Phase 3), full catalog (Phase 4+).

---

*Strategic Briefing prepared by User Experience Chief*  
*"Quality emerges from usage, not gatekeeping."*  
*Next: Product Brief → Foundation Loop → UX Chief Approval → Development*
