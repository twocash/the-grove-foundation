// src/core/schema/research-document.ts
// Research Document - Output artifact from Writer Agent
// Sprint: writer-agent-v1
//
// DEX: Provenance as Infrastructure
// Every citation traces back to evidence sources.

import { z } from 'zod';

// =============================================================================
// Citation Schema
// =============================================================================

export const CitationSchema = z.object({
  /** Citation index [1], [2], etc. */
  index: z.number().min(1),

  /** Source title */
  title: z.string(),

  /** Source URL */
  url: z.string().url(),

  /** Relevant excerpt used in analysis */
  snippet: z.string(),

  /** Domain for credibility signal */
  domain: z.string(),

  /** ISO timestamp when source was accessed */
  accessedAt: z.string().datetime(),
});

export type Citation = z.infer<typeof CitationSchema>;

// =============================================================================
// Research Document Schema
// =============================================================================

export const ResearchDocumentSchema = z.object({
  /** Unique document ID */
  id: z.string(),

  /** Link to source EvidenceBundle */
  evidenceBundleId: z.string(),

  /** Original research query */
  query: z.string(),

  // Content
  /** Position/thesis (1-3 sentences) */
  position: z.string(),

  /** Full analysis in markdown */
  analysis: z.string(),

  /** What couldn't be determined (optional) */
  limitations: z.string().optional(),

  /** Citations referenced in analysis */
  citations: z.array(CitationSchema),

  // Metadata
  /** ISO timestamp when document was created */
  createdAt: z.string().datetime(),

  /** Word count of analysis */
  wordCount: z.number(),

  /** Processing status */
  status: z.enum(['complete', 'partial', 'insufficient-evidence']),

  /** Confidence score inherited from evidence (0-1) */
  confidenceScore: z.number().min(0).max(1),
});

export type ResearchDocument = z.infer<typeof ResearchDocumentSchema>;

// =============================================================================
// Factory
// =============================================================================

export function createResearchDocument(
  id: string,
  evidenceBundleId: string,
  query: string,
  position: string,
  analysis: string,
  citations: Citation[],
  confidenceScore: number,
  limitations?: string
): ResearchDocument {
  return {
    id,
    evidenceBundleId,
    query,
    position,
    analysis,
    limitations,
    citations,
    createdAt: new Date().toISOString(),
    wordCount: analysis.split(/\s+/).length,
    status: citations.length > 0 ? 'complete' : 'insufficient-evidence',
    confidenceScore,
  };
}

// =============================================================================
// Insufficient Evidence Factory
// =============================================================================

export function createInsufficientEvidenceDocument(
  id: string,
  evidenceBundleId: string,
  query: string
): ResearchDocument {
  return {
    id,
    evidenceBundleId,
    query,
    position: 'Insufficient evidence to form a position.',
    analysis: 'The research did not yield enough sources to provide a meaningful analysis. Consider refining the research query or expanding the search scope.',
    citations: [],
    createdAt: new Date().toISOString(),
    wordCount: 0,
    status: 'insufficient-evidence',
    confidenceScore: 0,
  };
}
