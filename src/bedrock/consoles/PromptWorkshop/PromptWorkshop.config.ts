// src/bedrock/consoles/PromptWorkshop/PromptWorkshop.config.ts
// Console configuration for Prompt Workshop
// Sprint: prompt-unification-v1

import type { ConsoleConfig } from '../../types/console.types';

export const promptWorkshopConfig: ConsoleConfig = {
  id: 'prompts',
  title: 'Prompts',
  description: 'Contextual content with declarative sequence membership',

  metrics: [
    { id: 'total', label: 'Total', icon: 'chat', query: 'count(*)' },
    { id: 'active', label: 'Active', icon: 'visibility', query: 'count(where: status=active)' },
    { id: 'sequences', label: 'Sequences', icon: 'route', query: 'count(distinct: sequences.groupId)' },
    { id: 'targeted', label: 'Targeted', icon: 'filter_alt', query: 'count(where: targeting.stages)' },
  ],

  navigation: [],

  collectionView: {
    searchFields: ['meta.title', 'meta.description', 'payload.executionPrompt'],
    filterOptions: [
      {
        field: 'payload.source',
        label: 'Source',
        type: 'select',
        options: ['library', 'generated', 'user'],
      },
      {
        field: 'payload.variant',
        label: 'Variant',
        type: 'select',
        options: ['default', 'glow', 'subtle', 'urgent'],
      },
      {
        field: 'meta.status',
        label: 'Status',
        type: 'select',
        options: ['active', 'draft', 'archived'],
      },
    ],
    sortOptions: [
      { field: 'payload.baseWeight', label: 'Weight', direction: 'desc' },
      { field: 'meta.title', label: 'Name', direction: 'asc' },
      { field: 'meta.updatedAt', label: 'Recently Updated', direction: 'desc' },
      { field: 'payload.stats.selections', label: 'Most Selected', direction: 'desc' },
    ],
    defaultSort: { field: 'payload.baseWeight', label: 'Weight', direction: 'desc' },
    defaultViewMode: 'grid',
    viewModes: ['grid', 'list'],
    favoritesKey: 'grove-prompt-favorites',
  },

  primaryAction: { label: 'New Prompt', icon: 'add', action: 'create' },
  copilot: { 
    enabled: true,
    actions: [
      { id: 'set-title', trigger: 'set title to *', description: 'Update the prompt title' },
      { id: 'set-description', trigger: 'set description to *', description: 'Update the prompt description' },
      { id: 'set-weight', trigger: 'set weight to *', description: 'Update the base weight' },
    ],
  },
};

// Sequence type configuration
export const SEQUENCE_TYPE_CONFIG = {
  journey: { label: 'Journey', icon: 'route', color: '#2F5C3B' },
  briefing: { label: 'Briefing', icon: 'article', color: '#526F8A' },
  wizard: { label: 'Wizard', icon: 'auto_fix', color: '#E0A83B' },
  tour: { label: 'Tour', icon: 'map', color: '#7EA16B' },
  research: { label: 'Research', icon: 'science', color: '#6B4B56' },
  faq: { label: 'FAQ', icon: 'help', color: '#9C9285' },
};

// Variant configuration
export const PROMPT_VARIANT_CONFIG = {
  default: { label: 'Default', color: '#526F8A' },
  glow: { label: 'Glow', color: '#00FFCC' },
  subtle: { label: 'Subtle', color: '#9C9285' },
  urgent: { label: 'Urgent', color: '#D95D39' },
};

// Source configuration
export const PROMPT_SOURCE_CONFIG = {
  library: { label: 'Library', icon: 'local_library' },
  generated: { label: 'AI Generated', icon: 'auto_awesome' },
  user: { label: 'User Created', icon: 'person' },
};

export default promptWorkshopConfig;
