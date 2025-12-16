// types/engagement.ts - Engagement Bus type definitions
// Sprint 7: Unified engagement state management

import { ArchetypeId } from './lens';

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
  | 'SESSION_RESUMED';

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
  topicsExplored: string[];  // Array of topic IDs
  cardsVisited: string[];    // Array of card IDs
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
}

export interface ActiveJourney {
  lensId: string;
  threadCardIds: string[];
  currentPosition: number;
  startedAt: string;
}

export const DEFAULT_ENGAGEMENT_STATE: EngagementState = {
  sessionId: '',
  sessionStartedAt: '',
  lastActivityAt: '',
  exchangeCount: 0,
  journeysCompleted: 0,
  journeysStarted: 0,
  topicsExplored: [],
  cardsVisited: [],
  minutesActive: 0,
  activeLensId: null,
  hasCustomLens: false,
  currentArchetypeId: null,
  revealsShown: [],
  revealsAcknowledged: [],
  terminatorModeUnlocked: false,
  terminatorModeActive: false,
  activeJourney: null
};

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
  priority: number;  // Higher = evaluated first, shown first
  conditions: TriggerCondition;
  blockedBy?: RevealType[];  // Don't show if these haven't been acknowledged
  requiresAcknowledgment?: RevealType[];  // Must have acknowledged these first
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
  // Event emission
  emit: <T extends EngagementEventType>(type: T, payload: EventPayloads[T]) => void;

  // State access
  getState: () => EngagementState;

  // Reveal queue
  getRevealQueue: () => RevealQueueItem[];
  acknowledgeReveal: (revealType: RevealType, action: 'accepted' | 'declined' | 'dismissed') => void;

  // Subscriptions
  onEvent: (handler: EngagementEventHandler) => () => void;
  onStateChange: (handler: StateChangeHandler) => () => void;
  onRevealQueue: (handler: RevealQueueHandler) => () => void;

  // Utilities
  reset: () => void;
  getEventHistory: () => EngagementEvent[];
}
