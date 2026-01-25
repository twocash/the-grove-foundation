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
import type { Sprout, CanonicalResearch } from '@core/schema/sprout';
import type { RenderTree, RenderElement } from '@core/json-render';
import type { Evidence } from '@core/schema/research-strategy';

// S23-SFR Phase 0d: Evidence removed - metadata now in core Evidence schema
// Legacy comment preserved for traceability

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
 * @deprecated Use canonicalResearchToRenderTree() instead.
 * This function handles legacy sprouts without canonicalResearch.
 * Will be removed after migration period (30 days from S22-WP merge on 2026-01-24).
 *
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
  // S23-SFR Phase 0d: Deprecation warning
  if (process.env.NODE_ENV === 'development') {
    console.warn('[evidence-transform] DEPRECATED: sproutResearchToRenderTree called. Sprout should have canonicalResearch.');
  }
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
          // S22-WP: Handle synthesis evidence specially (not a source card)
          if (evidence.source === 'research-synthesis') {
            children.push({
              type: 'SynthesisBlock',
              props: {
                content: evidence.content,
                confidence: evidence.confidence,
              },
            });
            continue;
          }

          // S22-WP: Use metadata.title when available from API
          const title = (evidence as Evidence).metadata?.title ||
            extractTitle(evidence.source, evidence.content);

          children.push({
            type: 'SourceCard',
            props: {
              index: globalSourceIndex++,
              title,
              url: evidence.source,
              snippet: evidence.content, // S22-WP: Show FULL content - no truncation
              sourceType: evidence.sourceType,
              accessedAt: evidence.collectedAt,
            },
          });
        }
      }
    }
  } else if (sprout.researchEvidence?.length) {
    // Fallback: flat evidence array (no branch structure)
    // S22-WP: Separate synthesis from sources
    const synthesis = sprout.researchEvidence.find(e => e.source === 'research-synthesis');
    const sources = sprout.researchEvidence.filter(e => e.source !== 'research-synthesis');

    // Show synthesis first if present
    if (synthesis) {
      children.push({
        type: 'SynthesisBlock',
        props: {
          content: synthesis.content,
          confidence: synthesis.confidence,
        },
      });
    }

    // Then show sources
    if (sources.length > 0) {
      children.push({
        type: 'BranchHeader',
        props: {
          branchQuery: 'Sources',
          relevanceScore:
            sources.reduce((sum, e) => sum + e.relevance, 0) / sources.length,
          sourceCount: sources.length,
          status: 'complete',
        },
      });

      for (const evidence of sources) {
        // S22-WP: Use metadata.title when available from API
        const title = (evidence as Evidence).metadata?.title ||
          extractTitle(evidence.source, evidence.content);

        children.push({
          type: 'SourceCard',
          props: {
            index: globalSourceIndex++,
            title,
            url: evidence.source,
            snippet: evidence.content, // S22-WP: Show FULL content - no truncation
            sourceType: evidence.sourceType,
            accessedAt: evidence.collectedAt,
          },
        });
      }
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

// =============================================================================
// S22-WP: Canonical Research Transform Functions
// =============================================================================
// These functions provide 100% lossless display of structured research output.
// CanonicalResearch is the single source of truth when available.

/**
 * Check if a sprout has canonical research data.
 * S22-WP: Prefer canonicalResearch over legacy fields for display.
 */
export function hasCanonicalResearch(sprout: Sprout): boolean {
  return !!sprout.canonicalResearch?.title && !!sprout.canonicalResearch?.sources?.length;
}

/**
 * S22-WP: Transform canonicalResearch into Summary render tree.
 * Shows executive summary and key findings - brief overview only.
 */
export function canonicalSummaryToRenderTree(canonical: CanonicalResearch, query: string): RenderTree {
  const children: RenderElement[] = [];
  const now = new Date().toISOString();

  // Header with title and confidence
  children.push({
    type: 'EvidenceHeader',
    props: {
      query,
      templateName: undefined,
      totalSources: canonical.sources.length,
      confidenceScore: canonical.confidence_assessment?.score ?? 0.7,
      executionTime: 0,
      createdAt: canonical._meta?.capturedAt || now,
    },
  });

  // Title as section header
  children.push({
    type: 'BranchHeader',
    props: {
      branchQuery: canonical.title,
      relevanceScore: canonical.confidence_assessment?.score ?? 0.7,
      sourceCount: canonical.sources.length,
      status: 'complete',
    },
  });

  // Executive summary as main synthesis
  children.push({
    type: 'SynthesisBlock',
    props: {
      content: canonical.executive_summary,
      confidence: canonical.confidence_assessment?.score ?? 0.7,
    },
  });

  // Key findings
  if (canonical.key_findings?.length) {
    children.push({
      type: 'FindingsList',
      props: {
        findings: canonical.key_findings,
      },
    });
  }

  // Confidence rationale if available
  if (canonical.confidence_assessment?.rationale) {
    children.push({
      type: 'ConfidenceNote',
      props: {
        level: canonical.confidence_assessment.level || 'medium',
        rationale: canonical.confidence_assessment.rationale,
      },
    });
  }

  return {
    type: 'root',
    children,
  };
}

/**
 * S22-WP: Transform canonicalResearch into Full Report render tree.
 * Shows ALL sections with full content and inline citations.
 * This is the complete research the user waited for.
 */
export function canonicalFullReportToRenderTree(canonical: CanonicalResearch, query: string): RenderTree {
  const children: RenderElement[] = [];
  const now = new Date().toISOString();

  // Header with query and metadata
  children.push({
    type: 'EvidenceHeader',
    props: {
      query,
      templateName: undefined,
      totalSources: canonical.sources.length,
      confidenceScore: canonical.confidence_assessment?.score ?? 0.7,
      executionTime: 0,
      createdAt: canonical._meta?.capturedAt || now,
    },
  });

  // Title as top-level header
  children.push({
    type: 'BranchHeader',
    props: {
      branchQuery: canonical.title,
      relevanceScore: canonical.confidence_assessment?.score ?? 0.7,
      sourceCount: canonical.sources.length,
      status: 'complete',
    },
  });

  // Executive summary first
  children.push({
    type: 'SynthesisBlock',
    props: {
      content: `## Executive Summary\n\n${canonical.executive_summary}`,
      confidence: canonical.confidence_assessment?.score ?? 0.7,
    },
  });

  // All research sections with their full content
  for (const section of canonical.sections) {
    // Build citation references for this section
    const citationRefs = section.citation_indices?.length
      ? ` [${section.citation_indices.join(', ')}]`
      : '';

    children.push({
      type: 'SynthesisBlock',
      props: {
        content: `## ${section.heading}${citationRefs}\n\n${section.content}`,
        confidence: canonical.confidence_assessment?.score ?? 0.7,
      },
    });
  }

  // Key findings section
  if (canonical.key_findings?.length) {
    children.push({
      type: 'FindingsList',
      props: {
        findings: canonical.key_findings,
      },
    });
  }

  // Limitations section
  if (canonical.limitations?.length) {
    children.push({
      type: 'LimitationsList',
      props: {
        limitations: canonical.limitations,
      },
    });
  }

  // Summary footer
  children.push({
    type: 'EvidenceSummary',
    props: {
      branchCount: canonical.sections.length,
      totalFindings: canonical.key_findings?.length || 0,
      apiCallsUsed: canonical._meta?.webSearchResultCount || 0,
    },
  });

  return {
    type: 'root',
    children,
  };
}

/**
 * S22-WP: Transform canonicalResearch into Sources render tree.
 * Shows all source citations with full metadata and snippets.
 */
export function canonicalSourcesToRenderTree(canonical: CanonicalResearch, query: string): RenderTree {
  const children: RenderElement[] = [];
  const now = new Date().toISOString();

  // Header
  children.push({
    type: 'EvidenceHeader',
    props: {
      query,
      templateName: undefined,
      totalSources: canonical.sources.length,
      confidenceScore: canonical.confidence_assessment?.score ?? 0.7,
      executionTime: 0,
      createdAt: canonical._meta?.capturedAt || now,
    },
  });

  // Sources header
  children.push({
    type: 'BranchHeader',
    props: {
      branchQuery: `Sources (${canonical.sources.length} citations)`,
      relevanceScore: 1.0,
      sourceCount: canonical.sources.length,
      status: 'complete',
    },
  });

  // Each source as a card with full metadata
  for (const source of canonical.sources) {
    children.push({
      type: 'SourceCard',
      props: {
        index: source.index,
        title: source.title,
        url: source.url,
        snippet: source.snippet || '',
        sourceType: 'web',
        accessedAt: canonical._meta?.capturedAt || now,
        domain: source.domain,
        credibility: source.credibility,
      },
    });
  }

  // Summary
  children.push({
    type: 'EvidenceSummary',
    props: {
      branchCount: 1,
      totalFindings: 0,
      apiCallsUsed: canonical._meta?.webSearchResultCount || 0,
    },
  });

  return {
    type: 'root',
    children,
  };
}

// =============================================================================
// Legacy Helper Functions
// =============================================================================

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

/**
 * S22-WP: Extract ONLY the Executive Summary section from a full research report.
 * Used by Summary tab to show a brief overview, while Full Report shows everything.
 */
function extractExecutiveSummary(markdown: string): string {
  const lines = markdown.split('\n');
  let inSummary = false;
  const summaryLines: string[] = [];

  for (const line of lines) {
    // Start collecting after we see "## Executive Summary" or "# Executive Summary"
    if (line.match(/^#{1,2}\s*Executive Summary/i)) {
      inSummary = true;
      summaryLines.push(line);
      continue;
    }

    // Stop when we hit the next major section (## heading that starts with capital letter)
    if (inSummary && line.match(/^#{1,2}\s+[A-Z]/)) {
      break;
    }

    if (inSummary) {
      summaryLines.push(line);
    }
  }

  // Return the extracted summary if found
  if (summaryLines.length > 0) {
    return summaryLines.join('\n').trim();
  }

  // Fallback: Try to find "Research Summary" section
  inSummary = false;
  for (const line of lines) {
    if (line.match(/^#\s*Research Summary/i)) {
      inSummary = true;
      summaryLines.push(line);
      continue;
    }
    if (inSummary && line.match(/^#{1,2}\s+[A-Z]/)) {
      break;
    }
    if (inSummary) {
      summaryLines.push(line);
    }
  }

  if (summaryLines.length > 0) {
    return summaryLines.join('\n').trim();
  }

  // Final fallback: return first ~1000 chars
  const cutoff = 1000;
  return markdown.substring(0, cutoff) + (markdown.length > cutoff ? '\n\n*[See Full Report for complete analysis]*' : '');
}

/**
 * S22-WP: Transform Sprout to Summary-only render tree.
 * For the "Summary" tab - shows ONLY the Executive Summary section.
 * The Full Report tab shows the complete analysis.
 *
 * Priority: canonicalResearch (100% lossless) > legacy fields
 *
 * @deprecated Legacy fallback path. New sprouts should use canonicalResearch.
 * Legacy path will be removed after migration period (30 days from S22-WP merge).
 */
export function sproutSynthesisToRenderTree(sprout: Sprout): RenderTree | null {
  // S22-WP: Prefer canonicalResearch when available (100% lossless)
  if (hasCanonicalResearch(sprout)) {
    return canonicalSummaryToRenderTree(sprout.canonicalResearch!, sprout.query);
  }

  // S23-SFR Phase 0d: Deprecation warning for legacy path
  if (process.env.NODE_ENV === 'development') {
    console.warn('[evidence-transform] DEPRECATED: sproutSynthesisToRenderTree using legacy path. Sprout should have canonicalResearch.');
  }

  // Legacy fallback for older sprouts without canonicalResearch
  const children: RenderElement[] = [];
  const now = new Date().toISOString();

  // Find full synthesis content from various sources
  let fullSynthesisContent: string | null = null;
  let synthesisConfidence = 0.7;

  // Check for synthesis in researchEvidence
  const synthesisEvidence = sprout.researchEvidence?.find(e => e.source === 'research-synthesis');
  if (synthesisEvidence) {
    fullSynthesisContent = synthesisEvidence.content;
    synthesisConfidence = synthesisEvidence.confidence;
  }

  // Check for synthesis in researchBranches
  if (!fullSynthesisContent && sprout.researchBranches?.length) {
    for (const branch of sprout.researchBranches) {
      const branchSynthesis = branch.evidence?.find(e => e.source === 'research-synthesis');
      if (branchSynthesis) {
        fullSynthesisContent = branchSynthesis.content;
        synthesisConfidence = branchSynthesis.confidence;
        break;
      }
    }
  }

  // Check for synthesis summary
  if (!fullSynthesisContent && sprout.researchSynthesis?.summary) {
    fullSynthesisContent = sprout.researchSynthesis.summary;
    synthesisConfidence = sprout.researchSynthesis.confidence;
  }

  // No synthesis available
  if (!fullSynthesisContent) {
    return null;
  }

  // Extract ONLY the Executive Summary section for this tab
  const summaryOnlyContent = extractExecutiveSummary(fullSynthesisContent);

  // Minimal header
  children.push({
    type: 'EvidenceHeader',
    props: {
      query: sprout.query,
      templateName: sprout.researchManifest?.promptGenerated?.templateId,
      totalSources: sprout.researchEvidence?.filter(e => e.source !== 'research-synthesis').length || 0,
      confidenceScore: synthesisConfidence,
      executionTime: 0,
      createdAt: sprout.researchSynthesis?.synthesizedAt || sprout.capturedAt || now,
    },
  });

  // Summary-only synthesis block
  children.push({
    type: 'SynthesisBlock',
    props: {
      content: summaryOnlyContent,
      confidence: synthesisConfidence,
    },
  });

  // Key insights if available
  if (sprout.researchSynthesis?.insights?.length) {
    children.push({
      type: 'FindingsList',
      props: {
        findings: sprout.researchSynthesis.insights,
      },
    });
  }

  return {
    type: 'root',
    children,
  };
}

/**
 * S22-WP: Transform Sprout to Full Report render tree.
 * For the "Full Report" tab - shows the COMPLETE research synthesis/analysis.
 * This is the main content the user waited for - NOT the source cards.
 *
 * Priority: canonicalResearch (100% lossless) > legacy fields
 *
 * @deprecated Legacy fallback path. New sprouts should use canonicalResearch.
 * Legacy path will be removed after migration period (30 days from S22-WP merge on 2026-01-24).
 */
export function sproutFullReportToRenderTree(sprout: Sprout): RenderTree | null {
  // S22-WP: Prefer canonicalResearch when available (100% lossless)
  if (hasCanonicalResearch(sprout)) {
    return canonicalFullReportToRenderTree(sprout.canonicalResearch!, sprout.query);
  }

  // S23-SFR Phase 0d: Deprecation warning for legacy path
  if (process.env.NODE_ENV === 'development') {
    console.warn('[evidence-transform] DEPRECATED: sproutFullReportToRenderTree using legacy path. Sprout should have canonicalResearch.');
  }

  // Legacy fallback for older sprouts without canonicalResearch
  const children: RenderElement[] = [];
  const now = new Date().toISOString();

  // Find THE synthesis content (avoid duplicates from same data in different locations)
  let synthesisContent: string | null = null;
  let maxConfidence = 0.5;

  // Priority 1: Check for synthesis in researchEvidence (flat array - most direct)
  const synthesisEvidence = sprout.researchEvidence?.find(e => e.source === 'research-synthesis');
  if (synthesisEvidence) {
    synthesisContent = synthesisEvidence.content;
    maxConfidence = Math.max(maxConfidence, synthesisEvidence.confidence);
  }

  // Priority 2: Check for synthesis in researchBranches (only if not found above)
  if (!synthesisContent && sprout.researchBranches?.length) {
    for (const branch of sprout.researchBranches) {
      const branchSynthesis = branch.evidence?.find(e => e.source === 'research-synthesis');
      if (branchSynthesis) {
        synthesisContent = branchSynthesis.content;
        maxConfidence = Math.max(maxConfidence, branchSynthesis.confidence);
        break; // Found it, stop looking
      }
    }
  }

  // Priority 3: Check for synthesis summary (only if not found above)
  if (!synthesisContent && sprout.researchSynthesis?.summary) {
    synthesisContent = sprout.researchSynthesis.summary;
    maxConfidence = Math.max(maxConfidence, sprout.researchSynthesis.confidence);
  }

  // No synthesis available - fall back to full research tree
  if (!synthesisContent) {
    return sproutResearchToRenderTree(sprout);
  }

  // Count actual sources for metadata
  const totalSources =
    sprout.researchBranches?.reduce((sum, b) =>
      sum + (b.evidence?.filter(e => e.source !== 'research-synthesis').length || 0), 0) ||
    sprout.researchEvidence?.filter(e => e.source !== 'research-synthesis').length ||
    0;

  // Header with full context
  children.push({
    type: 'EvidenceHeader',
    props: {
      query: sprout.query,
      templateName: sprout.researchManifest?.promptGenerated?.templateId,
      totalSources,
      confidenceScore: maxConfidence,
      executionTime: 0,
      createdAt: sprout.researchSynthesis?.synthesizedAt || sprout.capturedAt || now,
    },
  });

  // Main synthesis content - THE COMPLETE research report (no duplication)
  children.push({
    type: 'SynthesisBlock',
    props: {
      content: synthesisContent,
      confidence: maxConfidence,
    },
  });

  // Key insights/findings
  if (sprout.researchSynthesis?.insights?.length) {
    children.push({
      type: 'FindingsList',
      props: {
        findings: sprout.researchSynthesis.insights,
      },
    });
  }

  // Summary footer - mentions sources are in separate tab
  const branchCount = sprout.researchBranches?.length || 1;
  const totalFindings = sprout.researchSynthesis?.insights?.length || 0;

  children.push({
    type: 'EvidenceSummary',
    props: {
      branchCount,
      totalFindings,
      apiCallsUsed: 0,
    },
  });

  return {
    type: 'root',
    children,
  };
}

/**
 * S22-WP: Transform Sprout to Sources-only render tree.
 * For the "Sources" tab - shows just the citation cards without synthesis.
 *
 * Priority: canonicalResearch (100% lossless) > legacy fields
 *
 * @deprecated Legacy fallback path. New sprouts should use canonicalResearch.
 * Legacy path will be removed after migration period (30 days from S22-WP merge on 2026-01-24).
 */
export function sproutSourcesToRenderTree(sprout: Sprout): RenderTree | null {
  // S22-WP: Prefer canonicalResearch when available (100% lossless)
  if (hasCanonicalResearch(sprout)) {
    return canonicalSourcesToRenderTree(sprout.canonicalResearch!, sprout.query);
  }

  // S23-SFR Phase 0d: Deprecation warning for legacy path
  if (process.env.NODE_ENV === 'development') {
    console.warn('[evidence-transform] DEPRECATED: sproutSourcesToRenderTree using legacy path. Sprout should have canonicalResearch.');
  }

  // Legacy fallback for older sprouts without canonicalResearch
  const hasEvidence =
    sprout.researchBranches?.some(b => b.evidence?.some(e => e.source !== 'research-synthesis')) ||
    sprout.researchEvidence?.some(e => e.source !== 'research-synthesis');

  if (!hasEvidence) {
    return null;
  }

  const children: RenderElement[] = [];
  const now = new Date().toISOString();
  let globalSourceIndex = 1;

  // Count actual sources (excluding synthesis)
  const totalSources =
    sprout.researchBranches?.reduce((sum, b) =>
      sum + (b.evidence?.filter(e => e.source !== 'research-synthesis').length || 0), 0) ||
    sprout.researchEvidence?.filter(e => e.source !== 'research-synthesis').length ||
    0;

  const avgRelevance =
    sprout.researchEvidence?.filter(e => e.source !== 'research-synthesis').length
      ? sprout.researchEvidence
          .filter(e => e.source !== 'research-synthesis')
          .reduce((sum, e) => sum + e.relevance, 0) /
        sprout.researchEvidence.filter(e => e.source !== 'research-synthesis').length
      : 0.5;

  // Header
  children.push({
    type: 'EvidenceHeader',
    props: {
      query: sprout.query,
      templateName: sprout.researchManifest?.promptGenerated?.templateId,
      totalSources,
      confidenceScore: avgRelevance,
      executionTime: 0,
      createdAt: sprout.researchSynthesis?.synthesizedAt || sprout.capturedAt || now,
    },
  });

  // Per-branch content
  if (sprout.researchBranches?.length) {
    for (const branch of sprout.researchBranches) {
      const branchSources = branch.evidence?.filter(e => e.source !== 'research-synthesis') || [];

      if (branchSources.length === 0) continue;

      // Branch header
      children.push({
        type: 'BranchHeader',
        props: {
          branchQuery: branch.label,
          relevanceScore:
            branchSources.length
              ? branchSources.reduce((sum, e) => sum + e.relevance, 0) / branchSources.length
              : 0.5,
          sourceCount: branchSources.length,
          status: branch.status === 'complete' ? 'complete' : 'pending',
        },
      });

      // Source cards
      for (const evidence of branchSources) {
        const title = (evidence as Evidence).metadata?.title ||
          extractTitle(evidence.source, evidence.content);

        children.push({
          type: 'SourceCard',
          props: {
            index: globalSourceIndex++,
            title,
            url: evidence.source,
            snippet: evidence.content,
            sourceType: evidence.sourceType,
            accessedAt: evidence.collectedAt,
          },
        });
      }
    }
  } else if (sprout.researchEvidence?.length) {
    // Flat evidence array
    const sources = sprout.researchEvidence.filter(e => e.source !== 'research-synthesis');

    if (sources.length > 0) {
      children.push({
        type: 'BranchHeader',
        props: {
          branchQuery: 'Sources',
          relevanceScore:
            sources.reduce((sum, e) => sum + e.relevance, 0) / sources.length,
          sourceCount: sources.length,
          status: 'complete',
        },
      });

      for (const evidence of sources) {
        const title = (evidence as Evidence).metadata?.title ||
          extractTitle(evidence.source, evidence.content);

        children.push({
          type: 'SourceCard',
          props: {
            index: globalSourceIndex++,
            title,
            url: evidence.source,
            snippet: evidence.content,
            sourceType: evidence.sourceType,
            accessedAt: evidence.collectedAt,
          },
        });
      }
    }
  }

  // Summary footer
  const branchCount = sprout.researchBranches?.length || 1;

  children.push({
    type: 'EvidenceSummary',
    props: {
      branchCount,
      totalFindings: 0, // Findings shown in synthesis tab
      apiCallsUsed: 0,
    },
  });

  return {
    type: 'root',
    children,
  };
}

export default evidenceBundleToRenderTree;
