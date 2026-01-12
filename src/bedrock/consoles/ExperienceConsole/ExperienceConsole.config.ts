// src/bedrock/consoles/ExperienceConsole/ExperienceConsole.config.ts
// Console configuration for Experience Console
// Sprint: unified-experience-console-v1 (polymorphic console refactor)
//
// DEX: Declarative Sovereignty - config generated from registry, not hardcoded

import type { ConsoleConfig } from '../../types/console.types';
import {
  getAllExperienceTypes,
  type MetricDefinition,
  type FilterDefinition,
  type SortDefinition,
} from '../../types/experience.types';

// =============================================================================
// Dynamic Config Generation from Registry
// =============================================================================

/**
 * Get types that should be displayed in the unified console
 * (excludes types with separate console routes like research-config)
 */
function getUnifiedConsoleTypes() {
  return getAllExperienceTypes().filter(
    (t) => t.routePath === '/bedrock/experience'
  );
}

/**
 * Generate filter options from registry
 * Includes type filter plus type-specific filters
 */
function generateFilterOptions(): Array<{
  field: string;
  label: string;
  type: 'select' | 'boolean';
  options?: string[];
}> {
  const types = getUnifiedConsoleTypes();

  // Status filter (common to all)
  const statusFilter = {
    field: 'meta.status',
    label: 'State',
    type: 'select' as const,
    options: ['active', 'draft', 'archived'],
  };

  // Type filter (dynamic from registry)
  const typeFilter = {
    field: 'meta.type',
    label: 'Type',
    type: 'select' as const,
    options: types.map((t) => t.type),
  };

  // Collect type-specific filters
  const typeSpecificFilters: FilterDefinition[] = [];
  for (const typeDef of types) {
    if (typeDef.filters) {
      typeSpecificFilters.push(...typeDef.filters);
    }
  }

  return [statusFilter, typeFilter, ...typeSpecificFilters];
}

/**
 * Generate sort options from registry
 * Includes common sorts plus type-specific sorts
 */
function generateSortOptions(): Array<{
  field: string;
  label: string;
  direction: 'asc' | 'desc';
}> {
  const types = getUnifiedConsoleTypes();

  // Common sort options
  const commonSorts: SortDefinition[] = [
    { field: 'meta.updatedAt', label: 'Recently Updated', direction: 'desc' },
    { field: 'meta.title', label: 'Name', direction: 'asc' },
    { field: 'meta.type', label: 'Type', direction: 'asc' },
  ];

  // Collect type-specific sorts
  const typeSpecificSorts: SortDefinition[] = [];
  for (const typeDef of types) {
    if (typeDef.sortOptions) {
      typeSpecificSorts.push(...typeDef.sortOptions);
    }
  }

  return [...commonSorts, ...typeSpecificSorts];
}

/**
 * Generate metrics from registry
 * Includes total count plus type-specific metrics
 */
function generateMetrics(): Array<{
  id: string;
  label: string;
  icon: string;
  query: string;
}> {
  const types = getUnifiedConsoleTypes();

  // Total across all types
  const totalMetric: MetricDefinition = {
    id: 'total',
    label: 'Total',
    icon: 'category',
    query: 'count(*)',
  };

  // Per-type count metrics
  const typeCountMetrics: MetricDefinition[] = types.map((t) => ({
    id: `count-${t.type}`,
    label: t.label,
    icon: t.icon,
    query: `count(where: meta.type=${t.type})`,
  }));

  return [totalMetric, ...typeCountMetrics];
}

/**
 * Generate search fields from registry
 * Collects all type-specific search fields
 */
function generateSearchFields(): string[] {
  const types = getUnifiedConsoleTypes();

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

// =============================================================================
// Experience Console Configuration
// Generated dynamically from EXPERIENCE_TYPE_REGISTRY
// =============================================================================

export const experienceConsoleConfig: ConsoleConfig = {
  id: 'experience',
  title: 'Experience',
  subtitle: 'Unified management console',
  description: 'Manage system prompts, feature flags, and experience configuration',

  metrics: generateMetrics(),

  navigation: [],

  collectionView: {
    searchFields: generateSearchFields(),
    filterOptions: generateFilterOptions(),
    sortOptions: generateSortOptions(),
    defaultSort: { field: 'meta.updatedAt', label: 'Recently Updated', direction: 'desc' },
    defaultFilters: { 'meta.status': 'active' },
    defaultViewMode: 'grid',
    viewModes: ['grid', 'list'],
    favoritesKey: 'grove-experience-favorites',
  },

  primaryAction: { label: 'New', icon: 'add', action: 'create' },

  copilot: {
    enabled: true,
    actions: [
      { id: 'set-title', trigger: 'set title to *', description: 'Update the title' },
      { id: 'audit', trigger: '/audit', description: 'Review for consistency and gaps' },
    ],
    quickActions: [
      { id: 'audit', label: 'Audit', command: '/audit', icon: 'fact_check' },
      { id: 'help', label: 'Help', command: 'help', icon: 'help' },
    ],
  },
};

// =============================================================================
// Display Configuration (preserved for component use)
// =============================================================================

/**
 * Response mode configuration for system prompts
 */
export const RESPONSE_MODE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  architect: { label: 'Architect', icon: 'architecture', color: '#2F5C3B' },
  librarian: { label: 'Librarian', icon: 'local_library', color: '#526F8A' },
  contemplative: { label: 'Contemplative', icon: 'psychology', color: '#7E57C2' },
};

/**
 * Closing behavior configuration for system prompts
 */
export const CLOSING_BEHAVIOR_CONFIG: Record<string, { label: string; icon: string }> = {
  navigation: { label: 'Navigation', icon: 'explore' },
  question: { label: 'Question', icon: 'help_outline' },
  open: { label: 'Open', icon: 'all_inclusive' },
};

export default experienceConsoleConfig;
