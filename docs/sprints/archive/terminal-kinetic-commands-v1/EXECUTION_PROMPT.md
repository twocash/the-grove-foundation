# Execution Prompt: Terminal Kinetic Command System

**Sprint:** terminal-kinetic-commands-v1  
**Target Agent:** Claude CLI (Execution Mode)  
**Repository:** C:\GitHub\the-grove-foundation

---

## Mission

Implement the **Kinetic Command System**—a declarative, registry-based architecture for processing slash commands in the Terminal. This transforms the Terminal into a kinetic interface where users navigate journeys, switch lenses, capture insights, and access features through intuitive `/` commands.

---

## Pre-Execution Verification

Before starting, verify:

```bash
cd C:\GitHub\the-grove-foundation
git status  # Should be clean or have only doc changes
npm run build  # Should pass
```

Verify sprint 6 completion (overlay system):
- `components/Terminal/types.ts` has `TerminalOverlay` discriminated union
- `components/Terminal/overlay-registry.ts` exists
- `components/Terminal/TerminalOverlayRenderer.tsx` exists

---

## Implementation Steps

### Epic 1: Type Foundation

#### Step 1.1: Create Command Schema Types

**File:** `src/core/commands/schema.ts`

```typescript
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
```

#### Step 1.2: Create Command Definitions JSON

**File:** `src/core/commands/command-definitions.ts`

```typescript
// Declarative Command Registry
// Sprint: terminal-kinetic-commands-v1

import { CommandDefinition } from './schema';

export const COMMAND_DEFINITIONS: CommandDefinition[] = [
  {
    id: 'journey-start',
    trigger: 'journey',
    aliases: ['j'],
    description: 'Start or continue a guided journey',
    category: 'navigation',
    args: [
      { name: 'journeyId', type: 'journey', optional: true }
    ],
    action: { type: 'journey-start', fallback: 'show-journey-picker' },
    subcommands: {
      list: { type: 'show-overlay', overlay: 'journey-picker' },
      continue: { type: 'journey-continue' }
    },
    icon: 'Compass'
  },
  {
    id: 'lens-switch',
    trigger: 'lens',
    aliases: ['l'],
    description: 'Switch your perspective lens',
    category: 'navigation',
    args: [
      { name: 'lensId', type: 'lens', optional: true }
    ],
    action: { type: 'lens-switch', fallback: 'show-lens-picker' },
    subcommands: {
      list: { type: 'show-overlay', overlay: 'lens-picker' },
      clear: { type: 'lens-clear' }
    },
    icon: 'Glasses'
  },
  {
    id: 'plant-sprout',
    trigger: 'plant',
    aliases: ['p', 'sprout'],
    description: 'Capture an insight as a sprout',
    category: 'action',
    args: [
      { name: 'content', type: 'string', optional: true }
    ],
    action: { type: 'plant-sprout', contextCapture: ['lastResponse', 'activeLens', 'activeJourney'] },
    icon: 'Sprout'
  },
  {
    id: 'show-stats',
    trigger: 'stats',
    description: 'View your session statistics',
    category: 'info',
    action: { type: 'show-overlay', overlay: 'stats' },
    icon: 'BarChart3'
  },
  {
    id: 'explore-mode',
    trigger: 'explore',
    aliases: ['e'],
    description: 'Enter free exploration mode',
    category: 'navigation',
    action: { type: 'journey-clear' } as CommandAction,
    icon: 'Telescope'
  },
  {
    id: 'help',
    trigger: 'help',
    aliases: ['?', 'commands'],
    description: 'Show available commands',
    category: 'system',
    args: [
      { name: 'commandId', type: 'string', optional: true }
    ],
    action: { type: 'show-command-palette' },
    icon: 'HelpCircle',
    shortcut: 'Ctrl+K'
  }
];
```

#### Step 1.3: Create CommandRegistry Class

**File:** `src/core/commands/registry.ts`

```typescript
// Command Registry - Canonical Source for Commands
// Sprint: terminal-kinetic-commands-v1

import { CommandDefinition, CommandCategory } from './schema';
import { COMMAND_DEFINITIONS } from './command-definitions';

export class CommandRegistry {
  private commands: Map<string, CommandDefinition>;
  private triggerIndex: Map<string, string>;

  constructor(definitions: CommandDefinition[] = COMMAND_DEFINITIONS) {
    this.commands = new Map();
    this.triggerIndex = new Map();

    for (const def of definitions) {
      this.commands.set(def.id, def);
      this.triggerIndex.set(def.trigger.toLowerCase(), def.id);
      def.aliases?.forEach(alias => 
        this.triggerIndex.set(alias.toLowerCase(), def.id)
      );
    }
  }

  getByTrigger(trigger: string): CommandDefinition | undefined {
    const id = this.triggerIndex.get(trigger.toLowerCase());
    return id ? this.commands.get(id) : undefined;
  }

  getById(id: string): CommandDefinition | undefined {
    return this.commands.get(id);
  }

  getAll(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  getByCategory(category: CommandCategory): CommandDefinition[] {
    return this.getAll().filter(cmd => cmd.category === category);
  }

  search(query: string): CommandDefinition[] {
    if (!query) return this.getAll();
    const q = query.toLowerCase();
    return this.getAll().filter(cmd =>
      cmd.trigger.toLowerCase().includes(q) ||
      cmd.aliases?.some(a => a.toLowerCase().includes(q)) ||
      cmd.description.toLowerCase().includes(q)
    );
  }

  getAllTriggers(): string[] {
    return Array.from(this.triggerIndex.keys());
  }
}

// Singleton instance
export const commandRegistry = new CommandRegistry();
```

**Build Gate:** Run `npm run build` - should pass.

---

### Epic 2: Parser & Resolvers

#### Step 2.1: Create Command Parser

**File:** `src/core/commands/parser.ts`

```typescript
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
```

#### Step 2.2: Create Resolver Infrastructure

**File:** `src/core/commands/resolvers/types.ts`

```typescript
// Resolver Type Definitions
// Sprint: terminal-kinetic-commands-v1

import type { NarrativeSchema } from '@/data/narratives-schema';
import type { ArgType } from '../schema';

export interface ResolverContext {
  schema: NarrativeSchema | null;
  customLenses: Array<{ id: string; publicLabel: string }>;
}

export type ResolveResult<T> =
  | { success: true; value: T }
  | { success: false; error: string; suggestions?: string[] };

export interface Suggestion {
  value: string;
  label: string;
  icon?: string;
}

export interface Resolver<T = unknown> {
  type: ArgType;
  resolve(value: string, context: ResolverContext): ResolveResult<T>;
  getSuggestions(partial: string, context: ResolverContext): Suggestion[];
}
```

#### Step 2.3: Implement Journey Resolver

**File:** `src/core/commands/resolvers/journey.ts`

```typescript
// Journey Resolver - Fuzzy matches journey names/IDs
// Sprint: terminal-kinetic-commands-v1

import { Resolver, ResolverContext, ResolveResult, Suggestion } from './types';

export const journeyResolver: Resolver<string> = {
  type: 'journey',

  resolve(value: string, context: ResolverContext): ResolveResult<string> {
    const journeys = Object.values(context.schema?.journeys ?? {});
    
    if (journeys.length === 0) {
      return { success: false, error: 'No journeys available' };
    }

    const v = value.toLowerCase();

    // Exact ID match
    const exactId = journeys.find(j => j.id.toLowerCase() === v);
    if (exactId) return { success: true, value: exactId.id };

    // Exact title match
    const exactTitle = journeys.find(j => j.title.toLowerCase() === v);
    if (exactTitle) return { success: true, value: exactTitle.id };

    // Fuzzy match
    const fuzzy = journeys.filter(j =>
      j.title.toLowerCase().includes(v) ||
      j.id.toLowerCase().includes(v)
    );

    if (fuzzy.length === 1) {
      return { success: true, value: fuzzy[0].id };
    }

    if (fuzzy.length > 1) {
      return {
        success: false,
        error: `Multiple journeys match "${value}"`,
        suggestions: fuzzy.slice(0, 5).map(j => j.title)
      };
    }

    return {
      success: false,
      error: `Journey "${value}" not found`,
      suggestions: journeys.slice(0, 3).map(j => j.title)
    };
  },

  getSuggestions(partial: string, context: ResolverContext): Suggestion[] {
    const journeys = Object.values(context.schema?.journeys ?? {});
    const p = partial.toLowerCase();
    
    return journeys
      .filter(j =>
        !partial ||
        j.title.toLowerCase().includes(p) ||
        j.id.toLowerCase().includes(p)
      )
      .slice(0, 10)
      .map(j => ({
        value: j.id,
        label: j.title,
        icon: j.icon
      }));
  }
};
```

#### Step 2.4: Implement Lens Resolver

**File:** `src/core/commands/resolvers/lens.ts`

```typescript
// Lens Resolver - Fuzzy matches lens names/IDs
// Sprint: terminal-kinetic-commands-v1

import { PERSONAS } from '@/data/narratives-schema';
import { Resolver, ResolverContext, ResolveResult, Suggestion } from './types';

export const lensResolver: Resolver<string> = {
  type: 'lens',

  resolve(value: string, context: ResolverContext): ResolveResult<string> {
    const builtIn = Object.values(PERSONAS).filter(p => p.enabled);
    const custom = context.customLenses || [];
    const allLenses = [
      ...builtIn.map(p => ({ id: p.id, label: p.publicLabel })),
      ...custom.map(c => ({ id: c.id, label: c.publicLabel }))
    ];

    if (allLenses.length === 0) {
      return { success: false, error: 'No lenses available' };
    }

    const v = value.toLowerCase();

    // Exact ID match
    const exactId = allLenses.find(l => l.id.toLowerCase() === v);
    if (exactId) return { success: true, value: exactId.id };

    // Exact label match
    const exactLabel = allLenses.find(l => l.label.toLowerCase() === v);
    if (exactLabel) return { success: true, value: exactLabel.id };

    // Fuzzy match
    const fuzzy = allLenses.filter(l =>
      l.label.toLowerCase().includes(v) ||
      l.id.toLowerCase().includes(v)
    );

    if (fuzzy.length === 1) {
      return { success: true, value: fuzzy[0].id };
    }

    if (fuzzy.length > 1) {
      return {
        success: false,
        error: `Multiple lenses match "${value}"`,
        suggestions: fuzzy.slice(0, 5).map(l => l.label)
      };
    }

    return {
      success: false,
      error: `Lens "${value}" not found`,
      suggestions: allLenses.slice(0, 3).map(l => l.label)
    };
  },

  getSuggestions(partial: string, context: ResolverContext): Suggestion[] {
    const builtIn = Object.values(PERSONAS).filter(p => p.enabled);
    const custom = context.customLenses || [];
    const allLenses = [
      ...builtIn.map(p => ({ id: p.id, label: p.publicLabel, icon: p.icon })),
      ...custom.map(c => ({ id: c.id, label: c.publicLabel, icon: 'Sparkles' }))
    ];

    const p = partial.toLowerCase();
    
    return allLenses
      .filter(l =>
        !partial ||
        l.label.toLowerCase().includes(p) ||
        l.id.toLowerCase().includes(p)
      )
      .slice(0, 10)
      .map(l => ({
        value: l.id,
        label: l.label,
        icon: l.icon
      }));
  }
};
```

#### Step 2.5: Create Resolver Index

**File:** `src/core/commands/resolvers/index.ts`

```typescript
// Resolver Registry
// Sprint: terminal-kinetic-commands-v1

import { ArgType } from '../schema';
import { Resolver, ResolverContext, ResolveResult, Suggestion } from './types';
import { journeyResolver } from './journey';
import { lensResolver } from './lens';

// Simple string resolver (pass-through)
const stringResolver: Resolver<string> = {
  type: 'string',
  resolve(value: string): ResolveResult<string> {
    return { success: true, value };
  },
  getSuggestions(): Suggestion[] {
    return [];
  }
};

// Number resolver
const numberResolver: Resolver<number> = {
  type: 'number',
  resolve(value: string): ResolveResult<number> {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { success: false, error: `"${value}" is not a valid number` };
    }
    return { success: true, value: num };
  },
  getSuggestions(): Suggestion[] {
    return [];
  }
};

// Boolean resolver
const booleanResolver: Resolver<boolean> = {
  type: 'boolean',
  resolve(value: string): ResolveResult<boolean> {
    const v = value.toLowerCase();
    if (['true', 'yes', '1', 'on'].includes(v)) {
      return { success: true, value: true };
    }
    if (['false', 'no', '0', 'off'].includes(v)) {
      return { success: true, value: false };
    }
    return { success: false, error: `"${value}" is not a valid boolean` };
  },
  getSuggestions(): Suggestion[] {
    return [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ];
  }
};

export const RESOLVERS: Record<ArgType, Resolver> = {
  string: stringResolver,
  journey: journeyResolver,
  lens: lensResolver,
  number: numberResolver,
  boolean: booleanResolver,
};

export { ResolverContext, ResolveResult, Suggestion } from './types';
```

**Build Gate:** Run `npm run build` - should pass.

---

### Epic 3: Executor & Actions

#### Step 3.1: Create Executor Module

**File:** `src/core/commands/executor.ts`

```typescript
// Command Executor - Executes parsed commands
// Sprint: terminal-kinetic-commands-v1

import { ParsedCommand, CommandAction, ExecutionResult, CommandDefinition } from './schema';
import { CommandRegistry } from './registry';
import { RESOLVERS, ResolverContext } from './resolvers';

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
            return executeAction({ type: 'show-overlay', overlay: action.fallback.replace('show-', '') }, {}, command, context);
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
        // TODO: Resume last journey
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

      default:
        return {
          success: false,
          commandId: command.id,
          error: `Unknown action type: ${(action as any).type}`
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
```

**Build Gate:** Run `npm run build` - should pass.

---

### Epic 4: Command Palette UI

#### Step 4.1: Create CommandPalette Component

**File:** `components/Terminal/CommandPalette.tsx`

```typescript
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CommandDefinition, CommandCategory } from '@/src/core/commands/schema';
import { commandRegistry } from '@/src/core/commands/registry';
import * as Icons from 'lucide-react';
import { X } from 'lucide-react';

interface CommandPaletteProps {
  onSelect: (command: CommandDefinition) => void;
  onDismiss: () => void;
  initialQuery?: string;
}

const CATEGORY_LABELS: Record<CommandCategory, string> = {
  navigation: 'Navigation',
  action: 'Actions',
  info: 'Information',
  system: 'System'
};

const CATEGORY_ORDER: CommandCategory[] = ['navigation', 'action', 'info', 'system'];

export function CommandPalette({ onSelect, onDismiss, initialQuery = '' }: CommandPaletteProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = useMemo(() => {
    return commandRegistry.search(query.replace(/^\//, ''));
  }, [query]);

  const groupedCommands = useMemo(() => {
    const groups: Record<CommandCategory, CommandDefinition[]> = {
      navigation: [],
      action: [],
      info: [],
      system: []
    };
    filteredCommands.forEach(cmd => groups[cmd.category].push(cmd));
    return groups;
  }, [filteredCommands]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onDismiss();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, onSelect, onDismiss]);

  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
  };

  let flatIndex = 0;

  return (
    <div className="bg-[var(--chat-surface)] rounded-lg border border-[var(--chat-border)] shadow-xl max-w-md w-full mx-auto overflow-hidden">
      {/* Search Input */}
      <div className="flex items-center gap-2 p-3 border-b border-[var(--chat-border)]">
        <span className="text-[var(--chat-text-muted)]">/</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Type a command..."
          className="flex-1 bg-transparent text-[var(--chat-text)] placeholder:text-[var(--chat-text-muted)] outline-none text-sm"
        />
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-[var(--chat-hover)] rounded"
        >
          <X className="w-4 h-4 text-[var(--chat-text-muted)]" />
        </button>
      </div>

      {/* Command List */}
      <div className="max-h-64 overflow-y-auto p-2">
        {CATEGORY_ORDER.map(category => {
          const commands = groupedCommands[category];
          if (commands.length === 0) return null;

          return (
            <div key={category} className="mb-2">
              <div className="text-xs font-medium text-[var(--chat-text-muted)] px-2 py-1">
                {CATEGORY_LABELS[category]}
              </div>
              {commands.map(cmd => {
                const currentIndex = flatIndex++;
                const isSelected = currentIndex === selectedIndex;

                return (
                  <button
                    key={cmd.id}
                    onClick={() => onSelect(cmd)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ${
                      isSelected
                        ? 'bg-[var(--chat-accent)] text-white'
                        : 'hover:bg-[var(--chat-hover)] text-[var(--chat-text)]'
                    }`}
                  >
                    <span className={isSelected ? 'text-white' : 'text-[var(--chat-text-muted)]'}>
                      {getIcon(cmd.icon)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">/{cmd.trigger}</span>
                        {cmd.aliases && cmd.aliases.length > 0 && (
                          <span className={`text-xs ${isSelected ? 'text-white/70' : 'text-[var(--chat-text-muted)]'}`}>
                            ({cmd.aliases.map(a => `/${a}`).join(', ')})
                          </span>
                        )}
                      </div>
                      <div className={`text-xs truncate ${isSelected ? 'text-white/80' : 'text-[var(--chat-text-muted)]'}`}>
                        {cmd.description}
                      </div>
                    </div>
                    {cmd.shortcut && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-white/20' : 'bg-[var(--chat-hover)]'
                      }`}>
                        {cmd.shortcut}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}

        {filteredCommands.length === 0 && (
          <div className="text-center py-4 text-[var(--chat-text-muted)] text-sm">
            No commands match "{query}"
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-[var(--chat-border)] text-xs text-[var(--chat-text-muted)] flex gap-4">
        <span>↑↓ Navigate</span>
        <span>↵ Select</span>
        <span>Esc Close</span>
      </div>
    </div>
  );
}
```

#### Step 4.2: Create StatsOverlay Component

**File:** `components/Terminal/StatsOverlay.tsx`

```typescript
'use client';

import React from 'react';
import { useEngagementMachine } from '@/hooks/useEngagementMachine';
import { useSessionTelemetry } from '@/hooks/useSessionTelemetry';
import { BarChart3, Clock, MessageSquare, Compass, Glasses, X } from 'lucide-react';

interface StatsOverlayProps {
  onDismiss: () => void;
}

export function StatsOverlay({ onDismiss }: StatsOverlayProps) {
  const { session } = useEngagementMachine();
  const { sessionDuration } = useSessionTelemetry();

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return 'Just started';
    if (minutes === 1) return '1 minute';
    return `${minutes} minutes`;
  };

  const stats = [
    {
      icon: Clock,
      label: 'Session Duration',
      value: formatDuration(sessionDuration)
    },
    {
      icon: MessageSquare,
      label: 'Exchanges',
      value: session.exchangeCount.toString()
    },
    {
      icon: Compass,
      label: 'Cards Explored',
      value: session.visitedCards.length.toString()
    },
    {
      icon: BarChart3,
      label: 'Journeys Completed',
      value: session.journeysCompleted.toString()
    }
  ];

  return (
    <div className="bg-[var(--chat-surface)] rounded-lg border border-[var(--chat-border)] shadow-xl max-w-sm w-full mx-auto overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--chat-border)]">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[var(--chat-accent)]" />
          <h3 className="font-semibold text-[var(--chat-text)]">Session Statistics</h3>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-[var(--chat-hover)] rounded"
        >
          <X className="w-4 h-4 text-[var(--chat-text-muted)]" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="p-4 space-y-4">
        {stats.map(stat => (
          <div key={stat.label} className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--chat-hover)]">
              <stat.icon className="w-4 h-4 text-[var(--chat-accent)]" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-[var(--chat-text-muted)]">{stat.label}</div>
              <div className="text-lg font-semibold text-[var(--chat-text)]">{stat.value}</div>
            </div>
          </div>
        ))}

        {/* Current Context */}
        <div className="pt-4 border-t border-[var(--chat-border)] space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Glasses className="w-4 h-4 text-[var(--chat-text-muted)]" />
            <span className="text-[var(--chat-text-muted)]">Active Lens:</span>
            <span className="text-[var(--chat-text)]">
              {session.activeLens || 'None'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Compass className="w-4 h-4 text-[var(--chat-text-muted)]" />
            <span className="text-[var(--chat-text-muted)]">Active Journey:</span>
            <span className="text-[var(--chat-text)]">
              {session.activeJourneyId || 'Free exploration'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--chat-border)]">
        <button
          onClick={onDismiss}
          className="w-full py-2 px-4 bg-[var(--chat-accent)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          Continue Exploring
        </button>
      </div>
    </div>
  );
}
```

**Build Gate:** Run `npm run build` - should pass.

---

### Epic 5: Terminal Integration

#### Step 5.1: Create useCommands Hook

**File:** `components/Terminal/hooks/useCommands.ts`

```typescript
'use client';

import { useCallback, useMemo } from 'react';
import { useSchemaContext } from '@/contexts/SchemaContext';
import { useEngagementMachine } from '@/hooks/useEngagementMachine';
import { useCustomLenses } from '@/hooks/useCustomLenses';
import { commandRegistry, CommandRegistry } from '@/src/core/commands/registry';
import { parseCommand, isCommand } from '@/src/core/commands/parser';
import { executeCommand, ExecutionContext } from '@/src/core/commands/executor';
import { ExecutionResult } from '@/src/core/commands/schema';
import { ResolverContext } from '@/src/core/commands/resolvers';

interface UseCommandsOptions {
  onShowOverlay: (overlay: string) => void;
  onAddSystemMessage?: (message: string, suggestions?: string[]) => void;
}

export function useCommands({ onShowOverlay, onAddSystemMessage }: UseCommandsOptions) {
  const { schema } = useSchemaContext();
  const { session, actions: engagementActions, emit } = useEngagementMachine();
  const { customLenses } = useCustomLenses();

  const resolverContext: ResolverContext = useMemo(() => ({
    schema,
    customLenses: customLenses.map(c => ({ id: c.id, publicLabel: c.publicLabel }))
  }), [schema, customLenses]);

  const execute = useCallback(async (input: string): Promise<ExecutionResult> => {
    const parsed = parseCommand(input);
    
    if (!parsed) {
      return { success: false, commandId: 'none', error: 'Not a command' };
    }

    const context: ExecutionContext = {
      registry: commandRegistry,
      resolverContext,
      onJourneyStart: (journeyId) => {
        engagementActions.startJourney(journeyId);
      },
      onJourneyClear: () => {
        engagementActions.clearJourney();
      },
      onLensSwitch: (lensId) => {
        engagementActions.selectLens(lensId);
      },
      onLensClear: () => {
        engagementActions.selectLens(null);
      },
      onShowOverlay,
      onPlantSprout: (content, ctx) => {
        // MVP: Store in localStorage
        const sprouts = JSON.parse(localStorage.getItem('grove-sprouts') || '[]');
        sprouts.push({
          id: Date.now().toString(),
          content: content || 'Last response',
          lens: session.activeLens,
          journey: session.activeJourneyId,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('grove-sprouts', JSON.stringify(sprouts));
        console.log('[Sprout] Planted:', content || 'Last response');
      },
      onEmitAnalytics: (event, data) => {
        emit.custom(event, data);
      }
    };

    return executeCommand(parsed, context);
  }, [resolverContext, engagementActions, session, emit, onShowOverlay]);

  return {
    registry: commandRegistry,
    execute,
    isCommand,
    parseCommand
  };
}
```

#### Step 5.2: Update Overlay Registry

**File:** `components/Terminal/overlay-registry.ts`

Add these entries to the OVERLAY_REGISTRY:

```typescript
// Add imports at top
import { CommandPalette } from './CommandPalette';
import { StatsOverlay } from './StatsOverlay';

// Add to OVERLAY_REGISTRY object
'command-palette': {
  component: CommandPalette,
  hideInput: true,
  analytics: 'command_palette_opened'
},
'stats': {
  component: StatsOverlay,
  hideInput: false,
  analytics: 'stats_viewed'
}
```

#### Step 5.3: Update TerminalOverlay Type

**File:** `components/Terminal/types.ts`

Update the TerminalOverlay union:

```typescript
export type TerminalOverlay =
  | { type: 'none' }
  | { type: 'welcome' }
  | { type: 'lens-picker' }
  | { type: 'journey-picker' }
  | { type: 'wizard'; wizardId?: string }
  | { type: 'command-palette'; initialQuery?: string }
  | { type: 'stats' };
```

#### Step 5.4: Add Command Interception to Terminal.tsx

In `Terminal.tsx`, update the handleSend function. Find the function and add command interception at the start:

```typescript
// Add import at top
import { useCommands } from './hooks/useCommands';

// Inside Terminal component, add the hook
const commands = useCommands({
  onShowOverlay: (overlay) => actions.setOverlay({ type: overlay as any }),
  onAddSystemMessage: (message, suggestions) => {
    // Add system message for errors
    const errorId = Date.now().toString();
    setTerminalState(prev => ({
      ...prev,
      messages: [...prev.messages, {
        id: errorId,
        role: 'system' as any,
        text: message + (suggestions ? `\n\nDid you mean: ${suggestions.join(', ')}?` : '')
      }]
    }));
  }
});

// In handleSend, add this at the very start after getting textToSend:
const handleSend = async (manualQuery?: string, manualDisplay?: string, nodeId?: string) => {
  const textToSend = manualQuery !== undefined ? manualQuery : input;
  if (!textToSend.trim()) return;

  // Command interception - NEW CODE
  if (commands.isCommand(textToSend)) {
    const result = await commands.execute(textToSend);
    actions.setInput('');
    
    if (!result.success && result.error) {
      // Show error as system message
      const errorId = Date.now().toString();
      setTerminalState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          id: errorId,
          role: 'model',
          text: `⚠️ ${result.error}${result.suggestions ? `\n\nDid you mean: ${result.suggestions.join(', ')}?` : ''}`
        }]
      }));
    }
    return;
  }
  // END command interception

  // ... rest of existing handleSend code
```

#### Step 5.5: Add Keyboard Shortcut for Palette

Still in Terminal.tsx, add a keyboard handler:

```typescript
// Add useEffect for keyboard shortcut
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl+K or Cmd+K opens command palette
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      actions.setOverlay({ type: 'command-palette' });
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [actions]);
```

Also detect "/" in the input to open palette:

```typescript
// In the input onChange or onKeyDown handler, detect "/"
// Add this check in the input's onKeyDown:
onKeyDown={(e) => {
  if (e.key === '/' && !input) {
    e.preventDefault();
    actions.setOverlay({ type: 'command-palette' });
  }
  // ... existing handlers
}}
```

**Build Gate:** Run `npm run build` - should pass.

---

### Epic 6: Final Index and Export

#### Step 6.1: Create Commands Index

**File:** `src/core/commands/index.ts`

```typescript
// Command System Public API
// Sprint: terminal-kinetic-commands-v1

export * from './schema';
export { CommandRegistry, commandRegistry } from './registry';
export { parseCommand, isCommand } from './parser';
export { executeCommand, type ExecutionContext } from './executor';
export { COMMAND_DEFINITIONS } from './command-definitions';
export { RESOLVERS } from './resolvers';
```

---

## Manual QA Checklist

After implementation, verify:

- [ ] `/journey` opens journey picker
- [ ] `/journey ghost` or `/j ghost` starts Ghost in the Machine journey
- [ ] `/journey list` opens journey picker
- [ ] `/lens` opens lens picker  
- [ ] `/lens engineer` or `/l eng` switches to Engineer lens
- [ ] `/lens clear` removes active lens
- [ ] `/plant` shows confirmation (check console/localStorage)
- [ ] `/stats` shows session statistics overlay
- [ ] `/help` or `/?` opens command palette
- [ ] Ctrl+K / Cmd+K opens command palette
- [ ] "/" in empty input opens command palette
- [ ] Arrow keys navigate palette
- [ ] Enter selects command
- [ ] Escape dismisses palette
- [ ] Invalid command (e.g., `/foo`) shows error with suggestions
- [ ] Regular chat (no "/") still works normally

---

## Commit Message Template

```
feat(terminal): implement kinetic command system

Sprint: terminal-kinetic-commands-v1

- Add declarative command registry with 6 core commands
- Create command parser with flag/subcommand support
- Implement journey and lens resolvers with fuzzy matching
- Add command executor with action handlers
- Create CommandPalette and StatsOverlay components
- Add useCommands hook for Terminal integration
- Wire up keyboard shortcuts (Ctrl+K, "/" trigger)

Commands added:
- /journey [name] - Start guided journey
- /lens [name] - Switch perspective lens
- /plant - Capture insight as sprout
- /stats - View session statistics
- /explore - Free exploration mode
- /help - Show command palette

DEX compliance: Commands defined declaratively in JSON,
domain experts can extend without code changes.
```

---

## Troubleshooting

**Issue:** Commands not intercepted, going to chat
**Fix:** Check that `isCommand()` is called before chat API in handleSend

**Issue:** Journey/lens not found
**Fix:** Verify schema is loaded, check SchemaContext

**Issue:** Palette doesn't open on "/"
**Fix:** Check onKeyDown handler, ensure input is empty

**Issue:** Build errors on imports
**Fix:** Create index.ts exports, check paths use correct aliases

---

## Success Criteria

Sprint is complete when:
1. All 6 commands work as specified
2. Command palette opens via "/" and Ctrl+K
3. Fuzzy matching resolves partial names
4. Regular chat still functions
5. Build passes with no errors
6. Manual QA checklist passes
