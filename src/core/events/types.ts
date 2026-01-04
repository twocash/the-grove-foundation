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
