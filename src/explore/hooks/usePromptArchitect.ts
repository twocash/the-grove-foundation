// src/explore/hooks/usePromptArchitect.ts
// React hook for Prompt Architect confirmation flow
// Sprint: sprout-research-v1, Phase 3d
//
// Manages the confirmation dialog state and sprout creation flow.
// This is the React-side orchestration of the pipeline.

import { useState, useCallback, useMemo } from 'react';
import type { ResearchBranch, ResearchStrategy } from '@core/schema/research-strategy';
import type { CreateResearchSproutInput } from '@core/schema/research-sprout';
import {
  runPromptArchitectPipeline,
  shouldTriggerPromptArchitect,
  type PromptArchitectResult,
  type InferredManifest,
  type PipelineOptions,
} from '../services/prompt-architect-pipeline';
// S22-WP: Import template loader to get default templateId for sprout creation
import { loadDefaultTemplate } from '../services/template-loader';

// =============================================================================
// Types
// =============================================================================

/**
 * State of the Prompt Architect flow
 */
export type PromptArchitectState =
  | 'idle'          // No active flow
  | 'processing'    // Running pipeline
  | 'confirming'    // Showing confirmation dialog
  | 'creating'      // Creating sprout
  | 'error';        // Error state

/**
 * Editable manifest for user modifications
 */
export interface EditableManifest {
  /** Original spark (read-only) */
  spark: string;

  /** Editable title */
  title: string;

  /** Editable branches (can add/remove/reorder) */
  branches: ResearchBranch[];

  /** Editable strategy */
  strategy: ResearchStrategy;

  /** User's optional notes */
  notes: string;

  /** User's optional tags */
  tags: string[];

  /**
   * Output template ID for research execution.
   * Sprint: research-template-wiring-v1
   * Links to output_templates table for provenance tracking.
   */
  templateId?: string;
}

/**
 * Hook return value
 */
export interface UsePromptArchitectReturn {
  // State
  /** Current state of the flow */
  state: PromptArchitectState;

  /** Error message (if state is 'error') */
  error: string | null;

  /** The inferred manifest (if state is 'confirming') */
  manifest: EditableManifest | null;

  /** Pipeline result metadata */
  pipelineResult: PromptArchitectResult | null;

  /** Human-readable summary of inference */
  summary: string | null;

  // Actions
  /** Process user input through the pipeline */
  processInput: (input: string) => Promise<PromptArchitectResult>;

  /** Quick check if input should trigger pipeline */
  shouldProcess: (input: string) => boolean;

  /** Update the manifest during confirmation */
  updateManifest: (updates: Partial<EditableManifest>) => void;

  /** Add a branch to the manifest */
  addBranch: (branch: ResearchBranch) => void;

  /** Remove a branch from the manifest */
  removeBranch: (branchId: string) => void;

  /** Confirm and create the sprout */
  confirm: () => Promise<CreateResearchSproutInput | null>;

  /** Cancel the flow */
  cancel: () => void;

  /** Reset error state */
  clearError: () => void;
}

/**
 * Hook options
 */
export interface UsePromptArchitectOptions {
  /** Grove ID (required) */
  groveId: string;

  /** Session ID for tracking */
  sessionId: string;

  /** Creator user ID (optional) */
  creatorId?: string;

  /** Callback when sprout is ready to create */
  onSproutReady?: (input: CreateResearchSproutInput) => Promise<void>;

  /** Callback on error */
  onError?: (error: string) => void;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for managing the Prompt Architect confirmation flow
 *
 * @example
 * const {
 *   state,
 *   manifest,
 *   processInput,
 *   confirm,
 *   cancel,
 * } = usePromptArchitect({
 *   groveId: 'grove-123',
 *   sessionId: 'session-abc',
 *   onSproutReady: async (input) => {
 *     await createSprout(input);
 *   },
 * });
 *
 * // In handleSubmit:
 * const result = await processInput(userInput);
 * if (result.action === 'show-confirmation') {
 *   // Dialog will open automatically via state change
 * }
 */
export function usePromptArchitect(
  options: UsePromptArchitectOptions
): UsePromptArchitectReturn {
  const { groveId, sessionId, creatorId, onSproutReady, onError } = options;

  // State
  const [state, setState] = useState<PromptArchitectState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [manifest, setManifest] = useState<EditableManifest | null>(null);
  const [pipelineResult, setPipelineResult] = useState<PromptArchitectResult | null>(null);
  const [originalManifest, setOriginalManifest] = useState<InferredManifest | null>(null);

  // Quick check for input
  const shouldProcess = useCallback((input: string): boolean => {
    return shouldTriggerPromptArchitect(input);
  }, []);

  // Process input through pipeline
  const processInput = useCallback(async (input: string): Promise<PromptArchitectResult> => {
    setState('processing');
    setError(null);

    const pipelineOptions: PipelineOptions = {
      groveId,
      sessionId,
    };

    try {
      const result = await runPromptArchitectPipeline(input, pipelineOptions);
      setPipelineResult(result);

      switch (result.action) {
        case 'show-confirmation':
          if (result.manifest) {
            setOriginalManifest(result.manifest);
            setManifest(createEditableManifest(result.manifest));
            setState('confirming');
          }
          break;

        case 'create-sprout':
          // Direct creation (high confidence, no confirmation needed)
          if (result.manifest) {
            setOriginalManifest(result.manifest);
            setManifest(createEditableManifest(result.manifest));
            // Auto-confirm
            setState('creating');
            // S22-WP: CRITICAL - must include default templateId for auto-confirm path
            // Without this, sprouts created via auto-confirm have no template
            const defaultTemplate = loadDefaultTemplate('research');
            const sproutInput = buildSproutInput(
              result.manifest,
              { notes: '', tags: [], templateId: defaultTemplate?.id },
              groveId,
              sessionId,
              creatorId
            );
            if (onSproutReady) {
              await onSproutReady(sproutInput);
            }
            setState('idle');
          }
          break;

        case 'show-error':
          setError(result.error ?? 'An error occurred');
          setState('error');
          if (onError) {
            onError(result.error ?? 'An error occurred');
          }
          break;

        case 'passthrough':
          setState('idle');
          break;
      }

      return result;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Pipeline failed';
      setError(errorMessage);
      setState('error');
      if (onError) {
        onError(errorMessage);
      }

      return {
        success: false,
        action: 'show-error',
        command: { isCommand: false, spark: '', rawInput: input, variant: 'none' },
        error: errorMessage,
      };
    }
  }, [groveId, sessionId, creatorId, onSproutReady, onError]);

  // Update manifest during confirmation
  const updateManifest = useCallback((updates: Partial<EditableManifest>) => {
    setManifest(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // Add a branch
  const addBranch = useCallback((branch: ResearchBranch) => {
    setManifest(prev => {
      if (!prev) return null;
      return {
        ...prev,
        branches: [...prev.branches, branch],
      };
    });
  }, []);

  // Remove a branch
  const removeBranch = useCallback((branchId: string) => {
    setManifest(prev => {
      if (!prev) return null;
      return {
        ...prev,
        branches: prev.branches.filter(b => b.id !== branchId),
      };
    });
  }, []);

  // Confirm and create
  const confirm = useCallback(async (): Promise<CreateResearchSproutInput | null> => {
    if (!manifest || !originalManifest) {
      return null;
    }

    setState('creating');

    try {
      const sproutInput = buildSproutInput(
        originalManifest,
        manifest,
        groveId,
        sessionId,
        creatorId
      );

      if (onSproutReady) {
        await onSproutReady(sproutInput);
      }

      // Reset state
      setState('idle');
      setManifest(null);
      setOriginalManifest(null);
      setPipelineResult(null);

      return sproutInput;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to create sprout';
      setError(errorMessage);
      setState('error');
      if (onError) {
        onError(errorMessage);
      }
      return null;
    }
  }, [manifest, originalManifest, groveId, sessionId, creatorId, onSproutReady, onError]);

  // Cancel
  const cancel = useCallback(() => {
    setState('idle');
    setManifest(null);
    setOriginalManifest(null);
    setPipelineResult(null);
    setError(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    if (state === 'error') {
      setState('idle');
    }
  }, [state]);

  // Summary
  const summary = useMemo(() => {
    return pipelineResult?.summary ?? null;
  }, [pipelineResult]);

  return {
    state,
    error,
    manifest,
    pipelineResult,
    summary,
    processInput,
    shouldProcess,
    updateManifest,
    addBranch,
    removeBranch,
    confirm,
    cancel,
    clearError,
  };
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Create an editable manifest from the inferred manifest
 */
function createEditableManifest(inferred: InferredManifest): EditableManifest {
  // S22-WP: Initialize with default research template - CRITICAL for template dropdown to work
  // The templateId MUST be set here so it's available when sprout is created
  const defaultTemplate = loadDefaultTemplate('research');
  return {
    spark: inferred.spark,
    title: inferred.title,
    branches: [...inferred.branches],
    strategy: { ...inferred.strategy },
    notes: '',
    tags: [],
    // S22-WP: Set default templateId - user can override via dropdown in confirmation dialog
    templateId: defaultTemplate?.id,
  };
}

/**
 * Build the CreateResearchSproutInput from manifest data
 *
 * Sprint: research-template-wiring-v1
 * Added templateId pass-through for research style selection.
 */
function buildSproutInput(
  original: InferredManifest,
  edited: Pick<EditableManifest, 'notes' | 'tags'> & Partial<EditableManifest>,
  groveId: string,
  sessionId: string,
  creatorId?: string
): CreateResearchSproutInput {
  // S22-WP: CRITICAL - Ensure branches is NEVER undefined
  // Use edited branches if available, fall back to original, create fallback if both empty
  const branches = (edited.branches && edited.branches.length > 0)
    ? edited.branches
    : (original.branches && original.branches.length > 0)
      ? original.branches
      : [{
          id: `main-${Date.now()}`,
          label: 'Main Research',
          queries: [original.spark],
          status: 'pending' as const,
          priority: 1 as const,
          evidence: [],
        }];

  if (!edited.branches?.length && !original.branches?.length) {
    console.warn(`[buildSproutInput] ⚠️ No branches from manifest, using fallback for: "${original.spark.slice(0, 50)}..."`);
  }

  return {
    spark: original.spark,
    groveId,
    strategy: edited.strategy ?? original.strategy,
    branches,
    appliedRuleIds: original.appliedRuleIds,
    inferenceConfidence: original.confidence,
    groveConfigSnapshot: original.groveConfigSnapshot,
    architectSessionId: null, // TODO: Generate session ID for dialogue tracking
    creatorId,
    sessionId,
    tags: edited.tags,
    notes: edited.notes || undefined,
    // Sprint: research-template-wiring-v1 - Pass template selection to sprout
    templateId: edited.templateId,
  };
}

// =============================================================================
// Exports
// =============================================================================

export type {
  EditableManifest,
  UsePromptArchitectOptions,
};
