// src/core/engagement/types.ts
// Sprint: journey-system-v2 - Aligned with schema types (waypoints)
// Sprint: kinetic-stream-schema-v1 - Added stream context

// Re-export journey types from schema for consistency
// The schema types are the canonical source of truth
export type { Journey, JourneyWaypoint } from '../schema/journey';

import type { StreamItem } from '../schema/stream';

export interface EngagementContext {
  // Lens state
  lens: string | null;
  lensSource: 'url' | 'localStorage' | 'selection' | null;

  // Journey state - uses schema Journey type with waypoints
  journey: import('../schema/journey').Journey | null;
  journeyProgress: number;
  journeyTotal: number;

  // Entropy state
  entropy: number;
  entropyThreshold: number;

  // Stream state (Sprint: kinetic-stream-schema-v1)
  currentStreamItem: StreamItem | null;
  streamHistory: StreamItem[];
}

export const initialContext: EngagementContext = {
  lens: null,
  lensSource: null,
  journey: null,
  journeyProgress: 0,
  journeyTotal: 0,
  entropy: 0,
  entropyThreshold: 0.7,
  currentStreamItem: null,
  streamHistory: [],
};

export type EngagementEvent =
  | { type: 'SELECT_LENS'; lens: string; source: 'url' | 'localStorage' | 'selection' }
  | { type: 'CHANGE_LENS'; lens: string }
  | { type: 'START_JOURNEY'; journey: import('../schema/journey').Journey }
  | { type: 'ADVANCE_STEP' }
  | { type: 'COMPLETE_JOURNEY' }
  | { type: 'EXIT_JOURNEY' }
  | { type: 'OPEN_TERMINAL' }
  | { type: 'CLOSE_TERMINAL' }
  | { type: 'UPDATE_ENTROPY'; value: number }
  // Stream events (Sprint: kinetic-stream-schema-v1)
  | { type: 'START_QUERY'; prompt: string }
  | { type: 'START_RESPONSE' }
  | { type: 'STREAM_CHUNK'; chunk: string }
  | { type: 'FINALIZE_RESPONSE' };
