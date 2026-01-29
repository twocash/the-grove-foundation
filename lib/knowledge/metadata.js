// lib/knowledge/metadata.js
// Chunk metadata for knowledge route reconstruction
// Sprint: S28-PIPE - Embedding metadata for provenance
//
// Enables reverse-engineering knowledge routes from embedded content.
// ID Chain Format: grove:lens:domain:path:template:writerConfig

import { getSupabaseAdmin } from '../supabase.js';

/**
 * EmbeddingMetadata structure for chunk provenance.
 * @typedef {Object} EmbeddingMetadata
 * @property {string} idChain - Concatenated ID chain (grove:lens:domain:path:template:config)
 * @property {string} [groveId] - Grove context ID
 * @property {string} [lensId] - Lens ID
 * @property {string} [cognitiveDomainId] - Cognitive domain ID
 * @property {string} [experiencePathId] - Experience path ID
 * @property {string} [templateId] - Writer template ID
 * @property {string} [writerConfigId] - Writer config ID
 * @property {string} [researchConfigId] - Research config ID
 * @property {string} type - Document type (vision, spec, research, blog, policy)
 * @property {string} typeCode - Short type code (v, s, r, b, p)
 * @property {string} status - Document status
 * @property {number} confidenceScore - Confidence score (0-1)
 * @property {string[]} tags - Document tags
 * @property {string} generatedAt - ISO timestamp
 * @property {string} date - Date string (YYYY-MM-DD)
 */

/**
 * Build ID chain from individual IDs.
 * Format: grove:lens:domain:path:template:writerConfig
 * Uses '_' placeholder for missing IDs.
 *
 * @param {Object} ids - Individual ID values
 * @returns {string} - Concatenated ID chain
 */
export function buildIdChain(ids) {
  const parts = [
    ids.groveId || '_',
    ids.lensId || '_',
    ids.cognitiveDomainId || '_',
    ids.experiencePathId || '_',
    ids.templateId || '_',
    ids.writerConfigId || '_',
  ];
  return parts.join(':');
}

/**
 * Parse ID chain back to individual IDs.
 *
 * @param {string} idChain - Concatenated ID chain
 * @returns {Object} - Individual ID values
 */
export function parseIdChain(idChain) {
  const parts = idChain.split(':');
  return {
    groveId: parts[0] !== '_' ? parts[0] : undefined,
    lensId: parts[1] !== '_' ? parts[1] : undefined,
    cognitiveDomainId: parts[2] !== '_' ? parts[2] : undefined,
    experiencePathId: parts[3] !== '_' ? parts[3] : undefined,
    templateId: parts[4] !== '_' ? parts[4] : undefined,
    writerConfigId: parts[5] !== '_' ? parts[5] : undefined,
  };
}

/**
 * Build EmbeddingMetadata from provenance input.
 *
 * @param {Object} input - Provenance input
 * @returns {EmbeddingMetadata} - Metadata for embedding
 */
export function buildEmbeddingMetadata(input) {
  const idChain = buildIdChain({
    groveId: input.groveId,
    lensId: input.lensId,
    cognitiveDomainId: input.cognitiveDomainId,
    experiencePathId: input.experiencePathId,
    templateId: input.templateId,
    writerConfigId: input.writerConfigId,
  });

  return {
    idChain,

    // Individual IDs for filtering
    groveId: input.groveId,
    lensId: input.lensId,
    cognitiveDomainId: input.cognitiveDomainId,
    experiencePathId: input.experiencePathId,
    templateId: input.templateId,
    writerConfigId: input.writerConfigId,
    researchConfigId: input.researchConfigId,

    // Classification
    type: input.type || 'research',
    typeCode: input.typeCode || 'r',
    status: input.status || 'complete',
    confidenceScore: input.confidenceScore ?? 0.7,

    // Tags
    tags: input.tags || [],

    // Timestamps
    generatedAt: input.generatedAt || new Date().toISOString(),
    date: input.date || new Date().toISOString().split('T')[0],
  };
}

/**
 * Set metadata for all chunks of a document.
 *
 * @param {string} documentId - Document ID
 * @param {EmbeddingMetadata} metadata - Metadata to set
 * @returns {Promise<{updated: number, error?: string}>}
 */
export async function setDocumentChunkMetadata(documentId, metadata) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('document_chunks')
      .update({ metadata })
      .eq('document_id', documentId)
      .select('id');

    if (error) {
      console.error('[Metadata] Failed to update chunk metadata:', error);
      return { updated: 0, error: error.message };
    }

    const updatedCount = data?.length || 0;
    console.log(`[Metadata] Updated ${updatedCount} chunks for document ${documentId}`);

    return { updated: updatedCount };
  } catch (error) {
    console.error('[Metadata] Error setting chunk metadata:', error);
    return { updated: 0, error: error.message };
  }
}

/**
 * Set metadata for a single chunk.
 *
 * @param {string} chunkId - Chunk ID
 * @param {EmbeddingMetadata} metadata - Metadata to set
 * @returns {Promise<boolean>}
 */
export async function setChunkMetadata(chunkId, metadata) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabaseAdmin
      .from('document_chunks')
      .update({ metadata })
      .eq('id', chunkId);

    if (error) {
      console.error('[Metadata] Failed to update chunk metadata:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Metadata] Error setting chunk metadata:', error);
    return false;
  }
}

/**
 * Get chunks by metadata filter.
 *
 * @param {Object} filter - Filter criteria
 * @param {string} [filter.groveId]
 * @param {string} [filter.typeCode]
 * @param {string} [filter.cognitiveDomainId]
 * @param {string} [filter.templateId]
 * @param {number} [limit=100]
 * @returns {Promise<Array>}
 */
export async function getChunksByMetadata(filter, limit = 100) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  try {
    let query = supabaseAdmin
      .from('document_chunks')
      .select('id, document_id, chunk_index, content, metadata')
      .not('metadata', 'is', null)
      .limit(limit);

    // Apply filters using JSONB containment (@>)
    const containsFilter = {};
    if (filter.groveId) containsFilter.groveId = filter.groveId;
    if (filter.typeCode) containsFilter.typeCode = filter.typeCode;
    if (filter.cognitiveDomainId) containsFilter.cognitiveDomainId = filter.cognitiveDomainId;
    if (filter.templateId) containsFilter.templateId = filter.templateId;
    if (filter.writerConfigId) containsFilter.writerConfigId = filter.writerConfigId;

    if (Object.keys(containsFilter).length > 0) {
      query = query.contains('metadata', containsFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Metadata] Failed to query chunks by metadata:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Metadata] Error querying chunks:', error);
    return [];
  }
}

/**
 * Get metadata statistics across all chunks.
 *
 * @returns {Promise<Object>}
 */
export async function getMetadataStats() {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  try {
    // Count chunks with metadata
    const { count: withMetadata } = await supabaseAdmin
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })
      .not('metadata', 'is', null);

    // Count chunks without metadata
    const { count: withoutMetadata } = await supabaseAdmin
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })
      .is('metadata', null);

    return {
      chunksWithMetadata: withMetadata || 0,
      chunksWithoutMetadata: withoutMetadata || 0,
      totalChunks: (withMetadata || 0) + (withoutMetadata || 0),
      coveragePercent: withMetadata && (withMetadata + withoutMetadata) > 0
        ? Math.round((withMetadata / (withMetadata + withoutMetadata)) * 100)
        : 0,
    };
  } catch (error) {
    console.error('[Metadata] Error getting stats:', error);
    return {
      chunksWithMetadata: 0,
      chunksWithoutMetadata: 0,
      totalChunks: 0,
      coveragePercent: 0,
    };
  }
}
