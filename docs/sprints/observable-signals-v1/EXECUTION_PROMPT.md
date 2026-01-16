# Execution Prompt: S6-SL-ObservableSignals v1

## Developer Activation

```
You are acting as DEVELOPER for sprint: observable-signals-v1.

CRITICAL: Execute using the Grove Execution Protocol skill.
Run: /grove-execution-protocol

This sprint instruments the Grove system to capture observable usage signals
(retrieval, utility, citations) for automatic tier advancement in Phase 3.
```

---

## Quick Context

| Field | Value |
|-------|-------|
| **Sprint** | S6-SL-ObservableSignals v1 |
| **Domain** | Core + Surface + Bedrock |
| **Pattern** | Supabase + useSproutSignals + json-render |
| **Effort** | 8-12 days |
| **Stories** | 18 (see USER_STORIES.md) |
| **Epics** | 9 |
| **Dependency** | S5-SL-LifecycleEngine must be COMPLETE |

---

## Attention Anchor

**Re-read before every major decision:**

- **We are building:** Event instrumentation to capture sprout usage signals
- **Success looks like:** Every usage event captured with full provenance; operators see analytics via json-render; Phase 3 has data for auto-advancement
- **We are NOT:** Building auto-advancement (Phase 3), AI curation (Phase 6), attribution economy (Phase 7)
- **Architecture:** Supabase events + useSproutSignals hook + json-render analytics
- **Key insight:** "We're not building analytics. We're building the nervous system for emergent quality."

---

## Execution Protocol

**MANDATORY:** Use the Grove Execution Protocol skill for all implementation work.

```bash
# Invoke the protocol
/grove-execution-protocol
```

The protocol enforces:
- Strangler fig compliance (Foundation is FROZEN)
- Atomic execution with build gates
- Visual verification via Playwright screenshots
- Status updates to `.agent/status/current/`

---

## Sprint Artifacts (Read These)

| Artifact | Purpose | Priority |
|----------|---------|----------|
| `SPEC.md` | Goals, ACs, Live Status | **Read First** |
| `USER_STORIES.md` | Gherkin acceptance criteria | **Reference Often** |

---

## Epic Execution Order

Execute epics sequentially. Each has a build gate.

### Epic 1: Event Schema Definition
**Files:** `src/core/schema/sprout-signals.ts`, `src/core/schema/index.ts`
**Build Gate:** `npm run build`
**Commit:** `feat(schema): add SproutUsageEvent types`

### Epic 2: Supabase Storage
**Files:** `supabase/migrations/YYYYMMDDHHMMSS_create_sprout_signals.sql`
**Build Gate:** `npx supabase db push` + verify tables
**Commit:** `feat(db): create sprout signal tables`

### Epic 3: Signal Emission Hook
**Files:** `src/surface/hooks/useSproutSignals.ts`, tests
**Build Gate:** `npm run build && npm test`
**Commit:** `feat(hooks): add useSproutSignals with batching`

### Epic 4: Surface Layer Instrumentation
**Files:**
- `src/widget/views/SproutFinishingRoom/*.tsx`
- `src/surface/components/GardenTray/*.tsx`
**Build Gate:** `npm run build`
**Commit:** `feat(surface): instrument sprout usage events`

### Epic 5: Core Layer Instrumentation
**Files:**
- `src/core/engine/ragLoader.ts`
- `server.js` (API endpoint)
**Build Gate:** `npm run build`
**Commit:** `feat(core): instrument RAG retrieval events`

### Epic 6: Aggregation Engine
**Files:** Supabase SQL function, cron configuration
**Build Gate:** Run aggregation, verify output
**Commit:** `feat(db): add signal aggregation function`

### Epic 7: json-render Signals Catalog
**Files:**
- `src/bedrock/consoles/ExperienceConsole/json-render/signals-catalog.ts`
- `src/bedrock/consoles/ExperienceConsole/json-render/signals-registry.tsx`
- `src/bedrock/consoles/ExperienceConsole/json-render/signals-transform.ts`
- `src/bedrock/consoles/ExperienceConsole/json-render/index.ts`
**Build Gate:** `npm run build && npm test`
**Commit:** `feat(json-render): add SignalsCatalog for analytics`

### Epic 8: ExperienceConsole Analytics
**Files:**
- `src/bedrock/consoles/ExperienceConsole/cards/SproutAnalyticsCard.tsx`
- `src/bedrock/consoles/ExperienceConsole/component-registry.ts`
**Build Gate:** `npm run build && npm test`
**Commit:** `feat(bedrock): add SproutAnalyticsCard with json-render`

### Epic 9: Finishing Room Signals Panel
**Files:**
- `src/widget/views/SproutFinishingRoom/SignalsPanel.tsx`
**Build Gate:** `npm run build && npx playwright test`
**Commit:** `feat(surface): add signals panel to Finishing Room`

---

## Key Code Patterns

### Pattern 1: SproutUsageEvent Schema

```typescript
// src/core/schema/sprout-signals.ts
import { z } from 'zod';

export type SproutEventType =
  | 'sprout_viewed'
  | 'sprout_retrieved'
  | 'sprout_referenced'
  | 'sprout_rated'
  | 'sprout_exported'
  | 'sprout_promoted'
  | 'sprout_refined';

export const EventProvenanceSchema = z.object({
  lensId: z.string().optional(),
  lensName: z.string().optional(),
  journeyId: z.string().optional(),
  journeyName: z.string().optional(),
  hubId: z.string().optional(),
  hubName: z.string().optional(),
  queryHash: z.string().optional(),
  sourceFile: z.string().optional(),
});

export type EventProvenance = z.infer<typeof EventProvenanceSchema>;

export interface SproutUsageEventBase {
  id: string;
  sproutId: string;
  eventType: SproutEventType;
  createdAt: string;
  sessionId: string;
  userId?: string;
  provenance: EventProvenance;
}

// Discriminated union for event-specific metadata
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
    retrievalRank: number;
    contextBytes: number;
  };
}

export interface SproutRatedEvent extends SproutUsageEventBase {
  eventType: 'sprout_rated';
  metadata: {
    rating: 'up' | 'down';
    previousRating?: 'up' | 'down' | null;
  };
}

export type SproutUsageEvent =
  | SproutViewedEvent
  | SproutRetrievedEvent
  | SproutRatedEvent;
  // ... add other event types

export interface SignalAggregation {
  sproutId: string;
  period: 'all_time' | 'last_30d' | 'last_7d';
  viewCount: number;
  retrievalCount: number;
  upvotes: number;
  downvotes: number;
  utilityScore: number;
  uniqueSessions: number;
  uniqueLenses: number;
  qualityScore: number;
  advancementEligible: boolean;
  firstEventAt: string;
  lastEventAt: string;
  computedAt: string;
}
```

### Pattern 2: Supabase Migration

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_sprout_signals.sql

-- Event log table (append-only)
CREATE TABLE sprout_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprout_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  session_id TEXT NOT NULL,
  user_id UUID,
  provenance JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for aggregation
CREATE INDEX idx_sprout_events_sprout_type
  ON sprout_usage_events(sprout_id, event_type, created_at DESC);
CREATE INDEX idx_sprout_events_type_time
  ON sprout_usage_events(event_type, created_at DESC);

-- RLS
ALTER TABLE sprout_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON sprout_usage_events
  FOR SELECT USING (true);

CREATE POLICY "Session write" ON sprout_usage_events
  FOR INSERT WITH CHECK (session_id IS NOT NULL);

-- Aggregation table
CREATE TABLE sprout_signal_aggregations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprout_id UUID NOT NULL,
  period TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  retrieval_count INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  utility_score DECIMAL(5,4) DEFAULT 0,
  unique_sessions INTEGER DEFAULT 0,
  unique_lenses INTEGER DEFAULT 0,
  quality_score DECIMAL(5,4) DEFAULT 0,
  advancement_eligible BOOLEAN DEFAULT false,
  first_event_at TIMESTAMPTZ,
  last_event_at TIMESTAMPTZ,
  computed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sprout_id, period)
);
```

### Pattern 3: useSproutSignals Hook

```typescript
// src/surface/hooks/useSproutSignals.ts
import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@core/data/supabase-client';
import type { SproutEventType, EventProvenance } from '@core/schema';

const DEBOUNCE_MS = 1000;
const BATCH_SIZE = 10;

interface EventPayload {
  sproutId: string;
  eventType: SproutEventType;
  metadata: Record<string, unknown>;
  provenance: EventProvenance;
  timestamp: string;
}

export function useSproutSignals() {
  const queueRef = useRef<EventPayload[]>([]);
  const debounceRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const sessionId = useSessionId();
  const provenance = useCurrentProvenance();

  const flush = useCallback(async () => {
    if (queueRef.current.length === 0) return;

    const batch = queueRef.current.splice(0, BATCH_SIZE);
    const records = batch.map(e => ({
      sprout_id: e.sproutId,
      event_type: e.eventType,
      session_id: sessionId,
      provenance: e.provenance,
      metadata: e.metadata,
      created_at: e.timestamp,
    }));

    const { error } = await supabase
      .from('sprout_usage_events')
      .insert(records);

    if (error) {
      // Queue for offline retry
      localStorage.setItem('signal-queue', JSON.stringify([
        ...JSON.parse(localStorage.getItem('signal-queue') || '[]'),
        ...batch,
      ]));
    }
  }, [sessionId]);

  const emit = useCallback((
    eventType: SproutEventType,
    sproutId: string,
    metadata: Record<string, unknown> = {}
  ) => {
    const key = `${sproutId}:${eventType}`;

    // Debounce high-frequency events
    if (eventType === 'sprout_viewed') {
      const existing = debounceRef.current.get(key);
      if (existing) clearTimeout(existing);

      debounceRef.current.set(key, setTimeout(() => {
        queueRef.current.push({
          sproutId,
          eventType,
          metadata,
          provenance,
          timestamp: new Date().toISOString(),
        });
        flush();
      }, DEBOUNCE_MS));
    } else {
      // Immediate emit for high-value events
      queueRef.current.push({
        sproutId,
        eventType,
        metadata,
        provenance,
        timestamp: new Date().toISOString(),
      });
      flush();
    }
  }, [provenance, flush]);

  return {
    emit: {
      viewed: (sproutId: string, meta?: { viewDurationMs?: number }) =>
        emit('sprout_viewed', sproutId, meta || {}),
      retrieved: (sproutId: string, meta: { queryText: string; retrievalRank: number }) =>
        emit('sprout_retrieved', sproutId, meta),
      rated: (sproutId: string, rating: 'up' | 'down', previousRating?: 'up' | 'down') =>
        emit('sprout_rated', sproutId, { rating, previousRating }),
      exported: (sproutId: string, format: string) =>
        emit('sprout_exported', sproutId, { format }),
      promoted: (sproutId: string, fromTier: string, toTier: string) =>
        emit('sprout_promoted', sproutId, { fromTier, toTier }),
    },
  };
}
```

### Pattern 4: json-render SignalsCatalog

```typescript
// src/bedrock/consoles/ExperienceConsole/json-render/signals-catalog.ts
import { z } from 'zod';

// Catalog schemas
export const SignalHeaderSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  period: z.enum(['all_time', 'last_30d', 'last_7d']),
});

export const MetricCardSchema = z.object({
  label: z.string(),
  value: z.number(),
  format: z.enum(['number', 'percent', 'duration']).default('number'),
  trend: z.enum(['up', 'down', 'neutral']).optional(),
  trendValue: z.number().optional(),
});

export const QualityIndicatorSchema = z.object({
  score: z.number().min(0).max(1),
  label: z.string(),
  isEligible: z.boolean(),
  criteria: z.array(z.object({
    name: z.string(),
    current: z.number(),
    required: z.number(),
    met: z.boolean(),
  })),
});

export const FunnelChartSchema = z.object({
  stages: z.array(z.object({
    label: z.string(),
    count: z.number(),
    percentage: z.number(),
  })),
});

// Catalog export
export const SignalsCatalog = {
  SignalHeader: SignalHeaderSchema,
  MetricCard: MetricCardSchema,
  QualityIndicator: QualityIndicatorSchema,
  FunnelChart: FunnelChartSchema,
};

export type SignalsCatalogType = typeof SignalsCatalog;

// RenderElement and RenderTree types (same as ResearchCatalog)
export interface RenderElement {
  type: keyof SignalsCatalogType;
  props: z.infer<SignalsCatalogType[keyof SignalsCatalogType]>;
}

export interface RenderTree {
  elements: RenderElement[];
}
```

### Pattern 5: SignalsRegistry

```typescript
// src/bedrock/consoles/ExperienceConsole/json-render/signals-registry.tsx
import React from 'react';
import type { RenderElement, MetricCardSchema, QualityIndicatorSchema } from './signals-catalog';
import { z } from 'zod';

type MetricCardProps = z.infer<typeof MetricCardSchema>;
type QualityIndicatorProps = z.infer<typeof QualityIndicatorSchema>;

export interface ComponentRegistry {
  [key: string]: React.FC<{ element: RenderElement }>;
}

export const SignalsRegistry: ComponentRegistry = {
  MetricCard: ({ element }) => {
    const props = element.props as MetricCardProps;
    const formatted = props.format === 'percent'
      ? `${(props.value * 100).toFixed(1)}%`
      : props.value.toLocaleString();

    return (
      <div className="bg-obsidian/50 rounded-lg p-4 border border-holo-cyan/20">
        <div className="text-xs text-holo-cyan/60 uppercase tracking-wide mb-1">
          {props.label}
        </div>
        <div className="text-2xl font-mono text-paper">
          {formatted}
        </div>
        {props.trend && (
          <div className={`text-xs mt-1 ${
            props.trend === 'up' ? 'text-grove-forest' :
            props.trend === 'down' ? 'text-grove-clay' : 'text-ink-muted'
          }`}>
            {props.trend === 'up' ? '↑' : props.trend === 'down' ? '↓' : '→'}
            {props.trendValue && ` ${props.trendValue}%`}
          </div>
        )}
      </div>
    );
  },

  QualityIndicator: ({ element }) => {
    const props = element.props as QualityIndicatorProps;

    return (
      <div className="bg-obsidian/30 rounded-lg p-4 border border-holo-cyan/10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-paper">{props.label}</span>
          <span className={`px-2 py-1 rounded text-xs font-mono ${
            props.isEligible
              ? 'bg-grove-forest/20 text-grove-forest'
              : 'bg-ink-muted/20 text-ink-muted'
          }`}>
            {props.isEligible ? 'ELIGIBLE' : 'IN PROGRESS'}
          </span>
        </div>
        <div className="space-y-2">
          {props.criteria.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className={c.met ? 'text-grove-forest' : 'text-ink-muted'}>
                {c.met ? '✓' : '○'}
              </span>
              <span className="text-paper/80">{c.name}</span>
              <span className="text-ink-muted ml-auto">
                {c.current}/{c.required}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  },

  // Add other components...
};
```

---

## Verification Commands

```bash
# After each epic
npm run build

# After Epic 3, 7, 8
npm test

# After Epic 9 (final verification)
npm run build && npm test && npx playwright test

# Database verification
npx supabase db diff

# Check event emission (dev tools console)
# Open Finishing Room, verify sprout_viewed event in Network tab
```

---

## FROZEN Zones (Do Not Touch)

Per Bedrock Addendum, these are FROZEN:

- `src/foundation/*` - All Foundation code
- `src/components/Terminal/*` - Legacy Terminal
- `pages/TerminalPage.tsx` - Legacy page

**Work only in:**
- `src/core/schema/*` - Event types
- `src/core/engine/*` - RAG instrumentation
- `src/surface/hooks/*` - Signal emission hook
- `src/bedrock/consoles/ExperienceConsole/*` - Analytics components
- `src/widget/views/SproutFinishingRoom/*` - Signals panel
- `server.js` - API endpoints
- `supabase/migrations/*` - Database schema

---

## Status Updates

Write status to: `.agent/status/current/{NNN}-{timestamp}-developer.md`
Template: `.agent/status/ENTRY_TEMPLATE.md`

Update after each epic completion with:
- Epic completed
- Build gate result
- Commit hash
- Any blockers

---

## Success Criteria

Sprint complete when:
- [ ] All 9 epics complete with passing build gates
- [ ] 18 user stories verified via Gherkin ACs
- [ ] E2E tests pass
- [ ] Manual verification: ExperienceConsole shows SproutAnalyticsCard
- [ ] Manual verification: Finishing Room shows signals panel
- [ ] Events appear in Supabase sprout_usage_events table
- [ ] Aggregations compute correctly
- [ ] json-render pattern used for all analytics UI

---

## On Completion

1. Update SPEC.md Live Status to "COMPLETE"
2. Write COMPLETE status entry
3. Notify sprintmaster for Notion sync
4. Verify Phase 3 prerequisites are met

---

*Execution Prompt for S6-SL-ObservableSignals v1.0*
*Phase 2 of Observable Knowledge System EPIC*
*Pattern: Supabase + useSproutSignals + json-render*
*Protocol: Grove Execution Protocol*
