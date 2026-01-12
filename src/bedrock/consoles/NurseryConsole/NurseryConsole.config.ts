// src/bedrock/consoles/NurseryConsole/NurseryConsole.config.ts
// Console configuration for Nursery
// Sprint: nursery-v1 (Course Correction)

import type { ConsoleConfig } from '../../types/console.types';

/**
 * Nursery Console Configuration
 *
 * Manages research sprouts awaiting review - the cultivation queue where
 * sprouts are reviewed, promoted to Garden, or archived with reason.
 *
 * Status mapping:
 * - 'ready' = ResearchSprout.status === 'completed'
 * - 'failed' = ResearchSprout.status === 'blocked'
 * - 'archived' = ResearchSprout.status === 'archived'
 */
export const nurseryConsoleConfig: ConsoleConfig = {
  id: 'nursery',
  title: 'Nursery',
  subtitle: 'Research Sprouts',
  description: 'Review and curate research sprouts',

  metrics: [
    { id: 'total', label: 'Total', icon: 'eco', query: 'count(*)' },
    { id: 'ready', label: 'Ready', icon: 'check_circle', query: 'count(where: status=completed)', accent: 'green' },
    { id: 'failed', label: 'Failed', icon: 'warning', query: 'count(where: status=blocked)', accent: 'red' },
    { id: 'review', label: 'Needs Review', icon: 'rate_review', query: 'count(where: requiresReview)', accent: 'amber' },
  ],

  collectionView: {
    searchFields: ['meta.title', 'payload.spark', 'payload.tags'],
    filterOptions: [
      {
        field: 'payload.status',
        label: 'Status',
        type: 'select',
        options: ['completed', 'blocked', 'archived'],
      },
      {
        field: 'payload.requiresReview',
        label: 'Needs Review',
        type: 'boolean',
        trueLabel: 'Yes',
        falseLabel: 'No',
      },
      {
        field: 'payload.tags',
        label: 'Tags',
        type: 'select',
        dynamic: true,
        dynamicThreshold: 1,
      },
    ],
    sortOptions: [
      { field: 'meta.updatedAt', label: 'Recently Updated', direction: 'desc' },
      { field: 'payload.inferenceConfidence', label: 'Confidence', direction: 'desc' },
      { field: 'meta.title', label: 'Title', direction: 'asc' },
      { field: 'meta.createdAt', label: 'Oldest First', direction: 'asc' },
    ],
    defaultSort: { field: 'meta.updatedAt', label: 'Recently Updated', direction: 'desc' },
    // Default to showing ready and failed (actionable) sprouts
    defaultFilters: {
      'payload.status': ['completed', 'blocked'],
    },
    defaultViewMode: 'grid',
    viewModes: ['grid', 'list'],
    favoritesKey: 'grove-nursery-favorites',
  },

  // Navigation items for left sidebar
  navigation: [
    { type: 'header', label: 'Status' },
    { id: 'ready', label: 'Ready', icon: 'check_circle', filter: { 'payload.status': 'completed' } },
    { id: 'failed', label: 'Failed', icon: 'warning', filter: { 'payload.status': 'blocked' } },
    { id: 'archived', label: 'Archived', icon: 'archive', filter: { 'payload.status': 'archived' } },
    { type: 'divider' },
    { type: 'header', label: 'Review' },
    { id: 'needs-review', label: 'Needs Review', icon: 'rate_review', filter: { 'payload.requiresReview': true } },
  ],

  // No primary create action - sprouts are created via research pipeline
  primaryAction: undefined,

  copilot: {
    enabled: false, // Nursery doesn't need AI copilot for MVP
    actions: [],
  },
};

// =============================================================================
// Archive Reasons Configuration
// =============================================================================

/**
 * Configurable archive reasons for Nursery
 * DEX Pillar I: Declarative Sovereignty
 */
export interface ArchiveReason {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export const ARCHIVE_REASONS: ArchiveReason[] = [
  {
    id: 'low-quality',
    label: 'Low Quality',
    description: 'Research quality does not meet standards',
    icon: 'thumb_down',
  },
  {
    id: 'duplicate',
    label: 'Duplicate',
    description: 'Similar research already exists in Garden',
    icon: 'content_copy',
  },
  {
    id: 'off-topic',
    label: 'Off Topic',
    description: 'Research does not align with grove focus',
    icon: 'wrong_location',
  },
  {
    id: 'outdated',
    label: 'Outdated',
    description: 'Information is no longer current or relevant',
    icon: 'history',
  },
  {
    id: 'incomplete',
    label: 'Incomplete',
    description: 'Research is missing critical components',
    icon: 'pending',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Custom reason (specify in notes)',
    icon: 'more_horiz',
  },
];

// =============================================================================
// Status Display Configuration
// =============================================================================

/**
 * Display configuration for Nursery statuses
 */
export const NURSERY_STATUS_CONFIG = {
  ready: {
    label: 'Ready',
    icon: 'check_circle',
    color: 'green',
    description: 'Research completed successfully',
  },
  failed: {
    label: 'Failed',
    icon: 'warning',
    color: 'red',
    description: 'Quality gate failed - needs intervention',
  },
  archived: {
    label: 'Archived',
    icon: 'archive',
    color: 'gray',
    description: 'Soft-deleted or superseded',
  },
} as const;

export type NurseryDisplayStatus = keyof typeof NURSERY_STATUS_CONFIG;

export default nurseryConsoleConfig;
