# Development Log: S6-SL-ObservableSignals v1

## Sprint Info

| Field | Value |
|-------|-------|
| **Sprint** | S6-SL-ObservableSignals v1 |
| **Started** | 2026-01-15 |
| **Status** | ✅ Complete |
| **Protocol** | Grove Execution Protocol v1.5 |
| **Pattern** | Supabase + useSproutSignals + json-render |
| **EPIC** | Knowledge as Observable System (Phase 2 of 7) |

---

## Attention Anchor

**Re-read before every major decision:**

- **We are building:** Event instrumentation to capture sprout usage signals
- **Success looks like:** Every usage event captured with full provenance; operators see analytics; Phase 3 has data
- **We are NOT:** Building auto-advancement (Phase 3), AI curation (Phase 6), attribution economy (Phase 7)
- **Architecture:** Supabase events + useSproutSignals hook + json-render analytics
- **Key insight:** "We're not building analytics. We're building the nervous system for emergent quality."

---

## Execution Phase

### 2026-01-15: Epic 1 - Event Schema Definition

**Author:** Developer (Claude Opus 4.5)

**Status:** ✅ Complete

**Completed:**
- [x] Created `src/core/schema/sprout-signals.ts` with full event taxonomy
  - `SproutEventType` - 8 event types covering retrieval, utility, diversity
  - `EventProvenance` - Full lineage (lens, journey, hub, query)
  - Discriminated unions for each event type with typed metadata
  - `SignalAggregation` - Per-sprout rollups for Phase 3
  - Zod schemas for runtime validation
  - Type guards and utilities
- [x] Exported all types from `src/core/schema/index.ts`

**Files Created:**
- `src/core/schema/sprout-signals.ts`

**Files Modified:**
- `src/core/schema/index.ts`

**Build Gate:** ✅ PASSED (33.38s)

**DEX Compliance:**
- Declarative Sovereignty: ✅ Event types defined in schema, new signals additive
- Capability Agnosticism: ✅ No model-specific code, works with any AI
- Provenance: ✅ Full event lineage tracked in EventProvenance
- Organic Scalability: ✅ Discriminated union pattern, extensible

**Next:** Epic 2 - Supabase Storage

---

### 2026-01-15: Epic 2 - Supabase Storage

**Author:** Developer (Claude Opus 4.5)

**Status:** ✅ Complete

**Completed:**
- [x] Created `sprout_usage_events` table (append-only event log)
  - UUID primary key, sprout_id, event_type (8 types), session_id, user_id
  - JSONB `provenance` for DEX Pillar III tracking
  - JSONB `metadata` for event-specific data
- [x] Created `sprout_signal_aggregations` table (pre-computed rollups)
  - 20+ signal columns for retrieval, utility, diversity
  - `quality_score` and `advancement_eligible` for Phase 3
  - Unique constraint on (sprout_id, period)
- [x] Added 5 indexes on events table for aggregation queries
- [x] Added 4 indexes on aggregations table
- [x] Added RLS policies (public read, session/authenticated write)
- [x] Created 3 helper functions for querying signals

**Files Created:**
- `supabase/migrations/016_sprout_signals.sql`

**Build Gate:** ✅ PASSED (40.09s)

**DEX Compliance:**
- Declarative Sovereignty: ✅ Event types in schema CHECK constraint, new types additive
- Capability Agnosticism: ✅ No model-specific code, works with any AI
- Provenance: ✅ Full event lineage in JSONB provenance column
- Organic Scalability: ✅ JSONB metadata allows extensible event payloads

**Notes:**
- Migration ready for `npx supabase db push` when deploying
- RLS allows anonymous event tracking via session_id
- Aggregation table supports Phase 3 auto-advancement queries

**Next:** Epic 3 - Signal Emission Hook

---

### 2026-01-15: Epic 3 - Signal Emission Hook

**Author:** Developer (Claude Opus 4.5)

**Status:** ✅ Complete

**Completed:**
- [x] Created `useSproutSignals` hook in `src/surface/hooks/`
  - Session ID management (persisted in sessionStorage)
  - Core `emit()` function with provenance support
  - Type-safe emitters for all 8 event types
  - Debouncing for view events (2s window)
  - Batching for efficiency (5s intervals)
  - Offline queue with localStorage persistence
  - Auto-sync on reconnect
- [x] Created `recordSproutSignal` standalone function for server-side contexts
- [x] Integration with Supabase client (lazy singleton)
- [x] Immediate flush for high-importance events (rated, exported, promoted, refined)

**Files Created:**
- `src/surface/hooks/useSproutSignals.ts`

**Build Gate:** ✅ PASSED (1m 18s)

**DEX Compliance:**
- Declarative Sovereignty: ✅ Event types from schema, provenance configurable
- Capability Agnosticism: ✅ No model-specific code
- Provenance: ✅ Full provenance passed to every event
- Organic Scalability: ✅ Typed emitters extensible via schema

**Notes:**
- View debouncing prevents spam (2s window per sprout)
- Batching reduces Supabase API calls
- Offline queue ensures no events lost
- Separate standalone function for server-side use (RAG loader)

**Next:** Epic 4 - Surface Layer Instrumentation

---

### 2026-01-15: Epic 4 - Surface Layer Instrumentation

**Author:** Developer (Claude Opus 4.5)

**Status:** ✅ Complete

**Completed:**
- [x] SproutFinishingRoom emits `sprout_viewed` on open with duration tracking
  - Start time captured on mount
  - Duration calculated and emitted on unmount
  - Full provenance from sprout (lens, journey, hub)
- [x] ActionPanel emits signals for all actions:
  - `sprout_refined` on revision submit (type: revise)
  - `sprout_refined` on annotation (type: annotate)
  - `sprout_promoted` on promote to RAG
  - `sprout_exported` on export action

**Files Modified:**
- `src/surface/components/modals/SproutFinishingRoom/SproutFinishingRoom.tsx`
- `src/surface/components/modals/SproutFinishingRoom/ActionPanel.tsx`

**Build Gate:** ✅ PASSED (33.27s)

**DEX Compliance:**
- Declarative Sovereignty: ✅ Events emitted via hook, not hardcoded
- Capability Agnosticism: ✅ No model-specific code
- Provenance: ✅ Full provenance passed from sprout metadata
- Organic Scalability: ✅ New action signals additive

**Notes:**
- GardenTray deferred - operates on ResearchSprouts (different entity)
- Rating UI not yet implemented in ActionPanel (future sprint)
- `sprout_searched` will be added when search is implemented

**Next:** Epic 5 - Core Layer Instrumentation

---

### 2026-01-15: Epic 5 - Core Layer Instrumentation

**Author:** Developer (Claude Opus 4.5)

**Status:** ✅ Complete (Partial - Infrastructure Ready)

**Completed:**
- [x] `recordSproutSignal` standalone function available for server-side contexts
  - Non-React function for API routes and background jobs
  - Same event schema and Supabase storage as client-side hook
  - Supports all 8 event types with full provenance

**Deferred (Requires Future Infrastructure):**
- [ ] `sprout_retrieved` - RAG loader emission
  - Requires tracking which knowledge files originated from promoted sprouts
  - Knowledge upload stores `sourceType: 'sprout'` metadata, but RAG loader doesn't query this
  - Future work: Add file origin lookup during context building
- [ ] `sprout_referenced` - Research agent citation
  - Research agent processes ResearchSprouts (different entity than Sprout)
  - No cross-sprout citation mechanism currently exists
  - Future work: Citation tracking when AI references existing sprouts

**Build Gate:** ✅ PASSED (no code changes needed)

**DEX Compliance:**
- Declarative Sovereignty: ✅ Event types from schema, extensible
- Capability Agnosticism: ✅ Server-side emission works with any AI
- Provenance: ✅ Full provenance support in standalone function
- Organic Scalability: ✅ Infrastructure ready for future emission points

**Notes:**
- Server-side signal emission infrastructure is complete
- Actual emission points (RAG retrieval, citations) depend on features not yet built
- This is intentional - we're building the nervous system, not forcing signals
- Phase 3+ will add tracking as those features are implemented

**Next:** Epic 6 - Aggregation Engine

---

### 2026-01-15: Epic 6 - Aggregation Engine

**Author:** Developer (Claude Opus 4.5)

**Status:** ✅ Complete

**Completed:**
- [x] Created `refresh_sprout_aggregations` Postgres function
  - Computes all signal aggregations from raw events
  - Supports 3 periods: `all_time`, `last_30d`, `last_7d`
  - Calculates: view_count, retrieval_count, upvotes, downvotes, utility_score
  - Calculates: unique_sessions, unique_lenses, unique_hubs, diversity_index
  - Calculates: days_active, quality_score (weighted composite)
  - Calculates: advancement_eligible (Phase 3 preview)
  - Upserts into `sprout_signal_aggregations` table
- [x] Created `refresh_all_aggregation_periods` helper function
- [x] Created `trigger_update_aggregation_on_event` for real-time updates (disabled by default)
- [x] Created `refresh_signal_aggregations` API-callable RPC function
  - Can be called via `supabase.rpc('refresh_signal_aggregations', { period: 'all_time' })`
- [x] Documented pg_cron scheduling options (commented, enable when needed)

**Files Created:**
- `supabase/migrations/017_sprout_signal_aggregation_engine.sql`

**Build Gate:** ✅ PASSED (31.79s)

**DEX Compliance:**
- Declarative Sovereignty: ✅ Quality score weights configurable in formula
- Capability Agnosticism: ✅ Pure data aggregation, no model-specific code
- Provenance: ✅ Aggregations computed from events with full provenance
- Organic Scalability: ✅ New aggregation periods additive, formulas extensible

**Notes:**
- Real-time trigger disabled by default (enable for high-value events)
- pg_cron scheduling commented out (enable when deploying to production)
- API endpoint allows on-demand refresh from ExperienceConsole
- Quality score formula: 30% view engagement + 30% utility + 20% diversity + 20% activity

**Next:** Epic 7 - json-render Signals Catalog

---

### 2026-01-15: Epic 7 - json-render Signals Catalog

**Author:** Developer (Claude Opus 4.5)

**Status:** ✅ Complete

**Completed:**
- [x] Created `signals-catalog.ts` with Zod schemas for all components
  - SignalHeader: title, period selector, timestamp
  - MetricCard: value with label, trend, color
  - MetricRow: horizontal grid of metric cards
  - QualityGauge: score visualization with thresholds
  - DiversityBadge: diversity index with breakdown
  - EventBreakdown: event type distribution
  - FunnelChart: engagement stage conversion
  - ActivityTimeline: recent events (stub)
  - AdvancementIndicator: eligibility status
- [x] Created `signals-registry.tsx` with React implementations
  - Full styling with Grove design system colors
  - Paper/ink theming support
  - Event type labels and colors
  - Period display names
- [x] Created `signals-transform.ts` with transform functions
  - `signalAggregationToRenderTree()` - main transform
  - `createEmptySignalsTree()` - empty state handling
  - `eventsToTimelineElement()` - raw events to timeline
  - Transform options for customization
- [x] Created `index.ts` with module exports
  - All schemas, types, registry, transform functions exported

**Files Created:**
- `src/bedrock/consoles/ExperienceConsole/json-render/signals-catalog.ts`
- `src/bedrock/consoles/ExperienceConsole/json-render/signals-registry.tsx`
- `src/bedrock/consoles/ExperienceConsole/json-render/signals-transform.ts`
- `src/bedrock/consoles/ExperienceConsole/json-render/index.ts`

**Build Gate:** ✅ PASSED (38.53s)

**DEX Compliance:**
- Declarative Sovereignty: ✅ Component vocabulary defined declaratively in catalog
- Capability Agnosticism: ✅ Pure UI rendering, no model-specific code
- Provenance: ✅ All data traced back to SignalAggregation source
- Organic Scalability: ✅ New components additive via catalog pattern

**Notes:**
- Follows Vercel Labs json-render pattern (Catalog → Registry → Transform → Renderer)
- Renderer is shared with SproutFinishingRoom module
- Transform supports customization via SignalsTransformOptions
- Empty state helper for sprouts with no events

**Next:** Epic 8 - ExperienceConsole Analytics

---

### 2026-01-15: Epic 8 - ExperienceConsole Analytics

**Author:** Developer (Claude Opus 4.5)

**Status:** ✅ Complete

**Completed:**
- [x] Created `useSproutAggregations` hook for fetching signal data
  - Supabase client integration with lazy singleton
  - Period switching (all_time, last_30d, last_7d)
  - Snake_case to camelCase transformation
  - Empty aggregation fallback for new sprouts
  - Refresh aggregation via RPC call
- [x] Created `SproutSignalsPanel` component
  - Period selector tabs
  - Refresh and recalculate buttons
  - Uses json-render Renderer with SignalsRegistry
  - Loading/error states
  - Last computed timestamp display
- [x] Integrated panel into `SproutEditor.tsx`
  - New collapsible "Usage Signals" section
  - Placed after Provenance section
  - Passes sproutId and spark (query) for context

**Files Created:**
- `src/bedrock/consoles/NurseryConsole/useSproutAggregations.ts`
- `src/bedrock/consoles/NurseryConsole/SproutSignalsPanel.tsx`

**Files Modified:**
- `src/bedrock/consoles/NurseryConsole/SproutEditor.tsx`

**Build Gate:** ✅ PASSED (34.57s)

**DEX Compliance:**
- Declarative Sovereignty: ✅ Signal display controlled via json-render catalog
- Capability Agnosticism: ✅ Pure data fetch and render, no model-specific code
- Provenance: ✅ Aggregation data traced to source events
- Organic Scalability: ✅ New analytics components additive via registry

**Notes:**
- Signals panel is collapsed by default to not overwhelm the editor
- Supabase credentials read from environment variables
- Graceful fallback when Supabase is not configured

**Next:** Epic 9 - Finishing Room Signals Panel

---

### 2026-01-15: Epic 9 - Finishing Room Signals Panel

**Author:** Developer (Claude Opus 4.5)

**Status:** ✅ Complete

**Completed:**
- [x] Created `FinishingRoomSignalsSection` component
  - Fetches aggregation data from Supabase
  - Uses json-render pattern with SignalsRegistry
  - Displays in CollapsibleSection matching panel style
  - Compact view (no conversion rates, thresholds hidden)
  - Loading state with "Loading signals..." message
- [x] Updated SproutFinishingRoom json-render index to re-export signals module
  - SignalsRegistry, signalAggregationToRenderTree, createEmptySignalsTree
- [x] Integrated signals section into ProvenancePanel
  - Added after Lifecycle section
  - Collapsed by default (less prominent than Bedrock panel)

**Files Created:**
- `src/surface/components/modals/SproutFinishingRoom/components/FinishingRoomSignalsSection.tsx`

**Files Modified:**
- `src/surface/components/modals/SproutFinishingRoom/json-render/index.ts`
- `src/surface/components/modals/SproutFinishingRoom/ProvenancePanel.tsx`

**Build Gate:** ✅ PASSED (37.90s)

**DEX Compliance:**
- Declarative Sovereignty: ✅ Signals display controlled via json-render catalog
- Capability Agnosticism: ✅ Pure data fetch and render, no model-specific code
- Provenance: ✅ Aggregation data traced to source events
- Organic Scalability: ✅ Re-uses signals module from ExperienceConsole

**Notes:**
- Surface layer has compact signals view (less data than Bedrock)
- Supabase client reused via lazy singleton pattern
- CollapsibleSection matches existing ProvenancePanel style

**Next:** E2E Tests, Visual Verification, REVIEW.html

---

### 2026-01-16: UX Chief QA Review

**Author:** UX Chief (QA Agent)

**Status:** ✅ Complete

**Overall Grade:** A+ (98/100)

**QA Report:** `docs/sprints/observable-signals-v1/UX_CHIEF_QA_REPORT.md` (846 lines)

**Validated:**
- [x] Build Quality - 38.57s, zero TypeScript errors, production-ready
- [x] Event Schema - 8 event types with discriminated unions, full provenance
- [x] Supabase Migrations - Proper indexes, RLS policies, aggregation engine
- [x] Signal Emission Hook - Offline queue, batching, debouncing
- [x] Instrumentation - SproutFinishingRoom and ActionPanel fully instrumented
- [x] json-render Catalog - 9 component schemas following Vercel Labs pattern
- [x] ExperienceConsole Integration - Analytics panel with period switching
- [x] DEX Compliance - All 4 pillars verified
- [x] Architecture - Zero drift to frozen zones, perfect v1.0 compliance

**Key Finding:**
> "We're not building analytics. We're building the nervous system for emergent quality." ✅ DELIVERED

**Notes:**
- S6 successfully provides observable signals infrastructure for S7-AutoAdvancement
- quality_score and advancement_eligible columns ready for Phase 3 automation
- Minor refinements identified (all optional)

---

## Template for Execution Entries

```markdown
### YYYY-MM-DD: Epic N - [Title]

**Author:** [Developer]

**Status:** ✅ Complete / 🔄 In Progress / ❌ Blocked

**Completed:**
- [ ] Story N.1: ...
- [ ] Story N.2: ...

**Build Gate:** ✅ PASSED / ❌ FAILED

**DEX Compliance:**
- Declarative Sovereignty: ✅ {how it passes}
- Capability Agnosticism: ✅ {how it passes}
- Provenance: ✅ {how it passes}
- Organic Scalability: ✅ {how it passes}

**Notes:**
[Any surprises, blockers, or deviations]

**Next:**
[What to do next]
```

---

## Completion Checklist

- [x] Epic 1: Event Schema Definition
- [x] Epic 2: Supabase Storage
- [x] Epic 3: Signal Emission Hook
- [x] Epic 4: Surface Layer Instrumentation
- [x] Epic 5: Core Layer Instrumentation (Partial - infrastructure ready)
- [x] Epic 6: Aggregation Engine
- [x] Epic 7: json-render Signals Catalog
- [x] Epic 8: ExperienceConsole Analytics
- [x] Epic 9: Finishing Room Signals Panel
- [x] All builds passing
- [x] E2E tests with console monitoring (3/3 passing)
- [x] Visual verification complete (7 screenshots)
- [x] REVIEW.html complete
- [ ] PR created and merged

---

*Development log for S6-SL-ObservableSignals v1*
*Phase 2 of Observable Knowledge System EPIC*
