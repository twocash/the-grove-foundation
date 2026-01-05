// lib/knowledge/search.js
// Semantic search for the Kinetic Pipeline
// Sprint: kinetic-pipeline-v1

import { generateEmbedding } from '../embeddings.js';
import { getSupabaseAdmin } from '../supabase.js';
import { expandQuery, shouldExpandQuery } from './expand.js';

/**
 * Search documents using vector similarity
 * @param {string} query - Search query
 * @param {Object} [options]
 * @param {number} [options.limit=10] - Maximum results
 * @param {number} [options.threshold=0.5] - Minimum similarity (0-1)
 * @param {string[]} [options.tiers] - Filter by tiers
 * @param {boolean} [options.expand=true] - Whether to expand query
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
    expand = true,
  } = options;

  // Expand query if enabled and beneficial
  let searchQuery = query;
  if (expand && shouldExpandQuery(query)) {
    const expansion = await expandQuery(query);
    if (expansion.wasExpanded) {
      searchQuery = expansion.expanded;
    }
  }

  // Generate query embedding
  console.log(`[Search] Generating embedding for query: "${searchQuery.slice(0, 50)}..."`);
  const queryEmbedding = await generateEmbedding(searchQuery);

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

// =============================================================================
// HYBRID SEARCH
// Sprint: rag-discovery-enhancement-v1
// =============================================================================

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'of',
  'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
  'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
  'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am',
  'it', 'its', 'i', 'you', 'he', 'she', 'they', 'we', 'me', 'him', 'her',
  'them', 'us'
]);

/**
 * Extract keywords from a query string
 * Removes stopwords and short words
 * @param {string} query
 * @returns {string[]}
 */
export function extractQueryKeywords(query) {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOPWORDS.has(word))
    .slice(0, 10);
}

/**
 * Search documents using hybrid scoring (vector + metadata)
 * Combines vector similarity with keyword matching, utility scores, and temporal weighting
 * @param {string} query - Search query
 * @param {Object} [options]
 * @param {number} [options.limit=10] - Maximum results
 * @param {number} [options.threshold=0.3] - Minimum similarity (0-1)
 * @param {boolean} [options.trackRetrievals=true] - Track retrieval for utility scoring
 * @param {number} [options.freshnessDecayDays=30] - Freshness decay period
 * @returns {Promise<Array>}
 */
export async function searchDocumentsHybrid(query, options = {}) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const {
    limit = 10,
    threshold = 0.3,
    trackRetrievals = true,
    freshnessDecayDays = 30,
  } = options;

  const queryEmbedding = await generateEmbedding(query);
  const keywords = extractQueryKeywords(query);

  console.log(`[HybridSearch] Query: "${query.slice(0, 50)}...", Keywords: [${keywords.join(', ')}]`);

  const { data, error } = await supabaseAdmin.rpc('search_documents_hybrid', {
    query_embedding: `[${queryEmbedding.join(',')}]`,
    query_keywords: keywords,
    match_count: limit,
    match_threshold: threshold,
    track_retrievals: trackRetrievals,
    freshness_decay_days: freshnessDecayDays,
  });

  if (error) {
    console.error('[HybridSearch] RPC error:', error);
    throw new Error(`Hybrid search failed: ${error.message}`);
  }

  console.log(`[HybridSearch] Found ${data?.length || 0} results`);

  // Track retrievals asynchronously (fire-and-forget)
  if (trackRetrievals && data?.length > 0) {
    trackDocumentRetrievals(data.map(r => r.id), query).catch(err => {
      console.error('[HybridSearch] Tracking error:', err.message);
    });
  }

  return data || [];
}

/**
 * Track document retrievals for utility scoring (fire-and-forget)
 * @param {string[]} documentIds
 * @param {string} query
 * @returns {Promise<void>}
 */
async function trackDocumentRetrievals(documentIds, query) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return;

  for (const docId of documentIds) {
    await supabaseAdmin.rpc('track_document_retrieval', {
      doc_id: docId,
      query_text: query.slice(0, 200),
    });
  }
}

/**
 * Find documents by named entity
 * @param {string} entityName - Entity name to search for
 * @param {Object} [options]
 * @param {string} [options.entityType] - Filter by entity type
 * @param {number} [options.limit=10] - Maximum results
 * @returns {Promise<Array>}
 */
export async function findDocumentsByEntity(entityName, options = {}) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const { entityType = null, limit = 10 } = options;

  const { data, error } = await supabaseAdmin.rpc('find_documents_by_entity', {
    entity_name: entityName,
    entity_type: entityType,
    match_limit: limit,
  });

  if (error) {
    console.error('[EntitySearch] RPC error:', error);
    throw new Error(`Entity search failed: ${error.message}`);
  }

  return data || [];
}

// =============================================================================
// CONTEXT RETRIEVAL
// =============================================================================

/**
 * Get context for chat based on query
 * @param {string} query
 * @param {Object} [options]
 * @param {boolean} [options.expand=true] - Whether to expand query
 * @param {boolean} [options.useHybrid=true] - Use hybrid search (vector + keyword + utility)
 * @returns {Promise<{context: string, sources: Array, expandedQuery?: string}>}
 */
export async function getContextForQuery(query, options = {}) {
  // Sprint: exploration-node-unification-v1 - Default to hybrid search
  const { expand = true, useHybrid = true, ...searchOptions } = options;

  // Expand query if enabled and beneficial
  let searchQuery = query;
  let wasExpanded = false;
  if (expand && shouldExpandQuery(query)) {
    const expansion = await expandQuery(query);
    if (expansion.wasExpanded) {
      searchQuery = expansion.expanded;
      wasExpanded = true;
    }
  }

  // Use hybrid or basic search based on flag
  let results;
  if (useHybrid) {
    console.log('[ContextForQuery] Using HYBRID search');
    results = await searchDocumentsHybrid(searchQuery, {
      limit: searchOptions.limit || 5,
      threshold: searchOptions.threshold || 0.3,
    });
  } else {
    results = await searchDocuments(searchQuery, {
      limit: searchOptions.limit || 5,
      threshold: searchOptions.threshold || 0.5,
      expand: false, // Already expanded above
    });
  }

  if (results.length === 0) {
    return { context: '', sources: [], expandedQuery: wasExpanded ? searchQuery : undefined };
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
    expandedQuery: wasExpanded ? searchQuery : undefined,
  };
}
