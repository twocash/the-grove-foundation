# Visual Evidence Specification
## S12-SL-SignalAggregation v1

**Purpose:** Define the exact visual evidence required to prove this sprint works. This document is the blueprint for REVIEW.html and serves as acceptance criteria for the sprint.

**Compliance:** This spec implements **Constraint 11b: Comprehensive Visual Testing Standard**

---

## Constraint 11b Compliance

| Requirement | Target | Status |
|-------------|--------|--------|
| **Work Tier** | Sprint | — |
| **Minimum Screenshots** | 50+ | **52 defined** |
| **Test Suites** | lifecycle, features, analytics | ✅ |
| **REVIEW.html** | Interactive with navigation | ✅ |
| **Console Verification** | Zero critical errors | ✅ |

---

## Philosophy: Evidence Over Assertion

> *"Show, don't tell. A screenshot of real data is worth a thousand words in a spec."*

Every claim in the Product Brief MUST be backed by visual evidence. The REVIEW.html is not a summary — it's a **proof document**.

---

## Evidence Categories

### Category A: The Circuit Works (Infrastructure Proof) — 12 Screenshots

These screenshots prove the data pipeline functions correctly at the infrastructure level.

#### A.1: Event Emission (4 screenshots)
| ID | Screenshot | What It Must Show | Acceptance Criteria |
|----|------------|-------------------|---------------------|
| A1 | `infrastructure/01-view-event-emission.png` | Console showing sprout_viewed event | `useSproutSignals.emitViewed()` logged |
| A2 | `infrastructure/02-retrieve-event-emission.png` | Console showing sprout_retrieved event | `useSproutSignals.emitRetrieved()` logged |
| A3 | `infrastructure/03-rate-event-emission.png` | Console showing sprout_rated event | Rating value visible in payload |
| A4 | `infrastructure/04-network-tab-event-post.png` | Network tab showing Supabase insert | POST to sprout_usage_events succeeds |

#### A.2: Event Persistence (4 screenshots)
| ID | Screenshot | What It Must Show | Acceptance Criteria |
|----|------------|-------------------|---------------------|
| A5 | `infrastructure/05-supabase-event-table-overview.png` | sprout_usage_events table in Supabase | Row count visible |
| A6 | `infrastructure/06-event-table-view-rows.png` | Filtered to sprout_viewed events | Multiple rows, recent timestamps |
| A7 | `infrastructure/07-event-table-retrieve-rows.png` | Filtered to sprout_retrieved events | Different sprout_ids visible |
| A8 | `infrastructure/08-event-table-rate-rows.png` | Filtered to sprout_rated events | Rating values visible |

#### A.3: Aggregation Processing (4 screenshots)
| ID | Screenshot | What It Must Show | Acceptance Criteria |
|----|------------|-------------------|---------------------|
| A9 | `infrastructure/09-aggregation-function-call.png` | SQL editor calling compute_aggregations() | Function syntax visible |
| A10 | `infrastructure/10-aggregation-function-result.png` | Query result with computed values | Non-zero view_count, quality_score |
| A11 | `infrastructure/11-aggregation-table-populated.png` | document_signal_aggregations table | computed_at timestamps visible |
| A12 | `infrastructure/12-aggregation-join-query.png` | Query joining events → sprouts → docs → aggs | Complete FK chain visible |

**Narrative:** *"Events fire. Events persist. Aggregation computes. Values appear."*

---

### Category B: FinishingRoom Awakens (Explorer Experience) — 12 Screenshots

These screenshots prove Explorers see real vital signs, not zeros.

#### B.1: Before State (Baseline) — 4 screenshots
| ID | Screenshot | What It Must Show | Acceptance Criteria |
|----|------------|-------------------|---------------------|
| B1 | `finishing-room/01-before-explore-page.png` | /explore page with GardenTray | Sprout visible in list |
| B2 | `finishing-room/02-before-inspector-open.png` | GardenInspector modal opened | Tabs visible including "Finishing Room" |
| B3 | `finishing-room/03-before-vital-signs-zero.png` | Vital signs panel with zeros | view_count = 0, quality_score = 0.5 |
| B4 | `finishing-room/04-before-advancement-unknown.png` | Advancement panel in unknown state | No eligibility computed |

#### B.2: Event Generation — 2 screenshots
| ID | Screenshot | What It Must Show | Acceptance Criteria |
|----|------------|-------------------|---------------------|
| B5 | `finishing-room/05-during-user-interaction.png` | User interacting with sprout | Mouse over/click captured |
| B6 | `finishing-room/06-during-console-events.png` | Console showing events firing | Multiple events from single interaction |

#### B.3: After State (Computed) — 4 screenshots
| ID | Screenshot | What It Must Show | Acceptance Criteria |
|----|------------|-------------------|---------------------|
| B7 | `finishing-room/07-after-vital-signs-real.png` | Vital signs panel with REAL values | view_count > 0, quality_score != 0.5 |
| B8 | `finishing-room/08-after-view-count.png` | Zoomed view count metric | Number matches events emitted |
| B9 | `finishing-room/09-after-quality-score.png` | Zoomed quality score | Computed value with visual indicator |
| B10 | `finishing-room/10-after-advancement-eligible.png` | Advancement panel with eligibility | Progress bar or "Eligible" badge |

#### B.4: Verification — 2 screenshots
| ID | Screenshot | What It Must Show | Acceptance Criteria |
|----|------------|-------------------|---------------------|
| B11 | `finishing-room/11-refresh-button-click.png` | User clicking refresh | Button state change visible |
| B12 | `finishing-room/12-timestamp-updated.png` | "Last computed" timestamp updated | Recent timestamp after refresh |

**Narrative:** *"Before: dead. After: alive. The sprout has vital signs."*

**BEFORE/AFTER Comparison Required:** B3 and B7 must be the same sprout, same layout, different data.

---

### Category C: Nursery Gets Evidence (Cultivator Experience) — 10 Screenshots

These screenshots prove Cultivators can curate with data, not gut feeling.

#### C.1: Nursery Landing (2 screenshots)
| ID | Screenshot | What It Must Show | Acceptance Criteria |
|----|------------|-------------------|---------------------|
| C1 | `nursery/01-nursery-landing.png` | /bedrock/nursery full page | Queue visible with cards |
| C2 | `nursery/02-nursery-queue-overview.png` | Queue with multiple sprouts | Signal indicators visible on cards |

#### C.2: Card Signal Indicators (4 screenshots)
| ID | Screenshot | What It Must Show | Acceptance Criteria |
|----|------------|-------------------|---------------------|
| C3 | `nursery/03-card-view-count-badge.png` | Card with view count badge | 👁 47 or similar |
| C4 | `nursery/04-card-utility-score-badge.png` | Card with utility score | ⭐ 4.2 or similar |
| C5 | `nursery/05-card-quality-bar.png` | Quality score progress bar | Visual fill representing 0.78 |
| C6 | `nursery/06-card-hover-tooltip.png` | Hover state showing full metrics | All signal values in tooltip |

#### C.3: Decision Panel (2 screenshots)
| ID | Screenshot | What It Must Show | Acceptance Criteria |
|----|------------|-------------------|---------------------|
| C7 | `nursery/07-decision-panel-full.png` | Full decision panel for selected sprout | All aggregated metrics visible |
| C8 | `nursery/08-decision-panel-breakdown.png` | Signal breakdown section | Individual metric contributions |

#### C.4: Evidence-Based Action (2 screenshots)
| ID | Screenshot | What It Must Show | Acceptance Criteria |
|----|------------|-------------------|---------------------|
| C9 | `nursery/09-promote-dialog-with-evidence.png` | Promotion confirmation with metrics | "Quality: 0.78" justification shown |
| C10 | `nursery/10-queue-reordered-by-quality.png` | Queue sorted by quality score | Higher scores at top |

**Narrative:** *"The Cultivator sees evidence. Decisions are data-driven."*

---

### Category D: Analytics Dashboard (Operator Experience) — 10 Screenshots

These screenshots prove Operators have observatory-level visibility.

#### D.1: Analytics Overview (4 screenshots)
| ID | Screenshot | What It Must Show | Acceptance Criteria |
|----|------------|-------------------|---------------------|
| D1 | `analytics/01-experience-console-analytics-tab.png` | ExperienceConsole with Analytics section | Tab/section visible |
| D2 | `analytics/02-signal-overview-cards.png` | Metric summary cards | Total events, docs, avg quality |
| D3 | `analytics/03-event-count-detail.png` | Event count breakdown by type | viewed, retrieved, rated counts |
| D4 | `analytics/04-document-coverage.png` | Documents with/without aggregations | Coverage percentage |

#### D.2: Quality Visualization (3 screenshots)
| ID | Screenshot | What It Must Show | Acceptance Criteria |
|----|------------|-------------------|---------------------|
| D5 | `analytics/05-quality-distribution-histogram.png` | Quality score histogram | Bell curve or distribution |
| D6 | `analytics/06-top-sprouts-by-quality.png` | Leaderboard of highest quality | Top 5-10 sprouts |
| D7 | `analytics/07-bottom-sprouts-by-quality.png` | Sprouts needing attention | Lowest quality scores |

#### D.3: Refresh Mechanism (3 screenshots)
| ID | Screenshot | What It Must Show | Acceptance Criteria |
|----|------------|-------------------|---------------------|
| D8 | `analytics/08-refresh-button-idle.png` | Refresh button in idle state | "Refresh Aggregations" visible |
| D9 | `analytics/09-refresh-in-progress.png` | Refresh button in loading state | Spinner or "Computing..." |
| D10 | `analytics/10-refresh-complete-timestamp.png` | Post-refresh state | Updated timestamp, new values |

**Narrative:** *"The Operator monitors the pulse of the entire knowledge corpus."*

---

### Category E: End-to-End Flow (The Complete Story) — 6 Screenshots

These screenshots/artifacts prove the entire circuit from event to display.

#### E.1: Complete Data Journey (4 screenshots)
| ID | Artifact | What It Must Show | Acceptance Criteria |
|----|----------|-------------------|---------------------|
| E1 | `e2e/01-journey-step1-user-views.png` | User opening a sprout | /explore with sprout visible |
| E2 | `e2e/02-journey-step2-event-fires.png` | Console showing event emission | Timestamp captured |
| E3 | `e2e/03-journey-step3-aggregation-runs.png` | Supabase showing computation | Function execution or cron |
| E4 | `e2e/04-journey-step4-ui-displays.png` | UI showing computed value | FinishingRoom with real number |

#### E.2: Architecture Documentation (2 screenshots)
| ID | Artifact | What It Must Show | Acceptance Criteria |
|----|----------|-------------------|---------------------|
| E5 | `e2e/05-annotated-dataflow.png` | Annotated screenshot with arrows | event → sprout → doc → agg → UI |
| E6 | `e2e/06-architecture-diagram.png` | Mermaid or draw.io diagram | Complete system architecture |

#### E.3: Optional Video
| ID | Artifact | What It Must Show | Acceptance Criteria |
|----|----------|-------------------|---------------------|
| E7 | `e2e/video-full-demo.mp4` (OPTIONAL) | 60 second recording | Complete flow: interact → emit → compute → display |

**Narrative:** *"From signal to insight — the complete journey."*

---

### Category F: DEX Compliance (Architectural Proof) — 6 Screenshots

These screenshots prove the implementation follows DEX principles.

#### F.1: Declarative Sovereignty (2 screenshots)
| ID | Screenshot | What It Must Show | Acceptance Criteria |
|----|------------|-------------------|---------------------|
| F1 | `dex/01-config-threshold-parameter.png` | SQL function with configurable threshold | `threshold := 0.7` parameter |
| F2 | `dex/02-threshold-change-no-deploy.png` | Different threshold value producing different result | No code deployment required |

#### F.2: Provenance as Infrastructure (2 screenshots)
| ID | Screenshot | What It Must Show | Acceptance Criteria |
|----|------------|-------------------|---------------------|
| F3 | `dex/03-aggregation-audit-trail.png` | Aggregation record with full provenance | computed_at, computation_method, first/last_event_at |
| F4 | `dex/04-event-source-traceability.png` | Query showing event → aggregation chain | FK relationships visible |

#### F.3: Capability Agnosticism (2 screenshots)
| ID | Screenshot | What It Must Show | Acceptance Criteria |
|----|------------|-------------------|---------------------|
| F5 | `dex/05-no-model-dependency.png` | Code/SQL with no AI/LLM calls | Pure PostgreSQL logic |
| F6 | `dex/06-works-without-api.png` | Aggregation working with Supabase only | No external service calls |

**Narrative:** *"Declarative. Traceable. DEX-compliant."*

---

## REVIEW.html Structure

The final REVIEW.html MUST follow this structure:

```html
<!DOCTYPE html>
<html>
<head>
  <title>S12-SL-SignalAggregation v1 - Sprint Review</title>
  <style>/* Grove review styles */</style>
</head>
<body>

  <header>
    <h1>S12-SL-SignalAggregation v1: Real Usage Metrics Engine</h1>
    <p class="tagline">"The nervous system exists. Now it listens."</p>
    <p class="status">Sprint Status: [COMPLETE/IN_PROGRESS]</p>
    <p class="date">Review Date: [DATE]</p>
  </header>

  <section id="executive-summary">
    <h2>Executive Summary</h2>
    <p><!-- 2-3 sentence summary of what was delivered --></p>
    <div class="metrics-bar">
      <span>Tests: X/Y Passing</span>
      <span>Screenshots: X Captured</span>
      <span>DEX Compliance: VERIFIED</span>
    </div>
  </section>

  <section id="the-awakening">
    <h2>Section 1: The Circuit Awakens</h2>
    <p>Evidence that the data pipeline functions correctly.</p>

    <div class="evidence-grid">
      <figure>
        <img src="screenshots/01-events-firing.png" alt="Events firing">
        <figcaption>A1: Events firing when sprout is viewed</figcaption>
      </figure>
      <!-- A2, A3, A4 -->
    </div>

    <div class="narrative">
      <p><strong>What this proves:</strong> Raw events flow into the database and aggregation computes real values.</p>
    </div>
  </section>

  <section id="finishing-room">
    <h2>Section 2: FinishingRoom Vital Signs</h2>
    <p>Before and after: from zeros to real metrics.</p>

    <div class="comparison">
      <figure class="before">
        <img src="screenshots/05-finishing-room-before.png" alt="Before">
        <figcaption>BEFORE: All zeros (broken state)</figcaption>
      </figure>
      <figure class="after">
        <img src="screenshots/06-finishing-room-after.png" alt="After">
        <figcaption>AFTER: Real computed values</figcaption>
      </figure>
    </div>

    <div class="narrative">
      <p><strong>What this unlocks:</strong> Explorers see evidence of their knowledge's impact.</p>
    </div>
  </section>

  <section id="nursery">
    <h2>Section 3: Evidence-Based Curation</h2>
    <p>Cultivators make decisions with data, not gut feeling.</p>

    <div class="evidence-grid">
      <!-- C1, C2, C3, C4 -->
    </div>

    <div class="narrative">
      <p><strong>What this unlocks:</strong> Meritocratic curation based on actual usage.</p>
    </div>
  </section>

  <section id="analytics">
    <h2>Section 4: Knowledge Observatory</h2>
    <p>Operators monitor the health of the entire corpus.</p>

    <div class="evidence-grid">
      <!-- D1, D2, D3, D4 -->
    </div>

    <div class="narrative">
      <p><strong>What this unlocks:</strong> System-wide visibility into knowledge health.</p>
    </div>
  </section>

  <section id="e2e">
    <h2>Section 5: The Complete Circuit</h2>
    <p>End-to-end proof that signals flow from event to insight.</p>

    <figure class="hero">
      <img src="screenshots/17-e2e-event-to-display.png" alt="E2E Flow">
      <figcaption>The complete data journey</figcaption>
    </figure>

    <figure>
      <img src="screenshots/18-architecture-diagram.png" alt="Architecture">
      <figcaption>System architecture</figcaption>
    </figure>
  </section>

  <section id="dex-compliance">
    <h2>Section 6: DEX Compliance Verification</h2>

    <table>
      <tr>
        <th>Pillar</th>
        <th>Requirement</th>
        <th>Evidence</th>
        <th>Status</th>
      </tr>
      <tr>
        <td>Declarative Sovereignty</td>
        <td>Thresholds configurable without code</td>
        <td><a href="#f1">Screenshot F1</a></td>
        <td>PASS</td>
      </tr>
      <!-- Other pillars -->
    </table>
  </section>

  <section id="test-results">
    <h2>Section 7: Test Results</h2>

    <table>
      <tr>
        <th>Test Suite</th>
        <th>Tests</th>
        <th>Passed</th>
        <th>Status</th>
      </tr>
      <!-- Test results -->
    </table>
  </section>

  <footer>
    <p>Sprint Review prepared by: [Agent]</p>
    <p>Approved by: UX Chief</p>
    <p>Generated: [Timestamp]</p>
  </footer>

</body>
</html>
```

---

## Screenshot Capture Checklist

Use this checklist during development to ensure all evidence is captured.

**Total Required: 56 screenshots (exceeds Constraint 11b minimum of 50)**

### Category A: Infrastructure — 12 Screenshots
#### A.1: Event Emission (4)
- [ ] A1: `infrastructure/01-view-event-emission.png`
- [ ] A2: `infrastructure/02-retrieve-event-emission.png`
- [ ] A3: `infrastructure/03-rate-event-emission.png`
- [ ] A4: `infrastructure/04-network-tab-event-post.png`

#### A.2: Event Persistence (4)
- [ ] A5: `infrastructure/05-supabase-event-table-overview.png`
- [ ] A6: `infrastructure/06-event-table-view-rows.png`
- [ ] A7: `infrastructure/07-event-table-retrieve-rows.png`
- [ ] A8: `infrastructure/08-event-table-rate-rows.png`

#### A.3: Aggregation Processing (4)
- [ ] A9: `infrastructure/09-aggregation-function-call.png`
- [ ] A10: `infrastructure/10-aggregation-function-result.png`
- [ ] A11: `infrastructure/11-aggregation-table-populated.png`
- [ ] A12: `infrastructure/12-aggregation-join-query.png`

### Category B: FinishingRoom — 12 Screenshots
#### B.1: Before State (4)
- [ ] B1: `finishing-room/01-before-explore-page.png`
- [ ] B2: `finishing-room/02-before-inspector-open.png`
- [ ] B3: `finishing-room/03-before-vital-signs-zero.png`
- [ ] B4: `finishing-room/04-before-advancement-unknown.png`

#### B.2: Event Generation (2)
- [ ] B5: `finishing-room/05-during-user-interaction.png`
- [ ] B6: `finishing-room/06-during-console-events.png`

#### B.3: After State (4)
- [ ] B7: `finishing-room/07-after-vital-signs-real.png`
- [ ] B8: `finishing-room/08-after-view-count.png`
- [ ] B9: `finishing-room/09-after-quality-score.png`
- [ ] B10: `finishing-room/10-after-advancement-eligible.png`

#### B.4: Verification (2)
- [ ] B11: `finishing-room/11-refresh-button-click.png`
- [ ] B12: `finishing-room/12-timestamp-updated.png`

### Category C: Nursery — 10 Screenshots
#### C.1: Nursery Landing (2)
- [ ] C1: `nursery/01-nursery-landing.png`
- [ ] C2: `nursery/02-nursery-queue-overview.png`

#### C.2: Card Signal Indicators (4)
- [ ] C3: `nursery/03-card-view-count-badge.png`
- [ ] C4: `nursery/04-card-utility-score-badge.png`
- [ ] C5: `nursery/05-card-quality-bar.png`
- [ ] C6: `nursery/06-card-hover-tooltip.png`

#### C.3: Decision Panel (2)
- [ ] C7: `nursery/07-decision-panel-full.png`
- [ ] C8: `nursery/08-decision-panel-breakdown.png`

#### C.4: Evidence-Based Action (2)
- [ ] C9: `nursery/09-promote-dialog-with-evidence.png`
- [ ] C10: `nursery/10-queue-reordered-by-quality.png`

### Category D: Analytics — 10 Screenshots
#### D.1: Analytics Overview (4)
- [ ] D1: `analytics/01-experience-console-analytics-tab.png`
- [ ] D2: `analytics/02-signal-overview-cards.png`
- [ ] D3: `analytics/03-event-count-detail.png`
- [ ] D4: `analytics/04-document-coverage.png`

#### D.2: Quality Visualization (3)
- [ ] D5: `analytics/05-quality-distribution-histogram.png`
- [ ] D6: `analytics/06-top-sprouts-by-quality.png`
- [ ] D7: `analytics/07-bottom-sprouts-by-quality.png`

#### D.3: Refresh Mechanism (3)
- [ ] D8: `analytics/08-refresh-button-idle.png`
- [ ] D9: `analytics/09-refresh-in-progress.png`
- [ ] D10: `analytics/10-refresh-complete-timestamp.png`

### Category E: End-to-End — 6 Screenshots
#### E.1: Complete Data Journey (4)
- [ ] E1: `e2e/01-journey-step1-user-views.png`
- [ ] E2: `e2e/02-journey-step2-event-fires.png`
- [ ] E3: `e2e/03-journey-step3-aggregation-runs.png`
- [ ] E4: `e2e/04-journey-step4-ui-displays.png`

#### E.2: Architecture Documentation (2)
- [ ] E5: `e2e/05-annotated-dataflow.png`
- [ ] E6: `e2e/06-architecture-diagram.png`

#### E.3: Optional Video
- [ ] E7: `e2e/video-full-demo.mp4` (OPTIONAL)

### Category F: DEX Compliance — 6 Screenshots
#### F.1: Declarative Sovereignty (2)
- [ ] F1: `dex/01-config-threshold-parameter.png`
- [ ] F2: `dex/02-threshold-change-no-deploy.png`

#### F.2: Provenance as Infrastructure (2)
- [ ] F3: `dex/03-aggregation-audit-trail.png`
- [ ] F4: `dex/04-event-source-traceability.png`

#### F.3: Capability Agnosticism (2)
- [ ] F5: `dex/05-no-model-dependency.png`
- [ ] F6: `dex/06-works-without-api.png`

---

## Iterative Review Process

The REVIEW.html can be built iteratively as features complete:

| Phase | Sections Complete | Screenshots | Cumulative | Review Gate |
|-------|-------------------|-------------|------------|-------------|
| **Phase 1** | A (Infrastructure) | 12 | 12 | "The circuit works at DB level" |
| **Phase 2** | A + B (FinishingRoom) | 12 | 24 | "Explorers see real data" |
| **Phase 3** | A + B + C (Nursery) | 10 | 34 | "Cultivators have evidence" |
| **Phase 4** | A + B + C + D (Analytics) | 10 | 44 | "Operators have observatory" |
| **Phase 5** | All + E + F | 12 | **56** | "Complete review, DEX verified" |

Each phase can be reviewed independently, with REVIEW.html growing as evidence accumulates.

**Constraint 11b Compliance:** Final total of 56 screenshots exceeds the 50+ minimum for Sprint-tier work.

---

## Quality Standards

### Screenshot Quality
- **Resolution:** Minimum 1280x720
- **Format:** PNG (for UI), JPG acceptable for photos
- **Annotations:** Use arrows/highlights to draw attention to key data
- **No PII:** Blur or redact any personal information

### Narrative Quality
- Each section has a "What this proves" statement
- Each section has a "What this unlocks" statement
- Evidence is linked to user value, not just technical completion

### Comparison Standards
- BEFORE/AFTER screenshots use same viewport size
- Same sprout/document shown in both states
- Timestamps visible to prove temporal sequence

---

## Acceptance Criteria Summary

The sprint is NOT complete until:

1. **All 56 screenshots captured** per this specification (Constraint 11b compliant)
2. **REVIEW.html follows the structure** defined above
3. **Each section has narrative** explaining what it proves and unlocks
4. **DEX compliance table** shows all PASS
5. **Test results table** shows acceptable pass rate (>90%)
6. **Console verification** shows zero critical errors
7. **UX Chief has reviewed** and signed off on visual evidence quality

---

## Test Suite Structure (Constraint 11b)

```
tests/e2e/s12-signal-aggregation/
├── lifecycle.spec.ts          # Core user journey: event → agg → display
├── features.spec.ts           # Feature-specific: refresh, badges, panels
└── analytics.spec.ts          # Analytics dashboard tests
```

**Screenshot Directory:**
```
docs/sprints/s12-sl-signalaggreg-v1/screenshots/
├── infrastructure/            # 12 screenshots (A1-A12)
├── finishing-room/            # 12 screenshots (B1-B12)
├── nursery/                   # 10 screenshots (C1-C10)
├── analytics/                 # 10 screenshots (D1-D10)
├── e2e/                       # 6 screenshots (E1-E6)
└── dex/                       # 6 screenshots (F1-F6)
```

---

*"The best documentation is evidence. The best evidence is visual. The best visual tells a story."*
