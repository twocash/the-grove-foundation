// src/core/events/projections/index.ts
// Sprint: bedrock-event-architecture-v1

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export type {
  SessionState,
  JourneyState,
  ContextState,
  EngagementStage,
  MomentEvaluationContext,
  StreamHistoryState,
} from './types';

export {
  INITIAL_SESSION_STATE,
  INITIAL_JOURNEY_STATE,
  INITIAL_CONTEXT_STATE,
  INITIAL_MOMENT_CONTEXT,
  INITIAL_STREAM_STATE,
} from './types';

// ─────────────────────────────────────────────────────────────────
// SESSION PROJECTION
// ─────────────────────────────────────────────────────────────────

export {
  projectSession,
  extractSessionId,
  hasActiveLens,
  getInteractionCount,
} from './session';

// ─────────────────────────────────────────────────────────────────
// TELEMETRY PROJECTION
// ─────────────────────────────────────────────────────────────────

export {
  projectToCumulativeMetricsV2,
  projectComputedMetrics,
  getJourneyCompletionCount,
  getUniqueTopicsExplored,
  getSproutCaptureCount,
} from './telemetry';

// ─────────────────────────────────────────────────────────────────
// CONTEXT PROJECTION
// ─────────────────────────────────────────────────────────────────

export {
  projectContext,
  computeStage,
  computeEntropy,
} from './context';

// ─────────────────────────────────────────────────────────────────
// MOMENT PROJECTION
// ─────────────────────────────────────────────────────────────────

export {
  projectMomentContext,
  deriveFlags,
  deriveCooldowns,
  deriveActiveMoments,
  getMomentsShown,
} from './moments';

// ─────────────────────────────────────────────────────────────────
// STREAM PROJECTION
// ─────────────────────────────────────────────────────────────────

export {
  projectStream,
  getLastStreamItems,
  getQueryResponsePairs,
  hasActiveQuery,
} from './stream';
