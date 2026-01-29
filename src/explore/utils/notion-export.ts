// src/explore/utils/notion-export.ts
// Notion Export Utility - Export research documents to Notion pages
// Sprint: S28-PIPE - Notion integration
//
// Uses Notion-flavored markdown format with proper escaping and structure.

import type { ResearchDocument, Citation } from '@core/schema/research-document';
import type { ProvenanceInfo } from './markdown-export';

// =============================================================================
// Types
// =============================================================================

export interface NotionExportOptions {
  /** Parent page ID to create under (optional - creates at workspace level if omitted) */
  parentPageId?: string;
  /** Include metadata table */
  includeMetadata?: boolean;
  /** Include provenance callout */
  includeProvenance?: boolean;
  /** Use collapsible toggle for references */
  collapsibleReferences?: boolean;
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
  collapsibleReferences: true,
};

// =============================================================================
// Main Export Function
// =============================================================================

/**
 * Convert a ResearchDocument to Notion-flavored markdown format.
 *
 * Structure:
 * 1. Executive Summary (callout)
 * 2. Full Analysis (with proper headings)
 * 3. Limitations (if present)
 * 4. References (toggle)
 * 5. Metadata (collapsible)
 */
export function documentToNotionMarkdown(
  doc: ResearchDocument,
  provenance?: ProvenanceInfo,
  options: NotionExportOptions = {}
): NotionPageContent {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const sections: string[] = [];

  // 1. Provenance callout (if enabled)
  if (opts.includeProvenance && provenance) {
    sections.push(formatProvenanceCallout(provenance, doc.createdAt));
    sections.push('<empty-block/>');
  }

  // 2. Executive Summary (as highlighted callout)
  if (doc.position && doc.position !== 'Insufficient evidence to form a position.') {
    sections.push(`<callout icon="💡" color="blue_bg">`);
    sections.push(`\t**Executive Summary**`);
    sections.push(`\t${escapeNotionText(doc.position)}`);
    sections.push(`</callout>`);
    sections.push('<empty-block/>');
  }

  // 3. Full Analysis (convert markdown to Notion format)
  if (doc.analysis) {
    const notionAnalysis = convertAnalysisToNotion(doc.analysis);
    sections.push(notionAnalysis);
  }

  // 4. Limitations (if present)
  if (doc.limitations) {
    sections.push('<empty-block/>');
    sections.push(`<callout icon="⚠️" color="yellow_bg">`);
    sections.push(`\t**Limitations**`);
    sections.push(`\t${escapeNotionText(doc.limitations)}`);
    sections.push(`</callout>`);
  }

  // 5. References
  if (doc.citations && doc.citations.length > 0) {
    sections.push('<empty-block/>');
    sections.push('---');
    sections.push('<empty-block/>');

    if (opts.collapsibleReferences) {
      sections.push(`▶## References {color="gray"}`);
      sections.push(formatReferencesForNotion(doc.citations, true));
    } else {
      sections.push(`## References`);
      sections.push(formatReferencesForNotion(doc.citations, false));
    }
  }

  // 6. Metadata (collapsible)
  if (opts.includeMetadata) {
    sections.push('<empty-block/>');
    sections.push(`▶ Document Metadata {color="gray"}`);
    sections.push(formatMetadataForNotion(doc));
  }

  return {
    title: doc.query,
    content: sections.join('\n'),
    properties: {
      title: doc.query,
    },
  };
}

// =============================================================================
// Formatting Helpers
// =============================================================================

/**
 * Escape special characters for Notion markdown.
 * Characters that need escaping: \ * ~ ` $ [ ] < > { } | ^
 */
function escapeNotionText(text: string): string {
  // Don't escape inside code blocks - handled separately
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/</g, '\\<')
    .replace(/>/g, '\\>')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\|/g, '\\|')
    .replace(/\^/g, '\\^');
}

/**
 * Convert standard markdown to Notion-flavored markdown.
 */
function convertAnalysisToNotion(analysis: string): string {
  let result = analysis;

  // Convert <cite index="N">text</cite> to Notion format
  // Use footnote-style citations: text[^N]
  result = result.replace(
    /<cite\s+index="(\d+)"[^>]*>([^<]+)<\/cite>/gi,
    '$2[^$1]'
  );

  // Remove any HTML spans (we'll handle colors differently in Notion)
  result = result.replace(/<\/?span[^>]*>/gi, '');

  // Convert blockquotes with multiple lines to use <br>
  result = result.replace(/^> (.+)$/gm, (match, content) => {
    // If there are newlines in the content, replace with <br>
    return `> ${content.replace(/\n/g, '<br>')}`;
  });

  // Ensure proper spacing around headers (Notion needs this)
  result = result.replace(/\n(#{1,4})\s/g, '\n<empty-block/>\n$1 ');

  // Convert --- to Notion divider (needs empty lines)
  result = result.replace(/\n---\n/g, '\n<empty-block/>\n---\n<empty-block/>\n');

  return result;
}

/**
 * Format provenance as a callout.
 */
function formatProvenanceCallout(provenance: ProvenanceInfo, createdAt: string): string {
  const lines: string[] = [`<callout icon="📋" color="gray_bg">`];

  const date = new Date(provenance.generatedAt || createdAt);
  const dateStr = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  lines.push(`\t**Generated:** ${dateStr}`);

  if (provenance.lensName) {
    lines.push(`\t**Lens:** ${provenance.lensName}`);
  }

  if (provenance.templateName) {
    lines.push(`\t**Template:** ${provenance.templateName}`);
  }

  if (provenance.writerConfigVersion) {
    lines.push(`\t**Config Version:** v${provenance.writerConfigVersion}`);
  }

  lines.push(`</callout>`);

  return lines.join('\n');
}

/**
 * Format citations as Notion-style references.
 */
function formatReferencesForNotion(citations: Citation[], indented: boolean): string {
  const lines: string[] = [];
  const indent = indented ? '\t' : '';

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
    lines.push(`${indent}1. **\\[${cite.index}\\]** [${escapeNotionText(cite.title)}](${cite.url})`);
    lines.push(`${indent}\t*${cite.domain}* · Accessed: ${accessDate}`);

    if (cite.snippet) {
      const snippet = cite.snippet.slice(0, 120);
      lines.push(`${indent}\t> ${escapeNotionText(snippet)}${cite.snippet.length > 120 ? '...' : ''}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format metadata as a Notion table inside a toggle.
 */
function formatMetadataForNotion(doc: ResearchDocument): string {
  const confidencePercent = Math.round(doc.confidenceScore * 100);
  const statusLabel = doc.status === 'complete' ? 'Complete'
    : doc.status === 'partial' ? 'Partial'
    : 'Insufficient Evidence';

  const lines: string[] = [];

  lines.push(`\t<table header-column="true">`);
  lines.push(`\t\t<tr>`);
  lines.push(`\t\t\t<td>Document ID</td>`);
  lines.push(`\t\t\t<td>\`${doc.id}\`</td>`);
  lines.push(`\t\t</tr>`);
  lines.push(`\t\t<tr>`);
  lines.push(`\t\t\t<td>Status</td>`);
  lines.push(`\t\t\t<td>${statusLabel}</td>`);
  lines.push(`\t\t</tr>`);
  lines.push(`\t\t<tr>`);
  lines.push(`\t\t\t<td>Confidence</td>`);
  lines.push(`\t\t\t<td>${confidencePercent}%</td>`);
  lines.push(`\t\t</tr>`);
  lines.push(`\t\t<tr>`);
  lines.push(`\t\t\t<td>Word Count</td>`);
  lines.push(`\t\t\t<td>${doc.wordCount.toLocaleString()}</td>`);
  lines.push(`\t\t</tr>`);
  lines.push(`\t\t<tr>`);
  lines.push(`\t\t\t<td>Sources</td>`);
  lines.push(`\t\t\t<td>${doc.citations.length}</td>`);
  lines.push(`\t\t</tr>`);
  lines.push(`\t\t<tr>`);
  lines.push(`\t\t\t<td>Created</td>`);
  lines.push(`\t\t\t<td>${new Date(doc.createdAt).toISOString()}</td>`);
  lines.push(`\t\t</tr>`);
  lines.push(`\t</table>`);

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
