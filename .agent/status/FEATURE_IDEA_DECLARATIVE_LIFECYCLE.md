# Feature Idea: Declarative Information Lifecycle Config

**Date:** 2026-01-15
**Author:** Randy (Chief of Staff) / User collaboration
**Status:** CONCEPT
**DEX Alignment:** Declarative Sovereignty + Capability Agnosticism

---

## Core Concept

**Instead of hardcoding tier progression logic, make it driven by a declarative config object.**

```typescript
// Current approach (hardcoded):
if (action === 'promote') {
  sprout.tier = 'sapling';
}

// Declarative approach:
const lifecycle = getLifecycleConfig();
const nextTier = lifecycle.resolveTransition(sprout, 'promote');
sprout.tier = nextTier;
```

---

## Why This Matters

### 1. DEX Alignment: Declarative Sovereignty

From DEX pillars: *"Can behavior be changed via config, not code?"*

**With declarative lifecycle:**
- Operators can adjust tier rules without deploying code
- Different groves can use different lifecycle models
- A/B test progression criteria (does auto-advancement to "tree" work?)
- Non-developers participate in lifecycle design

### 2. Multiple Lifecycle Models Already Exist

**ADR-001 (5-tier):**
```
seed → sprout → sapling → tree → grove
```

**sprout-declarative-v1 SPEC (8-stage):**
```
germinating → sprouting → rooting → branching →
flowering → fruiting → seeding → dormant
```

**Current implementation:**
```
pending → active → completed → archived
```

A config object could support ALL of these, letting groves choose their model.

### 3. Capability Agnosticism

The lifecycle engine becomes model-agnostic. Whether you use 5 tiers or 8 stages, the same engine handles transitions.

---

## Proposed Schema

```typescript
interface InformationLifecycleConfig {
  /** Unique identifier for this lifecycle model */
  id: string;

  /** Human-readable name */
  name: string;

  /** Ordered list of lifecycle stages */
  stages: LifecycleStage[];

  /** Transition rules */
  transitions: LifecycleTransition[];

  /** Automatic advancement criteria (optional) */
  autoAdvancement?: AutoAdvancementRule[];

  /** Visualization metadata */
  display: {
    icons: Record<string, string>;  // stage → emoji/icon
    colors: Record<string, string>; // stage → color
    labels: Record<string, string>; // stage → display text
  };
}

interface LifecycleStage {
  id: string;              // e.g., "sapling"
  order: number;           // Position in lifecycle (0-indexed)
  retrievalEligible: boolean;  // Can this be in RAG corpus?
  qualitySignal?: string;  // What does this stage indicate?
}

interface LifecycleTransition {
  trigger: 'user_action' | 'auto' | 'time_based';
  fromStage: string;
  toStage: string;
  action?: string;         // e.g., "promote", "archive"
  condition?: string;      // Formula or rule reference
}

interface AutoAdvancementRule {
  fromStage: string;
  toStage: string;
  criteria: {
    retrievalCount?: number;     // e.g., > 10 retrievals
    utilityScore?: number;       // e.g., > 0.8
    citationCount?: number;      // e.g., > 5 citations
    timeSince?: string;          // e.g., "30 days"
  };
}
```

---

## Example Config: Five-Tier Botanical

```json
{
  "id": "botanical-five-tier",
  "name": "Botanical Five-Tier Lifecycle",
  "stages": [
    {
      "id": "seed",
      "order": 0,
      "retrievalEligible": false,
      "qualitySignal": "Raw capture, unprocessed"
    },
    {
      "id": "sprout",
      "order": 1,
      "retrievalEligible": false,
      "qualitySignal": "Research document attached"
    },
    {
      "id": "sapling",
      "order": 2,
      "retrievalEligible": true,
      "qualitySignal": "Promoted to knowledge base"
    },
    {
      "id": "tree",
      "order": 3,
      "retrievalEligible": true,
      "qualitySignal": "Proven valuable through use"
    },
    {
      "id": "grove",
      "order": 4,
      "retrievalEligible": true,
      "qualitySignal": "Foundational, network consensus"
    }
  ],
  "transitions": [
    {
      "trigger": "user_action",
      "fromStage": "sprout",
      "toStage": "sapling",
      "action": "promote"
    },
    {
      "trigger": "auto",
      "fromStage": "sapling",
      "toStage": "tree",
      "condition": "high_utility"
    },
    {
      "trigger": "auto",
      "fromStage": "tree",
      "toStage": "grove",
      "condition": "community_consensus"
    }
  ],
  "autoAdvancement": [
    {
      "fromStage": "sapling",
      "toStage": "tree",
      "criteria": {
        "retrievalCount": 10,
        "utilityScore": 0.75
      }
    },
    {
      "fromStage": "tree",
      "toStage": "grove",
      "criteria": {
        "citationCount": 5,
        "timeSince": "90 days"
      }
    }
  ],
  "display": {
    "icons": {
      "seed": "🌰",
      "sprout": "🌱",
      "sapling": "🌿",
      "tree": "🌳",
      "grove": "🌲"
    },
    "colors": {
      "seed": "#A0826D",
      "sprout": "#90C695",
      "sapling": "#6FAF73",
      "tree": "#2F5C3B",
      "grove": "#1C3A29"
    },
    "labels": {
      "seed": "Seed",
      "sprout": "Sprout",
      "sapling": "Sapling",
      "tree": "Tree",
      "grove": "Grove"
    }
  }
}
```

---

## Use Cases Unlocked

### 1. Custom Lifecycle Per Grove Instance

Different groves (user installations) could use different models:

- **Academic grove:** `seed → draft → peer-review → published → canonical`
- **Research grove:** `hypothesis → tested → validated → theory → law`
- **Creative grove:** `sketch → draft → refined → published → classic`

### 2. A/B Testing Lifecycle Rules

Test different auto-advancement criteria:
- Variant A: Tree promotion at 10 retrievals
- Variant B: Tree promotion at 20 retrievals + 0.8 utility
- Measure impact on knowledge base quality

### 3. Multi-Model Support

Support both ADR-001 (5-tier) and sprout-declarative-v1 (8-stage) simultaneously:
- Users choose which model on grove setup
- UI adapts to show correct stages/badges
- Backend logic is model-agnostic

### 4. Future: AI-Driven Lifecycle Management

Config becomes the interface for AI agents:
- Agent analyzes usage patterns
- Proposes lifecycle config adjustments
- Operator approves/rejects changes

---

## Implementation Path

### Phase 1: Config Schema + Engine (sprout-tier-progression-v1)

**Scope:** Core lifecycle engine, single hardcoded config
- Define `InformationLifecycleConfig` schema
- Build `LifecycleEngine.resolveTransition()`
- Hardcode botanical-five-tier as default
- Wire to promotion action in Finishing Room

**User-facing:** Promotion sets tier to "sapling", badges show lifecycle stage

### Phase 2: Admin UI for Lifecycle Config (sprout-lifecycle-admin-v1)

**Scope:** Reality Tuner integration
- Add "Lifecycle Config" tab to Reality Tuner
- JSON editor for lifecycle config
- Preview/validate transitions
- Save to GCS (like feature flags)

**User-facing:** Operators can adjust lifecycle without code deploy

### Phase 3: Multi-Model Support (sprout-lifecycle-models-v1)

**Scope:** Multiple configs, user selection
- Load lifecycle configs from GCS
- User selects model during grove setup
- UI adapts to active model (badges, labels, colors)

**User-facing:** Choose your lifecycle philosophy

### Phase 4: Auto-Advancement Engine (sprout-lifecycle-auto-v1)

**Scope:** Automatic tier progression
- Cron job evaluates auto-advancement rules
- Track retrieval/utility/citation metrics
- Advance tiers when criteria met
- Notify users of tier changes

**User-facing:** Saplings become trees automatically when proven valuable

---

## Technical Considerations

### Where Does Config Live?

**Option 1: GCS (like feature flags)**
- Pro: Hot-reloadable, no deploy needed
- Pro: Fits existing pattern
- Con: Need GCS for local dev

**Option 2: Database table**
- Pro: Queryable, relational
- Pro: Version history via migrations
- Con: Requires deploy to change

**Option 3: Hybrid**
- Default config in codebase (botanical-five-tier)
- Override via GCS for production customization
- Best of both worlds

**Recommendation:** Option 3 (hybrid)

### Backward Compatibility

Existing sprouts have `status` field (pending/active/completed/archived), not `tier`.

**Migration strategy:**
```typescript
// Map old status to new tier
const LEGACY_STATUS_TO_TIER = {
  'pending': 'seed',
  'active': 'sprout',
  'completed': 'sprout',  // Not yet promoted
  'archived': 'sprout'    // Archived but not demoted
};
```

### Performance

Auto-advancement rules run on a schedule (e.g., daily cron). Each evaluation:
1. Query sprouts eligible for advancement (sapling tier)
2. Check retrieval/utility metrics
3. Update tier if criteria met

**Optimization:** Only evaluate sprouts modified in last N days.

---

## Questions to Explore

### For Product Manager:
1. Which lifecycle model should be default? (5-tier botanical vs. 8-stage declarative)
2. Should users be able to create CUSTOM lifecycle models? Or just choose from presets?
3. When do we want multi-model support? (Phase 3 or later?)

### For UI/UX Designer:
1. How do we visualize lifecycle config in Reality Tuner?
2. Should tier transitions be animated? (sprout → sapling visual change)
3. How do badges adapt to custom lifecycle models?

### For UX Chief (DEX Alignment):
1. Does automatic tier advancement violate Declarative Sovereignty? (User didn't explicitly approve)
2. Should auto-advancement require user confirmation?
3. How does lifecycle config fit into provenance tracking?

### For Developer:
1. Can we use existing feature flag infrastructure for lifecycle config?
2. How do we handle lifecycle config versioning? (Schema changes over time)
3. Should lifecycle engine be sync or async? (Transitions might trigger events)

---

## DEX Compliance Checklist

- ✅ **Declarative Sovereignty:** Behavior changed via config, not code
- ✅ **Capability Agnosticism:** Works with any model executing the rules
- ✅ **Provenance as Infrastructure:** Tier changes tracked with timestamps
- ✅ **Organic Scalability:** New lifecycle models added without core changes

---

## Related Work

**Existing config-driven systems in Grove:**
- Feature flags (`globalSettings.features`)
- Cognitive domain routing (`domains.json`)
- Narrative graph (`narratives.json`)
- A/B testing variants (`abTesting.ts`)

**Lifecycle config fits this pattern perfectly.**

---

## Recommendation

**Start with Phase 1 in sprout-tier-progression-v1:**
- Hardcoded botanical-five-tier config
- Basic lifecycle engine
- Wire to promotion action
- Ship quickly, prove value

**Then iterate:**
- Phase 2: Admin UI (Reality Tuner integration)
- Phase 3: Multi-model support
- Phase 4: Auto-advancement engine

**This gives us:**
- Immediate user value (tier badges)
- DEX-compliant architecture (declarative config)
- Future-proof foundation (multi-model ready)

---

*Feature concept by Randy - Chief of Staff v1.2*
*"Make the lifecycle declarative. Let the trees configure themselves."*
