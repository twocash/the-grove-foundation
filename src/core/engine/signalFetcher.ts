// src/core/engine/signalFetcher.ts
// Sprint: S7-SL-AutoAdvancement v1
// Fetches observable signals from the signal_aggregations table
//
// DEX: Provenance as Infrastructure - Signal snapshots at evaluation time
// DEX: Capability Agnosticism - Pure data fetching, no model dependencies

import type { ObservableSignals } from '@core/schema/advancement';
import { DEFAULT_SIGNALS } from '@core/schema/advancement';

// =============================================================================
// Signal Aggregation Row (from Supabase)
// =============================================================================

/**
 * Row shape from sprout_signal_aggregations table
 */
export interface SignalAggregationRow {
  id: string;
  sprout_id: string;
  period: 'all_time' | 'last_30d' | 'last_7d';
  // Retrieval signals
  view_count: number;
  retrieval_count: number;
  reference_count: number;
  search_appearances: number;
  // Utility signals
  upvotes: number;
  downvotes: number;
  utility_score: number;
  export_count: number;
  promotion_count: number;
  refinement_count: number;
  // Diversity signals
  unique_sessions: number;
  unique_users: number;
  unique_lenses: number;
  unique_hubs: number;
  unique_queries: number;
  diversity_index: number;
  // Timeline
  first_event_at: string | null;
  last_event_at: string | null;
  days_active: number;
  // Computed
  quality_score: number;
  advancement_eligible: boolean;
  computed_at: string;
}

// =============================================================================
// Signal Mapping
// =============================================================================

/**
 * Map aggregation row to ObservableSignals interface.
 * This is the key mapping between S6 (aggregations) and S7 (advancement).
 *
 * Mapping:
 * - retrievals = retrieval_count (times retrieved in search)
 * - citations = reference_count (times cited/referenced)
 * - queryDiversity = diversity_index (0-1 score)
 * - utilityScore = utility_score (normalized -1 to 1, we clamp to 0-1)
 */
export function mapAggregationToSignals(row: SignalAggregationRow): ObservableSignals {
  return {
    retrievals: row.retrieval_count ?? 0,
    citations: row.reference_count ?? 0,
    queryDiversity: row.diversity_index ?? 0,
    // Utility score is -1 to 1 in DB, normalize to 0-1 for advancement
    utilityScore: normalizeUtilityScore(row.utility_score ?? 0),
    lastUpdated: row.computed_at,
  };
}

/**
 * Normalize utility score from -1..1 range to 0..1 range
 */
export function normalizeUtilityScore(score: number): number {
  // Clamp to valid range first
  const clamped = Math.max(-1, Math.min(1, score));
  // Map -1..1 to 0..1
  return (clamped + 1) / 2;
}

// =============================================================================
// Signal Fetcher Interface
// =============================================================================

/**
 * Options for fetching signals
 */
export interface FetchSignalsOptions {
  /** Which aggregation period to use */
  period?: 'all_time' | 'last_30d' | 'last_7d';
}

/**
 * Supabase client interface (minimal for type safety)
 */
export interface SupabaseClientLike {
  from(table: string): {
    select(columns?: string): {
      eq(column: string, value: unknown): {
        single(): Promise<{ data: SignalAggregationRow | null; error: unknown }>;
      };
      in(column: string, values: unknown[]): Promise<{ data: SignalAggregationRow[] | null; error: unknown }>;
    };
  };
}

// =============================================================================
// Signal Fetcher Functions
// =============================================================================

/**
 * Fetch observable signals for a single sprout.
 *
 * @param supabase - Supabase client
 * @param sproutId - The sprout ID
 * @param options - Fetch options
 * @returns ObservableSignals or defaults if not found
 */
export async function fetchSignalsForSprout(
  supabase: SupabaseClientLike,
  sproutId: string,
  options: FetchSignalsOptions = {}
): Promise<ObservableSignals> {
  const period = options.period ?? 'all_time';

  try {
    const { data, error } = await supabase
      .from('sprout_signal_aggregations')
      .select('*')
      .eq('sprout_id', sproutId)
      .eq('period', period)
      .single();

    if (error || !data) {
      console.warn(`No signals found for sprout ${sproutId}, using defaults`);
      return { ...DEFAULT_SIGNALS };
    }

    return mapAggregationToSignals(data);
  } catch (err) {
    console.error(`Error fetching signals for sprout ${sproutId}:`, err);
    return { ...DEFAULT_SIGNALS };
  }
}

/**
 * Fetch observable signals for multiple sprouts (batch).
 * More efficient than individual fetches for batch processing.
 *
 * @param supabase - Supabase client
 * @param sproutIds - Array of sprout IDs
 * @param options - Fetch options
 * @returns Map of sprout ID to ObservableSignals
 */
export async function fetchSignalsForSprouts(
  supabase: SupabaseClientLike,
  sproutIds: string[],
  options: FetchSignalsOptions = {}
): Promise<Map<string, ObservableSignals>> {
  const period = options.period ?? 'all_time';
  const result = new Map<string, ObservableSignals>();

  // Initialize all with defaults
  for (const id of sproutIds) {
    result.set(id, { ...DEFAULT_SIGNALS });
  }

  if (sproutIds.length === 0) {
    return result;
  }

  try {
    const { data, error } = await supabase
      .from('sprout_signal_aggregations')
      .select('*')
      .eq('period', period)
      .in('sprout_id', sproutIds);

    if (error) {
      console.error('Error fetching batch signals:', error);
      return result;
    }

    // Map results to sprout IDs
    if (data) {
      for (const row of data) {
        result.set(row.sprout_id, mapAggregationToSignals(row));
      }
    }

    return result;
  } catch (err) {
    console.error('Error in batch signal fetch:', err);
    return result;
  }
}

/**
 * Create a signal getter function for use with evaluateAdvancementBatch.
 * Returns a function that looks up signals from a pre-fetched map.
 *
 * @param signalsMap - Pre-fetched signals map
 * @returns Async function compatible with evaluateAdvancementBatch
 */
export function createSignalGetter(
  signalsMap: Map<string, ObservableSignals>
): (sproutId: string) => Promise<ObservableSignals> {
  return async (sproutId: string) => {
    return signalsMap.get(sproutId) ?? { ...DEFAULT_SIGNALS };
  };
}

// =============================================================================
// Extended Signal Data (for UI/debugging)
// =============================================================================

/**
 * Extended signal data including raw aggregation values
 */
export interface ExtendedSignalData extends ObservableSignals {
  /** Raw aggregation row (for debugging) */
  raw?: Partial<SignalAggregationRow>;
  /** Quality score from aggregation */
  qualityScore?: number;
  /** Whether pre-marked as advancement eligible */
  advancementEligible?: boolean;
}

/**
 * Fetch extended signal data with raw values.
 * Useful for UI display and debugging.
 */
export async function fetchExtendedSignals(
  supabase: SupabaseClientLike,
  sproutId: string,
  options: FetchSignalsOptions = {}
): Promise<ExtendedSignalData> {
  const period = options.period ?? 'all_time';

  try {
    const { data, error } = await supabase
      .from('sprout_signal_aggregations')
      .select('*')
      .eq('sprout_id', sproutId)
      .eq('period', period)
      .single();

    if (error || !data) {
      return { ...DEFAULT_SIGNALS };
    }

    return {
      ...mapAggregationToSignals(data),
      raw: {
        view_count: data.view_count,
        retrieval_count: data.retrieval_count,
        reference_count: data.reference_count,
        unique_sessions: data.unique_sessions,
        unique_lenses: data.unique_lenses,
        upvotes: data.upvotes,
        downvotes: data.downvotes,
      },
      qualityScore: data.quality_score,
      advancementEligible: data.advancement_eligible,
    };
  } catch (err) {
    console.error(`Error fetching extended signals for sprout ${sproutId}:`, err);
    return { ...DEFAULT_SIGNALS };
  }
}
