# Repository Audit: S5-SL-LifecycleEngine

## Sprint Info

| Field | Value |
|-------|-------|
| **Sprint** | S5-SL-LifecycleEngine |
| **Parent Epic** | Sprout Lifecycle v1 |
| **Phase** | Phase 1 - Lifecycle Engine + Config Schema |
| **Audited** | 2026-01-15 |

---

## Current State Analysis

### Tier Configuration (Hardcoded)

**Location:** `src/surface/components/TierBadge/TierBadge.config.ts`

```typescript
export const TIER_CONFIG = {
  emoji: {
    seed: '🌰',
    sprout: '🌱',
    sapling: '🌿',
    tree: '🌳',
    grove: '🌲',
  } as Record<SproutTier, string>,

  sizes: {
    sm: { fontSize: '16px', gap: '4px', labelSize: '12px' },
    md: { fontSize: '20px', gap: '6px', labelSize: '14px' },
    lg: { fontSize: '24px', gap: '8px', labelSize: '16px' },
  },

  labels: {
    seed: 'Seed',
    sprout: 'Sprout',
    sapling: 'Sapling',
    tree: 'Tree',
    grove: 'Grove',
  } as Record<SproutTier, string>,
} as const;
```

**Issue:** Configuration is hardcoded in TypeScript. Domain experts cannot change tier labels, emojis, or add new lifecycle models without code changes.

---

### Stage-to-Tier Mapping (Hardcoded)

**Location:** `src/surface/components/TierBadge/stageTierMap.ts`

Maps 8 internal `SproutStage` values to 5 user-facing `SproutTier` values:

| Stage | Tier |
|-------|------|
| tender, rooting | seed |
| branching, hardened, grafted, dormant | sprout |
| established | sapling |
| (future) | tree |
| (future) | grove |

**Issue:** Mapping logic is hardcoded. Cannot support alternative lifecycle models (e.g., academic: draft→review→published).

---

### Sprout Schema (Schema Layer)

**Location:** `src/core/schema/sprout.ts`

```typescript
export type SproutStage =
  | 'tender'
  | 'rooting'
  | 'branching'
  | 'hardened'
  | 'grafted'
  | 'established'
  | 'dormant'
  | 'withered';
```

The schema already supports 8 stages. The UI mapping and display configuration are the gaps.

---

### GCS Config Pattern (Existing)

**Pattern:** Feature flags stored in `globalSettings.featureFlags`

**Flow:**
```
GET /api/narrative
    ↓
Load from GCS: infrastructure/feature-flags.json
    ↓
Merge into globalSettings
    ↓
Return unified schema
```

**Files:**
- `server.js` lines 756-781: Load feature flags from GCS
- `src/foundation/consoles/RealityTuner.tsx`: Edit feature flags
- `data/narratives-schema.ts`: `FeatureFlag` type definition

**Reuse Opportunity:** Lifecycle config can follow identical pattern.

---

### Reality Tuner Console (Edit UI)

**Location:** `src/foundation/consoles/RealityTuner.tsx`

**Current Tabs:**
- `flags` - Feature flag management
- `routing` - Topic hub configuration
- `settings` - System voice / prompts

**Extension Point:** Add `lifecycle` tab for lifecycle config editing.

---

## Files Inventory

### Core Schema (src/core/schema/)

| File | Relevance | Action |
|------|-----------|--------|
| `sprout.ts` | Defines SproutStage (8 stages) | Keep as-is |
| `feature-flag.ts` | Pattern for GCS-backed config | Reference pattern |
| `narrative.ts` | globalSettings home | Extend with lifecycleConfig |

### Surface Components (src/surface/components/)

| File | Relevance | Action |
|------|-----------|--------|
| `TierBadge/TierBadge.config.ts` | Hardcoded tier config | Migrate to config-driven |
| `TierBadge/stageTierMap.ts` | Hardcoded mapping | Migrate to config-driven |
| `TierBadge/TierBadge.tsx` | Rendering component | Read from config |

### Foundation Console (src/foundation/consoles/)

| File | Relevance | Action |
|------|-----------|--------|
| `RealityTuner.tsx` | Config editing UI | Add lifecycle tab |

### Server (server.js)

| Section | Relevance | Action |
|---------|-----------|--------|
| Lines 753-784 | GCS file loading | Add lifecycle config |
| Lines 1123-1139 | loadJsonFromGCS helper | Reuse |

### Data Files (data/)

| File | Relevance | Action |
|------|-----------|--------|
| `narratives-schema.ts` | Schema definitions | Add LifecycleConfig type |
| `infrastructure/feature-flags.json` | Pattern reference | Create lifecycle config |

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Tier config externalization | Pattern 3: Narrative Schema | Add `lifecycleConfig` to globalSettings |
| GCS storage | Feature flag pattern | New file: `infrastructure/lifecycle.json` |
| Admin editing | RealityTuner console | Add "Lifecycle" tab |
| Multiple models | None (new capability) | Config supports model selection |

## New Patterns Proposed

**None.** All requirements can be met by extending existing patterns.

---

## Technical Debt Identified

1. **TierBadge.config.ts** - Hardcoded, violates Declarative Sovereignty
2. **stageTierMap.ts** - Hardcoded mapping, no config override
3. **No lifecycle versioning** - Cannot A/B test different tier criteria

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Breaking existing tier display | Medium | Default config = current hardcoded values |
| GCS load failure | Low | Fallback to hardcoded defaults |
| RealityTuner complexity | Low | Tab isolation, consistent patterns |

---

## Summary

**Current State:** Tier configuration is hardcoded in TypeScript components, violating Declarative Sovereignty. The GCS config pattern exists for feature flags and can be extended.

**Gap:** No external configuration for lifecycle models. Operators cannot customize tier labels, emojis, or stage mappings without code deployment.

**Opportunity:** Phase 1 externalizes this configuration, enabling:
- Operator-editable lifecycle rules
- Multiple lifecycle models (botanical, academic, creative)
- A/B testing of tier criteria
- Foundation for auto-advancement engine (Phase 3)

---

*Audit prepared for S5-SL-LifecycleEngine*
*Foundation Loop v2*
