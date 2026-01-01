// lib/knowledge/cluster.js
// Document clustering for Hub suggestions
// Sprint: kinetic-pipeline-v1

import { getSupabaseAdmin } from '../supabase.js';

/**
 * Cluster documents into suggested hubs
 * Uses simple agglomerative clustering based on cosine similarity
 * @param {Object} [options]
 * @param {number} [options.minClusterSize=2] - Minimum documents per cluster
 * @param {number} [options.similarityThreshold=0.7] - Min similarity to cluster together
 * @returns {Promise<{hubsCreated: number, runId: string}>}
 */
export async function clusterDocuments(options = {}) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const {
    minClusterSize = 2,
    similarityThreshold = 0.7,
  } = options;

  // Create pipeline run record
  const { data: run, error: runError } = await supabaseAdmin
    .from('pipeline_runs')
    .insert({ stage: 'cluster' })
    .select('id')
    .single();

  if (runError) {
    throw new Error(`Failed to create run: ${runError.message}`);
  }

  try {
    // Get all document-level embeddings
    const { data: embeddings, error: embedError } = await supabaseAdmin
      .from('embeddings')
      .select('document_id, embedding')
      .is('chunk_id', null); // Document-level only

    if (embedError) {
      throw new Error(`Failed to get embeddings: ${embedError.message}`);
    }

    if (!embeddings || embeddings.length < minClusterSize) {
      console.log(`[Cluster] Not enough documents (${embeddings?.length || 0}) for clustering`);

      await supabaseAdmin
        .from('pipeline_runs')
        .update({
          completed_at: new Date().toISOString(),
          status: 'complete',
          clusters_created: 0,
          documents_processed: embeddings?.length || 0,
        })
        .eq('id', run.id);

      return { hubsCreated: 0, runId: run.id };
    }

    console.log(`[Cluster] Processing ${embeddings.length} documents`);

    // Parse embeddings into vectors
    const documents = embeddings.map(e => ({
      id: e.document_id,
      vector: parseEmbedding(e.embedding),
    }));

    // Simple greedy clustering
    const clusters = greedyCluster(documents, similarityThreshold, minClusterSize);
    console.log(`[Cluster] Created ${clusters.length} clusters`);

    // Get document titles for cluster naming
    const docIds = documents.map(d => d.id);
    const { data: docs } = await supabaseAdmin
      .from('documents')
      .select('id, title')
      .in('id', docIds);

    const titleMap = new Map((docs || []).map(d => [d.id, d.title]));

    // Create suggested hubs
    let hubsCreated = 0;
    for (const cluster of clusters) {
      const memberVectors = cluster.members.map(id =>
        documents.find(d => d.id === id)?.vector || []
      );
      const centroid = computeCentroid(memberVectors);
      const quality = computeClusterQuality(memberVectors, centroid);

      // Generate title from member titles
      const memberTitles = cluster.members
        .map(id => titleMap.get(id))
        .filter(Boolean)
        .slice(0, 3);
      const suggestedTitle = generateClusterTitle(memberTitles);

      const { error: insertError } = await supabaseAdmin
        .from('suggested_hubs')
        .insert({
          suggested_title: suggestedTitle,
          member_doc_ids: cluster.members,
          centroid: `[${centroid.join(',')}]`,
          cluster_quality: quality,
          algorithm: 'greedy-cosine',
          input_doc_count: documents.length,
        });

      if (!insertError) {
        hubsCreated++;
      } else {
        console.error('[Cluster] Failed to insert hub:', insertError);
      }
    }

    // Update run
    await supabaseAdmin
      .from('pipeline_runs')
      .update({
        completed_at: new Date().toISOString(),
        status: 'complete',
        clusters_created: hubsCreated,
        documents_processed: documents.length,
      })
      .eq('id', run.id);

    return { hubsCreated, runId: run.id };

  } catch (error) {
    console.error('[Cluster] Error:', error);

    await supabaseAdmin
      .from('pipeline_runs')
      .update({
        status: 'error',
        errors: [error.message],
      })
      .eq('id', run.id);

    throw error;
  }
}

/**
 * Parse embedding string to number array
 */
function parseEmbedding(embedding) {
  if (Array.isArray(embedding)) return embedding;
  if (typeof embedding === 'string') {
    // Handle "[1,2,3]" format
    const cleaned = embedding.replace(/^\[|\]$/g, '');
    return cleaned.split(',').map(Number);
  }
  return [];
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;

  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const mag = Math.sqrt(magA) * Math.sqrt(magB);
  return mag === 0 ? 0 : dot / mag;
}

/**
 * Greedy clustering based on similarity threshold
 */
function greedyCluster(documents, threshold, minSize) {
  const clusters = [];
  const assigned = new Set();

  for (const doc of documents) {
    if (assigned.has(doc.id)) continue;

    // Find all similar unassigned documents
    const cluster = [doc.id];
    assigned.add(doc.id);

    for (const other of documents) {
      if (assigned.has(other.id)) continue;

      const sim = cosineSimilarity(doc.vector, other.vector);
      if (sim >= threshold) {
        cluster.push(other.id);
        assigned.add(other.id);
      }
    }

    if (cluster.length >= minSize) {
      clusters.push({ members: cluster });
    } else {
      // Un-assign if cluster too small
      cluster.forEach(id => assigned.delete(id));
    }
  }

  return clusters;
}

/**
 * Compute cluster centroid
 */
function computeCentroid(vectors) {
  if (vectors.length === 0) return [];

  const dims = vectors[0].length;
  const centroid = new Array(dims).fill(0);

  for (const v of vectors) {
    for (let i = 0; i < dims; i++) {
      centroid[i] += v[i] / vectors.length;
    }
  }

  return centroid;
}

/**
 * Compute cluster quality (average similarity to centroid)
 */
function computeClusterQuality(vectors, centroid) {
  if (vectors.length === 0) return 0;

  let totalSim = 0;
  for (const v of vectors) {
    totalSim += cosineSimilarity(v, centroid);
  }

  return totalSim / vectors.length;
}

/**
 * Generate cluster title from member titles
 */
function generateClusterTitle(titles) {
  if (titles.length === 0) return 'Untitled Hub';
  if (titles.length === 1) return `Hub: ${titles[0]}`;

  // Find common words across titles
  const wordCounts = new Map();
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are']);

  for (const title of titles) {
    const words = title.toLowerCase().split(/\s+/);
    const seen = new Set();
    for (const word of words) {
      if (!stopWords.has(word) && word.length > 2 && !seen.has(word)) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        seen.add(word);
      }
    }
  }

  // Get most common words
  const sorted = [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

  if (sorted.length === 0) {
    return `Hub: ${titles[0].split(' ').slice(0, 3).join(' ')}`;
  }

  return `Hub: ${sorted.join(' & ')}`;
}

/**
 * Get suggested hubs
 * @param {Object} [options]
 * @returns {Promise<Array>}
 */
export async function getSuggestedHubs(options = {}) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  let query = supabaseAdmin
    .from('suggested_hubs')
    .select('*')
    .order('computed_at', { ascending: false });

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get hubs: ${error.message}`);
  }

  return data || [];
}

/**
 * Approve or reject a suggested hub
 * @param {string} hubId
 * @param {'approved'|'rejected'} status
 * @param {string} [titleOverride]
 */
export async function updateHubStatus(hubId, status, titleOverride) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const update = { status };
  if (titleOverride) {
    update.title_override = titleOverride;
  }

  const { error } = await supabaseAdmin
    .from('suggested_hubs')
    .update(update)
    .eq('id', hubId);

  if (error) {
    throw new Error(`Failed to update hub: ${error.message}`);
  }
}
