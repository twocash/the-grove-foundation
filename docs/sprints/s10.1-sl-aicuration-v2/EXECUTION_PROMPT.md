# S10.1-SL-AICuration v2 - EXECUTION PROMPT

> **Sprint:** S10.1-SL-AICuration v2 (Display + Filtering)
> **Epic:** AI-Curated Quality Scores
> **Status:** Ready for Execution
> **UX Chief Approval:** APPROVED with mandatory technical requirements

---

## Sprint Overview

Implement AI-curated quality score display and filtering for Sprouts in the Nursery Console. This sprint establishes the visual foundation for quality assessment visibility with read-only display (no manual override - that's S10.2).

**Core Deliverables:**
1. Quality badge on SproutCard (scored, pending, error states)
2. Quality tooltip with dimension breakdown
3. Quality filters (slider, presets, advanced dimensions)
4. Full Quality Breakdown Panel (json-render REQUIRED)
5. Quality threshold configuration
6. E2E tests with visual verification

---

## Phase Breakdown

### Phase 1: Schema & Core Types (Foundation)
**Files:**
- `src/core/schema/quality.ts` - Quality score types, dimensions, thresholds

**Deliverables:**
```typescript
// Quality dimension scores (0-100)
interface QualityDimensions {
  accuracy: number;
  utility: number;
  novelty: number;
  provenance: number;
}

// Full quality score object
interface QualityScore {
  overall: number;           // Composite score 0-100
  dimensions: QualityDimensions;
  assessedAt: string;        // ISO timestamp
  assessedBy: string;        // Model identifier
  confidence: number;        // 0-1 confidence level
  networkPercentile?: number; // Comparison to Grove network
}

// Quality grade mapping
type QualityGrade = 'excellent' | 'good' | 'fair' | 'needs-improvement';

// Threshold configuration
interface QualityThresholds {
  excellent: number;  // >= 90
  good: number;       // >= 70
  fair: number;       // >= 50
  // Below 50 = needs-improvement
}
```

### Phase 2: SproutCard Quality Badge (US-A001)
**Files:**
- `src/bedrock/consoles/NurseryConsole/SproutCard.tsx` - MODIFY
- `src/bedrock/primitives/QualityBadge.tsx` - NEW
- `src/bedrock/primitives/QualityPendingBadge.tsx` - NEW

**Badge States:**
| State | Display | Color |
|-------|---------|-------|
| Scored (90+) | "95" | neon-green |
| Scored (70-89) | "78" | neon-amber |
| Scored (50-69) | "62" | orange-500 |
| Scored (<50) | "34" | red-500 |
| Pending | pulse animation | gray-400 |
| Error | Hidden gracefully | - |

**Technical Pattern:**
```tsx
// SproutCard integration via factory pattern
interface SproutPayload {
  // ... existing fields
  qualityScore?: QualityScore;
  qualityStatus: 'scored' | 'pending' | 'error' | 'not-assessed';
}
```

### Phase 3: Quality Tooltip (US-A002)
**Files:**
- `src/bedrock/primitives/QualityTooltip.tsx` - NEW

**Hover reveals:**
- Overall score with grade label
- 4 dimension bars (accuracy, utility, novelty, provenance)
- Assessment timestamp and model
- "View Details" link to breakdown panel

### Phase 4: Quality Filters (US-A003, US-A004, US-A005)
**Files:**
- `src/bedrock/consoles/NurseryConsole/QualityFilterBar.tsx` - NEW
- `src/bedrock/consoles/NurseryConsole/QualityFilterPresets.tsx` - NEW
- `src/bedrock/consoles/NurseryConsole/QualityAdvancedFilters.tsx` - NEW
- `src/bedrock/consoles/NurseryConsole/index.tsx` - MODIFY

**URL State Persistence:**
```
/bedrock/nursery?quality=80&accuracy=60&utility=70
```

**Presets:**
| Preset | Filter |
|--------|--------|
| "Top Performers" | quality >= 90 |
| "Ready for Review" | quality >= 70 |
| "Needs Attention" | quality < 50 |
| "All Sprouts" | No filter |

### Phase 5: Quality Breakdown Panel (US-A006) - JSON-RENDER REQUIRED
**Files:**
- `src/bedrock/consoles/ExperienceConsole/json-render/quality-breakdown-catalog.ts` - NEW
- `src/bedrock/consoles/ExperienceConsole/json-render/quality-breakdown-registry.tsx` - NEW
- `src/bedrock/consoles/ExperienceConsole/json-render/quality-breakdown-transform.ts` - NEW

**Catalog Components:**
```typescript
QualityBreakdownCatalog = {
  components: {
    QualityOverview,      // Score + grade + progress bar
    DimensionRow,         // Individual dimension display
    QualityRadarChart,    // Radar visualization wrapper
    AssessmentMetadata,   // Model, timestamp, confidence
    NetworkComparison,    // Grove vs network percentile
  }
}
```

**Transform Pattern:**
```typescript
function qualityScoreToRenderTree(score: QualityScore): RenderTree {
  return {
    type: 'root',
    children: [
      { type: 'QualityOverview', props: { score: score.overall, grade: getGrade(score.overall) } },
      { type: 'DimensionRow', props: { dimension: 'accuracy', value: score.dimensions.accuracy } },
      { type: 'DimensionRow', props: { dimension: 'utility', value: score.dimensions.utility } },
      { type: 'DimensionRow', props: { dimension: 'novelty', value: score.dimensions.novelty } },
      { type: 'DimensionRow', props: { dimension: 'provenance', value: score.dimensions.provenance } },
      { type: 'AssessmentMetadata', props: { assessedBy: score.assessedBy, assessedAt: score.assessedAt } },
    ],
  };
}
```

**REUSE from SignalsCatalog:**
- MetricCard pattern for dimension cards
- MetricRow pattern for dimension bars
- QualityGauge concept for radar chart

### Phase 6: Threshold Configuration (US-A007)
**Files:**
- `src/bedrock/consoles/ExperienceConsole/panels/QualitySettingsPanel.tsx` - NEW
- Supabase: `grove_config` table entry for thresholds

### Phase 7: Federated Learning Toggle (US-A008)
**Files:**
- `src/bedrock/consoles/ExperienceConsole/panels/QualitySettingsPanel.tsx` - EXTEND

**Feature Flag:**
```typescript
federatedLearning: {
  enabled: boolean;
  consentLevel: 'full' | 'anonymized' | 'none';
}
```

### Phase 8: Empty & Error States (US-A009)
**Files:**
- All filter/display components

**States:**
- No sprouts match filter → "No sprouts match your quality criteria"
- Quality service unavailable → Graceful degradation, hide badges
- Assessment pending → Animated pending badge

---

## E2E Test Requirements

**Test Files:**
```
tests/e2e/
├── quality-badge-display.spec.ts     # US-A001
├── quality-tooltip.spec.ts           # US-A002
├── quality-filter.spec.ts            # US-A003
├── quality-presets.spec.ts           # US-A004
├── quality-advanced-filters.spec.ts  # US-A005
├── quality-breakdown-panel.spec.ts   # US-A006
├── quality-threshold-config.spec.ts  # US-A007
├── federated-learning.spec.ts        # US-A008
└── quality-empty-states.spec.ts      # US-A009
```

**Visual Verification Required:**
- Badge color states (all 4 grades + pending)
- Tooltip dimension bars
- Filter slider positions
- Breakdown panel layout
- Empty state messaging

**Screenshot Baselines:**
```
docs/sprints/s10.1-sl-aicuration-v2/screenshots/e2e/
├── quality-badge-excellent.png
├── quality-badge-good.png
├── quality-badge-fair.png
├── quality-badge-needs-improvement.png
├── quality-badge-pending.png
├── quality-tooltip-expanded.png
├── quality-filter-applied.png
├── quality-breakdown-panel.png
└── quality-empty-state.png
```

---

## Technical Requirements (MANDATORY)

### json-render Pattern (Phase 5)
The Quality Breakdown Panel MUST use json-render for DEX compliance:
- Catalog defines component vocabulary with Zod schemas
- Registry implements React components
- Transform converts domain objects to render tree
- NO direct component imports in consumer code

### Factory Pattern (Phase 2)
SproutCard quality badge MUST use ObjectCardProps pattern:
```typescript
// Extend existing payload, don't create separate component
interface SproutPayload {
  qualityScore?: QualityScore;
  qualityStatus: 'scored' | 'pending' | 'error' | 'not-assessed';
}
```

### SignalsCatalog Reuse (Phase 5)
PREFER reusing existing catalog patterns:
- Reference `signals-catalog.ts` for MetricCard schema
- Reference `signals-registry.tsx` for component styling
- Match existing neon color tokens

### URL State (Phase 4)
All filters MUST persist in URL for shareability:
```typescript
const [qualityFilter, setQualityFilter] = useSearchParams();
// Sync to: ?quality=80&accuracy=60&utility=70
```

---

## Acceptance Criteria Checklist

### Phase 1: Schema
- [ ] QualityScore interface exported from `@core/schema`
- [ ] QualityDimensions with 4 dimensions
- [ ] QualityGrade type with 4 levels
- [ ] QualityThresholds interface

### Phase 2: Badge
- [ ] QualityBadge renders on SproutCard
- [ ] Color matches score grade
- [ ] QualityPendingBadge shows pulse animation
- [ ] Error state hides badge gracefully

### Phase 3: Tooltip
- [ ] Hover shows QualityTooltip
- [ ] All 4 dimensions displayed with bars
- [ ] Assessment metadata shown
- [ ] "View Details" link functional

### Phase 4: Filters
- [ ] Slider filters by minimum score
- [ ] 4 presets work correctly
- [ ] Advanced filters for each dimension
- [ ] URL state persists filters
- [ ] Filter count shown

### Phase 5: Breakdown Panel (json-render)
- [ ] Catalog with Zod schemas created
- [ ] Registry with React components created
- [ ] Transform function implemented
- [ ] Panel renders via json-render pattern
- [ ] Reuses SignalsCatalog patterns where applicable

### Phase 6: Settings
- [ ] Threshold configuration in settings panel
- [ ] Changes persist to Supabase

### Phase 7: Federated
- [ ] Toggle in settings panel
- [ ] Consent level selector
- [ ] Feature flag controls visibility

### Phase 8: Empty States
- [ ] "No matches" state for empty filter results
- [ ] Graceful degradation when service unavailable
- [ ] Pending state for assessments in progress

### E2E Tests
- [ ] All 9 test files created
- [ ] Visual snapshots captured
- [ ] All tests passing
- [ ] REVIEW.html completed with evidence

---

## Definition of Done

1. All 8 phases implemented
2. All acceptance criteria checked
3. E2E tests passing with visual verification
4. Console error-free
5. REVIEW.html complete with screenshots
6. Code follows json-render pattern for breakdown panel
7. Code follows factory pattern for SproutCard integration

---

## Reference Documents

- `docs/sprints/s10.1-sl-aicuration-v2/PRODUCT_BRIEF.md`
- `docs/sprints/s10.1-sl-aicuration-v2/WIREFRAME_PACKAGE.md`
- `docs/sprints/s10.1-sl-aicuration-v2/USER_STORIES.md`
- `docs/sprints/s10.1-sl-aicuration-v2/UX_CHIEF_APPROVAL.md`
- `docs/JSON_RENDER_PATTERN_GUIDE.md`
- `src/bedrock/consoles/ExperienceConsole/json-render/signals-catalog.ts` (reference)
- `src/bedrock/consoles/ExperienceConsole/json-render/attribution-catalog.ts` (reference)
