# Product Brief: Automatic Tier Advancement Engine

**Version:** 1.0
**Status:** Draft
**Sprint Target:** S7-SL-AutoAdvancement
**EPIC:** Knowledge as Observable System (Phase 3 of 7)
**PM:** Product Manager Agent
**Reviewed by:** UX Chief ✅ (2026-01-16), UI/UX Designer ✅ (2026-01-16)
**Date:** 2026-01-16

---

## Executive Summary

We are building an **automatic tier advancement engine** that progresses sprout tiers based on observable usage signals, eliminating the manual curation bottleneck and enabling Grove to scale as a living knowledge metabolism system.

**The pivot:** From operators manually reviewing every sprout for promotion → System automatically advances tiers based on declarative rules and observable usage patterns.

**Strategic unlock:** This transforms Grove from a knowledge **capture** tool (static) into a knowledge **metabolism** system (living), where quality emerges from community use rather than gatekeeping.

**Vision alignment:** "AI agents as curators, not just generators" - This sprint proves that thesis by demonstrating emergent quality through automatic curation.

---

## Problem Statement

### Current State (Manual Curation Bottleneck)

**The problem:**
- Sprout tier progression (seed → sprout → sapling → tree → grove) currently requires **manual operator promotion**
- Operators must review each sprout individually to decide tier advancement
- **No systematic criteria** - promotion decisions are subjective and inconsistent
- **Doesn't scale** - With 100+ sprouts, operators become bottleneck; with 10,000+ sprouts, manual curation becomes impossible

**User pain:**
- **Gardeners:** Don't understand why valuable sprouts remain "seed" tier despite heavy use
- **Operators:** Overwhelmed by promotion queue, inconsistent criteria, decision fatigue
- **Organizations:** Can't demonstrate "emergent quality" thesis - quality still requires human gatekeepers

**Strategic blocker:**
- **Phase 4-7 blocked:** Multi-model lifecycles, cross-grove federation, AI curation agents, and attribution economy all require automatic tier advancement as foundation
- **Thesis unproven:** "Quality emerges from usage" requires evidence - manual curation doesn't prove this

### Root Cause

Tier advancement logic is **procedural** (human decisions) rather than **declarative** (rules + observable data). We built the observability infrastructure (S6: signals) and configuration layer (S5: lifecycle config) but haven't connected them to automatic action.

---

## Proposed Solution

### High-Level Architecture

**Automatic Tier Advancement Pipeline:**

```
┌─────────────────────┐
│ Observable Signals  │ ← S6: retrievals, citations, utility scores
│ (Supabase table)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Advancement Rules   │ ← S7: Declarative criteria (THIS SPRINT)
│ (Supabase config)   │    "seed → sprout IF retrievals >= 10"
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Evaluation Engine   │ ← Pure TypeScript, testable
│ (Core logic)        │    evaluateAdvancement(sprout, signals, rules)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Automatic Actions   │ ← Daily batch cron job
│ (Tier updates)      │    Update sprout.tier, log event, notify
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Operator Controls   │ ← ExperienceConsole
│ (Audit & Override)  │    View history, disable rules, manual override
└─────────────────────┘
```

### Core Mechanism

**Advancement Rule Example:**
```json
{
  "id": "seed-to-sprout-basic",
  "fromTier": "seed",
  "toTier": "sprout",
  "criteria": [
    { "signal": "retrievals", "operator": ">=", "threshold": 10 },
    { "signal": "citations", "operator": ">=", "threshold": 3 }
  ],
  "logicOperator": "AND",
  "isEnabled": true
}
```

**What happens:**
1. **Daily batch (2am):** System evaluates all sprouts with current tier = "seed"
2. **Check signals:** Get observable data (retrievals: 15, citations: 5)
3. **Evaluate criteria:** Both conditions met (15 >= 10 AND 5 >= 3)
4. **Auto-advance:** Update sprout.tier = "sprout", sprout.promotedAt = now()
5. **Log event:** Record which rule fired, signal values, timestamp (full provenance)
6. **Notify operator:** Daily digest "10 sprouts auto-advanced to sprout tier"
7. **Operator audits:** Reviews advancement history, overrides if incorrect

---

## User Value Proposition

### For Gardeners (Sprout Creators)
**Efficiency gains:**
- Valuable sprouts advance automatically based on community use (no waiting for operator review)
- Clear, transparent criteria (know what it takes to reach next tier)
- Notification when sprout advances ("Your research note earned tree tier through 50+ retrievals")

**Enlightenment gains:**
- See which content resonates (high retrievals = community finds it valuable)
- Understand quality through USE patterns, not subjective judgment
- Trust emerges from transparent, observable criteria

### For Operators (Grove Administrators)
**Efficiency gains:**
- 10x productivity (audit exceptions vs. review every sprout)
- Consistent criteria (rules apply uniformly, no human bias)
- Bulk management (enable/disable rules, rollback bad advancements)

**Enlightenment gains:**
- Discover quality patterns ("sprouts with 20+ retrievals + 5+ citations = high value")
- Steward quality (adjust thresholds, refine rules) without gatekeeping
- Evidence-based curation (see which signals predict long-term value)

### For Organizations
**Strategic value:**
- **Prove thesis:** "Quality emerges from usage" demonstrated with observable data
- **Scale infinitely:** Automatic curation works for 10 or 10,000,000 sprouts
- **Foundation for Phase 4-7:** Enables multi-model lifecycles, federation, AI curation, attribution economy

**DEX embodiment:**
- **Declarative sovereignty:** Operators change advancement behavior via config, not code
- **Provenance infrastructure:** Full audit trail for every auto-advancement (who, when, why, which rule)
- **Organic scalability:** New rules, new signals, new lifecycle models - all extend without core changes

---

## Strategic Value

### How This Advances Grove's Mission

**Mission:** Build exploration architecture that enables decentralized knowledge metabolism without platform middlemen.

**S7 contribution:**
1. **Proves "emergent quality" thesis** - Quality comes from observable usage, not human gatekeepers
2. **Enables substrate for intelligence** - Automatic curation is foundation for AI curator agents (Phase 6)
3. **Demonstrates DEX at scale** - Declarative rules + observable signals = behavior change without code
4. **Unlocks federation** - Automatic tier advancement required for cross-grove tier mapping (Phase 5)

### Substrate for Future Work (Phases 4-7)

**Phase 4 (S8-MultiModel):** Custom lifecycle models need automatic advancement
- Academic grove: "draft → peer-reviewed → published → canonical" with citation thresholds
- Creative grove: "sketch → prototype → refined → released" with utility score thresholds

**Phase 5 (S9-Federation):** Cross-grove tier mapping needs automatic synchronization
- My grove: "tree tier" (50+ retrievals) ≈ Your grove: "published tier" (10+ citations)
- Auto-advancement keeps mappings consistent

**Phase 6 (S10-AICuration):** AI agents propose advancement rules
- AI observes patterns: "Sprouts with 20+ retrievals + 5+ citations advance 90% of time"
- AI generates rule: "seed → sprout IF retrievals >= 20 AND citations >= 5"
- Operator reviews and enables rule via ExperienceConsole

**Phase 7 (S11-Attribution):** Token rewards tied to tier
- Sprout at "tree tier" earns 10x attribution tokens vs. "seed tier"
- Auto-advancement drives token distribution (value flows to quality content)

**Without S7, none of these phases work.**

---

## Scope

### In Scope (v1.0 - This Sprint)

#### Core Engine
- [x] `advancement_rules` Supabase table (JSONB payload with meta + criteria)
- [x] `advancement_events` log table (full provenance: rule ID, signals, timestamp)
- [x] `advancementEvaluator.ts` pure TypeScript evaluation engine
- [x] Daily batch cron job (2am UTC) to evaluate all sprouts
- [x] Integration with S6 observable signals (mock signals if S6 not ready)

#### ExperienceConsole UI
- [x] `AdvancementRuleCard` - Grid card (follows FeatureFlagCard pattern)
- [x] `AdvancementRuleEditor` - Inspector panel with criteria builder
- [x] `AdvancementHistoryPanel` - Recent auto-advancements with audit trail
- [x] Registry entry in `component-registry.ts` with `advancement-rule` type
- [x] `useAdvancementRuleData()` hook for CRUD operations

#### Operator Controls
- [x] Enable/disable rule toggle in editor
- [x] Manual override UI (force tier change, bypasses rules)
- [x] Bulk rollback (undo all advancements from specific rule)
- [x] Daily digest notification (email/Slack: "10 sprouts advanced today")

#### Validation & Testing
- [x] Type guards for `AdvancementRule` schema
- [x] Unit tests for evaluation engine (pure function, testable)
- [x] E2E test: Create rule → trigger batch → verify tier change → check audit log

### Explicitly Out of Scope (Defer to Later Phases)

#### Phase 4+ (S8-MultiModel)
- [ ] Visual rule builder (json-render powered drag-and-drop)
- [ ] Template gallery (common rule patterns)
- [ ] A/B testing framework (compare rule variants)

#### Phase 6 (S10-AICuration)
- [ ] AI-generated advancement rules
- [ ] Pattern learning from historical advancements
- [ ] AI confidence scores for proposed rules

#### Phase 5 (S9-Federation)
- [ ] Cross-grove tier mapping
- [ ] Federated advancement synchronization

#### Phase 7 (S11-Attribution)
- [ ] Token rewards for tier advancement
- [ ] Economic incentives for quality content

### Non-Goals
- ❌ Real-time advancement (on every signal update) → Batch processing is sufficient for v1
- ❌ Complex ML-based criteria → Simple threshold rules prove the concept
- ❌ Custom icons/animations for tier changes → Use existing TierBadge component
- ❌ Breaking existing tier display → Must maintain visual parity with S4

---

## User Flows

### Flow 1: Operator Creates Advancement Rule

**Persona:** Alex (Operator), managing academic research grove

**Context:** Alex wants sprouts to automatically advance from "hypothesis" to "validated" tier when they receive 10+ citations from other research notes.

**Steps:**
1. Alex opens `/bedrock/consoles/experience` → selects "Advancement Rules" tab
2. Clicks "Create New Rule" button
3. Editor panel opens with form:
   ```
   Rule Name: [Hypothesis to Validated (Citation Threshold)]
   From Tier: [hypothesis ▼]
   To Tier: [validated ▼]

   Criteria:
   [citations] [>=] [10]
   [+ Add Criterion]

   Logic: [AND ▼]
   Status: [Enabled ✓]
   ```
4. Alex fills in:
   - From tier: "hypothesis"
   - To tier: "validated"
   - Criterion: citations >= 10
5. Clicks "Save Rule"
6. System validates:
   - ✓ Both tiers exist in lifecycle config
   - ✓ Criterion uses valid signal type
   - ✓ Threshold is positive number
7. Rule created, appears in grid as "Active" card
8. Daily batch will now evaluate this rule for all "hypothesis" tier sprouts

**Success criteria:**
- Rule persisted to Supabase `advancement_rules` table
- Card appears in ExperienceConsole grid with green "Active" status bar
- Next batch run (2am) will evaluate rule

---

### Flow 2: Sprout Auto-Advances (Daily Batch)

**Persona:** System (Daily Cron Job), evaluating advancement rules

**Context:** It's 2am UTC. System runs daily batch to check if any sprouts meet advancement criteria.

**Steps:**
1. Cron triggers `runAdvancementEvaluation()` function
2. System queries Supabase:
   ```sql
   SELECT * FROM advancement_rules WHERE is_enabled = true;
   SELECT * FROM sprouts WHERE tier != 'grove'; -- Not already at max tier
   SELECT * FROM observable_signals; -- Get latest signal data
   ```
3. For each sprout:
   - Get current tier (e.g., "hypothesis")
   - Find applicable rules (fromTier = "hypothesis")
   - Evaluate criteria against signals:
     ```typescript
     sprout: { id: '123', tier: 'hypothesis' }
     signals: { citations: 15, retrievals: 25, ... }
     rule: { fromTier: 'hypothesis', toTier: 'validated', criteria: [{ signal: 'citations', operator: '>=', threshold: 10 }] }

     evaluation: 15 >= 10 → TRUE
     ```
   - If match found:
     ```typescript
     // Update sprout
     UPDATE sprouts SET tier = 'validated', promoted_at = NOW() WHERE id = '123';

     // Log event
     INSERT INTO advancement_events (sprout_id, rule_id, from_tier, to_tier, criteria_met, signal_values, timestamp)
     VALUES ('123', 'rule-abc', 'hypothesis', 'validated', [...], {...}, NOW());
     ```
4. Collect all advancements: `{ advanced: 10, failed: 2, skipped: 100 }`
5. Queue notification:
   ```
   Subject: Daily Advancement Report
   Body: "10 sprouts auto-advanced today:
   - 5 hypothesis → validated
   - 3 validated → published
   - 2 published → canonical

   View audit trail: /bedrock/consoles/experience?tab=advancement-history"
   ```
6. Operator receives email digest in morning

**Success criteria:**
- Sprout tier updated in database
- Advancement event logged with full provenance
- TierBadge in UI reflects new tier (cache invalidated)
- Operator notified via daily digest

---

### Flow 3: Operator Audits Auto-Advancement

**Persona:** Alex (Operator), reviewing morning advancement digest

**Context:** Alex receives email "10 sprouts auto-advanced today" and wants to verify correctness.

**Steps:**
1. Alex clicks email link → opens ExperienceConsole "Advancement History" panel
2. See list of recent advancements:
   ```
   Jan 16, 2am
   ├─ "Quantum Entanglement Notes" → validated (citations: 15 >= 10) [Rule: hypothesis-to-validated]
   ├─ "CRISPR Gene Editing" → validated (citations: 12 >= 10) [Rule: hypothesis-to-validated]
   └─ "Dark Matter Theory" → published (citations: 25 >= 20) [Rule: validated-to-published]
   ```
3. Alex notices "Dark Matter Theory" advanced to "published" but has low utility score
4. Clicks row → detail panel shows:
   ```
   Advancement: Dark Matter Theory
   From: validated → To: published
   Rule: validated-to-published-citation-threshold
   Criteria Met:
   ✓ citations >= 20 (actual: 25)
   ✓ retrievals >= 50 (actual: 55)

   Signals:
   - citations: 25
   - retrievals: 55
   - queryDiversity: 0.3 (low)
   - utilityScore: 0.4 (low)

   [Manual Override: Revert to Validated]
   ```
5. Alex clicks "Revert to Validated" button
6. Confirmation modal:
   ```
   Revert "Dark Matter Theory" to validated tier?
   This will:
   - Change tier: published → validated
   - Log manual override event
   - Keep advancement event for audit trail

   Reason (optional): [Low utility score despite citations]

   [Cancel] [Revert]
   ```
7. Alex adds reason, clicks "Revert"
8. System logs override event, updates sprout tier
9. Alex also disables "validated-to-published" rule to refine criteria:
   - Opens rule editor
   - Adds criterion: `utilityScore >= 0.6`
   - Saves updated rule
   - Future evaluations use refined criteria

**Success criteria:**
- Operator can view full advancement history with provenance
- Manual override reverses auto-advancement
- Override event logged separately (audit trail preserved)
- Operator can refine rules based on false positives

---

### Flow 4: Gardener Sees Tier Change

**Persona:** Jordan (Gardener), created research note 2 weeks ago

**Context:** Jordan's note "Quantum Entanglement Basics" has been retrieved 15 times and cited in 5 other notes. Daily batch advances it from "seed" to "sprout" tier.

**Steps:**
1. Jordan opens `/explore` to check on sprouts
2. Sees notification badge: "1 sprout advanced" (in-app, not email)
3. Clicks badge → modal shows:
   ```
   🌱 Your sprout advanced!

   "Quantum Entanglement Basics"
   seed → sprout (Jan 16)

   Why it advanced:
   ✓ Retrieved 15 times (threshold: 10+)
   ✓ Cited 5 times (threshold: 3+)

   What this means:
   Sprout tier content is visible to your grove and trusted collaborators.
   Keep developing this note to reach sapling tier (50+ retrievals).

   [View Full History] [Dismiss]
   ```
4. Jordan hovers over TierBadge in GardenTray → tooltip shows:
   ```
   🌱 Sprout Tier
   Advanced automatically on Jan 16
   Based on community usage (15 retrievals, 5 citations)
   ```
5. Jordan feels validated that community finds note valuable
6. Jordan continues developing note, motivated by clear advancement path

**Success criteria:**
- Gardener sees in-app notification of advancement
- Clear explanation of WHY advancement occurred (provenance)
- Motivation to continue developing content (gamification)
- Trust in system (transparent, observable criteria)

---

### Flow 5: Operator Bulk Rollback (Error Recovery)

**Persona:** Alex (Operator), discovers bad rule caused incorrect advancements

**Context:** Alex enabled rule "seed-to-tree-fast-track" with overly permissive criteria (retrievals >= 1). 50 sprouts incorrectly advanced from seed → tree overnight.

**Steps:**
1. Alex sees morning digest: "50 sprouts auto-advanced today" (unusual spike)
2. Opens Advancement History panel → sees all 50 from same rule
3. Clicks rule name → opens rule detail:
   ```
   Rule: seed-to-tree-fast-track
   Criteria: retrievals >= 1 (TOO LOW)
   Recent Advancements: 50 (Jan 16)
   Status: [Enabled] ← Problem!
   ```
4. Alex immediately disables rule to prevent future bad advancements
5. Clicks "Bulk Rollback" button
6. Confirmation modal:
   ```
   Rollback all advancements from "seed-to-tree-fast-track"?

   This will revert 50 sprouts:
   - From: tree
   - To: seed (original tier)
   - Time window: Last 24 hours

   Audit trail will preserve:
   - Original advancement events (marked as "rolled back")
   - Rollback event (reason, timestamp, operator)

   Reason: [Rule criteria too permissive (retrievals >= 1)]

   [Cancel] [Rollback 50 Sprouts]
   ```
7. Alex adds reason, clicks "Rollback"
8. System processes:
   ```typescript
   // For each affected sprout
   UPDATE sprouts SET tier = 'seed', promoted_at = original_promoted_at WHERE id IN (...);

   // Log bulk rollback event
   INSERT INTO advancement_events (type: 'bulk_rollback', rule_id: '...', count: 50, reason: '...', operator_id: 'alex');
   ```
9. All 50 sprouts reverted to seed tier
10. Alex refines rule criteria: `retrievals >= 10` (more reasonable threshold)
11. Re-enables rule for future evaluations

**Success criteria:**
- Operator can identify problematic rule quickly (spike in advancements)
- Bulk rollback reverses all advancements from that rule
- Full audit trail preserved (both advancements and rollback)
- Operator can refine rule and re-enable

---

## Technical Considerations

### Architecture Alignment

**GroveObject Model:**
```typescript
// advancement-rule is a new GroveObjectType
type GroveObjectType =
  | 'sprout'
  | 'feature-flag'
  | 'lifecycle-config'
  | 'advancement-rule'  // ← NEW
  | ...;

// Follows JSONB meta + payload pattern
interface AdvancementRuleObject {
  id: string;
  type: 'advancement-rule';
  meta: {
    status: 'active' | 'draft' | 'archived';
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    title: string;
    description?: string;
  };
  payload: AdvancementRulePayload;
}

interface AdvancementRulePayload {
  lifecycleModelId: string;  // Reference to lifecycle config
  fromTier: string;
  toTier: string;
  criteria: Criterion[];
  logicOperator: 'AND' | 'OR';
  isEnabled: boolean;
}

interface Criterion {
  signal: 'retrievals' | 'citations' | 'queryDiversity' | 'utilityScore';
  operator: '>=' | '>' | '==' | '<' | '<=';
  threshold: number;
}
```

**Supabase Schema:**
```sql
-- Main table (follows feature-flag pattern)
CREATE TABLE advancement_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta JSONB NOT NULL DEFAULT '{}',
  payload JSONB NOT NULL DEFAULT '{}'
);

-- RLS policies
ALTER TABLE advancement_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON advancement_rules FOR SELECT USING (true);
CREATE POLICY "Authenticated write access" ON advancement_rules FOR ALL USING (auth.role() = 'authenticated');

-- Audit log table (provenance)
CREATE TABLE advancement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprout_id UUID NOT NULL REFERENCES sprouts(id),
  rule_id UUID REFERENCES advancement_rules(id),
  from_tier TEXT NOT NULL,
  to_tier TEXT NOT NULL,
  criteria_met JSONB NOT NULL,  -- Array of { signal, operator, threshold, actual }
  signal_values JSONB NOT NULL, -- Snapshot of all signals at evaluation time
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type TEXT NOT NULL DEFAULT 'auto-advancement', -- 'auto-advancement' | 'manual-override' | 'bulk-rollback'
  operator_id TEXT,  -- If manual override/rollback
  reason TEXT        -- Optional explanation
);

CREATE INDEX idx_advancement_events_sprout ON advancement_events(sprout_id);
CREATE INDEX idx_advancement_events_rule ON advancement_events(rule_id);
CREATE INDEX idx_advancement_events_timestamp ON advancement_events(timestamp DESC);
```

**ExperienceConsole Registry:**
```typescript
// src/bedrock/config/component-registry.ts
export const EXPERIENCE_TYPE_REGISTRY = {
  'feature-flag': { ... },
  'lifecycle-config': { ... },
  'advancement-rule': {
    label: 'Advancement Rules',
    card: AdvancementRuleCard,
    editor: AdvancementRuleEditor,
    allowMultipleActive: true,  // Multiple rules can be active
    icon: 'trending_up',
    description: 'Automatic tier advancement criteria',
  },
  // ...
};
```

**Integration with S5 (Lifecycle Config):**
- Advancement rules reference `lifecycleModelId` from S5
- `fromTier` and `toTier` must exist in referenced lifecycle model
- Validation: Query lifecycle config to verify tier IDs before saving rule

**Integration with S6 (Observable Signals):**
- Evaluation engine reads from `observable_signals` table
- Signal types in criteria must match available signals
- Graceful degradation: If signal missing, skip that criterion (don't fail evaluation)

### Hybrid Cognition Requirements

**Local (Routine - 7B Models Can Handle):**
- ✅ Tier lookup from cached config (simple JSONB query)
- ✅ Simple criteria evaluation (`retrievals >= 10` is boolean logic)
- ✅ Badge rendering with current tier (deterministic)

**Cloud (Pivotal - Requires API):**
- ☁️ Complex criteria evaluation (queryDiversity scoring, ML-based utility scores)
- ☁️ Batch processing coordination (orchestrate 1000+ evaluations)
- ☁️ Rule editing UI (complex validation, preview evaluation)
- ☁️ Future: AI-generated rules (Phase 6, requires Claude API for pattern learning)

**Fallback Strategy:**
- If cloud unavailable: Skip complex criteria (queryDiversity, utilityScore)
- Evaluate only simple criteria (retrievals, citations - raw counts)
- Log degraded evaluation event for operator review
- Manual override always available (local-first sovereignty)

### Dependencies

**Hard Dependencies:**
1. **S5-LifecycleEngine (COMPLETE):**
   - Lifecycle config schema (tier definitions)
   - ExperienceConsole factory pattern
   - useGroveData hook pattern

2. **S6-ObservableSignals (IN PROGRESS):**
   - `observable_signals` table schema
   - Signal types: retrievals, citations, queryDiversity, utilityScore
   - **Mitigation:** Use mock signals if S6 delayed (hardcoded values in evaluation engine)

**Soft Dependencies:**
1. **TierBadge Component (EXISTS):**
   - No changes needed
   - Cache invalidation after tier update

2. **Notification System (FUTURE):**
   - Email/Slack integration for daily digest
   - **Mitigation:** Log events to console if notification system not ready

**Integration Points:**
```typescript
// S6 Integration (mock if not ready)
function getObservableSignals(sproutId: string): ObservableSignals {
  // Production: Query Supabase
  // Mock: Return { retrievals: 50, citations: 10, queryDiversity: 0.7, utilityScore: 0.8 }
}

// S5 Integration (exists)
function getLifecycleModel(modelId: string): LifecycleModel {
  // Query S5 lifecycle_configs table
}

// TierBadge Integration (exists)
function invalidateTierCache(sproutId: string): void {
  // Trigger useGroveData revalidation
}
```

---

## DEX Pillar Verification

| Pillar | Implementation | Evidence |
|--------|----------------|----------|
| **Declarative Sovereignty** | Advancement behavior defined in Supabase config, not code. Operators change thresholds via ExperienceConsole without deployment. | `advancement_rules` table stores criteria as JSONB. Evaluation engine reads config at runtime. No hardcoded advancement logic. |
| **Capability Agnosticism** | Evaluation engine is pure TypeScript. Works regardless of which model/agent executes the curation logic. Rules don't assume specific AI capabilities. | `advancementEvaluator.ts` is model-independent. Criteria use generic signals (counts, scores), not model-specific features. Fallback for missing signals (degrade gracefully). |
| **Provenance as Infrastructure** | Every auto-advancement logged with: rule ID, criteria met, signal values, timestamp. Full audit trail for all tier changes (auto + manual). | `advancement_events` table captures full context. Operators see "why" in UI. Rollback preserves original events (marked "rolled back"). Gardeners see advancement reason in tooltip. |
| **Organic Scalability** | New advancement rules added via ExperienceConsole (no code changes). New signal types extend schema (add to Criterion enum). New lifecycle models reference existing rules (foreign key). | EXPERIENCE_TYPE_REGISTRY supports `allowMultipleActive: true`. Criteria schema extensible (add signal types). No core engine changes for new models (just reference lifecycleModelId). |

**DEX Grade:** ✅ EXCELLENT - All 4 pillars naturally embodied in design.

---

## Advisory Council Input

### Consulted Advisors

#### Park (Technical Feasibility)
**Question:** Can we launch without S6 using mock signals? Is hybrid cognition architecture sufficient?

**Input:**
> "Hybrid architecture is essential; 7B models have limits."

**Application:**
- ✅ **Mock signals strategy approved:** Ship S7 with hardcoded signal values, integrate S6 when ready
- ✅ **Hybrid cognition defined:** Simple criteria (local 7B), complex criteria (cloud API)
- ✅ **Graceful degradation:** Skip missing signals, don't fail entire evaluation

---

#### Adams (Engagement/Retention)
**Question:** Should operators APPROVE or AUDIT auto-advancements? What notification model drives engagement?

**Input:**
> "Drama comes from meaningful choices with consequences."

**Application:**
- ✅ **Audit model (not approve):** Auto-advance by default, operators override exceptions
- ✅ **Daily digest:** "10 sprouts advanced" creates engagement loop (morning check-in)
- ✅ **Provenance UI:** Tooltip shows "why" advancement occurred (meaningful choice to override)
- ✅ **Gamification:** Clear advancement path motivates gardeners (retrievals → tier progression)

**Engagement loop:**
1. Morning: Operator checks digest → reviews advancements
2. Afternoon: Gardener sees tier badge update → feels validated
3. Evening: Gardener develops content → aims for next tier threshold
4. Repeat: Daily cycle of advancement → review → motivation

---

#### Taylor (Community Dynamics)
**Question:** How does auto-advancement affect community trust? Should operators be gatekeepers or stewards?

**Input:**
> "The human community may matter more than the agent simulation."

**Application:**
- ✅ **Exception handling model:** Operators steward quality (audit/override), don't gatekeep (approve every change)
- ✅ **Community trust:** Transparent criteria build trust ("I know what it takes to advance")
- ✅ **Self-regulation:** Community usage patterns drive tier advancement (no centralized authority)
- ✅ **Operator role:** Refine rules based on observed patterns, handle edge cases

**Community mental model:** "Innocent until proven guilty" (auto-advance by default, audit outliers)

**Pattern comparison:**
- Wikipedia: Anyone edits, admins revert abuse ✅ (similar to our audit model)
- Traditional publishing: Editors gatekeep all content ❌ (not our model)

---

#### Short (Narrative/Diary UI)
**Question:** How do gardeners discover why a sprout advanced? What's the narrative voice?

**Input:**
> "Voice differentiation requires craft; structure is key."

**Application:**
- ✅ **Progressive disclosure:** Tooltip shows brief reason, click for full audit trail
- ✅ **Narrative voice:** "This sprout earned tree tier through community use" (not robotic "criteria met")
- ✅ **Structure:** Tier badge → tooltip → audit trail (3 levels of detail)
- ✅ **Future (Phase 6):** AI narrator explains advancement in natural language

**Provenance UI hierarchy:**
1. **Tier badge:** Visual indicator (🌰 → 🌱)
2. **Tooltip (hover):** "Advanced to sprout on Jan 16 (15 retrievals, 5 citations)"
3. **Audit trail (click):** Full rule, signal values, operator who enabled rule, timestamp

---

### Known Tensions

#### Tension 1: Ship Fast vs. Ship Right
**Conflict:** Should we wait for S6 (observable signals) or ship with mocks?

**Resolution:**
- **Park's constraint:** "7B models have limits" → Can't build complex signal scoring in S7
- **Ship strategy:** Mock signals prove engine works, S6 adds real data when ready
- **MVP quality:** Engine must work correctly (unit tests), UI can be basic (no visual builder)

**Recommendation:** Ship S7 with mock signals (Option B), integrate S6 later.

---

#### Tension 2: Approve vs. Audit
**Conflict:** Should operators approve every auto-advancement or only audit exceptions?

**Resolution:**
- **Adams (engagement):** Approve queue kills engagement ("too much friction")
- **Taylor (community):** Audit model builds trust ("transparent, self-regulating")
- **Efficiency:** Audit = 10x productivity (operators steward, don't gatekeep)

**Recommendation:** Audit model (Option B) - Trust system, override outliers.

---

#### Tension 3: Event-Driven vs. Batch
**Conflict:** Should advancement run immediately on signal update or daily batch?

**Resolution:**
- **Park (feasibility):** Event-driven causes race conditions, high load
- **User experience:** Daily batch creates morning engagement ritual (check digest)
- **Simplicity:** Cron job easier to debug than event sourcing

**Recommendation:** Daily batch at 2am UTC (Option B).

---

#### Tension 4: Visual Builder Now vs. Later
**Conflict:** Should we build json-render visual rule builder in S7 or defer to S8?

**Resolution:**
- **Strategic:** "Build substrate, not just features" → Prove engine first, add polish later
- **Scope control:** S7 is Phase 3 of 7 → Nail core mechanism, defer visual builder to Phase 4
- **Pattern momentum:** json-render already used in S1/S2 → Add to S8 when building template gallery

**Recommendation:** JSON display in S7, visual builder in S8 (Option B).

---

## Success Metrics

### Primary Metrics (Phase 3 Launch)

**Functional Success:**
- [ ] **Auto-advancement rate:** 80%+ of sprouts with qualifying signals auto-advance within 24 hours
- [ ] **False positive rate:** <5% of auto-advancements require manual override (incorrect tier)
- [ ] **Operator override rate:** <10% of all advancements are manual overrides (system mostly correct)
- [ ] **Evaluation latency:** <100ms per sprout (can process 1000+ sprouts in daily batch)

**Adoption Success:**
- [ ] **Rules created:** 3+ advancement rules enabled within first week
- [ ] **Operator engagement:** 90%+ of operators check daily advancement digest
- [ ] **Gardener awareness:** 70%+ of gardeners understand tier advancement criteria (survey)
- [ ] **Trust metric:** 80%+ of operators trust auto-advancement after 2 weeks (no disable rate spike)

**Technical Success:**
- [ ] **Zero regressions:** TierBadge display identical to pre-S7 (visual parity)
- [ ] **Audit completeness:** 100% of auto-advancements logged with full provenance
- [ ] **Rollback success:** Bulk rollback restores previous state with zero data loss
- [ ] **S6 integration:** Smooth transition from mock signals → real signals when S6 completes

### Secondary Metrics (Ecosystem Health)

**Quality Emergence:**
- [ ] **Median tier advancement time:** Trending downward (seed → sprout faster as rules optimize)
- [ ] **High-value content identified:** Sprouts with 50+ retrievals reach tree tier within 1 week
- [ ] **Low-value content filtered:** Sprouts with <5 retrievals remain seed tier (correct filtering)

**Operator Productivity:**
- [ ] **Time savings:** 10x reduction in manual promotion time (5 min/sprout → 30 sec audit)
- [ ] **Rule refinement:** Operators iterate on criteria 2-3x per week (learning patterns)
- [ ] **Exception handling:** Operators spend 80% time on outliers, 20% on routine (Pareto)

**Gardener Motivation:**
- [ ] **Content development:** Gardeners with auto-advanced sprouts publish 20% more content
- [ ] **Tier awareness:** 60%+ of gardeners check tier advancement path before creating sprout
- [ ] **Community engagement:** Retrievals increase 15% (gardeners reference higher-tier content more)

### Strategic Metrics (Phase 4-7 Foundation)

**Substrate Validation:**
- [ ] **Phase 4 readiness:** Custom lifecycle models can reuse advancement engine (no core changes)
- [ ] **Phase 6 readiness:** AI agents can propose rules using existing schema (catalog constrains output)
- [ ] **Phase 7 readiness:** Token rewards can reference tier from auto-advancement events (provenance)

**DEX Embodiment:**
- [ ] **Zero code deployments:** All rule changes via ExperienceConsole (config-only updates)
- [ ] **Full provenance:** 100% of tier changes traceable to rule + signals (audit trail)
- [ ] **Organic growth:** New signal types added without core engine changes (schema extension)

---

## Appendix: UX Concepts

### Wireframes Needed (UI/UX Designer)

#### 1. AdvancementRuleCard (Grid View)

**Pattern reference:** FeatureFlagCard.tsx

**Visual structure:**
```
┌─────────────────────────────────────────────────┐
│ ████████████████████ (status bar: green/gray)  │
├─────────────────────────────────────────────────┤
│  ⭐ (favorite)                                  │
│  ┌────┐                                         │
│  │ ⬆️  │  Seed to Sprout (Basic)                │
│  │    │  seed-to-sprout-basic                   │
│  └────┘                                         │
│                                                  │
│  Auto-advance sprouts with 10+ retrievals       │
│                                                  │
│  ┌──────────┐  ┌──────────┐                    │
│  │ 🌰 → 🌱  │  │ 2 criteria│                    │
│  └──────────┘  └──────────┘                    │
│                                                  │
│  [Enabled ✓]           [Botanical]              │
└─────────────────────────────────────────────────┘
```

**Key elements:**
- Status bar: Green (enabled), Gray (disabled)
- Icon: Up arrow (⬆️) for advancement
- Title: Rule name (user-defined)
- ID: Rule slug (immutable)
- Description: Plain English criteria summary
- Badge 1: Tier transition (🌰 → 🌱)
- Badge 2: Criteria count
- Footer: Enable/disable toggle + lifecycle model reference

---

#### 2. AdvancementRuleEditor (Inspector Panel)

**Pattern reference:** FeatureFlagEditor.tsx, SystemPromptEditor.tsx

**Sections:**

**A. Status Banner (if enabled):**
```
┌─────────────────────────────────────────────────┐
│ 🟢 Rule Enabled                                 │
│ This rule is actively evaluating sprouts        │
│                                       [Disable] │
└─────────────────────────────────────────────────┘
```

**B. Identity:**
```
Rule Name: [Seed to Sprout (Basic)              ]
Description: [Auto-advance sprouts with...      ]
Rule ID: seed-to-sprout-basic (immutable)
```

**C. Tier Transition:**
```
From Tier: [seed      ▼]
To Tier:   [sprout    ▼]

Lifecycle Model: [Botanical Growth ▼]
```

**D. Criteria Builder:**
```
Criteria (All must be met):

[retrievals] [>=] [10]  [x]
[citations]  [>=] [3 ]  [x]

[+ Add Criterion]

Logic: [AND ▼]  (How criteria combine)
```

**E. Preview (Live Evaluation):**
```
┌─────────────────────────────────────────────────┐
│ Preview: Test Against Sample Sprout            │
│                                                  │
│ Sprout: "Quantum Basics" (current tier: seed)   │
│ Signals:                                         │
│   retrievals: 15  ✓ (>= 10)                     │
│   citations:  5   ✓ (>= 3)                      │
│                                                  │
│ Result: ✅ Would advance to sprout tier         │
└─────────────────────────────────────────────────┘
```

**F. Metadata:**
```
Created: Jan 15, 2026
Updated: Jan 16, 2026
Created By: alex@example.com
```

**G. Footer Actions:**
```
[Save Changes]
[Duplicate]  [Delete]
```

---

#### 3. AdvancementHistoryPanel (Audit Trail)

**Pattern reference:** SystemPromptEditor.tsx (changelog section)

**Visual structure:**
```
┌─────────────────────────────────────────────────┐
│ Advancement History                             │
│                                                  │
│ Filter: [Last 7 Days ▼] [All Rules ▼] [Search] │
│                                                  │
│ Jan 16, 2am (Batch Run)                         │
│ ├─ "Quantum Basics" → sprout                   │
│ │  Rule: seed-to-sprout-basic                   │
│ │  Criteria: retrievals: 15 (>=10), citations: 5│
│ │                                                │
│ ├─ "CRISPR Notes" → validated                  │
│ │  Rule: hypothesis-to-validated                │
│ │  Criteria: citations: 12 (>=10)               │
│ │                                                │
│ └─ "Dark Matter" → published [REVERTED]        │
│    Rule: validated-to-published                 │
│    Override By: alex@example.com                │
│    Reason: Low utility score despite citations  │
│                                                  │
│ Jan 15, 2am (Batch Run)                         │
│ └─ ... (show more)                              │
└─────────────────────────────────────────────────┘
```

**Key elements:**
- Grouped by batch run (timestamp)
- Each entry shows: sprout name, tier transition, rule used, criteria met
- Manual overrides marked with [REVERTED] badge
- Click row → expand for full signal values
- Filter by date range, rule, sprout

---

#### 4. Manual Override Modal

**Visual structure:**
```
┌─────────────────────────────────────────────────┐
│ Manual Tier Override                            │
│                                                  │
│ Sprout: "Dark Matter Theory"                    │
│ Current Tier: published                          │
│                                                  │
│ Override to: [validated ▼]                      │
│                                                  │
│ Reason (optional):                               │
│ [Low utility score despite high citations    ]  │
│                                                  │
│ This will:                                       │
│ • Change tier: published → validated            │
│ • Log manual override event                     │
│ • Keep advancement event for audit trail        │
│                                                  │
│               [Cancel]  [Override Tier]          │
└─────────────────────────────────────────────────┘
```

---

#### 5. Bulk Rollback Modal

**Visual structure:**
```
┌─────────────────────────────────────────────────┐
│ Bulk Rollback                                   │
│                                                  │
│ Rule: "seed-to-tree-fast-track"                 │
│ This will revert 50 sprouts:                     │
│                                                  │
│ • From: tree tier                                │
│ • To: seed tier (original)                      │
│ • Time window: Last 24 hours                     │
│                                                  │
│ Audit trail will preserve:                       │
│ • Original advancement events (marked rolled back)│
│ • Rollback event (reason, timestamp, operator)  │
│                                                  │
│ Reason:                                          │
│ [Rule criteria too permissive (retrievals >=1)]│
│                                                  │
│               [Cancel]  [Rollback 50 Sprouts]    │
└─────────────────────────────────────────────────┘
```

---

### Design Constraints (Quantum Glass v1.0)

**Design system:** Quantum Glass (NOT Living Glass v2)

**Tokens to use:**
```css
/* Status colors */
--status-enabled: #10b981;     /* green-500 */
--status-disabled: #6b7280;    /* gray-500 */

/* Advancement colors */
--advancement-success: #10b981; /* green-500 */
--advancement-override: #f59e0b; /* amber-500 */

/* Component tokens */
--neon-cyan: #06b6d4;
--glass-void: #030712;
--glass-border: rgba(255, 255, 255, 0.1);
--glass-solid: rgba(15, 23, 42, 0.8);
```

**Typography:**
```css
font-family: 'Inter', system-ui, sans-serif; /* UI text */
font-family: 'JetBrains Mono', monospace;    /* Rule IDs */
```

**Accessibility requirements:**
- [ ] Keyboard navigable (tab order: name → criteria → actions)
- [ ] ARIA labels on all interactive elements
- [ ] Focus indicators: `ring-2 ring-[var(--neon-cyan)]`
- [ ] Screen reader support for advancement events

---

## Appendix: Mock Signals Strategy

### Mock Signal Data (S6 Not Ready)

If S6-ObservableSignals not complete, use hardcoded mock values:

```typescript
// src/core/engine/advancementEvaluator.mock.ts

export const MOCK_SIGNALS: Record<string, ObservableSignals> = {
  'sprout-123': {
    retrievals: 50,
    citations: 10,
    queryDiversity: 0.7,
    utilityScore: 0.8,
    lastUpdated: '2026-01-15T10:00:00Z',
  },
  'sprout-456': {
    retrievals: 5,
    citations: 1,
    queryDiversity: 0.3,
    utilityScore: 0.4,
    lastUpdated: '2026-01-15T10:00:00Z',
  },
  // ... more mock data
};

export function getObservableSignals(sproutId: string): ObservableSignals {
  if (process.env.USE_MOCK_SIGNALS === 'true') {
    return MOCK_SIGNALS[sproutId] || DEFAULT_SIGNALS;
  }

  // Production: Query Supabase observable_signals table
  return querySupabase('observable_signals', { sproutId });
}
```

**Migration path:**
1. S7 ships with `USE_MOCK_SIGNALS=true`
2. S6 completes, adds `observable_signals` table
3. Set `USE_MOCK_SIGNALS=false` in production
4. Remove mock data in cleanup phase

---

## Appendix: Evaluation Engine Pseudocode

```typescript
// src/core/engine/advancementEvaluator.ts

export function evaluateAdvancement(
  sprout: Sprout,
  signals: ObservableSignals,
  rules: AdvancementRule[]
): AdvancementResult | null {
  // 1. Get current tier
  const currentTier = sprout.tier;

  // 2. Find applicable rules (fromTier matches current)
  const applicableRules = rules.filter(r =>
    r.fromTier === currentTier && r.isEnabled
  );

  if (applicableRules.length === 0) {
    return null; // No rules to evaluate
  }

  // 3. Evaluate each rule (return first match)
  for (const rule of applicableRules) {
    const result = evaluateRule(rule, signals);

    if (result.shouldAdvance) {
      return {
        shouldAdvance: true,
        toTier: rule.toTier,
        ruleId: rule.id,
        criteriaMet: result.criteriaMet,
        signalValues: signals,
      };
    }
  }

  return null; // No rules matched
}

function evaluateRule(
  rule: AdvancementRule,
  signals: ObservableSignals
): { shouldAdvance: boolean; criteriaMet: Criterion[] } {
  const criteriaMet: Criterion[] = [];

  for (const criterion of rule.criteria) {
    const signalValue = signals[criterion.signal];

    // Skip if signal missing (graceful degradation)
    if (signalValue === undefined) continue;

    // Evaluate criterion
    const met = evaluateCriterion(criterion, signalValue);

    if (met) {
      criteriaMet.push(criterion);
    } else if (rule.logicOperator === 'AND') {
      // AND logic: any failed criterion = rule fails
      return { shouldAdvance: false, criteriaMet: [] };
    }
  }

  // AND logic: all criteria met
  // OR logic: at least one criterion met
  const shouldAdvance = rule.logicOperator === 'AND'
    ? criteriaMet.length === rule.criteria.length
    : criteriaMet.length > 0;

  return { shouldAdvance, criteriaMet };
}

function evaluateCriterion(
  criterion: Criterion,
  signalValue: number
): boolean {
  switch (criterion.operator) {
    case '>=': return signalValue >= criterion.threshold;
    case '>':  return signalValue > criterion.threshold;
    case '==': return signalValue === criterion.threshold;
    case '<':  return signalValue < criterion.threshold;
    case '<=': return signalValue <= criterion.threshold;
    default:   return false;
  }
}
```

---

## Appendix: Daily Batch Cron Job

```typescript
// src/core/jobs/advancementBatchJob.ts

export async function runAdvancementEvaluation(): Promise<BatchResult> {
  console.log('[AdvancementBatch] Starting daily evaluation...');

  // 1. Fetch all enabled rules
  const rules = await supabase
    .from('advancement_rules')
    .select('*')
    .eq('payload->isEnabled', true);

  if (rules.length === 0) {
    console.log('[AdvancementBatch] No enabled rules, skipping.');
    return { advanced: 0, skipped: 0, failed: 0 };
  }

  // 2. Fetch all sprouts (not already at max tier)
  const sprouts = await supabase
    .from('sprouts')
    .select('*')
    .neq('tier', 'grove'); // Skip max tier

  const results = {
    advanced: 0,
    skipped: 0,
    failed: 0,
    events: [] as AdvancementEvent[],
  };

  // 3. Evaluate each sprout
  for (const sprout of sprouts) {
    try {
      // Get observable signals (mock or real)
      const signals = await getObservableSignals(sprout.id);

      // Evaluate advancement
      const result = evaluateAdvancement(sprout, signals, rules);

      if (result?.shouldAdvance) {
        // Update sprout tier
        await supabase
          .from('sprouts')
          .update({
            tier: result.toTier,
            promoted_at: new Date().toISOString(),
          })
          .eq('id', sprout.id);

        // Log advancement event
        const event = await supabase
          .from('advancement_events')
          .insert({
            sprout_id: sprout.id,
            rule_id: result.ruleId,
            from_tier: sprout.tier,
            to_tier: result.toTier,
            criteria_met: result.criteriaMet,
            signal_values: result.signalValues,
            event_type: 'auto-advancement',
          });

        results.advanced++;
        results.events.push(event);

        // Invalidate tier badge cache
        await invalidateTierCache(sprout.id);
      } else {
        results.skipped++;
      }
    } catch (error) {
      console.error(`[AdvancementBatch] Failed for sprout ${sprout.id}:`, error);
      results.failed++;
    }
  }

  // 4. Queue notification
  if (results.advanced > 0) {
    await queueNotification({
      type: 'daily-advancement-digest',
      data: {
        count: results.advanced,
        events: results.events,
        timestamp: new Date().toISOString(),
      },
    });
  }

  console.log('[AdvancementBatch] Complete:', results);
  return results;
}

// Cron schedule: Daily at 2am UTC
// Configured in: src/core/jobs/scheduler.ts
```

---

*Product Brief for S7-SL-AutoAdvancement*
*Phase 3 of Knowledge as Observable System EPIC*
*"Quality emerges from usage, not gatekeeping."*
*Next: UI/UX Designer wireframes → UX Chief approval → Foundation Loop → Development*
