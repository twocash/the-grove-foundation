// src/bedrock/consoles/NurseryConsole/useSproutAggregations.ts
// Sprint: S6-SL-ObservableSignals v1
// Epic 8: Fetch sprout signal aggregations from Supabase

import { useState, useEffect, useCallback } from 'react';
import type { SignalAggregation } from '@core/schema/sprout-signals';
import { createEmptyAggregation } from '@core/schema/sprout-signals';
import { createClient } from '@supabase/supabase-js';

// Lazy singleton Supabase client
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      console.warn('Supabase credentials not configured');
      return null;
    }

    supabaseClient = createClient(url, anonKey);
  }
  return supabaseClient;
}

export interface UseSproutAggregationsResult {
  /** Current aggregation data */
  aggregation: SignalAggregation | null;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refetch aggregation data */
  refetch: () => Promise<void>;
  /** Trigger refresh of aggregation (calls Supabase RPC) */
  refreshAggregation: () => Promise<void>;
  /** Change the aggregation period */
  setPeriod: (period: SignalAggregation['period']) => void;
  /** Current period */
  period: SignalAggregation['period'];
}

/**
 * Hook to fetch signal aggregations for a sprout from Supabase.
 *
 * @param sproutId - The ID of the sprout to fetch aggregations for
 * @param initialPeriod - Initial aggregation period (default: 'all_time')
 */
export function useSproutAggregations(
  sproutId: string | undefined,
  initialPeriod: SignalAggregation['period'] = 'all_time'
): UseSproutAggregationsResult {
  const [aggregation, setAggregation] = useState<SignalAggregation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<SignalAggregation['period']>(initialPeriod);

  const fetchAggregation = useCallback(async () => {
    if (!sproutId) {
      setAggregation(null);
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      // Create empty aggregation when Supabase is not configured
      setAggregation(createEmptyAggregation(sproutId, period));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await client
        .from('document_signal_aggregations')
        .select('*')
        .eq('document_id', sproutId)
        .eq('period', period)
        .single();

      if (fetchError) {
        // If no aggregation exists yet, create an empty one
        if (fetchError.code === 'PGRST116') {
          setAggregation(createEmptyAggregation(sproutId, period));
          return;
        }
        throw fetchError;
      }

      // Transform snake_case to camelCase
      const transformed: SignalAggregation = {
        sproutId: data.document_id,
        period: data.period,
        viewCount: data.view_count,
        retrievalCount: data.retrieval_count,
        referenceCount: data.reference_count,
        searchAppearances: data.search_appearances,
        upvotes: data.upvotes,
        downvotes: data.downvotes,
        utilityScore: data.utility_score,
        exportCount: data.export_count,
        promotionCount: data.promotion_count,
        refinementCount: data.refinement_count,
        uniqueSessions: data.unique_sessions,
        uniqueUsers: data.unique_users,
        uniqueLenses: data.unique_lenses,
        uniqueHubs: data.unique_hubs,
        uniqueQueries: data.unique_queries,
        diversityIndex: data.diversity_index,
        firstEventAt: data.first_event_at,
        lastEventAt: data.last_event_at,
        daysActive: data.days_active,
        qualityScore: data.quality_score,
        advancementEligible: data.advancement_eligible,
        computedAt: data.computed_at,
      };

      setAggregation(transformed);
    } catch (err) {
      console.error('Failed to fetch signal aggregation:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch aggregation');
      setAggregation(createEmptyAggregation(sproutId, period));
    } finally {
      setLoading(false);
    }
  }, [sproutId, period]);

  const refreshAggregation = useCallback(async () => {
    if (!sproutId) return;

    const client = getSupabaseClient();
    if (!client) {
      console.warn('Supabase not configured, cannot refresh aggregation');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call the RPC function to refresh aggregations
      const { error: rpcError } = await client.rpc('refresh_document_aggregations', {
        document_id: sproutId,
        period,
      });

      if (rpcError) throw rpcError;

      // Refetch the updated aggregation
      await fetchAggregation();
    } catch (err) {
      console.error('Failed to refresh aggregation:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setLoading(false);
    }
  }, [sproutId, period, fetchAggregation]);

  // Fetch on mount and when sproutId/period changes
  useEffect(() => {
    fetchAggregation();
  }, [fetchAggregation]);

  return {
    aggregation,
    loading,
    error,
    refetch: fetchAggregation,
    refreshAggregation,
    setPeriod,
    period,
  };
}

export default useSproutAggregations;
