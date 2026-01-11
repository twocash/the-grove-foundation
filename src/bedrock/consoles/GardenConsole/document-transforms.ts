// src/bedrock/consoles/GardenConsole/document-transforms.ts
// Transform functions between Document API and GroveObject shape
// Sprint: hotfix-pipeline-factory-v2
// Note: API returns camelCase fields (embeddingStatus), types use snake_case

import type { GroveObject } from '../../../core/schema/grove-object';
import type { DocumentPayload } from './types';

/**
 * Raw API response shape (camelCase from rowToDocument in lib/knowledge/types.js)
 */
interface APIDocument {
  id: string;
  title: string;
  content?: string;
  contentHash?: string;
  tier: string;
  tierUpdatedAt?: string;
  sourceType?: string;
  sourceUrl?: string;
  fileType?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  embeddingStatus: string;  // camelCase from API
  embeddingError?: string;
  archived?: boolean;
  // Enrichment fields (if present)
  keywords?: string[];
  summary?: string;
  documentType?: string;
  namedEntities?: { people: string[]; organizations: string[]; concepts: string[]; technologies: string[] };
  questionsAnswered?: string[];
  temporalClass?: string;
  retrievalCount?: number;
  retrievalQueries?: string[];
  lastRetrievedAt?: string;
  utilityScore?: number;
  sourceContext?: Record<string, unknown>;
  derivedFrom?: string[];
  derivatives?: string[];
  citedBySprouts?: string[];
  editorialNotes?: string;
  enrichedAt?: string;
  enrichedBy?: string;
  enrichmentModel?: string;
}

/**
 * Transform API Document (camelCase) to GroveObject<DocumentPayload>
 */
export function documentToGroveObject(doc: APIDocument): GroveObject<DocumentPayload> {
  // Handle both camelCase API response and potential snake_case
  const embeddingStatus = doc.embeddingStatus || (doc as unknown as { embedding_status?: string }).embedding_status || 'pending';
  const createdAt = doc.createdAt || (doc as unknown as { created_at?: string }).created_at || new Date().toISOString();
  const updatedAt = doc.updatedAt || (doc as unknown as { updated_at?: string }).updated_at || createdAt;
  
  return {
    meta: {
      id: doc.id,
      type: 'document',
      title: doc.title || 'Untitled',
      description: doc.summary || '',
      icon: 'description',
      status: embeddingStatus === 'complete' ? 'active' : 'draft',
      createdAt: typeof createdAt === 'string' ? createdAt : new Date(createdAt).toISOString(),
      updatedAt: typeof updatedAt === 'string' ? updatedAt : new Date(updatedAt).toISOString(),
    },
    payload: {
      // Core document fields
      tier: (doc.tier as DocumentPayload['tier']) || 'seed',
      source_url: doc.sourceUrl || (doc as unknown as { source_url?: string }).source_url || '',
      file_type: doc.fileType || (doc as unknown as { file_type?: string }).file_type || '',
      content_length: doc.content?.length || 0,
      embedding_status: embeddingStatus,

      // Enrichment
      keywords: doc.keywords || [],
      summary: doc.summary || '',
      document_type: doc.documentType as DocumentPayload['document_type'],
      named_entities: doc.namedEntities || { people: [], organizations: [], concepts: [], technologies: [] },
      questions_answered: doc.questionsAnswered || [],
      temporal_class: doc.temporalClass || 'evergreen',

      // Usage signals
      retrieval_count: doc.retrievalCount || 0,
      retrieval_queries: doc.retrievalQueries || [],
      last_retrieved_at: doc.lastRetrievedAt,
      utility_score: doc.utilityScore || 0,

      // Provenance
      source_context: doc.sourceContext || {},
      derived_from: doc.derivedFrom || [],
      derivatives: doc.derivatives || [],
      cited_by_sprouts: doc.citedBySprouts || [],

      // Editorial
      editorial_notes: doc.editorialNotes || '',
      enriched_at: doc.enrichedAt,
      enriched_by: doc.enrichedBy as DocumentPayload['enriched_by'],
      enrichment_model: doc.enrichmentModel,
    },
  };
}

/**
 * Transform GroveObject<DocumentPayload> back to API format for updates
 */
export function groveObjectToAPIUpdate(obj: GroveObject<DocumentPayload>): Record<string, unknown> {
  return {
    title: obj.meta.title,
    tier: obj.payload.tier,
    embeddingStatus: obj.payload.embedding_status,
    keywords: obj.payload.keywords,
    summary: obj.payload.summary,
    documentType: obj.payload.document_type,
    namedEntities: obj.payload.named_entities,
    questionsAnswered: obj.payload.questions_answered,
    temporalClass: obj.payload.temporal_class,
    editorialNotes: obj.payload.editorial_notes,
  };
}

/**
 * Create a default new document (for create action)
 */
export function createDefaultDocument(): GroveObject<DocumentPayload> {
  const now = new Date().toISOString();
  return {
    meta: {
      id: `doc-${Date.now()}`,
      type: 'document',
      title: 'New Document',
      description: '',
      icon: 'description',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    },
    payload: {
      tier: 'seed',
      source_url: '',
      file_type: '',
      content_length: 0,
      embedding_status: 'pending',
      keywords: [],
      summary: '',
      document_type: undefined,
      named_entities: { people: [], organizations: [], concepts: [], technologies: [] },
      questions_answered: [],
      temporal_class: 'evergreen',
      retrieval_count: 0,
      retrieval_queries: [],
      last_retrieved_at: undefined,
      utility_score: 0,
      source_context: {},
      derived_from: [],
      derivatives: [],
      cited_by_sprouts: [],
      editorial_notes: '',
      enriched_at: undefined,
      enriched_by: undefined,
      enrichment_model: undefined,
    },
  };
}
