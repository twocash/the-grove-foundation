// src/explore/services/writer-agent.ts
// Writer Agent Service - Transforms evidence into research documents via Claude
// Sprint: writer-agent-v1 → agents-go-live-v1
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

  // Call Claude API for document writing
  const voiceConfig = {
    formality: config.voice.formality,
    perspective: config.voice.perspective,
    citationStyle: config.documentStructure.citationStyle,
  };
  const llmOutput = await callLLMForWriting(systemPrompt, userPrompt, voiceConfig);

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
 * Call Claude API for document writing
 *
 * Sprint: agents-go-live-v1
 * Calls /api/research/write endpoint for voice-styled document generation
 */
async function callLLMForWriting(
  systemPrompt: string,
  userPrompt: string,
  voiceConfig?: { formality?: string; perspective?: string; citationStyle?: string }
): Promise<LLMWriterOutput> {
  console.log('[WriterAgent] Calling Claude for writing...');
  console.log('[WriterAgent] System prompt length:', systemPrompt.length);
  console.log('[WriterAgent] User prompt length:', userPrompt.length);
  console.log('[WriterAgent] Voice config:', voiceConfig);

  try {
    const response = await fetch('/api/research/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        evidence: userPrompt,
        query: systemPrompt,
        voiceConfig,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[WriterAgent] API error:', errorData);
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('[WriterAgent] Claude response received, position:', result.position?.substring(0, 50));

    // Map response to expected format
    return {
      position: result.position || '',
      analysis: result.analysis || '',
      limitations: result.limitations || '',
      citations: (result.citations || []).map((c: { index?: number; title?: string; url?: string; snippet?: string; domain?: string }, i: number) => ({
        index: c.index ?? i + 1,
        title: c.title || 'Source',
        url: c.url || '',
        snippet: c.snippet || '',
        domain: c.domain || (c.url ? new URL(c.url).hostname : ''),
      })),
    };

  } catch (error) {
    console.error('[WriterAgent] Claude writing failed:', error);

    // Return error state document
    return {
      position: 'Document generation failed',
      analysis: `## Error\n\nThe document could not be generated: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or check the ANTHROPIC_API_KEY configuration.`,
      limitations: 'API call failed',
      citations: [],
    };
  }
}

// =============================================================================
// Exports
// =============================================================================

export type { ResearchDocument, Citation };
