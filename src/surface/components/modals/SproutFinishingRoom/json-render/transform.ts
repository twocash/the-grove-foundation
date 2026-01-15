// src/surface/components/modals/SproutFinishingRoom/json-render/transform.ts
// Sprint: S2-SFR-Display - US-C001 ResearchDocument to json-render transform
// Pattern: json-render transform (converts data to renderable tree)

import type { ResearchDocument } from '@core/schema/research-document';
import type { RenderTree, RenderElement } from './catalog';

/**
 * Transforms a ResearchDocument into a json-render tree structure.
 *
 * The tree follows the catalog component vocabulary:
 * - ResearchHeader: position + query
 * - AnalysisBlock: markdown content
 * - SourceList: citations
 * - LimitationsBlock: limitations (if present)
 * - Metadata: status, confidence, word count
 */
export function researchDocumentToRenderTree(doc: ResearchDocument): RenderTree {
  const children: RenderElement[] = [];

  // 1. Header with position and query
  children.push({
    type: 'ResearchHeader',
    props: {
      position: doc.position,
      query: doc.query,
    },
  });

  // 2. Main analysis content
  children.push({
    type: 'AnalysisBlock',
    props: {
      content: doc.analysis,
    },
  });

  // 3. Citations/Sources (if any)
  if (doc.citations.length > 0) {
    children.push({
      type: 'SourceList',
      props: {
        sources: doc.citations.map((citation) => ({
          index: citation.index,
          title: citation.title,
          url: citation.url,
          snippet: citation.snippet,
        })),
      },
    });
  }

  // 4. Limitations (if present)
  if (doc.limitations) {
    children.push({
      type: 'LimitationsBlock',
      props: {
        content: doc.limitations,
      },
    });
  }

  // 5. Metadata footer
  children.push({
    type: 'Metadata',
    props: {
      status: doc.status,
      confidenceScore: doc.confidenceScore,
      wordCount: doc.wordCount,
    },
  });

  return {
    type: 'root',
    children,
  };
}

export default researchDocumentToRenderTree;
