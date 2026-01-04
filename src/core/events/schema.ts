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
