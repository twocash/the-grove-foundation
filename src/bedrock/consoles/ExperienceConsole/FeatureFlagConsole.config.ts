// src/bedrock/consoles/ExperienceConsole/FeatureFlagConsole.config.ts
// Console configuration for Feature Flag Console
// Sprint: feature-flags-v1

import type { ConsoleConfig } from '../../types/console.types';
import { getExperienceTypeDefinition } from '../../types/experience.types';

// Get definition from registry (DEX: Organic Scalability)
const featureFlagDef = getExperienceTypeDefinition('feature-flag');

export const featureFlagConsoleConfig: ConsoleConfig = {
  id: 'feature-flags',
  title: 'Feature Flags',
  subtitle: featureFlagDef.label,
  description: featureFlagDef.description,

  metrics: [
    { id: 'total', label: 'Total', icon: featureFlagDef.icon, query: 'count(*)' },
    { id: 'available', label: 'Available', icon: 'check_circle', query: 'count(where: payload.available=true)' },
    { id: 'disabled', label: 'Disabled', icon: 'block', query: 'count(where: payload.available=false)' },
    { id: 'header', label: 'In Header', icon: 'visibility', query: 'count(where: payload.showInExploreHeader=true)' },
  ],

  navigation: [],

  collectionView: {
    searchFields: ['meta.title', 'meta.description', 'payload.flagId', 'payload.headerLabel'],
    filterOptions: [
      {
        field: 'payload.available',
        label: 'Availability',
        type: 'select',
        options: ['true', 'false'],
      },
      {
        field: 'payload.category',
        label: 'Category',
        type: 'select',
        options: ['experience', 'research', 'experimental', 'internal'],
      },
      {
        field: 'payload.showInExploreHeader',
        label: 'Header',
        type: 'select',
        options: ['true', 'false'],
      },
    ],
    sortOptions: [
      { field: 'meta.updatedAt', label: 'Recently Updated', direction: 'desc' },
      { field: 'meta.title', label: 'Name', direction: 'asc' },
      { field: 'payload.flagId', label: 'Flag ID', direction: 'asc' },
      { field: 'payload.headerOrder', label: 'Header Order', direction: 'asc' },
    ],
    defaultSort: { field: 'meta.updatedAt', label: 'Recently Updated', direction: 'desc' },
    defaultFilters: {},
    defaultViewMode: 'grid',
    viewModes: ['grid', 'list'],
    favoritesKey: 'grove-feature-flags-favorites',
  },

  primaryAction: { label: 'New Flag', icon: 'add', action: 'create' },

  copilot: {
    enabled: true,
    actions: [
      { id: 'set-title', trigger: 'set title to *', description: 'Update the flag title' },
      { id: 'set-description', trigger: 'set description to *', description: 'Update the description' },
      { id: 'toggle', trigger: '/toggle', description: 'Toggle flag availability' },
    ],
    // quickActions removed per inspector-copilot-v1: maximum minimalism
    // Users type /help or /toggle directly in terminal
    quickActions: [],
  },
};

// Category configuration for display
export const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  experience: { label: 'Experience', icon: 'explore', color: '#2F5C3B' },
  research: { label: 'Research', icon: 'science', color: '#7E57C2' },
  experimental: { label: 'Experimental', icon: 'labs', color: '#D95D39' },
  internal: { label: 'Internal', icon: 'settings', color: '#526F8A' },
};

export default featureFlagConsoleConfig;
