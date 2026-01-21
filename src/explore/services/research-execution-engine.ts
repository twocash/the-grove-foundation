// src/explore/services/research-execution-engine.ts
// Research Execution Engine - Claude Deep Research integration
// Sprint: evidence-collection-v1 → agents-go-live-v1
//
// DEX: Capability Agnosticism
// Engine abstracts the search provider. Config controls behavior.
// DEX: Provenance as Infrastructure
// Every source includes URL, title, snippet, accessedAt.

import type { ResearchSprout } from '@core/schema/research-sprout';
import type { ResearchAgentConfigPayload } from '@core/schema/research-agent-config';
import {
  type EvidenceBundle,
  type BranchEvidence,
  type Source,
  createEvidenceBundle,
} from '@core/schema/evidence-bundle';

// =============================================================================
// Types
// =============================================================================

export interface ExecutionProgress {
  type: 'branch-started' | 'search-executing' | 'branch-completed' | 'error';
  branchIndex: number;
  branchQuery?: string;
  message?: string;
}

export type OnProgressFn = (progress: ExecutionProgress) => void;

// =============================================================================
// Engine
// =============================================================================

/**
 * Execute research for a sprout using real web searches
 *
 * @param sprout - The research sprout to process
 * @param config - Research configuration (from Experience Console)
 * @param onProgress - Optional progress callback
 * @returns EvidenceBundle with real sources
 */
export async function executeResearch(
  sprout: ResearchSprout,
  config: ResearchAgentConfigPayload,
  onProgress?: OnProgressFn
): Promise<EvidenceBundle> {
  const startTime = Date.now();
  let apiCallsUsed = 0;
  const branchResults: BranchEvidence[] = [];

  // Process each branch sequentially (MVP)
  for (let i = 0; i < sprout.branches.length; i++) {
    const branch = sprout.branches[i];

    // Check budget
    if (apiCallsUsed >= config.maxApiCalls) {
      branchResults.push({
        branchQuery: branch.label,
        sources: [],
        findings: ['Budget exceeded - no searches performed'],
        relevanceScore: 0,
        status: 'budget-exceeded',
      });
      continue;
    }

    onProgress?.({
      type: 'branch-started',
      branchIndex: i,
      branchQuery: branch.label,
    });

    try {
      // Execute search for this branch
      const branchEvidence = await searchBranch(
        branch.label,
        branch.queries || [branch.label],
        config,
        () => {
          apiCallsUsed++;
          onProgress?.({
            type: 'search-executing',
            branchIndex: i,
            branchQuery: branch.label,
          });
        }
      );

      branchResults.push(branchEvidence);

      onProgress?.({
        type: 'branch-completed',
        branchIndex: i,
        branchQuery: branch.label,
      });

    } catch (error) {
      onProgress?.({
        type: 'error',
        branchIndex: i,
        message: error instanceof Error ? error.message : 'Search failed',
      });

      branchResults.push({
        branchQuery: branch.label,
        sources: [],
        findings: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        relevanceScore: 0,
        status: 'failed',
      });
    }

    // Delay between branches
    if (i < sprout.branches.length - 1 && config.branchDelay > 0) {
      await delay(config.branchDelay);
    }
  }

  const executionTime = Date.now() - startTime;

  return createEvidenceBundle(
    sprout.id,
    branchResults,
    executionTime,
    apiCallsUsed
  );
}

// =============================================================================
// Search Implementation
// =============================================================================

/**
 * Search for evidence on a single branch
 */
async function searchBranch(
  branchLabel: string,
  queries: string[],
  config: ResearchAgentConfigPayload,
  onApiCall: () => void
): Promise<BranchEvidence> {
  const sources: Source[] = [];
  const findings: string[] = [];

  // Limit queries by searchDepth
  const queriesToRun = queries.slice(0, config.searchDepth);

  for (const query of queriesToRun) {
    onApiCall();

    // Call Claude Deep Research API
    const searchResults = await callClaudeDeepResearch(query);

    // Extract sources from grounding metadata
    for (const result of searchResults) {
      sources.push({
        url: result.url,
        title: result.title,
        snippet: result.snippet,
        accessedAt: new Date().toISOString(),
        sourceType: classifySource(result.url),
      });

      // Extract key finding from snippet
      if (result.snippet) {
        findings.push(extractFinding(result.snippet, query));
      }
    }
  }

  // Calculate relevance based on source count and query match
  const relevanceScore = calculateRelevance(sources, branchLabel);

  return {
    branchQuery: branchLabel,
    sources,
    findings,
    relevanceScore,
    status: sources.length > 0 ? 'complete' : 'failed',
  };
}

/**
 * Call Claude Deep Research API
 *
 * Sprint: agents-go-live-v1
 * Calls /api/research/deep endpoint to get research findings from Claude
 */
async function callClaudeDeepResearch(query: string): Promise<Array<{
  url: string;
  title: string;
  snippet: string;
}>> {
  console.log(`[ResearchEngine] Executing Claude deep research: "${query}"`);

  try {
    const response = await fetch('/api/research/deep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[ResearchEngine] API error:', errorData);
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('[ResearchEngine] Claude response:', result.summary?.substring(0, 100));

    // Transform Claude findings into source format
    // Each finding becomes a source with the claim as snippet
    const sources: Array<{ url: string; title: string; snippet: string }> = [];

    if (result.findings && Array.isArray(result.findings)) {
      for (const finding of result.findings) {
        sources.push({
          url: finding.source || `https://research.grove/${encodeURIComponent(finding.claim?.substring(0, 50) || query)}`,
          title: finding.source || 'Claude Research Finding',
          snippet: finding.claim || '',
        });
      }
    }

    // If no structured findings, create a synthetic source from summary
    if (sources.length === 0 && result.summary) {
      sources.push({
        url: `https://research.grove/${encodeURIComponent(query.substring(0, 50))}`,
        title: 'Claude Research Summary',
        snippet: result.summary,
      });
    }

    return sources;

  } catch (error) {
    console.error('[ResearchEngine] Claude deep research failed:', error);
    // Return empty array on error - the branch will be marked as failed
    return [];
  }
}

// =============================================================================
// Utilities
// =============================================================================

function classifySource(url: string): Source['sourceType'] {
  if (url.includes('.edu') || url.includes('scholar.') || url.includes('arxiv')) {
    return 'academic';
  }
  if (url.includes('news') || url.includes('bbc') || url.includes('nytimes')) {
    return 'news';
  }
  if (url.includes('.gov') || url.includes('official')) {
    return 'primary';
  }
  return 'practitioner';
}

function extractFinding(snippet: string, query: string): string {
  // Simple extraction: first sentence or first 200 chars
  const firstSentence = snippet.split('.')[0];
  return firstSentence.length > 200
    ? firstSentence.slice(0, 200) + '...'
    : firstSentence + '.';
}

function calculateRelevance(sources: Source[], query: string): number {
  if (sources.length === 0) return 0;

  // Simple heuristic: more sources = higher relevance, capped at 1.0
  const sourceScore = Math.min(sources.length / 5, 1.0);

  // Boost for academic sources
  const academicCount = sources.filter(s => s.sourceType === 'academic').length;
  const academicBoost = academicCount > 0 ? 0.1 : 0;

  return Math.min(sourceScore + academicBoost, 1.0);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
