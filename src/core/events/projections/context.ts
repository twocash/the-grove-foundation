// src/core/events/projections/context.ts
// Sprint: bedrock-event-architecture-v1

import type { GroveEvent, GroveEventLog } from '../types';
import type { ContextState, EngagementStage, JourneyState } from './types';
import { INITIAL_CONTEXT_STATE, INITIAL_JOURNEY_STATE } from './types';
import { projectSession } from './session';

/**
 * Project full context state from event log.
 * Combines session, journey, and computed metrics.
 *
 * @param log - Event log to project
 * @param now - Current timestamp for time-based calculations
 * @returns Full context state
 */
export function projectContext(log: GroveEventLog, now: number = Date.now()): ContextState {
  const session = projectSession(log.sessionEvents, now);
  const journey = projectJourney(log.sessionEvents);
  const exchangeCount = countExchanges(log.sessionEvents);
  const hubsVisited = extractHubsVisited(log.sessionEvents);
  const pivotCount = countPivots(log.sessionEvents);
  const { consecutiveHubRepeats, lastHubId } = computeHubRepetition(log.sessionEvents);

  const stage = computeStage(exchangeCount, session.minutesActive);
  const entropy = computeEntropy({
    hubsVisited,
    exchangeCount,
    pivotCount,
    consecutiveHubRepeats,
  });

  return {
    session,
    journey,
    stage,
    entropy,
    exchangeCount,
    hubsVisited,
    pivotCount,
    consecutiveHubRepeats,
    lastHubId,
  };
}

/**
 * Compute engagement stage from metrics.
 * Stage progression: ARRIVAL -> ORIENTED -> EXPLORING -> ENGAGED
 */
export function computeStage(exchangeCount: number, minutesActive: number): EngagementStage {
  if (exchangeCount === 0) return 'ARRIVAL';
  if (exchangeCount < 3 && minutesActive < 2) return 'ORIENTED';
  if (exchangeCount < 6) return 'EXPLORING';
  return 'ENGAGED';
}

/**
 * Compute entropy score from exploration patterns.
 * Higher entropy = more diverse exploration.
 *
 * @returns Entropy score between 0 and 1
 */
export function computeEntropy(inputs: {
  hubsVisited: string[];
  exchangeCount: number;
  pivotCount: number;
  consecutiveHubRepeats: number;
}): number {
  const { hubsVisited, exchangeCount, pivotCount, consecutiveHubRepeats } = inputs;

  if (exchangeCount === 0) return 0;

  // Base entropy from unique hubs (max 0.4)
  const uniqueHubs = new Set(hubsVisited).size;
  const hubDiversity = Math.min(uniqueHubs / 5, 1) * 0.4;

  // Pivot bonus (max 0.3)
  const pivotRatio = exchangeCount > 0 ? pivotCount / exchangeCount : 0;
  const pivotBonus = Math.min(pivotRatio, 1) * 0.3;

  // Repetition penalty (max -0.2)
  const repetitionPenalty = Math.min(consecutiveHubRepeats / 3, 1) * 0.2;

  // Base exploration score (max 0.3)
  const explorationBase = Math.min(exchangeCount / 10, 1) * 0.3;

  return Math.max(0, Math.min(1, hubDiversity + pivotBonus + explorationBase - repetitionPenalty));
}

/**
 * Project journey state from session events.
 */
function projectJourney(events: GroveEvent[]): JourneyState {
  let state = { ...INITIAL_JOURNEY_STATE };
  const hubsVisited: string[] = [];

  for (const event of events) {
    switch (event.type) {
      case 'JOURNEY_STARTED':
        state = {
          journey: null, // Would need full journey object - simplified for now
          position: 0,
          waypointCount: event.waypointCount,
          isComplete: false,
          hubsVisited: [],
        };
        break;

      case 'JOURNEY_ADVANCED':
        state = {
          ...state,
          position: event.position,
        };
        break;

      case 'JOURNEY_COMPLETED':
        state = {
          ...state,
          isComplete: true,
        };
        break;

      case 'HUB_ENTERED':
        if (event.source === 'journey') {
          hubsVisited.push(event.hubId);
        }
        break;
    }
  }

  return {
    ...state,
    hubsVisited,
  };
}

/**
 * Count query-response exchanges from events.
 */
function countExchanges(events: GroveEvent[]): number {
  return events.filter(e => e.type === 'RESPONSE_COMPLETED').length;
}

/**
 * Extract unique hubs visited from events.
 */
function extractHubsVisited(events: GroveEvent[]): string[] {
  const hubs: string[] = [];
  for (const event of events) {
    if (event.type === 'HUB_ENTERED') {
      hubs.push(event.hubId);
    }
  }
  return [...new Set(hubs)];
}

/**
 * Count pivot events.
 */
function countPivots(events: GroveEvent[]): number {
  return events.filter(e => e.type === 'PIVOT_TRIGGERED').length;
}

/**
 * Compute consecutive hub repetitions and last hub.
 */
function computeHubRepetition(events: GroveEvent[]): {
  consecutiveHubRepeats: number;
  lastHubId: string | null;
} {
  let lastHubId: string | null = null;
  let consecutiveHubRepeats = 0;

  for (const event of events) {
    if (event.type === 'HUB_ENTERED') {
      if (event.hubId === lastHubId) {
        consecutiveHubRepeats++;
      } else {
        consecutiveHubRepeats = 0;
      }
      lastHubId = event.hubId;
    }
  }

  return { consecutiveHubRepeats, lastHubId };
}
