// lib/knowledge/synthesize.js
// Journey synthesis from Hub clusters
// Sprint: kinetic-pipeline-v1

import { getSupabaseAdmin } from '../supabase.js';

/**
 * Synthesize journeys for all approved hubs
 * Uses semantic ordering to create paths through hub documents
 * @param {Object} [options]
 * @returns {Promise<{journeysCreated: number, runId: string}>}
 */
export async function synthesizeJourneys(options = {}) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  // Create pipeline run record
  const { data: run, error: runError } = await supabaseAdmin
    .from('pipeline_runs')
    .insert({ stage: 'synthesize' })
    .select('id')
    .single();

  if (runError) {
    throw new Error(`Failed to create run: ${runError.message}`);
  }

  try {
    // Get approved hubs (or all suggested if includesSuggested)
    const statusFilter = options.includeSuggested
      ? ['suggested', 'approved']
      : ['approved'];

    const { data: hubs, error: hubsError } = await supabaseAdmin
      .from('suggested_hubs')
      .select('id, suggested_title, title_override, member_doc_ids')
      .in('status', statusFilter);

    if (hubsError) {
      throw new Error(`Failed to get hubs: ${hubsError.message}`);
    }

    console.log(`[Synthesize] Processing ${hubs?.length || 0} hubs`);

    let journeysCreated = 0;

    for (const hub of hubs || []) {
      const docIds = hub.member_doc_ids;
      if (!docIds || docIds.length < 2) {
        console.log(`[Synthesize] Skipping hub ${hub.id}: not enough documents`);
        continue;
      }

      // Get document embeddings for ordering
      const { data: embeddings } = await supabaseAdmin
        .from('embeddings')
        .select('document_id, embedding')
        .in('document_id', docIds)
        .is('chunk_id', null);

      if (!embeddings || embeddings.length < 2) {
        console.log(`[Synthesize] Skipping hub ${hub.id}: not enough embeddings`);
        continue;
      }

      // Parse embeddings
      const docs = embeddings.map(e => ({
        id: e.document_id,
        vector: parseEmbedding(e.embedding),
      }));

      // Get document titles for journey naming
      const { data: docDetails } = await supabaseAdmin
        .from('documents')
        .select('id, title')
        .in('id', docIds);

      const titleMap = new Map((docDetails || []).map(d => [d.id, d.title]));

      // Order documents using nearest neighbor traversal
      const orderedIds = orderDocuments(docs);

      // Generate journey title
      const hubTitle = hub.title_override || hub.suggested_title;
      const journeyTitle = `Journey: ${hubTitle.replace(/^Hub:\s*/, '')}`;

      // Insert journey
      const { error: insertError } = await supabaseAdmin
        .from('suggested_journeys')
        .insert({
          hub_id: hub.id,
          suggested_title: journeyTitle,
          node_doc_ids: orderedIds,
          synthesis_method: 'nearest-neighbor',
        });

      if (!insertError) {
        journeysCreated++;
        console.log(`[Synthesize] Created journey for hub ${hub.id}: ${orderedIds.length} nodes`);
      } else {
        console.error(`[Synthesize] Failed to insert journey:`, insertError);
      }
    }

    // Update run
    await supabaseAdmin
      .from('pipeline_runs')
      .update({
        completed_at: new Date().toISOString(),
        status: 'complete',
        journeys_created: journeysCreated,
        documents_processed: hubs?.length || 0,
      })
      .eq('id', run.id);

    return { journeysCreated, runId: run.id };

  } catch (error) {
    console.error('[Synthesize] Error:', error);

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
 * Order documents using nearest neighbor algorithm
 * Creates a semantic path through the documents
 */
function orderDocuments(docs) {
  if (docs.length === 0) return [];
  if (docs.length === 1) return [docs[0].id];

  const ordered = [];
  const remaining = new Set(docs.map(d => d.id));

  // Start with first document
  let current = docs[0];
  ordered.push(current.id);
  remaining.delete(current.id);

  // Greedily add nearest neighbor
  while (remaining.size > 0) {
    let bestNext = null;
    let bestSim = -1;

    for (const doc of docs) {
      if (!remaining.has(doc.id)) continue;

      const sim = cosineSimilarity(current.vector, doc.vector);
      if (sim > bestSim) {
        bestSim = sim;
        bestNext = doc;
      }
    }

    if (bestNext) {
      ordered.push(bestNext.id);
      remaining.delete(bestNext.id);
      current = bestNext;
    } else {
      // Fallback: add remaining in original order
      for (const id of remaining) {
        ordered.push(id);
      }
      break;
    }
  }

  return ordered;
}

/**
 * Get suggested journeys
 * @param {Object} [options]
 * @returns {Promise<Array>}
 */
export async function getSuggestedJourneys(options = {}) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  let query = supabaseAdmin
    .from('suggested_journeys')
    .select(`
      *,
      hub:suggested_hubs(id, suggested_title, title_override)
    `)
    .order('computed_at', { ascending: false });

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.hubId) {
    query = query.eq('hub_id', options.hubId);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get journeys: ${error.message}`);
  }

  return data || [];
}

/**
 * Get journey with full document details
 * @param {string} journeyId
 * @returns {Promise<Object>}
 */
export async function getJourneyWithNodes(journeyId) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const { data: journey, error: journeyError } = await supabaseAdmin
    .from('suggested_journeys')
    .select(`
      *,
      hub:suggested_hubs(id, suggested_title, title_override)
    `)
    .eq('id', journeyId)
    .single();

  if (journeyError || !journey) {
    throw new Error('Journey not found');
  }

  // Get document details in order
  const { data: docs } = await supabaseAdmin
    .from('documents')
    .select('id, title, content')
    .in('id', journey.node_doc_ids);

  // Reorder to match journey order
  const docMap = new Map((docs || []).map(d => [d.id, d]));
  const orderedNodes = journey.node_doc_ids
    .map(id => docMap.get(id))
    .filter(Boolean)
    .map((doc, index) => ({
      index,
      id: doc.id,
      title: doc.title,
      snippet: doc.content.slice(0, 200) + '...',
    }));

  return {
    ...journey,
    nodes: orderedNodes,
  };
}

/**
 * Approve or reject a suggested journey
 * @param {string} journeyId
 * @param {'approved'|'rejected'} status
 * @param {string} [titleOverride]
 */
export async function updateJourneyStatus(journeyId, status, titleOverride) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const update = { status };
  if (titleOverride) {
    update.title_override = titleOverride;
  }

  const { error } = await supabaseAdmin
    .from('suggested_journeys')
    .update(update)
    .eq('id', journeyId);

  if (error) {
    throw new Error(`Failed to update journey: ${error.message}`);
  }
}
