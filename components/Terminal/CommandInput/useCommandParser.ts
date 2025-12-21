// useCommandParser - Parse and execute Terminal slash commands
// Sprint v0.16: Command Palette feature

import { useState, useCallback, useMemo } from 'react';
import { commandRegistry, Command, CommandContext, CommandResult } from './CommandRegistry';

interface ParseResult {
  isCommand: boolean;
  commandId: string | null;
  args: string | null;
}

interface UseCommandParserReturn {
  parseInput: (input: string) => ParseResult;
  getSuggestions: (input: string) => Command[];
  executeCommand: (commandId: string, context: CommandContext, args?: string) => CommandResult | null;
  allCommands: Command[];
}

function parseInput(input: string): ParseResult {
  const trimmed = input.trim();

  // Check if input starts with /
  if (!trimmed.startsWith('/')) {
    return { isCommand: false, commandId: null, args: null };
  }

  // Extract command and args
  const withoutSlash = trimmed.slice(1);
  const spaceIndex = withoutSlash.indexOf(' ');

  if (spaceIndex === -1) {
    // No args, just the command
    return {
      isCommand: true,
      commandId: withoutSlash.toLowerCase(),
      args: null
    };
  }

  // Has args
  const commandId = withoutSlash.slice(0, spaceIndex).toLowerCase();
  const args = withoutSlash.slice(spaceIndex + 1).trim();

  return {
    isCommand: true,
    commandId,
    args: args || null
  };
}

function getSuggestions(input: string): Command[] {
  const trimmed = input.trim();

  // Only show suggestions when input starts with /
  if (!trimmed.startsWith('/')) {
    return [];
  }

  const query = trimmed.slice(1); // Remove the /

  // If just "/", show all commands
  if (query === '') {
    return commandRegistry.getAll();
  }

  // Check if there's a space (means command is complete, user typing args)
  if (query.includes(' ')) {
    return []; // Don't show suggestions when typing args
  }

  // Search for matching commands
  return commandRegistry.search(query);
}

function executeCommand(
  commandId: string,
  context: CommandContext,
  args?: string
): CommandResult | null {
  const command = commandRegistry.get(commandId);

  if (!command) {
    return { type: 'error', message: `Unknown command: /${commandId}` };
  }

  return command.execute(context, args);
}

export function useCommandParser(): UseCommandParserReturn {
  const allCommands = useMemo(() => commandRegistry.getAll(), []);

  const parseInputMemo = useCallback((input: string) => parseInput(input), []);
  const getSuggestionsMemo = useCallback((input: string) => getSuggestions(input), []);
  const executeCommandMemo = useCallback(
    (commandId: string, context: CommandContext, args?: string) =>
      executeCommand(commandId, context, args),
    []
  );

  return {
    parseInput: parseInputMemo,
    getSuggestions: getSuggestionsMemo,
    executeCommand: executeCommandMemo,
    allCommands
  };
}

export default useCommandParser;
