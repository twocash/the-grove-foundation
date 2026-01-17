// src/core/jobs/advancementBatchJob.ts
// Sprint: S7-SL-AutoAdvancement v1
// Daily batch job for automatic tier advancement
//
// DEX: Provenance as Infrastructure - Full audit trail with signal snapshots
// DEX: Declarative Sovereignty - Rules drive behavior, not hardcoded logic

import type { GroveObject } from '@core/schema/grove-object';
import type {
  AdvancementRulePayload,
  AdvancementResult,
  AdvancementEvent,
  CriterionResult,
  ObservableSignals,
} from '@core/schema/advancement';
import {
  evaluateAdvancement,
  type SproutContext,
  type RuleWithId,
} from '@core/engine/advancementEvaluator';
import {
  fetchSignalsForSprouts,
  createSignalGetter,
  type SupabaseClientLike,
} from '@core/engine/signalFetcher';

// =============================================================================
// Types
// =============================================================================

/**
 * Document row from database
 */
export interface DocumentRow {
  id: string;
  title: string;
  tier: string;
  created_at: string;
  updated_at: string;
}

/**
 * Result of a single sprout advancement
 */
export interface AdvancementJobResult {
  sproutId: string;
  success: boolean;
  advanced: boolean;
  fromTier?: string;
  toTier?: string;
  ruleId?: string;
  error?: string;
}

/**
 * Summary of batch job execution
 */
export interface BatchJobSummary {
  startedAt: string;
  completedAt: string;
  sproutsEvaluated: number;
  sproutsAdvanced: number;
  sproutsFailed: number;
  results: AdvancementJobResult[];
}

/**
 * Options for batch job execution
 */
export interface BatchJobOptions {
  /** Only evaluate specific lifecycle model */
  lifecycleModelId?: string;
  /** Only evaluate specific tiers */
  fromTiers?: string[];
  /** Dry run mode (evaluate but don't apply) */
  dryRun?: boolean;
  /** Maximum sprouts to process in one batch */
  batchSize?: number;
  /** Signal aggregation period to use */
  signalPeriod?: 'all_time' | 'last_30d' | 'last_7d';
}

// =============================================================================
// Batch Job Executor
// =============================================================================

/**
 * Execute advancement batch job.
 * This is the main entry point for the daily cron job.
 *
 * Flow:
 * 1. Fetch enabled advancement rules
 * 2. Fetch sprouts matching rule criteria (tier + lifecycle)
 * 3. Fetch signals for all sprouts (batch)
 * 4. Evaluate each sprout against applicable rules
 * 5. Update sprout tiers where advancement triggers
 * 6. Log advancement events for audit trail
 *
 * @param supabase - Supabase client
 * @param options - Batch job options
 * @returns Job summary
 */
export async function executeAdvancementBatch(
  supabase: SupabaseClientLike,
  options: BatchJobOptions = {}
): Promise<BatchJobSummary> {
  const startedAt = new Date().toISOString();
  const results: AdvancementJobResult[] = [];
  const {
    lifecycleModelId,
    fromTiers,
    dryRun = false,
    batchSize = 100,
    signalPeriod = 'all_time',
  } = options;

  console.log(`[AdvancementBatch] Starting batch job at ${startedAt}`);
  console.log(`[AdvancementBatch] Options: dryRun=${dryRun}, batchSize=${batchSize}`);

  try {
    // Step 1: Fetch enabled advancement rules
    const rules = await fetchEnabledRules(supabase, lifecycleModelId);
    console.log(`[AdvancementBatch] Found ${rules.length} enabled rules`);

    if (rules.length === 0) {
      return createSummary(startedAt, results);
    }

    // Get unique tiers from rules
    const ruleTiers = new Set(rules.map((r) => r.payload.fromTier));
    const targetTiers = fromTiers ? fromTiers.filter((t) => ruleTiers.has(t)) : Array.from(ruleTiers);

    // Step 2: Fetch sprouts matching rule criteria
    const sprouts = await fetchEligibleSprouts(supabase, targetTiers, lifecycleModelId, batchSize);
    console.log(`[AdvancementBatch] Found ${sprouts.length} eligible sprouts`);

    if (sprouts.length === 0) {
      return createSummary(startedAt, results);
    }

    // Step 3: Fetch signals for all sprouts (batch)
    const sproutIds = sprouts.map((s) => s.id);
    const signalsMap = await fetchSignalsForSprouts(supabase, sproutIds, { period: signalPeriod });
    console.log(`[AdvancementBatch] Fetched signals for ${signalsMap.size} sprouts`);

    // Step 4 & 5 & 6: Evaluate and process each sprout
    for (const sprout of sprouts) {
      try {
        const result = await processSpout(supabase, sprout, rules, signalsMap, dryRun);
        results.push(result);
      } catch (err) {
        console.error(`[AdvancementBatch] Error processing sprout ${sprout.id}:`, err);
        results.push({
          sproutId: sprout.id,
          success: false,
          advanced: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return createSummary(startedAt, results);
  } catch (err) {
    console.error('[AdvancementBatch] Fatal error:', err);
    return createSummary(startedAt, results, err instanceof Error ? err.message : 'Fatal error');
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Fetch enabled advancement rules from database
 */
async function fetchEnabledRules(
  supabase: SupabaseClientLike,
  lifecycleModelId?: string
): Promise<RuleWithId[]> {
  let query = (supabase as any)
    .from('advancement_rules')
    .select('*')
    .eq('payload->>isEnabled', 'true');

  if (lifecycleModelId) {
    query = query.eq('payload->>lifecycleModelId', lifecycleModelId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[AdvancementBatch] Error fetching rules:', error);
    return [];
  }

  return (data ?? []).map((row: GroveObject<AdvancementRulePayload>) => ({
    id: row.meta.id,
    payload: row.payload,
  }));
}

/**
 * Fetch documents eligible for advancement evaluation
 */
async function fetchEligibleSprouts(
  supabase: SupabaseClientLike,
  tiers: string[],
  lifecycleModelId?: string,
  limit?: number
): Promise<DocumentRow[]> {
  // Build query for documents in target tiers
  let query = (supabase as any)
    .from('documents')
    .select('id, title, tier, created_at, updated_at');

  // Filter by tiers (direct column access)
  if (tiers.length > 0) {
    query = query.in('tier', tiers);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[AdvancementBatch] Error fetching documents:', error);
    return [];
  }

  return (data ?? []) as DocumentRow[];
}

/**
 * Process a single document for advancement
 */
async function processSpout(
  supabase: SupabaseClientLike,
  document: DocumentRow,
  rules: RuleWithId[],
  signalsMap: Map<string, ObservableSignals>,
  dryRun: boolean
): Promise<AdvancementJobResult> {
  const currentTier = document.tier;
  const lifecycleModelId = 'botanical'; // Documents don't have lifecycle model ID

  // Build sprout context
  const context: SproutContext = {
    id: document.id,
    currentTier,
    lifecycleModelId,
  };

  // Get signals
  const signals = signalsMap.get(document.id);
  if (!signals) {
    return {
      sproutId: document.id,
      success: true,
      advanced: false,
    };
  }

  // Evaluate advancement
  const result = evaluateAdvancement(context, rules, signals);

  if (!result || !result.shouldAdvance) {
    return {
      sproutId: document.id,
      success: true,
      advanced: false,
    };
  }

  // Log what would happen in dry run mode
  if (dryRun) {
    console.log(`[AdvancementBatch] DRY RUN: Would advance ${document.id} from ${currentTier} to ${result.toTier}`);
    return {
      sproutId: document.id,
      success: true,
      advanced: true,
      fromTier: currentTier,
      toTier: result.toTier,
      ruleId: result.ruleId,
    };
  }

  // Apply advancement
  try {
    await applyAdvancement(supabase, document.id, currentTier, result);
    return {
      sproutId: document.id,
      success: true,
      advanced: true,
      fromTier: currentTier,
      toTier: result.toTier,
      ruleId: result.ruleId,
    };
  } catch (err) {
    console.error(`[AdvancementBatch] Failed to apply advancement for ${document.id}:`, err);
    return {
      sproutId: document.id,
      success: false,
      advanced: false,
      error: err instanceof Error ? err.message : 'Failed to apply advancement',
    };
  }
}

/**
 * Apply advancement: update document tier and log event
 */
async function applyAdvancement(
  supabase: SupabaseClientLike,
  documentId: string,
  fromTier: string,
  result: AdvancementResult
): Promise<void> {
  const timestamp = new Date().toISOString();

  // Use RPC function to update document tier
  const { data: updateResult, error: updateError } = await (supabase as any)
    .rpc('update_document_tier', {
      p_document_id: documentId,
      p_new_tier: result.toTier,
    });

  if (updateError) {
    throw new Error(`Failed to update document tier: ${updateError.message}`);
  }

  if (!updateResult) {
    throw new Error('Tier update returned false (document not found or already at target tier)');
  }

  // Use RPC function to log advancement event
  const { data: eventId, error: eventError } = await (supabase as any)
    .rpc('insert_advancement_event', {
      p_document_id: documentId,
      p_rule_id: result.ruleId,
      p_from_tier: fromTier,
      p_to_tier: result.toTier,
      p_criteria_met: result.criteriaResults,
      p_signal_values: result.signalValues,
      p_event_type: 'auto-advancement',
    });

  if (eventError) {
    console.error(`[AdvancementBatch] Failed to log event for ${documentId}:`, eventError);
    // Don't throw - the advancement was applied successfully
  } else {
    console.log(`[AdvancementBatch] Logged advancement event: ${eventId}`);
  }

  console.log(`[AdvancementBatch] Advanced ${documentId}: ${fromTier} → ${result.toTier}`);
}

/**
 * Create job summary
 */
function createSummary(
  startedAt: string,
  results: AdvancementJobResult[],
  fatalError?: string
): BatchJobSummary {
  const completedAt = new Date().toISOString();
  const sproutsAdvanced = results.filter((r) => r.advanced).length;
  const sproutsFailed = results.filter((r) => !r.success).length;

  const summary: BatchJobSummary = {
    startedAt,
    completedAt,
    sproutsEvaluated: results.length,
    sproutsAdvanced,
    sproutsFailed,
    results,
  };

  console.log(`[AdvancementBatch] Completed: ${sproutsAdvanced} advanced, ${sproutsFailed} failed`);

  return summary;
}

// =============================================================================
// API Functions (for manual triggers)
// =============================================================================

/**
 * Trigger advancement batch job via API.
 * Can be called from Supabase Edge Function or server endpoint.
 */
export async function triggerAdvancementBatch(
  supabase: SupabaseClientLike,
  options: BatchJobOptions = {}
): Promise<BatchJobSummary> {
  return executeAdvancementBatch(supabase, options);
}

/**
 * Evaluate advancement for a single document (without applying).
 * Useful for preview/testing in UI.
 */
export async function previewAdvancement(
  supabase: SupabaseClientLike,
  documentId: string,
  options: { signalPeriod?: 'all_time' | 'last_30d' | 'last_7d' } = {}
): Promise<AdvancementResult | null> {
  const { signalPeriod = 'all_time' } = options;

  // Fetch document
  const { data: document, error: documentError } = await (supabase as any)
    .from('documents')
    .select('id, tier')
    .eq('id', documentId)
    .single();

  if (documentError || !document) {
    console.error('[AdvancementBatch] Document not found:', documentId);
    return null;
  }

  // Fetch rules
  const rules = await fetchEnabledRules(supabase);

  // Fetch signals
  const signalsMap = await fetchSignalsForSprouts(supabase, [documentId], { period: signalPeriod });
  const signals = signalsMap.get(documentId);

  if (!signals) {
    return null;
  }

  // Build context
  const context: SproutContext = {
    id: documentId,
    currentTier: document.tier,
    lifecycleModelId: 'botanical',
  };

  // Evaluate
  return evaluateAdvancement(context, rules, signals);
}
