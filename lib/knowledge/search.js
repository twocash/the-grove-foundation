// lib/knowledge/search.js
// Semantic search for the Kinetic Pipeline
// Sprint: kinetic-pipeline-v1

import { generateEmbedding } from '../embeddings.js';
import { getSupabaseAdmin } from '../supabase.js';

/**
 * Search documents using vector similarity
 * @param {string} query - Search query
 * @param {Object} [options]
 * @param {number} [options.limit=10] - Maximum results
 * @param {number} [options.threshold=0.5] - Minimum similarity (0-1)
 * @param {string[]} [options.tiers] - Filter by tiers
 * @returns {Promise<Array>}
 */
export async function searchDocuments(query, options = {}) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const {
    limit = 10,
    threshold = 0.5,
    tiers = ['sapling', 'tree', 'grove'],
  } = options;

  // Generate query embedding
  console.log(`[Search] Generating embedding for query: "${query.slice(0, 50)}..."`);
  const queryEmbedding = await generateEmbedding(query);

  // Call the search_documents RPC function
  const { data, error } = await supabaseAdmin
    .rpc('search_documents', {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      match_count: limit,
      match_threshold: threshold,
    });

  if (error) {
    console.error('[Search] RPC error:', error);
    throw new Error(`Search failed: ${error.message}`);
  }

  console.log(`[Search] Found ${data?.length || 0} results`);

  return (data || []).map(row => ({
    id: row.id,
    title: row.title,
    snippet: row.content.slice(0, 300) + (row.content.length > 300 ? '...' : ''),
    similarity: row.similarity,
  }));
}

/**
 * Find similar documents to a given document
 * @param {string} documentId
 * @param {number} [limit=5]
 * @returns {Promise<Array>}
 */
export async function findSimilarDocuments(documentId, limit = 5) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  // Get the document's embedding
  const { data: embedding } = await supabaseAdmin
    .from('embeddings')
    .select('embedding')
    .eq('document_id', documentId)
    .is('chunk_id', null) // Document-level embedding
    .single();

  if (!embedding) {
    throw new Error('Document embedding not found');
  }

  // Search using the document's embedding
  const { data, error } = await supabaseAdmin
    .rpc('search_documents', {
      query_embedding: embedding.embedding,
      match_count: limit + 1, // +1 to exclude self
      match_threshold: 0.3,
    });

  if (error) {
    throw new Error(`Similar search failed: ${error.message}`);
  }

  // Filter out the source document
  return (data || [])
    .filter(row => row.id !== documentId)
    .slice(0, limit)
    .map(row => ({
      id: row.id,
      title: row.title,
      snippet: row.content.slice(0, 200) + '...',
      similarity: row.similarity,
    }));
}

/**
 * Get context for chat based on query
 * @param {string} query
 * @param {Object} [options]
 * @returns {Promise<{context: string, sources: Array}>}
 */
export async function getContextForQuery(query, options = {}) {
  const results = await searchDocuments(query, {
    limit: options.limit || 5,
    threshold: options.threshold || 0.5,
  });

  if (results.length === 0) {
    return { context: '', sources: [] };
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Get full content for top results
  const { data: docs } = await supabaseAdmin
    .from('documents')
    .select('id, title, content')
    .in('id', results.map(r => r.id));

  const contextParts = (docs || []).map(doc => {
    const result = results.find(r => r.id === doc.id);
    return `## ${doc.title}\n(Relevance: ${Math.round((result?.similarity || 0) * 100)}%)\n\n${doc.content.slice(0, 2000)}`;
  });

  return {
    context: contextParts.join('\n\n---\n\n'),
    sources: results.map(r => ({
      id: r.id,
      title: r.title,
      similarity: r.similarity,
    })),
  };
}
