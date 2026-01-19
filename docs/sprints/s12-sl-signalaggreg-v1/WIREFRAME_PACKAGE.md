# UI/UX Designer Wireframe Package
## S12-SL-SignalAggregation v1

**Designer:** UI/UX Designer Agent
**Date:** 2026-01-18
**Status:** APPROVED
**Product Brief:** PRODUCT_BRIEF.md (UX Chief + PM Approved)

---

## Design Philosophy

> *"Real data, not decoration. Evidence, not opinion."*

This sprint transforms static displays into **living dashboards**. Every component shows computed, real-time data — not placeholder values. The design philosophy follows Grove's declarative principles:

1. **Data Drives Display** — Components render what aggregation provides
2. **Configuration Over Code** — Thresholds, colors, formats are declarative
3. **Progressive Disclosure** — Summary → Detail on interaction
4. **Trust Through Transparency** — Show "Last computed" timestamps

---

## Component Inventory

### Existing SignalsCatalog Components (Reuse)

All required components **already exist** in `src/bedrock/consoles/ExperienceConsole/json-render/`:

| Component | Schema | Purpose in S12 |
|-----------|--------|----------------|
| **MetricCard** | `MetricCardSchema` | Individual vital signs (Views, Retrievals) |
| **MetricRow** | `MetricRowSchema` | Grouped metrics in horizontal layout |
| **QualityGauge** | `QualityGaugeSchema` | Quality score progress bar with thresholds |
| **DiversityBadge** | `DiversityBadgeSchema` | Audience breadth indicator |
| **AdvancementIndicator** | `AdvancementIndicatorSchema` | Eligibility checklist with progress |
| **EventBreakdown** | `EventBreakdownSchema` | Event type distribution |
| **SignalHeader** | `SignalHeaderSchema` | Section header with refresh button |
| **ActivityTimeline** | `ActivityTimelineSchema` | Event history list |

### New Component: CompactSignalBadge

One new component needed for Nursery card integration:

```typescript
// signals-catalog.ts (addition)
export const CompactSignalBadgeSchema = z.object({
  type: z.literal('compact-signal-badge'),
  icon: z.enum(['view', 'retrieve', 'rating', 'quality']),
  value: z.union([z.number(), z.string()]),
  label: z.string().optional(),
  color: z.enum(['default', 'green', 'amber', 'red']).default('default'),
  tooltip: z.string().optional(),
});
```

**Rationale:** Existing MetricCard is too large for card-level badges. CompactSignalBadge provides minimal footprint for quick scanning.

---

## Wireframe 1: Vital Signs Panel (FinishingRoom)

### Location
`/explore` → GardenInspector Modal → "Finishing Room" Tab → Vital Signs Section

### Component Composition

```
┌─────────────────────────────────────────────────────────────────────┐
│ <SignalHeader>                                                       │
│   title: "Vital Signs"                                              │
│   subtitle: "Real-time knowledge health metrics"                    │
│   refreshButton: true                                               │
│   lastUpdated: {computed_at}                                        │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ <MetricRow>                                                          │
│   ┌───────────────┐ ┌───────────────┐ ┌───────────────┐             │
│   │ <MetricCard>  │ │ <MetricCard>  │ │ <MetricCard>  │             │
│   │ label: Views  │ │ label: Uses   │ │ label: Rating │             │
│   │ value: 47     │ │ value: 12     │ │ value: 4.2    │             │
│   │ trend: ▲12    │ │ trend: ▲3     │ │ trend: ─      │             │
│   │ icon: eye     │ │ icon: download│ │ icon: star    │             │
│   └───────────────┘ └───────────────┘ └───────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ <MetricRow>                                                          │
│   ┌─────────────────────────────────┐ ┌─────────────────────────────┐│
│   │ <QualityGauge>                  │ │ <DiversityBadge>            ││
│   │ score: 0.78                     │ │ index: 0.65                 ││
│   │ label: "Quality Score"          │ │ label: "Diversity"          ││
│   │ thresholds:                     │ │ uniqueUsers: 23             ││
│   │   low: 0.3, med: 0.6, high: 0.8│ │                             ││
│   └─────────────────────────────────┘ └─────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ <AdvancementIndicator>                                               │
│   eligible: true                                                    │
│   qualityScore: 0.78                                                │
│   criteria:                                                         │
│     viewCountMet: true  (✓ 47 views ≥ 10 required)                 │
│     qualityScoreMet: true  (✓ 0.78 ≥ 0.6 threshold)                │
│     diversityMet: true  (✓ 23 users ≥ 5 required)                  │
│     daysActiveMet: true  (✓ 3 days ≥ 1 required)                   │
│   nextTier: "Tier 2: Seedling"                                      │
│   progressPercent: 78                                               │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Transform

```typescript
// signal-aggregation-transform.ts (new file)
export function sproutAggregationToVitalSigns(
  aggregation: DocumentSignalAggregation,
  sprout: ResearchSprout
): RenderTree {
  return {
    type: 'container',
    children: [
      {
        type: 'signal-header',
        title: 'Vital Signs',
        subtitle: 'Real-time knowledge health metrics',
        refreshButton: true,
        lastUpdated: aggregation.computed_at,
      },
      {
        type: 'metric-row',
        metrics: [
          {
            type: 'metric-card',
            label: 'Views',
            value: aggregation.view_count,
            icon: 'eye',
            trend: computeTrend(aggregation.view_count_7d, aggregation.view_count_30d),
          },
          {
            type: 'metric-card',
            label: 'Uses',
            value: aggregation.retrieval_count,
            icon: 'download',
            trend: computeTrend(aggregation.retrieval_count_7d, aggregation.retrieval_count_30d),
          },
          {
            type: 'metric-card',
            label: 'Rating',
            value: aggregation.average_rating?.toFixed(1) ?? 'N/A',
            format: 'decimal',
            icon: 'star',
          },
        ],
      },
      {
        type: 'metric-row',
        metrics: [
          {
            type: 'quality-gauge',
            score: aggregation.quality_score,
            label: 'Quality Score',
            thresholds: { low: 0.3, medium: 0.6, high: 0.8 },
          },
          {
            type: 'diversity-badge',
            index: aggregation.diversity_index,
            label: 'Diversity',
            uniqueUsers: aggregation.unique_user_count,
          },
        ],
      },
      {
        type: 'advancement-indicator',
        eligible: aggregation.advancement_eligible,
        qualityScore: aggregation.quality_score,
        criteria: {
          viewCountMet: aggregation.view_count >= 10,
          qualityScoreMet: aggregation.quality_score >= 0.6,
          diversityMet: aggregation.unique_user_count >= 5,
          daysActiveMet: sprout.days_since_creation >= 1,
        },
        nextTier: getNextTierName(sprout.tier),
      },
    ],
  };
}
```

### Configuration Points (Declarative Sovereignty)

| Config | Location | Default | Description |
|--------|----------|---------|-------------|
| `qualityThresholds` | Transform param | `{low:0.3, med:0.6, high:0.8}` | QualityGauge color breakpoints |
| `advancementViewMin` | SQL function param | `10` | Views required for advancement |
| `advancementQualityMin` | SQL function param | `0.6` | Quality score threshold |
| `advancementDiversityMin` | SQL function param | `5` | Unique users required |
| `trendPeriod` | Transform param | `'7d'` | Period for trend calculation |

---

## Wireframe 2: Signal Badges (Nursery Cards)

### Location
`/bedrock/nursery` → Queue Cards → Badge Row

### Component Composition

```
┌─────────────────────────────────────────────────────────────────────┐
│ NURSERY CARD                                                         │
│                                                                     │
│ "Understanding Distributed Inference"                               │
│ ────────────────────────────────────                               │
│ Created 3 days ago • Ready for review                              │
│                                                                     │
│ ┌──────────────────────────────────────────────────────────────────┐│
│ │ SIGNAL BADGES ROW                                                ││
│ │                                                                  ││
│ │ <CompactSignalBadge>  <CompactSignalBadge>  <CompactSignalBadge> ││
│ │ icon: eye             icon: download        icon: star           ││
│ │ value: "47"           value: "12"           value: "4.2"         ││
│ │ tooltip: "47 views"   tooltip: "12 uses"    tooltip: "4.2 rating"││
│ │                                                                  ││
│ │ <QualityGauge compact=true>                                      ││
│ │ score: 0.78                                                      ││
│ │ width: "120px"                                                   ││
│ └──────────────────────────────────────────────────────────────────┘│
│                                                                     │
│ [Review] [Promote] [Refine]                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Badge Layout Specifications

```css
/* Compact badge styling */
.signal-badge-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 0;
}

.compact-signal-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--badge-bg, #f5f5f5);
  font-size: 12px;
  font-weight: 500;
}

.compact-signal-badge[data-color="green"] { --badge-bg: #dcfce7; color: #166534; }
.compact-signal-badge[data-color="amber"] { --badge-bg: #fef3c7; color: #92400e; }
.compact-signal-badge[data-color="red"]   { --badge-bg: #fee2e2; color: #991b1b; }
```

### Component Schema Addition

```typescript
// CompactSignalBadge component
export const CompactSignalBadge: React.FC<CompactSignalBadgeProps> = ({
  icon,
  value,
  label,
  color = 'default',
  tooltip,
}) => {
  const IconComponent = iconMap[icon];

  return (
    <div
      className="compact-signal-badge"
      data-color={color}
      title={tooltip}
      role="img"
      aria-label={`${label ?? icon}: ${value}`}
    >
      <IconComponent size={14} aria-hidden="true" />
      <span>{value}</span>
    </div>
  );
};
```

### Icon Mapping

| Icon Key | Visual | Meaning |
|----------|--------|---------|
| `view` | Eye icon | View count |
| `retrieve` | Download icon | Retrieval/use count |
| `rating` | Star icon | Average rating |
| `quality` | Gauge icon | Quality score |
| `diversity` | Users icon | Diversity index |

---

## Wireframe 3: Analytics Dashboard Signal Overview

### Location
`/bedrock/experience` → Analytics Tab → Signal Aggregation Section

### Component Composition

```
┌─────────────────────────────────────────────────────────────────────┐
│ <SignalHeader>                                                       │
│   title: "Signal Aggregation Observatory"                           │
│   subtitle: "Knowledge corpus health metrics"                       │
│   refreshButton: true                                               │
│   lastUpdated: {most_recent_computation}                            │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ SUMMARY METRICS ROW                                                  │
│                                                                     │
│ <MetricRow>                                                          │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────┐│
│ │ Total Events  │ │ Docs w/ Data  │ │ Avg Quality   │ │Coverage % ││
│ │    1,247      │ │     156       │ │     0.68      │ │    78%    ││
│ │    ▲ 23%      │ │    ▲ 12       │ │    ▲ 0.02     │ │   ▲ 5%   ││
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────┘│
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ EVENT BREAKDOWN                                                      │
│                                                                     │
│ <EventBreakdown>                                                     │
│   events:                                                           │
│     - type: "viewed",    count: 847, percent: 68%                   │
│     - type: "retrieved", count: 312, percent: 25%                   │
│     - type: "rated",     count: 88,  percent: 7%                    │
│                                                                     │
│   ████████████████████████████████░░░░░░░░░░░░░░░░ viewed (68%)     │
│   ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ retrieved (25%) │
│   ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ rated (7%)      │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌───────────────────────────────────┬─────────────────────────────────┐
│ TOP PERFORMERS                    │ NEEDS ATTENTION                  │
│ <ActivityTimeline>                │ <ActivityTimeline>               │
│                                   │                                  │
│ 1. Distributed Inference  (0.92) │ 1. Draft: Untitled      (0.23)  │
│ 2. Token Economics        (0.88) │ 2. Notes: Meeting       (0.31)  │
│ 3. Agent Coordination     (0.85) │ 3. Research: Old Topic  (0.35)  │
│ 4. Knowledge Markets      (0.82) │ 4. Idea: Abandoned      (0.38)  │
│ 5. Hardware Sovereignty   (0.79) │ 5. Concept: Unclear     (0.41)  │
└───────────────────────────────────┴─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ QUALITY DISTRIBUTION                                                 │
│                                                                     │
│ <FunnelChart variant="histogram">                                   │
│                                                                     │
│        │                    ▓▓▓▓                                   │
│        │              ▓▓▓▓  ▓▓▓▓  ▓▓▓▓                             │
│        │        ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓                       │
│        │  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓                 │
│        └──────────────────────────────────────────►                │
│          0.0-0.2  0.2-0.4  0.4-0.6  0.6-0.8  0.8-1.0               │
│             (12)    (23)     (45)     (52)    (24)                  │
│                                                                     │
│   Median: 0.62  |  Std Dev: 0.18  |  Range: 0.12 - 0.94            │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Transform for Analytics

```typescript
// analytics-signal-transform.ts
export function aggregationsToAnalyticsDashboard(
  aggregations: DocumentSignalAggregation[],
  events: SproutUsageEvent[]
): RenderTree {
  const totalEvents = events.length;
  const docsWithData = aggregations.filter(a => a.view_count > 0).length;
  const avgQuality = average(aggregations.map(a => a.quality_score));
  const coverage = (docsWithData / aggregations.length) * 100;

  const eventCounts = countBy(events, 'event_type');
  const qualityDistribution = bucketize(aggregations.map(a => a.quality_score), 5);

  const topPerformers = [...aggregations]
    .sort((a, b) => b.quality_score - a.quality_score)
    .slice(0, 5);

  const needsAttention = [...aggregations]
    .sort((a, b) => a.quality_score - b.quality_score)
    .slice(0, 5);

  return {
    type: 'container',
    children: [
      // Header
      {
        type: 'signal-header',
        title: 'Signal Aggregation Observatory',
        subtitle: 'Knowledge corpus health metrics',
        refreshButton: true,
        lastUpdated: maxBy(aggregations, 'computed_at')?.computed_at,
      },
      // Summary metrics
      {
        type: 'metric-row',
        metrics: [
          { type: 'metric-card', label: 'Total Events', value: totalEvents, format: 'number' },
          { type: 'metric-card', label: 'Docs w/ Data', value: docsWithData, format: 'number' },
          { type: 'metric-card', label: 'Avg Quality', value: avgQuality, format: 'decimal' },
          { type: 'metric-card', label: 'Coverage', value: coverage, format: 'percent' },
        ],
      },
      // Event breakdown
      {
        type: 'event-breakdown',
        events: [
          { type: 'viewed', count: eventCounts.viewed, percent: (eventCounts.viewed / totalEvents) * 100 },
          { type: 'retrieved', count: eventCounts.retrieved, percent: (eventCounts.retrieved / totalEvents) * 100 },
          { type: 'rated', count: eventCounts.rated, percent: (eventCounts.rated / totalEvents) * 100 },
        ],
      },
      // Two-column lists
      {
        type: 'two-column-layout',
        left: {
          type: 'activity-timeline',
          title: 'Top Performers',
          items: topPerformers.map(a => ({
            label: a.document_title,
            value: a.quality_score.toFixed(2),
            color: 'green',
          })),
        },
        right: {
          type: 'activity-timeline',
          title: 'Needs Attention',
          items: needsAttention.map(a => ({
            label: a.document_title,
            value: a.quality_score.toFixed(2),
            color: 'red',
          })),
        },
      },
      // Quality distribution histogram
      {
        type: 'funnel-chart',
        variant: 'histogram',
        data: qualityDistribution,
        xLabel: 'Quality Score Range',
        yLabel: 'Document Count',
      },
    ],
  };
}
```

---

## Accessibility Checklist

### WCAG 2.1 AA Compliance

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| **Color Contrast** | All text meets 4.5:1 ratio; icons meet 3:1 | Required |
| **Focus Indicators** | All interactive elements have visible focus ring | Required |
| **Screen Reader Labels** | All metrics have `aria-label` with full context | Required |
| **Keyboard Navigation** | Tab order follows visual flow; refresh button focusable | Required |
| **Motion Preferences** | Trend animations respect `prefers-reduced-motion` | Required |

### Specific Implementations

#### MetricCard Accessibility
```tsx
<div
  className="metric-card"
  role="group"
  aria-labelledby={`${id}-label`}
>
  <span id={`${id}-label`} className="sr-only">
    {label}: {value} {trend && `(${trend.direction} ${trend.delta})`}
  </span>
  {/* Visual content */}
</div>
```

#### QualityGauge Accessibility
```tsx
<div
  role="progressbar"
  aria-valuenow={score * 100}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label={`Quality score: ${(score * 100).toFixed(0)} percent`}
>
  {/* Visual gauge */}
</div>
```

#### Refresh Button Accessibility
```tsx
<button
  onClick={onRefresh}
  disabled={isRefreshing}
  aria-busy={isRefreshing}
  aria-label={isRefreshing ? "Refreshing metrics..." : "Refresh metrics"}
>
  <RefreshIcon aria-hidden="true" />
  <span className="sr-only">
    {isRefreshing ? "Refreshing..." : "Refresh"}
  </span>
</button>
```

### Screen Reader Announcement Pattern

When metrics refresh:
```tsx
const [announcement, setAnnouncement] = useState('');

const handleRefresh = async () => {
  setAnnouncement('Refreshing metrics...');
  await refresh();
  setAnnouncement(`Metrics updated. Quality score is now ${score}`);
};

return (
  <>
    <div aria-live="polite" className="sr-only">{announcement}</div>
    {/* Components */}
  </>
);
```

---

## Declarative Configuration Points

### Runtime Configurable (No Code Deploy)

| Config Key | Type | Location | Default | Effect |
|------------|------|----------|---------|--------|
| `signals.qualityThresholds.low` | number | SQL param | 0.3 | Red zone boundary |
| `signals.qualityThresholds.medium` | number | SQL param | 0.6 | Amber zone boundary |
| `signals.qualityThresholds.high` | number | SQL param | 0.8 | Green zone boundary |
| `signals.advancement.viewsRequired` | number | SQL param | 10 | Views for eligibility |
| `signals.advancement.qualityRequired` | number | SQL param | 0.6 | Quality for eligibility |
| `signals.advancement.diversityRequired` | number | SQL param | 5 | Unique users for eligibility |
| `signals.refresh.autoIntervalMs` | number | Cron config | 300000 | Auto-refresh interval |
| `signals.refresh.debounceMs` | number | Hook config | 30000 | Manual refresh cooldown |

### Transform Configurable (Code Change)

| Config | Type | Location | Default | Effect |
|--------|------|----------|---------|--------|
| `trendPeriod` | '7d' | '30d' | Transform param | '7d' | Period for trend calculation |
| `topPerformersCount` | number | Transform param | 5 | Items in leaderboard |
| `histogramBuckets` | number | Transform param | 5 | Distribution granularity |

### Feature Flags (Global Settings)

| Flag | Default | Effect |
|------|---------|--------|
| `signals.showTrends` | true | Display trend indicators (▲/▼/─) |
| `signals.showAdvancementProgress` | true | Show progress bar to next tier |
| `signals.enableManualRefresh` | true | Allow user-triggered refresh |
| `signals.showDiversityIndex` | true | Display diversity metric |

---

## Visual Design Specifications

### Color Palette (Signal States)

```css
:root {
  /* Quality Score Colors */
  --signal-quality-low: #ef4444;      /* Red - needs attention */
  --signal-quality-medium: #f59e0b;   /* Amber - progressing */
  --signal-quality-high: #22c55e;     /* Green - healthy */
  --signal-quality-excellent: #16a34a; /* Dark green - top performer */

  /* Trend Colors */
  --signal-trend-up: #22c55e;
  --signal-trend-down: #ef4444;
  --signal-trend-flat: #6b7280;

  /* Badge Backgrounds */
  --badge-default-bg: #f3f4f6;
  --badge-green-bg: #dcfce7;
  --badge-amber-bg: #fef3c7;
  --badge-red-bg: #fee2e2;
}
```

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Metric Value | JetBrains Mono | 24px | 600 |
| Metric Label | Inter | 12px | 500 |
| Trend Delta | JetBrains Mono | 12px | 500 |
| Section Header | Inter | 16px | 600 |
| Timestamp | Inter | 11px | 400 |

### Spacing

| Context | Value |
|---------|-------|
| Card padding | 16px |
| Metric row gap | 12px |
| Badge row gap | 8px |
| Section margin | 24px |

---

## Integration Points

### FinishingRoom Integration

```typescript
// SproutFinishingRoom.tsx
import { Renderer } from '@bedrock/json-render';
import { SignalsCatalog } from '@bedrock/json-render/signals-catalog';
import { sproutAggregationToVitalSigns } from './transforms/signal-aggregation-transform';

const VitalSignsSection: React.FC<{ sproutId: string }> = ({ sproutId }) => {
  const { aggregation, refresh, isRefreshing } = useSproutAggregations(sproutId);
  const sprout = useSprout(sproutId);

  if (!aggregation || !sprout) return <VitalSignsSkeleton />;

  const renderTree = sproutAggregationToVitalSigns(aggregation, sprout);

  return (
    <Renderer
      tree={renderTree}
      registry={SignalsCatalog}
      context={{ onRefresh: refresh, isRefreshing }}
    />
  );
};
```

### Nursery Card Integration

```typescript
// NurserySproutCard.tsx
import { CompactSignalBadge } from '@bedrock/json-render/signals-registry';

const SignalBadgeRow: React.FC<{ aggregation: DocumentSignalAggregation }> = ({ aggregation }) => (
  <div className="signal-badge-row">
    <CompactSignalBadge icon="view" value={aggregation.view_count} tooltip={`${aggregation.view_count} views`} />
    <CompactSignalBadge icon="retrieve" value={aggregation.retrieval_count} tooltip={`${aggregation.retrieval_count} uses`} />
    <CompactSignalBadge icon="rating" value={aggregation.average_rating?.toFixed(1) ?? 'N/A'} tooltip="Average rating" />
    <QualityGauge score={aggregation.quality_score} compact />
  </div>
);
```

### Analytics Dashboard Integration

```typescript
// ExperienceConsole.tsx (Analytics section)
import { aggregationsToAnalyticsDashboard } from './transforms/analytics-signal-transform';

const SignalAnalyticsSection: React.FC = () => {
  const { aggregations } = useAllAggregations();
  const { events } = useRecentEvents({ limit: 1000 });

  const renderTree = aggregationsToAnalyticsDashboard(aggregations, events);

  return (
    <section id="signal-analytics">
      <Renderer tree={renderTree} registry={SignalsCatalog} />
    </section>
  );
};
```

---

## New Files Required

| File | Purpose |
|------|---------|
| `src/bedrock/.../signal-aggregation-transform.ts` | Vital Signs panel transform |
| `src/bedrock/.../analytics-signal-transform.ts` | Analytics dashboard transform |
| `CompactSignalBadge` addition to signals-registry.tsx | Compact badge component |
| `CompactSignalBadgeSchema` addition to signals-catalog.ts | Badge schema |

---

## Designer Approval

**I, the UI/UX Designer, approve this wireframe package for S12-SL-SignalAggregation v1.**

### Approval Conditions

1. **Reuse existing components** — MetricCard, QualityGauge, etc. from SignalsCatalog
2. **Add CompactSignalBadge** — Single new component for Nursery cards
3. **Follow json-render pattern** — All data display via Renderer + transforms
4. **Accessibility required** — All WCAG 2.1 AA items must be implemented
5. **Configuration points documented** — Declarative sovereignty verified

### Design Quality Gates

| Gate | Requirement | Verification |
|------|-------------|--------------|
| **Visual Consistency** | Components match Quantum Glass v1.0 | Visual review |
| **Responsive Layout** | Works at 1024px, 1280px, 1440px widths | Playwright tests |
| **Accessibility** | WCAG 2.1 AA compliant | axe-core audit |
| **Performance** | Renders in < 100ms | Lighthouse audit |

---

**Approval Signature:**
```
+================================================================+
|                                                                |
|  DESIGN APPROVED: S12-SL-SignalAggregation v1                 |
|                                                                |
|  UI/UX Designer Agent                                          |
|  Interface Architect                                           |
|  Date: 2026-01-18                                              |
|                                                                |
|  "Real data transforms static screens into living dashboards.  |
|   The design serves the data; the data serves the user."       |
|                                                                |
+================================================================+
```

---

## Next Steps

1. **UX Chief Final Review** — Verify DEX compliance maintained in wireframes
2. **User Story Refinery** — Generate Gherkin acceptance criteria from wireframes
3. **Developer Execution** — Build Phase 1 (Infrastructure) first, then UI
4. **Visual Verification** — Capture 56 screenshots per VISUAL_EVIDENCE_SPEC.md

---

*Wireframe Package v1.0 — Aligned with Product Pod Playbook*
