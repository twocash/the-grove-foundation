# EXECUTION PROMPT: S12-SL-SignalAggregation v1

## Real Usage Metrics Engine

**Sprint:** S12-SL-SignalAggregation v1
**Codename:** The Awakening
**Status:** Ready for Execution
**Constraint Level:** 11b (Sprint-tier, 50+ screenshots)

---

## Executive Summary

This sprint completes Grove's signal aggregation circuit. Currently, events fire but nothing listens — `useSproutAggregations` returns zeros because no aggregation engine exists. This sprint builds the engine that transforms raw usage events into actionable metrics.

**Mission:** Make Grove's nervous system functional. Events fire → Aggregation computes → UI displays real data.

---

## PM Clarifications (Binding)

These clarifications from PM Review are **mandatory implementation details**:

| Clarification | Implementation |
|---------------|----------------|
| **Diversity Index** | Count of unique user IDs who interacted: `unique_user_count` column |
| **Quality Score Formula** | `quality = 0.4*utility + 0.3*views + 0.2*diversity + 0.1*recency` |
| **Cron Schedule** | 5-minute intervals: `*/5 * * * *` |
| **Refresh Rate Limiting** | 30-second debounce: `debounceMs: 30000` |
| **Advancement Threshold** | `quality >= 0.6` (configurable via SQL param `quality_threshold`) |

---

## Technical Prerequisites

### Verified Dependencies

| Dependency | Status | Location |
|------------|--------|----------|
| Migration 016 (sprout_usage_events) | EXISTS | `supabase/migrations/` |
| Migration 021 (document_signal_aggs) | EXISTS | `supabase/migrations/` |
| useSproutSignals hook | WORKING | `src/hooks/` |
| useSproutAggregations hook | WORKING (returns zeros) | `src/hooks/` |
| SignalsCatalog | EXISTS | `src/bedrock/consoles/ExperienceConsole/json-render/` |

### Schema Verification Required

Before coding, verify FK chain exists:
```sql
-- Verify join path: event → sprout → document → aggregation
SELECT
  e.sprout_id,
  s.source_document_id,
  a.document_id
FROM sprout_usage_events e
JOIN research_sprouts s ON e.sprout_id = s.id
LEFT JOIN document_signal_aggregations a ON s.source_document_id = a.document_id
LIMIT 1;
```

If join fails, add migration to fix FK relationships.

---

## Execution Phases

### Phase 1: Infrastructure (12 screenshots)

**Goal:** Build the aggregation engine in PostgreSQL.

#### Tasks

1. **Create `compute_aggregations()` function**
   ```sql
   CREATE OR REPLACE FUNCTION compute_aggregations(
     quality_threshold NUMERIC DEFAULT 0.6,
     view_weight NUMERIC DEFAULT 0.3,
     utility_weight NUMERIC DEFAULT 0.4,
     diversity_weight NUMERIC DEFAULT 0.2,
     recency_weight NUMERIC DEFAULT 0.1
   ) RETURNS void AS $$
   BEGIN
     -- Join events → sprouts → documents
     -- Aggregate by document_id
     -- Compute quality_score using weighted formula
     -- Store in document_signal_aggregations
   END;
   $$ LANGUAGE plpgsql;
   ```

2. **Add provenance columns**
   - `computed_at` — timestamp of computation
   - `first_event_at` — earliest event in aggregation window
   - `last_event_at` — latest event in aggregation window
   - `computation_method` — 'batch_cron' | 'manual_refresh'

3. **Create `verify_aggregation_chain()` utility**
   ```sql
   -- Returns whether FK chain is complete for a sprout
   CREATE FUNCTION verify_aggregation_chain(sprout_id UUID)
   RETURNS TABLE(
     event_exists BOOLEAN,
     sprout_exists BOOLEAN,
     document_exists BOOLEAN,
     aggregation_exists BOOLEAN
   );
   ```

#### Screenshot Checklist (Phase 1)
- [ ] A1: `infrastructure/01-view-event-emission.png`
- [ ] A2: `infrastructure/02-retrieve-event-emission.png`
- [ ] A3: `infrastructure/03-rate-event-emission.png`
- [ ] A4: `infrastructure/04-network-tab-event-post.png`
- [ ] A5: `infrastructure/05-supabase-event-table-overview.png`
- [ ] A6: `infrastructure/06-event-table-view-rows.png`
- [ ] A7: `infrastructure/07-event-table-retrieve-rows.png`
- [ ] A8: `infrastructure/08-event-table-rate-rows.png`
- [ ] A9: `infrastructure/09-aggregation-function-call.png`
- [ ] A10: `infrastructure/10-aggregation-function-result.png`
- [ ] A11: `infrastructure/11-aggregation-table-populated.png`
- [ ] A12: `infrastructure/12-aggregation-join-query.png`

**Review Gate:** Aggregation function computes non-zero values from real events.

---

### Phase 2: FinishingRoom Integration (12 screenshots)

**Goal:** Display real vital signs in Explorer's FinishingRoom.

#### Tasks

1. **Update Vital Signs Panel**
   - Integrate with `useSproutAggregations()` hook
   - Display: view_count, retrieval_count, quality_score, diversity_index
   - Add trend indicators (▲/▼/─) per Adams' feedback
   - Show "Last computed: X minutes ago" timestamp

2. **Add Refresh Button**
   - Calls `compute_aggregations()` for single document
   - 30-second debounce (PM clarification)
   - Loading state with spinner
   - aria-busy for accessibility

3. **Add Advancement Eligibility Panel**
   - Show criteria checklist (quality ✓, views ✓, diversity ○)
   - Progress bar to next tier
   - "Eligible" / "Not Eligible" badge

#### Component Integration

```typescript
// FinishingRoom uses json-render pattern
const vitalSignsData = useSproutAggregations(sproutId);

const renderTree = transformVitalSigns(vitalSignsData);
// Uses SignalsCatalog: MetricCard, QualityGauge, AdvancementIndicator
```

#### Screenshot Checklist (Phase 2)
- [ ] B1: `finishing-room/01-before-explore-page.png`
- [ ] B2: `finishing-room/02-before-inspector-open.png`
- [ ] B3: `finishing-room/03-before-vital-signs-zero.png` (BEFORE)
- [ ] B4: `finishing-room/04-before-advancement-unknown.png`
- [ ] B5: `finishing-room/05-during-user-interaction.png`
- [ ] B6: `finishing-room/06-during-console-events.png`
- [ ] B7: `finishing-room/07-after-vital-signs-real.png` (AFTER)
- [ ] B8: `finishing-room/08-after-view-count.png`
- [ ] B9: `finishing-room/09-after-quality-score.png`
- [ ] B10: `finishing-room/10-after-advancement-eligible.png`
- [ ] B11: `finishing-room/11-refresh-button-click.png`
- [ ] B12: `finishing-room/12-timestamp-updated.png`

**Review Gate:** FinishingRoom shows non-zero vital signs from real aggregation.

---

### Phase 3: Nursery Signal Badges (10 screenshots)

**Goal:** Add evidence-based curation to Nursery cards.

#### Tasks

1. **Create CompactSignalBadge component**
   ```typescript
   // New component for signals-registry.tsx
   interface CompactSignalBadgeProps {
     icon: '👁' | '📥' | '⭐';
     value: number;
     tooltip: string;
   }
   ```

2. **Update Nursery Card**
   - Add signal badges row: views, retrievals, rating
   - Add quality gauge (mini progress bar)
   - Tooltip on hover with full metrics

3. **Update Decision Panel**
   - Full metric breakdown when card selected
   - Quality score contribution weights visible
   - Promotion justification using metrics

4. **Add Sort by Quality**
   - Dropdown: "Sort by Quality (High to Low)"
   - Re-orders queue by quality_score

#### Screenshot Checklist (Phase 3)
- [ ] C1: `nursery/01-nursery-landing.png`
- [ ] C2: `nursery/02-nursery-queue-overview.png`
- [ ] C3: `nursery/03-card-view-count-badge.png`
- [ ] C4: `nursery/04-card-utility-score-badge.png`
- [ ] C5: `nursery/05-card-quality-bar.png`
- [ ] C6: `nursery/06-card-hover-tooltip.png`
- [ ] C7: `nursery/07-decision-panel-full.png`
- [ ] C8: `nursery/08-decision-panel-breakdown.png`
- [ ] C9: `nursery/09-promote-dialog-with-evidence.png`
- [ ] C10: `nursery/10-queue-reordered-by-quality.png`

**Review Gate:** Cultivators see signal badges and can sort by quality.

---

### Phase 4: Analytics Dashboard (10 screenshots)

**Goal:** Give Operators observatory-level visibility.

#### Tasks

1. **Add Signal Analytics Section to ExperienceConsole**
   - New tab or section in Analytics
   - Summary cards: Total Events, Docs with Data, Avg Quality, Coverage %

2. **Event Breakdown**
   - Pie/bar chart by event type
   - Counts: Viewed (X%), Retrieved (Y%), Rated (Z%)

3. **Quality Distribution**
   - Histogram with 5 buckets (0.0-0.2, 0.2-0.4, etc.)
   - Median quality score line
   - Top performers leaderboard
   - "Needs attention" list (lowest scores)

4. **Refresh Control**
   - "Refresh Aggregations" button
   - Shows "Computing..." state
   - Updates timestamp on completion

#### Screenshot Checklist (Phase 4)
- [ ] D1: `analytics/01-experience-console-analytics-tab.png`
- [ ] D2: `analytics/02-signal-overview-cards.png`
- [ ] D3: `analytics/03-event-count-detail.png`
- [ ] D4: `analytics/04-document-coverage.png`
- [ ] D5: `analytics/05-quality-distribution-histogram.png`
- [ ] D6: `analytics/06-top-sprouts-by-quality.png`
- [ ] D7: `analytics/07-bottom-sprouts-by-quality.png`
- [ ] D8: `analytics/08-refresh-button-idle.png`
- [ ] D9: `analytics/09-refresh-in-progress.png`
- [ ] D10: `analytics/10-refresh-complete-timestamp.png`

**Review Gate:** Operators can view corpus health and trigger manual refresh.

---

### Phase 5: E2E + DEX Compliance (12 screenshots)

**Goal:** Complete visual evidence and verify DEX compliance.

#### Tasks

1. **Write E2E Tests**
   ```
   tests/e2e/s12-signal-aggregation/
   ├── lifecycle.spec.ts      # Event → Aggregation → Display
   ├── features.spec.ts       # Refresh, badges, sorting
   └── analytics.spec.ts      # Dashboard tests
   ```

2. **Create Test Fixtures**
   ```typescript
   // fixtures/test-helpers.ts
   createTestSprout()
   createTestSproutWithSignals(signals)
   emitTestEvent(event)
   callAggregation(options)
   seedSproutsWithQualityScores(scores[])
   ```

3. **Verify DEX Compliance**
   - Test configurable threshold changes eligibility
   - Verify provenance fields populated
   - Confirm no AI/LLM dependencies

4. **Build REVIEW.html**
   - Follow structure in VISUAL_EVIDENCE_SPEC.md
   - Include all 56 screenshots
   - Add narrative for each section

#### Screenshot Checklist (Phase 5)
- [ ] E1: `e2e/01-journey-step1-user-views.png`
- [ ] E2: `e2e/02-journey-step2-event-fires.png`
- [ ] E3: `e2e/03-journey-step3-aggregation-runs.png`
- [ ] E4: `e2e/04-journey-step4-ui-displays.png`
- [ ] E5: `e2e/05-annotated-dataflow.png`
- [ ] E6: `e2e/06-architecture-diagram.png`
- [ ] F1: `dex/01-config-threshold-parameter.png`
- [ ] F2: `dex/02-threshold-change-no-deploy.png`
- [ ] F3: `dex/03-aggregation-audit-trail.png`
- [ ] F4: `dex/04-event-source-traceability.png`
- [ ] F5: `dex/05-no-model-dependency.png`
- [ ] F6: `dex/06-works-without-api.png`

**Review Gate:** All tests pass, REVIEW.html complete, DEX verified.

---

## User Stories Reference

Refer to `USER_STORIES.md` for:
- 13 user stories with Gherkin acceptance criteria
- Playwright E2E test specifications
- Visual verification point mappings

| Epic | Stories | E2E Tests |
|------|---------|-----------|
| Infrastructure | US-S12-001 to US-S12-003 | 4 |
| Explorer (FinishingRoom) | US-S12-004 to US-S12-006 | 8 |
| Cultivator (Nursery) | US-S12-007 to US-S12-009 | 6 |
| Operator (Analytics) | US-S12-010 to US-S12-012 | 5 |
| DEX Compliance | US-S12-013 | 1 |

**Total:** 13 stories, 24 E2E tests, 28 visual verification points

---

## Test Suite Structure

```
tests/e2e/s12-signal-aggregation/
├── lifecycle.spec.ts          # Core journey tests
├── features.spec.ts           # Feature-specific tests
├── analytics.spec.ts          # Dashboard tests
└── fixtures/
    ├── test-helpers.ts        # Utility functions
    └── test-data.ts           # Seeding functions
```

### Running Tests

```bash
# Run all sprint tests
npx playwright test tests/e2e/s12-signal-aggregation/

# Update baselines
npx playwright test --update-snapshots

# View report
npx playwright show-report
```

---

## Screenshot Directory Structure

```
docs/sprints/s12-sl-signalaggreg-v1/screenshots/
├── infrastructure/            # 12 screenshots (A1-A12)
├── finishing-room/            # 12 screenshots (B1-B12)
├── nursery/                   # 10 screenshots (C1-C10)
├── analytics/                 # 10 screenshots (D1-D10)
├── e2e/                       # 6 screenshots (E1-E6)
└── dex/                       # 6 screenshots (F1-F6)
```

**Total Required:** 56 screenshots (Constraint 11b compliant)

---

## Acceptance Criteria

Sprint is COMPLETE when:

- [ ] All 13 user stories implemented
- [ ] All 24 E2E tests passing
- [ ] All 56 screenshots captured
- [ ] `npm run build` succeeds with zero errors
- [ ] Console shows zero errors during feature navigation
- [ ] REVIEW.html complete with all evidence
- [ ] DEX compliance table shows all PASS
- [ ] Quality scores range 0.1-0.9 (not all 0.5)
- [ ] Aggregation freshness < 5 minutes on active sprouts

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `supabase/migrations/0XX_compute_aggregations.sql` | Aggregation function |
| `src/bedrock/consoles/ExperienceConsole/json-render/signals-registry.tsx` | Add CompactSignalBadge |
| `tests/e2e/s12-signal-aggregation/lifecycle.spec.ts` | Lifecycle tests |
| `tests/e2e/s12-signal-aggregation/features.spec.ts` | Feature tests |
| `tests/e2e/s12-signal-aggregation/analytics.spec.ts` | Analytics tests |
| `docs/sprints/s12-sl-signalaggreg-v1/REVIEW.html` | Visual evidence review |

### Existing Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useSproutAggregations.ts` | May need refresh trigger |
| `src/surface/components/modals/SproutFinishingRoom/` | Vital signs integration |
| `src/bedrock/consoles/NurseryConsole/` | Signal badges on cards |
| `src/bedrock/consoles/ExperienceConsole/` | Analytics section |

---

## Development Notes

### Quality Score Formula

```sql
quality_score = (
  (view_weight * normalized_views) +
  (utility_weight * normalized_utility) +
  (diversity_weight * normalized_diversity) +
  (recency_weight * recency_factor)
)

-- Where normalized_X = X / MAX(X) across all documents
-- recency_factor = 1 - (days_since_last_event / 30)
```

### Trend Calculation

```typescript
// Per Adams' feedback: show warming/cooling trends
const trend = {
  direction: current7d > previous7d ? 'up' : current7d < previous7d ? 'down' : 'stable',
  delta: current7d - previous7d,
  symbol: '▲' | '▼' | '─'
};
```

### Accessibility Requirements

- All badges have `aria-label` with full text
- Refresh buttons have `aria-busy` during loading
- Screen reader announcements on state changes
- Keyboard navigation for all controls

---

## Quick Reference Commands

```bash
# Start dev server
npm run dev

# Run sprint tests
npx playwright test tests/e2e/s12-signal-aggregation/

# Update screenshots
npx playwright test --update-snapshots

# Build check
npm run build

# Type check
npx tsc --noEmit
```

---

## Sprint Branch

```bash
git checkout -b feat/s12-signal-aggregation-v1
```

---

*"The nervous system exists. The signals fire. Now, something listens."*

---

**Prepared by:** User Story Refinery + Product Pod Review
**Approved by:** UX Chief (Final Approval: 2026-01-18)
**Ready for:** Developer Execution
