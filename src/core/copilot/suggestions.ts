// src/core/copilot/suggestions.ts
// Type-specific action suggestions

import type { SuggestedAction } from './schema';
import type { GroveObjectType } from '@core/schema/grove-object';

/**
 * Suggestions organized by object type
 */
const SUGGESTIONS_BY_TYPE: Record<string, SuggestedAction[]> = {
  journey: [
    { label: 'Change title', template: "Set title to ''", icon: 'title' },
    { label: 'Set duration', template: 'Set duration to 10 minutes', icon: 'schedule' },
    { label: 'Update description', template: 'Make description shorter', icon: 'description' },
    { label: 'Add tag', template: "Add tag ''", icon: 'label' },
  ],
  lens: [
    { label: 'Adjust tone', template: 'Make tone more conversational', icon: 'record_voice_over' },
    { label: 'Change vocabulary', template: "Set vocabulary to 'technical'", icon: 'menu_book' },
    { label: 'Update description', template: 'Make description more engaging', icon: 'description' },
  ],
  node: [
    { label: 'Edit label', template: "Set title to ''", icon: 'edit' },
    { label: 'Add tag', template: "Add tag ''", icon: 'label' },
    { label: 'Mark favorite', template: 'Mark as favorite', icon: 'star' },
  ],
  hub: [
    { label: 'Add tag', template: "Add tag ''", icon: 'label' },
    { label: 'Change priority', template: 'Set priority to high', icon: 'priority_high' },
    { label: 'Update description', template: 'Make description clearer', icon: 'description' },
  ],
  sprout: [
    { label: 'Change stage', template: "Set status to 'active'", icon: 'eco' },
    { label: 'Add tag', template: "Add tag ''", icon: 'label' },
    { label: 'Mark favorite', template: 'Mark as favorite', icon: 'star' },
  ],
};

/**
 * Default suggestions for unknown types
 */
const DEFAULT_SUGGESTIONS: SuggestedAction[] = [
  { label: 'Change title', template: "Set title to ''", icon: 'title' },
  { label: 'Add tag', template: "Add tag ''", icon: 'label' },
  { label: 'Mark favorite', template: 'Mark as favorite', icon: 'star' },
];

/**
 * Get suggestions for an object type
 */
export function getSuggestionsForType(type: GroveObjectType): SuggestedAction[] {
  return SUGGESTIONS_BY_TYPE[type] || DEFAULT_SUGGESTIONS;
}

/**
 * Get the welcome message with suggestions
 */
export function getWelcomeMessage(type: GroveObjectType): string {
  const suggestions = getSuggestionsForType(type);
  const examples = suggestions.slice(0, 2).map(s => `"${s.template}"`).join(' or ');

  return `I can help you modify this ${type}. Try saying ${examples}.`;
}
