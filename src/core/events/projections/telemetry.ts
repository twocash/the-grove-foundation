// src/core/events/projections/telemetry.ts
// Sprint: bedrock-event-architecture-v1

import type {
  GroveEventLog,
  JourneyCompletedEvent,
  TopicExploredEvent,
  InsightCapturedEvent,
} from '../types';
import type {
  CumulativeMetricsV2,
  ComputedMetrics,
  JourneyCompletion,
  TopicExploration,
  SproutCapture,
} from '../../schema/telemetry';
import { computeMetrics } from '../../schema/telemetry';

/**
 * Project event log to CumulativeMetricsV2 format.
 * Provides backward compatibility with existing telemetry consumers.
 *
 * @param log - Event log to project
 * @returns CumulativeMetricsV2 compatible structure
 */
export function projectToCumulativeMetricsV2(log: GroveEventLog): CumulativeMetricsV2 {
  return {
    version: 2,
    fieldId: log.fieldId,
    journeyCompletions: log.cumulativeEvents.journeyCompletions.map(
      journeyEventToCompletion
    ),
    topicExplorations: log.cumulativeEvents.topicExplorations.map(
      topicEventToExploration
    ),
    sproutCaptures: log.cumulativeEvents.insightCaptures.map(
      insightEventToCapture
    ),
    sessionCount: log.sessionCount,
    lastSessionAt: log.lastSessionAt,
  };
}

/**
 * Project event log to computed metrics.
 * Uses existing computeMetrics function for consistency.
 *
 * @param log - Event log to project
 * @returns ComputedMetrics with counts and unique topics
 */
export function projectComputedMetrics(log: GroveEventLog): ComputedMetrics {
  const v2 = projectToCumulativeMetricsV2(log);
  return computeMetrics(v2);
}

/**
 * Convert JourneyCompletedEvent to JourneyCompletion.
 * Strips event-specific fields.
 */
function journeyEventToCompletion(event: JourneyCompletedEvent): JourneyCompletion {
  return {
    fieldId: event.fieldId,
    timestamp: event.timestamp,
    journeyId: event.journeyId,
    durationMs: event.durationMs,
    waypointsVisited: event.waypointsVisited,
  };
}

/**
 * Convert TopicExploredEvent to TopicExploration.
 * Strips event-specific fields.
 */
function topicEventToExploration(event: TopicExploredEvent): TopicExploration {
  return {
    fieldId: event.fieldId,
    timestamp: event.timestamp,
    topicId: event.topicId,
    hubId: event.hubId,
    queryTrigger: event.queryTrigger,
  };
}

/**
 * Convert InsightCapturedEvent to SproutCapture.
 * Strips event-specific fields.
 */
function insightEventToCapture(event: InsightCapturedEvent): SproutCapture {
  return {
    fieldId: event.fieldId,
    timestamp: event.timestamp,
    sproutId: event.sproutId,
    journeyId: event.journeyId,
    hubId: event.hubId,
  };
}

/**
 * Get journey completion count from event log.
 */
export function getJourneyCompletionCount(log: GroveEventLog): number {
  return log.cumulativeEvents.journeyCompletions.length;
}

/**
 * Get unique topics explored from event log.
 */
export function getUniqueTopicsExplored(log: GroveEventLog): string[] {
  return [
    ...new Set(log.cumulativeEvents.topicExplorations.map(e => e.topicId)),
  ];
}

/**
 * Get sprout capture count from event log.
 */
export function getSproutCaptureCount(log: GroveEventLog): number {
  return log.cumulativeEvents.insightCaptures.length;
}
