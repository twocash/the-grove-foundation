// src/core/events/projections/types.ts
// Sprint: bedrock-event-architecture-v1

import type { Journey } from '../../schema/journey';
import type { StreamItem } from '../../schema/stream';

// ─────────────────────────────────────────────────────────────────
// SESSION STATE
// ─────────────────────────────────────────────────────────────────

/**
 * Derived session state from event log.
 */
export interface SessionState {
  /** Current session identifier */
  sessionId: string;
  /** Session start timestamp */
  startedAt: number;
  /** Whether this is a returning user */
  isReturning: boolean;
  /** Active lens identifier */
  lensId: string | null;
  /** How the lens was activated */
  lensSource: 'url' | 'selection' | 'system' | 'localStorage' | null;
  /** Whether the lens is custom */
  isCustomLens: boolean;
  /** Total interactions (queries) in this session */
  interactionCount: number;
  /** Minutes since session started */
  minutesActive: number;
}

export const INITIAL_SESSION_STATE: SessionState = {
  sessionId: '',
  startedAt: 0,
  isReturning: false,
  lensId: null,
  lensSource: null,
  isCustomLens: false,
  interactionCount: 0,
  minutesActive: 0,
};

// ─────────────────────────────────────────────────────────────────
// JOURNEY STATE
// ─────────────────────────────────────────────────────────────────

/**
 * Derived journey state from event log.
 */
export interface JourneyState {
  /** Active journey or null */
  journey: Journey | null;
  /** Current position in journey */
  position: number;
  /** Total waypoints in journey */
  waypointCount: number;
  /** Whether journey is complete */
  isComplete: boolean;
  /** Hubs visited during journey */
  hubsVisited: string[];
}

export const INITIAL_JOURNEY_STATE: JourneyState = {
  journey: null,
  position: 0,
  waypointCount: 0,
  isComplete: false,
  hubsVisited: [],
};

// ─────────────────────────────────────────────────────────────────
// CONTEXT STATE (Full Derived State)
// ─────────────────────────────────────────────────────────────────

/**
 * Engagement stage derived from interaction metrics.
 */
export type EngagementStage = 'ARRIVAL' | 'ORIENTED' | 'EXPLORING' | 'ENGAGED';

/**
 * Full context state derived from event log.
 * Combines session, journey, and computed metrics.
 */
export interface ContextState {
  /** Session state */
  session: SessionState;
  /** Journey state */
  journey: JourneyState;
  /** Engagement stage */
  stage: EngagementStage;
  /** Entropy score (0-1) */
  entropy: number;
  /** Exchange count (query-response pairs) */
  exchangeCount: number;
  /** Unique hubs visited */
  hubsVisited: string[];
  /** Pivot count */
  pivotCount: number;
  /** Consecutive hub repeats */
  consecutiveHubRepeats: number;
  /** Last hub ID */
  lastHubId: string | null;
}

export const INITIAL_CONTEXT_STATE: ContextState = {
  session: INITIAL_SESSION_STATE,
  journey: INITIAL_JOURNEY_STATE,
  stage: 'ARRIVAL',
  entropy: 0,
  exchangeCount: 0,
  hubsVisited: [],
  pivotCount: 0,
  consecutiveHubRepeats: 0,
  lastHubId: null,
};

// ─────────────────────────────────────────────────────────────────
// MOMENT EVALUATION CONTEXT
// ─────────────────────────────────────────────────────────────────

/**
 * Context passed to moment evaluator.
 * Matches existing moment condition interface.
 */
export interface MomentEvaluationContext {
  /** Current engagement stage */
  stage: EngagementStage;
  /** Query-response exchange count */
  exchangeCount: number;
  /** Minutes since session started */
  minutesActive: number;
  /** Entropy score */
  entropy: number;
  /** Flag state */
  flags: Record<string, boolean>;
  /** Moment cooldowns (momentId -> lastShownTimestamp) */
  cooldowns: Record<string, number>;
  /** Journeys completed count */
  journeysCompleted: number;
  /** Topics explored list */
  topicsExplored: string[];
  /** Sprouts captured count */
  sproutsCaptured: number;
  /** Whether user has custom lens */
  hasCustomLens: boolean;
  /** Active journey ID or null */
  journeyId: string | null;
  /** Active lens ID or null */
  lensId: string | null;
}

export const INITIAL_MOMENT_CONTEXT: MomentEvaluationContext = {
  stage: 'ARRIVAL',
  exchangeCount: 0,
  minutesActive: 0,
  entropy: 0,
  flags: {},
  cooldowns: {},
  journeysCompleted: 0,
  topicsExplored: [],
  sproutsCaptured: 0,
  hasCustomLens: false,
  journeyId: null,
  lensId: null,
};

// ─────────────────────────────────────────────────────────────────
// STREAM HISTORY STATE
// ─────────────────────────────────────────────────────────────────

/**
 * Reconstructed stream history from events.
 */
export interface StreamHistoryState {
  /** All stream items in order */
  items: StreamItem[];
  /** Current streaming item (if any) */
  currentItem: StreamItem | null;
  /** Query-response pairs count */
  exchangeCount: number;
}

export const INITIAL_STREAM_STATE: StreamHistoryState = {
  items: [],
  currentItem: null,
  exchangeCount: 0,
};
