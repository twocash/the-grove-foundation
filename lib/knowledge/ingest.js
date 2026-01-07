// lib/knowledge/ingest.js
// Document ingestion for the Kinetic Pipeline
// Sprint: kinetic-pipeline-v1

import crypto from 'crypto';
import { getSupabaseAdmin } from '../supabase.js';
import { chunkDocument } from './chunk.js';
import { rowToDocument } from './types.js';

/**
 * Upload and ingest a new document
 * @param {Object} input
 * @param {string} input.title
 * @param {string} input.content
 * @param {string} [input.tier]
 * @param {string} [input.sourceType]
 * @param {string} [input.sourceUrl]
 * @param {string} [input.fileType]
 * @param {string} [input.createdBy]
 * @returns {Promise<Object>}
 */
export async function ingestDocument(input) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  // Generate content hash for deduplication
  const contentHash = crypto
    .createHash('sha256')
    .update(input.content)
    .digest('hex');

  // Check for duplicate
  const { data: existing } = await supabaseAdmin
    .from('documents')
    .select('id')
    .eq('content_hash', contentHash)
    .single();

  if (existing) {
    console.log(`[Ingest] Duplicate document detected: ${existing.id}`);
    return {
      id: existing.id,
      status: 'complete',
      chunkCount: 0,
    };
  }

  // Insert document
  const { data: doc, error: docError } = await supabaseAdmin
    .from('documents')
    .insert({
      title: input.title,
      content: input.content,
      content_hash: contentHash,
      tier: input.tier || 'sapling',
      source_type: input.sourceType || 'upload',
      source_url: input.sourceUrl,
      file_type: input.fileType,
      created_by: input.createdBy || 'system',
      embedding_status: 'pending',
    })
    .select()
    .single();

  if (docError || !doc) {
    console.error('[Ingest] Failed to insert document:', docError);
    throw new Error(`Failed to insert document: ${docError?.message}`);
  }

  console.log(`[Ingest] Document created: ${doc.id}`);

  // Chunk document
  const chunks = chunkDocument(doc.id, input.content);
  console.log(`[Ingest] Created ${chunks.length} chunks`);

  // Insert chunks
  if (chunks.length > 0) {
    const chunkRows = chunks.map(chunk => ({
      document_id: chunk.documentId,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      char_start: chunk.charStart,
      char_end: chunk.charEnd,
    }));

    const { error: chunkError } = await supabaseAdmin
      .from('document_chunks')
      .insert(chunkRows);

    if (chunkError) {
      console.error('[Ingest] Failed to insert chunks:', chunkError);
    }
  }

  return {
    id: doc.id,
    status: 'pending',
    chunkCount: chunks.length,
  };
}

/**
 * Get document by ID
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getDocument(id) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return rowToDocument(data);
}

/**
 * List documents with optional filters
 * @param {Object} [options]
 * @returns {Promise<Array>}
 */
export async function listDocuments(options) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  let query = supabaseAdmin
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (options?.tier) {
    query = query.eq('tier', options.tier);
  }

  if (options?.embeddingStatus) {
    query = query.eq('embedding_status', options.embeddingStatus);
  }

  if (options?.archived !== undefined) {
    query = query.eq('archived', options.archived);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Ingest] Failed to list documents:', error);
    throw new Error(`Failed to list documents: ${error.message}`);
  }

  return (data || []).map(row => rowToDocument(row));
}

/**
 * Update document fields
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object|null>}
 */
export async function updateDocument(id, updates) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const updateData = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.tier !== undefined) {
    updateData.tier = updates.tier;
    updateData.tier_updated_at = new Date().toISOString();
  }
  if (updates.archived !== undefined) updateData.archived = updates.archived;
  if (updates.embeddingStatus !== undefined) updateData.embedding_status = updates.embeddingStatus;
  if (updates.embeddingError !== undefined) updateData.embedding_error = updates.embeddingError;
  // Sprint: extraction-pipeline-integration-v1 - Prompt extraction tracking
  if (updates.promptsExtracted !== undefined) updateData.prompts_extracted = updates.promptsExtracted;
  if (updates.promptExtractionAt !== undefined) updateData.prompt_extraction_at = updates.promptExtractionAt;
  if (updates.promptExtractionCount !== undefined) updateData.prompt_extraction_count = updates.promptExtractionCount;

  const { data, error } = await supabaseAdmin
    .from('documents')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('[Ingest] Failed to update document:', error);
    return null;
  }

  return rowToDocument(data);
}

/**
 * Delete document (and cascade to chunks/embeddings)
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteDocument(id) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabaseAdmin
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Ingest] Failed to delete document:', error);
    return false;
  }

  return true;
}

/**
 * Get document chunks
 * @param {string} documentId
 * @returns {Promise<Array>}
 */
export async function getDocumentChunks(documentId) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('document_chunks')
    .select('*')
    .eq('document_id', documentId)
    .order('chunk_index', { ascending: true });

  if (error) {
    console.error('[Ingest] Failed to get chunks:', error);
    throw new Error(`Failed to get chunks: ${error.message}`);
  }

  return data || [];
}

/**
 * Get documents pending embedding
 * @param {number} [limit=10]
 * @returns {Promise<Array>}
 */
export async function getPendingDocuments(limit = 10) {
  return listDocuments({
    embeddingStatus: 'pending',
    archived: false,
    limit,
  });
}

/**
 * Get pipeline statistics
 * @returns {Promise<Object>}
 */
export async function getPipelineStats() {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  // Get total count
  const { count: total } = await supabaseAdmin
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('archived', false);

  // Get counts by tier
  const { data: tierData } = await supabaseAdmin
    .from('documents')
    .select('tier')
    .eq('archived', false);

  const byTier = {};
  for (const row of tierData || []) {
    byTier[row.tier] = (byTier[row.tier] || 0) + 1;
  }

  // Get counts by embedding status
  const { data: statusData } = await supabaseAdmin
    .from('documents')
    .select('embedding_status')
    .eq('archived', false);

  const byStatus = {};
  for (const row of statusData || []) {
    byStatus[row.embedding_status] = (byStatus[row.embedding_status] || 0) + 1;
  }

  return {
    totalDocuments: total || 0,
    byTier,
    byStatus,
    pendingEmbedding: byStatus['pending'] || 0,
  };
}
