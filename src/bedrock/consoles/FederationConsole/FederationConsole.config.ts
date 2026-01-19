// src/bedrock/consoles/FederationConsole/FederationConsole.config.ts
// Console configuration for Federation Console
// Sprint: S9-SL-Federation v1
//
// DEX: Declarative Sovereignty - config generated from registry, not hardcoded

import type { ConsoleConfig } from '../../types/console.types';
import {
  getAllFederationTypes,
  getFederationTypesByTabOrder,
  type FederationMetricDefinition,
  type FederationFilterDefinition,
  type FederationSortDefinition,
} from '../../types/federation.types';

// =============================================================================
// Dynamic Config Generation from Registry
// =============================================================================

/**
 * Generate filter options from registry
 * Includes common filters plus type-specific filters
 * Deduplicates by field and merges options
 */
function generateFilterOptions(): Array<{
  field: string;
  label: string;
  type: 'select' | 'boolean';
  options?: string[];
}> {
  const types = getAllFederationTypes();

  // Entity type filter
  const typeFilter = {
    field: 'meta.type',
    label: 'Entity Type',
    type: 'select' as const,
    options: types.map((t) => t.type),
  };

  // Collect type-specific filters and deduplicate by field
  const filtersByField = new Map<string, FederationFilterDefinition>();

  for (const typeDef of types) {
    if (typeDef.filters) {
      for (const filter of typeDef.filters) {
        const existing = filtersByField.get(filter.field);
        if (existing) {
          // Merge options, deduplicating
          const mergedOptions = new Set([...(existing.options || []), ...(filter.options || [])]);
          filtersByField.set(filter.field, {
            ...existing,
            options: Array.from(mergedOptions),
          });
        } else {
          filtersByField.set(filter.field, { ...filter });
        }
      }
    }
  }

  return [typeFilter, ...Array.from(filtersByField.values())];
}

/**
 * Generate sort options from registry
 */
function generateSortOptions(): Array<{
  field: string;
  label: string;
  direction: 'asc' | 'desc';
}> {
  const types = getAllFederationTypes();

  // Common sort options
  const commonSorts: FederationSortDefinition[] = [
    { field: 'meta.updatedAt', label: 'Recently Updated', direction: 'desc' },
    { field: 'meta.createdAt', label: 'Created', direction: 'desc' },
  ];

  // Collect type-specific sorts
  const typeSpecificSorts: FederationSortDefinition[] = [];
  for (const typeDef of types) {
    if (typeDef.sortOptions) {
      typeSpecificSorts.push(...typeDef.sortOptions);
    }
  }

  return [...commonSorts, ...typeSpecificSorts];
}

/**
 * Generate metrics from registry
 */
function generateMetrics(): Array<{
  id: string;
  label: string;
  icon: string;
  query: string;
}> {
  // Federation-wide metrics
  const summaryMetrics: FederationMetricDefinition[] = [
    { id: 'connected-groves', label: 'Connected', icon: 'hub', query: 'federation_stats.connected_groves' },
    { id: 'pending-exchanges', label: 'Pending', icon: 'hourglass_empty', query: 'federation_stats.pending_exchanges' },
    { id: 'avg-trust', label: 'Avg Trust', icon: 'shield', query: 'federation_stats.average_trust_score' },
    { id: 'total-tokens', label: 'Tokens', icon: 'token', query: 'federation_stats.total_tokens_exchanged' },
  ];

  return summaryMetrics;
}

/**
 * Generate search fields from registry
 */
function generateSearchFields(): string[] {
  const types = getAllFederationTypes();

  // Common search fields
  const commonFields = ['meta.title', 'meta.description'];

  // Collect type-specific search fields
  const typeSpecificFields = new Set<string>();
  for (const typeDef of types) {
    if (typeDef.searchFields) {
      typeDef.searchFields.forEach((f) => typeSpecificFields.add(f));
    }
  }

  // Merge and dedupe
  const allFields = new Set([...commonFields, ...typeSpecificFields]);
  return Array.from(allFields);
}

/**
 * Generate navigation tabs from registry
 */
function generateNavigation() {
  const types = getFederationTypesByTabOrder();

  return types.map((t) => ({
    id: t.type,
    label: t.labelPlural,
    icon: t.icon,
    description: t.description,
  }));
}

// =============================================================================
// Federation Console Configuration
// =============================================================================

export const federationConsoleConfig: ConsoleConfig = {
  id: 'federation',
  title: 'Federation',
  subtitle: 'Cross-grove federation management',
  description: 'Manage federated groves, tier mappings, knowledge exchanges, and trust relationships',

  metrics: generateMetrics(),

  navigation: generateNavigation(),

  collectionView: {
    searchFields: generateSearchFields(),
    filterOptions: generateFilterOptions(),
    sortOptions: generateSortOptions(),
    defaultSort: { field: 'meta.updatedAt', label: 'Recently Updated', direction: 'desc' },
    defaultFilters: {},
    defaultViewMode: 'grid',
    viewModes: ['grid', 'list'],
    favoritesKey: 'grove-federation-favorites',
  },

  primaryAction: { label: 'Register Grove', icon: 'add', action: 'create' },

  copilot: {
    enabled: true,
    actions: [
      { id: 'suggest-mapping', trigger: 'suggest mappings for *', description: 'Auto-suggest tier mappings' },
      { id: 'audit-trust', trigger: '/audit-trust', description: 'Audit trust relationships' },
      { id: 'check-health', trigger: '/health', description: 'Check federation health' },
    ],
    quickActions: [],
  },

  // Federation doesn't use singleton pattern - all entities can have multiples
  singleton: {
    enabled: false,
  },
};

// =============================================================================
// Display Configuration
// =============================================================================

/**
 * Connection status display config
 */
export const CONNECTION_STATUS_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  connected: { label: 'Connected', icon: 'link', color: '#4ade80' },
  pending: { label: 'Pending', icon: 'hourglass_empty', color: '#f59e0b' },
  blocked: { label: 'Blocked', icon: 'block', color: '#ef4444' },
  none: { label: 'Not Connected', icon: 'link_off', color: '#94a3b8' },
};

/**
 * Trust level display config
 */
export const TRUST_LEVEL_DISPLAY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  new: { label: 'New', icon: 'fiber_new', color: '#94a3b8' },
  established: { label: 'Established', icon: 'handshake', color: '#60a5fa' },
  trusted: { label: 'Trusted', icon: 'verified', color: '#4ade80' },
  verified: { label: 'Verified', icon: 'workspace_premium', color: '#a78bfa' },
};

/**
 * Exchange status display config
 */
export const EXCHANGE_STATUS_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  pending: { label: 'Pending', icon: 'hourglass_empty', color: '#f59e0b' },
  approved: { label: 'Approved', icon: 'thumb_up', color: '#60a5fa' },
  completed: { label: 'Completed', icon: 'check_circle', color: '#4ade80' },
  rejected: { label: 'Rejected', icon: 'cancel', color: '#ef4444' },
  expired: { label: 'Expired', icon: 'schedule', color: '#94a3b8' },
};

/**
 * Exchange content type display config
 */
export const CONTENT_TYPE_CONFIG: Record<string, { label: string; icon: string; tokens: number }> = {
  sprout: { label: 'Sprout', icon: 'eco', tokens: 10 },
  concept: { label: 'Concept', icon: 'lightbulb', tokens: 25 },
  research: { label: 'Research', icon: 'science', tokens: 50 },
  insight: { label: 'Insight', icon: 'psychology', tokens: 75 },
};

export default federationConsoleConfig;
