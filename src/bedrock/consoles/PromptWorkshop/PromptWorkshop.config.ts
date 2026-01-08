// src/bedrock/consoles/PromptWorkshop/PromptWorkshop.config.ts
// Console configuration for Prompt Workshop
// Sprint: prompt-unification-v1

import type { ConsoleConfig } from '../../types/console.types';

export const promptWorkshopConfig: ConsoleConfig = {
  id: 'prompts',
  title: 'Exploration Nodes',
  subtitle: 'Prompts', // Sprint: exploration-node-unification-v1
  description: 'Unified navigation primitives with provenance tracking',

  metrics: [
    { id: 'total', label: 'Total', icon: 'chat', query: 'count(*)' },
    { id: 'active', label: 'Active', icon: 'visibility', query: 'count(where: status=active)' },
    { id: 'inSequences', label: 'In Journeys', icon: 'route', query: 'count(where: sequences.length > 0)' },
    // Sprint: prompt-extraction-pipeline-v1 - Review queue indicator
    { id: 'pendingReview', label: 'Pending Review', icon: 'pending_actions', query: 'count(where: source=generated)' },
  ],

  navigation: [],

  collectionView: {
    searchFields: ['meta.title', 'meta.description', 'payload.executionPrompt', 'meta.tags'],
    filterOptions: [
      {
        field: 'payload.source',
        label: 'Source',
        type: 'select',
        options: ['library', 'generated', 'user'],
      },
      {
        field: 'payload.targeting.stages',
        label: 'Stage',
        type: 'select',
        options: ['genesis', 'exploration', 'synthesis', 'advocacy'],
      },
      {
        field: 'meta.status',
        label: 'Status',
        type: 'select',
        options: ['active', 'draft', 'archived'],
      },
      // Sprint: exploration-node-unification-v1
      {
        field: 'payload.provenance.type',
        label: 'Provenance',
        type: 'select',
        options: ['authored', 'extracted', 'generated', 'submitted'],
      },
      // Sprint: genesis-sequence-v1 - Dynamic tag-based filtering
      {
        field: 'meta.tags',
        label: 'Tags',
        type: 'select',
        dynamic: true,
        dynamicThreshold: 5, // Only show tags with 5+ uses
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
      // Sprint: prompt-wiring-v1
      { id: 'make-compelling', trigger: '/make-compelling', description: 'Generate compelling title variants', aliases: ['make compelling', 'compelling title', 'better title'] },
      { id: 'suggest-targeting', trigger: '/suggest-targeting', description: 'Suggest target stages based on content', aliases: ['suggest targeting', 'suggest stages', 'what stages'] },
      // Sprint: prompt-copilot-actions-v1
      { id: 'enrich', trigger: '/enrich', description: 'Enrich metadata (targeting + title suggestions)', aliases: ['enrich', 'enrich metadata'] },
    ],
    // Sprint: prompt-copilot-actions-v1 - Quick action buttons
    quickActions: [
      { id: 'suggest-targeting', label: 'Update Targeting', command: '/suggest-targeting', icon: 'target' },
      { id: 'make-compelling', label: 'Suggest Headlines', command: '/make-compelling', icon: 'auto_awesome' },
      { id: 'enrich', label: 'Enrich Metadata', command: '/enrich', icon: 'psychology' },
      { id: 'activate', label: 'Activate', command: 'activate', icon: 'toggle_on' },
      { id: 'help', label: 'Help', command: 'help', icon: 'help' },
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

// Source configuration
export const PROMPT_SOURCE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  library: { label: 'Library', icon: 'local_library', color: '#526F8A' },
  generated: { label: 'AI Generated', icon: 'auto_awesome', color: '#E0A83B' },
  user: { label: 'User Created', icon: 'person', color: '#7EA16B' },
};

export default promptWorkshopConfig;
