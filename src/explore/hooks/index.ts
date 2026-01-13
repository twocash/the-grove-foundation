// src/explore/hooks/index.ts
// Barrel export for explore hooks
// Sprint: grove-data-layer-v1
// Sprint: kinetic-suggested-prompts-v1 - Added useNavigationPrompts

export {
  useCaptureFlow,
  useCaptureFlowContext,
  CaptureFlowProvider,
  type CaptureFlowHook,
} from './useCaptureFlow';

// Data layer hooks (Sprint: grove-data-layer-v1)
export { useLensPickerData, type UseLensPickerDataResult } from './useLensPickerData';
export { useJourneyListData, type UseJourneyListDataResult, type VersionedJourney } from './useJourneyListData';

// Navigation prompts (Sprint: kinetic-suggested-prompts-v1)
export {
  useNavigationPrompts,
  useSafeNavigationPrompts,
  type UseNavigationPromptsOptions,
  type NavigationPromptsResult,
} from './useNavigationPrompts';

// Prompt unification hooks (Sprint: prompt-unification-v1)
// @deprecated Use useNavigationPrompts instead (Sprint: kinetic-suggested-prompts-v1)
export {
  usePromptSuggestions,
  type UsePromptSuggestionsOptions,
} from './usePromptSuggestions';
export {
  useSequence,
  type SequenceState,
  type SequenceActions,
} from './useSequence';

// Highlight lookup (Sprint: kinetic-highlights-v1)
export {
  usePromptForHighlight,
  type UsePromptForHighlightResult,
} from './usePromptForHighlight';

// Research Queue Consumer (Sprint: sprout-research-v1, Phase 5a)
export {
  useResearchQueueConsumer,
  useIsQueueProcessing,
  useQueueConsumerStats,
  type UseResearchQueueConsumerOptions,
  type UseResearchQueueConsumerResult,
} from './useResearchQueueConsumer';

// Research Agent (Sprint: sprout-research-v1, Phase 5b)
export {
  useResearchAgent,
  useIsResearchExecuting,
  useResearchProgress as useResearchProgressEvents, // Renamed to avoid conflict
  type UseResearchAgentOptions,
  type ResearchExecutionState,
  type UseResearchAgentResult,
} from './useResearchAgent';

// Research Progress State (Sprint: progress-streaming-ui-v1)
export {
  useResearchProgress,
  type ResearchProgressState,
  type ProgressSource,
  type ProgressPhase,
  type TimestampedEvent,
  type UseResearchProgressResult,
} from './useResearchProgress';

// Knowledge Base Integration (Sprint: knowledge-base-integration-v1)
export {
  useKnowledgeBase,
  type UseKnowledgeBaseState,
  type UseKnowledgeBaseReturn,
} from './useKnowledgeBase';
