// src/bedrock/consoles/ExperienceConsole/ExperienceConsole.config.ts
// Console configuration for Experience Console
// Sprint: unified-experience-console-v1 (polymorphic console refactor)
//
// DEX: Declarative Sovereignty - config generated from registry, not hardcoded

import type { ConsoleConfig, FilterOption } from '../../types/console.types';
import { themeColor } from '../../config/themeColors';
import {
  getAllExperienceTypes,
  type MetricDefinition,
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

// =============================================================================
// Status Filter: OR Logic for Active/Enabled
// Sprint: experience-console-cleanup-v1
// =============================================================================

/**
 * Type-specific enabled field lookup.
 * Maps experience type → payload field that controls "enabled" state.
 * Types not listed here have no separate enabled boolean.
 */
const ENABLED_FIELD_MAP: Record<string, string> = {
  'feature-flag': 'payload.available',
  'advancement-rule': 'payload.isEnabled',
  'job-config': 'payload.enabled',
};

/** Simple dot-path resolver for matchFn (avoids importing React hook utilities) */
function resolvePath(obj: unknown, path: string): unknown {
  let current: unknown = obj;
  for (const key of path.split('.')) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/**
 * Generate filter options — trimmed to 3 cross-cutting filters.
 * Removes all type-specific filter stubs.
 * Sprint: experience-console-cleanup-v1
 */
function generateFilterOptions(): FilterOption[] {
  const types = getUnifiedConsoleTypes();

  // Status filter with OR logic: "Active" = meta.status=active OR type-specific enabled=true
  const statusFilter: FilterOption = {
    field: 'status',
    label: 'Status',
    type: 'select',
    options: ['Active', 'Draft', 'Archived', 'Disabled'],
    matchFn: (obj: unknown, filterValue: string) => {
      const o = obj as { meta: { status: string; type: string } };
      const enabledPath = ENABLED_FIELD_MAP[o.meta.type];
      switch (filterValue) {
        case 'Active':
          if (o.meta.status === 'active') return true;
          if (enabledPath) return resolvePath(obj, enabledPath) === true;
          return false;
        case 'Disabled':
          if (!enabledPath) return false;
          return resolvePath(obj, enabledPath) === false;
        case 'Draft':
          return o.meta.status === 'draft';
        case 'Archived':
          return o.meta.status === 'archived';
        default:
          return false;
      }
    },
  };

  // Type filter (dynamic from registry)
  const typeFilter: FilterOption = {
    field: 'meta.type',
    label: 'Type',
    type: 'select',
    options: types.map((t) => t.type),
  };

  // Trigger filter (for job-config and advancement-rule types)
  const triggerFilter: FilterOption = {
    field: 'payload.triggerType',
    label: 'Trigger',
    type: 'select',
    options: ['schedule', 'webhook', 'manual', 'dependency'],
  };

  return [statusFilter, typeFilter, triggerFilter];
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
 * Generate metrics — trimmed to 4 cross-cutting cards (one row).
 * Removes per-type count stubs that show 0 for most types.
 * Sprint: experience-console-cleanup-v1
 */
function generateMetrics(): MetricDefinition[] {
  return [
    { id: 'total', label: 'Total', icon: 'category', query: 'count(*)' },
    { id: 'active', label: 'Active', icon: 'check_circle', query: 'count(where: meta.status=active)' },
    { id: 'draft', label: 'Draft', icon: 'edit_note', query: 'count(where: meta.status=draft)' },
    { id: 'last-updated', label: 'Last Updated', icon: 'schedule', query: 'max(updatedAt)' },
  ];
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
    defaultFilters: { 'status': 'Active' },
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
    // quickActions removed per inspector-copilot-v1: maximum minimalism
    // Users type /help or /audit directly in terminal
    quickActions: [],
  },

  // Sprint: singleton-pattern-factory-v1
  // Singleton config for per-type active enforcement
  singleton: {
    enabled: true,
    statusField: 'meta.status',
    activeValue: 'active',
    draftValue: 'draft',
    archivedValue: 'archived',
    // Per-type singletons: one active SystemPrompt, one active ResearchAgentConfig, etc.
    typeField: 'meta.type',
    versioning: {
      versionField: 'payload.version',
      previousIdField: 'payload.previousVersionId',
      changelogField: 'payload.changelog',
    },
    // TODO: Add cache invalidation endpoint when API is ready
    // cacheInvalidationEndpoint: '/api/cache/invalidate',
    // cacheInvalidationType: 'experience-config',
  },
};

// =============================================================================
// Display Configuration (preserved for component use)
// =============================================================================

/**
 * Response mode configuration for system prompts
 */
export const RESPONSE_MODE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  architect: { label: 'Architect', icon: 'architecture', color: themeColor.experience },
  librarian: { label: 'Librarian', icon: 'local_library', color: themeColor.internal },
  contemplative: { label: 'Contemplative', icon: 'psychology', color: themeColor.research },
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
