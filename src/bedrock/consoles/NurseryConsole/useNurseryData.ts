// src/bedrock/consoles/NurseryConsole/useNurseryData.ts
// Data hook for Nursery Console - implements CollectionDataResult for factory pattern
// Sprint: nursery-v1 (Course Correction)

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { GroveObject } from '../../../core/schema/grove-object';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import type { PatchOperation } from '../../types/copilot.types';
import type { ResearchSprout, ResearchSproutStatus } from '@core/schema/research-sprout';
import { RESEARCH_SPROUTS_TABLE } from '@core/schema/research-sprout-registry';

// =============================================================================
// Supabase Client Singleton
// =============================================================================

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[useNurseryData] Supabase credentials not configured');
    return null;
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

// =============================================================================
// Payload Type
// =============================================================================

/**
 * Sprout payload for GroveObject wrapper
 * Contains the domain-specific ResearchSprout data
 */
export interface SproutPayload {
  /** Original research question */
  spark: string;

  /** Research sprout status */
  status: ResearchSproutStatus;

  /** Confidence score (0-1) */
  inferenceConfidence: number | null;

  /** User-assigned tags */
  tags: string[];

  /** User notes */
  notes: string | null;

  /** Whether review is required */
  requiresReview: boolean;

  /** Whether it has been reviewed */
  reviewed: boolean;

  /** Synthesis results (if completed) */
  synthesis: {
    summary: string;
    insights: string[];
    confidence: number;
    synthesizedAt: string;
  } | null;

  /** Status message */
  statusMessage: string | null;

  /** Grove ID */
  groveId: string;

  /** Promoted to Garden ID (if promoted) */
  promotedToGardenId: string | null;

  /** Archive reason (if archived) */
  archiveReason: string | null;

  /** Archived timestamp */
  archivedAt: string | null;

  /** Completed timestamp */
  completedAt: string | null;

  /** Inference model used */
  inferenceModel: string | null;
}

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Transform database row to GroveObject<SproutPayload>
 */
function rowToGroveObject(row: Record<string, unknown>): GroveObject<SproutPayload> {
  const status = row.status as ResearchSproutStatus;

  return {
    meta: {
      id: row.id as string,
      type: 'research-sprout',
      title: row.title as string,
      description: row.spark as string,
      status: status === 'completed' ? 'active' : status === 'archived' ? 'archived' : 'draft',
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      tags: (row.tags as string[]) || [],
    },
    payload: {
      spark: row.spark as string,
      status: status,
      inferenceConfidence: row.inference_confidence as number | null,
      tags: (row.tags as string[]) || [],
      notes: row.notes as string | null,
      requiresReview: row.requires_review as boolean,
      reviewed: row.reviewed as boolean,
      synthesis: row.synthesis as ResearchSprout['synthesis'] | null,
      statusMessage: row.status_message as string | null,
      groveId: row.grove_id as string,
      promotedToGardenId: row.promoted_to_garden_id as string | null,
      archiveReason: row.archive_reason as string | null,
      archivedAt: row.archived_at as string | null,
      completedAt: row.completed_at as string | null,
      inferenceModel: row.inference_model as string | null,
    },
  };
}

/**
 * Apply patch operations to a GroveObject
 */
function applyPatches(
  obj: GroveObject<SproutPayload>,
  operations: PatchOperation[]
): GroveObject<SproutPayload> {
  const result = JSON.parse(JSON.stringify(obj)); // Deep clone

  for (const op of operations) {
    if (op.op !== 'replace') continue;

    const pathParts = op.path.split('/').filter(Boolean);
    let target: Record<string, unknown> = result;

    for (let i = 0; i < pathParts.length - 1; i++) {
      target = target[pathParts[i]] as Record<string, unknown>;
    }

    const lastKey = pathParts[pathParts.length - 1];
    target[lastKey] = op.value;
  }

  return result;
}

// =============================================================================
// Extended Result Interface
// =============================================================================

/**
 * Extended result interface for Nursery-specific operations
 */
export interface NurseryDataResult extends CollectionDataResult<SproutPayload> {
  /** Promote a sprout to Garden */
  promote: (id: string) => Promise<void>;

  /** Archive a sprout with reason */
  archive: (id: string, reason: string, customReason?: string) => Promise<void>;

  /** Restore an archived sprout */
  restore: (id: string) => Promise<void>;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Data hook for Nursery Console
 *
 * Implements CollectionDataResult<SproutPayload> for the console factory pattern.
 * Fetches sprouts from Supabase and provides CRUD operations.
 */
export function useNurseryData(): NurseryDataResult {
  const [objects, setObjects] = useState<GroveObject<SproutPayload>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const groveId = import.meta.env.VITE_GROVE_ID || 'default';

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  const refetch = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      setError('Supabase not configured');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = client
        .from(RESEARCH_SPROUTS_TABLE)
        .select('*')
        .order('updated_at', { ascending: false });

      // Only filter by groveId if it's meaningful
      if (groveId && groveId !== 'default') {
        query = query.eq('grove_id', groveId);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      const groveObjects = (data || []).map(rowToGroveObject);
      setObjects(groveObjects);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch sprouts');
    } finally {
      setLoading(false);
    }
  }, [groveId]);

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  // ---------------------------------------------------------------------------
  // Create (not typically used in Nursery - sprouts come from research pipeline)
  // ---------------------------------------------------------------------------

  const create = useCallback(async (defaults?: Partial<SproutPayload>): Promise<GroveObject<SproutPayload>> => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not configured');

    const now = new Date().toISOString();
    const id = `sprout-${Date.now()}`;

    const newRow = {
      id,
      grove_id: groveId,
      title: 'New Sprout',
      spark: defaults?.spark || '',
      status: 'pending',
      tags: defaults?.tags || [],
      notes: defaults?.notes || null,
      requires_review: false,
      reviewed: false,
      created_at: now,
      updated_at: now,
    };

    const { error: insertError } = await client
      .from(RESEARCH_SPROUTS_TABLE)
      .insert(newRow);

    if (insertError) throw new Error(insertError.message);

    const newObject = rowToGroveObject(newRow);
    setObjects(prev => [newObject, ...prev]);
    return newObject;
  }, [groveId]);

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  const update = useCallback(async (id: string, operations: PatchOperation[]) => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not configured');

    // Find the object
    const obj = objects.find(o => o.meta.id === id);
    if (!obj) throw new Error('Object not found');

    // Apply patches locally
    const updated = applyPatches(obj, operations);

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    for (const op of operations) {
      if (op.op !== 'replace') continue;

      const path = op.path;
      if (path.startsWith('/meta/')) {
        const field = path.replace('/meta/', '');
        if (field === 'title') updatePayload.title = op.value;
        if (field === 'tags') updatePayload.tags = op.value;
      } else if (path.startsWith('/payload/')) {
        const field = path.replace('/payload/', '');
        // Convert camelCase to snake_case
        const snakeField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        updatePayload[snakeField] = op.value;
      }
    }

    const { error: updateError } = await client
      .from(RESEARCH_SPROUTS_TABLE)
      .update(updatePayload)
      .eq('id', id);

    if (updateError) throw new Error(updateError.message);

    // Update local state
    setObjects(prev => prev.map(o => o.meta.id === id ? updated : o));
  }, [objects]);

  // ---------------------------------------------------------------------------
  // Remove (soft delete via archive)
  // ---------------------------------------------------------------------------

  const remove = useCallback(async (id: string) => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not configured');

    const now = new Date().toISOString();

    const { error: updateError } = await client
      .from(RESEARCH_SPROUTS_TABLE)
      .update({
        status: 'archived',
        archived_at: now,
        archive_reason: 'deleted',
        updated_at: now,
      })
      .eq('id', id);

    if (updateError) throw new Error(updateError.message);

    // Update local state
    setObjects(prev => prev.map(o => {
      if (o.meta.id !== id) return o;
      return {
        ...o,
        meta: { ...o.meta, status: 'archived', updatedAt: now },
        payload: { ...o.payload, status: 'archived', archivedAt: now, archiveReason: 'deleted' },
      };
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // Duplicate
  // ---------------------------------------------------------------------------

  const duplicate = useCallback(async (obj: GroveObject<SproutPayload>): Promise<GroveObject<SproutPayload>> => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not configured');

    const now = new Date().toISOString();
    const id = `sprout-${Date.now()}`;

    const newRow = {
      id,
      grove_id: obj.payload.groveId,
      title: `${obj.meta.title} (Copy)`,
      spark: obj.payload.spark,
      status: 'pending',
      tags: [...obj.payload.tags],
      notes: obj.payload.notes,
      requires_review: false,
      reviewed: false,
      created_at: now,
      updated_at: now,
    };

    const { error: insertError } = await client
      .from(RESEARCH_SPROUTS_TABLE)
      .insert(newRow);

    if (insertError) throw new Error(insertError.message);

    const newObject = rowToGroveObject(newRow);
    setObjects(prev => [newObject, ...prev]);
    return newObject;
  }, []);

  // ---------------------------------------------------------------------------
  // Promote (Nursery-specific)
  // ---------------------------------------------------------------------------

  const promote = useCallback(async (id: string) => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not configured');

    const now = new Date().toISOString();

    // For MVP, promotion just archives with a special reason
    // Future: Create Garden document and link via promoted_to_garden_id
    const { error: updateError } = await client
      .from(RESEARCH_SPROUTS_TABLE)
      .update({
        status: 'archived',
        archived_at: now,
        archive_reason: 'promoted',
        updated_at: now,
      })
      .eq('id', id);

    if (updateError) throw new Error(updateError.message);

    // Update local state
    setObjects(prev => prev.map(o => {
      if (o.meta.id !== id) return o;
      return {
        ...o,
        meta: { ...o.meta, status: 'archived', updatedAt: now },
        payload: { ...o.payload, status: 'archived', archivedAt: now, archiveReason: 'promoted' },
      };
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // Archive (Nursery-specific)
  // ---------------------------------------------------------------------------

  const archive = useCallback(async (id: string, reason: string, customReason?: string) => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not configured');

    const now = new Date().toISOString();
    const archiveReason = reason === 'other' && customReason ? customReason : reason;

    const { error: updateError } = await client
      .from(RESEARCH_SPROUTS_TABLE)
      .update({
        status: 'archived',
        archived_at: now,
        archive_reason: archiveReason,
        updated_at: now,
      })
      .eq('id', id);

    if (updateError) throw new Error(updateError.message);

    // Update local state
    setObjects(prev => prev.map(o => {
      if (o.meta.id !== id) return o;
      return {
        ...o,
        meta: { ...o.meta, status: 'archived', updatedAt: now },
        payload: { ...o.payload, status: 'archived', archivedAt: now, archiveReason },
      };
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // Restore (Nursery-specific)
  // ---------------------------------------------------------------------------

  const restore = useCallback(async (id: string) => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase not configured');

    const now = new Date().toISOString();

    const { error: updateError } = await client
      .from(RESEARCH_SPROUTS_TABLE)
      .update({
        status: 'completed',
        archived_at: null,
        archive_reason: null,
        reviewed: false,
        updated_at: now,
      })
      .eq('id', id);

    if (updateError) throw new Error(updateError.message);

    // Update local state
    setObjects(prev => prev.map(o => {
      if (o.meta.id !== id) return o;
      return {
        ...o,
        meta: { ...o.meta, status: 'active', updatedAt: now },
        payload: { ...o.payload, status: 'completed', archivedAt: null, archiveReason: null, reviewed: false },
      };
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    objects,
    loading,
    error,
    refetch,
    create,
    update,
    remove,
    duplicate,
    // Nursery-specific
    promote,
    archive,
    restore,
  };
}

export default useNurseryData;
