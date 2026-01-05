// src/core/context-fields/index.ts
// Context Fields module barrel export
// Sprint: genesis-context-fields-v1
// Sprint: kinetic-suggested-prompts-v1 - Added useContextState and adapters

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
  // Sprint: exploration-node-unification-v1
  ProvenanceType,
  ReviewStatus,
  PromptProvenance,
} from './types';

export {
  mapSessionStageToStage,
  DEFAULT_SCORING_WEIGHTS,
  // Sprint: exploration-node-unification-v1
  AUTHORED_PROVENANCE,
  createExtractedProvenance,
} from './types';

// Scoring functions
export {
  applyHardFilters,
  calculateRelevance,
  rankPrompts,
  selectPrompts,
} from './scoring';

// Context state hook (Sprint: kinetic-suggested-prompts-v1)
export { useContextState, createDefaultContextState } from './useContextState';

// PromptObject → JourneyFork adapters (Sprint: kinetic-suggested-prompts-v1)
export {
  inferForkType,
  promptToFork,
  promptsToForks,
  diversifyForks,
} from './adapters';

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

// Lookup (Sprint: kinetic-highlights-v1)
export {
  findPromptForHighlight,
  getHighlightPrompts,
  hasMatchingPrompt,
  type HighlightLookupContext,
} from './lookup';

// Surface types (Sprint: kinetic-highlights-v1)
export type { PromptSurface, HighlightMatchMode, HighlightTrigger } from './types';
export { DEFAULT_PROMPT_SURFACES, canRenderOnSurface, getPromptSurfaces } from './types';
