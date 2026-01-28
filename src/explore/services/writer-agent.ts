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
  /** S27-OT: Which rendering instructions shaped this output */
  renderingSource?: 'template' | 'default-writer' | 'default-research';
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Safely extract domain from URL string.
 * S21-RL: Source may be "claude-web-search" instead of a real URL.
 */
function extractDomain(url: string | undefined): string {
  if (!url) return 'unknown';
  try {
    return new URL(url).hostname;
  } catch {
    // Not a valid URL - return the source identifier or 'unknown'
    return url.includes('.') ? url : 'claude-research';
  }
}

// =============================================================================
// Service
// =============================================================================

/**
 * Writer options for advanced configuration
 * Sprint: research-template-wiring-v1
 */
export interface WriterOptions {
  /**
   * Direct systemPrompt override from Output Template.
   * When provided, bypasses buildWriterSystemPrompt(config) entirely.
   * This enables user-selected Writer Templates (blog, engineering, vision, etc.)
   *
   * DEX Pillar I: Declarative Sovereignty
   * Template defines behavior, not hardcoded prompt builder.
   */
  systemPromptOverride?: string;

  /**
   * S27-OT: Rendering instructions from Output Template.
   * Passed through to the server endpoint for format control.
   * When absent, server uses named constant defaults.
   */
  renderingInstructions?: string;
}

/**
 * Transform an EvidenceBundle into a ResearchDocument
 *
 * @param evidenceBundle - The evidence collected from research
 * @param query - The original research query
 * @param config - Writer configuration
 * @param onProgress - Optional progress callback
 * @param options - Optional writer options (Sprint: research-template-wiring-v1)
 * @returns ResearchDocument
 */
export async function writeResearchDocument(
  evidenceBundle: EvidenceBundle,
  query: string,
  config: WriterAgentConfigPayload,
  onProgress?: OnWriterProgressFn,
  options?: WriterOptions
): Promise<ResearchDocument> {
  const documentId = `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  // Check for sufficient evidence
  if (evidenceBundle.totalSources === 0) {
    console.log('[WriterAgent] Insufficient evidence - no sources found');
    return createInsufficientEvidenceDocument(documentId, evidenceBundle.sproutId, query);
  }

  onProgress?.({ type: 'preparing', message: 'Preparing evidence for writing...' });

  // S22-WP: Pass-through hack REMOVED. Writer ALWAYS uses LLM transformation.
  // Raw evidence is now displayed in center panel via EvidenceRegistry.
  // Writer produces a reasoned, cited synthesis based on user's selected template.
  //
  // Use LLM to write document from evidence
  // Sprint: research-template-wiring-v1 - Use systemPrompt override if provided
  // This enables Writer Templates (blog, engineering, vision) to control output style
  const systemPrompt = options?.systemPromptOverride || buildWriterSystemPrompt(config);
  const evidenceText = formatEvidenceForPrompt(evidenceBundle, config);
  const userPrompt = buildEvidencePrompt(query, evidenceText);

  // Log which prompt source is being used
  if (options?.systemPromptOverride) {
    console.log('[WriterAgent] Using template systemPrompt override');
  } else {
    console.log('[WriterAgent] Using built systemPrompt from config');
  }

  console.log('[WriterAgent] System prompt built');
  console.log('[WriterAgent] Evidence formatted:', evidenceBundle.totalSources, 'sources');

  onProgress?.({ type: 'writing', message: 'Generating research document...' });

  // Call Claude API for document writing
  // S28-PIPE: voiceConfig removed (config is now text-based, merged in systemPrompt)
  const llmOutput = await callLLMForWriting(
    systemPrompt, userPrompt, undefined, options?.renderingInstructions
  );

  onProgress?.({ type: 'formatting', message: 'Formatting citations...' });

  // Map sources to citations with accessedAt
  const citations = mapSourcesToCitations(llmOutput.citations, evidenceBundle);

  onProgress?.({ type: 'complete' });

  const doc = createResearchDocument(
    documentId,
    evidenceBundle.sproutId,
    query,
    llmOutput.position,
    llmOutput.analysis,
    citations,
    evidenceBundle.confidenceScore,
    llmOutput.limitations
  );

  // S27-OT: Attach renderingSource for provenance tracking
  return Object.assign(doc, { renderingSource: llmOutput.renderingSource });
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

    // S28-PIPE: No confidence filtering (text-based config handles quality via instructions)
    // All sources passed to writer - prompt instructions control what gets used
    const filteredSources = branch.sources;

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
      domain: c.domain || extractDomain(c.url),
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
  voiceConfig?: { formality?: string; perspective?: string; citationStyle?: string },
  renderingInstructions?: string
): Promise<LLMWriterOutput> {
  console.log('[WriterAgent] Calling Claude for writing...');
  console.log('[WriterAgent] System prompt length:', systemPrompt.length);
  console.log('[WriterAgent] User prompt length:', userPrompt.length);
  console.log('[WriterAgent] Voice config:', voiceConfig);
  if (renderingInstructions) {
    console.log('[WriterAgent] Using custom renderingInstructions from template');
  }

  try {
    const response = await fetch('/api/research/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        evidence: userPrompt,
        query: systemPrompt,
        voiceConfig,
        renderingInstructions, // S27-OT: Pass template rendering instructions to server
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[WriterAgent] API error:', errorData);
      throw new Error(errorData.error || errorData.message || `API error: ${response.status}`);
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
        domain: c.domain || extractDomain(c.url),
      })),
      renderingSource: result.renderingSource, // S27-OT: Provenance from server
    };

  } catch (error) {
    console.error('[WriterAgent] Claude writing failed:', error);

    // Extract detailed error info
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    // Return error state document with more details
    return {
      position: 'Document generation failed',
      analysis: `## Error\n\nThe document could not be generated: ${errorMsg}\n\nPlease check the server logs for more details.\n\n**Troubleshooting:**\n1. Verify ANTHROPIC_API_KEY is set in .env or .env.local\n2. Restart the server after setting the key\n3. Ensure the API key is valid and has available credits`,
      limitations: 'API call failed',
      citations: [],
    };
  }
}

// =============================================================================
// Exports
// =============================================================================

export type { ResearchDocument, Citation, WriterOptions };
