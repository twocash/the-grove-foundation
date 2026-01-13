// src/core/schema/evidence-bundle.ts
// Evidence Bundle - Output artifact from research execution
// Sprint: evidence-collection-v1
//
// DEX: Provenance as Infrastructure
// Every piece of evidence traces to its source with full attribution.

import { z } from 'zod';

// =============================================================================
// Source Schema (Provenance)
// =============================================================================

export const SourceSchema = z.object({
  /** Original source URL */
  url: z.string().url(),

  /** Page/document title */
  title: z.string(),

  /** Relevant excerpt from source */
  snippet: z.string(),

  /** ISO timestamp when source was accessed */
  accessedAt: z.string().datetime(),

  /** Source type classification */
  sourceType: z.enum(['academic', 'practitioner', 'news', 'primary']).optional(),
});

export type Source = z.infer<typeof SourceSchema>;

// =============================================================================
// Branch Evidence Schema
// =============================================================================

export const BranchEvidenceSchema = z.object({
  /** The query used for this branch */
  branchQuery: z.string(),

  /** Sources retrieved for this branch */
  sources: z.array(SourceSchema),

  /** Distilled findings from sources */
  findings: z.array(z.string()),

  /** Relevance score 0-1 */
  relevanceScore: z.number().min(0).max(1),

  /** Branch processing status */
  status: z.enum(['pending', 'complete', 'failed', 'budget-exceeded']),
});

export type BranchEvidence = z.infer<typeof BranchEvidenceSchema>;

// =============================================================================
// Evidence Bundle Schema
// =============================================================================

export const EvidenceBundleSchema = z.object({
  /** Link to originating sprout */
  sproutId: z.string(),

  /** Evidence collected per research branch */
  branches: z.array(BranchEvidenceSchema),

  /** Total count of sources consulted */
  totalSources: z.number(),

  /** Execution duration in milliseconds */
  executionTime: z.number(),

  /** Overall confidence score 0-1 */
  confidenceScore: z.number().min(0).max(1),

  /** ISO timestamp when bundle was created */
  createdAt: z.string().datetime(),

  /** Number of API calls used */
  apiCallsUsed: z.number(),
});

export type EvidenceBundle = z.infer<typeof EvidenceBundleSchema>;

// =============================================================================
// Factory
// =============================================================================

export function createEvidenceBundle(
  sproutId: string,
  branches: BranchEvidence[],
  executionTime: number,
  apiCallsUsed: number
): EvidenceBundle {
  const totalSources = branches.reduce((sum, b) => sum + b.sources.length, 0);
  const avgRelevance = branches.length > 0
    ? branches.reduce((sum, b) => sum + b.relevanceScore, 0) / branches.length
    : 0;

  return {
    sproutId,
    branches,
    totalSources,
    executionTime,
    confidenceScore: avgRelevance,
    createdAt: new Date().toISOString(),
    apiCallsUsed,
  };
}
