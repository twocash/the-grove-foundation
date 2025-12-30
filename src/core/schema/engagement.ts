// src/core/schema/engagement.ts
// Engagement Bus type definitions - no React dependencies
// Sprint: engagement-consolidation-v1

import { ArchetypeId } from './lens';

// ============================================================================
// SESSION STAGE (consolidated from session-telemetry.ts)
// ============================================================================

/**
 * SessionStage - Computed engagement level
 */
export type SessionStage = 'ARRIVAL' | 'ORIENTED' | 'EXPLORING' | 'ENGAGED';

/**
 * StageThresholds - Configurable progression thresholds
 * Declarative configuration for stage computation (DEX-compliant)
 */
export interface StageThresholds {
  oriented: {
    minExchanges?: number;  // Default: 3
    minVisits?: number;     // Default: 2
  };
  exploring: {
    minExchanges?: number;  // Default: 5
    minTopics?: number;     // Default: 2
  };
  engaged: {
    minSprouts?: number;        // Default: 1
    minVisits?: number;         // Default: 3
    minTotalExchanges?: number; // Default: 15
  };
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export type EngagementEventType =
  | 'EXCHANGE_SENT'
  | 'JOURNEY_COMPLETED'
  | 'JOURNEY_STARTED'
  | 'TOPIC_EXPLORED'
  | 'CARD_VISITED'
  | 'TIME_MILESTONE'
  | 'LENS_SELECTED'
  | 'REVEAL_SHOWN'
  | 'REVEAL_DISMISSED'
  | 'SESSION_STARTED'
  | 'SESSION_RESUMED'
  | 'SPROUT_CAPTURED'
  // Moment telemetry (Sprint: engagement-orchestrator-v1)
  | 'MOMENT_SHOWN'
  | 'MOMENT_ACTIONED'
  | 'MOMENT_DISMISSED'
  // Hub tracking for entropy (Sprint: entropy-calculation-v1)
  | 'HUB_VISITED'
  | 'PIVOT_CLICKED';

export interface EngagementEvent<T extends EngagementEventType = EngagementEventType> {
  type: T;
  payload: EventPayloads[T];
  timestamp: string;
  sessionId: string;
}

export interface EventPayloads {
  EXCHANGE_SENT: { query: string; responseLength: number; cardId?: string };
  JOURNEY_COMPLETED: { lensId: string; durationMinutes: number; cardsVisited: number };
  JOURNEY_STARTED: { lensId: string; threadLength: number };
  TOPIC_EXPLORED: { topicId: string; topicLabel: string };
  CARD_VISITED: { cardId: string; cardLabel: string; fromCard?: string };
  TIME_MILESTONE: { minutes: number };
  LENS_SELECTED: { lensId: string; isCustom: boolean; archetypeId?: ArchetypeId };
  REVEAL_SHOWN: { revealType: RevealType };
  REVEAL_DISMISSED: { revealType: RevealType; action: 'accepted' | 'declined' | 'dismissed' };
  SESSION_STARTED: { isReturningUser: boolean };
  SESSION_RESUMED: { previousSessionId: string; minutesSinceLastActivity: number };
  SPROUT_CAPTURED: { sproutId: string; tags?: string[] };
  // Moment telemetry payloads (Sprint: engagement-orchestrator-v1)
  MOMENT_SHOWN: { momentId: string; surface: string; timestamp: number };
  MOMENT_ACTIONED: { momentId: string; actionId: string; actionType: string; timestamp: number };
  MOMENT_DISMISSED: { momentId: string; timestamp: number };
  // Hub tracking payloads (Sprint: entropy-calculation-v1)
  HUB_VISITED: { hubId: string };
  PIVOT_CLICKED: Record<string, never>;
}

// ============================================================================
// REVEAL TYPES
// ============================================================================

export type RevealType =
  | 'simulation'
  | 'customLensOffer'
  | 'terminatorPrompt'
  | 'founderStory'
  | 'conversionCTA'
  | 'journeyCompletion';

export interface RevealQueueItem {
  type: RevealType;
  priority: number;
  queuedAt: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// ENGAGEMENT STATE
// ============================================================================

export interface EngagementState {
  // Session tracking
  sessionId: string;
  sessionStartedAt: string;
  lastActivityAt: string;

  // Engagement metrics
  exchangeCount: number;
  journeysCompleted: number;
  journeysStarted: number;
  topicsExplored: string[];
  cardsVisited: string[];
  minutesActive: number;

  // Lens state
  activeLensId: string | null;
  hasCustomLens: boolean;
  currentArchetypeId: ArchetypeId | null;

  // Reveal state (what has been shown)
  revealsShown: RevealType[];
  revealsAcknowledged: RevealType[];

  // Feature unlocks
  terminatorModeUnlocked: boolean;
  terminatorModeActive: boolean;

  // Current journey (if active)
  activeJourney: ActiveJourney | null;

  // Stage fields (consolidated from session-telemetry.ts)
  stage: SessionStage;
  totalExchangeCount: number;
  sproutsCaptured: number;
  allTopicsExplored: string[];
  visitCount: number;
}

export interface ActiveJourney {
  lensId: string;
  threadCardIds: string[];
  currentPosition: number;
  startedAt: string;
}

// ============================================================================
// TRIGGER CONFIGURATION (Declarative)
// ============================================================================

export type ComparisonOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'includes' | 'notIncludes';

export interface ConditionValue {
  eq?: number | string | boolean;
  neq?: number | string | boolean;
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
  includes?: string;
  notIncludes?: string;
}

export type StateKey = keyof EngagementState;

export interface SimpleCondition {
  field: StateKey;
  value: ConditionValue;
}

export interface CompoundCondition {
  AND?: TriggerCondition[];
  OR?: TriggerCondition[];
  NOT?: TriggerCondition;
}

export type TriggerCondition = SimpleCondition | CompoundCondition;

export interface TriggerConfig {
  id: string;
  reveal: RevealType;
  priority: number;
  conditions: TriggerCondition;
  blockedBy?: RevealType[];
  requiresAcknowledgment?: RevealType[];
  metadata?: Record<string, unknown>;
  enabled: boolean;
}

// ============================================================================
// BUS INTERFACE
// ============================================================================

export type EngagementEventHandler = (event: EngagementEvent) => void;
export type StateChangeHandler = (state: EngagementState, prevState: EngagementState) => void;
export type RevealQueueHandler = (queue: RevealQueueItem[]) => void;

export interface EngagementBusAPI {
  emit: <T extends EngagementEventType>(type: T, payload: EventPayloads[T]) => void;
  getState: () => EngagementState;
  getRevealQueue: () => RevealQueueItem[];
  acknowledgeReveal: (revealType: RevealType, action: 'accepted' | 'declined' | 'dismissed') => void;
  onEvent: (handler: EngagementEventHandler) => () => void;
  onStateChange: (handler: StateChangeHandler) => () => void;
  onRevealQueue: (handler: RevealQueueHandler) => () => void;
  reset: () => void;
  getEventHistory: () => EngagementEvent[];
  /** Update trigger configurations at runtime (admin/diagnostics) */
  setTriggers: (triggers: TriggerConfig[]) => void;
  /** Get current trigger configurations */
  getTriggers: () => TriggerConfig[];
}
