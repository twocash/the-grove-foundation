# S10.2-SL-AICuration v3: Analytics + Override Workflows

**Sprint:** S10.2-SL-AICuration v3
**Parent:** S10-SL-AICuration (AI-Driven Quality Assessment)
**Status:** 📝 draft-spec
**Date:** 2026-01-18
**Author:** UX Chief (Draft for Review)

---

## Overview

This sprint builds the quality analytics dashboard and manual override workflows. Operators can understand quality patterns, compare to network standards, and correct inaccurate automated assessments.

### Dependencies
- **S10-SL-AICuration v1** (Infrastructure) - ✅ Complete
- **S10.1-SL-AICuration v2** (Display + Filtering) - Required first

### Goal
Provide quality insights through analytics and enable human-in-the-loop corrections via override workflow.

---

## User Stories (From S10 Original Scope)

| Story | Title | Priority |
|-------|-------|----------|
| US-006 | Quality Score Attribution | P0 |
| US-007 | Federated Quality Standards | P1 |
| US-008 | Quality Score Override | P0 |

---

## Technical Scope

### 1. Quality Analytics Dashboard

**Location:** New console or section in Bedrock

**New Component:** `QualityAnalyticsConsole.tsx`

```tsx
interface QualityAnalyticsConsoleProps {
  timeRange: '7d' | '30d' | '90d' | 'all';
  groveId?: string;
}
```

**Dashboard Sections:**

#### 1.1 Overview Metrics
- Average quality score (with trend arrow)
- Total content assessed
- Content meeting threshold %
- Score distribution histogram

#### 1.2 Dimension Analysis
- Radar chart: Grove profile vs network average
- Dimension trends over time (line chart)
- Strongest/weakest dimensions

#### 1.3 Network Comparison
- Grove percentile rank
- Comparison to similar groves
- Quality leaderboard (top 10)

#### 1.4 Assessment Activity
- Assessments per day (bar chart)
- Auto vs manual override ratio
- Federated learning contributions

### 2. Score Attribution UI ("Why This Score?")

**New Component:** `QualityAttributionPanel.tsx`

**Location:** Accessible from quality badge click/expand

```tsx
interface QualityAttributionPanelProps {
  score: QualityScore;
  onRequestOverride?: () => void;
}
```

**Content:**
- Dimension-by-dimension breakdown with explanations
- Confidence level indicator
- Contributing factors list
- Suggested improvements (if below threshold)
- Link to request manual override

**Reasoning Display:**
```tsx
// From QualityScoringEngine.generateReasoning()
<ReasoningCard dimension="accuracy">
  <p>Content appears factually consistent and well-supported.</p>
  <ul>
    <li>Clear citations provided</li>
    <li>Claims align with known sources</li>
    <li>No contradictions detected</li>
  </ul>
</ReasoningCard>
```

### 3. Manual Override Workflow

**New Components:**
- `QualityOverrideModal.tsx` - Override submission form
- `QualityOverrideHistory.tsx` - Audit trail display
- `QualityOverrideQueue.tsx` - Pending overrides (if approval required)

#### 3.1 Override Submission

```tsx
interface QualityOverrideFormProps {
  originalScore: QualityScore;
  onSubmit: (override: QualityOverrideRequest) => void;
  onCancel: () => void;
}

interface QualityOverrideRequest {
  targetId: string;
  originalScoreId: string;
  newDimensions: Partial<QualityDimensions>;
  reason: string;
  reasonCode: 'incorrect_assessment' | 'missing_context' | 'model_error' | 'other';
}
```

**Override Form Fields:**
- New score value (per dimension, optional)
- Reason code (dropdown)
- Free-text explanation (required)
- Evidence/justification (optional file upload)

#### 3.2 Override Authorization

**Permission Model:**
```typescript
// Operators can override scores in their grove
// Network admins can override any score
// Override history is always visible

interface OverridePermission {
  canOverride: boolean;
  requiresApproval: boolean;
  approverRole?: 'network_admin' | 'grove_operator';
}
```

#### 3.3 Override Audit Trail

**Table:** Uses existing `quality_overrides` table from S10 v1

**Display:**
- Original score → New score
- Override reason and code
- Operator who made change
- Timestamp
- Approval status (if applicable)
- Rollback option

### 4. Network Comparison Views

**New Component:** `NetworkQualityComparison.tsx`

**Features:**
- My grove vs network average (dimension comparison)
- Percentile ranking with trend
- Similar groves benchmarking
- Quality leaders showcase

**Data Source:**
- Aggregated from `federated_learning_participation` data
- Network statistics computed server-side or via Edge Function

---

## Database Changes

### New Views (Optional - for analytics performance)

```sql
-- Materialized view for dashboard performance
CREATE MATERIALIZED VIEW quality_analytics_summary AS
SELECT
  target_type,
  DATE_TRUNC('day', scored_at) as score_date,
  COUNT(*) as assessment_count,
  AVG(composite_score) as avg_composite,
  AVG((dimensions->>'accuracy')::numeric) as avg_accuracy,
  AVG((dimensions->>'utility')::numeric) as avg_utility,
  AVG((dimensions->>'novelty')::numeric) as avg_novelty,
  AVG((dimensions->>'provenance')::numeric) as avg_provenance
FROM quality_scores
GROUP BY target_type, DATE_TRUNC('day', scored_at);
```

### Override Table Enhancement

The existing `quality_overrides` table may need:
```sql
ALTER TABLE quality_overrides
ADD COLUMN reason_code TEXT,
ADD COLUMN approval_status TEXT DEFAULT 'approved',
ADD COLUMN approved_by UUID REFERENCES auth.users(id),
ADD COLUMN approved_at TIMESTAMPTZ;
```

---

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/bedrock/consoles/QualityAnalyticsConsole.tsx` | NEW | Analytics dashboard |
| `src/bedrock/primitives/QualityAttributionPanel.tsx` | NEW | Score explanation |
| `src/bedrock/primitives/QualityOverrideModal.tsx` | NEW | Override form |
| `src/bedrock/primitives/QualityOverrideHistory.tsx` | NEW | Audit trail |
| `src/bedrock/primitives/NetworkQualityComparison.tsx` | NEW | Network comparison |
| `src/bedrock/consoles/charts/QualityRadarChart.tsx` | NEW | Radar visualization |
| `src/bedrock/consoles/charts/QualityTrendChart.tsx` | NEW | Time series |
| `hooks/useQualityAnalytics.ts` | NEW | Analytics data hook |
| `hooks/useQualityOverride.ts` | NEW | Override actions hook |

---

## Acceptance Criteria (Key Scenarios)

### AC-1: View Score Attribution
**Given** I am viewing a sprout with quality score
**When** I click "Why this score?"
**Then** I see dimension breakdown with reasoning and improvement suggestions

### AC-2: Submit Override
**Given** I am a grove operator
**And** I identify an incorrect quality score
**When** I submit an override with new values and reason
**Then** the override is recorded and the score is updated

### AC-3: View Override History
**Given** I am viewing a content item
**When** I check override history
**Then** I see all past overrides with reasons, timestamps, and operators

### AC-4: Analytics Dashboard
**Given** I am a grove operator
**When** I open Quality Analytics
**Then** I see overview metrics, dimension analysis, and network comparison

### AC-5: Network Percentile
**Given** I have federated learning enabled
**When** I view network comparison
**Then** I see my grove's percentile rank and comparison to similar groves

### AC-6: Override Rollback
**Given** I have made an override that was incorrect
**When** I click "Rollback"
**Then** the original score is restored and rollback is logged

---

## UI/UX Design Notes

### Analytics Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Quality Analytics                         [7d] [30d] [90d] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Avg Score│  │ Assessed │  │ Above    │  │ Overrides│    │
│  │   78.4   │  │   1,247  │  │ Threshold│  │    23    │    │
│  │   ↑ 3.2  │  │   ↑ 156  │  │   89.2%  │  │          │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │    Dimension Radar      │  │    Score Distribution   │  │
│  │         ◇               │  │    ▓▓▓▓▓▓▓▓░░         │  │
│  │       ╱   ╲             │  │    ▓▓▓▓▓▓▓▓▓▓▓▓░░     │  │
│  │      ◇     ◇            │  │    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │  │
│  │       ╲   ╱             │  │    ▓▓▓▓▓▓▓▓▓▓░░░░     │  │
│  │         ◇               │  │    ▓▓▓▓░░░░░░░░       │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │    Quality Trend Over Time                          │   │
│  │    ───────────────────────────────────────────      │   │
│  │    Score: 78.4  |  Network Avg: 72.1  |  73rd %ile  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Override Modal

```
┌─────────────────────────────────────────────────────────────┐
│  Override Quality Score                              [×]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Current Score: 45/100                                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ New Scores (leave blank to keep original)           │   │
│  │                                                     │   │
│  │ Accuracy:    [____] (was 42)                        │   │
│  │ Utility:     [____] (was 51)                        │   │
│  │ Novelty:     [____] (was 38)                        │   │
│  │ Provenance:  [____] (was 49)                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Reason Code: [Incorrect Assessment      ▼]                 │
│                                                             │
│  Explanation: (required)                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ The automated assessment missed important context   │   │
│  │ about the research methodology...                   │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                          [Cancel]  [Submit Override]        │
└─────────────────────────────────────────────────────────────┘
```

---

## DEX Compliance

| Pillar | Implementation |
|--------|----------------|
| **Declarative Sovereignty** | Override reasons stored as data, analytics from DB views |
| **Capability Agnosticism** | Analytics work with any scoring model |
| **Provenance as Infrastructure** | Full audit trail for all overrides |
| **Organic Scalability** | Network comparison enables ecosystem learning |

---

## Testing Strategy

### Unit Tests
- Analytics aggregation logic
- Override validation
- Rollback mechanics

### Integration Tests
- Override → score update → history logged
- Analytics query → dashboard render
- Network comparison data flow

### E2E Tests
- View attribution → submit override → see updated score
- Analytics dashboard time range switching
- Override rollback workflow

### Visual Tests
- Radar chart rendering
- Trend chart with various data ranges
- Override modal states

---

## Estimated Effort

| Component | Complexity | Estimate |
|-----------|------------|----------|
| Analytics dashboard | High | 2 days |
| Score attribution UI | Medium | 1 day |
| Override modal + form | Medium | 1 day |
| Override history | Low | 0.5 day |
| Network comparison | Medium | 1 day |
| Charts (radar, trend) | Medium | 1 day |
| Hooks + data layer | Medium | 1 day |
| Testing | Medium | 1.5 days |
| **Total** | | **9 days** |

---

## Open Questions for UX Chief Review

1. **Override approval:** Should all overrides be auto-approved, or require admin approval?
2. **Analytics access:** Available to all operators, or premium feature?
3. **Network data:** How much network comparison data to show? Privacy implications?
4. **Chart library:** Recharts (existing) or new library for radar charts?
5. **Export formats:** CSV only, or also PDF reports?

---

## Dependencies

- S10-SL-AICuration v1 (Infrastructure) - ✅ Complete
- S10.1-SL-AICuration v2 (Display + Filtering) - Required
- Chart library (Recharts or similar)
- Network statistics aggregation (may need Edge Function)

---

**Prepared By:** UX Chief (Draft)
**Date:** 2026-01-18
**Next Stage:** UX Chief Strategic Review → User Story Refinery

---

## Sprint Sequence Summary

| Sprint | Focus | Status |
|--------|-------|--------|
| S10-SL-AICuration v1 | Infrastructure | ✅ Complete |
| S10.1-SL-AICuration v2 | Display + Filtering | 📝 draft-spec |
| S10.2-SL-AICuration v3 | Analytics + Override | 📝 draft-spec |

**Total Original Scope:** 8 user stories, 32 Gherkin scenarios
**Now Distributed Across:** 3 sprints (more manageable increments)
