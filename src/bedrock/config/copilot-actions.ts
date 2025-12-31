// src/bedrock/config/copilot-actions.ts
// Copilot action definitions for Bedrock consoles
// Sprint: bedrock-foundation-v1

import type { CopilotAction } from '../context/BedrockCopilotContext';

// =============================================================================
// Global Actions (available in all consoles)
// =============================================================================

export const GLOBAL_COPILOT_ACTIONS: CopilotAction[] = [
  {
    id: 'explain-view',
    label: 'Explain this view',
    description: 'Get an overview of what this console does',
    icon: 'help',
  },
  {
    id: 'keyboard-shortcuts',
    label: 'Keyboard shortcuts',
    description: 'Show available keyboard shortcuts',
    icon: 'keyboard',
  },
];

// =============================================================================
// Console-Specific Actions
// =============================================================================

export const GARDEN_COPILOT_ACTIONS: CopilotAction[] = [
  ...GLOBAL_COPILOT_ACTIONS,
  {
    id: 'review-pending',
    label: 'Review pending',
    description: 'Start reviewing pending sprouts',
    icon: 'rate_review',
  },
  {
    id: 'auto-categorize',
    label: 'Auto-categorize',
    description: 'Suggest categories for selected sprout',
    icon: 'category',
  },
  {
    id: 'find-duplicates',
    label: 'Find duplicates',
    description: 'Search for similar existing sprouts',
    icon: 'content_copy',
  },
];

export const LENS_COPILOT_ACTIONS: CopilotAction[] = [
  ...GLOBAL_COPILOT_ACTIONS,
  {
    id: 'suggest-lens',
    label: 'Suggest a lens',
    description: 'Get AI suggestions for a new lens',
    icon: 'auto_awesome',
  },
  {
    id: 'optimize-prompt',
    label: 'Optimize prompt',
    description: 'Improve the selected lens prompt',
    icon: 'edit_note',
  },
  {
    id: 'test-lens',
    label: 'Test lens',
    description: 'Run a test query with this lens',
    icon: 'science',
  },
];

// =============================================================================
// Action Registry
// =============================================================================

export const COPILOT_ACTIONS_BY_CONSOLE: Record<string, CopilotAction[]> = {
  dashboard: GLOBAL_COPILOT_ACTIONS,
  garden: GARDEN_COPILOT_ACTIONS,
  lenses: LENS_COPILOT_ACTIONS,
  journeys: GLOBAL_COPILOT_ACTIONS,
  knowledge: GLOBAL_COPILOT_ACTIONS,
};

export function getCopilotActionsForConsole(consoleId: string): CopilotAction[] {
  return COPILOT_ACTIONS_BY_CONSOLE[consoleId] ?? GLOBAL_COPILOT_ACTIONS;
}
