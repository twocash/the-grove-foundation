# S10.1-SL-AICuration v2: Display + Filtering Integration

**Sprint:** S10.1-SL-AICuration v2
**Parent:** S10-SL-AICuration (AI-Driven Quality Assessment)
**Status:** 📝 draft-spec
**Date:** 2026-01-18
**Author:** UX Chief (Draft for Review)

---

## Overview

This sprint integrates the quality scoring infrastructure built in S10 v1 into the user-facing experience. Users will see quality scores on sprouts, configure thresholds, and filter content by quality.

### Dependency
- **S10-SL-AICuration v1** (Infrastructure) - ✅ Complete

### Goal
Wire the quality scoring engine to the sprout lifecycle and display quality information in the Explore and Nursery interfaces.

---

## User Stories (From S10 Original Scope)

| Story | Title | Priority |
|-------|-------|----------|
| US-001 | Quality Score Display | P0 |
| US-002 | Quality Threshold Configuration | P0 |
| US-003 | Multi-Dimensional Quality Scoring | P0 |
| US-004 | Federated Learning Participation | P0 |
| US-005 | Quality-Based Content Filtering | P0 |

---

## Technical Scope

### 1. Scoring Engine Integration

**File:** `src/core/quality/integration.ts` (NEW)

Wire `QualityScoringEngine.assess()` to sprout lifecycle events:

```typescript
// Trigger scoring when sprout is created/updated
async function onSproutCreated(sprout: Sprout): Promise<void> {
  const engine = getQualityScoringEngine();
  const result = await engine.assess({
    targetId: sprout.id,
    targetType: 'sprout',
    content: sprout.content,
    metadata: {
      tier: sprout.tier,
      sourceGrove: sprout.sourceGrove,
      createdAt: sprout.createdAt,
    },
  });

  // Persist score to database
  await saveQualityScore(result.score);
}
```

**Integration Points:**
- `useSproutStorage.ts` - Add scoring on create/update
- `SproutCard.tsx` - Display quality badge
- `ExploreShell.tsx` - Filter by quality

### 2. Quality Badge Display

**Location:** Sprout cards in Explore and Nursery

**Implementation:**
```tsx
// In SproutCard.tsx or equivalent
<QualityScoreBadge
  score={sprout.qualityScore}
  dimensions={sprout.qualityDimensions}
  size="sm"
  showTooltip
/>
```

**Visual Requirements:**
- Badge shows composite score (0-100)
- Color coding: green (80+), amber (50-79), red (<50)
- Hover tooltip shows dimension breakdown
- Click expands to detailed view

### 3. Quality Filtering in Explore

**Location:** `src/surface/components/KineticStream/ExploreShell.tsx`

**New Filter Controls:**
```tsx
// Add to existing filter panel
<QualityFilterPanel
  minScore={filters.minQualityScore}
  onMinScoreChange={(val) => setFilters({ ...filters, minQualityScore: val })}
  dimensions={filters.qualityDimensions}
  onDimensionChange={(dim, val) => updateDimensionFilter(dim, val)}
/>
```

**Filter Options:**
- Minimum overall score (slider 0-100)
- Dimension-specific minimums (accuracy, utility, novelty, provenance)
- Quick presets: "High Quality (80+)", "Medium+ (50+)", "All"

### 4. Threshold Configuration UI

**Location:** Bedrock Experience Console (existing infrastructure)

**Integration:**
- Add "Quality Settings" section to Experience Console
- Wire `QualityThresholdCard` to actual data
- Enable create/edit/delete via `QualityThresholdEditor`
- Persist to `quality_thresholds` table

### 5. Federated Learning Opt-In UI

**Location:** Settings or Experience Console

**New Component:** `FederatedLearningSettings.tsx`

```tsx
interface FederatedLearningSettingsProps {
  participation: FederatedLearningParticipation | null;
  onOptIn: (privacyLevel: PrivacyLevel) => void;
  onOptOut: () => void;
}
```

**Features:**
- Toggle: Enable/disable participation
- Privacy level selector: Full / Anonymized / Aggregated
- Contribution metrics display
- Last sync timestamp

### 6. Multi-Dimensional Breakdown UI

**New Component:** `QualityBreakdownPanel.tsx`

```tsx
interface QualityBreakdownPanelProps {
  score: QualityScore;
  showRadar?: boolean;
  showBars?: boolean;
}
```

**Visual Elements:**
- Radar chart showing 4 dimensions
- Progress bars for each dimension
- Color-coded by score level
- Reasoning explanations

---

## Database Changes

No new migrations required - uses tables from S10 v1:
- `quality_scores`
- `quality_thresholds`
- `federated_learning_participation`

**Data Population:**
- Backfill existing sprouts with quality scores (migration script or background job)

---

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/core/quality/integration.ts` | NEW | Lifecycle hooks |
| `src/surface/.../SproutCard.tsx` | MODIFY | Add badge |
| `src/surface/.../ExploreShell.tsx` | MODIFY | Add filters |
| `src/bedrock/.../QualitySettingsSection.tsx` | NEW | Threshold config UI |
| `src/bedrock/.../FederatedLearningSettings.tsx` | NEW | Opt-in UI |
| `src/bedrock/primitives/QualityBreakdownPanel.tsx` | NEW | Dimension display |
| `hooks/useQualityScoring.ts` | NEW | React hook for scores |

---

## Acceptance Criteria (Key Scenarios)

### AC-1: Quality Badge Visibility
**Given** I am viewing a sprout in Explore
**When** the sprout has been scored
**Then** I see a quality badge with the composite score

### AC-2: Quality Filtering
**Given** I am in Explore with quality filters enabled
**When** I set minimum score to 70
**Then** only sprouts with scores >= 70 are displayed

### AC-3: Threshold Configuration
**Given** I am a grove operator in Experience Console
**When** I create a new quality threshold
**Then** it is persisted and applies to content filtering

### AC-4: Federated Learning Toggle
**Given** I am in Settings
**When** I enable federated learning with "Anonymized" privacy
**Then** my participation status is saved and displayed

### AC-5: Dimension Breakdown
**Given** I am viewing a sprout's quality score
**When** I click to expand details
**Then** I see a radar chart and bars showing accuracy, utility, novelty, provenance

---

## DEX Compliance

| Pillar | Implementation |
|--------|----------------|
| **Declarative Sovereignty** | Thresholds stored in database, not code |
| **Capability Agnosticism** | Scoring engine uses pluggable model interface |
| **Provenance as Infrastructure** | Scores track scoring model, confidence, timestamp |
| **Organic Scalability** | Federated learning enables cross-grove improvement |

---

## Testing Strategy

### Unit Tests
- `integration.ts` - scoring trigger logic
- `useQualityScoring.ts` - hook behavior

### Integration Tests
- Sprout create → score generated → badge displays
- Filter applied → results filtered correctly
- Threshold saved → filtering respects it

### E2E Tests
- Full flow: Create sprout → See score → Filter by score
- Threshold configuration workflow
- Federated learning opt-in/opt-out

### Visual Tests
- Quality badge at various score levels
- Radar chart rendering
- Filter panel interactions

---

## Estimated Effort

| Component | Complexity | Estimate |
|-----------|------------|----------|
| Scoring integration | Medium | 1 day |
| Badge display | Low | 0.5 day |
| Filter controls | Medium | 1 day |
| Threshold config UI | Medium | 1 day |
| Federated learning UI | Medium | 0.5 day |
| Breakdown panel | Medium | 1 day |
| Testing | Medium | 1 day |
| **Total** | | **6 days** |

---

## Open Questions for UX Chief Review

1. **Badge placement:** Should quality badge be in card header, footer, or floating overlay?
2. **Filter defaults:** Should quality filtering be on by default (e.g., 50+ minimum)?
3. **Radar chart:** Include in card hover, or only in expanded detail view?
4. **Backfill strategy:** Score existing sprouts immediately, or on-demand when viewed?

---

## Dependencies

- S10-SL-AICuration v1 (Infrastructure) - ✅ Complete
- Explore shell filter system (existing)
- Experience Console card factory (existing)

---

**Prepared By:** UX Chief (Draft)
**Date:** 2026-01-18
**Next Stage:** UX Chief Strategic Review → User Story Refinery
