// src/surface/components/modals/SproutFinishingRoom/json-render/catalog.ts
// Sprint: S19-BD-JsonRenderFactory (migrated from S2-SFR-Display)
// Pattern: json-render catalog using factory pattern
// ResearchCatalog for AI-generated research documents

import { z } from 'zod';
import { createCatalog, type CatalogDefinition } from '@core/json-render';

/**
 * ResearchCatalog - Defines the component vocabulary for AI-generated research documents
 *
 * This catalog constrains what components AI can generate, ensuring predictable,
 * schema-compliant output. Each component has a Zod schema for validation.
 *
 * Components:
 * - ResearchHeader: Position statement and query
 * - AnalysisBlock: Markdown-formatted analysis content
 * - SourceList: Citations with links
 * - LimitationsBlock: What could not be determined
 * - Metadata: Status, confidence, word count
 */

// Schema definitions
export const ResearchHeaderSchema = z.object({
  position: z.string().describe('Main thesis or position statement'),
  query: z.string().describe('Original user query'),
});

export const AnalysisBlockSchema = z.object({
  content: z.string().describe('Markdown-formatted analysis'),
});

export const SourceSchema = z.object({
  index: z.number(),
  title: z.string(),
  url: z.string().url(),
  snippet: z.string().optional(),
});

export const SourceListSchema = z.object({
  sources: z.array(SourceSchema),
});

export const LimitationsBlockSchema = z.object({
  content: z.string().describe('What could not be determined'),
});

export const MetadataSchema = z.object({
  status: z.enum(['complete', 'partial', 'insufficient-evidence']),
  confidenceScore: z.number().min(0).max(1),
  wordCount: z.number(),
});

// ============================================================================
// CATALOG DEFINITION (using factory pattern)
// ============================================================================

export const ResearchCatalog: CatalogDefinition = createCatalog({
  name: 'research',
  version: '2.0.0',
  components: {
    ResearchHeader: {
      props: ResearchHeaderSchema,
      category: 'data',
      description: 'Position statement and query header',
      agentHint: 'Use at the top of research documents with thesis and query',
    },
    AnalysisBlock: {
      props: AnalysisBlockSchema,
      category: 'data',
      description: 'Markdown-formatted analysis content block',
      agentHint: 'Display main research analysis with markdown support',
    },
    SourceList: {
      props: SourceListSchema,
      category: 'data',
      description: 'Citations with links and snippets',
      agentHint: 'List sources with numbered indices and URLs',
    },
    LimitationsBlock: {
      props: LimitationsBlockSchema,
      category: 'data',
      description: 'What could not be determined section',
      agentHint: 'Display research limitations and knowledge gaps',
    },
    Metadata: {
      props: MetadataSchema,
      category: 'feedback',
      description: 'Status, confidence score, and word count',
      agentHint: 'Show research completion status and metrics',
    },
  },
});

// Type exports
export type ResearchCatalogType = typeof ResearchCatalog;
export type ResearchHeaderProps = z.infer<typeof ResearchHeaderSchema>;
export type AnalysisBlockProps = z.infer<typeof AnalysisBlockSchema>;
export type SourceListProps = z.infer<typeof SourceListSchema>;
export type LimitationsBlockProps = z.infer<typeof LimitationsBlockSchema>;
export type MetadataProps = z.infer<typeof MetadataSchema>;

// ============================================================================
// BACKWARD COMPATIBILITY: Re-export core types
// ============================================================================

// Re-export RenderElement and RenderTree from core for consumers who imported
// from this file. New code should import directly from '@core/json-render'.
export type { RenderElement, RenderTree } from '@core/json-render';
