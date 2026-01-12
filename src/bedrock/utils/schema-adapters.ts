// src/bedrock/utils/schema-adapters.ts
// Console Factory v2 - Schema Adapters
// Sprint: console-factory-v2
//
// DEX Principle: Organic Scalability
// Adapters bridge new schema format to existing components without
// requiring changes to working UI components.

import type { FilterDef, SortDef, InspectorField } from '../types/ConsoleSchema';
import type { FilterOption, FilterValue, SortOption } from '../patterns/collection-view.types';

// =============================================================================
// Filter Adapters
// =============================================================================

/**
 * Convert ConsoleSchema FilterDef to FilterBar FilterOption
 *
 * @param filterDef - Schema filter definition
 * @param counts - Optional map of value -> count for showing counts
 */
export function toFilterOption(
  filterDef: FilterDef,
  counts?: Record<string, number>
): FilterOption {
  // Determine field path (use field if provided, otherwise id)
  const key = filterDef.field || filterDef.id;

  // Build filter values from options
  const values: FilterValue[] = filterDef.options?.map((opt) => ({
    value: opt,
    label: formatFilterLabel(opt),
    count: counts?.[opt],
  })) || [];

  // For boolean filters, create true/false options
  if (filterDef.type === 'boolean' && values.length === 0) {
    values.push(
      { value: 'true', label: 'Yes', count: counts?.['true'] },
      { value: 'false', label: 'No', count: counts?.['false'] }
    );
  }

  return {
    key,
    label: filterDef.label,
    values,
    multiple: false, // Default to single selection
  };
}

/**
 * Convert array of FilterDef to FilterOption array
 */
export function toFilterOptions(
  filterDefs: FilterDef[],
  countsMap?: Record<string, Record<string, number>>
): FilterOption[] {
  return filterDefs.map((def) => toFilterOption(def, countsMap?.[def.id]));
}

/**
 * Format filter value for display
 * Converts technical values to human-readable labels
 */
function formatFilterLabel(value: string): string {
  // Handle boolean strings
  if (value === 'true') return 'Yes';
  if (value === 'false') return 'No';

  // Handle snake_case or kebab-case
  const cleaned = value.replace(/[-_]/g, ' ');

  // Capitalize first letter of each word
  return cleaned
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// =============================================================================
// Sort Adapters
// =============================================================================

/**
 * Convert ConsoleSchema SortDef to SortDropdown SortOption
 */
export function toSortOption(sortDef: SortDef): SortOption {
  return {
    field: sortDef.field,
    label: sortDef.label,
    defaultDirection: sortDef.direction,
  };
}

/**
 * Convert array of SortDef to SortOption array
 */
export function toSortOptions(sortDefs: SortDef[]): SortOption[] {
  return sortDefs.map(toSortOption);
}

// =============================================================================
// Inspector Field Adapters
// =============================================================================

/**
 * Group inspector fields by section
 */
export function groupFieldsBySection(
  fields: InspectorField[]
): Record<string, InspectorField[]> {
  const groups: Record<string, InspectorField[]> = {};

  for (const field of fields) {
    if (!groups[field.section]) {
      groups[field.section] = [];
    }
    groups[field.section].push(field);
  }

  return groups;
}

/**
 * Get field value from object using path
 *
 * @param obj - Source object
 * @param path - Dot-notation path (e.g., 'meta.title', 'payload.flagId')
 */
export function getFieldValue<T>(obj: T, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Set field value in object using path (returns new object)
 *
 * @param obj - Source object
 * @param path - Dot-notation path
 * @param value - Value to set
 */
export function setFieldValue<T extends object>(
  obj: T,
  path: string,
  value: unknown
): T {
  const parts = path.split('.');
  const result = deepClone(obj);
  let current: Record<string, unknown> = result as Record<string, unknown>;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    } else {
      current[part] = { ...(current[part] as object) };
    }
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
  return result;
}

/**
 * Deep clone an object
 */
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepClone) as unknown as T;
  const cloned: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone((obj as Record<string, unknown>)[key]);
    }
  }
  return cloned as T;
}

// =============================================================================
// Metric Adapters
// =============================================================================

/**
 * Parse metric query and evaluate against items
 *
 * Supported queries:
 * - count(*) - count all items
 * - count(where: field=value) - count items matching condition
 *
 * @param query - Pseudo-SQL query string
 * @param items - Array of items to evaluate
 */
export function evaluateMetricQuery<T>(query: string, items: T[]): number {
  // count(*)
  if (query.trim() === 'count(*)') {
    return items.length;
  }

  // count(where: field=value)
  const whereMatch = /^count\(where:\s*([^=]+)=([^)]+)\)$/i.exec(query.trim());
  if (whereMatch) {
    const field = whereMatch[1].trim();
    const expectedValue = whereMatch[2].trim();

    return items.filter((item) => {
      const actualValue = getFieldValue(item, field);
      return String(actualValue) === expectedValue;
    }).length;
  }

  // Unknown query
  console.warn(`Unknown metric query: ${query}`);
  return 0;
}

// =============================================================================
// Collection View Config Adapter
// =============================================================================

import type { ConsoleSchema } from '../types/ConsoleSchema';
import type { CollectionViewConfig } from '../patterns/collection-view.types';

/**
 * Convert ConsoleSchema to CollectionViewConfig
 * Bridges schema format to existing collection view pattern
 */
export function toCollectionViewConfig(
  schema: ConsoleSchema,
  options: {
    /** Storage key prefix for favorites */
    storagePrefix?: string;
  } = {}
): CollectionViewConfig {
  const { storagePrefix = 'grove' } = options;

  // Find default sort
  const defaultSortDef = schema.list.sortOptions.find(
    (s) => s.id === schema.list.defaultSort
  ) || schema.list.sortOptions[0];

  return {
    searchFields: ['meta.title', 'meta.description', 'name'],
    filterOptions: toFilterOptions(schema.filters),
    sortOptions: toSortOptions(schema.list.sortOptions),
    defaultSort: {
      field: defaultSortDef?.field || 'id',
      direction: defaultSortDef?.direction || 'asc',
    },
    defaultFilters: {},
    favoritesStorageKey: `${storagePrefix}-${schema.id}-favorites`,
  };
}
