// lib/knowledge/types.js
// Type definitions for the Kinetic Pipeline (JSDoc)
// Sprint: kinetic-pipeline-v1

/**
 * Convert database row to Document
 * @param {Object} row - Database row
 * @returns {Object} Document object
 */
export function rowToDocument(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    contentHash: row.content_hash,
    tier: row.tier,
    tierUpdatedAt: new Date(row.tier_updated_at),
    sourceType: row.source_type,
    sourceUrl: row.source_url,
    fileType: row.file_type,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    embeddingStatus: row.embedding_status,
    embeddingError: row.embedding_error,
    archived: row.archived,
    // Enrichment fields (Sprint: rag-discovery-enhancement-v1)
    keywords: row.keywords || [],
    summary: row.summary || null,
    namedEntities: row.named_entities || { people: [], organizations: [], concepts: [], technologies: [] },
    documentType: row.document_type || null,
    questionsAnswered: row.questions_answered || [],
    temporalClass: row.temporal_class || 'evergreen',
    enrichedAt: row.enriched_at ? new Date(row.enriched_at) : null,
  };
}

/**
 * Convert Document to database row format
 * @param {Object} doc - Document object
 * @returns {Object} Database row
 */
export function documentToRow(doc) {
  const row = {};
  if (doc.title !== undefined) row.title = doc.title;
  if (doc.content !== undefined) row.content = doc.content;
  if (doc.contentHash !== undefined) row.content_hash = doc.contentHash;
  if (doc.tier !== undefined) row.tier = doc.tier;
  if (doc.sourceType !== undefined) row.source_type = doc.sourceType;
  if (doc.sourceUrl !== undefined) row.source_url = doc.sourceUrl;
  if (doc.fileType !== undefined) row.file_type = doc.fileType;
  if (doc.createdBy !== undefined) row.created_by = doc.createdBy;
  if (doc.embeddingStatus !== undefined) row.embedding_status = doc.embeddingStatus;
  if (doc.embeddingError !== undefined) row.embedding_error = doc.embeddingError;
  if (doc.archived !== undefined) row.archived = doc.archived;
  return row;
}
