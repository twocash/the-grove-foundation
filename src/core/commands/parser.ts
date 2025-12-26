// src/core/commands/parser.ts
// Command Parser - Converts input string to ParsedCommand
// Sprint: terminal-kinetic-commands-v1

import { ParsedCommand } from './schema';

export function isCommand(input: string): boolean {
  return input.trimStart().startsWith('/');
}

export function parseCommand(input: string): ParsedCommand | null {
  if (!isCommand(input)) return null;

  const trimmed = input.trimStart().slice(1).trim();
  if (!trimmed) {
    return { raw: input, trigger: '', args: [], flags: {} };
  }

  const tokens = tokenize(trimmed);
  const trigger = tokens[0].toLowerCase();
  const remaining = tokens.slice(1);

  const flags: Record<string, string | boolean> = {};
  const args: string[] = [];

  for (const token of remaining) {
    if (token.startsWith('--')) {
      const eqIndex = token.indexOf('=');
      if (eqIndex > 0) {
        const key = token.slice(2, eqIndex);
        const value = token.slice(eqIndex + 1);
        flags[key] = value;
      } else {
        flags[token.slice(2)] = true;
      }
    } else {
      args.push(token);
    }
  }

  // First arg might be a subcommand
  const subcommand = args.length > 0 ? args[0] : undefined;

  return { raw: input, trigger, subcommand, args, flags };
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = '';
    } else if (char === ' ' && !inQuotes) {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) tokens.push(current);
  return tokens;
}
