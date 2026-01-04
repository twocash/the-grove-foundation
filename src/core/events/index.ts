// src/core/events/index.ts
// Sprint: bedrock-event-architecture-v1
// Public API for Grove Event Architecture

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export type {
  // Base types
  GroveEventBase,
  GroveEvent,
  GroveEventLog,
  // Session events
  SessionStartedEvent,
  SessionResumedEvent,
  // Lens events
  LensActivatedEvent,
  // Exploration events
  QuerySubmittedEvent,
  ResponseCompletedEvent,
  ForkSelectedEvent,
  PivotTriggeredEvent,
  HubEnteredEvent,
  // Journey events
  JourneyStartedEvent,
  JourneyAdvancedEvent,
  JourneyCompletedEvent,
  // Capture events
  InsightCapturedEvent,
  TopicExploredEvent,
  // Moment events
  MomentSurfacedEvent,
  MomentResolvedEvent,
} from './types';

// Type guards
export {
  isGroveEvent,
  isSessionEvent,
  isCumulativeEvent,
} from './types';

// ─────────────────────────────────────────────────────────────────
// VALIDATION SCHEMAS
// ─────────────────────────────────────────────────────────────────

export {
  // Base schema
  GroveEventBaseSchema,
  // Session schemas
  SessionStartedEventSchema,
  SessionResumedEventSchema,
  // Lens schemas
  LensActivatedEventSchema,
  // Exploration schemas
  QuerySubmittedEventSchema,
  ResponseCompletedEventSchema,
  ForkSelectedEventSchema,
  PivotTriggeredEventSchema,
  HubEnteredEventSchema,
  // Journey schemas
  JourneyStartedEventSchema,
  JourneyAdvancedEventSchema,
  JourneyCompletedEventSchema,
  // Capture schemas
  InsightCapturedEventSchema,
  TopicExploredEventSchema,
  // Moment schemas
  MomentSurfacedEventSchema,
  MomentResolvedEventSchema,
  // Union schema
  GroveEventSchema,
  // Event log schema
  GroveEventLogSchema,
  // Validation functions
  validateEvent,
  validateEventLog,
  safeValidateEvent,
} from './schema';

// ─────────────────────────────────────────────────────────────────
// PROJECTIONS
// ─────────────────────────────────────────────────────────────────

export {
  // Types
  type SessionState,
  type JourneyState,
  type ContextState,
  type EngagementStage,
  type MomentEvaluationContext,
  type StreamHistoryState,
  // Initial states
  INITIAL_SESSION_STATE,
  INITIAL_JOURNEY_STATE,
  INITIAL_CONTEXT_STATE,
  INITIAL_MOMENT_CONTEXT,
  INITIAL_STREAM_STATE,
  // Session projection
  projectSession,
  extractSessionId,
  hasActiveLens,
  getInteractionCount,
  // Telemetry projection
  projectToCumulativeMetricsV2,
  projectComputedMetrics,
  getJourneyCompletionCount,
  getUniqueTopicsExplored,
  getSproutCaptureCount,
  // Context projection
  projectContext,
  computeStage,
  computeEntropy,
  // Moment projection
  projectMomentContext,
  deriveFlags,
  deriveCooldowns,
  deriveActiveMoments,
  getMomentsShown,
  // Stream projection
  projectStream,
  getLastStreamItems,
  getQueryResponsePairs,
  hasActiveQuery,
} from './projections';

// ─────────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────────

export {
  // Constants
  DEFAULT_FIELD_ID,
  STORAGE_KEY,
  // Session ID
  generateSessionId,
  // Event log factory
  createEventLog,
  // Event operations
  appendEvent,
  clearSessionEvents,
  startNewSession,
  createEventBase,
  // Query helpers
  getEventsByType,
  getLastEventOfType,
  getSessionEventCount,
  getCumulativeEventCount,
} from './store';

// ─────────────────────────────────────────────────────────────────
// MIGRATION
// ─────────────────────────────────────────────────────────────────

export {
  // Constants
  MIGRATED_SESSION_ID,
  LEGACY_METRICS_KEY,
  LEGACY_ENGAGEMENT_KEY,
  // Type guards
  isCumulativeMetricsV2,
  isGroveEventLogV3,
  // Migration
  migrateFromCumulativeMetricsV2,
  loadOrMigrateEventLog,
  saveEventLog,
  verifyMigration,
} from './migration';

// ─────────────────────────────────────────────────────────────────
// COMPATIBILITY
// ─────────────────────────────────────────────────────────────────

export {
  // Detection
  isLegacySystemActive,
  // Sync
  syncToLegacyFormat,
  getLegacyMetrics,
  // Bridge
  type LegacyEngagementBridge,
  createLegacyBridge,
  // Dual-write
  dualWrite,
  needsDualWrite,
} from './compat';

// ─────────────────────────────────────────────────────────────────
// REACT HOOKS (Sprint 2)
// ─────────────────────────────────────────────────────────────────

export {
  // Provider
  GroveEventProvider,
  GroveEventContext,
  type GroveEventContextValue,
  type GroveEventProviderProps,
  // Core hooks
  useGroveEvents,
  useDispatch,
  useStartNewSession,
  useEventHelpers,
  // Projection hooks
  useSession,
  useContextState,
  useTelemetry,
  useMomentContext,
  useStream,
  // Hook types
  type TelemetryResult,
} from './hooks';
