// src/bedrock/types/InspectorCopilotConfig.ts
// Inspector Copilot Configuration Schema
// Sprint: inspector-copilot-v1
//
// This module defines the declarative configuration schema for Inspector Copilots.
// Copilots are embedded terminal-style command interfaces within inspector panels.

import type { PatchOperation, SuggestedAction } from './copilot.types';

// =============================================================================
// Command Definition Types
// =============================================================================

/**
 * Command visibility scope
 * - 'global': Available in all inspector copilots
 * - 'console': Available only in specific console type
 * - 'object': Available only when object matches criteria
 */
export type CommandScope = 'global' | 'console' | 'object';

/**
 * Command handler type determines how the command is processed
 * - 'patch': Generates JSON Patch operations synchronously
 * - 'async': Calls an async handler (e.g., API enrichment)
 * - 'navigation': Switches views or opens modals
 * - 'info': Displays information without side effects
 */
export type CommandHandlerType = 'patch' | 'async' | 'navigation' | 'info';

/**
 * Argument type for commands that accept parameters
 */
export interface CommandArgSchema {
  /** Argument name used in parsing */
  name: string;
  /** Expected type */
  type: 'string' | 'number' | 'field';
  /** Whether this argument is required */
  required: boolean;
  /** Human-readable description for /help */
  description: string;
}

/**
 * Condition for showing/enabling a command
 * Evaluated against current object state
 */
export interface CommandCondition {
  /** JSON Pointer path to field (e.g., 'meta.status') */
  field: string;
  /** Comparison operator */
  operator: 'eq' | 'neq' | 'exists' | 'missing';
  /** Value to compare against (not needed for exists/missing) */
  value?: unknown;
}

/**
 * A single copilot command definition
 * Commands are declarative - handler behavior inferred from type
 */
export interface CopilotCommand {
  /** Unique command ID (e.g., 'activate', 'set-title') */
  id: string;

  /** Primary trigger (e.g., 'activate', 'set') - user types /trigger or just trigger */
  trigger: string;

  /** Alternative triggers (e.g., ['enable', 'turn-on']) */
  aliases?: string[];

  /** Human-readable description for /help */
  description: string;

  /** Material Symbols icon name */
  icon?: string;

  /** Visibility scope - defaults to 'global' */
  scope?: CommandScope;

  /** Handler type determines execution pattern */
  handlerType: CommandHandlerType;

  /**
   * For 'patch' handlers: field path to modify
   * Uses JSON Pointer format (e.g., '/meta/status', '/payload/available')
   */
  targetPath?: string;

  /**
   * For 'patch' handlers: value to set
   * Can be a static value or 'toggle' for boolean flip
   */
  patchValue?: unknown | 'toggle';

  /**
   * For 'async' handlers: action handler ID
   * Maps to registered async action (e.g., 'enrich', 'suggest-targeting')
   */
  asyncActionId?: string;

  /**
   * Arguments schema for commands that accept parameters
   * Pattern: /command <arg1> <arg2> or "set field to value"
   */
  args?: CommandArgSchema[];

  /**
   * Condition for showing this command
   * If not met, command won't appear in /help and won't execute
   */
  showWhen?: CommandCondition;

  /**
   * Confirmation prompt before execution (for destructive actions)
   * If set, user must confirm before command executes
   */
  confirmPrompt?: string;
}

// =============================================================================
// Quick Actions
// =============================================================================

/**
 * Button variant for visual styling
 */
export type QuickActionVariant = 'primary' | 'secondary' | 'danger';

/**
 * Quick action buttons shown above the input
 * These are a subset of commands surfaced as clickable buttons
 * Note: Default is NO quick actions (maximum minimalism per user decision)
 */
export interface QuickActionConfig {
  /** Command ID to execute when clicked */
  commandId: string;

  /** Override display label (uses command description if not set) */
  label?: string;

  /** Override icon (uses command icon if not set) */
  icon?: string;

  /** Button variant - defaults to 'secondary' */
  variant?: QuickActionVariant;
}

// =============================================================================
// Field Mapping (for natural language commands)
// =============================================================================

/**
 * Field value type for parsing natural language input
 */
export type FieldMappingType = 'string' | 'number' | 'boolean' | 'array' | 'status';

/**
 * Field mapping for natural language "set X to Y" commands
 * Enables "set title to Hello" without explicit command registration
 */
export interface FieldMapping {
  /** Natural language aliases (e.g., ['title', 'name']) */
  aliases: string[];

  /** JSON Pointer path (e.g., '/meta/title') */
  path: string;

  /** Value type for parsing */
  type: FieldMappingType;

  /** Human-readable description for /help fields */
  description?: string;

  /** For 'status' type: valid values */
  validValues?: string[];

  /** If true, field is read-only (shown in /fields but not editable) */
  readonly?: boolean;
}

// =============================================================================
// Command Result (output from command execution)
// =============================================================================

/**
 * Result returned from command execution
 * Reuses existing CommandResult structure with explicit typing
 */
export interface CopilotCommandResult {
  /** Whether command executed successfully */
  success: boolean;

  /** Message to display to user (supports markdown) */
  message: string;

  /** Patch operations to apply (if any) */
  operations?: PatchOperation[];

  /** Suggested follow-up actions (clickable) */
  suggestions?: SuggestedAction[];

  /** If true, requires user confirmation before applying operations */
  requiresConfirmation?: boolean;
}

// =============================================================================
// Main Configuration
// =============================================================================

/**
 * History persistence strategy
 * - 'none': No persistence (default for minimal terminal UI)
 * - 'session': Persist to sessionStorage per inspector instance
 */
export type HistoryPersistence = 'none' | 'session';

/**
 * Inspector Copilot Configuration
 * Added to ConsoleSchema.inspector as optional 'copilot' property
 *
 * Design principles:
 * - Declarative: All config is JSON-serializable data
 * - Minimal: Default to least visual overhead
 * - Extensible: Console-specific commands merge with globals
 */
export interface InspectorCopilotConfig {
  /**
   * Enable/disable copilot for this inspector
   * @default true
   */
  enabled: boolean;

  /**
   * Panel title shown when expanded
   * @default 'Copilot'
   */
  title?: string;

  /**
   * Input placeholder text
   * @default 'Try "set title to X" or /help'
   */
  placeholder?: string;

  /**
   * Default collapsed state
   * @default true (collapsed)
   */
  defaultCollapsed?: boolean;

  /**
   * Console-specific commands
   * Merged with GLOBAL_COMMANDS at runtime (console commands override globals)
   */
  commands?: CopilotCommand[];

  /**
   * Quick action buttons to surface above input
   * References command IDs
   * @default [] (no quick actions - maximum minimalism)
   */
  quickActions?: QuickActionConfig[];

  /**
   * Console-specific field mappings
   * Merged with COMMON_FIELD_MAPPINGS at runtime
   */
  fieldMappings?: FieldMapping[];

  /**
   * Async action handlers registry key
   * Maps to handler factory (e.g., 'prompt-workshop' -> PromptCopilotActions)
   */
  actionHandlerKey?: string;

  /**
   * Welcome message shown on first expand (optional)
   * Supports markdown. If not set, no welcome message is shown.
   */
  welcomeMessage?: string;

  /**
   * History persistence strategy
   * @default 'none' (no persistence - terminal-style)
   */
  historyPersistence?: HistoryPersistence;

  /**
   * Maximum messages to retain in memory
   * Older messages are dropped to prevent memory bloat
   * @default 10
   */
  maxMessages?: number;

  /**
   * Maximum messages to display in UI
   * Shows only most recent N messages (terminal-style)
   * @default 3 (per user decision: minimal terminal style)
   */
  maxDisplayMessages?: number;
}

// =============================================================================
// Async Action Handler Types
// =============================================================================

/**
 * Context passed to async action handlers
 */
export interface CopilotActionContext<T = unknown> {
  /** Console ID (e.g., 'prompts', 'lens-workshop') */
  consoleId: string;

  /** Currently selected object (may be null) */
  selectedObject: T | null;

  /** All objects in the collection */
  objects: T[];

  /** User input after the command (e.g., for /enrich "make it compelling") */
  userInput: string;
}

/**
 * Async action handler function signature
 * Returns null to fall through to default parsing
 */
export type CopilotActionHandler<T = unknown> = (
  actionId: string,
  context: CopilotActionContext<T>
) => Promise<CopilotCommandResult | null>;

// =============================================================================
// Factory Configuration (resolved config with defaults applied)
// =============================================================================

/**
 * Resolved copilot configuration with all defaults applied
 * This is what the InspectorCopilot component receives
 */
export interface ResolvedCopilotConfig extends Required<Omit<InspectorCopilotConfig, 'welcomeMessage' | 'actionHandlerKey'>> {
  welcomeMessage?: string;
  actionHandlerKey?: string;
}
