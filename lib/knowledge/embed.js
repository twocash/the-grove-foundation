// lib/knowledge/embed.js
// Embedding pipeline for the Kinetic Pipeline
// Sprint: kinetic-pipeline-v1

import { generateEmbedding } from '../embeddings.js';
import { getSupabaseAdmin } from '../supabase.js';

/**
 * Embed a single document (all chunks + document-level)
 * @param {string} documentId
 * @returns {Promise<void>}
 */
export async function embedDocument(documentId) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  // Update status to processing
  await supabaseAdmin
    .from('documents')
    .update({ embedding_status: 'processing' })
    .eq('id', documentId);

  try {
    // Get chunks
    const { data: chunks, error: chunksError } = await supabaseAdmin
      .from('document_chunks')
      .select('id, content')
      .eq('document_id', documentId)
      .order('chunk_index');

    if (chunksError) {
      throw new Error(`Failed to get chunks: ${chunksError.message}`);
    }

    console.log(`[Embed] Processing ${chunks?.length || 0} chunks for document ${documentId}`);

    // Generate embeddings for each chunk
    for (const chunk of chunks || []) {
      const embedding = await generateEmbedding(chunk.content);

      const { error: insertError } = await supabaseAdmin
        .from('embeddings')
        .insert({
          document_id: documentId,
          chunk_id: chunk.id,
          embedding: `[${embedding.join(',')}]`,
          model: 'text-embedding-004',
        });

      if (insertError) {
        console.error(`[Embed] Failed to insert chunk embedding:`, insertError);
      }
    }

    // Also generate document-level embedding from first 10K chars
    const { data: doc } = await supabaseAdmin
      .from('documents')
      .select('content')
      .eq('id', documentId)
      .single();

    if (doc) {
      const docEmbedding = await generateEmbedding(doc.content.slice(0, 10000));

      await supabaseAdmin
        .from('embeddings')
        .insert({
          document_id: documentId,
          chunk_id: null, // Document-level embedding
          embedding: `[${docEmbedding.join(',')}]`,
          model: 'text-embedding-004',
        });
    }

    // Update status to complete
    await supabaseAdmin
      .from('documents')
      .update({ embedding_status: 'complete' })
      .eq('id', documentId);

    console.log(`[Embed] Completed document ${documentId}`);

  } catch (error) {
    console.error(`[Embed] Error for document ${documentId}:`, error);

    // Update status to error
    await supabaseAdmin
      .from('documents')
      .update({
        embedding_status: 'error',
        embedding_error: error.message,
      })
      .eq('id', documentId);

    throw error;
  }
}

/**
 * Embed all pending documents
 * @param {number} [limit=10]
 * @returns {Promise<{processed: number, errors: string[]}>}
 */
export async function embedPendingDocuments(limit = 10) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const { data: pending } = await supabaseAdmin
    .from('documents')
    .select('id')
    .eq('embedding_status', 'pending')
    .eq('archived', false)
    .limit(limit);

  const errors = [];
  let processed = 0;

  console.log(`[Embed] Found ${pending?.length || 0} pending documents`);

  for (const doc of pending || []) {
    try {
      await embedDocument(doc.id);
      processed++;
    } catch (error) {
      errors.push(`${doc.id}: ${error.message}`);
    }
  }

  return { processed, errors };
}

/**
 * Get embedding statistics
 * @returns {Promise<Object>}
 */
export async function getEmbeddingStats() {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const { count: totalEmbeddings } = await supabaseAdmin
    .from('embeddings')
    .select('*', { count: 'exact', head: true });

  const { count: documentEmbeddings } = await supabaseAdmin
    .from('embeddings')
    .select('*', { count: 'exact', head: true })
    .is('chunk_id', null);

  const { count: chunkEmbeddings } = await supabaseAdmin
    .from('embeddings')
    .select('*', { count: 'exact', head: true })
    .not('chunk_id', 'is', null);

  return {
    totalEmbeddings: totalEmbeddings || 0,
    documentEmbeddings: documentEmbeddings || 0,
    chunkEmbeddings: chunkEmbeddings || 0,
  };
}
