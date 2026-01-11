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
  simulationMode: true, // MVP: simulate by default
  simulatedQueryDelay: 500,
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

    const startedAt = new Date().toISOString();
    let apiCallCount = 0;
    let tokenCount = 0;
    const allEvidence: Evidence[] = [];
    const updatedBranches: ResearchBranch[] = [];
    let errorMessage: string | undefined;

    try {
      // Process each branch
      for (const branch of sprout.branches) {
        if (cancelRequested) {
          errorMessage = 'Execution cancelled';
          break;
        }

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

          const query = branch.queries[i];

          // Emit query executing
          onProgress?.({
            type: 'query-executing',
            branchId: branch.id,
            query,
            index: i,
          });

          // Execute query (simulation or real)
          let evidence: Evidence;

          if (cfg.simulationMode) {
            // Simulate execution delay
            await delay(cfg.simulatedQueryDelay);
            evidence = generateSimulatedEvidence(branch.id, query, i);
            tokenCount += 150 + Math.floor(Math.random() * 100); // Simulated tokens
          } else {
            // TODO: Real LLM/search API call
            // For now, fall back to simulation
            await delay(cfg.simulatedQueryDelay);
            evidence = generateSimulatedEvidence(branch.id, query, i);
            tokenCount += 150 + Math.floor(Math.random() * 100);
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
