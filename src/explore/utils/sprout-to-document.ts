// src/explore/utils/sprout-to-document.ts
// Fallback converter: ResearchSprout → ResearchDocument format
// Sprint: results-wiring-v1, Phase 3
//
// Used when sprout.researchDocument is not stored (legacy sprouts).
// Mapping:
// - synthesis.summary → position
// - synthesis.insights + evidence[] → analysis markdown
// - evidence[] → citations[] with indices
// - synthesis.confidence → confidenceScore

import type { ResearchDocument, Citation } from '@core/schema/research-document';
import type { ResearchSprout } from '@core/schema/research-sprout';

/**
 * Safely extract domain from URL string
 */
function extractDomain(urlString: string): string {
  try {
    return new URL(urlString).hostname;
  } catch {
    return 'unknown';
  }
}

/**
 * Converts a legacy ResearchSprout to ResearchDocument format.
 * Used as fallback when sprout.researchDocument is not stored.
 */
export function sproutToResearchDocument(sprout: ResearchSprout): ResearchDocument {
  const { synthesis, evidence = [] } = sprout;

  // Build citations from evidence
  // Evidence type uses: source (URL), content (full text), collectedAt (timestamp)
  const citations: Citation[] = evidence.map((e, index) => ({
    index: index + 1,
    title: extractDomain(e.source) || 'Unknown source',
    url: e.source || '',
    snippet: e.content?.substring(0, 200) || '',
    domain: extractDomain(e.source),
    accessedAt: e.collectedAt || new Date().toISOString(),
  }));

  // Build analysis markdown from insights
  const insightsMarkdown = synthesis?.insights?.length
    ? synthesis.insights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')
    : '';

  // Build evidence references
  const evidenceMarkdown = evidence.length
    ? `\n\n**Supporting Evidence:**\n${evidence.map((e, i) =>
        `- [${i + 1}] ${e.content?.substring(0, 100) || 'Evidence'}${e.source ? ` ([source](${e.source}))` : ''}`
      ).join('\n')}`
    : '';

  return {
    id: `legacy-${sprout.id}`,
    evidenceBundleId: `legacy-bundle-${sprout.id}`,
    query: sprout.spark,
    position: synthesis?.summary || 'No summary available for this research.',
    analysis: `${insightsMarkdown}${evidenceMarkdown}`,
    citations,
    createdAt: sprout.createdAt || new Date().toISOString(),
    wordCount: (insightsMarkdown + evidenceMarkdown).split(/\s+/).length,
    status: citations.length > 0 ? 'complete' : 'insufficient-evidence',
    confidenceScore: synthesis?.confidence ?? 0.5,
  };
}
