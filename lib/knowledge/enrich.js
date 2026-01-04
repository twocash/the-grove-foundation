// lib/knowledge/enrich.js
// Bulk enrichment pipeline for document corpus
// Sprint: rag-discovery-enhancement-v1

import { getSupabaseAdmin } from '../supabase.js';

/**
 * Get documents needing enrichment
 * @param {number} [limit=10] - Maximum documents to return
 * @returns {Promise<Array>}
 */
export async function getUnenrichedDocuments(limit = 10) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('id, title, content, tier, enriched_at, keywords, summary')
    .eq('embedding_status', 'complete')
    .eq('archived', false)
    .is('enriched_at', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Failed to get unenriched docs: ${error.message}`);
  return data || [];
}

/**
 * Get enrichment progress statistics
 * @returns {Promise<{total: number, embedded: number, enriched: number, unenriched: number, enrichmentRate: number}>}
 */
export async function getEnrichmentStats() {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('id, enriched_at, embedding_status, archived')
    .eq('archived', false);

  if (error) throw new Error(`Failed to get stats: ${error.message}`);

  const docs = data || [];
  const embedded = docs.filter(d => d.embedding_status === 'complete');
  const enriched = docs.filter(d => d.enriched_at !== null);

  return {
    total: docs.length,
    embedded: embedded.length,
    enriched: enriched.length,
    unenriched: embedded.length - enriched.length,
    enrichmentRate: embedded.length > 0
      ? Math.round((enriched.length / embedded.length) * 100)
      : 0,
  };
}

/**
 * Mark a document as enriched
 * @param {string} documentId - UUID of document
 * @param {Object} enrichmentData - Enrichment fields to set
 * @param {string} [enrichedBy='bulk'] - Source of enrichment
 * @param {string} [model] - Model used for enrichment
 * @returns {Promise<void>}
 */
export async function markDocumentEnriched(documentId, enrichmentData, enrichedBy = 'bulk', model = null) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabaseAdmin
    .from('documents')
    .update({
      ...enrichmentData,
      enriched_at: new Date().toISOString(),
      enriched_by: enrichedBy,
      enrichment_model: model,
    })
    .eq('id', documentId);

  if (error) throw new Error(`Failed to mark enriched: ${error.message}`);
}

/**
 * Enrich a batch of documents
 * Calls existing /api/knowledge/enrich endpoint, then persists via markDocumentEnriched
 *
 * @param {number} [batchSize=10] - Number of documents to process
 * @param {Object} [options]
 * @param {string[]} [options.operations] - Enrichment operations to run
 * @param {Function} [options.onProgress] - Progress callback
 * @param {number} [options.port=3000] - Server port
 * @returns {Promise<{processed: number, errors: Array, enriched: Array, message?: string}>}
 */
export async function enrichBatch(batchSize = 10, options = {}) {
  const {
    operations = ['keywords', 'summary', 'entities', 'type', 'questions', 'freshness'],
    onProgress = null,
    port = process.env.PORT || 8080,
  } = options;

  const docs = await getUnenrichedDocuments(batchSize);

  if (docs.length === 0) {
    return { processed: 0, errors: [], enriched: [], message: 'No documents need enrichment' };
  }

  const results = { processed: 0, errors: [], enriched: [] };

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];

    try {
      console.log(`[EnrichBatch] Processing ${i + 1}/${docs.length}: ${doc.title}`);

      // Call existing enrichment endpoint (reuses Gemini logic in server.js)
      const response = await fetch(`http://localhost:${port}/api/knowledge/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: doc.id,
          operations,
        }),
      });

      if (!response.ok) {
        throw new Error(`Enrichment API returned ${response.status}`);
      }

      const enrichmentResult = await response.json();

      // Persist the enrichment data to database
      await markDocumentEnriched(
        doc.id,
        enrichmentResult.results,
        'bulk',
        enrichmentResult.model || 'gemini-2.0-flash'
      );

      results.processed++;
      results.enriched.push({ id: doc.id, title: doc.title });

      if (onProgress) {
        onProgress({ current: i + 1, total: docs.length, doc: doc.title, success: true });
      }

      // Rate limit: 1 second between docs to respect Gemini API limits
      if (i < docs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`[EnrichBatch] Failed for ${doc.title}:`, error.message);
      results.errors.push({ id: doc.id, title: doc.title, error: error.message });

      if (onProgress) {
        onProgress({ current: i + 1, total: docs.length, doc: doc.title, success: false, error: error.message });
      }
    }
  }

  return results;
}

/**
 * Enrich a single document by ID (for auto-enrichment on ingest)
 * @param {string} documentId - UUID of document
 * @param {string[]} [operations] - Enrichment operations to run
 * @param {number} [port=3000] - Server port
 * @returns {Promise<Object>} - Enrichment results
 */
export async function enrichSingleDocument(documentId, operations = null, port = null) {
  const ops = operations || ['keywords', 'summary', 'entities', 'type', 'questions', 'freshness'];
  const serverPort = port || process.env.PORT || 8080;

  console.log(`[Enrich] Starting enrichment for document: ${documentId}`);

  // Call existing enrichment endpoint
  const response = await fetch(`http://localhost:${serverPort}/api/knowledge/enrich`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentId,
      operations: ops,
    }),
  });

  if (!response.ok) {
    throw new Error(`Enrichment API returned ${response.status}`);
  }

  const enrichmentResult = await response.json();

  // Persist the enrichment data
  await markDocumentEnriched(
    documentId,
    enrichmentResult.results,
    'auto',
    enrichmentResult.model || 'gemini-2.0-flash'
  );

  console.log(`[Enrich] Completed enrichment for document: ${documentId}`);

  return enrichmentResult;
}

/**
 * Get documents with low utility scores that may need re-enrichment
 * @param {number} [utilityThreshold=1.0] - Documents below this score
 * @param {number} [limit=20] - Maximum documents to return
 * @returns {Promise<Array>}
 */
export async function getLowUtilityDocuments(utilityThreshold = 1.0, limit = 20) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('id, title, utility_score, retrieval_count, enriched_at, keywords')
    .eq('embedding_status', 'complete')
    .eq('archived', false)
    .lt('utility_score', utilityThreshold)
    .not('enriched_at', 'is', null)
    .order('utility_score', { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Failed to get low utility docs: ${error.message}`);
  return data || [];
}
