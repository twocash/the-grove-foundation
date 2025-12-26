// src/core/commands/executor.ts
// Command Executor - Executes parsed commands
// Sprint: terminal-kinetic-commands-v1

import { ParsedCommand, CommandAction, ExecutionResult, CommandDefinition } from './schema';
import { CommandRegistry } from './registry';
import { RESOLVERS } from './resolvers';
import type { ResolverContext } from './resolvers';

export interface ExecutionContext {
  registry: CommandRegistry;
  resolverContext: ResolverContext;
  // Actions will be passed from the hook
  onJourneyStart: (journeyId: string) => void;
  onJourneyClear: () => void;
  onLensSwitch: (lensId: string) => void;
  onLensClear: () => void;
  onShowOverlay: (overlay: string) => void;
  onPlantSprout: (content: string, context: Record<string, unknown>) => void;
  onEmitAnalytics: (event: string, data: Record<string, unknown>) => void;
}

export async function executeCommand(
  parsed: ParsedCommand,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const { registry } = context;

  // Empty command = show palette
  if (!parsed.trigger) {
    context.onShowOverlay('command-palette');
    return { success: true, commandId: 'palette' };
  }

  // Lookup command
  const command = registry.getByTrigger(parsed.trigger);
  if (!command) {
    const suggestions = registry.search(parsed.trigger).map(c => `/${c.trigger}`);
    return {
      success: false,
      commandId: 'unknown',
      error: `Unknown command: /${parsed.trigger}`,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }

  // Determine action (check for subcommand first)
  let action = command.action;
  if (parsed.subcommand && command.subcommands?.[parsed.subcommand]) {
    action = command.subcommands[parsed.subcommand];
  }

  // Resolve arguments
  const resolvedArgs: Record<string, unknown> = {};
  const argValues = parsed.subcommand && command.subcommands?.[parsed.subcommand]
    ? parsed.args.slice(1)  // Skip subcommand
    : parsed.args;

  if (command.args) {
    for (let i = 0; i < command.args.length; i++) {
      const argDef = command.args[i];
      const rawValue = argValues[i];

      if (!rawValue) {
        if (!argDef.optional) {
          // Use fallback if available
          if ('fallback' in action && action.fallback) {
            return executeAction(
              { type: 'show-overlay', overlay: action.fallback.replace('show-', '') },
              {},
              command,
              context
            );
          }
          return {
            success: false,
            commandId: command.id,
            error: `Missing required argument: ${argDef.name}`
          };
        }
        continue;
      }

      const resolver = RESOLVERS[argDef.type];
      const result = resolver.resolve(rawValue, context.resolverContext);

      if (!result.success) {
        return {
          success: false,
          commandId: command.id,
          error: result.error,
          suggestions: result.suggestions
        };
      }

      resolvedArgs[argDef.name] = result.value;
    }
  }

  // Execute action
  return executeAction(action, resolvedArgs, command, context);
}

async function executeAction(
  action: CommandAction,
  args: Record<string, unknown>,
  command: CommandDefinition,
  context: ExecutionContext
): Promise<ExecutionResult> {
  try {
    switch (action.type) {
      case 'journey-start':
        if (args.journeyId) {
          context.onJourneyStart(args.journeyId as string);
        } else {
          context.onShowOverlay('journey-picker');
        }
        break;

      case 'journey-continue':
        // Resume last journey - show picker for now
        context.onShowOverlay('journey-picker');
        break;

      case 'journey-list':
        context.onShowOverlay('journey-picker');
        break;

      case 'journey-clear':
        context.onJourneyClear();
        break;

      case 'lens-switch':
        if (args.lensId) {
          context.onLensSwitch(args.lensId as string);
        } else {
          context.onShowOverlay('lens-picker');
        }
        break;

      case 'lens-clear':
        context.onLensClear();
        break;

      case 'lens-list':
        context.onShowOverlay('lens-picker');
        break;

      case 'plant-sprout':
        context.onPlantSprout(
          (args.content as string) || '',
          { contextCapture: action.contextCapture }
        );
        break;

      case 'show-overlay':
        context.onShowOverlay(action.overlay);
        break;

      case 'show-command-palette':
        context.onShowOverlay('command-palette');
        break;

      case 'show-help':
        context.onShowOverlay('command-palette');
        break;

      case 'set-mode':
        // Future: mode switching
        console.log('[Commands] set-mode not yet implemented:', action.mode);
        break;

      default:
        return {
          success: false,
          commandId: command.id,
          error: `Unknown action type: ${(action as { type: string }).type}`
        };
    }

    // Emit analytics
    context.onEmitAnalytics('command_executed', {
      commandId: command.id,
      trigger: command.trigger,
      args,
      action: action.type
    });

    return { success: true, commandId: command.id, action };
  } catch (error) {
    return {
      success: false,
      commandId: command.id,
      error: error instanceof Error ? error.message : 'Execution failed'
    };
  }
}
