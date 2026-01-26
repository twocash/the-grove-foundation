// src/bedrock/json-render/document/document-transform.ts
// Sprint: S25-SFR garden-content-viewer-v1
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
  const children: RenderElement[] = [];
  const sections = splitByHeadings(content);

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
