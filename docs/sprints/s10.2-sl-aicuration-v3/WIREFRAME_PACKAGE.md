# Wireframe Package: S10.2-SL-AICuration v3 - Analytics + Override Workflows

**Version:** 1.1
**Status:** APPROVED
**Designer:** UI/UX Designer Agent
**Reviewed by:** UX Chief

---

## Design Intent

Create a trust-building quality management experience that transforms opaque AI scoring into transparent, correctable assessments. Operators should feel like *partners* with the AI system, not subjects of it.

**Emotional Goals:**
- **Understanding:** "I know why this score was given"
- **Agency:** "I can correct mistakes"
- **Confidence:** "The system learns from my input"
- **Pride:** "My grove's quality is improving"

---

## Pattern Alignment

### Existing Patterns Used
| Pattern | Component | Usage |
|---------|-----------|-------|
| **StatCard** | `src/bedrock/primitives/StatCard.tsx` | Dashboard metrics |
| **GlassPanel** | `src/bedrock/primitives/GlassPanel.tsx` | Section containers |
| **EmptyState** | `src/bedrock/components/EmptyState.tsx` | Zero-data states |
| **GlassTable** | `src/bedrock/primitives/GlassTable.tsx` | Override history |
| **Modal pattern** | Various | Override submission |

### New Patterns Proposed
| Pattern | Purpose | Rationale |
|---------|---------|-----------|
| **AttributionCard** | Explain dimension scores | Educational, not defensive |
| **OverrideModal** | Score correction form | Structured input with reason codes |
| **HistoryTimeline** | Audit trail display | Provenance visibility |
| **ComparisonRadar** | Grove vs Network | Visual benchmarking |
| **CelebrationBanner** | Quality improvement | Positive reinforcement |
| **TrendSparkline** | Inline trend indicator | Quick pattern recognition |

---

## Wireframes

### Screen 1: Quality Analytics Dashboard

**Location:** Bedrock → Quality Analytics (new console)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◀ Bedrock                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Quality Analytics                           [7d] [30d] [90d] [All Time]   │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ 📊 78.4     │ │ 📈 1,247    │ │ ✓ 89.2%    │ │ ✏️ 23       │          │
│  │ Avg Score   │ │ Assessed    │ │ Above      │ │ Overrides   │          │
│  │ ↑ 3.2       │ │ ↑ 156       │ │ Threshold  │ │ ↓ 5         │          │
│  │ (green)     │ │ (cyan)      │ │ (green)    │ │ (amber)     │          │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘          │
│        ↑                                                                    │
│   StatCard with trend indicator                                             │
│                                                                             │
│  ┌───────────────────────────────────┐ ┌───────────────────────────────┐  │
│  │  Dimension Profile                │ │  Score Distribution           │  │
│  │  ─────────────────────────────── │ │  ─────────────────────────── │  │
│  │                                   │ │                               │  │
│  │         ◇ Accuracy (82)           │ │    <50   ░░░░░░░ 8%          │  │
│  │       ╱           ╲               │ │   50-70  ░░░░░░░░░░ 15%      │  │
│  │  Prov ◇             ◇ Utility     │ │   70-85  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 52%  │  │
│  │  (87)  ╲           ╱  (75)        │ │    85+   ▓▓▓▓▓▓▓▓▓ 25%       │  │
│  │         ◇ Novelty (68)            │ │                               │  │
│  │                                   │ │                               │  │
│  │     ── Your grove                 │ │                               │  │
│  │     ·· Network average            │ │                               │  │
│  │                                   │ │                               │  │
│  └───────────────────────────────────┘ └───────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Quality Trend                                                        │ │
│  │  ─────────────────────────────────────────────────────────────────── │ │
│  │                                                                       │ │
│  │  85 ─┼─────────────────────────────────────────────────────────────  │ │
│  │      │                                              ╱──────────      │ │
│  │  75 ─┼────────────────────────────────────────────╱                  │ │
│  │      │                              ╱─────────────                   │ │
│  │  65 ─┼────────────────────────────╱                                  │ │
│  │      │         ╱─────────────────                                    │ │
│  │  55 ─┼────────╱                                                      │ │
│  │      │────────                                                       │ │
│  │     ─┼─────────┬─────────┬─────────┬─────────┬─────────┬──────────  │ │
│  │      Jan 1    Jan 5    Jan 10   Jan 15   Jan 18                     │ │
│  │                                                                       │ │
│  │     ── Grove Average: 78.4    ·· Network Average: 72.1               │ │
│  │     Your grove is in the 73rd percentile                             │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│                                                        [Export CSV]        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Components Used:**
- `StatCard` array with trend indicators
- Recharts `RadarChart` for dimension profile
- Recharts `BarChart` for distribution (horizontal)
- Recharts `LineChart` for trend over time
- `GlassButton` for time range selection and export

**Interaction Notes:**
- **Time range buttons:** Mutually exclusive, URL state persisted
- **Hover on chart:** Tooltip with exact values
- **Export:** Downloads CSV with all visible data

**Accessibility Checklist:**
- [x] Keyboard navigable (Tab through all interactive elements)
- [x] Focus indicators visible
- [x] Charts have text alternatives (data table option)
- [x] Color contrast AA compliant
- [x] Screen reader announces metric changes

**Technical Implementation (MANDATORY):**
- **Pattern:** json-render (QualityAnalyticsCatalog)
- **Container:** `<Renderer tree={...} registry={QualityAnalyticsRegistry} catalog={QualityAnalyticsCatalog} />`
- **Transform:** `analyticsToRenderTree(analytics, timeRange)`
- **Time range selector:** Traditional React (outside render tree)
- **Export button:** Traditional React (outside render tree)
- **MUST reuse SignalsCatalog:** MetricCard, MetricRow, QualityGauge, FunnelChart

```typescript
// Required catalog file: src/bedrock/consoles/ExperienceConsole/json-render/quality-analytics-catalog.ts

export const QualityAnalyticsCatalog = {
  components: {
    AnalyticsHeader: { props: AnalyticsHeaderSchema },
    AnalyticsMetricRow: { props: AnalyticsMetricRowSchema },
    DimensionProfile: { props: DimensionProfileSchema },
    ScoreDistribution: { props: ScoreDistributionSchema },
    QualityTrendChart: { props: QualityTrendChartSchema },
  },
} as const;
```

**Registry Composition (SignalsCatalog reuse):**
```typescript
import { SignalsRegistry } from './signals-registry';

const QualityAnalyticsRegistry = {
  ...SignalsRegistry,  // Inherit MetricCard, MetricRow, etc.
  DimensionProfile: ({ element }) => { ... },
  QualityTrendChart: ({ element }) => { ... },
};
```

---

### Screen 2: Score Attribution Panel ("Why This Score?")

**Location:** Slide-in panel from breakdown panel link

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Why This Score?                                                       [×]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │  Overall: 78/100 (A-)                     Confidence: High (94%)     │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  ACCURACY: 82/100                                              ★★★★☆ │ │
│  │  ─────────────────────────────────────────────────────────────────── │ │
│  │                                                                       │ │
│  │  📝 Your content appears factually consistent and well-supported.    │ │
│  │                                                                       │ │
│  │  What we found:                                                       │ │
│  │  • Clear citations to external sources                               │ │
│  │  • Claims align with referenced materials                            │ │
│  │  • No internal contradictions detected                               │ │
│  │                                                                       │ │
│  │  💡 To improve: Consider adding primary source citations             │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  UTILITY: 75/100                                               ★★★★☆ │ │
│  │  ─────────────────────────────────────────────────────────────────── │ │
│  │                                                                       │ │
│  │  📝 Your content provides good practical value to readers.           │ │
│  │                                                                       │ │
│  │  What we found:                                                       │ │
│  │  • Actionable insights present                                       │ │
│  │  • Clear explanations of concepts                                    │ │
│  │                                                                       │ │
│  │  💡 To improve: Add concrete examples or case studies                │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  [Similar cards for Novelty and Provenance...]                             │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────── │
│                                                                             │
│  🤔 Think this assessment is wrong?                                        │
│                                                                             │
│  You can submit a correction with explanation. Your feedback helps         │
│  improve our assessment models for everyone.                               │
│                                                                             │
│                                            [ Request Override ]            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Design Philosophy: Educational, Not Defensive**

The attribution panel uses:
- **First-person plural:** "We found" not "The model determined"
- **Positive framing:** "What we found" before "To improve"
- **Star ratings:** Visual quick-scan alongside numeric scores
- **Improvement suggestions:** Constructive, not critical
- **Agency invitation:** "Think this is wrong?" empowers correction

**Components Used:**
- `GlassPanel` tier="elevated" for container
- Custom `AttributionCard` for each dimension
- Star rating component (visual indicator)
- `GlassButton` for override action

**Interaction Notes:**
- **Panel open:** Slide in from right (300ms)
- **Request Override:** Opens modal (Screen 3)
- **Dimension expand:** Optional accordion for very long reasoning

**Accessibility Checklist:**
- [x] Focus trapped within panel
- [x] Escape key closes
- [x] Star ratings have numeric text alternative
- [x] Improvement suggestions are not red (no negative connotation)

**Technical Implementation (MANDATORY):**
- **Pattern:** json-render (AttributionCatalog)
- **Container:** `<Renderer tree={...} registry={AttributionRegistry} catalog={AttributionCatalog} />`
- **Transform:** `qualityScoreToAttributionTree(score, assessment)`
- **Override CTA button:** Traditional React (triggers modal)
- **Educational tone MANDATORY** (Short narrative approach)

```typescript
// Required catalog file: src/bedrock/consoles/ExperienceConsole/json-render/attribution-catalog.ts

export const AttributionCatalog = {
  components: {
    AttributionHeader: { props: AttributionHeaderSchema },
    AttributionDimension: { props: AttributionDimensionSchema },
    AttributionOverrideCta: { props: AttributionOverrideCtaSchema },
  },
} as const;
```

**Registry MUST implement educational tone:**
```typescript
// Attribution dimension rendering with narrative approach
AttributionDimension: ({ element }) => {
  const props = element.props as AttributionDimensionProps;
  return (
    <div className="p-4 rounded border border-ink/10">
      {/* Header with stars - visual quick-scan */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{props.dimension.toUpperCase()}: {props.score}/100</span>
        <StarRating value={props.stars} />
      </div>

      {/* Educational narrative - NOT defensive */}
      <p className="text-sm text-ink/80 mb-3">
        {props.summary}  {/* "Your content appears factually consistent..." */}
      </p>

      {/* Findings - positive framing first */}
      <div className="mb-3">
        <span className="text-xs font-medium text-ink/60">What we found:</span>
        <ul className="list-disc list-inside text-sm">
          {props.findings.map((f, i) => <li key={i}>{f}</li>)}
        </ul>
      </div>

      {/* Improvement suggestion - constructive, not critical */}
      {props.suggestion && (
        <div className="text-sm text-amber-600 dark:text-amber-400">
          <span className="mr-1">💡</span>
          <span>To improve: {props.suggestion}</span>
        </div>
      )}
    </div>
  );
}
```

---

### Screen 3: Override Submission Modal

**Location:** Modal overlay from attribution panel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │  Override Quality Score                                          [×] │ │
│  │  ═══════════════════════════════════════════════════════════════════ │ │
│  │                                                                       │ │
│  │  Current Score: 45/100 (D)                                           │ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │  Your Corrected Scores                                          │ │ │
│  │  │  (Leave blank to keep the original value)                       │ │ │
│  │  │  ───────────────────────────────────────────────────────────── │ │ │
│  │  │                                                                 │ │ │
│  │  │  Accuracy      [  78  ]    (was 42)      ████████████░░░░      │ │ │
│  │  │  Utility       [  65  ]    (was 51)      █████████░░░░░░░      │ │ │
│  │  │  Novelty       [      ]    (was 38)      ← keeping original    │ │ │
│  │  │  Provenance    [  72  ]    (was 49)      ██████████░░░░░       │ │ │
│  │  │                                                                 │ │ │
│  │  │  New composite: ~72 (C+)                                       │ │ │
│  │  │                                                                 │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  Why are you correcting this score? *                                │ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │  ▼  Incorrect Assessment                                        │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  Options:                                                             │ │
│  │  • Incorrect Assessment - The evaluation doesn't match reality       │ │
│  │  • Missing Context - Important information wasn't considered         │ │
│  │  • Model Error - Technical issue with the assessment                 │ │
│  │  • Other - Different reason (explain below)                          │ │
│  │                                                                       │ │
│  │  Explain your correction: *                                          │ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │ The automated assessment didn't recognize the peer-reviewed    │ │ │
│  │  │ journal citations. The sources are from Nature and Science,    │ │ │
│  │  │ which should significantly increase the accuracy score.        │ │ │
│  │  │                                                                 │ │ │
│  │  │                                                                 │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │  Min 20 characters (currently: 187)                                  │ │
│  │                                                                       │ │
│  │  Supporting evidence (optional):                                      │ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │  📎 Drag files here or click to upload                         │ │ │
│  │  │     Supports: PDF, PNG, JPG (max 5MB)                          │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  ───────────────────────────────────────────────────────────────────│ │
│  │                                                                       │ │
│  │  ⚠️ Your correction will be recorded with your identity for         │ │
│  │     transparency. Other operators can see override history.          │ │
│  │                                                                       │ │
│  │                                    [ Cancel ]  [ Submit Override ]   │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Confirmation Step (after Submit clicked):**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Confirm Override                                               │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  You are about to change this quality score:                    │
│                                                                 │
│  45 (D)  →  72 (C+)                                            │
│                                                                 │
│  This action will:                                              │
│  • Update the displayed score immediately                       │
│  • Create a permanent audit record with your name               │
│  • Contribute to improving our assessment models                │
│                                                                 │
│                        [ Go Back ]  [ Confirm Override ]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Components Used:**
- Modal container with backdrop blur
- Numeric inputs with validation (0-100)
- Live preview bars showing new values
- Dropdown for reason code
- Textarea with character count
- File upload dropzone
- Confirmation dialog

**Interaction Notes:**
- **Score inputs:** Tab between fields, real-time composite preview
- **Reason dropdown:** Required selection before submit enabled
- **Explanation:** Required, minimum 20 characters
- **Submit:** Opens confirmation dialog first (PM recommendation)
- **Confirm:** Submits, shows success toast, closes modal

**Accessibility Checklist:**
- [x] Focus trapped within modal
- [x] Tab order logical (scores → reason → explanation → submit)
- [x] Required fields marked with asterisk and aria-required
- [x] Error messages announced by screen reader
- [x] Escape closes modal (with unsaved changes warning)

---

### Screen 4: Override History Timeline

**Location:** Tab within sprout detail view

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Sprout: "Research on Distributed Systems"                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  [ Overview ] [ Content ] [ Override History ]                              │
│                               ↑ selected                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Override History                                                           │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │  ●  Jan 17, 2026 at 14:32                              [ Rollback ]  │ │
│  │  │  ──────────────────────────────────────────────────────────────── │ │
│  │  │                                                                    │ │
│  │  │  alice@grove.network                                               │ │
│  │  │                                                                    │ │
│  │  │  Score: 45 → 72  (+27)                                            │ │
│  │  │  ▓▓▓▓▓▓▓▓▓░░░░░ → ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░                              │ │
│  │  │                                                                    │ │
│  │  │  Reason: Incorrect Assessment                                      │ │
│  │  │                                                                    │ │
│  │  │  "The automated assessment didn't recognize the peer-reviewed     │ │
│  │  │   journal citations..."                                            │ │
│  │  │                                                                    │ │
│  │  │  📎 evidence.pdf attached                                          │ │
│  │  │                                                                    │ │
│  └──┼───────────────────────────────────────────────────────────────────┘ │
│     │                                                                       │
│  ┌──┼───────────────────────────────────────────────────────────────────┐ │
│  │  │                                                                    │ │
│  │  ●  Jan 15, 2026 at 09:15                           ⟲ ROLLED BACK   │ │
│  │  │  ──────────────────────────────────────────────────────────────── │ │
│  │  │                                                                    │ │
│  │  │  bob@grove.network                                                 │ │
│  │  │                                                                    │ │
│  │  │  Score: 78 → 45  (-33)                                            │ │
│  │  │                                                                    │ │
│  │  │  Reason: Model Error                                               │ │
│  │  │                                                                    │ │
│  │  │  "Model hallucinated source quality. The citations don't          │ │
│  │  │   actually exist..."                                               │ │
│  │  │                                                                    │ │
│  │  │  Rolled back on Jan 17, 2026 by alice@grove.network               │ │
│  │  │                                                                    │ │
│  └──┼───────────────────────────────────────────────────────────────────┘ │
│     │                                                                       │
│     ○  Original score: 78/100                                              │
│        Assessed: Jan 14, 2026 at 11:00                                     │
│        Model: grove-quality-v1                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Components Used:**
- Timeline layout with connected nodes
- `GlassPanel` for each history entry
- Score change visualization (before/after bars)
- Rollback badge for reverted overrides
- File attachment indicator

**Interaction Notes:**
- **Rollback button:** Opens confirmation, reverts to previous score
- **Attached files:** Click to download
- **Timeline scrolls:** For content with many overrides

**Accessibility Checklist:**
- [x] Timeline order announced by screen reader
- [x] Rollback button has confirmation dialog
- [x] Score changes described in text, not just visual

**Technical Implementation (MANDATORY):**
- **Pattern:** json-render (OverrideHistoryCatalog)
- **Container:** `<Renderer tree={...} registry={OverrideHistoryRegistry} catalog={OverrideHistoryCatalog} />`
- **Transform:** `overrideHistoryToRenderTree(history, originalScore)`
- **Rollback button:** Traditional React (outside render tree)
- **Timeline layout:** CSS-based, not imperative
- **MUST reuse SignalsCatalog:** ActivityTimeline pattern

```typescript
// Required catalog file: src/bedrock/consoles/ExperienceConsole/json-render/override-history-catalog.ts

export const OverrideHistoryCatalog = {
  components: {
    OverrideEntry: { props: OverrideEntrySchema },
    OriginalScore: { props: OriginalScoreSchema },
  },
} as const;

// Zod schemas
export const OverrideEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  operator: z.string(),
  scoreBefore: z.number(),
  scoreAfter: z.number(),
  reasonCode: z.string(),
  explanation: z.string(),
  attachments: z.array(z.string()).optional(),
  rolledBack: z.boolean().default(false),
  rollbackTimestamp: z.string().optional(),
  rollbackOperator: z.string().optional(),
});

export const OriginalScoreSchema = z.object({
  score: z.number(),
  assessedAt: z.string(),
  model: z.string(),
});
```

---

### Screen 5: Celebration Banner (Quality Improvement)

**Location:** Top of Analytics Dashboard when improvement detected

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  🎉                                                                   │ │
│  │  Your grove's quality improved!                                       │ │
│  │  ─────────────────────────────────────────────────────────────────── │ │
│  │                                                                       │ │
│  │  Average score increased from 72.1 to 78.4 this month (+6.3 points) │ │
│  │  You're now in the 73rd percentile of groves.                        │ │
│  │                                                                       │ │
│  │  Keep it up! Quality content benefits the entire network.            │ │
│  │                                                                       │ │
│  │                                                        [ Dismiss ]   │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  [Rest of analytics dashboard...]                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Trigger Conditions:**
- Average score increased by ≥5 points vs last period
- Percentile rank improved by ≥10 points
- Grove moved from below-average to above-average

**Design Notes:**
- Celebration is **earned**, not automatic
- Shows concrete numbers (not just "great job!")
- Emphasizes network benefit (not just personal achievement)
- Auto-dismisses after 10 seconds, can be manually dismissed
- Only shown once per improvement (session storage)

---

### Screen 6: Empty States

**No Analytics Data:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    ┌───────────────────┐                       │
│                    │      📊          │                       │
│                    │   analytics       │                       │
│                    └───────────────────┘                       │
│                                                                 │
│              No quality data yet                                │
│                                                                 │
│      Quality analytics appear after your grove has              │
│       content with quality assessments.                         │
│                                                                 │
│             [ View content in Explore ]                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**No Override History:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    ┌───────────────────┐                       │
│                    │       ✓          │                       │
│                    │    check_circle   │                       │
│                    └───────────────────┘                       │
│                                                                 │
│           No overrides for this content                         │
│                                                                 │
│      The current quality score is the original                  │
│       automated assessment.                                     │
│                                                                 │
│      If you think this score is incorrect, you can              │
│       request an override from the quality details.             │
│                                                                 │
│                  [ View quality details ]                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## State Variations Summary

### Attribution Panel States

| State | Visual | Behavior |
|-------|--------|----------|
| **Full data** | All dimensions with reasoning | Normal display |
| **Partial data** | Some dimensions missing reasoning | Show "Assessment details unavailable" |
| **Low confidence** | Confidence <70% | Warning banner: "Assessment confidence is low" |

### Override Modal States

| State | Visual | Behavior |
|-------|--------|----------|
| **Empty** | All fields blank | Submit disabled |
| **Partial** | Some fields filled | Submit disabled, show requirements |
| **Valid** | All required filled | Submit enabled |
| **Submitting** | Loading spinner | All fields disabled |
| **Success** | Success toast | Modal closes, score updates |
| **Error** | Error message | Fields remain, retry available |

### Dashboard Time Range States

| State | Visual | Behavior |
|-------|--------|----------|
| **7d selected** | "7d" button filled | Shows last 7 days |
| **30d selected** | "30d" button filled | Shows last 30 days |
| **90d selected** | "90d" button filled | Shows last 90 days |
| **All Time** | "All Time" button filled | Shows all historical data |
| **Loading** | Skeleton placeholders | Data being fetched |
| **No data in range** | Empty state | "No data for this period" |

---

## Declarative Configuration Points

| Element | Configurable Via | Default | Notes |
|---------|------------------|---------|-------|
| Dashboard time ranges | `analytics_time_ranges` | [7, 30, 90, 'all'] | Array of day counts |
| Celebration threshold | `analytics_celebration_threshold` | 5 | Points improvement to trigger |
| Override reason codes | `override_reason_codes` | 4 codes | Extensible array |
| Min explanation length | `override_min_explanation` | 20 | Characters required |
| Max file upload size | `override_max_file_size` | 5MB | Bytes |
| Network refresh interval | `network_refresh_interval` | 900000 | Milliseconds (15 min) |
| Rollback enabled | `override_rollback_enabled` | true | Boolean |

---

## Micro-interactions

### Override Submit
```
0ms    → Submit clicked
10ms   → Button shows spinner
100ms  → Confirmation dialog slides up
---    → User confirms
0ms    → Confirm clicked
50ms   → Dialog closes
100ms  → Request sent
500ms  → Success: Toast appears, modal closes
        Error: Error message appears, retry enabled
```

### Celebration Banner
```
0ms    → Dashboard loads
100ms  → Check if celebration criteria met
200ms  → Banner slides down from top (0.4s ease-out)
        Confetti particles (subtle, 3 seconds)
10000ms→ Auto-fade out (0.5s)
```

### Rollback Action
```
0ms    → Rollback clicked
50ms   → Confirmation dialog appears
---    → User confirms
0ms    → Request sent
300ms  → Score animates to previous value
        History entry marked as "rolled back"
```

---

## Technical Implementation Requirements Summary

### Pattern Compliance Matrix

| Screen | Pattern | Catalog | Reuses SignalsCatalog |
|--------|---------|---------|----------------------|
| **Analytics Dashboard** | json-render (REQUIRED) | QualityAnalyticsCatalog | MetricCard, MetricRow, QualityGauge, FunnelChart |
| **Attribution Panel** | json-render (REQUIRED) | AttributionCatalog | Educational tone implementation |
| Override Modal | Traditional React | N/A | Interactive form controls |
| **Override History** | json-render (REQUIRED) | OverrideHistoryCatalog | ActivityTimeline |
| Celebration Banner | Traditional React | N/A | Toast/banner pattern |
| Empty States | Traditional React | N/A | EmptyState component |

### Required File Deliverables

```
src/bedrock/consoles/ExperienceConsole/json-render/
├── quality-analytics-catalog.ts     # Zod schemas for analytics
├── quality-analytics-registry.tsx   # Component implementations
├── quality-analytics-transform.ts   # Data → RenderTree
├── attribution-catalog.ts           # Zod schemas for attribution
├── attribution-registry.tsx         # Educational tone rendering
├── attribution-transform.ts         # Score → Attribution tree
├── override-history-catalog.ts      # Zod schemas for history
├── override-history-registry.tsx    # Timeline rendering
└── override-history-transform.ts    # History → RenderTree
```

### Console Integration Pattern

```typescript
// src/bedrock/consoles/ExperienceConsole/sections/QualityAnalyticsSection.tsx

import { Renderer } from '../json-render/Renderer';
import { QualityAnalyticsRegistry } from '../json-render/quality-analytics-registry';
import { QualityAnalyticsCatalog } from '../json-render/quality-analytics-catalog';
import { analyticsToRenderTree } from '../json-render/quality-analytics-transform';

export function QualityAnalyticsSection({ groveId }: { groveId: string }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { data: analytics, isLoading } = useQualityAnalytics(groveId, timeRange);

  if (isLoading) return <AnalyticsSkeleton />;
  if (!analytics) return <EmptyState variant="no-items" />;

  const renderTree = analyticsToRenderTree(analytics, timeRange);

  return (
    <GlassPanel tier="panel">
      {/* Time range selector - interactive, NOT json-render */}
      <TimeRangeSelector value={timeRange} onChange={setTimeRange} />

      {/* Analytics display - json-render */}
      <Renderer
        tree={renderTree}
        registry={QualityAnalyticsRegistry}
        catalog={QualityAnalyticsCatalog}
      />

      {/* Export button - interactive */}
      <ExportButton onClick={() => exportCsv(analytics)} />
    </GlassPanel>
  );
}
```

### DEX Compliance Verification

| DEX Pillar | Implementation |
|------------|----------------|
| **Declarative Sovereignty** | All thresholds, reason codes, time ranges configurable via tables |
| **Capability Agnosticism** | Analytics/attribution work with any scoring model output |
| **Provenance as Infrastructure** | Full audit trail in `quality_overrides` table with operator identity |
| **Organic Scalability** | Materialized views with 15-min refresh prevent query storms |

---

**Prepared By:** UI/UX Designer
**Date:** 2026-01-18
**Approved By:** UX Chief
**Approval Date:** 2026-01-18
