// src/core/commands/schema.ts
// Command System Type Definitions
// Sprint: terminal-kinetic-commands-v1

export type CommandCategory = 'navigation' | 'action' | 'info' | 'system';
export type ArgType = 'string' | 'journey' | 'lens' | 'number' | 'boolean';

export interface CommandArgSchema {
  name: string;
  type: ArgType;
  optional?: boolean;
  default?: unknown;
  description?: string;
}

export type CommandAction =
  | { type: 'journey-start'; fallback?: 'show-journey-picker' }
  | { type: 'journey-continue' }
  | { type: 'journey-list' }
  | { type: 'journey-clear' }
  | { type: 'lens-switch'; fallback?: 'show-lens-picker' }
  | { type: 'lens-clear' }
  | { type: 'lens-list' }
  | { type: 'plant-sprout'; contextCapture?: string[] }
  | { type: 'show-overlay'; overlay: string }
  | { type: 'set-mode'; mode: string }
  | { type: 'show-command-palette' }
  | { type: 'show-help'; commandId?: string };

export interface CommandDefinition {
  id: string;
  trigger: string;
  aliases?: string[];
  description: string;
  category: CommandCategory;
  args?: CommandArgSchema[];
  action: CommandAction;
  subcommands?: Record<string, CommandAction>;
  icon?: string;
  shortcut?: string;
}

export interface ParsedCommand {
  raw: string;
  trigger: string;
  subcommand?: string;
  args: string[];
  flags: Record<string, string | boolean>;
}

export interface ExecutionResult {
  success: boolean;
  commandId: string;
  action?: CommandAction;
  error?: string;
  suggestions?: string[];
}
