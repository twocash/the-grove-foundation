// src/surface/components/modals/SproutFinishingRoom/json-render/evidence-transform.ts
// Sprint: S22-WP research-writer-panel-v1
// Pattern: json-render transform for RAW research evidence display
//
// Transforms research data → RenderTree using EvidenceCatalog components.
// The user SEES all their research - every source, every finding.
//
// Supports two data formats:
// 1. EvidenceBundle (from evidence-bundle.ts) - canonical API format
// 2. Sprout research fields - what DocumentViewer actually receives

import type { EvidenceBundle } from '@core/schema/evidence-bundle';
import type { Sprout } from '@core/schema/sprout';
import type { RenderTree, RenderElement } from '@core/json-render';

/**
 * Transforms an EvidenceBundle into a json-render tree for professional display.
 *
 * Structure:
 * - EvidenceHeader: Query, metadata, confidence badge
 * - Per branch:
 *   - BranchHeader: Branch query and status
 *   - SourceCard[]: Each source with citation index
 *   - FindingsList: Key findings from this branch
 * - EvidenceSummary: Total metrics
 *
 * @param evidence - The raw evidence bundle from research API
 * @param query - The original user query (from sprout)
 * @param templateName - Optional research template name used
 */
export function evidenceBundleToRenderTree(
  evidence: EvidenceBundle,
  query: string,
  templateName?: string
): RenderTree {
  const children: RenderElement[] = [];

  // 1. Header with query and overall metadata
  children.push({
    type: 'EvidenceHeader',
    props: {
      query,
      templateName,
      totalSources: evidence.totalSources,
      confidenceScore: evidence.confidenceScore,
      executionTime: evidence.executionTime,
      createdAt: evidence.createdAt,
    },
  });

  // 2. Per-branch content with sources and findings
  let globalSourceIndex = 1;

  for (const branch of evidence.branches) {
    // Branch header
    children.push({
      type: 'BranchHeader',
      props: {
        branchQuery: branch.branchQuery,
        relevanceScore: branch.relevanceScore,
        sourceCount: branch.sources.length,
        status: branch.status,
      },
    });

    // Source cards with sequential citation indices
    for (const source of branch.sources) {
      children.push({
        type: 'SourceCard',
        props: {
          index: globalSourceIndex++,
          title: source.title,
          url: source.url,
          snippet: source.snippet,
          sourceType: source.sourceType,
          accessedAt: source.accessedAt,
        },
      });
    }

    // Findings list for this branch
    if (branch.findings.length > 0) {
      children.push({
        type: 'FindingsList',
        props: {
          findings: branch.findings,
        },
      });
    }
  }

  // 3. Summary footer with totals
  const totalFindings = evidence.branches.reduce(
    (sum, branch) => sum + branch.findings.length,
    0
  );

  children.push({
    type: 'EvidenceSummary',
    props: {
      branchCount: evidence.branches.length,
      totalFindings,
      apiCallsUsed: evidence.apiCallsUsed,
    },
  });

  return {
    type: 'root',
    children,
  };
}

/**
 * Transforms a Sprout's research data into a json-render tree.
 *
 * This handles the flatter data structure on Sprout:
 * - researchBranches: Array of research branches with evidence
 * - researchEvidence: Flattened evidence array (alternative)
 * - researchSynthesis: Summary/insights object
 *
 * @param sprout - The sprout with research data
 */
export function sproutResearchToRenderTree(sprout: Sprout): RenderTree | null {
  // No research data? Return null to signal fallback
  const hasResearchData =
    sprout.researchBranches?.length ||
    sprout.researchEvidence?.length ||
    sprout.researchSynthesis;

  if (!hasResearchData) {
    return null;
  }

  const children: RenderElement[] = [];
  const now = new Date().toISOString();

  // 1. Header with query
  const totalSources =
    sprout.researchBranches?.reduce((sum, b) => sum + (b.evidence?.length || 0), 0) ||
    sprout.researchEvidence?.length ||
    0;

  const avgConfidence =
    sprout.researchEvidence?.length
      ? sprout.researchEvidence.reduce((sum, e) => sum + e.confidence, 0) /
        sprout.researchEvidence.length
      : sprout.researchSynthesis?.confidence || 0.5;

  children.push({
    type: 'EvidenceHeader',
    props: {
      query: sprout.query,
      templateName: sprout.researchManifest?.promptGenerated?.templateId,
      totalSources,
      confidenceScore: avgConfidence,
      executionTime: 0, // Not tracked in Sprout
      createdAt: sprout.researchSynthesis?.synthesizedAt || sprout.capturedAt || now,
    },
  });

  // 2. Per-branch content (if we have branches)
  let globalSourceIndex = 1;

  if (sprout.researchBranches?.length) {
    for (const branch of sprout.researchBranches) {
      // Branch header
      children.push({
        type: 'BranchHeader',
        props: {
          branchQuery: branch.label,
          relevanceScore:
            branch.evidence?.length
              ? branch.evidence.reduce((sum, e) => sum + e.relevance, 0) /
                branch.evidence.length
              : 0.5,
          sourceCount: branch.evidence?.length || 0,
          status: branch.status === 'complete' ? 'complete' : 'pending',
        },
      });

      // Source cards from branch evidence
      if (branch.evidence?.length) {
        for (const evidence of branch.evidence) {
          children.push({
            type: 'SourceCard',
            props: {
              index: globalSourceIndex++,
              title: extractTitle(evidence.source, evidence.content),
              url: evidence.source,
              snippet: truncateSnippet(evidence.content, 300),
              sourceType: evidence.sourceType,
              accessedAt: evidence.collectedAt,
            },
          });
        }
      }
    }
  } else if (sprout.researchEvidence?.length) {
    // Fallback: flat evidence array (no branch structure)
    children.push({
      type: 'BranchHeader',
      props: {
        branchQuery: 'Research Results',
        relevanceScore:
          sprout.researchEvidence.reduce((sum, e) => sum + e.relevance, 0) /
          sprout.researchEvidence.length,
        sourceCount: sprout.researchEvidence.length,
        status: 'complete',
      },
    });

    for (const evidence of sprout.researchEvidence) {
      children.push({
        type: 'SourceCard',
        props: {
          index: globalSourceIndex++,
          title: extractTitle(evidence.source, evidence.content),
          url: evidence.source,
          snippet: truncateSnippet(evidence.content, 300),
          sourceType: evidence.sourceType,
          accessedAt: evidence.collectedAt,
        },
      });
    }
  }

  // 3. Synthesis insights as findings (if available)
  if (sprout.researchSynthesis?.insights?.length) {
    children.push({
      type: 'FindingsList',
      props: {
        findings: sprout.researchSynthesis.insights,
      },
    });
  }

  // 4. Summary footer
  const branchCount = sprout.researchBranches?.length || 1;
  const totalFindings = sprout.researchSynthesis?.insights?.length || 0;

  children.push({
    type: 'EvidenceSummary',
    props: {
      branchCount,
      totalFindings,
      apiCallsUsed: 0, // Not tracked in Sprout
    },
  });

  return {
    type: 'root',
    children,
  };
}

/**
 * Extract a title from a URL or content
 */
function extractTitle(url: string, content: string): string {
  // Try to extract domain from URL as fallback title
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace('www.', '');
    // If content starts with something title-like, use first line
    const firstLine = content.split('\n')[0]?.trim();
    if (firstLine && firstLine.length < 100 && !firstLine.includes('http')) {
      return firstLine;
    }
    return domain;
  } catch {
    return content.substring(0, 50) + (content.length > 50 ? '...' : '');
  }
}

/**
 * Truncate snippet to max length with ellipsis
 */
function truncateSnippet(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength - 3) + '...';
}

export default evidenceBundleToRenderTree;
