# Bedrock Event Architecture v1 — Execution Prompt

**Sprint:** bedrock-event-architecture-v1  
**Phase:** 7 (Execution Handoff)  
**Generated:** January 4, 2026  
**For:** Claude Code / Execution Agent

---

## Quick Start

```bash
# Navigate to project
cd C:\GitHub\the-grove-foundation

# Verify branch
git branch --show-current  # Should be bedrock or feature branch

# Install dependencies (if needed)
npm install

# Run existing tests (verify baseline)
npm test
npx playwright test
```

---

## Bedrock Verification (Core Infrastructure)

Per `BEDROCK_SPRINT_CONTRACT.md` v1.1, Section 6.3 (Core Infrastructure Sprints):

### Before Starting
- [ ] On `bedrock` branch (or feature branch off bedrock)
- [ ] No imports from `src/foundation/` in new code
- [ ] Constitutional documents reviewed (see SPEC.md)

### After Each Epic
- [ ] New files created only in `src/core/events/`
- [ ] All event types extend `MetricAttribution` (provenance)
- [ ] Zod schemas validate all event types
- [ ] Projection functions are pure (no side effects)
- [ ] Tests pass: `npx vitest run src/core/events/`

### Final Verification
- [ ] DEX compliance matrix passes (documented in SPEC.md)
- [ ] No legacy coupling introduced
- [ ] Coverage ≥ 90% on `src/core/events/`
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Full test suite: `npm test`

**Note:** Console-specific requirements (BedrockLayout, Copilot integration, GroveObject schema) do not apply to this core infrastructure sprint.

---

## Context

You are implementing **Sprint 1** of the Bedrock Event Architecture. This sprint creates the foundational event types, validation schemas, and projection functions. **No React hooks or route integration in this sprint.**

### Key Documents
- `docs/sprints/bedrock-event-architecture-v1/SPEC.md` — Full specification
- `docs/sprints/bedrock-event-architecture-v1/ARCHITECTURE.md` — Target architecture
- `docs/sprints/bedrock-event-architecture-v1/MIGRATION_MAP.md` — File creation plan
- `docs/sprints/bedrock-event-architecture-v1/SPRINTS.md` — Story breakdown

### Existing Code to Reference
- `src/core/schema/telemetry.ts` — MetricAttribution and existing telemetry types
- `src/core/engagement/types.ts` — Current event types (for reference, not modification)

---

## Epic 1: Core Event Types

### File: `src/core/events/types.ts`

Create this file with all event type definitions:

```typescript
// src/core/events/types.ts
// Sprint: bedrock-event-architecture-v1

import type {
  MetricAttribution,
  JourneyCompletion,
  TopicExploration,
  SproutCapture,
} from '../schema/telemetry';

// ─────────────────────────────────────────────────────────────────
// BASE EVENT TYPE
// ─────────────────────────────────────────────────────────────────

/**
 * Base type for all Grove events.
 * Extends MetricAttribution with session scoping and type discriminant.
 */
export interface GroveEventBase extends MetricAttribution {
  /** Field identifier (e.g., 'grove') - inherited from MetricAttribution */
  fieldId: string;
  /** Unix timestamp in milliseconds - inherited from MetricAttribution */
  timestamp: number;
  /** Event type discriminant for narrowing */
  type: string;
  /** Session identifier for session-scoped queries */
  sessionId: string;
}

// ─────────────────────────────────────────────────────────────────
// SESSION LIFECYCLE EVENTS
// ─────────────────────────────────────────────────────────────────

export interface SessionStartedEvent extends GroveEventBase {
  type: 'SESSION_STARTED';
  isReturning: boolean;
  previousSessionId?: string;
}

export interface SessionResumedEvent extends GroveEventBase {
  type: 'SESSION_RESUMED';
  previousSessionId: string;
  minutesSinceLastActivity: number;
}

// ─────────────────────────────────────────────────────────────────
// LENS / PERSPECTIVE EVENTS
// ─────────────────────────────────────────────────────────────────

export interface LensActivatedEvent extends GroveEventBase {
  type: 'LENS_ACTIVATED';
  lensId: string;
  source: 'url' | 'selection' | 'system' | 'localStorage';
  isCustom: boolean;
}

// ─────────────────────────────────────────────────────────────────
// EXPLORATION STREAM EVENTS
// ─────────────────────────────────────────────────────────────────

export interface QuerySubmittedEvent extends GroveEventBase {
  type: 'QUERY_SUBMITTED';
  queryId: string;
  content: string;
  intent?: 'deep_dive' | 'pivot' | 'apply' | 'challenge';
  sourceResponseId?: string;
}

export interface ResponseCompletedEvent extends GroveEventBase {
  type: 'RESPONSE_COMPLETED';
  responseId: string;
  queryId: string;
  hubId?: string;
  hasNavigation: boolean;
  spanCount: number;
}

export interface ForkSelectedEvent extends GroveEventBase {
  type: 'FORK_SELECTED';
  forkId: string;
  forkType: 'deep_dive' | 'pivot' | 'apply' | 'challenge';
  label: string;
  responseId: string;
}

export interface PivotTriggeredEvent extends GroveEventBase {
  type: 'PIVOT_TRIGGERED';
  conceptId: string;
  sourceText: string;
  responseId: string;
}

export interface HubEnteredEvent extends GroveEventBase {
  type: 'HUB_ENTERED';
  hubId: string;
  source: 'query' | 'navigation' | 'pivot' | 'journey';
}

// ─────────────────────────────────────────────────────────────────
// JOURNEY LIFECYCLE EVENTS
// ─────────────────────────────────────────────────────────────────

export interface JourneyStartedEvent extends GroveEventBase {
  type: 'JOURNEY_STARTED';
  journeyId: string;
  lensId: string;
  waypointCount: number;
}

export interface JourneyAdvancedEvent extends GroveEventBase {
  type: 'JOURNEY_ADVANCED';
  journeyId: string;
  waypointId: string;
  position: number;
}

/** Extends existing JourneyCompletion with event base */
export interface JourneyCompletedEvent extends JourneyCompletion, Omit<GroveEventBase, keyof MetricAttribution> {
  type: 'JOURNEY_COMPLETED';
}

// ─────────────────────────────────────────────────────────────────
// CAPTURE EVENTS (extend existing telemetry)
// ─────────────────────────────────────────────────────────────────

/** Extends existing SproutCapture with event base */
export interface InsightCapturedEvent extends SproutCapture, Omit<GroveEventBase, keyof MetricAttribution> {
  type: 'INSIGHT_CAPTURED';
}

/** Extends existing TopicExploration with event base */
export interface TopicExploredEvent extends TopicExploration, Omit<GroveEventBase, keyof MetricAttribution> {
  type: 'TOPIC_EXPLORED';
}

// ─────────────────────────────────────────────────────────────────
// MOMENT LIFECYCLE EVENTS
// ─────────────────────────────────────────────────────────────────

export interface MomentSurfacedEvent extends GroveEventBase {
  type: 'MOMENT_SURFACED';
  momentId: string;
  surface: string;
  priority: number;
}

export interface MomentResolvedEvent extends GroveEventBase {
  type: 'MOMENT_RESOLVED';
  momentId: string;
  resolution: 'actioned' | 'dismissed';
  actionId?: string;
  actionType?: string;
}

// ─────────────────────────────────────────────────────────────────
// UNION TYPE
// ─────────────────────────────────────────────────────────────────

export type GroveEvent =
  // Session
  | SessionStartedEvent
  | SessionResumedEvent
  // Lens
  | LensActivatedEvent
  // Exploration
  | QuerySubmittedEvent
  | ResponseCompletedEvent
  | ForkSelectedEvent
  | PivotTriggeredEvent
  | HubEnteredEvent
  // Journey
  | JourneyStartedEvent
  | JourneyAdvancedEvent
  | JourneyCompletedEvent
  // Capture
  | InsightCapturedEvent
  | TopicExploredEvent
  // Moments
  | MomentSurfacedEvent
  | MomentResolvedEvent;

// ─────────────────────────────────────────────────────────────────
// EVENT LOG SCHEMA
// ─────────────────────────────────────────────────────────────────

/**
 * GroveEventLog v3 — Unified event store.
 * Extends CumulativeMetricsV2 pattern to all events.
 */
export interface GroveEventLog {
  /** Schema version for migration support */
  version: 3;
  /** Field identifier (e.g., 'grove') */
  fieldId: string;
  /** Current session identifier */
  currentSessionId: string;
  /** Session-scoped events (cleared on new session) */
  sessionEvents: GroveEvent[];
  /** Cumulative events (persisted across sessions) */
  cumulativeEvents: {
    journeyCompletions: JourneyCompletedEvent[];
    topicExplorations: TopicExploredEvent[];
    insightCaptures: InsightCapturedEvent[];
  };
  /** Total session count */
  sessionCount: number;
  /** Last session timestamp */
  lastSessionAt: number;
}

// ─────────────────────────────────────────────────────────────────
// TYPE GUARDS
// ─────────────────────────────────────────────────────────────────

export function isGroveEvent(event: unknown): event is GroveEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'type' in event &&
    'fieldId' in event &&
    'timestamp' in event &&
    'sessionId' in event
  );
}

export function isSessionEvent(event: GroveEvent): event is SessionStartedEvent | SessionResumedEvent {
  return event.type === 'SESSION_STARTED' || event.type === 'SESSION_RESUMED';
}

export function isCumulativeEvent(event: GroveEvent): event is JourneyCompletedEvent | TopicExploredEvent | InsightCapturedEvent {
  return event.type === 'JOURNEY_COMPLETED' || event.type === 'TOPIC_EXPLORED' || event.type === 'INSIGHT_CAPTURED';
}
```

### Verification
```bash
npx tsc --noEmit
```

---

## Epic 2: Zod Validation Schemas

### File: `src/core/events/schema.ts`

Create Zod schemas for runtime validation:

```typescript
// src/core/events/schema.ts
// Sprint: bedrock-event-architecture-v1

import { z } from 'zod';
import type { GroveEvent, GroveEventLog } from './types';

// ─────────────────────────────────────────────────────────────────
// BASE SCHEMA
// ─────────────────────────────────────────────────────────────────

export const GroveEventBaseSchema = z.object({
  fieldId: z.string().min(1),
  timestamp: z.number().int().positive(),
  type: z.string().min(1),
  sessionId: z.string().min(1),
});

// ─────────────────────────────────────────────────────────────────
// SESSION EVENT SCHEMAS
// ─────────────────────────────────────────────────────────────────

export const SessionStartedEventSchema = GroveEventBaseSchema.extend({
  type: z.literal('SESSION_STARTED'),
  isReturning: z.boolean(),
  previousSessionId: z.string().optional(),
});

export const SessionResumedEventSchema = GroveEventBaseSchema.extend({
  type: z.literal('SESSION_RESUMED'),
  previousSessionId: z.string(),
  minutesSinceLastActivity: z.number().nonnegative(),
});

// ─────────────────────────────────────────────────────────────────
// LENS EVENT SCHEMAS
// ─────────────────────────────────────────────────────────────────

export const LensActivatedEventSchema = GroveEventBaseSchema.extend({
  type: z.literal('LENS_ACTIVATED'),
  lensId: z.string().min(1),
  source: z.enum(['url', 'selection', 'system', 'localStorage']),
  isCustom: z.boolean(),
});

// ─────────────────────────────────────────────────────────────────
// EXPLORATION EVENT SCHEMAS
// ─────────────────────────────────────────────────────────────────

export const QuerySubmittedEventSchema = GroveEventBaseSchema.extend({
  type: z.literal('QUERY_SUBMITTED'),
  queryId: z.string().min(1),
  content: z.string(),
  intent: z.enum(['deep_dive', 'pivot', 'apply', 'challenge']).optional(),
  sourceResponseId: z.string().optional(),
});

export const ResponseCompletedEventSchema = GroveEventBaseSchema.extend({
  type: z.literal('RESPONSE_COMPLETED'),
  responseId: z.string().min(1),
  queryId: z.string().min(1),
  hubId: z.string().optional(),
  hasNavigation: z.boolean(),
  spanCount: z.number().int().nonnegative(),
});

export const ForkSelectedEventSchema = GroveEventBaseSchema.extend({
  type: z.literal('FORK_SELECTED'),
  forkId: z.string().min(1),
  forkType: z.enum(['deep_dive', 'pivot', 'apply', 'challenge']),
  label: z.string(),
  responseId: z.string().min(1),
});

export const PivotTriggeredEventSchema = GroveEventBaseSchema.extend({
  type: z.literal('PIVOT_TRIGGERED'),
  conceptId: z.string().min(1),
  sourceText: z.string(),
  responseId: z.string().min(1),
});

export const HubEnteredEventSchema = GroveEventBaseSchema.extend({
  type: z.literal('HUB_ENTERED'),
  hubId: z.string().min(1),
  source: z.enum(['query', 'navigation', 'pivot', 'journey']),
});

// ─────────────────────────────────────────────────────────────────
// JOURNEY EVENT SCHEMAS
// ─────────────────────────────────────────────────────────────────

export const JourneyStartedEventSchema = GroveEventBaseSchema.extend({
  type: z.literal('JOURNEY_STARTED'),
  journeyId: z.string().min(1),
  lensId: z.string().min(1),
  waypointCount: z.number().int().positive(),
});

export const JourneyAdvancedEventSchema = GroveEventBaseSchema.extend({
  type: z.literal('JOURNEY_ADVANCED'),
  journeyId: z.string().min(1),
  waypointId: z.string().min(1),
  position: z.number().int().nonnegative(),
});

export const JourneyCompletedEventSchema = GroveEventBaseSchema.extend({
  type: z.literal('JOURNEY_COMPLETED'),
  journeyId: z.string().min(1),
  durationMs: z.number().int().nonnegative().optional(),
  waypointsVisited: z.number().int().nonnegative().optional(),
});

// ─────────────────────────────────────────────────────────────────
// CAPTURE EVENT SCHEMAS
// ─────────────────────────────────────────────────────────────────

export const InsightCapturedEventSchema = GroveEventBaseSchema.extend({
  type: z.literal('INSIGHT_CAPTURED'),
  sproutId: z.string().min(1),
  journeyId: z.string().optional(),
  hubId: z.string().optional(),
});

export const TopicExploredEventSchema = GroveEventBaseSchema.extend({
  type: z.literal('TOPIC_EXPLORED'),
  topicId: z.string().min(1),
  hubId: z.string().min(1),
  queryTrigger: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────
// MOMENT EVENT SCHEMAS
// ─────────────────────────────────────────────────────────────────

export const MomentSurfacedEventSchema = GroveEventBaseSchema.extend({
  type: z.literal('MOMENT_SURFACED'),
  momentId: z.string().min(1),
  surface: z.string().min(1),
  priority: z.number().int().nonnegative(),
});

export const MomentResolvedEventSchema = GroveEventBaseSchema.extend({
  type: z.literal('MOMENT_RESOLVED'),
  momentId: z.string().min(1),
  resolution: z.enum(['actioned', 'dismissed']),
  actionId: z.string().optional(),
  actionType: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────
// DISCRIMINATED UNION
// ─────────────────────────────────────────────────────────────────

export const GroveEventSchema = z.discriminatedUnion('type', [
  SessionStartedEventSchema,
  SessionResumedEventSchema,
  LensActivatedEventSchema,
  QuerySubmittedEventSchema,
  ResponseCompletedEventSchema,
  ForkSelectedEventSchema,
  PivotTriggeredEventSchema,
  HubEnteredEventSchema,
  JourneyStartedEventSchema,
  JourneyAdvancedEventSchema,
  JourneyCompletedEventSchema,
  InsightCapturedEventSchema,
  TopicExploredEventSchema,
  MomentSurfacedEventSchema,
  MomentResolvedEventSchema,
]);

// ─────────────────────────────────────────────────────────────────
// EVENT LOG SCHEMA
// ─────────────────────────────────────────────────────────────────

export const GroveEventLogSchema = z.object({
  version: z.literal(3),
  fieldId: z.string().min(1),
  currentSessionId: z.string().min(1),
  sessionEvents: z.array(GroveEventSchema),
  cumulativeEvents: z.object({
    journeyCompletions: z.array(JourneyCompletedEventSchema),
    topicExplorations: z.array(TopicExploredEventSchema),
    insightCaptures: z.array(InsightCapturedEventSchema),
  }),
  sessionCount: z.number().int().positive(),
  lastSessionAt: z.number().int().positive(),
});

// ─────────────────────────────────────────────────────────────────
// VALIDATION FUNCTIONS
// ─────────────────────────────────────────────────────────────────

export function validateEvent(data: unknown): GroveEvent {
  return GroveEventSchema.parse(data);
}

export function validateEventLog(data: unknown): GroveEventLog {
  return GroveEventLogSchema.parse(data);
}

export function safeValidateEvent(data: unknown): { success: true; data: GroveEvent } | { success: false; error: z.ZodError } {
  const result = GroveEventSchema.safeParse(data);
  return result.success 
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
}
```

### Verification
```bash
npx tsc --noEmit
```

---

## Continue Implementation

After completing Epics 1-2, continue with:

1. **Epic 3:** Create projection files in `src/core/events/projections/`
2. **Epic 4:** Create `store.ts`, `migration.ts`, `compat.ts`
3. **Epic 5:** Create `index.ts` and test files

Refer to:
- `SPRINTS.md` for detailed story breakdown
- `MIGRATION_MAP.md` for file creation order
- `ARCHITECTURE.md` for data flow details

---

## Final Verification

After all epics complete:

```bash
# TypeScript compilation
npx tsc --noEmit

# All tests pass
npm test

# Coverage verification (target: 90%+)
npx vitest run --coverage src/core/events/

# E2E still works (no behavior changes)
npx playwright test

# Build succeeds
npm run build
```

---

## Troubleshooting

### Import Errors
- Ensure `src/core/events/index.ts` exports all types
- Check for circular dependencies

### Type Errors
- Cumulative events use `Omit<GroveEventBase, keyof MetricAttribution>` to avoid property conflicts
- Use `as const` for literal types in union

### Test Failures
- Run specific test file: `npx vitest run src/core/events/__tests__/schema.test.ts`
- Check Zod error messages for validation issues

---

## DEVLOG Template

Record progress in `docs/sprints/bedrock-event-architecture-v1/DEVLOG.md`:

```markdown
# Bedrock Event Architecture v1 — Development Log

## Day 1 - [Date]

### Epic 1: Core Event Types
- [ ] Story 1.1: GroveEventBase created
- [ ] Story 1.2: Session events defined
- [ ] Story 1.3: Exploration events defined
...

### Blockers
- [Any issues encountered]

### Notes
- [Decisions made during implementation]
```

---

*Generated by Foundation Loop Phase 7*
