// src/surface/components/modals/SproutFinishingRoom/json-render/evidence-catalog.ts
// Sprint: S22-WP research-writer-panel-v1
// Pattern: json-render catalog for RAW research evidence display
//
// This catalog displays the FULL research results to the user.
// The user SEES their research - no hiding, no summarizing.

import { z } from 'zod';
import { createCatalog, type CatalogDefinition } from '@core/json-render';

// =============================================================================
// Schema Definitions
// =============================================================================

/**
 * Evidence Header - Shows query and research metadata
 */
export const EvidenceHeaderSchema = z.object({
  query: z.string().describe('Original research query'),
  templateName: z.string().optional().describe('Research template used'),
  totalSources: z.number().describe('Total sources consulted'),
  confidenceScore: z.number().min(0).max(1).describe('Overall confidence 0-1'),
  executionTime: z.number().describe('Execution time in ms'),
  createdAt: z.string().describe('When research was conducted'),
});

/**
 * Branch Header - Research branch divider
 */
export const BranchHeaderSchema = z.object({
  branchQuery: z.string().describe('Branch research query'),
  relevanceScore: z.number().min(0).max(1).describe('Branch relevance 0-1'),
  sourceCount: z.number().describe('Sources in this branch'),
  status: z.enum(['pending', 'complete', 'failed', 'budget-exceeded']),
});

/**
 * Source Card - Individual source with citation info
 */
export const SourceCardSchema = z.object({
  index: z.number().describe('Citation index [1], [2], etc.'),
  title: z.string().describe('Source title'),
  url: z.string().url().describe('Source URL'),
  snippet: z.string().describe('Relevant excerpt'),
  sourceType: z.enum(['academic', 'practitioner', 'news', 'primary']).optional(),
  accessedAt: z.string().describe('When source was accessed'),
});

/**
 * Findings List - Key findings from research branch
 */
export const FindingsListSchema = z.object({
  findings: z.array(z.string()).describe('Array of finding statements'),
});

/**
 * Evidence Summary - Overall summary section
 */
export const EvidenceSummarySchema = z.object({
  branchCount: z.number().describe('Number of research branches'),
  totalFindings: z.number().describe('Total findings across branches'),
  apiCallsUsed: z.number().describe('API calls consumed'),
});

// =============================================================================
// Catalog Definition
// =============================================================================

export const EvidenceCatalog: CatalogDefinition = createCatalog({
  name: 'evidence',
  version: '1.0.0',
  components: {
    EvidenceHeader: {
      props: EvidenceHeaderSchema,
      category: 'data',
      description: 'Research query and execution metadata',
      agentHint: 'Display at top showing what was researched and when',
    },
    BranchHeader: {
      props: BranchHeaderSchema,
      category: 'data',
      description: 'Research branch section header',
      agentHint: 'Divide research into logical branches with queries',
    },
    SourceCard: {
      props: SourceCardSchema,
      category: 'data',
      description: 'Individual source citation card',
      agentHint: 'Display source with title, URL, snippet, and index',
    },
    FindingsList: {
      props: FindingsListSchema,
      category: 'data',
      description: 'List of key findings from research',
      agentHint: 'Bullet list of distilled findings',
    },
    EvidenceSummary: {
      props: EvidenceSummarySchema,
      category: 'feedback',
      description: 'Research execution summary metrics',
      agentHint: 'Footer with branch count, findings count, API usage',
    },
  },
});

// =============================================================================
// Type Exports
// =============================================================================

export type EvidenceCatalogType = typeof EvidenceCatalog;
export type EvidenceHeaderProps = z.infer<typeof EvidenceHeaderSchema>;
export type BranchHeaderProps = z.infer<typeof BranchHeaderSchema>;
export type SourceCardProps = z.infer<typeof SourceCardSchema>;
export type FindingsListProps = z.infer<typeof FindingsListSchema>;
export type EvidenceSummaryProps = z.infer<typeof EvidenceSummarySchema>;
