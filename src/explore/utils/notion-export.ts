// src/explore/utils/notion-export.ts
// Notion Export Utility - Export research documents to Notion pages
// Sprint: S28-PIPE - Notion integration
//
// Produces clean markdown that renders correctly when pasted into Notion.
// Uses blockquotes with emoji for callout-like sections.
// Uses canonical naming conventions with 4D Experience Model terminology.

import type { ResearchDocument, Citation } from '@core/schema/research-document';
import type { ProvenanceInfo } from './markdown-export';
import { generateNotionTitle, type ProvenanceInput } from '@core/config/naming-conventions';

// =============================================================================
// Types
// =============================================================================

export interface NotionExportOptions {
  /** Parent page ID to create under (optional - creates at workspace level if omitted) */
  parentPageId?: string;
  /** Include metadata table */
  includeMetadata?: boolean;
  /** Include provenance section */
  includeProvenance?: boolean;
  /** Format provenance as code block (true) or blockquote (false) */
  provenanceAsCode?: boolean;
}

export interface NotionPageContent {
  /** Page title */
  title: string;
  /** Notion-flavored markdown content */
  content: string;
  /** Properties for database pages */
  properties?: Record<string, string | number | null>;
}

const DEFAULT_OPTIONS: NotionExportOptions = {
  includeMetadata: true,
  includeProvenance: true,
  provenanceAsCode: true,
};

// =============================================================================
// Main Export Function
// =============================================================================

/**
 * Convert a ResearchDocument to clean markdown that renders in Notion.
 *
 * Structure:
 * 1. Provenance (code block or blockquote)
 * 2. Executive Summary (blockquote with 💡)
 * 3. Full Analysis (standard markdown)
 * 4. Limitations (blockquote with ⚠️)
 * 5. References (numbered list)
 * 6. Metadata (markdown table)
 */
export function documentToNotionMarkdown(
  doc: ResearchDocument,
  provenance?: ProvenanceInfo,
  options: NotionExportOptions = {}
): NotionPageContent {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const sections: string[] = [];

  // 1. Provenance section (if enabled)
  if (opts.includeProvenance && provenance) {
    sections.push(formatProvenanceSection(provenance, doc.createdAt, opts.provenanceAsCode));
    sections.push('');
  }

  // 2. Executive Summary (blockquote with emoji)
  if (doc.position && doc.position !== 'Insufficient evidence to form a position.') {
    sections.push('> 💡 **Executive Summary**');
    sections.push('>');
    // Split position into blockquote lines
    const positionLines = doc.position.split('\n');
    for (const line of positionLines) {
      sections.push(`> ${line}`);
    }
    sections.push('');
  }

  // 3. Full Analysis (clean markdown)
  if (doc.analysis) {
    const cleanAnalysis = convertAnalysisToCleanMarkdown(doc.analysis);
    sections.push(cleanAnalysis);
  }

  // 4. Limitations (if present)
  if (doc.limitations) {
    sections.push('');
    sections.push('> ⚠️ **Limitations**');
    sections.push('>');
    const limitationLines = doc.limitations.split('\n');
    for (const line of limitationLines) {
      sections.push(`> ${line}`);
    }
  }

  // 5. References
  if (doc.citations && doc.citations.length > 0) {
    sections.push('');
    sections.push('---');
    sections.push('');
    sections.push('## References');
    sections.push('');
    sections.push(formatReferencesAsMarkdown(doc.citations));
  }

  // 6. Metadata (markdown table)
  if (opts.includeMetadata) {
    sections.push('');
    sections.push('---');
    sections.push('');
    sections.push('### Document Metadata');
    sections.push('');
    sections.push(formatMetadataAsTable(doc));
  }

  // Generate canonical Notion title
  const provenanceInput: ProvenanceInput = provenance ? {
    lensName: provenance.lensName,
    templateName: provenance.templateName,
    templateId: provenance.templateId,
    templateVersion: provenance.templateVersion,
    writerConfigVersion: provenance.writerConfigVersion,
    generatedAt: provenance.generatedAt,
    cognitiveDomain: provenance.cognitiveDomain || provenance.hubName,
    experiencePath: provenance.experiencePath || provenance.journeyName,
  } : {};

  const title = generateNotionTitle(doc, provenanceInput);

  return {
    title,
    content: sections.join('\n'),
    properties: {
      title,
    },
  };
}

// =============================================================================
// Formatting Helpers
// =============================================================================

/**
 * Convert analysis markdown to clean format.
 * Removes custom HTML tags and ensures proper spacing.
 */
function convertAnalysisToCleanMarkdown(analysis: string): string {
  let result = analysis;

  // Convert <cite index="N">text</cite> to footnote style: text[^N]
  result = result.replace(
    /<cite\s+index="(\d+)"[^>]*>([^<]+)<\/cite>/gi,
    '$2 [^$1]'
  );

  // Remove any HTML spans
  result = result.replace(/<\/?span[^>]*>/gi, '');

  // Ensure proper spacing around headers
  result = result.replace(/\n(#{1,4})\s/g, '\n\n$1 ');

  // Ensure dividers have spacing
  result = result.replace(/\n---\n/g, '\n\n---\n\n');

  return result;
}

/**
 * Format provenance as code block or blockquote.
 * Code blocks preserve YAML-like structure nicely in Notion.
 */
function formatProvenanceSection(
  provenance: ProvenanceInfo,
  createdAt: string,
  asCodeBlock: boolean = true
): string {
  const date = new Date(provenance.generatedAt || createdAt);
  const dateStr = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const fields: string[] = [];
  fields.push(`Generated: ${dateStr}`);

  if (provenance.lensName) {
    fields.push(`Lens: ${provenance.lensName}`);
  }

  // 4D Experience Model fields
  const domain = provenance.cognitiveDomain || provenance.hubName;
  if (domain) {
    fields.push(`Cognitive Domain: ${domain}`);
  }

  const path = provenance.experiencePath || provenance.journeyName;
  if (path) {
    fields.push(`Experience Path: ${path}`);
  }

  if (provenance.templateName) {
    fields.push(`Template: ${provenance.templateName}`);
  }

  if (provenance.writerConfigVersion) {
    fields.push(`Writer Config: v${provenance.writerConfigVersion}`);
  }

  if (asCodeBlock) {
    // Format as YAML code block - renders nicely in Notion
    const lines: string[] = ['```yaml', '# Document Provenance'];
    for (const field of fields) {
      const [key, ...valueParts] = field.split(': ');
      const value = valueParts.join(': ');
      lines.push(`${key.toLowerCase().replace(/ /g, '_')}: "${value}"`);
    }
    lines.push('```');
    return lines.join('\n');
  } else {
    // Format as blockquote with emoji
    const lines: string[] = ['> 📋 **Document Provenance**', '>'];
    for (const field of fields) {
      lines.push(`> **${field.split(': ')[0]}:** ${field.split(': ').slice(1).join(': ')}`);
    }
    return lines.join('\n');
  }
}

/**
 * Format citations as a clean numbered list.
 */
function formatReferencesAsMarkdown(citations: Citation[]): string {
  const lines: string[] = [];

  // Sort by index
  const sorted = [...citations].sort((a, b) => a.index - b.index);

  for (const cite of sorted) {
    const accessDate = cite.accessedAt
      ? new Date(cite.accessedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : 'n.d.';

    // Format as numbered list with link
    lines.push(`${cite.index}. **[${cite.title}](${cite.url})**`);
    lines.push(`   *${cite.domain}* · Accessed: ${accessDate}`);

    if (cite.snippet) {
      const snippet = cite.snippet.slice(0, 150);
      lines.push(`   > ${snippet}${cite.snippet.length > 150 ? '...' : ''}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format metadata as a standard markdown table.
 */
function formatMetadataAsTable(doc: ResearchDocument): string {
  const confidencePercent = Math.round(doc.confidenceScore * 100);
  const statusLabel = doc.status === 'complete' ? '✅ Complete'
    : doc.status === 'partial' ? '⚠️ Partial'
    : '❌ Insufficient Evidence';

  const lines: string[] = [];

  lines.push('| Property | Value |');
  lines.push('|----------|-------|');
  lines.push(`| Document ID | \`${doc.id}\` |`);
  lines.push(`| Status | ${statusLabel} |`);
  lines.push(`| Confidence | ${confidencePercent}% |`);
  lines.push(`| Word Count | ${doc.wordCount.toLocaleString()} |`);
  lines.push(`| Sources | ${doc.citations.length} |`);
  lines.push(`| Created | ${new Date(doc.createdAt).toISOString().split('T')[0]} |`);

  return lines.join('\n');
}

// =============================================================================
// Export Helper
// =============================================================================

/**
 * Prepare document for Notion API call.
 * Returns the parameters needed for mcp__plugin_Notion_notion__notion-create-pages
 */
export function prepareNotionPageParams(
  doc: ResearchDocument,
  provenance?: ProvenanceInfo,
  parentPageId?: string,
  options?: NotionExportOptions
): {
  parent?: { page_id: string };
  pages: Array<{ properties: Record<string, string>; content: string }>;
} {
  const { title, content } = documentToNotionMarkdown(doc, provenance, options);

  return {
    parent: parentPageId ? { page_id: parentPageId } : undefined,
    pages: [{
      properties: { title },
      content,
    }],
  };
}
