// src/bedrock/json-render/document/document-catalog.ts
// Sprint: S25-SFR garden-content-viewer-v1
// Pattern: json-render catalog using factory pattern
// DocumentCatalog for professionally-rendered markdown documents

import { z } from 'zod';
import { createCatalog, type CatalogDefinition } from '@core/json-render';

/**
 * DocumentCatalog - Defines the component vocabulary for Garden documents
 *
 * Portable document display layer. Renders markdown content with professional
 * typography via remark/rehype plugin ecosystem. Self-contained GroveSkins
 * styling (no .prose CSS dependency).
 *
 * Components:
 * - DocumentView: Top-level document wrapper with title and tier
 * - DocumentSection: Heading + markdown body (self-styled via ReactMarkdown)
 * - DocumentSource: Single source reference with title, URL, type
 * - DocumentMeta: Word count, character count, dates, confidence
 */

export const DocumentViewSchema = z.object({
  title: z.string().describe('Document title'),
  tier: z.string().describe('Garden tier (seed, sprout, sapling, tree, grove)'),
  sectionCount: z.number().optional().describe('Number of sections'),
});

export const DocumentSectionSchema = z.object({
  heading: z.string().describe('Section heading text'),
  content: z.string().describe('Markdown-formatted section content'),
  level: z.number().min(1).max(6).optional().describe('Heading level (1-6)'),
});

export const DocumentSourceSchema = z.object({
  index: z.number().describe('Source number'),
  title: z.string().describe('Source title'),
  url: z.string().describe('Source URL'),
  sourceType: z.string().optional().describe('Source type (academic, primary, etc.)'),
  relevance: z.number().min(0).max(1).optional().describe('Relevance score'),
});

export const DocumentMetaSchema = z.object({
  wordCount: z.number().optional().describe('Total word count'),
  charCount: z.number().optional().describe('Total character count'),
  createdAt: z.string().optional().describe('Creation date ISO string'),
  confidence: z.number().min(0).max(1).optional().describe('Confidence score'),
});

// ============================================================================
// CATALOG DEFINITION (using factory pattern)
// ============================================================================

export const DocumentCatalog: CatalogDefinition = createCatalog({
  name: 'document',
  version: '1.0.0',
  components: {
    DocumentView: {
      props: DocumentViewSchema,
      category: 'layout',
      description: 'Top-level document wrapper with title and tier badge',
      agentHint: 'Use as root container for document content',
    },
    DocumentSection: {
      props: DocumentSectionSchema,
      category: 'data',
      description: 'Section with heading and markdown body',
      agentHint: 'Display a document section with professional markdown rendering',
    },
    DocumentSource: {
      props: DocumentSourceSchema,
      category: 'data',
      description: 'Source reference with title, URL, and type',
      agentHint: 'Display a numbered source citation',
    },
    DocumentMeta: {
      props: DocumentMetaSchema,
      category: 'feedback',
      description: 'Document metadata footer with counts and dates',
      agentHint: 'Show document statistics and metadata',
    },
  },
});

export type DocumentCatalogType = typeof DocumentCatalog;
export type DocumentViewProps = z.infer<typeof DocumentViewSchema>;
export type DocumentSectionProps = z.infer<typeof DocumentSectionSchema>;
export type DocumentSourceProps = z.infer<typeof DocumentSourceSchema>;
export type DocumentMetaProps = z.infer<typeof DocumentMetaSchema>;
