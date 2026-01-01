// lib/knowledge/health.js
// Health check for the Kinetic Knowledge Pipeline
// Sprint: kinetic-stream-feature

import { getSupabaseAdmin } from '../supabase.js';
import { generateEmbedding } from '../embeddings.js';

/**
 * Health check result for a single component
 * @typedef {Object} ComponentHealth
 * @property {string} component - Component name
 * @property {boolean} healthy - Whether component is healthy
 * @property {string} [message] - Status message
 * @property {number} [latencyMs] - Response time in milliseconds
 * @property {Object} [details] - Additional details
 */

/**
 * Overall pipeline health result
 * @typedef {Object} PipelineHealth
 * @property {boolean} healthy - Overall health status
 * @property {string} status - 'healthy' | 'degraded' | 'unhealthy'
 * @property {number} timestamp - Unix timestamp
 * @property {ComponentHealth[]} components - Individual component health
 * @property {Object} summary - Summary statistics
 */

/**
 * Run comprehensive health check on the knowledge pipeline
 * @returns {Promise<PipelineHealth>}
 */
export async function checkPipelineHealth() {
  const components = [];
  const startTime = Date.now();

  // 1. Check Supabase connection
  components.push(await checkSupabaseConnection());

  // 2. Check documents table
  components.push(await checkDocumentsTable());

  // 3. Check embeddings table
  components.push(await checkEmbeddingsTable());

  // 4. Check embedding generation (Gemini)
  components.push(await checkEmbeddingGeneration());

  // 5. Check search functionality
  components.push(await checkSearchFunctionality());

  // 6. Check recent documents have embeddings
  components.push(await checkRecentDocumentEmbeddings());

  // Calculate overall health
  const healthyCount = components.filter(c => c.healthy).length;
  const totalCount = components.length;
  const allHealthy = healthyCount === totalCount;
  const mostHealthy = healthyCount >= totalCount - 1;

  return {
    healthy: allHealthy,
    status: allHealthy ? 'healthy' : (mostHealthy ? 'degraded' : 'unhealthy'),
    timestamp: Date.now(),
    totalLatencyMs: Date.now() - startTime,
    components,
    summary: {
      total: totalCount,
      healthy: healthyCount,
      unhealthy: totalCount - healthyCount,
    },
  };
}

/**
 * Check Supabase connection
 */
async function checkSupabaseConnection() {
  const start = Date.now();
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return {
        component: 'supabase_connection',
        healthy: false,
        message: 'Supabase client not initialized',
        latencyMs: Date.now() - start,
      };
    }

    // Simple query to verify connection
    const { error } = await supabase.from('documents').select('id').limit(1);

    if (error) {
      return {
        component: 'supabase_connection',
        healthy: false,
        message: `Connection error: ${error.message}`,
        latencyMs: Date.now() - start,
      };
    }

    return {
      component: 'supabase_connection',
      healthy: true,
      message: 'Connected',
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      component: 'supabase_connection',
      healthy: false,
      message: `Exception: ${error.message}`,
      latencyMs: Date.now() - start,
    };
  }
}

/**
 * Check documents table accessibility and counts
 */
async function checkDocumentsTable() {
  const start = Date.now();
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return {
        component: 'documents_table',
        healthy: false,
        message: 'Supabase not available',
        latencyMs: Date.now() - start,
      };
    }

    // Get document counts by status
    const { data, error } = await supabase
      .from('documents')
      .select('embedding_status')
      .eq('archived', false);

    if (error) {
      return {
        component: 'documents_table',
        healthy: false,
        message: `Query error: ${error.message}`,
        latencyMs: Date.now() - start,
      };
    }

    const total = data?.length || 0;
    const complete = data?.filter(d => d.embedding_status === 'complete').length || 0;
    const pending = data?.filter(d => d.embedding_status === 'pending').length || 0;
    const errors = data?.filter(d => d.embedding_status === 'error').length || 0;

    return {
      component: 'documents_table',
      healthy: total > 0,
      message: total > 0 ? `${total} documents` : 'No documents found',
      latencyMs: Date.now() - start,
      details: { total, complete, pending, errors },
    };
  } catch (error) {
    return {
      component: 'documents_table',
      healthy: false,
      message: `Exception: ${error.message}`,
      latencyMs: Date.now() - start,
    };
  }
}

/**
 * Check embeddings table has entries
 */
async function checkEmbeddingsTable() {
  const start = Date.now();
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return {
        component: 'embeddings_table',
        healthy: false,
        message: 'Supabase not available',
        latencyMs: Date.now() - start,
      };
    }

    // Count embeddings
    const { count, error } = await supabase
      .from('embeddings')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        component: 'embeddings_table',
        healthy: false,
        message: `Query error: ${error.message}`,
        latencyMs: Date.now() - start,
      };
    }

    const hasEmbeddings = (count || 0) > 0;

    return {
      component: 'embeddings_table',
      healthy: hasEmbeddings,
      message: hasEmbeddings ? `${count} embeddings` : 'No embeddings found',
      latencyMs: Date.now() - start,
      details: { count },
    };
  } catch (error) {
    return {
      component: 'embeddings_table',
      healthy: false,
      message: `Exception: ${error.message}`,
      latencyMs: Date.now() - start,
    };
  }
}

/**
 * Check embedding generation (Gemini API)
 */
async function checkEmbeddingGeneration() {
  const start = Date.now();
  try {
    const testText = 'Grove distributed AI infrastructure health check';
    const embedding = await generateEmbedding(testText);

    const isValid = Array.isArray(embedding) && embedding.length === 768;

    return {
      component: 'embedding_generation',
      healthy: isValid,
      message: isValid ? `Generated 768-dim vector` : `Invalid embedding: ${embedding?.length || 0} dims`,
      latencyMs: Date.now() - start,
      details: { dimensions: embedding?.length },
    };
  } catch (error) {
    return {
      component: 'embedding_generation',
      healthy: false,
      message: `Exception: ${error.message}`,
      latencyMs: Date.now() - start,
    };
  }
}

/**
 * Check search functionality (end-to-end)
 */
async function checkSearchFunctionality() {
  const start = Date.now();
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return {
        component: 'search_functionality',
        healthy: false,
        message: 'Supabase not available',
        latencyMs: Date.now() - start,
      };
    }

    // Generate test embedding
    const testQuery = 'Grove distributed AI infrastructure';
    const embedding = await generateEmbedding(testQuery);

    // Run search
    const { data, error } = await supabase.rpc('search_documents', {
      query_embedding: `[${embedding.join(',')}]`,
      match_count: 5,
      match_threshold: 0.3,
    });

    if (error) {
      return {
        component: 'search_functionality',
        healthy: false,
        message: `Search error: ${error.message}`,
        latencyMs: Date.now() - start,
      };
    }

    const resultCount = data?.length || 0;

    return {
      component: 'search_functionality',
      healthy: resultCount > 0,
      message: resultCount > 0 ? `Found ${resultCount} results` : 'No results (may be OK for empty DB)',
      latencyMs: Date.now() - start,
      details: { resultCount, query: testQuery },
    };
  } catch (error) {
    return {
      component: 'search_functionality',
      healthy: false,
      message: `Exception: ${error.message}`,
      latencyMs: Date.now() - start,
    };
  }
}

/**
 * Check that recently uploaded documents have embeddings
 */
async function checkRecentDocumentEmbeddings() {
  const start = Date.now();
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return {
        component: 'recent_embeddings',
        healthy: false,
        message: 'Supabase not available',
        latencyMs: Date.now() - start,
      };
    }

    // Get documents from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: recentDocs, error: docsError } = await supabase
      .from('documents')
      .select('id, title, embedding_status')
      .eq('archived', false)
      .gte('created_at', oneDayAgo);

    if (docsError) {
      return {
        component: 'recent_embeddings',
        healthy: false,
        message: `Query error: ${docsError.message}`,
        latencyMs: Date.now() - start,
      };
    }

    const recentCount = recentDocs?.length || 0;

    if (recentCount === 0) {
      return {
        component: 'recent_embeddings',
        healthy: true,
        message: 'No documents in last 24h (OK)',
        latencyMs: Date.now() - start,
        details: { recentCount: 0 },
      };
    }

    // Check which have embeddings
    const docIds = recentDocs.map(d => d.id);
    const { data: embeddings, error: embError } = await supabase
      .from('embeddings')
      .select('document_id')
      .in('document_id', docIds)
      .is('chunk_id', null); // Document-level embeddings

    if (embError) {
      return {
        component: 'recent_embeddings',
        healthy: false,
        message: `Embeddings query error: ${embError.message}`,
        latencyMs: Date.now() - start,
      };
    }

    const embeddedIds = new Set(embeddings?.map(e => e.document_id) || []);
    const withEmbeddings = docIds.filter(id => embeddedIds.has(id)).length;
    const missingEmbeddings = recentCount - withEmbeddings;

    const healthy = missingEmbeddings === 0;

    return {
      component: 'recent_embeddings',
      healthy,
      message: healthy
        ? `All ${recentCount} recent docs have embeddings`
        : `${missingEmbeddings}/${recentCount} recent docs missing embeddings`,
      latencyMs: Date.now() - start,
      details: {
        recentCount,
        withEmbeddings,
        missingEmbeddings,
        missingDocs: recentDocs
          .filter(d => !embeddedIds.has(d.id))
          .map(d => ({ id: d.id, title: d.title, status: d.embedding_status })),
      },
    };
  } catch (error) {
    return {
      component: 'recent_embeddings',
      healthy: false,
      message: `Exception: ${error.message}`,
      latencyMs: Date.now() - start,
    };
  }
}

/**
 * Quick health check (just connection + basic queries)
 * Use this for frequent polling
 */
export async function checkQuickHealth() {
  const start = Date.now();

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return { healthy: false, message: 'Supabase not configured' };
    }

    const { count, error } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('archived', false);

    if (error) {
      return { healthy: false, message: error.message };
    }

    return {
      healthy: true,
      message: 'OK',
      documentCount: count,
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return { healthy: false, message: error.message };
  }
}
