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
