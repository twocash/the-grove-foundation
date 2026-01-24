// src/explore/services/prompt-architect-pipeline.ts
// Prompt Architect inference pipeline
// Sprint: sprout-research-v1, Phase 3c
//
// Orchestrates the full intake flow:
// 1. Parse command → 2. Load config → 3. Run inference → 4. Evaluate gates
// Returns a result that tells the UI what to do next.

import type { PromptArchitectConfigPayload } from '@core/schema/prompt-architect-config';
import type { ResearchStrategy, ResearchBranch } from '@core/schema/research-strategy';
import type { GateDecision } from '@core/schema/quality-gate';
import type { GroveConfigSnapshot } from '@core/schema/research-sprout';

import {
  parseSproutCommand,
  validateSpark,
  type SproutCommandResult,
} from './sprout-command-parser';

import {
  loadPromptArchitectConfig,
  type ConfigLoadResult,
} from './prompt-architect-config-loader';

import {
  applyInferenceRules,
  shouldShowConfirmation,
  summarizeInference,
  type InferenceOutput,
} from './inference-engine';

import {
  evaluateIntakeGates,
  type GateEvaluationResult,
} from './quality-gate-evaluator';

// =============================================================================
// Types
// =============================================================================

/**
 * Result of the Prompt Architect intake pipeline
 */
export interface PromptArchitectResult {
  /** Whether the pipeline succeeded */
  success: boolean;

  /** Type of action the UI should take */
  action:
    | 'show-confirmation'   // Show confirmation dialog with inferred manifest
    | 'create-sprout'       // Skip confirmation, create sprout directly
    | 'show-error'          // Show error message to user
    | 'passthrough';        // Not a sprout command, pass through to chat

  /** The parsed command (if any) */
  command: SproutCommandResult;

  /** Error message (if action is 'show-error') */
  error?: string;

  /** Inferred manifest data (if action is 'show-confirmation' or 'create-sprout') */
  manifest?: InferredManifest;

  /** Gate evaluation result (if gates were checked) */
  gateResult?: GateEvaluationResult;

  /** Human-readable summary of what was inferred */
  summary?: string;
}

/**
 * Inferred manifest data ready for sprout creation
 */
export interface InferredManifest {
  /** Original spark (verbatim) */
  spark: string;

  /** Auto-generated title */
  title: string;

  /** Inferred research strategy */
  strategy: ResearchStrategy;

  /** Inferred research branches */
  branches: ResearchBranch[];

  /** IDs of inference rules that fired */
  appliedRuleIds: string[];

  /** Inference confidence (0-1) */
  confidence: number;

  /** Grove config snapshot for provenance */
  groveConfigSnapshot: GroveConfigSnapshot;

  /** Config version ID for tracking */
  configVersionId: string | null;
}

/**
 * Options for the pipeline
 */
export interface PipelineOptions {
  /** Grove ID (required for config loading) */
  groveId: string;

  /** Session ID for tracking */
  sessionId: string;

  /** Skip cache for config loading */
  skipConfigCache?: boolean;

  /** Force show confirmation even if confidence is high */
  forceConfirmation?: boolean;
}

// =============================================================================
// Pipeline
// =============================================================================

/**
 * Run the Prompt Architect intake pipeline
 *
 * @param input - Raw user input
 * @param options - Pipeline options
 * @returns Result telling UI what action to take
 *
 * @example
 * const result = await runPromptArchitectPipeline(
 *   'sprout: What causes the ratchet effect in AI?',
 *   { groveId: 'grove-123', sessionId: 'session-abc' }
 * );
 *
 * switch (result.action) {
 *   case 'show-confirmation':
 *     openConfirmationDialog(result.manifest);
 *     break;
 *   case 'create-sprout':
 *     createSprout(result.manifest);
 *     break;
 *   case 'show-error':
 *     showError(result.error);
 *     break;
 *   case 'passthrough':
 *     sendToChat(input);
 *     break;
 * }
 */
export async function runPromptArchitectPipeline(
  input: string,
  options: PipelineOptions
): Promise<PromptArchitectResult> {
  // Step 1: Parse command
  const command = parseSproutCommand(input);

  // Not a sprout command - passthrough to chat
  if (!command.isCommand || command.variant !== 'research') {
    return {
      success: true,
      action: 'passthrough',
      command,
    };
  }

  // Step 2: Validate spark
  const validation = validateSpark(command.spark);
  if (!validation.valid) {
    return {
      success: false,
      action: 'show-error',
      command,
      error: validation.error,
    };
  }

  // Step 3: Load grove config
  let configResult: ConfigLoadResult;
  try {
    configResult = await loadPromptArchitectConfig(options.groveId, {
      skipCache: options.skipConfigCache,
    });
  } catch (error) {
    return {
      success: false,
      action: 'show-error',
      command,
      error: 'Failed to load grove configuration. Please try again.',
    };
  }

  const config = configResult.config;

  // Step 4: Run inference
  const inference = applyInferenceRules(command.spark, config);

  // Step 5: Evaluate intake gates
  const gateResult = evaluateIntakeGates(
    {
      spark: command.spark,
      inferenceConfidence: inference.confidence,
      hypothesisGoals: config.hypothesisGoals,
      branches: inference.branches.map(b => ({ id: b.id, label: b.label })),
    },
    config.qualityGates
  );

  // Gate blocked - show error with suggestion
  if (!gateResult.passed) {
    return {
      success: false,
      action: 'show-error',
      command,
      error: gateResult.suggestion ?? 'Research request did not pass intake gates.',
      gateResult,
    };
  }

  // Step 6: Build inferred manifest
  const manifest = buildInferredManifest(
    command.spark,
    config,
    configResult,
    inference
  );

  const summary = summarizeInference(inference);

  // Step 7: Decide confirmation vs direct creation
  const needsConfirmation =
    options.forceConfirmation ||
    shouldShowConfirmation(inference, config);

  return {
    success: true,
    action: needsConfirmation ? 'show-confirmation' : 'create-sprout',
    command,
    manifest,
    gateResult,
    summary,
  };
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Build the inferred manifest from pipeline results
 */
function buildInferredManifest(
  spark: string,
  config: PromptArchitectConfigPayload,
  configResult: ConfigLoadResult,
  inference: InferenceOutput
): InferredManifest {
  // Convert BranchTemplates to ResearchBranches
  let branches: ResearchBranch[] = inference.branches.map(template => ({
    id: template.id,
    label: template.label,
    queries: template.queries,
    priority: template.priority,
    status: 'pending',
  }));

  // Sprint: research-template-wiring-v1
  // If no branches were inferred and no default branches exist,
  // generate a fallback "main" branch from the user's spark.
  // This ensures research always has at least one branch to process.
  if (branches.length === 0) {
    // First, try to use config's defaultBranches
    if (config.defaultBranches && config.defaultBranches.length > 0) {
      branches = config.defaultBranches.map(template => ({
        id: template.id,
        label: template.label,
        queries: template.queries,
        priority: template.priority,
        status: 'pending',
      }));
      console.log('[PromptArchitect] Using default branches from config:', branches.length);
    } else {
      // Generate a single "main" branch from the spark
      const mainBranch: ResearchBranch = {
        id: `branch-main-${Date.now()}`,
        label: 'Main Research',
        queries: [spark], // Use the spark itself as the research query
        priority: 'primary',
        status: 'pending',
      };
      branches = [mainBranch];
      console.log('[PromptArchitect] Generated fallback main branch from spark');
    }
  }

  // Use inferred strategy or fall back to config default
  const strategy: ResearchStrategy = inference.depth
    ? {
        ...config.defaultStrategy,
        depth: inference.depth,
      }
    : config.defaultStrategy;

  // Build grove config snapshot for provenance
  const groveConfigSnapshot: GroveConfigSnapshot = {
    configVersionId: configResult.versionId ?? 'default',
    hypothesisGoals: config.hypothesisGoals,
    corpusBoundaries: config.corpusBoundaries,
    confirmationMode: config.confirmationMode,
  };

  return {
    spark,
    title: generateTitle(spark),
    strategy,
    branches,
    appliedRuleIds: inference.appliedRuleIds,
    confidence: inference.confidence,
    groveConfigSnapshot,
    configVersionId: configResult.versionId,
  };
}

/**
 * Generate a title from the spark
 */
function generateTitle(spark: string): string {
  const maxLen = 50;
  if (spark.length <= maxLen) return spark;

  const truncated = spark.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');

  return lastSpace > 20
    ? truncated.slice(0, lastSpace) + '...'
    : truncated + '...';
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Quick check if input should trigger the Prompt Architect
 * Use this for fast filtering before running the full pipeline
 */
export function shouldTriggerPromptArchitect(input: string): boolean {
  const command = parseSproutCommand(input);
  return command.isCommand && command.variant === 'research';
}

/**
 * Get a preview of what would be inferred (for autocomplete/hints)
 */
export async function previewInference(
  spark: string,
  groveId: string
): Promise<{ branches: string[]; confidence: number } | null> {
  if (!spark || spark.length < 10) return null;

  try {
    const { config } = await loadPromptArchitectConfig(groveId);
    const inference = applyInferenceRules(spark, config);

    if (inference.branches.length === 0 && inference.confidence === 0) {
      return null;
    }

    return {
      branches: inference.branches.map(b => b.label),
      confidence: inference.confidence,
    };
  } catch {
    return null;
  }
}
