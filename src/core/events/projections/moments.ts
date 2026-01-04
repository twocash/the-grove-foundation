// src/core/events/projections/moments.ts
// Sprint: bedrock-event-architecture-v1

import type { GroveEvent, GroveEventLog } from '../types';
import type { MomentEvaluationContext } from './types';
import { INITIAL_MOMENT_CONTEXT } from './types';
import { projectSession } from './session';
import { computeStage, computeEntropy } from './context';

/**
 * Project moment evaluation context from event log.
 * Output is compatible with existing moment-evaluator.
 *
 * @param log - Event log to project
 * @param now - Current timestamp for time-based calculations
 * @returns MomentEvaluationContext for moment evaluation
 */
export function projectMomentContext(
  log: GroveEventLog,
  now: number = Date.now()
): MomentEvaluationContext {
  const session = projectSession(log.sessionEvents, now);
  const exchangeCount = countExchanges(log.sessionEvents);

  // Derive flags from events
  const flags = deriveFlags(log.sessionEvents);

  // Derive cooldowns from moment events
  const cooldowns = deriveCooldowns(log.sessionEvents);

  // Compute metrics
  const hubsVisited = extractHubsVisited(log.sessionEvents);
  const pivotCount = countPivots(log.sessionEvents);
  const consecutiveHubRepeats = countConsecutiveHubRepeats(log.sessionEvents);

  const stage = computeStage(exchangeCount, session.minutesActive);
  const entropy = computeEntropy({
    hubsVisited,
    exchangeCount,
    pivotCount,
    consecutiveHubRepeats,
  });

  // Cumulative metrics
  const journeysCompleted = log.cumulativeEvents.journeyCompletions.length;
  const topicsExplored = [
    ...new Set(log.cumulativeEvents.topicExplorations.map(e => e.topicId)),
  ];
  const sproutsCaptured = log.cumulativeEvents.insightCaptures.length;

  // Active journey ID
  const journeyId = extractActiveJourneyId(log.sessionEvents);

  return {
    stage,
    exchangeCount,
    minutesActive: session.minutesActive,
    entropy,
    flags,
    cooldowns,
    journeysCompleted,
    topicsExplored,
    sproutsCaptured,
    hasCustomLens: session.isCustomLens,
    journeyId,
    lensId: session.lensId,
  };
}

/**
 * Derive flag state from events.
 * Flags are set by moment actions and other system events.
 */
export function deriveFlags(events: GroveEvent[]): Record<string, boolean> {
  const flags: Record<string, boolean> = {};

  for (const event of events) {
    switch (event.type) {
      case 'MOMENT_RESOLVED':
        // Set flag for dismissed moments
        if (event.resolution === 'dismissed') {
          flags[`${event.momentId}Dismissed`] = true;
        }
        // Set flag for actioned moments
        if (event.resolution === 'actioned') {
          flags[`${event.momentId}Actioned`] = true;
        }
        break;

      case 'LENS_ACTIVATED':
        if (event.isCustom) {
          flags['customLensCreated'] = true;
        }
        break;

      case 'JOURNEY_STARTED':
        flags['journeyStarted'] = true;
        break;

      case 'JOURNEY_COMPLETED':
        flags['journeyCompleted'] = true;
        break;

      case 'INSIGHT_CAPTURED':
        flags['hasCapturedSprout'] = true;
        break;
    }
  }

  return flags;
}

/**
 * Derive moment cooldowns from events.
 * Returns momentId -> lastShownTimestamp mapping.
 */
export function deriveCooldowns(events: GroveEvent[]): Record<string, number> {
  const cooldowns: Record<string, number> = {};

  for (const event of events) {
    if (event.type === 'MOMENT_SURFACED') {
      cooldowns[event.momentId] = event.timestamp;
    }
  }

  return cooldowns;
}

/**
 * Extract currently surfaced moments (not yet resolved).
 */
export function deriveActiveMoments(events: GroveEvent[]): string[] {
  const surfaced = new Set<string>();
  const resolved = new Set<string>();

  for (const event of events) {
    if (event.type === 'MOMENT_SURFACED') {
      surfaced.add(event.momentId);
    }
    if (event.type === 'MOMENT_RESOLVED') {
      resolved.add(event.momentId);
    }
  }

  // Active = surfaced but not resolved
  return [...surfaced].filter(id => !resolved.has(id));
}

/**
 * Get moments shown in this session.
 */
export function getMomentsShown(events: GroveEvent[]): string[] {
  return events
    .filter(e => e.type === 'MOMENT_SURFACED')
    .map(e => (e as { momentId: string }).momentId);
}

// ─────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────

function countExchanges(events: GroveEvent[]): number {
  return events.filter(e => e.type === 'RESPONSE_COMPLETED').length;
}

function extractHubsVisited(events: GroveEvent[]): string[] {
  const hubs: string[] = [];
  for (const event of events) {
    if (event.type === 'HUB_ENTERED') {
      hubs.push(event.hubId);
    }
  }
  return hubs;
}

function countPivots(events: GroveEvent[]): number {
  return events.filter(e => e.type === 'PIVOT_TRIGGERED').length;
}

function countConsecutiveHubRepeats(events: GroveEvent[]): number {
  let lastHubId: string | null = null;
  let consecutiveRepeats = 0;

  for (const event of events) {
    if (event.type === 'HUB_ENTERED') {
      if (event.hubId === lastHubId) {
        consecutiveRepeats++;
      } else {
        consecutiveRepeats = 0;
      }
      lastHubId = event.hubId;
    }
  }

  return consecutiveRepeats;
}

function extractActiveJourneyId(events: GroveEvent[]): string | null {
  let journeyId: string | null = null;
  let isComplete = false;

  for (const event of events) {
    if (event.type === 'JOURNEY_STARTED') {
      journeyId = event.journeyId;
      isComplete = false;
    }
    if (event.type === 'JOURNEY_COMPLETED') {
      isComplete = true;
    }
  }

  return isComplete ? null : journeyId;
}
