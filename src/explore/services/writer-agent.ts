// src/explore/services/writer-agent.ts
// Writer Agent Service - Transforms evidence into research documents
// Sprint: writer-agent-v1
//
// DEX: Capability Agnosticism
// Service abstracts LLM. Config controls behavior.

import type { EvidenceBundle, BranchEvidence, Source } from '@core/schema/evidence-bundle';
import type { WriterAgentConfigPayload } from '@core/schema/writer-agent-config';
import {
  type ResearchDocument,
  type Citation,
  createResearchDocument,
  createInsufficientEvidenceDocument,
} from '@core/schema/research-document';
import { buildWriterSystemPrompt, buildEvidencePrompt } from '../prompts/writer-system-prompt';

// =============================================================================
// Types
// =============================================================================

export interface WriterProgress {
  type: 'preparing' | 'writing' | 'formatting' | 'complete' | 'error';
  message?: string;
}

export type OnWriterProgressFn = (progress: WriterProgress) => void;

interface LLMWriterOutput {
  position: string;
  analysis: string;
  limitations?: string;
  citations: Array<{
    index: number;
    title: string;
    url: string;
    snippet: string;
    domain: string;
  }>;
}

// =============================================================================
// Service
// =============================================================================

/**
 * Transform an EvidenceBundle into a ResearchDocument
 *
 * @param evidenceBundle - The evidence collected from research
 * @param query - The original research query
 * @param config - Writer configuration
 * @param onProgress - Optional progress callback
 * @returns ResearchDocument
 */
export async function writeResearchDocument(
  evidenceBundle: EvidenceBundle,
  query: string,
  config: WriterAgentConfigPayload,
  onProgress?: OnWriterProgressFn
): Promise<ResearchDocument> {
  const documentId = `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  // Check for sufficient evidence
  if (evidenceBundle.totalSources === 0) {
    console.log('[WriterAgent] Insufficient evidence - no sources found');
    return createInsufficientEvidenceDocument(documentId, evidenceBundle.sproutId, query);
  }

  onProgress?.({ type: 'preparing', message: 'Preparing evidence for writing...' });

  // Build prompts
  const systemPrompt = buildWriterSystemPrompt(config);
  const evidenceText = formatEvidenceForPrompt(evidenceBundle, config);
  const userPrompt = buildEvidencePrompt(query, evidenceText);

  console.log('[WriterAgent] System prompt built');
  console.log('[WriterAgent] Evidence formatted:', evidenceBundle.totalSources, 'sources');

  onProgress?.({ type: 'writing', message: 'Generating research document...' });

  // Call LLM
  // TODO: Wire to actual Gemini/Claude service
  const llmOutput = await callLLMForWriting(systemPrompt, userPrompt);

  onProgress?.({ type: 'formatting', message: 'Formatting citations...' });

  // Map sources to citations with accessedAt
  const citations = mapSourcesToCitations(llmOutput.citations, evidenceBundle);

  onProgress?.({ type: 'complete' });

  return createResearchDocument(
    documentId,
    evidenceBundle.sproutId,
    query,
    llmOutput.position,
    llmOutput.analysis,
    citations,
    evidenceBundle.confidenceScore,
    llmOutput.limitations
  );
}

// =============================================================================
// Evidence Formatting
// =============================================================================

function formatEvidenceForPrompt(
  bundle: EvidenceBundle,
  config: WriterAgentConfigPayload
): string {
  const sections: string[] = [];
  let sourceIndex = 1;

  for (const branch of bundle.branches) {
    if (branch.status !== 'complete') continue;

    // Filter by confidence if required
    const filteredSources = branch.sources.filter(
      s => branch.relevanceScore >= config.qualityRules.minConfidenceToInclude
    );

    if (filteredSources.length === 0) continue;

    sections.push(`### Branch: ${branch.branchQuery}`);
    sections.push(`Relevance: ${(branch.relevanceScore * 100).toFixed(0)}%`);
    sections.push('');

    for (const source of filteredSources) {
      sections.push(`[${sourceIndex}] ${source.title}`);
      sections.push(`URL: ${source.url}`);
      sections.push(`Type: ${source.sourceType || 'unknown'}`);
      sections.push(`Excerpt: "${source.snippet}"`);
      sections.push('');
      sourceIndex++;
    }

    if (branch.findings.length > 0) {
      sections.push('Key findings:');
      for (const finding of branch.findings) {
        sections.push(`- ${finding}`);
      }
      sections.push('');
    }
  }

  return sections.join('\n');
}

// =============================================================================
// Citation Mapping
// =============================================================================

function mapSourcesToCitations(
  llmCitations: LLMWriterOutput['citations'],
  bundle: EvidenceBundle
): Citation[] {
  // Collect all sources from evidence
  const allSources: Source[] = bundle.branches.flatMap(b => b.sources);

  return llmCitations.map(c => {
    // Try to find matching source for accessedAt
    const matchingSource = allSources.find(s => s.url === c.url);

    return {
      index: c.index,
      title: c.title,
      url: c.url,
      snippet: c.snippet,
      domain: c.domain || new URL(c.url).hostname,
      accessedAt: matchingSource?.accessedAt || new Date().toISOString(),
    };
  });
}

// =============================================================================
// LLM Call (Placeholder)
// =============================================================================

/**
 * Call LLM for document writing
 *
 * TODO: Wire to actual Gemini/Claude service
 * For now, returns placeholder structure
 */
async function callLLMForWriting(
  systemPrompt: string,
  userPrompt: string
): Promise<LLMWriterOutput> {
  console.log('[WriterAgent] Calling LLM for writing...');
  console.log('[WriterAgent] System prompt length:', systemPrompt.length);
  console.log('[WriterAgent] User prompt length:', userPrompt.length);

  // TODO: Replace with actual LLM call
  // import { geminiService } from '@/services/gemini';
  // const response = await geminiService.generate({
  //   systemPrompt,
  //   userPrompt,
  //   responseFormat: 'json',
  // });
  // return JSON.parse(response.content);

  console.warn('[WriterAgent] LLM call not yet wired - returning placeholder');

  // Placeholder response indicating real implementation needed
  return {
    position: '[Writer Agent LLM integration pending]',
    analysis: '## Analysis Pending\n\nThe Writer Agent LLM integration is not yet complete. ' +
      'This placeholder will be replaced with actual generated content once the LLM service is wired.\n\n' +
      '## Next Steps\n\n1. Wire Gemini/Claude service\n2. Parse JSON response\n3. Validate output structure',
    limitations: 'LLM integration pending.',
    citations: [],
  };
}

// =============================================================================
// Exports
// =============================================================================

export type { ResearchDocument, Citation };
