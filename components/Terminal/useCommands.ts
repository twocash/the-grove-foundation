// components/Terminal/useCommands.ts
// Hook for integrating the kinetic command system with Terminal
// Sprint: terminal-kinetic-commands-v1

import { useCallback, useMemo } from 'react';
import {
  commandRegistry,
  parseCommand,
  isCommand,
  executeCommand,
  CommandDefinition,
  ExecutionResult
} from '@core/commands';
import type { ExecutionContext, ResolverContext } from '@core/commands';
import type { NarrativeSchemaV2 } from '@core/schema';
import { useEngagementBus } from '../../hooks/useEngagementBus';
import { useSproutCapture } from '../../hooks/useSproutCapture';

export interface UseCommandsOptions {
  schema: NarrativeSchemaV2 | null;
  customLenses: Array<{ id: string; publicLabel: string }>;
  onShowOverlay: (overlay: string) => void;
  onJourneyStart: (journeyId: string) => void;
  onJourneyClear: () => void;
  onLensSwitch: (lensId: string) => void;
  onLensClear: () => void;
  onAddSystemMessage?: (message: string, suggestions?: string[]) => void;
}

export interface UseCommandsReturn {
  registry: typeof commandRegistry;
  execute: (input: string) => Promise<ExecutionResult>;
  executeFromPalette: (command: CommandDefinition, subcommand?: string) => Promise<ExecutionResult>;
  isCommand: typeof isCommand;
  parseCommand: typeof parseCommand;
}

export function useCommands({
  schema,
  customLenses,
  onShowOverlay,
  onJourneyStart,
  onJourneyClear,
  onLensSwitch,
  onLensClear,
  onAddSystemMessage
}: UseCommandsOptions): UseCommandsReturn {
  const { emit } = useEngagementBus();
  const { captureSprout } = useSproutCapture();

  const resolverContext: ResolverContext = useMemo(() => ({
    schema,
    customLenses
  }), [schema, customLenses]);

  const execute = useCallback(async (input: string): Promise<ExecutionResult> => {
    const parsed = parseCommand(input);

    if (!parsed) {
      return { success: false, commandId: 'none', error: 'Not a command' };
    }

    const context: ExecutionContext = {
      registry: commandRegistry,
      resolverContext,
      onJourneyStart,
      onJourneyClear,
      onLensSwitch,
      onLensClear,
      onShowOverlay,
      onPlantSprout: (content, ctx) => {
        // Use the sprout capture hook
        const success = captureSprout?.();
        if (success) {
          console.log('[Commands] Sprout captured successfully');
        } else {
          console.log('[Commands] Sprout capture failed or no response to capture');
        }
      },
      onEmitAnalytics: (event, data) => {
        // Use engagement bus emit
        console.log('[Commands] Analytics:', event, data);
      }
    };

    const result = await executeCommand(parsed, context);

    // Handle errors by showing system message
    if (!result.success && result.error && onAddSystemMessage) {
      onAddSystemMessage(result.error, result.suggestions);
    }

    return result;
  }, [
    resolverContext,
    onShowOverlay,
    onJourneyStart,
    onJourneyClear,
    onLensSwitch,
    onLensClear,
    captureSprout,
    onAddSystemMessage
  ]);

  // Execute a command selected from the palette
  const executeFromPalette = useCallback(async (
    command: CommandDefinition,
    subcommand?: string
  ): Promise<ExecutionResult> => {
    // Build command string and execute
    let cmdStr = `/${command.trigger}`;
    if (subcommand) {
      cmdStr += ` ${subcommand}`;
    }
    return execute(cmdStr);
  }, [execute]);

  return {
    registry: commandRegistry,
    execute,
    executeFromPalette,
    isCommand,
    parseCommand
  };
}
