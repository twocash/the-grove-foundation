// src/bedrock/hooks/useInspectorCopilot.ts
// Hook for using InspectorCopilot with ConsoleSchema
// Sprint: inspector-copilot-v1
//
// This hook provides a clean interface for console components to use
// the InspectorCopilot with their schema-defined configuration.

import { useMemo, useCallback, useState } from 'react';
import type { GroveObject } from '../../core/schema/grove-object';
import type { PatchOperation } from '../types/copilot.types';
import type {
  InspectorCopilotConfig,
  ResolvedCopilotConfig,
  CopilotActionContext,
  CopilotCommandResult,
} from '../types/InspectorCopilotConfig';
import { resolveCopilotConfig } from '../utils/copilot-factory';

// =============================================================================
// Types
// =============================================================================

interface UseInspectorCopilotOptions<T extends GroveObject = GroveObject> {
  /** Console ID for field mapping (e.g., 'prompts', 'feature-flag') */
  consoleId: string;

  /** Optional schema config from ConsoleSchema.inspector.copilot */
  schemaConfig?: InspectorCopilotConfig;

  /** Currently selected object */
  selectedObject?: T | null;

  /** All objects in the collection (for action context) */
  objects?: T[];

  /** Callback to apply patch operations to the selected object */
  onApplyPatch?: (operations: PatchOperation[]) => void;

  /** Optional async action handlers keyed by action ID */
  actionHandlers?: Record<string, (context: CopilotActionContext<T>) => Promise<CopilotCommandResult | null>>;
}

interface UseInspectorCopilotResult<T extends GroveObject = GroveObject> {
  /** Resolved configuration ready for InspectorCopilot component */
  config: ResolvedCopilotConfig;

  /** Props to spread onto InspectorCopilot component */
  copilotProps: {
    consoleId: string;
    config: ResolvedCopilotConfig;
    object: T | null;
    onApplyPatch?: (operations: PatchOperation[]) => void;
    onAction?: (actionId: string, context: CopilotActionContext<T>) => Promise<CopilotCommandResult | null>;
    externalInput?: string;
    onExternalInputConsumed?: () => void;
  };

  /** Inject external input into the copilot */
  injectInput: (input: string) => void;

  /** Check if copilot is enabled */
  isEnabled: boolean;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * useInspectorCopilot - Provides InspectorCopilot integration for console components
 *
 * Usage:
 * ```tsx
 * const { copilotProps, isEnabled } = useInspectorCopilot({
 *   consoleId: 'prompts',
 *   schemaConfig: schema.inspector.copilot,
 *   selectedObject,
 *   onApplyPatch: handlePatch,
 * });
 *
 * return (
 *   <div>
 *     {isEnabled && <InspectorCopilot {...copilotProps} />}
 *   </div>
 * );
 * ```
 */
export function useInspectorCopilot<T extends GroveObject = GroveObject>({
  consoleId,
  schemaConfig,
  selectedObject,
  objects = [],
  onApplyPatch,
  actionHandlers = {},
}: UseInspectorCopilotOptions<T>): UseInspectorCopilotResult<T> {
  // External input state for injection
  const [externalInput, setExternalInput] = useState<string | undefined>();

  // Resolve configuration with factory
  const config = useMemo(() => {
    return resolveCopilotConfig(consoleId, schemaConfig);
  }, [consoleId, schemaConfig]);

  // Action handler wrapper
  const onAction = useCallback(async (
    actionId: string,
    context: CopilotActionContext<T>
  ): Promise<CopilotCommandResult | null> => {
    const handler = actionHandlers[actionId];
    if (handler) {
      return handler(context);
    }
    return null;
  }, [actionHandlers]);

  // Clear external input after consumption
  const onExternalInputConsumed = useCallback(() => {
    setExternalInput(undefined);
  }, []);

  // Inject input into copilot
  const injectInput = useCallback((input: string) => {
    setExternalInput(input);
  }, []);

  // Build props object
  const copilotProps = useMemo(() => ({
    consoleId,
    config,
    object: selectedObject || null,
    onApplyPatch,
    onAction: Object.keys(actionHandlers).length > 0 ? onAction : undefined,
    externalInput,
    onExternalInputConsumed,
  }), [
    consoleId,
    config,
    selectedObject,
    onApplyPatch,
    actionHandlers,
    onAction,
    externalInput,
    onExternalInputConsumed,
  ]);

  return {
    config,
    copilotProps,
    injectInput,
    isEnabled: config.enabled,
  };
}

// =============================================================================
// Convenience Export
// =============================================================================

export default useInspectorCopilot;
