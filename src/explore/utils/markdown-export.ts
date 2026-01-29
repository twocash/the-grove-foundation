// src/explore/utils/markdown-export.ts
// Markdown Export Utility - Professional document formatting
// Sprint: S28-PIPE - Export and Notion integration
//
// DEX: Provenance as Infrastructure
// All exports include full provenance chain and citations.

import type { ResearchDocument, Citation } from '@core/schema/research-document';
import type { GeneratedArtifact } from '@core/schema/sprout';

// =============================================================================
// Types
// =============================================================================

export interface ExportOptions {
  /** Include metadata footer (word count, confidence, etc.) */
  includeMetadata?: boolean;
  /** Include provenance header (lens, cognitive path) */
  includeProvenance?: boolean;
  /** Format citations as footnotes vs inline */
  citationStyle?: 'footnotes' | 'inline' | 'endnotes';
  /** Include table of contents for long documents */
  includeToc?: boolean;
  /** Custom title override */
  title?: string;
}

export interface ProvenanceInfo {
  lensName?: string;
  journeyName?: string;
  hubName?: string;
  templateName?: string;
  templateVersion?: number;
  writerConfigVersion?: number;
  generatedAt?: string;
}

const DEFAULT_OPTIONS: ExportOptions = {
  includeMetadata: true,
  includeProvenance: true,
  citationStyle: 'endnotes',
  includeToc: false,
};

// =============================================================================
// Main Export Functions
// =============================================================================

/**
 * Convert a ResearchDocument to professional markdown format.
 *
 * Structure:
 * 1. Title
 * 2. Provenance header (optional)
 * 3. Executive Summary (position)
 * 4. Full Analysis
 * 5. Limitations (if present)
 * 6. References
 * 7. Metadata footer (optional)
 */
export function documentToMarkdown(
  doc: ResearchDocument,
  provenance?: ProvenanceInfo,
  options: ExportOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const sections: string[] = [];

  // 1. Title
  const title = opts.title || doc.query;
  sections.push(`# ${title}\n`);

  // 2. Provenance header
  if (opts.includeProvenance && provenance) {
    sections.push(formatProvenanceHeader(provenance, doc.createdAt));
  }

  // 3. Executive Summary (position)
  if (doc.position && doc.position !== 'Insufficient evidence to form a position.') {
    sections.push(`## Executive Summary\n`);
    sections.push(`> ${doc.position}\n`);
  }

  // 4. Full Analysis
  if (doc.analysis) {
    // Analysis is already markdown - just ensure proper spacing
    const analysis = cleanupAnalysis(doc.analysis, opts.citationStyle);
    sections.push(analysis);
  }

  // 5. Limitations
  if (doc.limitations) {
    sections.push(`\n## Limitations\n`);
    sections.push(`${doc.limitations}\n`);
  }

  // 6. References
  if (doc.citations && doc.citations.length > 0) {
    sections.push(formatReferences(doc.citations));
  }

  // 7. Metadata footer
  if (opts.includeMetadata) {
    sections.push(formatMetadataFooter(doc));
  }

  return sections.join('\n');
}

/**
 * Convert a GeneratedArtifact to markdown with full provenance.
 */
export function artifactToMarkdown(
  artifact: GeneratedArtifact,
  lensName?: string,
  options: ExportOptions = {}
): string {
  const provenance: ProvenanceInfo = {
    templateName: artifact.templateName,
    writerConfigVersion: artifact.writerConfigVersion,
    generatedAt: artifact.generatedAt,
    lensName,
  };

  return documentToMarkdown(artifact.document, provenance, options);
}

// =============================================================================
// Formatting Helpers
// =============================================================================

/**
 * Format provenance header as YAML-style frontmatter.
 */
function formatProvenanceHeader(provenance: ProvenanceInfo, createdAt: string): string {
  const lines: string[] = ['---'];

  if (provenance.generatedAt || createdAt) {
    const date = new Date(provenance.generatedAt || createdAt);
    lines.push(`generated: ${date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`);
  }

  if (provenance.lensName) {
    lines.push(`lens: ${provenance.lensName}`);
  }

  if (provenance.templateName) {
    lines.push(`template: ${provenance.templateName}`);
  }

  if (provenance.writerConfigVersion) {
    lines.push(`writer_config_version: ${provenance.writerConfigVersion}`);
  }

  if (provenance.hubName) {
    lines.push(`knowledge_hub: ${provenance.hubName}`);
  }

  if (provenance.journeyName) {
    lines.push(`journey: ${provenance.journeyName}`);
  }

  lines.push('---\n');

  return lines.join('\n');
}

/**
 * Clean up analysis markdown - handle citations, ensure proper formatting.
 */
function cleanupAnalysis(analysis: string, citationStyle?: string): string {
  let cleaned = analysis;

  // Convert <cite index="N">text</cite> to markdown format
  // For endnotes style: text [N]
  // For inline style: text (Source N)
  if (citationStyle === 'endnotes' || citationStyle === 'footnotes') {
    cleaned = cleaned.replace(/<cite\s+index="(\d+)"[^>]*>([^<]+)<\/cite>/gi, '$2 [$1]');
  } else if (citationStyle === 'inline') {
    cleaned = cleaned.replace(/<cite\s+index="(\d+)"[^>]*>([^<]+)<\/cite>/gi, '$2 (Source $1)');
  }

  // Remove any remaining HTML tags that might interfere
  cleaned = cleaned.replace(/<\/?(?:span|div)[^>]*>/gi, '');

  // Ensure headers have proper spacing
  cleaned = cleaned.replace(/\n(#{1,6})\s/g, '\n\n$1 ');

  // Remove excessive blank lines (more than 2)
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');

  return cleaned;
}

/**
 * Format citations as a References section.
 */
function formatReferences(citations: Citation[]): string {
  if (citations.length === 0) return '';

  const lines: string[] = ['\n---\n', '## References\n'];

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

    // Format: [N] Title. Domain. URL. Accessed: Date.
    lines.push(`**[${cite.index}]** ${cite.title}. *${cite.domain}*.`);
    lines.push(`   ${cite.url}`);
    if (cite.snippet) {
      lines.push(`   > "${cite.snippet.slice(0, 150)}${cite.snippet.length > 150 ? '...' : ''}"`);
    }
    lines.push(`   Accessed: ${accessDate}\n`);
  }

  return lines.join('\n');
}

/**
 * Format metadata footer.
 */
function formatMetadataFooter(doc: ResearchDocument): string {
  const confidencePercent = Math.round(doc.confidenceScore * 100);
  const statusLabel = doc.status === 'complete' ? 'Complete'
    : doc.status === 'partial' ? 'Partial'
    : 'Insufficient Evidence';

  return `
---

<details>
<summary>Document Metadata</summary>

| Field | Value |
|-------|-------|
| Document ID | \`${doc.id}\` |
| Status | ${statusLabel} |
| Confidence | ${confidencePercent}% |
| Word Count | ${doc.wordCount.toLocaleString()} |
| Sources | ${doc.citations.length} |
| Created | ${new Date(doc.createdAt).toISOString()} |

</details>

---
*Generated by Grove Research Platform*
`;
}

// =============================================================================
// File Export
// =============================================================================

/**
 * Generate a filename for the exported document.
 */
export function generateFilename(doc: ResearchDocument, prefix = 'grove-research'): string {
  // Create a slug from the query
  const slug = doc.query
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

  const date = new Date(doc.createdAt).toISOString().split('T')[0];
  const shortId = doc.id.slice(0, 8);

  return `${prefix}-${slug}-${date}-${shortId}.md`;
}

/**
 * Trigger browser download of markdown file.
 */
export function downloadMarkdown(
  doc: ResearchDocument,
  provenance?: ProvenanceInfo,
  options?: ExportOptions
): void {
  const markdown = documentToMarkdown(doc, provenance, options);
  const filename = generateFilename(doc);

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

// =============================================================================
// Notion-Ready Export
// =============================================================================

/**
 * Export document in a format ready for Notion API.
 * Returns structured content that can be converted to Notion blocks.
 */
export interface NotionReadyExport {
  title: string;
  properties: Record<string, string | number | boolean>;
  markdown: string;
  citations: Citation[];
}

export function documentToNotionReady(
  doc: ResearchDocument,
  provenance?: ProvenanceInfo,
  options?: ExportOptions
): NotionReadyExport {
  return {
    title: options?.title || doc.query,
    properties: {
      status: doc.status,
      confidence: Math.round(doc.confidenceScore * 100),
      wordCount: doc.wordCount,
      sourceCount: doc.citations.length,
      createdAt: doc.createdAt,
      templateName: provenance?.templateName || 'Unknown',
      lensName: provenance?.lensName || 'Default',
    },
    markdown: documentToMarkdown(doc, provenance, {
      ...options,
      includeMetadata: false // Notion will have its own properties
    }),
    citations: doc.citations,
  };
}
