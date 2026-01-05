# Repository Audit: 4D Prompt Refactor & Telemetry
**Sprint:** 4d-prompt-refactor-telemetry-v1  
**Date:** 2025-01-05  
**Auditor:** Foundation Loop (Claude)  
**Tier:** Sprint (1-3 days)

---

## Executive Summary

The Grove Terminal has **66 active prompts** across three JSON files plus **25+ deprecated prompts** in a legacy TypeScript file. The wayne-turner and dr-chiang lenses demonstrate sophisticated 4D targeting patterns that should become the reference standard. However, this sprint must respect the **strangler fig constraint**: the marketing MVP (Genesis/Terminal/Foundation) is live and must not break.

**Key Insight:** Build telemetry and enhanced prompt infrastructure in **bedrock/explore** as proper DEX-compliant objects. The marketing MVP prompts continue working unchanged via compatibility adapters.

---

## 1. Current Prompt Inventory

### 1.1 Active Prompt Files (Marketing MVP Layer)

| File | Count | Lens Target | 4D Maturity |
|------|-------|-------------|-------------|
| `base.prompts.json` | 23 | Generic (excludes wayne-turner, dr-chiang) | **Partial** - has targeting but less sophisticated |
| `wayne-turner.prompts.json` | 21 | wayne-turner lens | **Full 4D** - reference pattern |
| `dr-chiang.prompts.json` | 22 | dr-chiang lens | **Full 4D** - reference pattern |
| **Total Active** | **66** | | |

### 1.2 Deprecated (Legacy Layer)

| File | Count | Status |
|------|-------|--------|
| `stage-prompts.ts` | 25+ | Marked `@deprecated`, preserved for backward compatibility |

### 1.3 Prompt Schema Analysis

**Wayne-Turner Reference Pattern (Gold Standard):**
```json
{
  "id": "turner-hook-infrastructure-of-thought",
  "objectType": "prompt",
  "label": "What's actually at stake with AI concentration?",
  "executionPrompt": "...",
  "systemContext": "...",
  "tags": ["hook", "stakes", "concentration", "infrastructure"],
  "topicAffinities": [
    { "topicId": "infrastructure-bet", "weight": 1.0 },
    { "topicId": "meta-philosophy", "weight": 0.9 }
  ],
  "lensAffinities": [
    { "lensId": "wayne-turner", "weight": 1.0, "customLabel": "Infrastructure of Thought" }
  ],
  "targeting": {
    "stages": ["genesis", "exploration"],
    "lensIds": ["wayne-turner"],
    "minInteractions": 0
  },
  "baseWeight": 95,
  "stats": { "impressions": 0, "selections": 0, "completions": 0, "avgEntropyDelta": 0, "avgDwellAfter": 0 },
  "status": "active",
  "source": "library"
}
```

**Base Prompts Pattern (Needs Enhancement):**
- Has `topicAffinities`, `targeting`, `baseWeight`
- Uses `excludeLenses` to filter out persona-specific lenses
- Missing: `systemContext` on some prompts, less granular topic weights

---

## 2. Scoring Infrastructure

### 2.1 Current Scoring System

**Location:** `src/explore/utils/scorePrompt.ts`

**Scoring Factors (Current):**
| Factor | Points | Notes |
|--------|--------|-------|
| Stage match | +20 | If prompt targets current stage |
| Lens targeting | +30 | Explicit `lensIds` match |
| Lens affinity | +0-25 | `weight * 25` |
| Topic affinity | +0-15 | Per matching topic, `weight * 15` |
| Moment triggers | +40 | If moment active |
| Base weight | varies | Direct addition from prompt |

**Filtering (returns 0):**
- Excluded stages
- Entropy outside window
- Excluded lenses
- Interaction requirements not met
- Sequence requirements not met (`afterPromptIds`)
- Cooldown not elapsed
- Max shows exceeded

### 2.2 Missing: Telemetry Feedback Loop

The scoring system is **static**—weights are hardcoded or from prompt config. No mechanism exists to:
- Track which prompts users actually select
- Measure prompt effectiveness (did it lead to engagement?)
- Adjust weights based on performance data
- Identify underperforming or missing prompts

---

## 3. Type System Analysis

### 3.1 Core Types (Bedrock Layer)

**Location:** `src/core/context-fields/types.ts`

```typescript
// PromptObject - First-class DEX object
interface PromptObject {
  id: string;
  objectType: 'prompt';
  // ... full schema documented above
}

// ContextState - 4D aggregation
interface ContextState {
  stage: Stage;
  entropy: number;
  activeLensId: string | null;
  activeMoments: string[];
  interactionCount: number;
  topicsExplored: string[];
  promptsSelected: string[];  // Added in prompt-progression-v1
}

// ScoringWeights - Configurable weights
interface ScoringWeights {
  stageMatch: number;       // Default: 2.0
  entropyFit: number;       // Default: 1.5
  lensPrecision: number;    // Default: 3.0
  topicRelevance: number;   // Default: 2.0
  momentBoost: number;      // Default: 3.0
  baseWeightScale: number;  // Default: 0.5
}
```

### 3.2 Explore Layer Types

**Location:** `src/core/schema/prompt.ts` (likely)

Uses `Prompt` and `PromptPayload` types—need to verify alignment with `PromptObject`.

### 3.3 Type Duplication Risk

Two scoring interfaces exist:
1. `src/explore/utils/scorePrompt.ts` - Uses `ExplorationContext`
2. `src/core/context-fields/types.ts` - Uses `ContextState`

These should be unified in bedrock as canonical types.

---

## 4. Gaps Identified

### 4.1 Telemetry Infrastructure (Critical Gap)

**Current State:** `PromptStats` exists in schema but is never populated.
```typescript
interface PromptStats {
  impressions: number;      // Always 0
  selections: number;       // Always 0
  completions: number;      // Always 0
  avgEntropyDelta: number;  // Always 0
  avgDwellAfter: number;    // Always 0
  lastSurfaced?: number;    // Never set
}
```

**Needed:**
- Collection endpoints for telemetry events
- Database table for persistent storage
- Analytics pipeline for aggregation
- Feedback loop to adjust weights

### 4.2 Question-Prompt Bridge (Deferred from RAG Sprint)

From previous sprint scope:
- `questions_answered` field extracted during RAG enrichment
- No bridge to prompt selection
- Tier 4: Deferred—not blocking this sprint

### 4.3 Base Prompts Missing `systemContext`

Many base prompts lack `systemContext`, which provides LLM guidance. Wayne-turner prompts demonstrate the pattern:
```json
"systemContext": "Wayne founded Junto—he cares about knowledge and the marketplace of ideas. Start with infrastructure of thought..."
```

### 4.4 Deprecated Layer Still Loaded

`stage-prompts.ts` is imported in places but marked deprecated. Clear migration path needed.

---

## 5. Architecture Alignment Assessment

### 5.1 DEX Compliance Scorecard

| Principle | Current State | Target State |
|-----------|--------------|--------------|
| **Declarative Sovereignty** | ⚠️ Partial - Prompts in JSON, but scoring weights hardcoded | ✅ Weights in config |
| **Capability Agnosticism** | ✅ Good - Prompts work regardless of LLM | ✅ Maintain |
| **Provenance as Infrastructure** | ❌ Missing - No tracking of prompt performance | ✅ Full telemetry chain |
| **Organic Scalability** | ⚠️ Partial - Manual prompt authoring only | ✅ Telemetry-informed generation |

### 5.2 Strangler Fig Boundaries

**DO NOT MODIFY (Marketing MVP):**
- `src/data/prompts/base.prompts.json` (structure)
- `src/data/prompts/wayne-turner.prompts.json` (structure)
- `src/data/prompts/dr-chiang.prompts.json` (structure)
- Terminal components that consume these prompts

**SAFE TO BUILD (Bedrock/Explore):**
- New telemetry infrastructure in `src/core/telemetry/`
- Enhanced scoring with telemetry feedback
- Analytics dashboard components
- Compatibility adapters for marketing prompts

---

## 6. File Inventory

### 6.1 Prompt-Related Files

```
src/data/prompts/
├── base.prompts.json          # 23 prompts, generic targeting
├── dr-chiang.prompts.json     # 22 prompts, dr-chiang lens
├── wayne-turner.prompts.json  # 21 prompts, wayne-turner lens
├── index.ts                   # Loader, exports combined array
└── stage-prompts.ts           # DEPRECATED - legacy stage config

src/core/context-fields/
├── types.ts                   # PromptObject, ContextState, etc.
├── generator.ts               # Rule-based prompt generation
├── telemetry.ts               # SessionTelemetry capture
├── scorer.ts                  # (if exists) Scoring logic
└── index.ts                   # Re-exports

src/explore/
├── utils/scorePrompt.ts       # Current scoring algorithm
└── hooks/usePromptSuggestions.ts  # Hook consuming prompts
```

### 6.2 Database Schema (Supabase)

**Existing Tables:**
- `knowledge_sources` - RAG documents with enrichment fields
- `sessions` - User session tracking

**Needed Tables:**
- `prompt_telemetry` - Event-level prompt tracking
- `prompt_performance` - Aggregated metrics (materialized view or table)

---

## 7. Recommendations

### 7.1 Sprint Scope (Strangler Fig Compliant)

1. **Build Telemetry Infrastructure in Bedrock**
   - New `src/core/telemetry/prompt-telemetry.ts`
   - Database schema for `prompt_telemetry`
   - Collection endpoints in server.js

2. **Create Compatibility Adapter**
   - Wrap existing prompts with telemetry hooks
   - No changes to prompt JSON files needed

3. **Enhanced Scoring with Feedback**
   - New scorer in bedrock that reads telemetry
   - Falls back to static weights if no telemetry data

4. **Admin Visibility (Optional)**
   - PipelineMonitor extension for prompt performance
   - Or separate copilot panel

### 7.2 Out of Scope (Preserve for Later)

- Refactoring base.prompts.json content (marketing MVP)
- Question-prompt bridge (RAG integration)
- AI-generated prompt suggestions

### 7.3 Success Criteria

- [ ] Telemetry events captured for prompt impressions/selections
- [ ] Performance data visible in admin interface
- [ ] Scoring can incorporate telemetry when available
- [ ] Marketing MVP continues working unchanged
- [ ] All new code follows DEX principles

---

## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking marketing MVP | Low | High | Strangler fig + adapter pattern |
| Type duplication | Medium | Medium | Canonical types in bedrock |
| Telemetry performance overhead | Low | Medium | Async/batched writes |
| Scope creep into RAG integration | Medium | Medium | Explicit out-of-scope boundary |

---

## Appendix A: Prompt Count by Stage/Lens

| Stage | Base | Wayne-Turner | Dr-Chiang | Total |
|-------|------|--------------|-----------|-------|
| genesis | 4 | 3 | 0 | 7 |
| exploration | 8 | 5 | 6 | 19 |
| synthesis | 8 | 10 | 11 | 29 |
| advocacy | 3 | 3 | 5 | 11 |
| **Total** | 23 | 21 | 22 | **66** |

## Appendix B: Topic Affinity Coverage

| Topic ID | Base | Wayne-Turner | Dr-Chiang |
|----------|------|--------------|-----------|
| infrastructure-bet | 4 | 8 | 5 |
| meta-philosophy | 6 | 4 | 0 |
| governance | 3 | 5 | 10 |
| ratchet-effect | 2 | 3 | 3 |
| technical-arch | 2 | 0 | 5 |
| cognitive-split | 1 | 1 | 3 |
