// src/bedrock/hooks/useConsoleData.ts
// Console Factory v2 - Universal Data Hook
// Sprint: console-factory-v2
//
// DEX Principle: Declarative Sovereignty
// Data operations driven by schema, not custom hook implementations.

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { ConsoleSchema, FilterDef, SortDef } from '../types/ConsoleSchema';
import type { IDataService, ServiceResponse, BaseEntity, DraftState } from '../services/types';
import { isSuccessResponse } from '../services/types';
import { getMockService, MOCK_SERVICE_REGISTRY } from '../services/mock-service';

// =============================================================================
// Types
// =============================================================================

/**
 * Filter state - maps filter IDs to selected values
 */
export type FilterState = Record<string, string | boolean | undefined>;

/**
 * Sort state
 */
export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Loading states for async operations
 */
export interface LoadingState {
  fetching: boolean;
  saving: boolean;
  deleting: boolean;
}

/**
 * Console data hook return type
 */
export interface UseConsoleDataReturn<T extends BaseEntity> {
  // Data
  items: T[];
  filteredItems: T[];
  selectedItem: T | null;

  // State
  loading: LoadingState;
  error: string | null;

  // Filters & Sort
  filters: FilterState;
  sort: SortState;
  searchQuery: string;

  // Draft state (for editing)
  draft: DraftState<T>;

  // Actions
  selectItem: (id: string | null) => void;
  setFilter: (filterId: string, value: string | boolean | undefined) => void;
  clearFilters: () => void;
  setSort: (sort: SortState) => void;
  setSearchQuery: (query: string) => void;

  // CRUD
  refresh: () => Promise<void>;
  createItem: (item: Omit<T, 'id'>) => Promise<ServiceResponse<T>>;
  updateItem: (id: string, updates: Partial<T>) => Promise<ServiceResponse<T>>;
  deleteItem: (id: string) => Promise<ServiceResponse<void>>;

  // Draft management
  loadDraft: (item: T) => void;
  updateDraft: <K extends keyof T>(field: K, value: T[K]) => void;
  saveDraft: () => Promise<ServiceResponse<T>>;
  resetDraft: () => void;
  clearDraft: () => void;

  // Metrics
  getMetricValue: (query: string) => number;
}

// =============================================================================
// Helper: Get nested value from object path
// =============================================================================

function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

// =============================================================================
// Helper: Set nested value in object path
// =============================================================================

function setNestedValue<T extends object>(obj: T, path: string, value: unknown): T {
  const parts = path.split('.');
  const result = { ...obj };
  let current: Record<string, unknown> = result as Record<string, unknown>;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    current[part] = { ...(current[part] as object || {}) };
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
  return result;
}

// =============================================================================
// Helper: Parse metric query
// =============================================================================

interface MetricQuery {
  type: 'count';
  where?: { field: string; value: string };
}

function parseMetricQuery(query: string): MetricQuery | null {
  // Parse: count(*) or count(where: field=value)
  const countAll = /^count\(\*\)$/i.exec(query);
  if (countAll) {
    return { type: 'count' };
  }

  const countWhere = /^count\(where:\s*([^=]+)=([^)]+)\)$/i.exec(query);
  if (countWhere) {
    return {
      type: 'count',
      where: { field: countWhere[1].trim(), value: countWhere[2].trim() },
    };
  }

  return null;
}

// =============================================================================
// Helper: Filter items
// =============================================================================

function applyFilters<T>(
  items: T[],
  filters: FilterState,
  filterDefs: FilterDef[]
): T[] {
  return items.filter((item) => {
    for (const def of filterDefs) {
      const filterValue = filters[def.id];
      if (filterValue === undefined || filterValue === '') continue;

      const fieldPath = def.field || def.id;
      const itemValue = getNestedValue(item, fieldPath);

      // Handle boolean filters
      if (def.type === 'boolean') {
        if (filterValue !== Boolean(itemValue)) return false;
        continue;
      }

      // Handle select filters
      if (def.type === 'select') {
        const itemStr = String(itemValue);
        const filterStr = String(filterValue);
        if (itemStr !== filterStr) return false;
      }
    }
    return true;
  });
}

// =============================================================================
// Helper: Sort items
// =============================================================================

function applySort<T>(items: T[], sort: SortState): T[] {
  return [...items].sort((a, b) => {
    const aVal = getNestedValue(a, sort.field);
    const bVal = getNestedValue(b, sort.field);

    let comparison = 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal);
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal;
    } else {
      comparison = String(aVal ?? '').localeCompare(String(bVal ?? ''));
    }

    return sort.direction === 'desc' ? -comparison : comparison;
  });
}

// =============================================================================
// Helper: Search items
// =============================================================================

function applySearch<T>(items: T[], query: string, searchFields: string[]): T[] {
  if (!query.trim()) return items;

  const lowerQuery = query.toLowerCase();
  return items.filter((item) => {
    return searchFields.some((field) => {
      const value = getNestedValue(item, field);
      return String(value ?? '').toLowerCase().includes(lowerQuery);
    });
  });
}

// =============================================================================
// Main Hook
// =============================================================================

/**
 * Universal data hook for console operations
 *
 * @param schema - Console schema definition
 * @param options - Additional options
 */
export function useConsoleData<T extends BaseEntity>(
  schema: ConsoleSchema,
  options: {
    /** Custom service (defaults to mock service) */
    service?: IDataService<T>;
    /** Additional search fields beyond schema */
    searchFields?: string[];
    /** Auto-fetch on mount */
    autoFetch?: boolean;
  } = {}
): UseConsoleDataReturn<T> {
  const {
    service = getMockService<T>(schema.id),
    searchFields = [],
    autoFetch = true,
  } = options;

  // ==========================================================================
  // State
  // ==========================================================================

  const [items, setItems] = useState<T[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<LoadingState>({
    fetching: false,
    saving: false,
    deleting: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Filters & Sort
  const [filters, setFilters] = useState<FilterState>({});
  const [sort, setSort] = useState<SortState>(() => {
    const defaultSort = schema.list.sortOptions.find(
      (s) => s.id === schema.list.defaultSort
    );
    return defaultSort
      ? { field: defaultSort.field, direction: defaultSort.direction }
      : { field: 'id', direction: 'asc' };
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Draft state
  const [draftState, setDraftState] = useState<DraftState<T>>({
    original: null,
    draft: null,
    isDirty: false,
    dirtyFields: new Set(),
  });

  // ==========================================================================
  // Computed: Selected Item
  // ==========================================================================

  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    return items.find((item) => item.id === selectedId) || null;
  }, [items, selectedId]);

  // ==========================================================================
  // Computed: Filtered & Sorted Items
  // ==========================================================================

  const filteredItems = useMemo(() => {
    let result = items;

    // Apply filters
    result = applyFilters(result, filters, schema.filters);

    // Apply search
    const allSearchFields = [
      ...searchFields,
      'meta.title',
      'meta.description',
      'name',
    ];
    result = applySearch(result, searchQuery, allSearchFields);

    // Apply sort
    result = applySort(result, sort);

    return result;
  }, [items, filters, searchQuery, sort, schema.filters, searchFields]);

  // ==========================================================================
  // CRUD Operations
  // ==========================================================================

  const refresh = useCallback(async () => {
    if (!service) {
      setError('No service available for this console');
      return;
    }

    setLoading((prev) => ({ ...prev, fetching: true }));
    setError(null);

    try {
      const data = await service.getAll();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
    } finally {
      setLoading((prev) => ({ ...prev, fetching: false }));
    }
  }, [service]);

  const createItem = useCallback(
    async (newItem: Omit<T, 'id'>): Promise<ServiceResponse<T>> => {
      if (!service) {
        return { success: false, error: 'No service available' };
      }

      setLoading((prev) => ({ ...prev, saving: true }));

      try {
        const response = await service.create(newItem);
        if (isSuccessResponse(response)) {
          setItems((prev) => [...prev, response.data]);
        }
        return response;
      } finally {
        setLoading((prev) => ({ ...prev, saving: false }));
      }
    },
    [service]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<T>): Promise<ServiceResponse<T>> => {
      if (!service) {
        return { success: false, error: 'No service available' };
      }

      setLoading((prev) => ({ ...prev, saving: true }));

      try {
        const response = await service.update(id, updates);
        if (isSuccessResponse(response)) {
          setItems((prev) =>
            prev.map((item) => (item.id === id ? response.data : item))
          );
        }
        return response;
      } finally {
        setLoading((prev) => ({ ...prev, saving: false }));
      }
    },
    [service]
  );

  const deleteItem = useCallback(
    async (id: string): Promise<ServiceResponse<void>> => {
      if (!service) {
        return { success: false, error: 'No service available' };
      }

      setLoading((prev) => ({ ...prev, deleting: true }));

      try {
        const response = await service.delete(id);
        if (response.success) {
          setItems((prev) => prev.filter((item) => item.id !== id));
          if (selectedId === id) {
            setSelectedId(null);
          }
        }
        return response;
      } finally {
        setLoading((prev) => ({ ...prev, deleting: false }));
      }
    },
    [service, selectedId]
  );

  // ==========================================================================
  // Selection
  // ==========================================================================

  const selectItem = useCallback((id: string | null) => {
    setSelectedId(id);
    // Clear draft when changing selection
    setDraftState({
      original: null,
      draft: null,
      isDirty: false,
      dirtyFields: new Set(),
    });
  }, []);

  // ==========================================================================
  // Filter Actions
  // ==========================================================================

  const setFilter = useCallback(
    (filterId: string, value: string | boolean | undefined) => {
      setFilters((prev) => ({ ...prev, [filterId]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // ==========================================================================
  // Draft Management
  // ==========================================================================

  const loadDraft = useCallback((item: T) => {
    setDraftState({
      original: item,
      draft: { ...item },
      isDirty: false,
      dirtyFields: new Set(),
    });
  }, []);

  const updateDraft = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setDraftState((prev) => {
      if (!prev.draft) return prev;

      const newDraft = { ...prev.draft, [field]: value };
      const newDirtyFields = new Set(prev.dirtyFields);
      newDirtyFields.add(field);

      // Check if actually dirty
      const isDirty = prev.original
        ? JSON.stringify(newDraft) !== JSON.stringify(prev.original)
        : true;

      return {
        ...prev,
        draft: newDraft,
        isDirty,
        dirtyFields: newDirtyFields,
      };
    });
  }, []);

  const saveDraft = useCallback(async (): Promise<ServiceResponse<T>> => {
    if (!draftState.draft || !draftState.original) {
      return { success: false, error: 'No draft to save' };
    }

    const response = await updateItem(draftState.original.id, draftState.draft);

    if (isSuccessResponse(response)) {
      // Update draft to reflect saved state
      setDraftState((prev) => ({
        ...prev,
        original: response.data,
        draft: response.data,
        isDirty: false,
        dirtyFields: new Set(),
      }));
    }

    return response;
  }, [draftState, updateItem]);

  const resetDraft = useCallback(() => {
    setDraftState((prev) => ({
      ...prev,
      draft: prev.original ? { ...prev.original } : null,
      isDirty: false,
      dirtyFields: new Set(),
    }));
  }, []);

  const clearDraft = useCallback(() => {
    setDraftState({
      original: null,
      draft: null,
      isDirty: false,
      dirtyFields: new Set(),
    });
  }, []);

  // ==========================================================================
  // Metrics
  // ==========================================================================

  const getMetricValue = useCallback(
    (query: string): number => {
      const parsed = parseMetricQuery(query);
      if (!parsed) return 0;

      if (parsed.type === 'count') {
        if (!parsed.where) {
          return items.length;
        }

        return items.filter((item) => {
          const value = getNestedValue(item, parsed.where!.field);
          return String(value) === parsed.where!.value;
        }).length;
      }

      return 0;
    },
    [items]
  );

  // ==========================================================================
  // Auto-fetch on mount
  // ==========================================================================

  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
  }, [autoFetch, refresh]);

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    // Data
    items,
    filteredItems,
    selectedItem,

    // State
    loading,
    error,

    // Filters & Sort
    filters,
    sort,
    searchQuery,

    // Draft
    draft: draftState,

    // Actions
    selectItem,
    setFilter,
    clearFilters,
    setSort,
    setSearchQuery,

    // CRUD
    refresh,
    createItem,
    updateItem,
    deleteItem,

    // Draft management
    loadDraft,
    updateDraft,
    saveDraft,
    resetDraft,
    clearDraft,

    // Metrics
    getMetricValue,
  };
}

// =============================================================================
// Export type for external use
// =============================================================================

export type { ConsoleSchema };
