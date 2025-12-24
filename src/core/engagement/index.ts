// src/core/engagement/index.ts

export { engagementMachine, type EngagementMachine } from './machine';
export {
  type EngagementContext,
  type EngagementEvent,
  type Journey,
  type JourneyStep,
  initialContext,
} from './types';
// Guards and actions are now defined inline in machine.ts using setup()
// Exporting standalone guards for testing purposes
export { guards } from './guards';

// Config
export {
  VALID_LENSES,
  type ValidLens,
  isValidLens,
  ENTROPY_CONFIG,
  type EntropyConfig,
} from './config';

// Persistence
export {
  getLens,
  setLens,
  clearLens,
  getCompletedJourneys,
  markJourneyCompleted,
  isJourneyCompleted,
  clearCompletedJourneys,
  STORAGE_KEYS
} from './persistence';

// Hooks
export {
  useLensState,
  useJourneyState,
  useEntropyState,
  type UseLensStateOptions,
  type UseLensStateReturn,
  type UseJourneyStateOptions,
  type UseJourneyStateReturn,
  type UseEntropyStateOptions,
  type UseEntropyStateReturn,
} from './hooks';

// Context
export {
  EngagementProvider,
  useEngagement,
  EngagementContext as EngagementReactContext,
  type EngagementContextValue,
  type EngagementProviderProps,
} from './context';
