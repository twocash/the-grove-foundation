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
  useEffect,
  type ReactNode,
} from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
  RESEARCH_SPROUTS_TABLE,
} from '@core/schema/research-sprout-registry';

// =============================================================================
// Supabase Client Singleton
// =============================================================================

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[ResearchSproutContext] Supabase credentials not configured');
    return null;
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

/**
 * Transform database row to ResearchSprout
 */
function rowToSprout(row: Record<string, unknown>): ResearchSprout {
  return {
    id: row.id as string,
    spark: row.spark as string,
    title: row.title as string,
    groveId: row.grove_id as string,
    status: row.status as ResearchSproutStatus,
    strategy: row.strategy as ResearchSprout['strategy'],
    branches: (row.branches as ResearchSprout['branches']) || [],
    evidence: (row.evidence as ResearchSprout['evidence']) || [],
    synthesis: row.synthesis as ResearchSprout['synthesis'] | null,
    execution: row.execution as ResearchSprout['execution'] | null,
    statusHistory: (row.status_history as ResearchSprout['statusHistory']) || [],
    appliedRuleIds: (row.applied_rule_ids as string[]) || [],
    inferenceConfidence: row.inference_confidence as number | null,
    groveConfigSnapshot: row.grove_config_snapshot as ResearchSprout['groveConfigSnapshot'],
    architectSessionId: row.architect_session_id as string | null,
    parentSproutId: row.parent_sprout_id as string | null,
    childSproutIds: (row.child_sprout_ids as string[]) || [],
    creatorId: row.creator_id as string | undefined,
    sessionId: row.session_id as string | undefined,
    tags: (row.tags as string[]) || [],
    notes: row.notes as string | undefined,
    rating: row.rating as number | undefined,
    reviewed: row.reviewed as boolean | undefined,
    requiresReview: row.requires_review as boolean | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * Transform ResearchSprout to database row format
 */
function sproutToRow(sprout: Partial<ResearchSprout> & { groveId: string }): Record<string, unknown> {
  const row: Record<string, unknown> = {};

  if (sprout.id !== undefined) row.id = sprout.id;
  if (sprout.spark !== undefined) row.spark = sprout.spark;
  if (sprout.title !== undefined) row.title = sprout.title;
  if (sprout.groveId !== undefined) row.grove_id = sprout.groveId;
  if (sprout.status !== undefined) row.status = sprout.status;
  if (sprout.strategy !== undefined) row.strategy = sprout.strategy;
  if (sprout.branches !== undefined) row.branches = sprout.branches;
  if (sprout.evidence !== undefined) row.evidence = sprout.evidence;
  if (sprout.synthesis !== undefined) row.synthesis = sprout.synthesis;
  if (sprout.execution !== undefined) row.execution = sprout.execution;
  if (sprout.statusHistory !== undefined) row.status_history = sprout.statusHistory;
  if (sprout.appliedRuleIds !== undefined) row.applied_rule_ids = sprout.appliedRuleIds;
  if (sprout.inferenceConfidence !== undefined) row.inference_confidence = sprout.inferenceConfidence;
  if (sprout.groveConfigSnapshot !== undefined) row.grove_config_snapshot = sprout.groveConfigSnapshot;
  if (sprout.architectSessionId !== undefined) row.architect_session_id = sprout.architectSessionId;
  if (sprout.parentSproutId !== undefined) row.parent_sprout_id = sprout.parentSproutId;
  if (sprout.childSproutIds !== undefined) row.child_sprout_ids = sprout.childSproutIds;
  if (sprout.creatorId !== undefined) row.creator_id = sprout.creatorId;
  if (sprout.sessionId !== undefined) row.session_id = sprout.sessionId;
  if (sprout.tags !== undefined) row.tags = sprout.tags;
  if (sprout.notes !== undefined) row.notes = sprout.notes;
  if (sprout.rating !== undefined) row.rating = sprout.rating;
  if (sprout.reviewed !== undefined) row.reviewed = sprout.reviewed;
  if (sprout.requiresReview !== undefined) row.requires_review = sprout.requiresReview;
  if (sprout.createdAt !== undefined) row.created_at = sprout.createdAt;
  if (sprout.updatedAt !== undefined) row.updated_at = sprout.updatedAt;

  return row;
}

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

  /** Add a child sprout ID to parent's childSproutIds array (Sprint: sprout-research-v1, Phase 5d) */
  addChildSproutId: (
    parentId: string,
    childId: string
  ) => Promise<void>;

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
 * Fetch sprouts from Supabase for a grove
 */
async function fetchSproutsFromSupabase(groveId: string): Promise<ResearchSprout[]> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('[ResearchSproutContext] No Supabase client, returning empty array');
    return [];
  }

  try {
    const { data, error } = await client
      .from(RESEARCH_SPROUTS_TABLE)
      .select('*')
      .eq('grove_id', groveId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[ResearchSproutContext] Fetch error:', error.message);
      throw new Error(error.message);
    }

    return (data || []).map(rowToSprout);
  } catch (e) {
    console.error('[ResearchSproutContext] Failed to fetch sprouts:', e);
    throw e;
  }
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

  // Initialize for a grove - fetch sprouts from Supabase
  const initialize = useCallback(async (newGroveId: string) => {
    setIsLoading(true);
    setError(null);
    setGroveId(newGroveId);

    try {
      const fetchedSprouts = await fetchSproutsFromSupabase(newGroveId);
      setSprouts(fetchedSprouts);
      console.log(`[ResearchSproutContext] Loaded ${fetchedSprouts.length} sprouts for grove ${newGroveId}`);
    } catch (e) {
      console.error('[ResearchSproutContext] Initialize error:', e);
      setError(e instanceof Error ? e.message : 'Failed to initialize');
      setSprouts([]); // Fallback to empty state
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new sprout - persist to Supabase
  const create = useCallback(async (input: CreateResearchSproutInput): Promise<ResearchSprout> => {
    if (!groveId) {
      throw new Error('Context not initialized with groveId');
    }

    // Create sprout with factory function (generates all default values)
    const sproutData = createResearchSprout({
      ...input,
      groveId,
    });

    // Persist to Supabase
    const client = getSupabaseClient();
    if (!client) {
      // Fallback to in-memory only (for development without Supabase)
      const fallbackSprout: ResearchSprout = {
        ...sproutData,
        id: `rs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      console.warn('[ResearchSproutContext] No Supabase client, using in-memory only');
      setSprouts(prev => [fallbackSprout, ...prev]);
      return fallbackSprout;
    }

    try {
      // Convert to database row format (let Supabase generate UUID)
      const row = sproutToRow(sproutData);
      delete row.id; // Let Supabase generate the UUID

      const { data, error } = await client
        .from(RESEARCH_SPROUTS_TABLE)
        .insert(row)
        .select()
        .single();

      if (error) {
        console.error('[ResearchSproutContext] Insert error:', error.message);
        throw new Error(`Failed to save sprout: ${error.message}`);
      }

      const newSprout = rowToSprout(data);
      console.log(`[ResearchSproutContext] Created sprout ${newSprout.id}: "${newSprout.title}"`);

      // Update local state
      setSprouts(prev => [newSprout, ...prev]);

      return newSprout;
    } catch (e) {
      console.error('[ResearchSproutContext] Create error:', e);
      throw e;
    }
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

  // Add child sprout ID to parent (Sprint: sprout-research-v1, Phase 5d)
  const addChildSproutId = useCallback(async (
    parentId: string,
    childId: string
  ): Promise<void> => {
    const parent = sprouts.find(s => s.id === parentId);
    if (!parent) {
      throw new Error(`Parent sprout not found: ${parentId}`);
    }

    // Avoid duplicates
    if (parent.childSproutIds.includes(childId)) {
      return;
    }

    const updated: ResearchSprout = {
      ...parent,
      childSproutIds: [...parent.childSproutIds, childId],
      updatedAt: new Date().toISOString(),
    };

    // TODO Phase 2d: Update in Supabase
    setSprouts(prev => prev.map(s => s.id === parentId ? updated : s));
  }, [sprouts]);

  // Select sprout
  const selectSprout = useCallback((id: string | null) => {
    setSelectedSproutId(id);
  }, []);

  // Refresh from Supabase
  const refresh = useCallback(async () => {
    if (!groveId) return;

    setIsLoading(true);
    setError(null);

    try {
      const fetchedSprouts = await fetchSproutsFromSupabase(groveId);
      setSprouts(fetchedSprouts);
      console.log(`[ResearchSproutContext] Refreshed ${fetchedSprouts.length} sprouts`);
    } catch (e) {
      console.error('[ResearchSproutContext] Refresh error:', e);
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

  // Auto-initialize when initialGroveId is provided
  useEffect(() => {
    if (initialGroveId && sprouts.length === 0 && !isLoading) {
      console.log(`[ResearchSproutContext] Auto-initializing for grove: ${initialGroveId}`);
      initialize(initialGroveId);
    }
  }, [initialGroveId, initialize, sprouts.length, isLoading]);

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
    addChildSproutId,
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
    addChildSproutId,
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
