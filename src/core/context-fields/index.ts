// src/core/context-fields/index.ts
// Context Fields module barrel export
// Sprint: genesis-context-fields-v1

// Types
export type {
  Stage,
  SessionStage,
  ContextState,
  ContextTargeting,
  TopicAffinity,
  LensAffinity,
  PromptStats,
  GenerationContext,
  PromptObject,
  ScoringWeights,
  ScoredPrompt,
} from './types';

export {
  mapSessionStageToStage,
  DEFAULT_SCORING_WEIGHTS,
} from './types';

// Scoring functions
export {
  applyHardFilters,
  calculateRelevance,
  rankPrompts,
  selectPrompts,
} from './scoring';

// Telemetry (Epic 5)
export type {
  SessionTelemetry,
  StageTransition,
  EntropyPoint,
  QueryPattern,
} from './telemetry';

export { captureSessionTelemetry } from './telemetry';

// Generator (Epic 5)
export { PromptGenerator, getPromptGenerator } from './generator';
