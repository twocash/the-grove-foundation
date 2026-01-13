// src/explore/services/knowledge-base-integration.ts
// Knowledge Base Integration - Promote research documents to corpus
// Sprint: knowledge-base-integration-v1
//
// DEX: Provenance as Infrastructure
// Every document traces back to its research origin.

import type { GroveDataProvider, CreateOptions } from '@core/data/grove-data-provider';
import type { GroveObject } from '@core/schema/grove-object';

// =============================================================================
// Types
// =============================================================================

/**
 * Provenance metadata for corpus documents
 */
export interface DocumentProvenance {
  /** Original user query (spark) */
  spark: string;

  /** ResearchSprout ID that initiated the research */
  sproutId: string;

  /** EvidenceBundle ID used for writing */
  evidenceBundleId: string;

  /** WriterAgentConfig snapshot ID at creation time (null if not captured) */
  configSnapshotId: string | null;

  /** ISO timestamp when added to corpus */
  addedAt: string;
}

/**
 * Corpus document payload (extends ResearchDocument fields)
 */
export interface CorpusDocumentPayload {
  /** Original research query */
  query: string;

  /** Position/thesis statement */
  position: string;

  /** Full analysis in markdown */
  analysis: string;

  /** What couldn't be determined */
  limitations?: string;

  /** Citations referenced in analysis */
  citations: Array<{
    index: number;
    title: string;
    url: string;
    snippet: string;
    domain: string;
    accessedAt: string;
  }>;

  /** Word count of analysis */
  wordCount: number;

  /** Processing status */
  documentStatus: 'complete' | 'partial' | 'insufficient-evidence';

  /** Confidence score (0-1) */
  confidenceScore: number;

  /** Provenance chain */
  provenance: DocumentProvenance;
}

/**
 * Result from addToKnowledgeBase operation
 */
export interface AddToKnowledgeBaseResult {
  /** Whether the operation succeeded */
  success: boolean;

  /** Created document ID (if success) */
  documentId?: string;

  /** Error message (if failed) */
  error?: string;

  /** Whether this was a duplicate detection */
  isDuplicate?: boolean;
}

/**
 * Research document input for adding to knowledge base
 */
export interface ResearchDocumentInput {
  id: string;
  evidenceBundleId: string;
  query: string;
  position: string;
  analysis: string;
  limitations?: string;
  citations: Array<{
    index: number;
    title: string;
    url: string;
    snippet: string;
    domain: string;
    accessedAt: string;
  }>;
  wordCount: number;
  status: 'complete' | 'partial' | 'insufficient-evidence';
  confidenceScore: number;
}

/**
 * Sprout input with provenance context
 */
export interface SproutInput {
  id: string;
  spark: string;
  groveConfigSnapshot?: {
    configVersionId: string;
  };
}

/**
 * Input for adding to knowledge base
 */
export interface AddToKnowledgeBaseInput {
  /** The research document to add */
  document: ResearchDocumentInput;

  /** The source sprout */
  sprout: SproutInput;
}

// =============================================================================
// Main Function
// =============================================================================

/**
 * Add a research document to the grove's knowledge corpus
 *
 * @param provider - GroveDataProvider instance
 * @param input - Document and sprout to add
 * @returns Result with document ID or error
 */
export async function addToKnowledgeBase(
  provider: GroveDataProvider,
  input: AddToKnowledgeBaseInput
): Promise<AddToKnowledgeBaseResult> {
  const { document, sprout } = input;

  console.log(`[KnowledgeBase] Adding document to corpus: ${document.query.slice(0, 50)}...`);

  try {
    // Build provenance chain
    const provenance: DocumentProvenance = {
      spark: sprout.spark,
      sproutId: sprout.id,
      evidenceBundleId: document.evidenceBundleId,
      configSnapshotId: sprout.groveConfigSnapshot?.configVersionId ?? null,
      addedAt: new Date().toISOString(),
    };

    // Build corpus document payload
    const payload: CorpusDocumentPayload = {
      query: document.query,
      position: document.position,
      analysis: document.analysis,
      limitations: document.limitations,
      citations: document.citations,
      wordCount: document.wordCount,
      documentStatus: document.status,
      confidenceScore: document.confidenceScore,
      provenance,
    };

    // Generate title from query
    const title = generateTitle(document.query);

    // Generate unique ID
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Create GroveObject wrapper
    const groveObject: GroveObject<CorpusDocumentPayload> = {
      meta: {
        id,
        type: 'document',
        title,
        description: document.position.slice(0, 200),
        createdAt: now,
        updatedAt: now,
        status: 'active',
        tags: ['research', 'auto-generated'],
        createdBy: {
          type: 'ai',
          actorId: 'research-pipeline',
          context: {
            sourceFile: `sprout:${sprout.id}`,
          },
        },
      },
      payload,
    };

    // Save to corpus via provider
    const createOptions: CreateOptions = {
      triggerEmbedding: true, // Trigger embedding pipeline
    };

    const created = await provider.create('document', groveObject, createOptions);

    console.log(`[KnowledgeBase] Document created: ${created.meta.id}`);

    return {
      success: true,
      documentId: created.meta.id,
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[KnowledgeBase] Failed to add document:`, message);

    return {
      success: false,
      error: message,
    };
  }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Generate a title from the query
 */
function generateTitle(query: string): string {
  const maxLen = 60;
  if (query.length <= maxLen) return query;

  const truncated = query.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');

  return lastSpace > 30
    ? truncated.slice(0, lastSpace) + '...'
    : truncated + '...';
}

// =============================================================================
// Exports
// =============================================================================

export type { GroveObject };
