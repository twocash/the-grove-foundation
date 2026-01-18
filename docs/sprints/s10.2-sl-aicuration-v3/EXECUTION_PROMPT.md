# S10.2-SL-AICuration v3 - Execution Prompt
# Analytics + Override Workflows

## Sprint Context

**Sprint:** S10.2-SL-AICuration v3
**Codename:** Collaborative Intelligence
**Dependency:** S10.1-SL-AICuration v2 (Display + Filtering) - COMPLETED

This sprint builds on S10.1 to add:
- Quality Analytics Dashboard (read-only visualization)
- Score Attribution Panel ("Why This Score?")
- Override Submission Workflow
- Override History Timeline + Rollback
- Network Comparison
- Celebration Banner

---

## Prerequisites

- S10.1 complete with quality scoring types, badge, tooltip, filters, breakdown panel
- SignalsCatalog from S10.1 (MetricCard, MetricRow, etc.)
- Experience Console json-render pattern established

---

## Technical Requirements (MANDATORY)

### json-render Pattern Required For:

| Component | Catalog Name | Rationale |
|-----------|--------------|-----------|
| Analytics Dashboard | QualityAnalyticsCatalog | Read-only data display |
| Attribution Panel | AttributionCatalog | Read-only information |
| Override History | OverrideHistoryCatalog | Read-only audit trail |

### Traditional React (NOT json-render):

- Time Range Selector (interactive buttons)
- Export CSV Button (action trigger)
- Override Modal (form with validation)
- Rollback Button (destructive action)
- Celebration Banner (simple toast)

### SignalsCatalog Reuse (REQUIRED):

| Component | Reuse For |
|-----------|-----------|
| MetricCard | Dashboard stats |
| MetricRow | Metric grid |
| QualityGauge | Score bars |
| FunnelChart | Distribution |
| ActivityTimeline | Override history |

---

## Phase 1: Quality Analytics Dashboard (US-B001 to US-B006)

### 1.1 Create Analytics Types

**File:** `src/core/schema/quality-analytics.ts`

```typescript
export interface QualityAnalyticsData {
  avgScore: number;
  scoreTrend: TrendData;
  totalAssessed: number;
  assessedTrend: TrendData;
  aboveThreshold: number;
  overrideCount: number;
  overrideTrend: TrendData;
  dimensions: DimensionScore[];
  distribution: DistributionBucket[];
  trendData: TrendPoint[];
  networkPercentile: number;
  lastUpdated: string;
}

export type TimeRange = '7d' | '30d' | '90d' | 'all';

export interface TrendData {
  direction: 'up' | 'down' | 'neutral';
  delta: number;
}

export interface DistributionBucket {
  range: string;
  count: number;
  percentage: number;
}

export interface TrendPoint {
  date: string;
  groveAvg: number;
  networkAvg?: number;
}
```

### 1.2 Create Analytics Catalog (json-render)

**File:** `src/bedrock/consoles/ExperienceConsole/json-render/quality-analytics-catalog.ts`

Define schemas:
- AnalyticsHeaderSchema
- AnalyticsMetricRowSchema
- DimensionProfileSchema
- ScoreDistributionSchema
- QualityTrendChartSchema

### 1.3 Create Analytics Registry

**File:** `src/bedrock/consoles/ExperienceConsole/json-render/quality-analytics-registry.tsx`

Compose with SignalsRegistry:
```typescript
export const QualityAnalyticsRegistry = {
  ...SignalsRegistry,
  DimensionProfile: ({ element }) => <DimensionRadarChart {...element.props} />,
  QualityTrendChart: ({ element }) => <TrendLineChart {...element.props} />,
};
```

### 1.4 Create Analytics Transform

**File:** `src/bedrock/consoles/ExperienceConsole/json-render/quality-analytics-transform.ts`

### 1.5 Create Analytics Section Component

**File:** `src/bedrock/consoles/ExperienceConsole/sections/QualityAnalyticsSection.tsx`

Includes:
- TimeRangeSelector (interactive)
- Renderer with analytics tree
- ExportButton (interactive)

### 1.6 Create Hook for Analytics Data

**File:** `hooks/useQualityAnalytics.ts`

---

## Phase 2: Score Attribution Panel (US-B007 to US-B008)

### 2.1 Create Attribution Catalog (json-render)

**File:** `src/bedrock/consoles/ExperienceConsole/json-render/attribution-catalog.ts`

### 2.2 Create Attribution Registry with Educational Tone

**File:** `src/bedrock/consoles/ExperienceConsole/json-render/attribution-registry.tsx`

MANDATORY: Implement educational tone
- First-person plural ("We found")
- Positive findings before suggestions
- Lightbulb icon for improvements

### 2.3 Create AttributionPanel Component

**File:** `src/surface/components/QualityUI/AttributionPanel.tsx`

- Slide-in panel from right
- Uses json-render for content
- Request Override CTA (triggers modal)
- Close on X, Escape, outside click

### 2.4 Wire Badge Click to Attribution

Update QualityBadge to open attribution panel on click.

---

## Phase 3: Override Submission (US-B009 to US-B011)

### 3.1 Create Override Modal (Traditional React)

**File:** `src/surface/components/QualityUI/OverrideModal.tsx`

Components:
- Dimension score inputs with "(was XX)" labels
- Reason code dropdown (4 options)
- Explanation textarea with char count (min 20)
- Evidence dropzone (optional)
- Live composite preview
- Submit button with validation
- Confirmation dialog

NOT json-render - this is an interactive form.

### 3.2 Create Override Service

**File:** `services/overrideService.ts`

- submitOverride(sproutId, overrideData)
- uploadEvidence(file)

### 3.3 Create Override Types

**File:** `src/core/schema/quality-override.ts`

```typescript
export interface QualityOverride {
  id: string;
  sproutId: string;
  operatorId: string;
  timestamp: string;
  scoreBefore: number;
  scoreAfter: number;
  dimensions: Partial<QualityDimensions>;
  reasonCode: OverrideReasonCode;
  explanation: string;
  evidenceUrl?: string;
  rolledBack: boolean;
  rollbackTimestamp?: string;
}

export type OverrideReasonCode =
  | 'incorrect_assessment'
  | 'missing_context'
  | 'model_error'
  | 'other';
```

---

## Phase 4: Override History & Rollback (US-B012 to US-B013)

### 4.1 Create Override History Catalog (json-render)

**File:** `src/bedrock/consoles/ExperienceConsole/json-render/override-history-catalog.ts`

### 4.2 Create History Registry

**File:** `src/bedrock/consoles/ExperienceConsole/json-render/override-history-registry.tsx`

Reuse ActivityTimeline from SignalsCatalog.

### 4.3 Create OverrideHistoryTab Component

**File:** `src/surface/components/QualityUI/OverrideHistoryTab.tsx`

- Timeline display (json-render)
- Rollback button (interactive)
- Empty state when no history

### 4.4 Implement Rollback with Confirmation

- Confirmation dialog
- API call to rollback
- Audit trail entry

---

## Phase 5: Network Comparison (US-B014)

### 5.1 Add Network Data to Analytics

Update analytics transform to include:
- Network average line on charts
- Percentile ranking display

### 5.2 Update Charts for Comparison

- Radar chart: dotted line for network
- Trend chart: two lines (grove + network)

---

## Phase 6: Celebration Banner (US-B015)

### 6.1 Create CelebrationBanner Component

**File:** `src/surface/components/QualityUI/CelebrationBanner.tsx`

- Slides in from top
- Shows improvement details
- Auto-dismiss after 10s
- Dismiss button
- Track shown state in localStorage

### 6.2 Trigger on Dashboard Load

Check if improvement exceeds threshold (5 points).

---

## E2E Test Structure

```
tests/e2e/
├── quality-analytics/
│   ├── dashboard-overview.spec.ts      # US-B001
│   ├── time-range-selection.spec.ts    # US-B002
│   ├── dimension-radar-chart.spec.ts   # US-B003
│   ├── score-distribution.spec.ts      # US-B004
│   ├── quality-trend.spec.ts           # US-B005
│   ├── export-csv.spec.ts              # US-B006
│   ├── network-comparison.spec.ts      # US-B014
│   └── celebration-banner.spec.ts      # US-B015
├── quality-attribution/
│   ├── attribution-panel.spec.ts       # US-B007
│   └── badge-click.spec.ts             # US-B008
├── quality-override/
│   ├── open-modal.spec.ts              # US-B009
│   ├── submit-override.spec.ts         # US-B010
│   ├── evidence-upload.spec.ts         # US-B011
│   ├── history-timeline.spec.ts        # US-B012
│   └── rollback.spec.ts                # US-B013
```

---

## Screenshot Requirements

All screenshots to: `docs/sprints/s10.2-sl-aicuration-v3/screenshots/e2e/`

Naming convention: `{NN}-{description}.png`

---

## Acceptance Criteria Summary

| Story ID | Title | json-render Required |
|----------|-------|---------------------|
| US-B001 | Dashboard Overview | YES |
| US-B002 | Time Range Selection | NO |
| US-B003 | Radar Chart | YES (via catalog) |
| US-B004 | Score Distribution | YES (via catalog) |
| US-B005 | Quality Trend | YES (via catalog) |
| US-B006 | Export CSV | NO |
| US-B007 | Attribution Panel | YES |
| US-B008 | Badge Click | NO |
| US-B009 | Open Override Modal | NO |
| US-B010 | Submit Override | NO |
| US-B011 | Evidence Upload | NO |
| US-B012 | Override History | YES |
| US-B013 | Rollback | NO |
| US-B014 | Network Comparison | YES (via catalog) |
| US-B015 | Celebration Banner | NO |

---

## Definition of Done

- [ ] All 15 user stories implemented
- [ ] 3 json-render catalogs created (Analytics, Attribution, OverrideHistory)
- [ ] SignalsCatalog components reused
- [ ] Educational tone in Attribution (verified)
- [ ] E2E tests passing for all stories
- [ ] Visual verification of all screenshots
- [ ] Console audit clean (zero errors)
- [ ] REVIEW.html completed

---

**Execute in order: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → E2E Tests → Review**
