// src/bedrock/consoles/LensWorkshop/LensWorkshop.config.ts
// Console configuration for Lens Workshop
// Migration: MIGRATION-001-lens

import type { ConsoleConfig } from '../../types/console.types';

export const lensWorkshopConfig: ConsoleConfig = {
  id: 'lenses',
  title: 'Lenses',
  description: 'Prompt engineering personas that control AI voice',

  metrics: [
    { id: 'total', label: 'Total', icon: 'filter_alt', query: 'count(*)' },
    { id: 'active', label: 'Active', icon: 'visibility', query: 'count(where: enabled)' },
    { id: 'draft', label: 'Draft', icon: 'edit_note', query: 'count(where: !enabled)' },
  ],

  collectionView: {
    searchFields: ['meta.title', 'meta.description', 'payload.toneGuidance'],
    filterOptions: [
      {
        field: 'payload.narrativeStyle',
        label: 'Style',
        options: ['balanced', 'evidence-first', 'stakes-heavy', 'mechanics-deep', 'resolution-oriented'],
      },
      {
        field: 'payload.vocabularyLevel',
        label: 'Vocabulary',
        options: ['accessible', 'technical', 'academic', 'executive'],
      },
      {
        field: 'payload.color',
        label: 'Color',
        options: ['forest', 'moss', 'amber', 'clay', 'slate', 'fig', 'stone'],
      },
    ],
    sortOptions: [
      { field: 'meta.title', label: 'Name', direction: 'asc' },
      { field: 'meta.updatedAt', label: 'Recently Updated', direction: 'desc' },
      { field: 'payload.narrativeStyle', label: 'Style', direction: 'asc' },
    ],
    defaultSort: { field: 'meta.title', direction: 'asc' },
    defaultViewMode: 'grid',
    viewModes: ['grid', 'list'],
    favoritesKey: 'grove-lens-favorites',
  },

  primaryAction: { label: 'New Lens', icon: 'add' },
  copilot: { enabled: true },
};

// Legacy exports for backward compatibility (used by old code)
export const LENS_CATEGORY_CONFIG = {
  role: { label: 'Role', icon: 'person' },
  interest: { label: 'Interest', icon: 'interests' },
  context: { label: 'Context', icon: 'schedule' },
  custom: { label: 'Custom', icon: 'tune' },
};

export const DEFAULT_LENS_COLORS = [
  '#2F5C3B', // forest
  '#7EA16B', // moss
  '#E0A83B', // amber
  '#D95D39', // clay
  '#526F8A', // slate
  '#6B4B56', // fig
  '#9C9285', // stone
];

export default lensWorkshopConfig;
