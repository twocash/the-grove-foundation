// src/explore/context/ResearchSproutContext.tsx
// Research Sprout Context - Provides access to research sprouts in /explore
// Sprint: sprout-research-v1, Phase 2c
//
// This context manages ResearchSprout state and operations for a grove.
// Initially uses in-memory state; Supabase integration comes in Phase 2d.

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  ResearchSprout,
  ResearchSproutStatus,
  CreateResearchSproutInput,
  StatusTransition,
} from '@core/schema/research-sprout';
import {
  createResearchSprout,
  canTransitionTo,
} from '@core/schema/research-sprout';
import type { FilterPresetId } from '@core/schema/research-sprout-registry';
import {
  FILTER_PRESETS,
  DEFAULT_PAGE_SIZE,
} from '@core/schema/research-sprout-registry';

// =============================================================================
// Types
// =============================================================================

/**
 * Query options for listing sprouts
 */
export interface SproutQueryOptions {
  /** Filter preset to apply */
  filterPreset?: FilterPresetId;

  /** Custom status filter (overrides preset) */
  statuses?: ResearchSproutStatus[];

  /** Parent sprout ID (for child queries) */
  parentSproutId?: string | null;

  /** Tag filter */
  tags?: string[];

  /** Search term (matches spark, title) */
  search?: string;

  /** Page number (1-indexed) */
  page?: number;

  /** Page size */
  pageSize?: number;
}

/**
 * Result of a sprout query
 */
export interface SproutQueryResult {
  /** Matching sprouts */
  sprouts: ResearchSprout[];

  /** Total count (for pagination) */
  total: number;

  /** Whether there are more pages */
  hasMore: boolean;
}

/**
 * Context state
 */
interface ResearchSproutState {
  /** All sprouts for this grove (in-memory cache) */
  sprouts: ResearchSprout[];

  /** Currently selected sprout ID */
  selectedSproutId: string | null;

  /** Loading state */
  isLoading: boolean;

  /** Error message if any */
  error: string | null;

  /** Current grove ID */
  groveId: string | null;
}

/**
 * Context actions
 */
interface ResearchSproutActions {
  /** Initialize context for a grove */
  initialize: (groveId: string) => Promise<void>;

  /** Create a new research sprout */
  create: (input: CreateResearchSproutInput) => Promise<ResearchSprout>;

  /** Get a sprout by ID */
  getById: (id: string) => ResearchSprout | undefined;

  /** Query sprouts with filters */
  query: (options?: SproutQueryOptions) => SproutQueryResult;

  /** Transition sprout status */
  transitionStatus: (
    id: string,
    newStatus: ResearchSproutStatus,
    reason: string,
    actor?: string
  ) => Promise<ResearchSprout>;

  /** Update sprout fields (tags, notes, rating, etc.) */
  update: (
    id: string,
    updates: Partial<Pick<ResearchSprout, 'tags' | 'notes' | 'rating' | 'reviewed'>>
  ) => Promise<ResearchSprout>;

  /** Update sprout with research results (branches, evidence, synthesis, execution) */
  updateResults: (
    id: string,
    updates: Partial<Pick<ResearchSprout, 'branches' | 'evidence' | 'synthesis' | 'execution' | 'requiresReview'>>
  ) => Promise<ResearchSprout>;

  /** Select a sprout for detail view */
  selectSprout: (id: string | null) => void;

  /** Refresh sprouts from server */
  refresh: () => Promise<void>;

  /** Get child sprouts of a parent */
  getChildren: (parentId: string) => ResearchSprout[];

  /** Get sprout counts by status */
  getStatusCounts: () => Record<ResearchSproutStatus, number>;
}

type ResearchSproutContextValue = ResearchSproutState & ResearchSproutActions;

// =============================================================================
// Context
// =============================================================================

const ResearchSproutContext = createContext<ResearchSproutContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

interface ResearchSproutProviderProps {
  children: ReactNode;
  /** Optional initial grove ID */
  initialGroveId?: string;
}

/**
 * Generate a UUID (simple implementation for MVP)
 */
function generateId(): string {
  return 'rs-' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export function ResearchSproutProvider({
  children,
  initialGroveId,
}: ResearchSproutProviderProps) {
  // State
  const [sprouts, setSprouts] = useState<ResearchSprout[]>([]);
  const [selectedSproutId, setSelectedSproutId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groveId, setGroveId] = useState<string | null>(initialGroveId ?? null);

  // Initialize for a grove
  const initialize = useCallback(async (newGroveId: string) => {
    setIsLoading(true);
    setError(null);
    setGroveId(newGroveId);

    try {
      // TODO Phase 2d: Fetch from Supabase
      // For now, start with empty state
      setSprouts([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to initialize');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new sprout
  const create = useCallback(async (input: CreateResearchSproutInput): Promise<ResearchSprout> => {
    if (!groveId) {
      throw new Error('Context not initialized with groveId');
    }

    // Create sprout with factory function
    const sproutData = createResearchSprout({
      ...input,
      groveId,
    });

    // Add ID
    const newSprout: ResearchSprout = {
      ...sproutData,
      id: generateId(),
    };

    // TODO Phase 2d: Insert into Supabase
    setSprouts(prev => [newSprout, ...prev]);

    return newSprout;
  }, [groveId]);

  // Get by ID
  const getById = useCallback((id: string): ResearchSprout | undefined => {
    return sprouts.find(s => s.id === id);
  }, [sprouts]);

  // Query with filters
  const query = useCallback((options: SproutQueryOptions = {}): SproutQueryResult => {
    let filtered = [...sprouts];

    // Apply filter preset or custom statuses
    if (options.statuses) {
      filtered = filtered.filter(s => options.statuses!.includes(s.status));
    } else if (options.filterPreset) {
      const preset = FILTER_PRESETS[options.filterPreset];
      filtered = filtered.filter(s => preset.statuses.includes(s.status));
    }

    // Parent filter
    if (options.parentSproutId !== undefined) {
      filtered = filtered.filter(s => s.parentSproutId === options.parentSproutId);
    }

    // Tag filter
    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(s =>
        options.tags!.some(tag => s.tags.includes(tag))
      );
    }

    // Search filter
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter(s =>
        s.spark.toLowerCase().includes(searchLower) ||
        s.title.toLowerCase().includes(searchLower)
      );
    }

    // Sort by updatedAt descending
    filtered.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    // Pagination
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    return {
      sprouts: paged,
      total: filtered.length,
      hasMore: start + pageSize < filtered.length,
    };
  }, [sprouts]);

  // Transition status
  const transitionStatus = useCallback(async (
    id: string,
    newStatus: ResearchSproutStatus,
    reason: string,
    actor?: string
  ): Promise<ResearchSprout> => {
    const sprout = sprouts.find(s => s.id === id);
    if (!sprout) {
      throw new Error(`Sprout not found: ${id}`);
    }

    if (!canTransitionTo(sprout.status, newStatus)) {
      throw new Error(
        `Invalid status transition: ${sprout.status} → ${newStatus}`
      );
    }

    const now = new Date().toISOString();
    const transition: StatusTransition = {
      from: sprout.status,
      to: newStatus,
      reason,
      transitionedAt: now,
      actor: actor ?? 'system',
    };

    const updated: ResearchSprout = {
      ...sprout,
      status: newStatus,
      statusHistory: [...sprout.statusHistory, transition],
      updatedAt: now,
    };

    // TODO Phase 2d: Update in Supabase
    setSprouts(prev => prev.map(s => s.id === id ? updated : s));

    return updated;
  }, [sprouts]);

  // Update sprout fields
  const update = useCallback(async (
    id: string,
    updates: Partial<Pick<ResearchSprout, 'tags' | 'notes' | 'rating' | 'reviewed'>>
  ): Promise<ResearchSprout> => {
    const sprout = sprouts.find(s => s.id === id);
    if (!sprout) {
      throw new Error(`Sprout not found: ${id}`);
    }

    const updated: ResearchSprout = {
      ...sprout,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // TODO Phase 2d: Update in Supabase
    setSprouts(prev => prev.map(s => s.id === id ? updated : s));

    return updated;
  }, [sprouts]);

  // Update sprout with research results (Sprint: sprout-research-v1, Phase 5c)
  const updateResults = useCallback(async (
    id: string,
    updates: Partial<Pick<ResearchSprout, 'branches' | 'evidence' | 'synthesis' | 'execution' | 'requiresReview'>>
  ): Promise<ResearchSprout> => {
    const sprout = sprouts.find(s => s.id === id);
    if (!sprout) {
      throw new Error(`Sprout not found: ${id}`);
    }

    const updated: ResearchSprout = {
      ...sprout,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // TODO Phase 2d: Update in Supabase
    setSprouts(prev => prev.map(s => s.id === id ? updated : s));

    return updated;
  }, [sprouts]);

  // Select sprout
  const selectSprout = useCallback((id: string | null) => {
    setSelectedSproutId(id);
  }, []);

  // Refresh from server
  const refresh = useCallback(async () => {
    if (!groveId) return;

    setIsLoading(true);
    setError(null);

    try {
      // TODO Phase 2d: Fetch from Supabase
      // For now, no-op
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to refresh');
    } finally {
      setIsLoading(false);
    }
  }, [groveId]);

  // Get children of a parent
  const getChildren = useCallback((parentId: string): ResearchSprout[] => {
    return sprouts.filter(s => s.parentSproutId === parentId);
  }, [sprouts]);

  // Get status counts
  const getStatusCounts = useCallback((): Record<ResearchSproutStatus, number> => {
    const counts: Record<ResearchSproutStatus, number> = {
      pending: 0,
      active: 0,
      paused: 0,
      blocked: 0,
      completed: 0,
      archived: 0,
    };

    for (const sprout of sprouts) {
      counts[sprout.status]++;
    }

    return counts;
  }, [sprouts]);

  // Memoized context value
  const value = useMemo<ResearchSproutContextValue>(() => ({
    // State
    sprouts,
    selectedSproutId,
    isLoading,
    error,
    groveId,
    // Actions
    initialize,
    create,
    getById,
    query,
    transitionStatus,
    update,
    updateResults,
    selectSprout,
    refresh,
    getChildren,
    getStatusCounts,
  }), [
    sprouts,
    selectedSproutId,
    isLoading,
    error,
    groveId,
    initialize,
    create,
    getById,
    query,
    transitionStatus,
    update,
    updateResults,
    selectSprout,
    refresh,
    getChildren,
    getStatusCounts,
  ]);

  return (
    <ResearchSproutContext.Provider value={value}>
      {children}
    </ResearchSproutContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Access research sprout context
 */
export function useResearchSprouts(): ResearchSproutContextValue {
  const context = useContext(ResearchSproutContext);
  if (!context) {
    throw new Error(
      'useResearchSprouts must be used within a ResearchSproutProvider'
    );
  }
  return context;
}

/**
 * Convenience hook: get a single sprout by ID
 */
export function useResearchSprout(id: string | null): ResearchSprout | undefined {
  const { getById } = useResearchSprouts();
  return id ? getById(id) : undefined;
}

/**
 * Convenience hook: get currently selected sprout
 */
export function useSelectedResearchSprout(): ResearchSprout | undefined {
  const { selectedSproutId, getById } = useResearchSprouts();
  return selectedSproutId ? getById(selectedSproutId) : undefined;
}

// =============================================================================
// Exports
// =============================================================================

export type {
  ResearchSproutState,
  ResearchSproutActions,
  ResearchSproutContextValue,
  SproutQueryOptions,
  SproutQueryResult,
};
