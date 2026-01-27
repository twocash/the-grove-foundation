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
// S22-WP: Import CanonicalResearch for lossless structured output
import type { CanonicalResearch } from '@core/schema/sprout';

import {
  createResearchAgent,
  type ResearchExecutionResult,
  type ResearchProgressEvent,
} from './research-agent';
// S22-WP: Writer imports removed - Writer is now user-triggered from right panel
// import { writeResearchDocument, type WriterProgress } from './writer-agent';
import type { WriterProgress } from './writer-agent';
import {
  loadResearchAgentConfig,
  // S22-WP: Writer config loading removed - Writer is user-triggered
  // loadWriterAgentConfig,
} from './config-loader';
import { loadResearchTemplate } from './template-loader';

// =============================================================================
// Types
// =============================================================================

// S22-WP: Timeout constants
// Research fidelity is priority - allow sufficient time for thorough research
const DEFAULT_PIPELINE_TIMEOUT = 300000; // 5 minutes - research only (Writer is user-triggered)

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  /** Overall pipeline timeout in ms (default: 180000 = 3 minutes) */
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
   * S22-WP: Canonical research output from structured API
   * 100% lossless - exactly what the provider returned.
   * Single source of truth for full-fidelity research display.
   * Atomic components (sections, sources, findings) enable exploration.
   */
  canonicalResearch?: CanonicalResearch;

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
  const timeout = config?.timeout ?? DEFAULT_PIPELINE_TIMEOUT;

  console.log(`[Pipeline] Starting pipeline for sprout: ${sprout.id}`);
  console.log(`[Pipeline] Timeout: ${timeout}ms`);
  // S22-WP: TRACE - Log sprout.templateId BEFORE loading template
  console.log(`[Pipeline] sprout.templateId = "${sprout.templateId ?? 'undefined'}"`);

  // Sprint: research-template-wiring-v1 - Load template for systemPrompt
  const template = loadResearchTemplate(sprout.templateId);
  if (template) {
    console.log(`[Pipeline] Using template: ${template.name} (${template.id})`);
  } else {
    console.log('[Pipeline] No template loaded, using default research behavior');
  }

  // Load research config only - Writer config loaded when user triggers writing
  const researchConfig = await loadResearchAgentConfig(sprout.groveId);

  // Apply config overrides
  const finalResearchConfig = {
    ...researchConfig,
    ...config?.researchConfig,
  };
  // S22-WP: Writer config removed - user triggers Writer from right panel

  let researchDuration = 0;
  let evidenceBundle: EvidenceBundle | undefined;
  // S22-WP: Store research results for both success and error returns
  // (document removed - Writer is user-triggered, not automatic)
  let researchBranches: ResearchBranch[] | undefined;
  let researchEvidence: Evidence[] | undefined;
  // S22-WP: 100% lossless canonical research from structured API
  let canonicalResearch: CanonicalResearch | undefined;

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
    // S22-WP: Capture 100% lossless canonical research from structured API
    canonicalResearch = researchResult.canonicalResearch;

    // =========================================================================
    // S22-WP: Research Complete - Return Evidence Only
    // =========================================================================
    // Phase 2 (Writing) has been REMOVED per S22-WP plan.
    // The Writer Agent is now USER-TRIGGERED from the right panel,
    // NOT automatically chained after research.
    //
    // The pipeline returns:
    // - evidence: Full EvidenceBundle for json-render display
    // - branches: Raw ResearchBranch[] for storage
    // - rawEvidence: Flat Evidence[] for storage
    //
    // NO document is generated here. The user selects a Writer template
    // in the right panel and explicitly triggers document generation.
    // =========================================================================

    const completedAt = new Date().toISOString();
    const totalDuration = researchDuration;

    onProgress?.({ type: 'pipeline-complete', totalDuration });

    console.log(`[Pipeline] Research completed successfully in ${totalDuration}ms`);
    console.log(`[Pipeline] Evidence bundle: ${evidenceBundle.totalSources} sources`);
    console.log(`[Pipeline] S22-WP: Returning evidence-only (NO automatic Writer)`);

    // S23-SFR DEBUG: Log canonical research BEFORE building result
    console.log(`[Pipeline] Canonical research BEFORE result build:`, {
      hasCanonical: !!canonicalResearch,
      title: canonicalResearch?.title?.slice(0, 50),
      sectionsCount: canonicalResearch?.sections?.length || 0,
      sourcesCount: canonicalResearch?.sources?.length || 0,
      findingsCount: canonicalResearch?.key_findings?.length || 0,
      execSummaryLength: canonicalResearch?.executive_summary?.length || 0,
    });

    // S22-WP: Return evidence-only result - NO document
    // Document generation is now user-triggered from the right panel
    const result: PipelineResult = {
      success: true,
      // document: undefined - Writer is user-triggered, not automatic
      evidence: evidenceBundle,
      // S22-WP: Raw branches/evidence from research agent for direct storage
      branches: researchBranches,
      rawEvidence: researchEvidence,
      // S22-WP: 100% lossless canonical research for full-fidelity display
      canonicalResearch,
      execution: {
        startedAt,
        completedAt,
        researchDuration,
        writingDuration: 0, // No writing phase - user triggers Writer separately
      },
    };

    // S23-SFR DEBUG: Log canonical research AFTER result build
    console.log(`[Pipeline] Canonical research AFTER result build:`, {
      hasCanonical: !!result.canonicalResearch,
      title: result.canonicalResearch?.title?.slice(0, 50),
      sectionsCount: result.canonicalResearch?.sections?.length || 0,
      sourcesCount: result.canonicalResearch?.sources?.length || 0,
    });

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
    // S22-WP: Include branches/evidence/canonicalResearch for partial success
    const errorResult: PipelineResult = {
      success: false,
      // document: undefined - Writer is user-triggered
      evidence: evidenceBundle, // Return partial results if available
      branches: researchBranches,
      rawEvidence: researchEvidence,
      // S22-WP: Include canonical research even on partial failure
      canonicalResearch,
      error: {
        phase,
        message: errorMessage,
      },
      execution: {
        startedAt,
        completedAt,
        researchDuration,
        writingDuration: 0, // Writing is user-triggered
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
