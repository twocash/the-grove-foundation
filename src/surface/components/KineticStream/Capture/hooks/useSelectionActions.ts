// src/surface/components/KineticStream/Capture/hooks/useSelectionActions.ts
// Declarative selection actions loaded from JSON config
// Sprint: sprout-declarative-v1

import selectionActionsConfig from '@/data/selection-actions.json';

/**
 * A selection action defines what happens when text is captured
 */
export interface SelectionAction {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Emoji icon */
  icon: string;
  /** Brief description */
  description: string;
  /** Initial stage for captured sprouts */
  defaultStage: string;
  /** Which card component to render */
  captureCard: string;
  /** Fields to collect during capture */
  fields: string[];
  /** Keyboard shortcut (single key) */
  shortcut?: string;
}

interface SelectionActionsConfig {
  version: string;
  actions: SelectionAction[];
}

/**
 * Hook for accessing declarative selection actions
 *
 * Actions are loaded from data/selection-actions.json and define
 * the available capture behaviors (Plant Sprout, Research Directive, etc.)
 */
export function useSelectionActions() {
  const config = selectionActionsConfig as SelectionActionsConfig;

  /**
   * Find action by ID
   */
  const getActionById = (id: string): SelectionAction | undefined => {
    return config.actions.find(a => a.id === id);
  };

  /**
   * Get the first/default action
   */
  const getDefaultAction = (): SelectionAction => {
    return config.actions[0];
  };

  /**
   * Find action by keyboard shortcut
   */
  const getActionByShortcut = (key: string): SelectionAction | undefined => {
    return config.actions.find(a => a.shortcut === key.toLowerCase());
  };

  /**
   * Check if there are multiple actions available
   */
  const hasMultipleActions = (): boolean => {
    return config.actions.length > 1;
  };

  return {
    /** All available actions */
    actions: config.actions,
    /** Config version */
    version: config.version,
    /** Lookup helpers */
    getActionById,
    getDefaultAction,
    getActionByShortcut,
    hasMultipleActions,
  };
}

export default useSelectionActions;
