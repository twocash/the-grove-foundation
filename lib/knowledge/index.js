// lib/knowledge/index.js
// Barrel export for Kinetic Pipeline knowledge module
// Sprint: kinetic-pipeline-v1

export { rowToDocument, documentToRow } from './types.js';

export {
  chunkDocument,
  estimateTokens,
  getChunkStats,
  DEFAULT_CHUNK_CONFIG,
} from './chunk.js';

export {
  ingestDocument,
  getDocument,
  listDocuments,
  updateDocument,
  deleteDocument,
  getDocumentChunks,
  getPendingDocuments,
  getPipelineStats,
} from './ingest.js';

export {
  embedDocument,
  embedPendingDocuments,
  getEmbeddingStats,
} from './embed.js';

export {
  searchDocuments,
  findSimilarDocuments,
  getContextForQuery,
} from './search.js';

export {
  clusterDocuments,
  getSuggestedHubs,
  updateHubStatus,
} from './cluster.js';

export {
  synthesizeJourneys,
  getSuggestedJourneys,
  getJourneyWithNodes,
  updateJourneyStatus,
} from './synthesize.js';
