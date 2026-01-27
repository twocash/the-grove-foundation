// src/bedrock/json-render/document/document-transform.ts
// Sprint: S25-SFR garden-content-viewer-v1
// Hotfix: Detect JSON content from Sprout promotions and render as readable markdown
// Pattern: json-render transform (converts data to renderable tree)
// Transforms markdown content into a DocumentCatalog RenderTree

import type { RenderTree, RenderElement } from '@core/json-render';

/**
 * Metadata for the document being transformed
 */
export interface DocumentTreeMeta {
  title: string;
  tier: string;
  wordCount?: number;
  charCount?: number;
  createdAt?: string;
  confidence?: number;
}

// =============================================================================
// JSON Content Detection & Conversion
// =============================================================================

/**
 * Attempts to detect and convert structured research JSON into readable markdown.
 *
 * Garden documents from Sprout promotions may store the full ResearchDocument
 * (position, analysis, limitations, citations) or CanonicalResearch
 * (title, sections, sources) as serialized JSON. This function detects
 * those formats and converts them to markdown for the DocumentCatalog.
 *
 * Returns null if content is not recognized JSON — caller falls back to
 * treating it as raw markdown.
 */
function tryConvertResearchJSON(content: string): string | null {
  const trimmed = content.trim();
  if (!trimmed.startsWith('{')) return null;

  try {
    const parsed = JSON.parse(trimmed);

    // ResearchDocument format: position + analysis + citations
    if (parsed.position && parsed.analysis) {
      return convertResearchDocumentToMarkdown(parsed);
    }

    // CanonicalResearch format: title + sections[] + sources[]
    if (parsed.title && Array.isArray(parsed.sections)) {
      return convertCanonicalResearchToMarkdown(parsed);
    }

    // Unknown JSON structure — return null to fall through
    return null;
  } catch {
    // Not valid JSON — return null to fall through
    return null;
  }
}

/**
 * Converts a ResearchDocument JSON object to readable markdown.
 * Fields: position, analysis, limitations, citations[]
 */
function convertResearchDocumentToMarkdown(doc: Record<string, unknown>): string {
  const parts: string[] = [];

  // Position / thesis
  if (typeof doc.position === 'string' && doc.position) {
    parts.push(`## Position\n\n${doc.position}`);
  }

  // Analysis (main body — may already be markdown)
  if (typeof doc.analysis === 'string' && doc.analysis) {
    parts.push(`## Analysis\n\n${doc.analysis}`);
  }

  // Limitations
  if (doc.limitations) {
    if (typeof doc.limitations === 'string') {
      parts.push(`## Limitations\n\n${doc.limitations}`);
    } else if (Array.isArray(doc.limitations)) {
      const items = doc.limitations.map((l: unknown) => `- ${String(l)}`).join('\n');
      parts.push(`## Limitations\n\n${items}`);
    }
  }

  // Citations
  if (Array.isArray(doc.citations) && doc.citations.length > 0) {
    const lines = doc.citations.map((c: Record<string, unknown>, i: number) => {
      const index = typeof c.index === 'number' ? c.index : i + 1;
      const title = String(c.title || 'Source');
      const url = String(c.url || '');
      const snippet = c.snippet ? ` — *${String(c.snippet)}*` : '';
      if (url) {
        return `${index}. [${title}](${url})${snippet}`;
      }
      return `${index}. ${title}${snippet}`;
    });
    parts.push(`## Sources\n\n${lines.join('\n')}`);
  }

  return parts.join('\n\n');
}

/**
 * Converts a CanonicalResearch JSON object to readable markdown.
 * Fields: title, executive_summary, sections[], key_findings[], limitations[], sources[]
 */
function convertCanonicalResearchToMarkdown(doc: Record<string, unknown>): string {
  const parts: string[] = [];

  // Executive summary
  if (typeof doc.executive_summary === 'string' && doc.executive_summary) {
    parts.push(`## Executive Summary\n\n${doc.executive_summary}`);
  }

  // Sections (each has heading + content)
  if (Array.isArray(doc.sections)) {
    for (const section of doc.sections) {
      const s = section as Record<string, unknown>;
      const heading = String(s.heading || 'Section');
      const sectionContent = String(s.content || '');
      parts.push(`## ${heading}\n\n${sectionContent}`);
    }
  }

  // Key findings
  if (Array.isArray(doc.key_findings) && doc.key_findings.length > 0) {
    const findings = doc.key_findings.map((f: unknown) => `- ${String(f)}`).join('\n');
    parts.push(`## Key Findings\n\n${findings}`);
  }

  // Limitations
  if (Array.isArray(doc.limitations) && doc.limitations.length > 0) {
    const lims = doc.limitations.map((l: unknown) => `- ${String(l)}`).join('\n');
    parts.push(`## Limitations\n\n${lims}`);
  }

  // Sources
  if (Array.isArray(doc.sources) && doc.sources.length > 0) {
    const lines = doc.sources.map((s: Record<string, unknown>) => {
      const index = s.index || '';
      const title = String(s.title || 'Source');
      const url = String(s.url || '');
      if (url) {
        return `${index}. [${title}](${url})`;
      }
      return `${index}. ${title}`;
    });
    parts.push(`## Sources\n\n${lines.join('\n')}`);
  }

  return parts.join('\n\n');
}

// =============================================================================
// Markdown Splitting
// =============================================================================

/**
 * Splits markdown content by ## headings into sections.
 *
 * Returns array of { heading, content } pairs. Content before the first
 * heading (if any) is returned with heading "Introduction".
 * If no headings found, wraps entire content in a single section.
 */
function splitByHeadings(
  content: string
): Array<{ heading: string; content: string; level: number }> {
  // Match ## or ### headings at start of line
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const sections: Array<{ heading: string; content: string; level: number }> = [];
  let lastIndex = 0;
  let lastHeading: string | null = null;
  let lastLevel = 2;
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(content)) !== null) {
    // Capture content before this heading
    const contentBefore = content.slice(lastIndex, match.index).trim();
    if (contentBefore) {
      sections.push({
        heading: lastHeading || 'Introduction',
        content: contentBefore,
        level: lastLevel,
      });
    }

    lastHeading = match[2];
    lastLevel = match[1].length;
    lastIndex = match.index + match[0].length;
  }

  // Capture remaining content after last heading
  const remaining = content.slice(lastIndex).trim();
  if (remaining) {
    sections.push({
      heading: lastHeading || 'Document',
      content: remaining,
      level: lastLevel,
    });
  }

  // If no sections found (no headings), wrap entire content
  if (sections.length === 0 && content.trim()) {
    sections.push({
      heading: 'Document',
      content: content.trim(),
      level: 2,
    });
  }

  return sections;
}

/**
 * Transforms plain markdown content into a DocumentCatalog RenderTree.
 *
 * Splits content by ## headings into DocumentSection nodes. Wraps in
 * a DocumentView header with title/tier, and appends DocumentMeta footer.
 *
 * Works for any Garden document regardless of source (promoted research,
 * manually uploaded, or future AI-generated content).
 */
export function contentToDocumentTree(
  content: string,
  meta: DocumentTreeMeta
): RenderTree {
  // Detect structured JSON (from Sprout promotions) and convert to markdown
  const markdownContent = tryConvertResearchJSON(content) || content;

  const children: RenderElement[] = [];
  const sections = splitByHeadings(markdownContent);

  // 1. Document header with title and tier
  children.push({
    type: 'DocumentView',
    props: {
      title: meta.title,
      tier: meta.tier,
      sectionCount: sections.length,
    },
  });

  // 2. Content sections
  for (const section of sections) {
    children.push({
      type: 'DocumentSection',
      props: {
        heading: section.heading,
        content: section.content,
        level: section.level,
      },
    });
  }

  // 3. Metadata footer
  const wordCount = meta.wordCount || content.split(/\s+/).filter(Boolean).length;
  const charCount = meta.charCount || content.length;

  children.push({
    type: 'DocumentMeta',
    props: {
      wordCount,
      charCount,
      createdAt: meta.createdAt,
      confidence: meta.confidence,
    },
  });

  return {
    type: 'root',
    children,
  };
}
