// src/core/engagement/types.ts
// Sprint: journey-system-v2 - Aligned with schema types (waypoints)
// Sprint: kinetic-stream-schema-v1 - Added stream context

// Re-export journey types from schema for consistency
// The schema types are the canonical source of truth
export type { Journey, JourneyWaypoint } from '../schema/journey';

import type { StreamItem, RhetoricalSpan, JourneyFork } from '../schema/stream';
import type {
  JourneyCompletion,
  TopicExploration,
  SproutCapture,
} from '../schema/telemetry';

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

  // Moment orchestration state (Sprint: engagement-orchestrator-v1)
  flags: Record<string, boolean>;
  momentCooldowns: Record<string, number>;  // momentId -> lastShownTimestamp

  // Hub tracking for entropy (Sprint: entropy-calculation-v1)
  hubsVisited: string[];
  lastHubId: string | null;
  consecutiveHubRepeats: number;
  pivotCount: number;

  // Session tracking (Sprint: xstate-telemetry-v1)
  sessionStartedAt: number;
  sessionCount: number;

  // Cumulative metrics with provenance (Sprint: dex-telemetry-compliance-v1)
  journeyCompletions: JourneyCompletion[];
  topicExplorations: TopicExploration[];
  sproutCaptures: SproutCapture[];

  // Detection (Sprint: xstate-telemetry-v1)
  hasCustomLens: boolean;
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
  // Moment orchestration (Sprint: engagement-orchestrator-v1)
  flags: {},
  momentCooldowns: {},
  // Hub tracking for entropy (Sprint: entropy-calculation-v1)
  hubsVisited: [],
  lastHubId: null,
  consecutiveHubRepeats: 0,
  pivotCount: 0,
  // Session tracking (Sprint: xstate-telemetry-v1)
  sessionStartedAt: Date.now(),
  sessionCount: 1,
  // Cumulative metrics with provenance (Sprint: dex-telemetry-compliance-v1)
  journeyCompletions: [],
  topicExplorations: [],
  sproutCaptures: [],
  // Detection (Sprint: xstate-telemetry-v1)
  hasCustomLens: false,
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
  | { type: 'FINALIZE_RESPONSE' }
  // Kinetic stream events (Sprint: kinetic-stream-reset-v2)
  | { type: 'USER.CLICK_PIVOT'; span: RhetoricalSpan; responseId: string }
  | { type: 'USER.SELECT_FORK'; fork: JourneyFork; responseId: string }
  // Moment orchestration events (Sprint: engagement-orchestrator-v1)
  | { type: 'SET_FLAG'; key: string; value: boolean }
  | { type: 'SET_COOLDOWN'; momentId: string; timestamp: number }
  | { type: 'CLEAR_FLAGS' }
  | { type: 'CLEAR_COOLDOWNS' }
  // Hub tracking events (Sprint: entropy-calculation-v1)
  | { type: 'HUB_VISITED'; hubId: string }
  | { type: 'PIVOT_CLICKED' }
  | { type: 'RESET_HUB_TRACKING' }
  // Session events (Sprint: xstate-telemetry-v1)
  | { type: 'SESSION_STARTED' }
  // Cumulative metric events (Sprint: dex-telemetry-compliance-v1)
  | { type: 'JOURNEY_COMPLETED_TRACKED'; journeyId: string; durationMs?: number }
  | { type: 'SPROUT_CAPTURED'; sproutId: string; journeyId?: string; hubId?: string }
  | { type: 'TOPIC_EXPLORED'; topicId: string; hubId: string }
  // Telemetry events (Sprint: xstate-telemetry-v1)
  | { type: 'MOMENT_SHOWN'; momentId: string; surface: string }
  | { type: 'MOMENT_ACTIONED'; momentId: string; actionId: string; actionType: string }
  | { type: 'MOMENT_DISMISSED'; momentId: string };
