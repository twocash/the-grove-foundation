// src/explore/services/research-pipeline.ts
// Research Pipeline - Orchestrates Research Agent → Writer Agent flow
// Sprint: pipeline-integration-v1
//
// DEX: Provenance as Infrastructure
// Every step is tracked with progress events and timing metadata.

import type { ResearchSprout } from '@core/schema/research-sprout';
import type { ResearchBranch, Evidence } from '@core/schema/research-strategy';
import type {
  EvidenceBundle,
  BranchEvidence,
  Source,
} from '@core/schema/evidence-bundle';
import { createEvidenceBundle } from '@core/schema/evidence-bundle';
import type { ResearchDocument } from '@core/schema/research-document';
import type { ResearchAgentConfigPayload } from '@core/schema/research-agent-config';
import type { WriterAgentConfigPayload } from '@core/schema/writer-agent-config';

import {
  createResearchAgent,
  type ResearchExecutionResult,
  type ResearchProgressEvent,
} from './research-agent';
import {
  writeResearchDocument,
  type WriterProgress,
} from './writer-agent';
import {
  loadResearchAgentConfig,
  loadWriterAgentConfig,
} from './config-loader';
import { loadResearchTemplate } from './template-loader';

// =============================================================================
// Types
// =============================================================================

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  /** Overall pipeline timeout in ms (default: 90000) */
  timeout?: number;

  /** Optional custom research agent config (overrides grove config) */
  researchConfig?: Partial<ResearchAgentConfigPayload>;

  /** Optional custom writer config (overrides grove config) */
  writerConfig?: Partial<WriterAgentConfigPayload>;
}

/**
 * Template provenance for pipeline results
 * Sprint: research-template-wiring-v1
 *
 * DEX Pillar III: Provenance as Infrastructure
 * Records which template shaped the research execution.
 */
export interface PipelineTemplateProvenance {
  /** Template UUID */
  id: string;
  /** Human-readable name */
  name: string;
  /** Template version */
  version: number;
  /** Template source */
  source: 'system-seed' | 'user-created' | 'forked' | 'imported';
}

/**
 * Pipeline execution result
 */
export interface PipelineResult {
  /** Whether the pipeline completed successfully */
  success: boolean;

  /** Generated research document (if writing phase completed) */
  document?: ResearchDocument;

  /** Collected evidence bundle (even on partial failure) */
  evidence?: EvidenceBundle;

  /**
   * S22-WP: Raw research branches with evidence for storage
   * These go directly to ResearchSprout.branches for DocumentViewer display
   */
  branches?: ResearchBranch[];

  /**
   * S22-WP: Aggregated evidence array for storage
   * These go directly to ResearchSprout.evidence for flat access
   */
  rawEvidence?: Evidence[];

  /**
   * Template provenance (Sprint: research-template-wiring-v1)
   * Present when templateId was provided or default was used.
   */
  template?: PipelineTemplateProvenance;

  /** Error details if pipeline failed */
  error?: {
    phase: 'research' | 'writing' | 'timeout';
    message: string;
  };

  /** Execution timing metadata */
  execution: {
    startedAt: string;
    completedAt: string;
    researchDuration: number;
    writingDuration: number;
  };
}

/**
 * Pipeline progress event union type
 * Combines pipeline-level events with forwarded agent events
 */
export type PipelineProgressEvent =
  | { type: 'phase-started'; phase: 'research' | 'writing' }
  | { type: 'phase-completed'; phase: 'research' | 'writing'; duration: number }
  | { type: 'pipeline-complete'; totalDuration: number }
  | { type: 'pipeline-error'; phase: 'research' | 'writing' | 'timeout'; message: string }
  | ResearchProgressEvent
  | WriterProgress;

/**
 * Progress callback type
 */
export type OnPipelineProgressFn = (event: PipelineProgressEvent) => void;

// =============================================================================
// Evidence Adapter
// =============================================================================

/**
 * Convert Research Agent results to EvidenceBundle format
 *
 * The Research Agent returns Evidence[] flat array grouped by branch.
 * The Writer Agent expects EvidenceBundle with BranchEvidence[] structure.
 */
function buildEvidenceBundle(
  sproutId: string,
  researchResult: ResearchExecutionResult
): EvidenceBundle {
  // Convert ResearchBranch[] to BranchEvidence[]
  const branchEvidence: BranchEvidence[] = researchResult.branches.map(branch => {
    // Convert Evidence[] to Source[]
    // S21-RL: Preserve FULL content for web search pass-through mode
    // The writer-agent detects web search evidence by checking content length >3000 chars
    // Truncating here was destroying the full research results from Claude web search
    const sources: Source[] = (branch.evidence || []).map(ev => ({
      url: ev.source,
      title: extractTitleFromEvidence(ev),
      snippet: ev.content, // Full content - writer handles formatting
      accessedAt: ev.collectedAt,
      sourceType: ev.sourceType,
    }));

    // Calculate relevance score as average of evidence relevance
    const avgRelevance = sources.length > 0
      ? (branch.evidence || []).reduce((sum, e) => sum + e.relevance, 0) / sources.length
      : 0;

    return {
      branchQuery: branch.queries[0] || branch.label,
      sources,
      findings: [], // Empty for v1.0 - future: extract findings from evidence
      relevanceScore: avgRelevance,
      status: mapBranchStatus(branch.status),
    };
  });

  // Calculate execution time from result metadata
  const startTime = new Date(researchResult.execution.startedAt).getTime();
  const endTime = new Date(researchResult.execution.completedAt).getTime();
  const executionTime = endTime - startTime;

  return createEvidenceBundle(
    sproutId,
    branchEvidence,
    executionTime,
    researchResult.execution.apiCallCount
  );
}

/**
 * Extract a title from evidence content
 */
function extractTitleFromEvidence(evidence: Evidence): string {
  // Try to extract from URL
  try {
    const url = new URL(evidence.source);
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      // Clean up the last path segment as title
      const lastPart = pathParts[pathParts.length - 1];
      return decodeURIComponent(lastPart)
        .replace(/[-_]/g, ' ')
        .replace(/\.\w+$/, '') // Remove extension
        .slice(0, 100);
    }
  } catch {
    // Invalid URL, fall through
  }

  // Fall back to first line of content
  const firstLine = evidence.content.split('\n')[0];
  return firstLine.slice(0, 100) || 'Untitled Source';
}

/**
 * Map research branch status to evidence bundle status
 */
function mapBranchStatus(
  status: 'pending' | 'active' | 'complete'
): 'pending' | 'complete' | 'failed' | 'budget-exceeded' {
  switch (status) {
    case 'complete':
      return 'complete';
    case 'active':
    case 'pending':
    default:
      return 'pending';
  }
}

// =============================================================================
// Timeout Utility
// =============================================================================

/**
 * Wrap a promise with a timeout
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// =============================================================================
// Main Pipeline Function
// =============================================================================

/**
 * Execute the full research pipeline: Research Agent → Writer Agent
 *
 * @param sprout - The research sprout to process
 * @param config - Optional pipeline configuration
 * @param onProgress - Optional progress callback
 * @returns Pipeline result with document, evidence, or error
 */
export async function executeResearchPipeline(
  sprout: ResearchSprout,
  config?: PipelineConfig,
  onProgress?: OnPipelineProgressFn
): Promise<PipelineResult> {
  const startedAt = new Date().toISOString();
  const timeout = config?.timeout ?? 90000;

  console.log(`[Pipeline] Starting pipeline for sprout: ${sprout.id}`);
  console.log(`[Pipeline] Timeout: ${timeout}ms`);

  // Sprint: research-template-wiring-v1 - Load template for systemPrompt
  const template = loadResearchTemplate(sprout.templateId);
  if (template) {
    console.log(`[Pipeline] Using template: ${template.name} (${template.id})`);
  } else {
    console.log('[Pipeline] No template loaded, using default research behavior');
  }

  // Load configs
  const [researchConfig, writerConfig] = await Promise.all([
    loadResearchAgentConfig(sprout.groveId),
    loadWriterAgentConfig(sprout.groveId),
  ]);

  // Apply config overrides
  const finalResearchConfig = {
    ...researchConfig,
    ...config?.researchConfig,
  };
  const finalWriterConfig = {
    ...writerConfig,
    ...config?.writerConfig,
  };

  let researchDuration = 0;
  let writingDuration = 0;
  let evidenceBundle: EvidenceBundle | undefined;
  let document: ResearchDocument | undefined;
  // S22-WP: Store research results for both success and error returns
  let researchBranches: ResearchBranch[] | undefined;
  let researchEvidence: Evidence[] | undefined;

  try {
    // =========================================================================
    // Phase 1: Research
    // =========================================================================
    onProgress?.({ type: 'phase-started', phase: 'research' });
    const researchStartTime = Date.now();

    console.log('[Pipeline] Starting research phase...');

    // Create agent with config
    // Sprint: research-template-wiring-v1 - Pass template systemPrompt
    const agent = createResearchAgent({
      branchDelay: finalResearchConfig.branchDelay,
      maxApiCalls: finalResearchConfig.maxApiCalls,
      simulationMode: false,
      systemPrompt: template?.systemPrompt,
    });

    // Execute research with timeout
    const researchResult = await withTimeout(
      agent.execute(sprout, (event) => {
        // Forward research agent events
        onProgress?.(event);
      }),
      timeout,
      'Research phase timed out'
    );

    researchDuration = Date.now() - researchStartTime;
    console.log(`[Pipeline] Research phase completed in ${researchDuration}ms`);

    onProgress?.({
      type: 'phase-completed',
      phase: 'research',
      duration: researchDuration,
    });

    // Check for research failure
    if (!researchResult.success) {
      throw new Error(
        researchResult.execution.errorMessage || 'Research agent failed'
      );
    }

    // Build evidence bundle from research result
    evidenceBundle = buildEvidenceBundle(sprout.id, researchResult);
    console.log(`[Pipeline] Evidence bundle created: ${evidenceBundle.totalSources} sources`);

    // S22-WP: Capture raw research data for storage (available in catch block too)
    researchBranches = researchResult.branches;
    researchEvidence = researchResult.evidence;

    // =========================================================================
    // Phase 2: Writing
    // =========================================================================
    onProgress?.({ type: 'phase-started', phase: 'writing' });
    const writingStartTime = Date.now();

    console.log('[Pipeline] Starting writing phase...');

    // Calculate remaining timeout
    const remainingTimeout = timeout - researchDuration;
    if (remainingTimeout <= 0) {
      throw new Error('No time remaining for writing phase');
    }

    // Execute writing with remaining timeout
    document = await withTimeout(
      writeResearchDocument(
        evidenceBundle,
        sprout.spark, // Use the original question for document display (notes already sent to API)
        finalWriterConfig,
        (event) => {
          // Forward writer agent events
          onProgress?.(event);
        }
      ),
      remainingTimeout,
      'Writing phase timed out'
    );

    writingDuration = Date.now() - writingStartTime;
    console.log(`[Pipeline] Writing phase completed in ${writingDuration}ms`);

    onProgress?.({
      type: 'phase-completed',
      phase: 'writing',
      duration: writingDuration,
    });

    // =========================================================================
    // Success
    // =========================================================================
    const completedAt = new Date().toISOString();
    const totalDuration = researchDuration + writingDuration;

    onProgress?.({ type: 'pipeline-complete', totalDuration });

    console.log(`[Pipeline] Pipeline completed successfully in ${totalDuration}ms`);

    // Sprint: research-template-wiring-v1 - Build result with template provenance
    // S22-WP: Include branches and rawEvidence for storage
    const result: PipelineResult = {
      success: true,
      document,
      evidence: evidenceBundle,
      // S22-WP: Raw branches/evidence from research agent for direct storage
      branches: researchBranches,
      rawEvidence: researchEvidence,
      execution: {
        startedAt,
        completedAt,
        researchDuration,
        writingDuration,
      },
    };

    // Add template provenance if template was loaded
    if (template) {
      result.template = {
        id: template.id,
        name: template.name,
        version: template.version,
        source: template.source,
      };
    }

    return result;

  } catch (error) {
    // =========================================================================
    // Error Handling
    // =========================================================================
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTimeout = errorMessage.includes('timed out');
    const isResearchPhase = !evidenceBundle;

    const phase: 'research' | 'writing' | 'timeout' = isTimeout
      ? 'timeout'
      : isResearchPhase
        ? 'research'
        : 'writing';

    console.error(`[Pipeline] Error in ${phase} phase: ${errorMessage}`);

    onProgress?.({
      type: 'pipeline-error',
      phase,
      message: errorMessage,
    });

    const completedAt = new Date().toISOString();

    // Sprint: research-template-wiring-v1 - Include template provenance even on error
    // S22-WP: Include branches/evidence for partial success (research OK, writing failed)
    const errorResult: PipelineResult = {
      success: false,
      document: undefined,
      evidence: evidenceBundle, // Return partial results if available
      // S22-WP: If research succeeded, preserve branches/evidence even if writing failed
      branches: researchBranches,
      rawEvidence: researchEvidence,
      error: {
        phase,
        message: errorMessage,
      },
      execution: {
        startedAt,
        completedAt,
        researchDuration,
        writingDuration,
      },
    };

    // Add template provenance if template was loaded
    if (template) {
      errorResult.template = {
        id: template.id,
        name: template.name,
        version: template.version,
        source: template.source,
      };
    }

    return errorResult;
  }
}

// Types are exported inline with their definitions above
