// src/explore/services/research-agent.ts
// Research Agent - Executes research for claimed sprouts
// Sprint: sprout-research-v1, Phase 5b
//
// This service executes research branches for a ResearchSprout,
// collecting evidence and updating branch/sprout status.
//
// PATTERN: Agent with progress callbacks
// - Receives a claimed sprout
// - Processes branches sequentially
// - Emits progress events
// - Returns collected evidence

import type {
  ResearchSprout,
  ResearchSproutStatus,
} from '@core/schema/research-sprout';
import type {
  ResearchBranch,
  Evidence,
  BranchStatus,
} from '@core/schema/research-strategy';
import type { ResearchAgentConfigPayload } from '@core/schema/research-agent-config';
import { DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD } from '@core/schema/research-agent-config';
// S22-WP: Import CanonicalResearch type for structured output capture
import type { CanonicalResearch } from '@core/schema/sprout';

// =============================================================================
// Types
// =============================================================================

/**
 * Agent execution configuration
 */
export interface ResearchAgentConfig {
  /** Delay between branch executions in ms (default: 1000) */
  branchDelay?: number;

  /** Maximum API calls per sprout (default: 10) */
  maxApiCalls?: number;

  /** Whether to run in simulation mode (default: true for MVP) */
  simulationMode?: boolean;

  /** Simulated delay per query in ms (default: 500) */
  simulatedQueryDelay?: number;

  /**
   * System prompt from output template.
   * Sprint: research-template-wiring-v1
   * Passed to Claude API to shape research behavior.
   */
  systemPrompt?: string;
}

/**
 * Progress event types
 */
export type ResearchProgressEvent =
  | { type: 'branch-started'; branchId: string; branchLabel: string }
  | { type: 'query-executing'; branchId: string; query: string; index: number }
  | { type: 'evidence-collected'; branchId: string; evidence: Evidence }
  | { type: 'branch-completed'; branchId: string; evidenceCount: number }
  | { type: 'error'; branchId?: string; message: string };

/**
 * Progress callback
 */
export type OnProgressFn = (event: ResearchProgressEvent) => void;

/**
 * Execution result
 */
export interface ResearchExecutionResult {
  /** Whether execution completed successfully */
  success: boolean;

  /** Updated branches with evidence */
  branches: ResearchBranch[];

  /** All collected evidence */
  evidence: Evidence[];

  /**
   * S22-WP: Canonical research output from structured API
   * Contains 100% of what Claude returned via deliver_research_results tool.
   * This is the single source of truth - DO NOT subset.
   */
  canonicalResearch?: CanonicalResearch;

  /** Execution metadata */
  execution: {
    startedAt: string;
    completedAt: string;
    apiCallCount: number;
    tokenCount: number;
    errorMessage?: string;
  };
}

/**
 * Research Agent instance
 */
export interface ResearchAgent {
  /** Execute research for a sprout */
  execute(
    sprout: ResearchSprout,
    onProgress?: OnProgressFn
  ): Promise<ResearchExecutionResult>;

  /** Cancel ongoing execution */
  cancel(): void;

  /** Whether agent is currently executing */
  isExecuting(): boolean;
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_CONFIG: Required<ResearchAgentConfig> = {
  branchDelay: 1000,
  maxApiCalls: 10,
  simulationMode: false, // evidence-collection-v1: Real execution by default
  simulatedQueryDelay: 500,
  systemPrompt: '', // Uses API default if empty - template override via config
};

// =============================================================================
// Evidence Generation (Simulation)
// =============================================================================

/**
 * Generate simulated evidence for a query
 * In production, this would call the actual LLM/search API
 */
function generateSimulatedEvidence(
  branchId: string,
  query: string,
  index: number
): Evidence {
  const now = new Date().toISOString();

  // Simulate different source types based on query content
  const sourceTypes: Array<'academic' | 'practitioner' | 'primary' | 'news'> =
    ['academic', 'practitioner', 'primary', 'news'];
  const sourceType = sourceTypes[index % sourceTypes.length];

  return {
    id: `ev-${branchId}-${index}-${Date.now().toString(36)}`,
    source: `https://simulated-source.grove/${sourceType}/${encodeURIComponent(query.slice(0, 20))}`,
    sourceType,
    content: `[Simulated ${sourceType} evidence for: "${query}"]\n\n` +
      `This is placeholder content that would be replaced by actual research findings ` +
      `from the ${sourceType} literature. The Research Agent would extract key insights, ` +
      `relevant quotes, and supporting data from real sources.\n\n` +
      `Key findings would include:\n` +
      `- Point 1: Analysis of the core concept\n` +
      `- Point 2: Supporting evidence from ${sourceType} sources\n` +
      `- Point 3: Implications and connections`,
    relevance: 0.7 + Math.random() * 0.3, // 0.7-1.0
    confidence: 0.6 + Math.random() * 0.4, // 0.6-1.0
    collectedAt: now,
  };
}

// =============================================================================
// Factory
// =============================================================================

/**
 * Create a Research Agent instance
 */
export function createResearchAgent(
  config: ResearchAgentConfig = {}
): ResearchAgent {
  // Merge config with defaults
  const cfg: Required<ResearchAgentConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Internal state
  let isExecutingFlag = false;
  let cancelRequested = false;

  // Execute research for a sprout
  async function execute(
    sprout: ResearchSprout,
    onProgress?: OnProgressFn
  ): Promise<ResearchExecutionResult> {
    if (isExecutingFlag) {
      throw new Error('Agent is already executing');
    }

    isExecutingFlag = true;
    cancelRequested = false;

    // Sprint: evidence-collection-v1 - Execution logging
    console.log(`[ResearchAgent] Starting research for sprout: ${sprout.id}`);
    console.log(`[ResearchAgent] Branches to process: ${sprout.branches.length}`);
    console.log(`[ResearchAgent] Simulation mode: ${cfg.simulationMode}`);
    // Sprint: research-template-wiring-v1 - Log template systemPrompt presence
    if (cfg.systemPrompt) {
      console.log(`[ResearchAgent] Template systemPrompt configured (${cfg.systemPrompt.length} chars)`);
    }

    const startedAt = new Date().toISOString();
    let apiCallCount = 0;
    let tokenCount = 0;
    const allEvidence: Evidence[] = [];
    const updatedBranches: ResearchBranch[] = [];
    let errorMessage: string | undefined;
    // S22-WP: Capture canonical research from structured API output
    let capturedCanonicalResearch: CanonicalResearch | undefined;

    try {
      // Process each branch
      for (const branch of sprout.branches) {
        if (cancelRequested) {
          errorMessage = 'Execution cancelled';
          break;
        }

        // Sprint: evidence-collection-v1 - Branch logging
        console.log(`[ResearchAgent] Processing branch: ${branch.label}`);

        // Emit branch started
        onProgress?.({
          type: 'branch-started',
          branchId: branch.id,
          branchLabel: branch.label,
        });

        // Update branch status to active
        const activeBranch: ResearchBranch = {
          ...branch,
          status: 'active' as BranchStatus,
          evidence: [],
        };

        // Process each query in the branch
        for (let i = 0; i < branch.queries.length; i++) {
          if (cancelRequested) break;
          if (apiCallCount >= cfg.maxApiCalls) {
            onProgress?.({
              type: 'error',
              branchId: branch.id,
              message: `Max API calls (${cfg.maxApiCalls}) reached`,
            });
            break;
          }

          // Sprint: S21-RL - Use notes as primary research query if provided
          // Notes contain user's detailed research prompt from the modal
          // For first query in first branch, prioritize notes over auto-generated queries
          const isFirstQuery = i === 0 && sprout.branches.indexOf(branch) === 0;
          const query = (isFirstQuery && sprout.notes) ? sprout.notes : branch.queries[i];

          // For progress display, show a truncated version if using long notes
          const displayQuery = query.length > 100
            ? query.slice(0, 100) + '...'
            : query;

          // Emit query executing
          onProgress?.({
            type: 'query-executing',
            branchId: branch.id,
            query: displayQuery,  // Show truncated in UI
            index: i,
          });

          // Execute query
          // Sprint: evidence-collection-v1 - Real execution mode
          let evidence: Evidence;

          if (cfg.simulationMode) {
            // Legacy simulation mode (deprecated)
            await delay(cfg.simulatedQueryDelay);
            evidence = generateSimulatedEvidence(branch.id, query, i);
            tokenCount += 150 + Math.floor(Math.random() * 100);
          } else {
            // Real execution mode - call Claude Deep Research API
            // Sprint: research-template-wiring-v1 - API integration
            console.log(`[ResearchAgent] Real execution mode - query: "${displayQuery}" (${query.length} chars)`);
            if (sprout.notes && isFirstQuery) {
              console.log(`[ResearchAgent] Using user notes as research query`);
            }
            if (cfg.systemPrompt) {
              console.log(`[ResearchAgent] Using template systemPrompt (${cfg.systemPrompt.length} chars)`);
            }

            try {
              const response = await fetch('/api/research/deep', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  query,
                  context: branch.label,
                  systemPrompt: cfg.systemPrompt,  // From template!
                }),
              });

              if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
              }

              const result = await response.json();
              console.log(`[ResearchAgent] API response received:`, {
                findingsCount: result.findings?.length || 0,
                hasSummary: !!result.summary,
                hasCanonicalResearch: !!result.canonicalResearch,
              });

              // S22-WP: Capture the FULL canonical research object
              // User requirement: "capture 100% of what is returned from deep research"
              if (result.canonicalResearch) {
                capturedCanonicalResearch = result.canonicalResearch as CanonicalResearch;

                // S23-SFR DEBUG: Log FULL canonical research details from API response
                console.log(`[ResearchAgent] Canonical research from API BEFORE processing:`, {
                  title: result.canonicalResearch.title?.slice(0, 50),
                  sectionsCount: result.canonicalResearch.sections?.length || 0,
                  sourcesCount: result.canonicalResearch.sources?.length || 0,
                  findingsCount: result.canonicalResearch.key_findings?.length || 0,
                  execSummaryLength: result.canonicalResearch.executive_summary?.length || 0,
                  rawKeys: Object.keys(result.canonicalResearch || {}),
                  sectionsIsArray: Array.isArray(result.canonicalResearch.sections),
                  sourcesIsArray: Array.isArray(result.canonicalResearch.sources),
                });

                // S23-SFR Phase 0b: Defensive validation - ensure sections is array
                // Claude API occasionally returns sections as string instead of array
                if (capturedCanonicalResearch.sections && !Array.isArray(capturedCanonicalResearch.sections)) {
                  console.warn('[ResearchAgent] sections is not array, wrapping in array');
                  capturedCanonicalResearch.sections = [capturedCanonicalResearch.sections as unknown as typeof capturedCanonicalResearch.sections[0]];
                }

                // S23-SFR DEBUG: Log captured canonical research AFTER processing
                console.log(`[ResearchAgent] Captured canonical research AFTER processing:`, {
                  title: capturedCanonicalResearch.title?.slice(0, 50),
                  sectionsCount: capturedCanonicalResearch.sections?.length || 0,
                  sourcesCount: capturedCanonicalResearch.sources?.length || 0,
                  findingsCount: capturedCanonicalResearch.key_findings?.length || 0,
                  execSummaryLength: capturedCanonicalResearch.executive_summary?.length || 0,
                });
              }

              // S22-WP: Convert API result to Evidence format
              // Create INDIVIDUAL Evidence objects per finding with REAL URLs
              // This enables DocumentViewer to show proper SourceCards with clickable links
              console.log(`[ResearchAgent] Full response: ${result.findings?.length || 0} findings, ${result.summary?.length || 0} chars`);

              const now = new Date().toISOString();
              const collectedEvidence: Evidence[] = [];

              // 1. Create main synthesis evidence with the full summary
              if (result.summary) {
                collectedEvidence.push({
                  id: `ev-${branch.id}-${i}-summary-${Date.now().toString(36)}`,
                  source: 'research-synthesis',  // Special marker for synthesis
                  sourceType: 'practitioner',
                  content: result.summary,
                  relevance: 1.0,  // Synthesis is most relevant
                  confidence: 0.9,
                  collectedAt: now,
                });
              }

              // 2. Create individual Evidence objects per finding with REAL URLs
              if (result.findings && result.findings.length > 0) {
                for (let findingIdx = 0; findingIdx < result.findings.length; findingIdx++) {
                  const finding = result.findings[findingIdx];
                  if (finding.source && finding.source !== 'claude-research') {
                    collectedEvidence.push({
                      id: `ev-${branch.id}-${i}-f${findingIdx}-${Date.now().toString(36)}`,
                      source: finding.source,  // REAL URL!
                      sourceType: finding.sourceType || 'practitioner',
                      content: finding.claim || finding.sourceTitle || 'Source citation',
                      relevance: finding.confidence || 0.8,
                      confidence: finding.confidence || 0.8,
                      collectedAt: now,
                      // S22-WP: Store title separately for display
                      metadata: {
                        title: finding.sourceTitle || extractTitleFromUrl(finding.source),
                      },
                    } as Evidence);
                  }
                }
              }

              // 3. Fallback: if no findings, also check webCitations
              if (collectedEvidence.length <= 1 && result.webCitations && result.webCitations.length > 0) {
                for (let citIdx = 0; citIdx < result.webCitations.length; citIdx++) {
                  const cit = result.webCitations[citIdx];
                  if (cit.url) {
                    collectedEvidence.push({
                      id: `ev-${branch.id}-${i}-c${citIdx}-${Date.now().toString(36)}`,
                      source: cit.url,  // REAL URL!
                      sourceType: 'practitioner',
                      content: cit.cited_text || cit.title || 'Web citation',
                      relevance: 0.8,
                      confidence: 0.8,
                      collectedAt: now,
                      metadata: {
                        title: cit.title || extractTitleFromUrl(cit.url),
                      },
                    } as Evidence);
                  }
                }
              }

              // Use first evidence as the "main" one for branch tracking
              // All collected evidence will be added to allEvidence array
              evidence = collectedEvidence[0] || {
                id: `ev-${branch.id}-${i}-empty-${Date.now().toString(36)}`,
                source: 'no-results',
                sourceType: 'practitioner',
                content: 'No research results found',
                relevance: 0,
                confidence: 0,
                collectedAt: now,
              };

              // Add additional evidence items to branch and allEvidence
              if (collectedEvidence.length > 1) {
                for (let k = 1; k < collectedEvidence.length; k++) {
                  activeBranch.evidence!.push(collectedEvidence[k]);
                  allEvidence.push(collectedEvidence[k]);
                }
              }

              console.log(`[ResearchAgent] Created ${collectedEvidence.length} evidence items (1 synthesis + ${collectedEvidence.length - 1} sources)`);

              tokenCount += 500; // Approximate tokens for API call

            } catch (error) {
              console.error('[ResearchAgent] API call failed:', error);
              // Fallback evidence on error
              evidence = {
                id: `ev-${branch.id}-${i}-${Date.now().toString(36)}`,
                source: 'error',
                sourceType: 'practitioner',
                content: `Research failed: ${error instanceof Error ? error.message : String(error)}`,
                relevance: 0,
                confidence: 0,
                collectedAt: new Date().toISOString(),
              };
            }
          }

          apiCallCount++;
          activeBranch.evidence!.push(evidence);
          allEvidence.push(evidence);

          // Emit evidence collected
          onProgress?.({
            type: 'evidence-collected',
            branchId: branch.id,
            evidence,
          });
        }

        // Mark branch complete
        const completedBranch: ResearchBranch = {
          ...activeBranch,
          status: 'complete' as BranchStatus,
        };
        updatedBranches.push(completedBranch);

        // Emit branch completed
        onProgress?.({
          type: 'branch-completed',
          branchId: branch.id,
          evidenceCount: completedBranch.evidence?.length ?? 0,
        });

        // Delay between branches
        if (!cancelRequested && sprout.branches.indexOf(branch) < sprout.branches.length - 1) {
          await delay(cfg.branchDelay);
        }
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
      onProgress?.({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      isExecutingFlag = false;
    }

    const completedAt = new Date().toISOString();

    return {
      success: !errorMessage && !cancelRequested,
      branches: updatedBranches,
      evidence: allEvidence,
      // S22-WP: Include canonical research from structured API output
      canonicalResearch: capturedCanonicalResearch,
      execution: {
        startedAt,
        completedAt,
        apiCallCount,
        tokenCount,
        errorMessage,
      },
    };
  }

  // Cancel execution
  function cancel(): void {
    if (isExecutingFlag) {
      cancelRequested = true;
    }
  }

  // Check if executing
  function isExecuting(): boolean {
    return isExecutingFlag;
  }

  return {
    execute,
    cancel,
    isExecuting,
  };
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Promise-based delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * S22-WP: Extract a human-readable title from a URL
 * Used when API doesn't provide a title for a source
 */
function extractTitleFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Use hostname as base
    let title = parsed.hostname.replace('www.', '');
    // If there's a meaningful path, add it
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      // Clean up the path segment
      const cleanedPart = decodeURIComponent(lastPart)
        .replace(/[-_]/g, ' ')
        .replace(/\.\w+$/, '') // Remove extension
        .slice(0, 50);
      if (cleanedPart.length > 3) {
        title = `${title}: ${cleanedPart}`;
      }
    }
    return title;
  } catch {
    return 'External Source';
  }
}

// =============================================================================
// React Hook Integration
// =============================================================================

/**
 * Hook options for useResearchAgent
 */
export interface UseResearchAgentOptions extends ResearchAgentConfig {
  /** Called on progress events */
  onProgress?: OnProgressFn;
}

/**
 * Hook result
 */
export interface UseResearchAgentResult {
  /** Execute research for a sprout */
  execute: (sprout: ResearchSprout) => Promise<ResearchExecutionResult>;

  /** Cancel ongoing execution */
  cancel: () => void;

  /** Whether agent is currently executing */
  isExecuting: boolean;

  /** Current execution progress */
  progress: ResearchProgressEvent[];
}

// Note: The actual hook will be implemented in a separate file
// to avoid circular dependencies with React imports

// =============================================================================
// Exports
// =============================================================================

export type {
  ResearchAgentConfig,
  ResearchProgressEvent,
  OnProgressFn,
  ResearchExecutionResult,
};
