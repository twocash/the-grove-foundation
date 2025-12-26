# Architecture: Terminal Kinetic Command System

**Sprint:** terminal-kinetic-commands-v1  
**Version:** 1.0

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INPUT                                     │
│                    "What is the ratchet?"  OR  "/journey ghost"         │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        INPUT ROUTER                                      │
│  ┌─────────────────────────┐    ┌─────────────────────────────────┐    │
│  │ Starts with "/"?        │───▶│ YES: Route to Command Engine     │    │
│  │                         │    └─────────────────────────────────┘    │
│  │                         │    ┌─────────────────────────────────┐    │
│  │                         │───▶│ NO: Route to Chat API            │    │
│  └─────────────────────────┘    └─────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│       COMMAND ENGINE          │  │         CHAT ENGINE           │
│  ┌────────────────────────┐  │  │  (Existing implementation)    │
│  │ 1. Parse command       │  │  │                               │
│  │ 2. Lookup in registry  │  │  │  sendMessageStream()          │
│  │ 3. Resolve arguments   │  │  │                               │
│  │ 4. Execute action      │  │  └──────────────────────────────┘
│  │ 5. Emit analytics      │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

---

## Core Components

### 1. Command Registry (`src/core/commands/registry.ts`)

The registry is the **canonical source** for all command definitions. It loads from JSON and provides lookup methods.

```typescript
// Type definitions
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
  | { type: 'journey-start'; journeyId?: string; fallback: 'show-journey-picker' }
  | { type: 'journey-continue' }
  | { type: 'journey-list' }
  | { type: 'lens-switch'; lensId?: string; fallback: 'show-lens-picker' }
  | { type: 'lens-clear' }
  | { type: 'lens-list' }
  | { type: 'plant-sprout'; contextCapture: string[] }
  | { type: 'show-overlay'; overlay: string }
  | { type: 'set-mode'; mode: string }
  | { type: 'show-command-palette' }
  | { type: 'show-command-help'; commandId?: string };

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
  availableIn?: string[];
  requiresLens?: boolean;
}

// Registry class
export class CommandRegistry {
  private commands: Map<string, CommandDefinition>;
  private triggerIndex: Map<string, string>; // trigger/alias → command id
  
  constructor(definitions: CommandDefinition[]) {
    this.commands = new Map();
    this.triggerIndex = new Map();
    
    for (const def of definitions) {
      this.commands.set(def.id, def);
      this.triggerIndex.set(def.trigger, def.id);
      def.aliases?.forEach(alias => this.triggerIndex.set(alias, def.id));
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
    // Fuzzy search implementation
    const q = query.toLowerCase();
    return this.getAll().filter(cmd => 
      cmd.trigger.includes(q) ||
      cmd.aliases?.some(a => a.includes(q)) ||
      cmd.description.toLowerCase().includes(q)
    );
  }
}
```

### 2. Command Parser (`src/core/commands/parser.ts`)

Parses raw input into structured command representation.

```typescript
export interface ParsedCommand {
  raw: string;
  trigger: string;
  subcommand?: string;
  args: string[];
  flags: Record<string, string | boolean>;
}

export function parseCommand(input: string): ParsedCommand | null {
  if (!input.startsWith('/')) return null;
  
  const trimmed = input.slice(1).trim();
  if (!trimmed) return { raw: input, trigger: '', args: [], flags: {} };
  
  // Split by whitespace, respecting quotes
  const tokens = tokenize(trimmed);
  const trigger = tokens[0].toLowerCase();
  const remaining = tokens.slice(1);
  
  // Extract flags (--key=value or --flag)
  const flags: Record<string, string | boolean> = {};
  const args: string[] = [];
  
  for (const token of remaining) {
    if (token.startsWith('--')) {
      const [key, value] = token.slice(2).split('=');
      flags[key] = value ?? true;
    } else {
      args.push(token);
    }
  }
  
  // Check for subcommand (first non-flag arg if it matches known subcommands)
  const subcommand = args[0]; // Will be validated against command definition
  
  return { raw: input, trigger, subcommand, args, flags };
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (const char of input) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ' ' && !inQuotes) {
      if (current) tokens.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current) tokens.push(current);
  
  return tokens;
}
```

### 3. Argument Resolvers (`src/core/commands/resolvers/`)

Each argument type has a resolver that converts raw string input to typed values.

```typescript
// Base resolver interface
export interface Resolver<T = unknown> {
  type: ArgType;
  resolve(value: string, context: ResolverContext): ResolveResult<T>;
  getSuggestions(partial: string, context: ResolverContext): Suggestion[];
}

export interface ResolverContext {
  schema: NarrativeSchema | null;
  customLenses: CustomLens[];
  session: SessionState;
}

export type ResolveResult<T> =
  | { success: true; value: T }
  | { success: false; error: string; suggestions?: string[] };

// Journey resolver
export const journeyResolver: Resolver<string> = {
  type: 'journey',
  
  resolve(value: string, context: ResolverContext): ResolveResult<string> {
    const journeys = Object.values(context.schema?.journeys ?? {});
    
    // Exact ID match
    const exactId = journeys.find(j => j.id === value);
    if (exactId) return { success: true, value: exactId.id };
    
    // Exact title match (case-insensitive)
    const exactTitle = journeys.find(
      j => j.title.toLowerCase() === value.toLowerCase()
    );
    if (exactTitle) return { success: true, value: exactTitle.id };
    
    // Fuzzy match
    const fuzzyMatches = journeys.filter(j =>
      j.title.toLowerCase().includes(value.toLowerCase()) ||
      j.id.toLowerCase().includes(value.toLowerCase())
    );
    
    if (fuzzyMatches.length === 1) {
      return { success: true, value: fuzzyMatches[0].id };
    }
    
    if (fuzzyMatches.length > 1) {
      return {
        success: false,
        error: `Multiple journeys match "${value}"`,
        suggestions: fuzzyMatches.map(j => j.title)
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
    return journeys
      .filter(j => 
        j.title.toLowerCase().includes(partial.toLowerCase()) ||
        j.id.toLowerCase().includes(partial.toLowerCase())
      )
      .map(j => ({ value: j.id, label: j.title, icon: j.icon }));
  }
};

// Lens resolver (similar pattern)
export const lensResolver: Resolver<string> = {
  type: 'lens',
  resolve(value: string, context: ResolverContext): ResolveResult<string> {
    // Check built-in personas
    const personas = Object.values(PERSONAS);
    const customLenses = context.customLenses;
    const allLenses = [...personas, ...customLenses];
    
    // Resolution logic similar to journey...
  },
  getSuggestions(partial: string, context: ResolverContext): Suggestion[] {
    // ...
  }
};
```

### 4. Command Executor (`src/core/commands/executor.ts`)

Executes parsed commands against the registry with resolved arguments.

```typescript
export interface ExecutionContext {
  registry: CommandRegistry;
  resolvers: Record<ArgType, Resolver>;
  schema: NarrativeSchema | null;
  session: SessionState;
  actions: TerminalActions;
  engagementActions: EngagementActions;
  emit: EngagementEmitter;
}

export interface ExecutionResult {
  success: boolean;
  commandId: string;
  action?: CommandAction;
  error?: string;
  suggestions?: string[];
}

export async function executeCommand(
  parsed: ParsedCommand,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const { registry, resolvers, actions, engagementActions, emit } = context;
  
  // Lookup command
  const command = registry.getByTrigger(parsed.trigger);
  if (!command) {
    const suggestions = registry.search(parsed.trigger).map(c => `/${c.trigger}`);
    return {
      success: false,
      commandId: 'unknown',
      error: `Unknown command: /${parsed.trigger}`,
      suggestions
    };
  }
  
  // Check for subcommand
  let action = command.action;
  if (parsed.subcommand && command.subcommands?.[parsed.subcommand]) {
    action = command.subcommands[parsed.subcommand];
  }
  
  // Resolve arguments
  const resolvedArgs: Record<string, unknown> = {};
  if (command.args) {
    for (let i = 0; i < command.args.length; i++) {
      const argDef = command.args[i];
      const rawValue = parsed.args[i];
      
      if (!rawValue && !argDef.optional) {
        // Use fallback action if defined
        if ('fallback' in action) {
          action = { type: action.fallback } as CommandAction;
          break;
        }
        return {
          success: false,
          commandId: command.id,
          error: `Missing required argument: ${argDef.name}`
        };
      }
      
      if (rawValue) {
        const resolver = resolvers[argDef.type];
        const result = resolver.resolve(rawValue, {
          schema: context.schema,
          customLenses: [], // TODO: get from context
          session: context.session
        });
        
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
  }
  
  // Execute action
  try {
    await executeAction(action, resolvedArgs, context);
    
    // Emit analytics
    emit.commandExecuted(command.id, parsed.trigger, resolvedArgs);
    
    return { success: true, commandId: command.id, action };
  } catch (error) {
    return {
      success: false,
      commandId: command.id,
      error: error instanceof Error ? error.message : 'Execution failed'
    };
  }
}

async function executeAction(
  action: CommandAction,
  args: Record<string, unknown>,
  context: ExecutionContext
): Promise<void> {
  const { actions, engagementActions } = context;
  
  switch (action.type) {
    case 'journey-start':
      const journeyId = args.journeyId as string | undefined;
      if (journeyId) {
        engagementActions.startJourney(journeyId);
      } else {
        actions.setOverlay({ type: 'journey-picker' });
      }
      break;
      
    case 'lens-switch':
      const lensId = args.lensId as string | undefined;
      if (lensId) {
        engagementActions.selectLens(lensId);
      } else {
        actions.setOverlay({ type: 'lens-picker' });
      }
      break;
      
    case 'show-overlay':
      actions.setOverlay({ type: action.overlay as any });
      break;
      
    case 'show-command-palette':
      actions.setOverlay({ type: 'command-palette' });
      break;
      
    case 'plant-sprout':
      // TODO: Implement sprout capture
      console.log('Planting sprout with context:', action.contextCapture);
      break;
      
    // ... other actions
  }
}
```

---

## Component Integration

### 5. Command Palette (`components/Terminal/CommandPalette.tsx`)

```typescript
interface CommandPaletteProps {
  onSelect: (command: CommandDefinition, subcommand?: string) => void;
  onDismiss: () => void;
  initialQuery?: string;
}

export function CommandPalette({ onSelect, onDismiss, initialQuery = '' }: CommandPaletteProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const registry = useCommandRegistry();
  
  const filteredCommands = useMemo(() => {
    if (!query) return registry.getAll();
    return registry.search(query);
  }, [query, registry]);
  
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
  
  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        onSelect(filteredCommands[selectedIndex]);
      } else if (e.key === 'Escape') {
        onDismiss();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, onSelect, onDismiss]);
  
  return (
    <div className="command-palette">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Type a command..."
        autoFocus
      />
      <div className="command-list">
        {Object.entries(groupedCommands).map(([category, commands]) => (
          commands.length > 0 && (
            <div key={category} className="command-group">
              <div className="category-label">{category}</div>
              {commands.map((cmd, i) => (
                <CommandItem
                  key={cmd.id}
                  command={cmd}
                  selected={filteredCommands.indexOf(cmd) === selectedIndex}
                  onClick={() => onSelect(cmd)}
                />
              ))}
            </div>
          )
        ))}
      </div>
    </div>
  );
}
```

### 6. useCommands Hook (`components/Terminal/hooks/useCommands.ts`)

```typescript
export function useCommands() {
  const { schema } = useSchemaContext();
  const { session, actions: engagementActions } = useEngagementMachine();
  const { actions: terminalActions } = useTerminalState();
  const emit = useEngagementEmitter();
  
  const registry = useMemo(() => new CommandRegistry(COMMAND_DEFINITIONS), []);
  
  const resolvers = useMemo(() => ({
    string: stringResolver,
    journey: journeyResolver,
    lens: lensResolver,
    number: numberResolver,
    boolean: booleanResolver,
  }), []);
  
  const execute = useCallback(async (input: string): Promise<ExecutionResult> => {
    const parsed = parseCommand(input);
    if (!parsed) {
      return { success: false, commandId: 'none', error: 'Not a command' };
    }
    
    return executeCommand(parsed, {
      registry,
      resolvers,
      schema,
      session,
      actions: terminalActions,
      engagementActions,
      emit,
    });
  }, [registry, resolvers, schema, session, terminalActions, engagementActions, emit]);
  
  const isCommand = useCallback((input: string): boolean => {
    return input.trimStart().startsWith('/');
  }, []);
  
  return { registry, execute, isCommand };
}
```

---

## Data Flow

```
                    User Input
                         │
                         ▼
              ┌─────────────────────┐
              │   isCommand(input)   │
              └─────────────────────┘
                    │         │
              Yes   │         │   No
                    ▼         ▼
        ┌──────────────┐  ┌──────────────┐
        │ parseCommand │  │ handleSend() │
        └──────────────┘  │ (chat API)   │
                │         └──────────────┘
                ▼
        ┌──────────────┐
        │   registry   │
        │  .getByTrigger│
        └──────────────┘
                │
                ▼
        ┌──────────────┐
        │  resolvers   │
        │  .resolve()  │
        └──────────────┘
                │
                ▼
        ┌──────────────┐
        │ executeAction│
        └──────────────┘
                │
        ┌───────┴───────┐
        ▼               ▼
┌──────────────┐ ┌──────────────┐
│ Terminal     │ │ Engagement   │
│ Actions      │ │ Actions      │
│ (overlay,    │ │ (lens,       │
│  input)      │ │  journey)    │
└──────────────┘ └──────────────┘
```

---

## Extension Points

### Adding a New Command

1. Add definition to `command-registry.json`:
```json
{
  "id": "garden-view",
  "trigger": "garden",
  "aliases": ["g"],
  "description": "View your planted sprouts",
  "category": "navigation",
  "action": { "type": "show-overlay", "overlay": "garden" },
  "icon": "Flower"
}
```

2. If new action type, add to `executeAction()`:
```typescript
case 'garden-view':
  actions.setOverlay({ type: 'garden' });
  break;
```

3. If new overlay, add to `TerminalOverlay` type and registry.

### Adding a New Resolver

1. Create resolver in `src/core/commands/resolvers/`:
```typescript
export const hubResolver: Resolver<string> = {
  type: 'hub',
  resolve(value, context) { /* ... */ },
  getSuggestions(partial, context) { /* ... */ }
};
```

2. Register in `useCommands` hook.

3. Use in command args: `{ "type": "hub" }`
