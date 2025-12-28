/**
 * Journey Provenance
 *
 * Satisfies Trellis Pillar III: Provenance as Infrastructure
 * "A fact without an origin is a bug."
 *
 * Every journey-initiated interaction carries attribution back to
 * the specific journey, waypoint, and action that triggered it.
 */

import type { Journey, JourneyWaypoint, WaypointAction } from './journey';

export interface JourneyProvenance {
  journey: {
    id: string;
    title: string;
  };
  waypoint: {
    id: string;
    title: string;
    index: number;
  };
  action: {
    type: string;
    label: string;
    timestamp: string;
  };
}

/**
 * Create a provenance object for a journey action.
 * Use this when handling waypoint actions to maintain attribution chain.
 */
export function createJourneyProvenance(
  journey: Journey,
  waypoint: JourneyWaypoint,
  waypointIndex: number,
  action: WaypointAction
): JourneyProvenance {
  return {
    journey: {
      id: journey.id,
      title: journey.title,
    },
    waypoint: {
      id: waypoint.id,
      title: waypoint.title,
      index: waypointIndex,
    },
    action: {
      type: action.type,
      label: action.label,
      timestamp: new Date().toISOString(),
    },
  };
}
