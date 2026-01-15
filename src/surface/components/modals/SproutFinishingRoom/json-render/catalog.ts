// src/surface/components/modals/SproutFinishingRoom/json-render/catalog.ts
// Sprint: S2-SFR-Display - US-C001 ResearchCatalog definition
// Pattern: json-render catalog (Vercel Labs)

import { z } from 'zod';

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

// Catalog type definition
export const ResearchCatalog = {
  components: {
    ResearchHeader: { props: ResearchHeaderSchema },
    AnalysisBlock: { props: AnalysisBlockSchema },
    SourceList: { props: SourceListSchema },
    LimitationsBlock: { props: LimitationsBlockSchema },
    Metadata: { props: MetadataSchema },
  },
} as const;

// Type exports
export type ResearchCatalogType = typeof ResearchCatalog;
export type ResearchHeaderProps = z.infer<typeof ResearchHeaderSchema>;
export type AnalysisBlockProps = z.infer<typeof AnalysisBlockSchema>;
export type SourceListProps = z.infer<typeof SourceListSchema>;
export type LimitationsBlockProps = z.infer<typeof LimitationsBlockSchema>;
export type MetadataProps = z.infer<typeof MetadataSchema>;

// Element type for renderer
export interface RenderElement<T = unknown> {
  type: string;
  props: T;
}

export interface RenderTree {
  type: 'root';
  children: RenderElement[];
}
