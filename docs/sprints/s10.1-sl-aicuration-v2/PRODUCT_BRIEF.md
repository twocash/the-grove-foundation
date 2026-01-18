# Product Brief: S10.1-SL-AICuration v2 - Display + Filtering Integration

**Version:** 1.0
**Status:** Draft
**Sprint Target:** S10.1
**PM:** Product Manager Agent
**Reviewed by:** UX Chief, UI/UX Designer

---

## Executive Summary

This sprint wires the quality scoring infrastructure (built in S10 v1) to the sprout lifecycle, enabling users to see quality assessments on content and filter by quality thresholds. Quality becomes a visible, actionable dimension of the Grove experience.

## Problem Statement

The quality scoring engine exists but produces no user-visible output. Sprouts lack quality indicators, operators cannot configure thresholds, and users cannot filter content by quality. The infrastructure investment from S10 v1 sits dormant until this integration sprint activates it.

**User pain:** No visibility into content quality; unable to surface high-quality research or filter low-quality noise.

**Operator pain:** Cannot set quality standards for their grove or participate in federated quality learning.

## Proposed Solution

Integrate `QualityScoringEngine` into the sprout lifecycle and surface quality information through badges, filters, and configuration UI.

### User Value Proposition

Users gain immediate quality visibility on all sprouts through color-coded badges and dimension tooltips. They can filter content to surface high-quality research, reducing noise and improving discovery. This directly supports the **attention→persistence pipeline** by helping users identify content worth their attention.

### Strategic Value

Quality scoring is foundational infrastructure for:
- **S11-SL-Attribution**: Economic models depend on quality as a value signal
- **S12-SL-SignalAggregation**: Quality is a key signal for ranking
- **Federation**: Cross-grove quality comparison enables ecosystem learning

This sprint transforms dormant infrastructure into active capability, making the soil more fertile for future features.

---

## Scope

### In Scope (v1.0)
- Trigger scoring on sprout creation/update
- Display `QualityScoreBadge` on sprout cards in Explore and Nursery
- Quality filter controls in ExploreShell filter panel
- Threshold configuration section in Experience Console
- Federated learning opt-in toggle in settings
- Multi-dimensional breakdown panel (radar chart + bars)
- `useQualityScoring` hook for React integration

### Explicitly Out of Scope
- Score attribution UI ("Why this score?") → **S10.2**
- Manual override workflow → **S10.2**
- Quality analytics dashboard → **S10.2**
- Network comparison views → **S10.2**
- Backfill existing sprouts (background job, separate ticket)

---

## User Flows

### Flow 1: View Quality Score on Sprout
1. User navigates to `/explore`
2. Sprouts display with quality badge (composite score 0-100)
3. User hovers badge to see dimension breakdown tooltip
4. User clicks badge to expand full breakdown panel

### Flow 2: Filter by Quality
1. User opens filter panel in ExploreShell
2. User adjusts minimum quality slider (0-100)
3. Sprouts below threshold are filtered out
4. User can apply dimension-specific filters (accuracy, utility, novelty, provenance)
5. Quick presets available: "High Quality (80+)", "Medium+ (50+)", "All"

### Flow 3: Configure Quality Threshold
1. Grove operator opens Experience Console
2. Navigates to "Quality Settings" section
3. Creates new threshold with name, minimum score, enabled dimensions
4. Threshold applies to content filtering in their grove

### Flow 4: Enable Federated Learning
1. Operator opens Settings
2. Toggles "Federated Learning Participation"
3. Selects privacy level: Full / Anonymized / Aggregated
4. Sees contribution metrics and last sync timestamp

---

## Technical Considerations

### Architecture Alignment

**GroveObject Integration:**
- Quality threshold uses `quality-threshold` type (already registered in S10 v1)
- Quality scores stored in `quality_scores` table with full provenance

**Kinetic Framework:**
- `QualityScoreBadge` follows Kinetic component patterns
- Filter controls integrate with existing ExploreShell filter architecture

**Console Factory Pattern:**
- Threshold configuration uses `ObjectCardProps<QualityThreshold>` pattern
- Leverages existing `QualityThresholdCard` and `QualityThresholdEditor` components

### Hybrid Cognition Requirements
- **Local (routine):** All UI rendering, filter application, threshold evaluation
- **Cloud (pivotal):** Quality scoring via `QualityScoringEngine.assess()` (currently uses heuristics, future: AI model)

### Dependencies
- S10-SL-AICuration v1 (Infrastructure) - **COMPLETE**
- ExploreShell filter system - exists
- Experience Console card factory - exists
- `QualityScoreBadge`, `QualityThresholdCard`, `QualityThresholdEditor` - built in S10 v1

---

## DEX Pillar Verification

| Pillar | Implementation | Evidence |
|--------|---------------|----------|
| **Declarative Sovereignty** | Thresholds stored in `quality_thresholds` table, not code. Operators configure behavior without developers. | SQL table with `context`, `dimensions`, `enabled` columns |
| **Capability Agnosticism** | Scoring engine has pluggable model interface. Heuristic fallback exists. Badge renders any score 0-100. | `QualityScoringEngine.assess()` abstraction layer |
| **Provenance as Infrastructure** | Scores track `scoring_model`, `model_version`, `confidence`, `scored_at`. Full attribution chain. | `quality_scores.metadata` JSONB field |
| **Organic Scalability** | Federated learning enables cross-grove improvement without central coordination. | `federated_learning_participation` table + privacy levels |

---

## Advisory Council Input

### Consulted Advisors

- **Park (feasibility):** Current heuristic scoring is computationally trivial. AI-powered scoring (future) can use 7B models for routine assessment, cloud for edge cases. No feasibility concerns for v1.

- **Adams (engagement):** Quality badges create meaningful signals that drive exploration behavior. "High quality" as a filterable dimension adds drama to content discovery. Recommended: Make the badge visually satisfying (color gradients, micro-animations).

- **Short (narrative UI):** Score breakdown should tell a story - not just numbers but reasons. Defer detailed attribution to S10.2 but ensure badge tooltip previews the narrative.

### Known Tensions

| Tension | Resolution |
|---------|------------|
| Automatic scoring vs. human judgment | v1 shows automated scores transparently; v2 adds override workflow |
| Default filtering on vs. off | **Decision: Off by default** - users opt-in to quality filtering to preserve discoverability |
| Radar chart complexity | **Decision: Expanded view only** - tooltip shows bars, full panel shows radar chart |

---

## Architectural Decisions (Resolving Open Questions)

### Q1: Badge placement
**Decision:** Sprout card footer, right-aligned

**Rationale:** Footer placement follows existing metadata pattern (created date, tier badge). Right alignment provides visual balance. Header would compete with title.

### Q2: Filter defaults
**Decision:** Quality filtering OFF by default

**Rationale:** Default-on filtering would hide content from new users, violating "Exploration, Not Optimization" principle. Users opt-in when they want to focus.

### Q3: Radar chart location
**Decision:** Expanded detail view only (not hover tooltip)

**Rationale:** Tooltip shows compact bar breakdown. Radar requires more space and is better for deliberate inspection. Progressive disclosure pattern.

### Q4: Backfill strategy
**Decision:** Score on-demand when viewed (lazy evaluation)

**Rationale:** Immediate backfill creates unnecessary load. Lazy scoring distributes work over time and ensures fresh scores. Background job can run later for completeness.

---

## Success Metrics

- **Adoption:** 50%+ of active users interact with quality badge (hover/click) within 30 days
- **Filtering:** 20%+ of explore sessions use quality filter at least once
- **Configuration:** 30%+ of grove operators create at least one custom threshold
- **Federation:** 10%+ of groves opt into federated learning
- **Quality:** Zero critical errors in quality module (E2E test: 100% pass rate)

---

## Appendix: UX Concepts

### Quality Badge Design

```
┌─────────────────────────────────────────┐
│  Sprout Card                            │
│  ═══════════════════════════════════    │
│                                         │
│  [Content preview...]                   │
│                                         │
│  ─────────────────────────────────────  │
│  Jan 15, 2026  |  Tier 2  |  [78 ★]    │ ◄── Quality badge in footer
└─────────────────────────────────────────┘

Badge States:
┌──────────┐  ┌──────────┐  ┌──────────┐
│  92 ★    │  │  67 ★    │  │  34 ★    │
│  green   │  │  amber   │  │  red     │
└──────────┘  └──────────┘  └──────────┘
```

### Quality Filter Panel

```
┌─────────────────────────────────────────┐
│  Filters                           [×]  │
├─────────────────────────────────────────┤
│                                         │
│  Quality                                │
│  ┌─────────────────────────────────┐   │
│  │ Minimum Score: [====●====] 50   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Presets:                               │
│  [High 80+]  [Medium+ 50+]  [All]       │
│                                         │
│  Dimension Filters: [Advanced ▼]        │
│  └─ Accuracy:    [====●====] 60        │
│  └─ Utility:     [====○====] 0         │
│  └─ Novelty:     [====○====] 0         │
│  └─ Provenance:  [====○====] 0         │
│                                         │
└─────────────────────────────────────────┘
```

### Breakdown Panel (Expanded)

```
┌─────────────────────────────────────────────────────────┐
│  Quality Score: 78/100                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────┐  ┌───────────────────────────┐│
│  │   Radar Chart       │  │  Dimension Bars           ││
│  │       Accuracy      │  │                           ││
│  │         ◆           │  │  Accuracy   ████████░░ 82 ││
│  │       ╱   ╲         │  │  Utility    ███████░░░ 75 ││
│  │ Prov ◆     ◆ Utility│  │  Novelty    ██████░░░░ 68 ││
│  │       ╲   ╱         │  │  Provenance █████████░ 87 ││
│  │         ◆           │  │                           ││
│  │       Novelty       │  └───────────────────────────┘│
│  └─────────────────────┘                               │
│                                                         │
│  Confidence: High (92%)                                 │
│  Scored: Jan 15, 2026 at 14:32                         │
│  Model: grove-quality-v1                               │
│                                                         │
│                            [Why this score? →]          │ ◄── Links to S10.2
└─────────────────────────────────────────────────────────┘
```

---

**Prepared By:** UX Chief
**Date:** 2026-01-18
**Next:** Product Manager Review → UI/UX Designer → UX Chief Approval → User Review → User Story Refinery
