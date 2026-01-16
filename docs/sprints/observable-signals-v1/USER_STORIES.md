# User Stories & Acceptance Criteria: S6-SL-ObservableSignals

**Sprint:** S6-SL-ObservableSignals (Phase 2 of Observable Knowledge EPIC)
**Phase:** User Story Refinery
**Status:** Draft for Review
**Stories:** 18 stories across 9 epics

---

## Critical Observations

### 1. Event Volume Considerations

The signal system will generate significant event volume. Design must account for:
- Batched writes to Supabase (not per-event)
- Debouncing for rapid repeated events (views)
- Offline queue with reconnect sync
- TTL on raw events (aggregations are the source of truth)

**Recommendation:** Start with higher-value events (promoted, exported) before high-volume events (viewed).

### 2. Privacy by Default

User tracking requires careful design:
- Anonymous session IDs, not user IDs (until Grove ID exists)
- No PII in event metadata
- Clear data retention policy
- Operator visibility into aggregations, not raw events

**Recommendation:** Session-level tracking only for v1.0. User attribution deferred.

### 3. json-render is Load-Bearing

The analytics UI MUST use json-render pattern for DEX compliance. This adds upfront work but enables:
- AI-generated analytics views (Phase 6)
- Operator-customizable dashboards
- Consistent rendering with Finishing Room

**Recommendation:** Build json-render catalog BEFORE analytics components.

---

## Proposed v1.0 Simplifications

| PM Brief Feature | v1.0 Approach | Rationale |
|------------------|---------------|-----------|
| Real-time analytics | Batch aggregation (15-min refresh) | Simpler, sufficient for Phase 3 |
| Citation graph | Track `sprout_referenced` events only | Full graph deferred to Phase 6 |
| User diversity metrics | Session diversity (unique sessions) | User IDs not yet implemented |
| Complex funnel viz | Simple progress bar | Full funnel in v1.1 |

---

## Epic 1: Event Schema Definition

### US-S001: Define SproutUsageEvent Types

**As a** developer
**I want to** have TypeScript types for all sprout usage events
**So that** event emission is type-safe and consistent

**INVEST Assessment:**
- **I**ndependent: Yes - Pure types, no runtime dependencies
- **N**egotiable: Yes - Schema can evolve
- **V**aluable: Yes - Foundation for all signal work
- **E**stimable: Yes - ~2 hours
- **S**mall: Yes - Single file
- **T**estable: Yes - Type compilation succeeds

**Acceptance Criteria:**

```gherkin
Scenario: Event schema types compile without error
  Given I create src/core/schema/sprout-signals.ts
  When I define SproutUsageEvent discriminated union
  And I define EventProvenance interface
  And I define all event-specific metadata types
  Then TypeScript compiles without error

Scenario: Event types are exported from core schema
  Given SproutUsageEvent types are defined
  When I import from @core/schema
  Then SproutUsageEvent and related types are available
```

**Traceability:** SPEC.md AC-1

---

### US-S002: Define SignalAggregation Schema

**As a** developer
**I want to** have TypeScript types for aggregated signal data
**So that** analytics components have type-safe access to rolled-up metrics

**INVEST Assessment:**
- **I**ndependent: Yes - Builds on US-S001
- **N**egotiable: Yes - Aggregation fields can adjust
- **V**aluable: Yes - Required for AC-6, AC-7
- **E**stimable: Yes - ~1 hour
- **S**mall: Yes - Single interface
- **T**estable: Yes - Type compilation succeeds

**Acceptance Criteria:**

```gherkin
Scenario: Aggregation schema includes all signal categories
  Given I define SignalAggregation interface
  Then it includes retrieval signals (viewCount, retrievalCount, etc.)
  And it includes utility signals (upvotes, downvotes, utilityScore)
  And it includes diversity signals (uniqueSessions, uniqueLenses)
  And it includes computed indicators (qualityScore, advancementEligible)

Scenario: Aggregation periods are typed
  Given SignalAggregation has a period field
  Then it accepts 'all_time' | 'last_30d' | 'last_7d'
```

**Traceability:** SPEC.md AC-1

---

## Epic 2: Supabase Storage

### US-S003: Create sprout_usage_events Table

**As a** system
**I want to** persist usage events to Supabase
**So that** signals survive page reloads and aggregate across sessions

**INVEST Assessment:**
- **I**ndependent: Yes - Database migration only
- **N**egotiable: Partially - Schema needs to match types
- **V**aluable: Yes - Core persistence layer
- **E**stimable: Yes - ~2 hours
- **S**mall: Yes - Single migration
- **T**estable: Yes - Insert/query succeeds

**Acceptance Criteria:**

```gherkin
Scenario: Events table is created with correct schema
  Given I run the Supabase migration
  Then sprout_usage_events table exists
  And it has columns: id, sprout_id, event_type, session_id, user_id, provenance, metadata, created_at
  And provenance and metadata are JSONB type

Scenario: Events table has required indexes
  Given sprout_usage_events table exists
  Then index on (sprout_id, event_type, created_at) exists
  And index on (event_type, created_at) exists
  And index on (session_id) exists

Scenario: RLS allows anonymous event insertion
  Given I am an anonymous user with a session_id
  When I insert an event
  Then the insert succeeds
  When I query events
  Then I can read all events
```

**Traceability:** SPEC.md AC-2

---

### US-S004: Create Signal Aggregations Table

**As an** operator
**I want to** query pre-aggregated signal data
**So that** analytics dashboards load quickly

**INVEST Assessment:**
- **I**ndependent: Yes - Can exist before aggregation engine
- **N**egotiable: Yes - Columns can adjust
- **V**aluable: Yes - Performance requirement
- **E**stimable: Yes - ~1 hour
- **S**mall: Yes - Single table
- **T**estable: Yes - Query succeeds

**Acceptance Criteria:**

```gherkin
Scenario: Aggregations table is created
  Given I run the Supabase migration
  Then sprout_signal_aggregations table exists
  And it has unique constraint on (sprout_id, period)
  And it has index on advancement_eligible

Scenario: Aggregations support period filtering
  Given aggregations exist for multiple periods
  When I query WHERE period = 'last_7d'
  Then only 7-day aggregations return
```

**Traceability:** SPEC.md AC-2

---

## Epic 3: Signal Emission Hook

### US-S005: Create useSproutSignals Hook

**As a** developer
**I want to** emit sprout events with a simple hook call
**So that** instrumentation is consistent across the codebase

**INVEST Assessment:**
- **I**ndependent: Yes - Hook wraps Supabase client
- **N**egotiable: Yes - API can evolve
- **V**aluable: Yes - Developer experience
- **E**stimable: Yes - ~4 hours
- **S**mall: Moderate - Hook with batching logic
- **T**estable: Yes - Mock Supabase, verify calls

**Acceptance Criteria:**

```gherkin
Scenario: Hook provides emit function for each event type
  Given I call useSproutSignals()
  Then it returns an emit object
  And emit has methods for viewed, retrieved, rated, exported, promoted, refined

Scenario: Emitted events include automatic provenance
  Given Terminal context has lens='engineer' and hub='ratchet-effect'
  When I emit a sprout_viewed event
  Then the event provenance includes lensId='engineer' and hubId='ratchet-effect'

Scenario: High-frequency events are debounced
  Given debounce is 1000ms for sprout_viewed
  When I emit sprout_viewed 5 times in 500ms
  Then only 1 event is sent to Supabase
  And viewDurationMs reflects the final value
```

**Traceability:** SPEC.md AC-3

---

### US-S006: Implement Offline Queue with Sync

**As a** user on unstable connection
**I want to** have my events queued when offline
**So that** no signal data is lost

**INVEST Assessment:**
- **I**ndependent: Yes - Enhancement to US-S005
- **N**egotiable: Yes - Queue strategy can vary
- **V**aluable: Yes - Data integrity
- **E**stimable: Yes - ~3 hours
- **S**mall: Yes - Queue + sync logic
- **T**estable: Yes - Simulate offline, verify queue

**Acceptance Criteria:**

```gherkin
Scenario: Events queue when offline
  Given the network is offline
  When I emit sprout_viewed events
  Then events are stored in localStorage queue
  And no Supabase calls are made

Scenario: Queue syncs when connection restored
  Given the queue has 5 pending events
  When the network comes online
  Then all 5 events are sent to Supabase
  And the queue is cleared on success
```

**Traceability:** SPEC.md AC-3

---

## Epic 4: Surface Layer Instrumentation

### US-S007: Instrument Finishing Room View Events

**As a** system
**I want to** track when users view sprouts in the Finishing Room
**So that** retrieval patterns are captured

**INVEST Assessment:**
- **I**ndependent: Yes - Finishing Room exists
- **N**egotiable: Yes - Metadata can expand
- **V**aluable: Yes - Core retrieval signal
- **E**stimable: Yes - ~2 hours
- **S**mall: Yes - One useEffect
- **T**estable: Yes - Open room, verify event

**Acceptance Criteria:**

```gherkin
Scenario: View event fires when Finishing Room opens
  Given I have useSproutSignals hook available
  When SproutFinishingRoom mounts with a sprout
  Then sprout_viewed event is emitted
  And event includes sproutId

Scenario: View duration is tracked on unmount
  Given Finishing Room is open for 30 seconds
  When I close the Finishing Room
  Then sprout_viewed event includes viewDurationMs=30000
```

**Traceability:** SPEC.md AC-4

---

### US-S008: Instrument Rating Events

**As a** user
**I want to** give thumbs up/down on sprouts
**So that** utility signals are captured

**INVEST Assessment:**
- **I**ndependent: Yes - Rating UI exists (or will be added)
- **N**egotiable: Yes - Rating UI design flexible
- **V**aluable: Yes - Direct utility signal
- **E**stimable: Yes - ~3 hours (includes UI)
- **S**mall: Yes - Two buttons + event
- **T**estable: Yes - Click button, verify event

**Acceptance Criteria:**

```gherkin
Scenario: Thumbs up emits positive rating event
  Given I am viewing a sprout in Finishing Room
  When I click the thumbs up button
  Then sprout_rated event is emitted
  And metadata.rating = 'up'

Scenario: Rating change is tracked
  Given I previously rated a sprout 'down'
  When I change my rating to 'up'
  Then sprout_rated event includes metadata.previousRating = 'down'
```

**Traceability:** SPEC.md AC-4

---

### US-S009: Instrument Export and Promote Actions

**As a** system
**I want to** track export and promote actions
**So that** high-value utility signals are captured

**INVEST Assessment:**
- **I**ndependent: Yes - Actions exist
- **N**egotiable: Yes - Metadata can vary
- **V**aluable: Yes - High signal-to-noise
- **E**stimable: Yes - ~2 hours
- **S**mall: Yes - Two event emissions
- **T**estable: Yes - Trigger action, verify event

**Acceptance Criteria:**

```gherkin
Scenario: Export action emits event
  Given I am viewing a sprout
  When I export to markdown
  Then sprout_exported event is emitted
  And metadata.format = 'markdown'

Scenario: Promote action emits event
  Given I have a sprout at 'sprout' tier
  When I promote it to 'sapling'
  Then sprout_promoted event is emitted
  And metadata.fromTier = 'sprout'
  And metadata.toTier = 'sapling'
```

**Traceability:** SPEC.md AC-4

---

## Epic 5: Core Layer Instrumentation

### US-S010: Instrument RAG Retrieval Events

**As a** system
**I want to** track when sprouts are included in RAG context
**So that** retrieval patterns are captured server-side

**INVEST Assessment:**
- **I**ndependent: Yes - RAG loader exists
- **N**egotiable: Yes - Metadata can expand
- **V**aluable: Yes - Core retrieval signal
- **E**stimable: Yes - ~3 hours
- **S**mall: Moderate - Server-side emission
- **T**estable: Yes - Query with sprout, verify event

**Acceptance Criteria:**

```gherkin
Scenario: RAG retrieval emits server-side event
  Given sprout X is in the RAG corpus
  When a query retrieves sprout X in context
  Then sprout_retrieved event is recorded
  And metadata includes queryHash and retrievalRank

Scenario: Multiple sprouts in context emit separate events
  Given sprouts A, B, C are retrieved
  Then 3 sprout_retrieved events are recorded
  And each has correct retrievalRank (0, 1, 2)
```

**Traceability:** SPEC.md AC-5

---

### US-S011: Create Server-Side Signal Recording API

**As a** developer
**I want to** record events from server.js API routes
**So that** server-side instrumentation is possible

**INVEST Assessment:**
- **I**ndependent: Yes - Server utility function
- **N**egotiable: Yes - API can evolve
- **V**aluable: Yes - Required for AC-5
- **E**stimable: Yes - ~2 hours
- **S**mall: Yes - Single utility + endpoint
- **T**estable: Yes - Call endpoint, verify DB

**Acceptance Criteria:**

```gherkin
Scenario: Server utility records events directly
  Given I have the recordSignalEvent utility
  When I call recordSignalEvent('sprout_retrieved', sproutId, metadata)
  Then event is inserted into sprout_usage_events

Scenario: Server API endpoint accepts event recording
  Given authenticated request to POST /api/signals/record
  When I send event payload
  Then event is persisted to Supabase
```

**Traceability:** SPEC.md AC-5

---

## Epic 6: Aggregation Engine

### US-S012: Create Aggregation Computation Function

**As an** operator
**I want to** have aggregations computed periodically
**So that** analytics queries are fast

**INVEST Assessment:**
- **I**ndependent: Yes - Database function
- **N**egotiable: Yes - Aggregation logic can tune
- **V**aluable: Yes - Performance requirement
- **E**stimable: Yes - ~4 hours
- **S**mall: Moderate - SQL + scheduling
- **T**estable: Yes - Run function, verify aggregations

**Acceptance Criteria:**

```gherkin
Scenario: Aggregation function computes all metrics
  Given sprout X has 10 view events and 5 retrieval events
  When compute_signal_aggregations() runs
  Then sprout X aggregation has view_count=10, retrieval_count=5

Scenario: Aggregations update for each period
  Given compute runs
  Then aggregations exist for periods: all_time, last_30d, last_7d
  And each period has correct time-filtered counts

Scenario: Computed scores are calculated
  Given sprout X has 8 upvotes and 2 downvotes
  When aggregation computes
  Then utility_score = 0.6 (8-2/10)
```

**Traceability:** SPEC.md Epic 6

---

## Epic 7: json-render Signals Catalog

### US-S013: Create SignalsCatalog with Zod Schemas

**As a** developer
**I want to** have a catalog of signal visualization components
**So that** analytics UI follows json-render pattern

**INVEST Assessment:**
- **I**ndependent: Yes - Pure catalog definition
- **N**egotiable: Yes - Components can expand
- **V**aluable: Yes - DEX compliance
- **E**stimable: Yes - ~3 hours
- **S**mall: Yes - Catalog file
- **T**estable: Yes - Schema validation

**Acceptance Criteria:**

```gherkin
Scenario: Catalog defines core signal components
  Given SignalsCatalog is created
  Then it includes: SignalHeader, MetricCard, FunnelChart, TimeSeriesChart, QualityIndicator
  And each component has a Zod schema

Scenario: Catalog schemas validate component props
  Given MetricCardSchema is defined
  When I parse { label: "Views", value: 42, trend: "up" }
  Then validation succeeds
  When I parse { label: "Views" } (missing value)
  Then validation fails
```

**Traceability:** SPEC.md AC-6 (json-render Pattern)

---

### US-S014: Create SignalsRegistry Mapping

**As a** developer
**I want to** map catalog types to React components
**So that** render trees become UI

**INVEST Assessment:**
- **I**ndependent: Yes - Builds on US-S013
- **N**egotiable: Yes - Styling flexible
- **V**aluable: Yes - Required for rendering
- **E**stimable: Yes - ~4 hours
- **S**mall: Moderate - Multiple components
- **T**estable: Yes - Render tree, verify DOM

**Acceptance Criteria:**

```gherkin
Scenario: Registry maps all catalog types
  Given SignalsRegistry is created
  Then it has entries for: SignalHeader, MetricCard, FunnelChart, TimeSeriesChart, QualityIndicator

Scenario: MetricCard renders correctly
  Given a render tree with MetricCard element
  When Renderer renders the tree
  Then DOM shows label "Views" and value "42"
  And trend arrow displays for "up"
```

**Traceability:** SPEC.md AC-6

---

### US-S015: Create signalsToRenderTree Transform

**As a** developer
**I want to** transform aggregation data to render trees
**So that** analytics displays are data-driven

**INVEST Assessment:**
- **I**ndependent: Yes - Pure function
- **N**egotiable: Yes - Tree structure can adjust
- **V**aluable: Yes - Connects data to UI
- **E**stimable: Yes - ~3 hours
- **S**mall: Yes - Transform function
- **T**estable: Yes - Input/output verification

**Acceptance Criteria:**

```gherkin
Scenario: Transform creates render tree from aggregation
  Given a SignalAggregation with viewCount=100, utilityScore=0.8
  When signalsToRenderTree() is called
  Then output is valid RenderTree
  And tree includes MetricCard for viewCount
  And tree includes QualityIndicator for utilityScore

Scenario: Transform handles empty aggregation
  Given no aggregation data exists
  When signalsToRenderTree() is called
  Then output includes empty state component
```

**Traceability:** SPEC.md AC-6

---

## Epic 8: ExperienceConsole Analytics

### US-S016: Create SproutAnalyticsCard

**As an** operator
**I want to** see signal analytics in ExperienceConsole
**So that** I can monitor knowledge system health

**INVEST Assessment:**
- **I**ndependent: Yes - Console pattern exists
- **N**egotiable: Yes - Metrics can adjust
- **V**aluable: Yes - Operator visibility
- **E**stimable: Yes - ~4 hours
- **S**mall: Moderate - Card with data loading
- **T**estable: Yes - Load console, verify card

**Acceptance Criteria:**

```gherkin
Scenario: Analytics card appears in ExperienceConsole
  Given I navigate to /bedrock/experience
  When I select "Sprout Analytics" type filter
  Then SproutAnalyticsCard is displayed

Scenario: Card displays aggregate metrics using json-render
  Given aggregation data exists
  Then card shows MetricCards for: totalEvents, topRetrieved, tierConversion
  And Renderer is used (not hardcoded components)

Scenario: Card links to detailed analytics
  Given I click "View Details" on analytics card
  Then full analytics dashboard opens
```

**Traceability:** SPEC.md AC-6

---

## Epic 9: Finishing Room Signals Panel

### US-S017: Add Signal Summary Panel to Finishing Room

**As a** user
**I want to** see usage signals for the current sprout
**So that** I understand its value in the knowledge system

**INVEST Assessment:**
- **I**ndependent: Yes - Panel in existing UI
- **N**egotiable: Yes - Metrics can adjust
- **V**aluable: Yes - User insight
- **E**stimable: Yes - ~3 hours
- **S**mall: Yes - Panel with aggregation query
- **T**estable: Yes - Open room, verify panel

**Acceptance Criteria:**

```gherkin
Scenario: Signal panel shows in Finishing Room
  Given I open a sprout in Finishing Room
  Then "Usage Signals" panel is visible
  And it shows view count, retrieval count, utility score

Scenario: Panel uses json-render components
  Given signal panel renders
  Then it uses Renderer with SignalsCatalog components
  And QualityIndicator shows advancement eligibility
```

**Traceability:** SPEC.md AC-7

---

### US-S018: Display Quality Indicators

**As a** user
**I want to** see if my sprout is eligible for tier advancement
**So that** I understand its maturity in the system

**INVEST Assessment:**
- **I**ndependent: Yes - Enhancement to US-S017
- **N**egotiable: Yes - Criteria preview can vary
- **V**aluable: Yes - Transparency
- **E**stimable: Yes - ~2 hours
- **S**mall: Yes - Indicator component
- **T**estable: Yes - Verify indicator state

**Acceptance Criteria:**

```gherkin
Scenario: Quality indicator shows advancement eligibility
  Given sprout has utilityScore >= 0.75 and retrievalCount >= 20
  Then QualityIndicator shows "Eligible for Tree tier"
  And indicator is green

Scenario: Quality indicator shows progress toward eligibility
  Given sprout has utilityScore = 0.5 and retrievalCount = 10
  Then QualityIndicator shows progress bars
  And text says "50% toward Tree eligibility"
```

**Traceability:** SPEC.md AC-7

---

## Deferred to v1.1

### US-S0XX: Citation Graph Visualization (DEFERRED)

**Reason:** Full graph rendering is complex; Phase 6 AI agents will benefit more.

**Original Flow:** Show interactive graph of sprout citations.

**v1.1 Prerequisite:** `sprout_referenced` events accumulated with citation metadata.

---

### US-S0XX: Real-Time Analytics Dashboard (DEFERRED)

**Reason:** Batch aggregation sufficient for Phase 3 auto-advancement.

**Original Flow:** Live-updating event stream and metrics.

**v1.1 Prerequisite:** WebSocket infrastructure.

---

### US-S0XX: User-Level Attribution (DEFERRED)

**Reason:** Grove ID not yet implemented.

**Original Flow:** Track events per user, show contribution metrics.

**v1.1 Prerequisite:** Grove ID auth system.

---

## Open Questions

1. **Event retention:** How long do we keep raw events? (30 days? 90 days?)
2. **Aggregation frequency:** Every 15 min? Hourly? On-demand?
3. **Privacy controls:** Should users be able to disable signal tracking?
4. **Tier criteria preview:** Show actual Phase 3 criteria or just "quality score"?

---

## Summary

| Story ID | Title | Priority | Complexity |
|----------|-------|----------|------------|
| US-S001 | Define SproutUsageEvent Types | P0 | S |
| US-S002 | Define SignalAggregation Schema | P0 | S |
| US-S003 | Create sprout_usage_events Table | P0 | S |
| US-S004 | Create Signal Aggregations Table | P0 | S |
| US-S005 | Create useSproutSignals Hook | P0 | M |
| US-S006 | Implement Offline Queue | P1 | M |
| US-S007 | Instrument Finishing Room Views | P0 | S |
| US-S008 | Instrument Rating Events | P1 | M |
| US-S009 | Instrument Export/Promote | P0 | S |
| US-S010 | Instrument RAG Retrieval | P0 | M |
| US-S011 | Server-Side Signal API | P0 | S |
| US-S012 | Aggregation Computation | P0 | M |
| US-S013 | SignalsCatalog Definition | P0 | M |
| US-S014 | SignalsRegistry Mapping | P0 | M |
| US-S015 | signalsToRenderTree Transform | P0 | S |
| US-S016 | SproutAnalyticsCard | P0 | M |
| US-S017 | Finishing Room Signals Panel | P1 | M |
| US-S018 | Quality Indicators | P1 | S |

**Total v1.0 Stories:** 18
**Deferred to v1.1:** 3

---

## DEX Alignment Verification

| Pillar | How Stories Support |
|--------|---------------------|
| **Declarative Sovereignty** | Event types in schema, analytics layout in json-render catalog, not hardcoded |
| **Capability Agnosticism** | Same signals tracked regardless of AI model; aggregation criteria in config |
| **Provenance as Infrastructure** | Every event has full provenance chain (lens → journey → hub → query) |
| **Organic Scalability** | New event types and catalog components added without core changes |

---

*User Stories for S6-SL-ObservableSignals v1.0*
*Phase 2 of Observable Knowledge System EPIC*
*json-render pattern for all analytics UI*
