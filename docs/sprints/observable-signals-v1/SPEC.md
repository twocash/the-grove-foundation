# Specification: S6-SL-ObservableSignals

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 1: Specification |
| **Status** | 🟡 In Progress |
| **Blocking Issues** | Depends on S5-SL-LifecycleEngine completion |
| **Last Updated** | 2026-01-16T00:00:00Z |
| **Next Action** | Complete spec, generate user stories |
| **Attention Anchor** | Instrumentation for Phase 3 auto-advancement (NOT analytics dashboard) |
| **EPIC** | Knowledge as Observable System (Phase 2 of 7) |

---

## Attention Anchor

**Re-read this block before every major decision.**

- **We are building:** Event instrumentation to capture sprout usage signals (retrieval, utility, citations)
- **Success looks like:** Every usage event captured with full provenance; operators see basic analytics; Phase 3 has data for auto-advancement
- **We are NOT:** Building auto-advancement logic (Phase 3), AI curation (Phase 6), attribution economy (Phase 7)
- **Current phase:** Specification
- **Next action:** Complete acceptance criteria, create user stories
- **Key insight:** "We're not building analytics. We're building the nervous system for emergent quality."

---

## Executive Summary

Phase 2 of the Observable Knowledge System EPIC. This sprint instruments the Grove system to capture observable usage signals that will enable automatic tier advancement in Phase 3. We track retrieval patterns, utility scores, citation graphs, and query diversity - the signals that reveal which knowledge is actually valuable.

**Strategic context:** Quality emerges from observable usage patterns, not centralized gatekeeping. Usage IS the review.

---

## Goals

### Primary Goal
Capture sprout usage events with full provenance to create the data foundation for automatic tier advancement.

### Secondary Goals
1. Define event taxonomy covering all signal categories (retrieval, utility, diversity, citations)
2. Create Supabase storage schema for usage events with aggregation support
3. Instrument Surface and Core layers to emit events at key interaction points
4. Provide basic analytics visibility in ExperienceConsole for operators
5. Enable per-sprout signal visualization in Finishing Room

---

## Non-Goals

- **Auto-advancement logic** - That's Phase 3 (S7)
- **AI agent curation** - That's Phase 6
- **Cross-grove federation** - That's Phase 5
- **Attribution economy/rewards** - That's Phase 7
- **Complex analytics dashboards** - v1.0 is data capture + basic viz
- **Real-time streaming analytics** - Batch aggregation is sufficient
- **Modifying Foundation layer** - FROZEN per Bedrock Addendum

---

## Signal Categories

### 1. Retrieval Patterns
How sprouts are accessed and referenced in the knowledge system.

| Signal | Description | Emission Point |
|--------|-------------|----------------|
| `sprout_viewed` | Sprout opened in Finishing Room | FinishingRoom.tsx |
| `sprout_retrieved` | Sprout included in RAG context | ragLoader.ts |
| `sprout_referenced` | Sprout cited in new research query | researchAgent context |
| `sprout_searched` | Sprout appeared in search results | GardenTray search |

### 2. Utility Scores
User feedback signals indicating sprout value.

| Signal | Description | Emission Point |
|--------|-------------|----------------|
| `sprout_rated` | User gave thumbs up/down | FinishingRoom rating UI |
| `sprout_exported` | User exported to markdown | Export action |
| `sprout_promoted` | User promoted to RAG corpus | Promote action |
| `sprout_refined` | User revised/extended sprout | Refinement loop |

### 3. Query Diversity
Breadth of contexts where sprout provides value.

| Signal | Description | Emission Point |
|--------|-------------|----------------|
| `query_context` | Topic/domain of query that retrieved sprout | RAG query metadata |
| `user_diversity` | Unique users who accessed sprout | Aggregated from events |
| `lens_diversity` | Different lenses that accessed sprout | Terminal lens context |

### 4. Citation Graph
How sprouts reference and build upon each other.

| Signal | Description | Emission Point |
|--------|-------------|----------------|
| `sprout_cites` | Sprout A references Sprout B | Research synthesis |
| `sprout_extends` | Sprout A extends/refines Sprout B | Refinement loop |
| `sprout_merges` | Multiple sprouts merged into one | Future: synthesis |

---

## Acceptance Criteria

### AC-1: Event Taxonomy Schema
- [ ] TypeScript interfaces defined in `src/core/schema/sprout-signals.ts`
- [ ] `SproutUsageEvent` type with discriminated union for event types
- [ ] `SignalAggregation` type for per-sprout rollups
- [ ] Full provenance on each event (sprout_id, user_id, timestamp, lens, journey, hub)
- [ ] Exported from `src/core/schema/index.ts`

### AC-2: Supabase Storage
- [ ] `sprout_usage_events` table created in Supabase
- [ ] JSONB metadata field for event-specific data
- [ ] Index on (sprout_id, event_type, created_at) for aggregation queries
- [ ] `sprout_signal_aggregations` materialized view or aggregation table
- [ ] RLS policies: events public read, authenticated write

### AC-3: Event Emission Infrastructure
- [ ] `useSproutSignals` hook in `src/surface/hooks/`
- [ ] Event emission functions for each signal type
- [ ] Debouncing/batching for high-frequency events (views)
- [ ] Offline queue with sync on reconnect
- [ ] Integration with existing EngagementBus pattern

### AC-4: Surface Layer Instrumentation
- [ ] FinishingRoom emits `sprout_viewed`, `sprout_rated`
- [ ] Export action emits `sprout_exported`
- [ ] Promote action emits `sprout_promoted`
- [ ] GardenTray search emits `sprout_searched`
- [ ] Terminal emits `query_context` with lens/hub metadata

### AC-5: Core Layer Instrumentation
- [ ] RAG loader emits `sprout_retrieved` when sprout included in context
- [ ] Research agent emits `sprout_referenced` on citation
- [ ] Provenance includes knowledge file source mapping

### AC-6: Operator Analytics (json-render Pattern)
- [ ] `SignalsCatalog` defined in `src/bedrock/consoles/ExperienceConsole/json-render/`
- [ ] Catalog includes: SignalHeader, MetricCard, FunnelChart, TimeSeriesChart, QualityIndicator
- [ ] `SignalsRegistry` maps catalog to React components
- [ ] `signalsToRenderTree()` transform converts aggregation data to render trees
- [ ] `SproutAnalyticsCard` uses json-render Renderer
- [ ] Displays: total events, events by type, top retrieved sprouts
- [ ] Conversion funnel visualization (seed → sapling rate)

### AC-7: Per-Sprout Signals (json-render Pattern)
- [ ] Signal summary panel in Finishing Room uses json-render
- [ ] Reuses SignalsCatalog components from AC-6
- [ ] Shows: view count, retrieval count, utility score, diversity index
- [ ] "Quality indicators" section predicting tier advancement eligibility
- [ ] Transform converts per-sprout aggregation to render tree

---

## Technical Architecture

### Event Schema

```typescript
// src/core/schema/sprout-signals.ts

export type SproutEventType =
  | 'sprout_viewed'
  | 'sprout_retrieved'
  | 'sprout_referenced'
  | 'sprout_searched'
  | 'sprout_rated'
  | 'sprout_exported'
  | 'sprout_promoted'
  | 'sprout_refined';

export interface SproutUsageEventBase {
  id: string;                    // UUID
  sproutId: string;              // FK to sprouts table
  eventType: SproutEventType;
  createdAt: string;             // ISO timestamp
  sessionId: string;             // Anonymous session
  userId?: string;               // Grove ID when authenticated
  provenance: EventProvenance;
}

export interface EventProvenance {
  lensId?: string;
  lensName?: string;
  journeyId?: string;
  journeyName?: string;
  hubId?: string;
  hubName?: string;
  queryHash?: string;            // For retrieval events
  sourceFile?: string;           // For RAG context
}

// Discriminated union for event-specific metadata
export type SproutUsageEvent =
  | SproutViewedEvent
  | SproutRetrievedEvent
  | SproutRatedEvent
  | SproutExportedEvent
  | SproutPromotedEvent
  | SproutRefinedEvent;

export interface SproutViewedEvent extends SproutUsageEventBase {
  eventType: 'sprout_viewed';
  metadata: {
    viewDurationMs?: number;
    scrollDepth?: number;
  };
}

export interface SproutRetrievedEvent extends SproutUsageEventBase {
  eventType: 'sprout_retrieved';
  metadata: {
    queryText: string;
    retrievalRank: number;        // Position in context
    contextBytes: number;         // How much was included
  };
}

export interface SproutRatedEvent extends SproutUsageEventBase {
  eventType: 'sprout_rated';
  metadata: {
    rating: 'up' | 'down';
    previousRating?: 'up' | 'down' | null;
  };
}

export interface SproutExportedEvent extends SproutUsageEventBase {
  eventType: 'sprout_exported';
  metadata: {
    format: 'markdown' | 'json' | 'notion';
  };
}

export interface SproutPromotedEvent extends SproutUsageEventBase {
  eventType: 'sprout_promoted';
  metadata: {
    fromTier: string;
    toTier: string;
  };
}

export interface SproutRefinedEvent extends SproutUsageEventBase {
  eventType: 'sprout_refined';
  metadata: {
    refinementType: 'extend' | 'revise' | 'annotate';
    charsDelta: number;
  };
}
```

### Aggregation Schema

```typescript
export interface SignalAggregation {
  sproutId: string;
  period: 'all_time' | 'last_30d' | 'last_7d';

  // Retrieval signals
  viewCount: number;
  retrievalCount: number;
  referenceCount: number;
  searchAppearances: number;

  // Utility signals
  upvotes: number;
  downvotes: number;
  utilityScore: number;          // Computed: (up - down) / total
  exportCount: number;
  promotionCount: number;
  refinementCount: number;

  // Diversity signals
  uniqueUsers: number;
  uniqueLenses: number;
  uniqueHubs: number;
  uniqueQueries: number;
  diversityIndex: number;        // Computed metric

  // Timeline
  firstEventAt: string;
  lastEventAt: string;
  daysActive: number;

  // Computed indicators
  qualityScore: number;          // Weighted composite
  advancementEligible: boolean;  // Based on Phase 3 criteria preview
}
```

### Supabase Migration

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_sprout_signals.sql

-- Event log table (append-only)
CREATE TABLE sprout_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprout_id UUID NOT NULL REFERENCES sprouts(id),
  event_type TEXT NOT NULL,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  provenance JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for aggregation queries
CREATE INDEX idx_sprout_events_sprout_type
  ON sprout_usage_events(sprout_id, event_type, created_at DESC);
CREATE INDEX idx_sprout_events_type_time
  ON sprout_usage_events(event_type, created_at DESC);
CREATE INDEX idx_sprout_events_session
  ON sprout_usage_events(session_id);

-- RLS policies
ALTER TABLE sprout_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON sprout_usage_events
  FOR SELECT USING (true);

CREATE POLICY "Authenticated write" ON sprout_usage_events
  FOR INSERT USING (auth.role() = 'authenticated' OR session_id IS NOT NULL);

-- Aggregation table (refreshed periodically)
CREATE TABLE sprout_signal_aggregations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprout_id UUID NOT NULL REFERENCES sprouts(id),
  period TEXT NOT NULL,          -- 'all_time', 'last_30d', 'last_7d'

  -- Counts
  view_count INTEGER DEFAULT 0,
  retrieval_count INTEGER DEFAULT 0,
  reference_count INTEGER DEFAULT 0,
  search_appearances INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  export_count INTEGER DEFAULT 0,
  promotion_count INTEGER DEFAULT 0,
  refinement_count INTEGER DEFAULT 0,

  -- Diversity
  unique_users INTEGER DEFAULT 0,
  unique_lenses INTEGER DEFAULT 0,
  unique_hubs INTEGER DEFAULT 0,
  unique_queries INTEGER DEFAULT 0,

  -- Computed
  utility_score DECIMAL(5,4) DEFAULT 0,
  diversity_index DECIMAL(5,4) DEFAULT 0,
  quality_score DECIMAL(5,4) DEFAULT 0,
  advancement_eligible BOOLEAN DEFAULT false,

  -- Timeline
  first_event_at TIMESTAMPTZ,
  last_event_at TIMESTAMPTZ,
  days_active INTEGER DEFAULT 0,

  -- Metadata
  computed_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(sprout_id, period)
);

CREATE INDEX idx_aggregations_sprout ON sprout_signal_aggregations(sprout_id);
CREATE INDEX idx_aggregations_eligible ON sprout_signal_aggregations(advancement_eligible)
  WHERE advancement_eligible = true;
```

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Event tracking | EngagementBus (`useEngagementBus.ts`) | Create parallel SproutSignalBus or extend |
| Supabase storage | GroveDataProvider | Add `sprout-signal` to GroveObjectType |
| Analytics viz | Genesis dashboard | Add SproutAnalyticsCard to ExperienceConsole |
| Per-item stats | StatsModal pattern | Add SignalsPanel to Finishing Room |

## New Patterns Proposed

### SproutSignalEmitter Pattern

Separate from EngagementBus because:
1. Events persist to Supabase (not just localStorage)
2. Different aggregation needs (per-sprout vs per-session)
3. Server-side emission (RAG loader, research agent)

```typescript
// Pattern: Emit from anywhere, persist to Supabase
const signals = useSproutSignals();

// Client-side emission
signals.emit('sprout_viewed', sproutId, { viewDurationMs: 5000 });

// Server-side emission (in API routes)
await sproutSignals.record('sprout_retrieved', sproutId, metadata);
```

### json-render Pattern for Analytics Visualization

**IMPORTANT:** All analytics UI components MUST use the json-render pattern established in the Sprout Finishing Room sprint.

The json-render pattern (Vercel Labs approach) provides:
1. **Catalog** - Component vocabulary with Zod schemas
2. **Registry** - Maps catalog types to React components
3. **Transform** - Converts domain models to render trees
4. **Renderer** - Renders trees declaratively

```
src/bedrock/consoles/ExperienceConsole/json-render/
├── signals-catalog.ts      # SignalsCatalog with Zod schemas
├── signals-registry.tsx    # Maps catalog to React components
├── signals-transform.ts    # Converts aggregation data to render trees
└── index.ts               # Module exports
```

**Catalog components for signals:**
```typescript
// signals-catalog.ts
export const SignalsCatalog = {
  SignalHeader: SignalHeaderSchema,
  MetricCard: MetricCardSchema,
  FunnelChart: FunnelChartSchema,
  TimeSeriesChart: TimeSeriesChartSchema,
  QualityIndicator: QualityIndicatorSchema,
  DiversityBadge: DiversityBadgeSchema,
};
```

**Why json-render for analytics:**
- Declarative: Analytics layouts defined in config, not hardcoded
- AI-ready: Future agents can generate analytics views
- Consistent: Same rendering pattern as Finishing Room
- Extensible: New chart types added to catalog without changing renderer

---

## Dependencies

- **S5-SL-LifecycleEngine (IN-PROGRESS)** - Establishes Supabase + ExperienceConsole pattern
- **Sprout System (COMPLETE)** - Provides sprout storage and Finishing Room
- **EngagementBus (COMPLETE)** - Pattern reference for event emission
- **Genesis Dashboard (COMPLETE)** - Pattern reference for analytics viz

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Event volume overwhelms storage | Medium | High | Batch writes, aggregation cron, TTL on raw events |
| Privacy concerns with tracking | Low | Medium | Anonymous session IDs, clear opt-out |
| Instrumentation causes perf issues | Low | Medium | Debounce views, async emission |
| Aggregation queries slow | Medium | Medium | Materialized views, periodic refresh |

---

## Effort Estimate

| Epic | Effort | Notes |
|------|--------|-------|
| Epic 1: Event Schema | S | TypeScript interfaces, Zod schemas |
| Epic 2: Supabase Tables | S | Migration, RLS, aggregation table |
| Epic 3: Signal Emission Hook | M | useSproutSignals, batching, offline queue |
| Epic 4: Surface Instrumentation | M | FinishingRoom, GardenTray events |
| Epic 5: Core Instrumentation | M | RAG loader, server-side emission |
| Epic 6: Aggregation Engine | M | Cron job, materialized views |
| Epic 7: json-render Signals Catalog | M | Catalog, Registry, Transform |
| Epic 8: ExperienceConsole Analytics | M | SproutAnalyticsCard using json-render |
| Epic 9: Finishing Room Signals | S | Per-sprout signal panel using json-render |
| **Total** | **L** (8-12 days) | Includes json-render foundation |

---

## DEX Alignment

| Pillar | How This Sprint Supports |
|--------|--------------------------|
| **Declarative Sovereignty** | Event types defined in schema, not hardcoded. New signals added via config. |
| **Capability Agnosticism** | Same signals tracked regardless of AI model generating content. |
| **Provenance** | Full event lineage: sprout → lens → journey → hub → query. Immutable audit trail. |
| **Organic Scalability** | Aggregation schema supports Phase 3 criteria. New event types additive. |

---

## Phase 3 Preview (For Context)

Phase 3 (S7-SL-AutoAdvancement) will consume this data to:

```typescript
// Example auto-advancement rule (Phase 3)
{
  fromTier: 'sapling',
  toTier: 'tree',
  criteria: {
    retrievalCount: { gte: 20 },
    utilityScore: { gte: 0.75 },
    diversityIndex: { gte: 0.5 },
    daysActive: { gte: 30 }
  }
}
```

**Phase 2 success means:** All these fields are populated with real data.

---

## FROZEN Zones (Do Not Touch)

Per Bedrock Addendum, these are FROZEN:

- `src/foundation/*` - All Foundation code
- `src/components/Terminal/*` - Legacy Terminal
- `pages/TerminalPage.tsx` - Legacy page

**Work only in:**
- `src/core/schema/*` - Event types
- `src/surface/hooks/*` - Signal emission hook
- `src/bedrock/*` - Analytics console components
- `src/widget/views/*` - Finishing Room instrumentation
- `server.js` - API endpoints for server-side emission

---

*Specification for S6-SL-ObservableSignals v1.0*
*Phase 2 of Observable Knowledge System EPIC*
*"We're not building analytics. We're building the nervous system for emergent quality."*
