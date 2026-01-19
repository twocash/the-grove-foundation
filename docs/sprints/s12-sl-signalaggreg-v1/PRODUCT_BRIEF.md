# Product Brief: S12-SL-SignalAggregation v1
## Real Usage Metrics Engine

**Version:** 1.0
**Status:** Draft → UX Chief Review
**Sprint Target:** S12
**Parent Epic:** Observable Knowledge System
**PM:** Product Manager Agent
**Reviewed by:** UX Chief, UI/UX Designer

---

## Executive Summary

> *"The nervous system exists. The signals fire. But nothing listens."*

Grove has built the infrastructure for knowledge to become **observable** — events fire when sprouts are viewed, retrieved, rated, and promoted. But the aggregation engine that transforms these raw signals into actionable metrics **does not exist**.

This sprint completes the feedback loop. It transforms Grove from a system that *captures* knowledge into one that *understands* how knowledge is being used — enabling data-driven curation, meritocratic advancement, and the foundation for a true knowledge economy.

**This is not a feature. This is the awakening of Grove's sensory system.**

---

## The Vision: Living Knowledge

### From Static Repository to Dynamic Ecosystem

Today's knowledge systems are **graveyards** — documents uploaded, occasionally searched, rarely measured. There's no feedback loop. No way to know if knowledge is valuable beyond someone's opinion.

Grove's vision is different: **knowledge as a living organism**.

```
Traditional System          Grove Vision
─────────────────────       ─────────────────────
Upload → Search → Done      Capture → Grow → Measure → Evolve

Static documents            Living sprouts with vital signs
No feedback loop            Continuous signal aggregation
Opinion-based curation      Evidence-based advancement
Invisible utility           Observable value
```

### What "Observable Knowledge" Means

Every sprout in Grove should have **vital signs** — measurable indicators of its health, utility, and impact:

| Vital Sign | What It Measures | Why It Matters |
|------------|------------------|----------------|
| **View Count** | Attention received | Is this knowledge being discovered? |
| **Retrieval Count** | Active use in research | Is this knowledge being applied? |
| **Utility Score** | Net user ratings | Is this knowledge actually helpful? |
| **Diversity Index** | Breadth of audience | Is this knowledge broadly relevant? |
| **Quality Score** | Weighted composite | Should this knowledge advance? |

Without aggregation, these vital signs don't exist. The sprout is **brain-dead** — technically alive in the database, but with no observable consciousness.

---

## Problem Statement

### The Broken Pipeline

The infrastructure exists, but the circuit is incomplete:

```
CURRENT STATE (Broken)
══════════════════════

User views sprout
       │
       ▼
┌─────────────────────┐
│  useSproutSignals   │ ──── Event fires ────▶ ┌──────────────────────┐
│  emitViewed()       │                        │ sprout_usage_events  │
└─────────────────────┘                        │ (table populates)    │
                                               └──────────┬───────────┘
                                                          │
                                                          ▼
                                                    ❌ VOID ❌
                                                  Nothing happens
                                                          │
                                                          ▼
┌─────────────────────┐                        ┌──────────────────────┐
│useSproutAggregations│ ◀── Reads zeros ────── │document_signal_aggs  │
│  (returns defaults) │                        │ (empty/stub data)    │
└─────────────────────┘                        └──────────────────────┘
```

### Evidence of the Break

1. **Migration 021** contains a stub function:
   ```sql
   -- For now, just set default values for all documents
   -- In production, this would aggregate from actual usage events
   ```

2. **No processing mechanism** — no cron, no trigger, no edge function processes events

3. **Table mismatch** — Events use `sprout_id`, aggregations use `document_id`, with no join

### User Impact

| Persona | Current Experience | What They Should See |
|---------|-------------------|---------------------|
| **Explorer** | Opens FinishingRoom, sees zeros everywhere | Real metrics showing their sprout's impact |
| **Cultivator** | Nursery shows no usage data | Evidence-based curation with actual engagement |
| **Operator** | Analytics dashboard has no signal data | Real-time observatory of knowledge health |

---

## Proposed Solution

### Complete the Circuit

```
FUTURE STATE (Working)
══════════════════════

User views sprout
       │
       ▼
┌─────────────────────┐
│  useSproutSignals   │ ──── Event fires ────▶ ┌──────────────────────┐
│  emitViewed()       │                        │ sprout_usage_events  │
│  emitRetrieved()    │                        │ (raw event log)      │
│  emitRated()        │                        └──────────┬───────────┘
└─────────────────────┘                                   │
                                                          ▼
                                               ┌──────────────────────┐
                                               │compute_aggregations()│
                                               │ PostgreSQL function  │
                                               │ • On-demand refresh  │
                                               │ • Periodic cron      │
                                               └──────────┬───────────┘
                                                          │
                                                          ▼
┌─────────────────────┐                        ┌──────────────────────┐
│useSproutAggregations│ ◀── Real metrics! ──── │document_signal_aggs  │
│  (computed values)  │                        │ (computed values)    │
└─────────────────────┘                        └──────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     UNLOCKED CAPABILITIES                           │
├─────────────────────────────────────────────────────────────────────┤
│ • FinishingRoom shows real vital signs                              │
│ • Nursery curation backed by evidence                               │
│ • Auto-advancement based on quality thresholds                      │
│ • Analytics dashboard with live signal data                         │
│ • Knowledge economy foundation (attribution flows to usage)         │
└─────────────────────────────────────────────────────────────────────┘
```

### User Value Proposition

**For Explorers:** *"Finally, I can see if my research is being used. The vital signs panel shows real engagement — 47 views, 12 retrievals, 4.2 utility score. My knowledge matters."*

**For Cultivators:** *"I can now curate with evidence, not gut feeling. This sprout has a 0.82 quality score with high diversity — it's ready to advance. That one has views but negative utility — needs refinement."*

**For Operators:** *"The observatory shows the health of our entire knowledge corpus. We can see which hubs are thriving, which lenses drive engagement, and where knowledge is stagnating."*

### Strategic Value

This sprint enables the **Efficiency-Enlightenment Loop** at the knowledge level:

```
┌─────────────────────────────────────────────────────────────────────┐
│                  EFFICIENCY-ENLIGHTENMENT LOOP                      │
│                                                                     │
│    Knowledge Created → Used → Measured → Rewarded → More Created   │
│          ▲                                              │          │
│          └──────────────────────────────────────────────┘          │
│                                                                     │
│    Signal Aggregation is the "Measured" step that makes the loop   │
│    possible. Without it, there's no feedback. No evolution.        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Scope

### In Scope (v1.0)

| Epic | Deliverable | Unlocks |
|------|-------------|---------|
| **Epic 1: Aggregation SQL** | PostgreSQL functions for metric computation | Real numbers instead of zeros |
| **Epic 2: Event Bridge** | Join logic connecting sprout_id → document_id | Events flow to aggregations |
| **Epic 3: Refresh Mechanism** | On-demand + periodic computation | Fresh metrics without manual intervention |
| **Epic 4: Quality Score** | Weighted composite calculation | Evidence-based advancement eligibility |
| **Epic 5: Visual Verification** | E2E tests + screenshot evidence | Proof that the circuit works |

### Explicitly Out of Scope

| Deferred | Rationale |
|----------|-----------|
| Real-time streaming aggregation | Batch is sufficient for v1; streaming is v2 |
| Cross-grove signal federation | Requires S9-Federation completion first |
| Attribution token distribution | Part of S11-Attribution, separate concern |
| Machine learning quality models | Rule-based scoring sufficient for v1 |

---

## User Flows

### Flow 1: Explorer Sees Real Vital Signs

```
1. Explorer opens /explore
2. Clicks on a sprout in GardenTray
3. Opens GardenInspector modal
4. Clicks "Finishing Room" tab
5. ── THIS IS WHERE AGGREGATION MATTERS ──
6. Vital Signs panel shows REAL metrics:
   • 47 views (not 0)
   • 12 retrievals (not 0)
   • 0.78 quality score (not 0.5 default)
   • "Advancement Eligible" badge (computed, not hardcoded)
```

**Visual Evidence Required:** Screenshot of FinishingRoom with non-zero vital signs

### Flow 2: Cultivator Curates with Evidence

```
1. Cultivator opens /bedrock/nursery
2. Views sprout cards in the queue
3. Each card shows signal indicators:
   • Utility score badge (computed from ratings)
   • View count indicator
   • Diversity index visualization
4. Clicks on a sprout to review
5. Decision panel shows aggregated evidence
6. Promotes or refines based on DATA, not opinion
```

**Visual Evidence Required:** Nursery card with real signal badges

### Flow 3: Operator Reviews Knowledge Health

```
1. Operator opens /bedrock/experience
2. Navigates to Analytics section
3. Signal Aggregation dashboard shows:
   • Total events processed
   • Aggregation freshness (last computed)
   • Quality distribution histogram
   • Top/bottom sprouts by engagement
4. Can trigger manual refresh
5. Sees processing status
```

**Visual Evidence Required:** Analytics dashboard with signal metrics

---

## Technical Considerations

### Architecture Alignment

This sprint extends the **Observable Knowledge System** pattern established in S6-ObservableSignals:

```
S6: Built the event emission hooks (useSproutSignals)
S12: Builds the aggregation engine that processes those events
```

Follows the **json-render pattern** for all data display:
- SignalsCatalog already has metric components
- Aggregation data feeds existing Renderer infrastructure
- No new UI patterns needed — just real data

### Hybrid Cognition Requirements

| Processing Tier | Responsibility |
|-----------------|----------------|
| **Local (Supabase)** | SQL aggregation functions, periodic cron |
| **Edge (Optional)** | Real-time event processing (v2) |
| **Cloud (None)** | No AI/LLM needed for aggregation |

This is **pure infrastructure** — no model dependency, maximizing capability agnosticism.

### Dependencies

| Dependency | Status | Risk |
|------------|--------|------|
| Migration 016 (sprout_usage_events) | ✅ Exists | None |
| Migration 021 (document_signal_aggs) | ✅ Exists | Schema may need adjustment |
| useSproutSignals hook | ✅ Working | None |
| useSproutAggregations hook | ✅ Working | Reads zeros — that's the bug |
| research_sprouts.source_document_id | ⚠️ Verify | FK for join may be missing |

---

## DEX Pillar Verification

| Pillar | Implementation | Evidence |
|--------|----------------|----------|
| **Declarative Sovereignty** | Aggregation thresholds configurable via SQL parameters; quality weights adjustable without code changes | `compute_aggregation(threshold := 0.7)` |
| **Capability Agnosticism** | Pure SQL/PostgreSQL — no model dependency; works regardless of AI backend | Runs on Supabase, no API calls |
| **Provenance as Infrastructure** | Every aggregation tracks `computed_at`, source event range, computation method | Full audit trail in aggregation table |
| **Organic Scalability** | Batch processing scales to millions of events; partitioning-ready schema | Indexed by document_id, period |

---

## Advisory Council Input

### Consulted Advisors

**Park (Technical Feasibility):**
> *"PostgreSQL aggregation functions are the right choice. Keep computation close to the data. Avoid round-trips. The cron approach for batch processing is battle-tested — don't over-engineer with streaming until you have the volume to justify it."*

**Adams (Engagement/Retention):**
> *"The vital signs metaphor is powerful. Users need to feel their knowledge is ALIVE. Show trends, not just numbers. A sprout that's 'warming up' (views increasing) feels different than one that's 'cooling down' (engagement declining). Consider trend indicators in v1.1."*

**Buterin (Economic Mechanisms):**
> *"This is prerequisite infrastructure for any token-based attribution. Without verifiable usage metrics, you can't distribute value fairly. Get the measurement layer right before building economics on top."*

### Known Tensions

| Tension | Resolution |
|---------|------------|
| Real-time vs. batch | Start with batch (cheaper, simpler), add streaming when volume justifies |
| Precision vs. performance | Aggregate at document level, not event level; accept 5-minute staleness |
| Complexity vs. maintainability | Stick to pure SQL; avoid external services |

---

## Visual Evidence Requirements

### REVIEW.html Structure

The final sprint review MUST include visual proof of each capability. This is not optional documentation — it's the **acceptance criteria in visual form**.

```
REVIEW.html
├── Section 1: The Awakening
│   ├── Screenshot 1.1: Events firing (console log or event table)
│   ├── Screenshot 1.2: Aggregation function executing
│   └── Screenshot 1.3: Computed values appearing in table
│
├── Section 2: FinishingRoom Vital Signs
│   ├── Screenshot 2.1: BEFORE (zeros everywhere)
│   ├── Screenshot 2.2: AFTER (real metrics displayed)
│   └── Screenshot 2.3: Quality score computation visible
│
├── Section 3: Nursery Evidence-Based Curation
│   ├── Screenshot 3.1: Sprout card with signal badges
│   ├── Screenshot 3.2: Decision panel with aggregated data
│   └── Screenshot 3.3: Promotion flow using real metrics
│
├── Section 4: Analytics Dashboard
│   ├── Screenshot 4.1: Signal metrics overview
│   ├── Screenshot 4.2: Quality distribution visualization
│   └── Screenshot 4.3: Manual refresh in action
│
├── Section 5: The Complete Circuit
│   ├── Screenshot 5.1: E2E flow — event → aggregation → display
│   ├── Video 5.2: (Optional) 30-second screen recording of full loop
│   └── Diagram 5.3: Architecture diagram with data flow
│
└── Section 6: DEX Compliance
    ├── Screenshot 6.1: Config-driven threshold change
    └── Screenshot 6.2: Provenance audit trail
```

### Screenshot Specifications

Each screenshot MUST show:
1. **Context** — Where in the app this appears
2. **Data** — Actual computed values, not mocks
3. **Timestamp** — Proof of freshness
4. **Contrast** — Before/after where applicable

### E2E Test Coverage

| Test | What It Proves |
|------|----------------|
| `emit-view-see-count.spec.ts` | View event increments view_count |
| `quality-score-computation.spec.ts` | Quality formula produces expected output |
| `finishing-room-displays-real.spec.ts` | FinishingRoom shows non-zero values |
| `nursery-signal-badges.spec.ts` | Nursery cards reflect aggregated signals |
| `refresh-updates-metrics.spec.ts` | Manual refresh triggers recomputation |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Zero-to-Real Conversion** | 100% of viewed sprouts show non-zero view_count | Query aggregation table |
| **Quality Score Range** | Scores distributed 0.1–0.9, not all 0.5 | Histogram analysis |
| **Aggregation Freshness** | < 5 minutes staleness on active sprouts | Check `computed_at` timestamps |
| **E2E Test Pass Rate** | 100% | Playwright test suite |
| **Visual Evidence Complete** | All 12 screenshots captured | REVIEW.html audit |

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| FK mismatch breaks join | High | Medium | Epic 2 verifies and fixes schema |
| Large event tables slow aggregation | Medium | Low | Add indexes, batch by period |
| Stale metrics confuse users | Medium | Medium | Show "Last updated" timestamp |
| Test data insufficient | Low | Medium | Seed realistic event patterns |

---

## Appendix: UX Concepts

### Vital Signs Panel (FinishingRoom)

```
┌─────────────────────────────────────────────────────────────┐
│ VITAL SIGNS                                    [Refresh ↻]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │   47    │  │   12    │  │  0.78   │  │  0.65   │        │
│  │  Views  │  │Retrieves│  │ Quality │  │Diversity│        │
│  │   ▲12   │  │   ▲3    │  │   ▲0.05 │  │   ─     │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ADVANCEMENT STATUS                                   │   │
│  │ ████████████████████░░░░░░  78% to next tier        │   │
│  │ Quality: ✓  Views: ✓  Diversity: ○  Days: ✓         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Last computed: 2 minutes ago                               │
└─────────────────────────────────────────────────────────────┘
```

### Signal Badges (Nursery Cards)

```
┌─────────────────────────────────────────────────────────────┐
│ "Understanding Distributed Inference"                        │
│ ────────────────────────────────────                        │
│ Created 3 days ago • Ready for review                       │
│                                                             │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────────────────┐        │
│ │👁 47 │ │📥 12 │ │⭐ 4.2│ │ Quality: 0.78 ████▓░░│        │
│ └──────┘ └──────┘ └──────┘ └──────────────────────┘        │
│                                                             │
│ [Review] [Promote] [Refine]                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **UX Chief Review** — This brief awaits DEX compliance sign-off
2. **PM Review** — Validate scope, priorities, roadmap fit
3. **UI/UX Designer** — Refine wireframes for signal visualization
4. **User Story Refinery** — Generate Gherkin acceptance criteria
5. **Developer Execution** — Build with built-in visual verification

---

**Brief Status:** DRAFT — Awaiting UX Chief Review

---

*"Knowledge that cannot be measured cannot evolve. Signal Aggregation is how Grove learns to see."*
