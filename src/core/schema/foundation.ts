// src/core/schema/foundation.ts
// Foundation workspace type definitions

/**
 * Foundation console identifier
 */
export type FoundationConsole =
  | 'dashboard'
  | 'genesis'
  | 'health'
  | 'narrative'
  | 'engagement'
  | 'knowledge'
  | 'tuner'
  | 'audio'
  | 'sprouts';

/**
 * Foundation inspector mode determines what's shown in the right panel
 */
export type FoundationInspectorMode =
  | { type: 'none' }
  | { type: 'journey'; journeyId: string }
  | { type: 'node'; nodeId: string }
  | { type: 'persona'; personaId: string }
  | { type: 'card'; cardId: string }
  | { type: 'sprout-review'; sproutId: string }
  | { type: 'rag-document'; documentId: string }
  | { type: 'audio-track'; trackId: string }
  | { type: 'settings'; section: string };

/**
 * Foundation navigation state
 */
export interface FoundationNavState {
  activeConsole: FoundationConsole;
  expandedGroups: Set<string>;
}

/**
 * Foundation inspector state
 */
export interface FoundationInspectorState {
  mode: FoundationInspectorMode;
  isOpen: boolean;
}

/**
 * Foundation UI state
 */
export interface FoundationUIState {
  navigation: FoundationNavState;
  inspector: FoundationInspectorState;
}

/**
 * Foundation UI actions
 */
export interface FoundationUIActions {
  // Navigation
  setActiveConsole: (console: FoundationConsole) => void;
  toggleGroup: (groupId: string) => void;

  // Inspector
  openInspector: (mode: FoundationInspectorMode) => void;
  closeInspector: () => void;
  toggleInspector: () => void;
}

/**
 * Combined Foundation UI context type
 */
export interface FoundationUIContextType extends FoundationUIState, FoundationUIActions {}

/**
 * localStorage keys
 */
export const FOUNDATION_CONSOLE_KEY = 'grove-foundation-console';
export const FOUNDATION_EXPANDED_KEY = 'grove-foundation-expanded';
