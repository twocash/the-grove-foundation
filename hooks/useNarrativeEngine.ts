// useNarrativeEngine - Core state management for Narrative Engine v2.1
// v0.14.1: Now uses shared context so all components see the same state
// Handles lens selection, journey navigation, session persistence, and entropy state

import { useNarrativeEngineContext } from './NarrativeEngineContext';

// Re-export the context hook as useNarrativeEngine for backwards compatibility
export const useNarrativeEngine = useNarrativeEngineContext;

// Also export as default
export default useNarrativeEngine;

// Re-export the provider for app wrapping
export { NarrativeEngineProvider } from './NarrativeEngineContext';
