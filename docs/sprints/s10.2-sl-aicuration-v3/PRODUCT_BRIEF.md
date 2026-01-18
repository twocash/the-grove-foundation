# Product Brief: S10.2-SL-AICuration v3 - Analytics + Override Workflows

**Version:** 1.0
**Status:** Draft
**Sprint Target:** S10.2
**PM:** Product Manager Agent
**Reviewed by:** UX Chief, UI/UX Designer

---

## Executive Summary

This sprint builds the quality analytics dashboard and human-in-the-loop override workflows. Operators gain insight into quality patterns across their grove, can compare against network standards, and can correct inaccurate automated assessments with full audit trails.

## Problem Statement

Automated quality scoring (S10.1) produces assessments, but operators have no visibility into patterns or ability to correct errors. Without analytics, quality data sits unused. Without overrides, AI mistakes persist unchallenged. The system lacks the human feedback loop essential for trustworthy AI-assisted curation.

**Operator pain:** Cannot understand quality trends, compare to network, or fix AI errors.

**Trust gap:** Automated scores without explanation or appeal undermine operator confidence.

## Proposed Solution

Build a quality analytics dashboard with network comparison, and a complete override workflow with score attribution ("Why this score?") and audit trails.

### User Value Proposition

Operators gain actionable insights into their grove's quality profile, understand how they compare to the network, and have agency to correct AI mistakes. This closes the **attention→persistence pipeline** loop by enabling human judgment to refine automated assessments, making the system learn from operator expertise.

### Strategic Value

This sprint is critical for:
- **Federated Learning:** Overrides feed back into model improvement
- **Trust Building:** Transparency in scoring builds operator confidence
- **Network Effects:** Comparison views create healthy competition and knowledge sharing
- **S11 Attribution:** Override history is essential provenance for economic models

The override system transforms quality scoring from one-way automation into collaborative intelligence.

---

## Scope

### In Scope (v1.0)
- Quality Analytics Dashboard (new console or section)
- Score Attribution Panel ("Why this score?")
- Override submission modal with reason codes
- Override history/audit trail display
- Network comparison views (grove vs network average)
- Quality trend charts (time series)
- Dimension radar chart for profile comparison
- Override rollback capability
- `useQualityAnalytics` and `useQualityOverride` hooks

### Explicitly Out of Scope
- Override approval workflow (all overrides auto-approved in v1)
- PDF report export (CSV only in v1)
- Real-time network sync (periodic aggregation acceptable)
- Machine learning from overrides (manual pipeline, future sprint)

---

## User Flows

### Flow 1: View Score Attribution
1. User views a sprout with quality score
2. User clicks "Why this score?" link
3. Attribution panel opens showing dimension breakdown
4. Each dimension shows reasoning and contributing factors
5. Panel shows confidence level and improvement suggestions
6. "Request Override" button available if score seems wrong

### Flow 2: Submit Override
1. Operator identifies incorrect quality score
2. Clicks "Request Override" from attribution panel
3. Override modal opens showing original scores
4. Operator adjusts dimension scores (or leaves blank to keep)
5. Selects reason code: `incorrect_assessment`, `missing_context`, `model_error`, `other`
6. Provides required text explanation
7. Optionally attaches evidence file
8. Submits override
9. Score updates immediately, override logged to audit trail

### Flow 3: View Override History
1. Operator opens sprout detail view
2. Clicks "Override History" tab
3. Sees timeline of all overrides with:
   - Original → New scores
   - Reason and explanation
   - Operator who made change
   - Timestamp
4. Can click "Rollback" to revert to original

### Flow 4: Analyze Quality Analytics
1. Operator opens Quality Analytics dashboard
2. Selects time range (7d, 30d, 90d, all)
3. Views overview metrics (avg score, total assessed, threshold %, overrides)
4. Examines dimension radar chart vs network average
5. Reviews score distribution histogram
6. Checks network percentile ranking
7. Identifies strongest/weakest dimensions
8. Can export data to CSV

### Flow 5: Compare to Network
1. Operator opens Network Comparison view
2. Sees grove quality profile vs network average
3. Views percentile rank with trend indicator
4. Browses quality leaderboard (top 10 groves)
5. Benchmarks against similar groves

---

## Technical Considerations

### Architecture Alignment

**GroveObject Integration:**
- Overrides stored in `quality_overrides` table (S10 v1)
- Analytics computed via SQL views or Edge Functions

**Console Factory Pattern:**
- `QualityAnalyticsConsole` follows existing console patterns
- Components use `ObjectCardProps` where applicable

**Event-Driven:**
- Override submission emits event for potential federated learning sync
- Analytics refresh on dashboard mount (not real-time)

### Hybrid Cognition Requirements
- **Local (routine):** All UI rendering, chart generation, filter/sort operations
- **Cloud (pivotal):** Network statistics aggregation (Edge Function), future: AI reasoning generation

### Dependencies
- S10-SL-AICuration v1 (Infrastructure) - **COMPLETE**
- S10.1-SL-AICuration v2 (Display + Filtering) - **REQUIRED**
- Recharts or similar chart library (existing)
- Edge Functions for network aggregation (may need new function)

### Database Enhancements

The existing `quality_overrides` table needs enhancement:

```sql
ALTER TABLE quality_overrides
ADD COLUMN reason_code TEXT,
ADD COLUMN approval_status TEXT DEFAULT 'approved',
ADD COLUMN approved_by UUID REFERENCES auth.users(id),
ADD COLUMN approved_at TIMESTAMPTZ;
```

Optional materialized view for dashboard performance:

```sql
CREATE MATERIALIZED VIEW quality_analytics_summary AS
SELECT
  target_type,
  DATE_TRUNC('day', scored_at) as score_date,
  COUNT(*) as assessment_count,
  AVG(composite_score) as avg_composite,
  -- dimension averages...
FROM quality_scores
GROUP BY target_type, DATE_TRUNC('day', scored_at);
```

---

## DEX Pillar Verification

| Pillar | Implementation | Evidence |
|--------|---------------|----------|
| **Declarative Sovereignty** | Override reasons stored as structured data. Analytics views defined in SQL. No hardcoded thresholds. | `quality_overrides.reason_code` enum, `quality_analytics_summary` view |
| **Capability Agnosticism** | Analytics work with any scoring model. Override workflow model-independent. | Dashboard queries `quality_scores` regardless of `scoring_model` value |
| **Provenance as Infrastructure** | Full audit trail: who overrode, when, why. Original scores preserved. Rollback possible. | `quality_overrides` table with `operator_id`, `reason`, `created_at` |
| **Organic Scalability** | Network comparison enables ecosystem learning without central authority. Federated aggregation. | `federated_learning_participation` + network stats Edge Function |

---

## Advisory Council Input

### Consulted Advisors

- **Park (feasibility):** Analytics queries can be expensive at scale. Materialized views with periodic refresh (every 15 min) solve this without complexity. Network aggregation via Edge Function is feasible with anonymized data sharing.

- **Adams (engagement):** Override workflow is a "meaningful choice with consequences" - operators feel ownership of quality standards. Network comparison creates healthy competition. Recommended: Celebrate operators who improve grove quality.

- **Vallor (ethics):** Human override capability is essential for AI accountability. Audit trails support transparency principle. Caution: Ensure override reasons are visible to prevent arbitrary censorship.

- **Short (narrative UI):** Attribution panel should explain scores in natural language, not just numbers. "Your content scored high on accuracy because..." creates understanding. Override explanations become part of the provenance narrative.

### Known Tensions

| Tension | Resolution |
|---------|------------|
| Auto-approve vs. approval workflow | **Decision: Auto-approve v1** - builds trust first. Approval workflow in future if abuse detected. |
| Real-time vs. batched analytics | **Decision: Batched** - 15-min refresh acceptable, avoids expensive queries. |
| Full network data vs. privacy | **Decision: Anonymized aggregates only** - no individual grove scores shared, only percentiles and averages. |

---

## Architectural Decisions (Resolving Open Questions)

### Q1: Override approval workflow
**Decision:** All overrides auto-approved in v1

**Rationale:** Building trust requires giving operators agency. Requiring approval creates friction and implies distrust. Track override patterns; if abuse emerges, add approval workflow in v2.

### Q2: Analytics access
**Decision:** Available to all grove operators (not premium)

**Rationale:** Quality visibility is core to the platform's value proposition. Gating analytics undermines trust and limits federated learning participation. Premium features focus on advanced capabilities, not basic visibility.

### Q3: Network data privacy
**Decision:** Share only anonymized aggregates (percentiles, averages)

**Rationale:** Individual grove scores are sensitive. Network comparison uses statistical aggregates: "You're in the 73rd percentile" without revealing specific competitor scores. Privacy levels in federated learning participation control what's shared.

### Q4: Chart library
**Decision:** Recharts (existing in codebase)

**Rationale:** Avoid new dependencies. Recharts supports radar charts, line charts, bar charts needed for this sprint. Consistent with existing analytics in Genesis dashboard.

### Q5: Export formats
**Decision:** CSV only in v1

**Rationale:** CSV covers data export needs without complexity. PDF reports require formatting decisions and render logic. Defer PDF to future sprint if user demand emerges.

---

## Success Metrics

- **Attribution:** 40%+ of quality badge interactions lead to attribution panel view
- **Override Adoption:** 15%+ of operators submit at least one override within 60 days
- **Override Quality:** Less than 10% of overrides are rolled back (indicates reasonable initial judgments)
- **Analytics Engagement:** 25%+ of operators visit analytics dashboard weekly
- **Network Comparison:** 30%+ of dashboard sessions include network comparison view
- **Export:** 10%+ of dashboard sessions result in CSV export

---

## Appendix: UX Concepts

### Analytics Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Quality Analytics                              [7d] [30d] [90d]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Avg Score│  │ Assessed │  │ Above    │  │ Overrides│           │
│  │   78.4   │  │   1,247  │  │ Threshold│  │    23    │           │
│  │   ↑ 3.2  │  │   ↑ 156  │  │   89.2%  │  │   ↓ 5    │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                     │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐  │
│  │    Dimension Radar          │  │    Score Distribution       │  │
│  │         ◇ Accuracy          │  │                             │  │
│  │       ╱   ╲                 │  │    ▓▓▓▓▓▓░░░░  <50          │  │
│  │ Prov ◇     ◇ Utility        │  │    ▓▓▓▓▓▓▓▓▓░  50-70       │  │
│  │       ╲   ╱                 │  │    ▓▓▓▓▓▓▓▓▓▓▓▓  70-85     │  │
│  │         ◇ Novelty           │  │    ▓▓▓▓▓▓▓▓░░  85+         │  │
│  │  ── Grove  ·· Network       │  │                             │  │
│  └─────────────────────────────┘  └─────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │    Quality Trend Over Time                                   │   │
│  │    ───────────────────────────────────────────              │   │
│  │    Grove Avg: 78.4  |  Network Avg: 72.1  |  73rd %ile      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                                                   [Export CSV]      │
└─────────────────────────────────────────────────────────────────────┘
```

### Attribution Panel

```
┌─────────────────────────────────────────────────────────────────────┐
│  Why This Score?                                               [×]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Overall Quality: 78/100  (High Confidence: 94%)                    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ACCURACY: 82/100                                            │   │
│  │ Content appears factually consistent and well-supported.    │   │
│  │                                                             │   │
│  │ Contributing factors:                                       │   │
│  │ • Clear citations provided                                  │   │
│  │ • Claims align with known sources                           │   │
│  │ • No contradictions detected                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ UTILITY: 75/100                                             │   │
│  │ Content provides moderate practical value.                  │   │
│  │                                                             │   │
│  │ Contributing factors:                                       │   │
│  │ • Actionable insights present                               │   │
│  │ • Could benefit from concrete examples                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [Similar cards for Novelty and Provenance...]                      │
│                                                                     │
│  ───────────────────────────────────────────────────────────────    │
│  Suggestions for improvement:                                       │
│  • Add more concrete examples to increase utility score             │
│  • Include additional source citations for accuracy boost           │
│                                                                     │
│                                          [Request Override]         │
└─────────────────────────────────────────────────────────────────────┘
```

### Override Modal

```
┌─────────────────────────────────────────────────────────────────────┐
│  Override Quality Score                                        [×]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Current Score: 45/100                                              │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ New Scores (leave blank to keep original)                   │   │
│  │                                                             │   │
│  │ Accuracy:    [  78  ] (was 42)                              │   │
│  │ Utility:     [  65  ] (was 51)                              │   │
│  │ Novelty:     [______] (was 38) ← keeping original           │   │
│  │ Provenance:  [  72  ] (was 49)                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Reason Code: [Incorrect Assessment           ▼]                    │
│  Options:                                                           │
│   • Incorrect Assessment                                            │
│   • Missing Context                                                 │
│   • Model Error                                                     │
│   • Other                                                           │
│                                                                     │
│  Explanation: (required)                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ The automated assessment missed important context about     │   │
│  │ the research methodology. The cited sources are from        │   │
│  │ peer-reviewed journals that the model didn't recognize.     │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Evidence: [Choose File...]  (optional)                             │
│                                                                     │
│                              [Cancel]  [Submit Override]            │
└─────────────────────────────────────────────────────────────────────┘
```

### Override History

```
┌─────────────────────────────────────────────────────────────────────┐
│  Override History                                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Jan 17, 2026 at 14:32                        [Rollback]     │   │
│  │ Operator: alice@grove.network                               │   │
│  │                                                             │   │
│  │ Score: 45 → 72                                              │   │
│  │ Reason: Incorrect Assessment                                │   │
│  │ "The automated assessment missed important context..."      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Jan 15, 2026 at 09:15                                       │   │
│  │ Operator: bob@grove.network                                 │   │
│  │                                                             │   │
│  │ Score: 78 → 45  (ROLLED BACK Jan 17)                        │   │
│  │ Reason: Model Error                                         │   │
│  │ "Model hallucinated source quality..."                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

**Prepared By:** UX Chief
**Date:** 2026-01-18
**Next:** Product Manager Review → UI/UX Designer → UX Chief Approval → User Review → User Story Refinery
