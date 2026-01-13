// src/bedrock/components/InspectorCopilot.tsx
// Canonical terminal-style copilot for inspector panels
// Sprint: inspector-copilot-v1
//
// Design: Minimal terminal UI with declarative command handling
// DEX Compliance: All behavior driven by config, not code

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { GroveObject } from '../../core/schema/grove-object';
import type { PatchOperation, SuggestedAction } from '../types/copilot.types';
import type {
  ResolvedCopilotConfig,
  CopilotCommandResult,
  CopilotActionHandler,
} from '../types/InspectorCopilotConfig';
import {
  findCommand,
  isCommandVisible,
  generateHelpText,
  generateFieldList,
} from '../utils/copilot-factory';
import { findFieldMapping, getFieldSuggestions, discoverFieldsFromObject } from '../config/copilot-command-registry';

// =============================================================================
// Types
// =============================================================================

interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  suggestions?: SuggestedAction[];
}

interface InspectorCopilotProps<T extends GroveObject = GroveObject> {
  /** Console ID for field mapping */
  consoleId: string;
  /** Resolved copilot configuration (from factory) */
  config: ResolvedCopilotConfig;
  /** Currently selected object */
  object?: T | null;
  /** Handler to apply patch operations */
  onApplyPatch?: (operations: PatchOperation[]) => void;
  /** Optional async action handler for custom commands */
  onAction?: CopilotActionHandler<T>;
  /** External input to populate (e.g., from Fix button) */
  externalInput?: string;
  /** Callback when external input has been consumed */
  onExternalInputConsumed?: () => void;
}

// =============================================================================
// Value Parsers (for natural language commands)
// =============================================================================

type FieldType = 'string' | 'number' | 'boolean' | 'array' | 'status';

function parseValue(value: string, type: FieldType): unknown {
  const trimmed = value.trim().replace(/^["']|["']$/g, '');

  switch (type) {
    case 'number': {
      const num = Number(trimmed);
      return isNaN(num) ? null : num;
    }
    case 'boolean': {
      const lower = trimmed.toLowerCase();
      if (['true', 'yes', 'on', '1'].includes(lower)) return true;
      if (['false', 'no', 'off', '0'].includes(lower)) return false;
      return null;
    }
    case 'status': {
      const statusMap: Record<string, string> = {
        active: 'active', live: 'active', enabled: 'active', on: 'active',
        draft: 'draft', inactive: 'draft', disabled: 'draft', off: 'draft',
        archived: 'archived', deleted: 'archived',
      };
      return statusMap[trimmed.toLowerCase()] || trimmed;
    }
    case 'array':
      return trimmed.split(',').map(t => t.trim()).filter(Boolean);
    case 'string':
    default:
      return trimmed;
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('/').filter(Boolean);
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

// =============================================================================
// Component
// =============================================================================

export function InspectorCopilot<T extends GroveObject = GroveObject>({
  consoleId,
  config,
  object,
  onApplyPatch,
  onAction,
  externalInput,
  onExternalInputConsumed,
}: InspectorCopilotProps<T>) {
  const [isCollapsed, setIsCollapsed] = useState(config.defaultCollapsed);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // If disabled, render nothing
  if (!config.enabled) {
    return null;
  }

  // Handle external input (e.g., from Fix/Refine button)
  useEffect(() => {
    if (externalInput) {
      setInput(externalInput);
      setIsCollapsed(false);
      setTimeout(() => {
        inputRef.current?.focus();
        if (inputRef.current) {
          inputRef.current.selectionStart = inputRef.current.value.length;
          inputRef.current.selectionEnd = inputRef.current.value.length;
        }
      }, 100);
      onExternalInputConsumed?.();
    }
  }, [externalInput, onExternalInputConsumed]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && !isCollapsed) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isCollapsed]);

  // Focus input when expanded
  useEffect(() => {
    if (!isCollapsed && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCollapsed]);

  // Keyboard shortcut: Ctrl+K to focus copilot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCollapsed(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Process command using registry
  const processCommand = useCallback(async (
    userInput: string
  ): Promise<CopilotCommandResult> => {
    const trimmed = userInput.trim();
    const isSlashCommand = trimmed.startsWith('/');
    const commandInput = isSlashCommand ? trimmed.slice(1) : trimmed;

    // Check for registered commands first
    const command = findCommand(commandInput.split(/\s+/)[0], config.commands);

    if (command) {
      // Check visibility
      if (!isCommandVisible(command, object as Record<string, unknown> | null)) {
        return {
          success: false,
          message: `Command /${command.trigger} is not available for this object.`,
        };
      }

      // Handle by type
      switch (command.handlerType) {
        case 'info': {
          if (command.id === 'help') {
            const helpText = generateHelpText(config.commands, object as Record<string, unknown> | null);
            return { success: true, message: helpText };
          }
          if (command.id === 'fields') {
            // Pass object for dynamic field discovery
            const fieldList = generateFieldList(config.fieldMappings, object as Record<string, unknown> | null);
            return { success: true, message: fieldList };
          }
          return { success: true, message: command.description };
        }

        case 'patch': {
          // Check for confirmation requirement
          if (command.confirmPrompt) {
            // TODO: Implement confirmation UI
            // For now, execute without confirmation
          }

          // Commands with targetPath and patchValue
          if (command.targetPath && command.patchValue !== undefined) {
            return {
              success: true,
              message: `${command.description}`,
              operations: [{
                op: 'replace',
                path: command.targetPath,
                value: command.patchValue,
              }],
            };
          }

          // Commands with args (set, clear, prepend)
          if (command.args) {
            return handleArgCommand(command.id, commandInput, object);
          }

          return { success: false, message: `Command /${command.trigger} has no action defined.` };
        }

        case 'async': {
          // Delegate to async action handler
          if (onAction && command.asyncActionId) {
            const result = await onAction(command.asyncActionId, {
              consoleId,
              selectedObject: object || null,
              objects: [],
              userInput: commandInput.replace(new RegExp(`^${command.trigger}\\s*`, 'i'), ''),
            });
            if (result) return result;
          }
          return { success: false, message: `Async handler not available for /${command.trigger}` };
        }

        case 'navigation': {
          // Navigation commands should be handled by parent
          return { success: true, message: `Navigation: ${command.description}` };
        }

        default:
          return { success: false, message: `Unknown handler type for /${command.trigger}` };
      }
    }

    // Fallback: Try to parse as natural language command
    return parseNaturalLanguage(trimmed, object);
  }, [config.commands, config.fieldMappings, consoleId, object, onAction]);

  // Handle arg-based commands (set, clear, prepend)
  // Sprint: inspector-copilot-v1 - Object-aware with fuzzy matching
  const handleArgCommand = useCallback((
    commandId: string,
    input: string,
    obj: T | null | undefined
  ): CopilotCommandResult => {
    // Cast object for field discovery
    const objRecord = obj as Record<string, unknown> | null;

    switch (commandId) {
      case 'set': {
        const match = input.match(/^set\s+(.+?)\s+to\s+(.+)$/i);
        if (!match) {
          return { success: false, message: 'Usage: set <field> to <value>' };
        }
        const [, fieldName, rawValue] = match;
        // Pass object for dynamic field discovery and fuzzy matching
        const field = findFieldMapping(fieldName, consoleId, objRecord);
        if (!field) {
          // Provide suggestions for unknown fields
          const suggestions = getFieldSuggestions(fieldName, consoleId, objRecord, 3);
          const suggestionText = suggestions.length > 0
            ? `\nDid you mean: ${suggestions.map(s => s.alias).join(', ')}?`
            : '\nType /fields to see available fields.';
          return { success: false, message: `Unknown field: "${fieldName}"${suggestionText}` };
        }
        const parsedValue = parseValue(rawValue, field.type);
        if (parsedValue === null) {
          const validHint = field.validValues?.length
            ? ` Valid values: ${field.validValues.join(', ')}`
            : '';
          return { success: false, message: `Invalid value for ${field.type} field.${validHint}` };
        }
        return {
          success: true,
          message: `Set ${field.aliases[0]} to "${parsedValue}"`,
          operations: [{ op: 'replace', path: field.path, value: parsedValue }],
        };
      }

      case 'clear': {
        const match = input.match(/^clear\s+(.+)$/i);
        if (!match) {
          return { success: false, message: 'Usage: clear <field>' };
        }
        const [, fieldName] = match;
        const field = findFieldMapping(fieldName, consoleId, objRecord);
        if (!field) {
          const suggestions = getFieldSuggestions(fieldName, consoleId, objRecord, 3);
          const suggestionText = suggestions.length > 0
            ? `\nDid you mean: ${suggestions.map(s => s.alias).join(', ')}?`
            : '';
          return { success: false, message: `Unknown field: "${fieldName}"${suggestionText}` };
        }
        if (field.readonly) {
          return { success: false, message: `Cannot clear read-only field: ${field.aliases[0]}` };
        }
        const emptyValue = field.type === 'array' ? [] : field.type === 'number' ? 0 : '';
        return {
          success: true,
          message: `Cleared ${field.aliases[0]}`,
          operations: [{ op: 'replace', path: field.path, value: emptyValue }],
        };
      }

      case 'prepend': {
        const match = input.match(/^prepend\s+(.+?)\s+with[:\s]+(.+)$/i);
        if (!match) {
          return { success: false, message: 'Usage: prepend <field> with <value>' };
        }
        const [, fieldName, rawValue] = match;
        const field = findFieldMapping(fieldName, consoleId, objRecord);
        if (!field) {
          const suggestions = getFieldSuggestions(fieldName, consoleId, objRecord, 3);
          const suggestionText = suggestions.length > 0
            ? `\nDid you mean: ${suggestions.map(s => s.alias).join(', ')}?`
            : '';
          return { success: false, message: `Unknown field: "${fieldName}"${suggestionText}` };
        }
        if (field.type !== 'string') {
          return { success: false, message: `Cannot prepend to ${field.type} field` };
        }
        const existing = obj ? getNestedValue(obj as Record<string, unknown>, field.path) : '';
        const newValue = existing ? `${rawValue.trim()} ${existing}`.trim() : rawValue.trim();
        return {
          success: true,
          message: `Prepended to ${field.aliases[0]}`,
          operations: [{ op: 'replace', path: field.path, value: newValue }],
        };
      }

      default:
        return { success: false, message: `Unknown arg command: ${commandId}` };
    }
  }, [consoleId]);

  // Parse natural language (fallback)
  const parseNaturalLanguage = useCallback((
    input: string,
    obj: T | null | undefined
  ): CopilotCommandResult => {
    const lower = input.toLowerCase();

    // Quick status commands
    if (['activate', 'enable', 'on'].includes(lower)) {
      return {
        success: true,
        message: 'Activated',
        operations: [{ op: 'replace', path: '/meta/status', value: 'active' }],
      };
    }
    if (['deactivate', 'disable', 'off', 'draft'].includes(lower)) {
      return {
        success: true,
        message: 'Set to draft',
        operations: [{ op: 'replace', path: '/meta/status', value: 'draft' }],
      };
    }

    // Try set pattern
    const setMatch = input.match(/^set\s+(.+?)\s+to\s+(.+)$/i);
    if (setMatch) {
      return handleArgCommand('set', input, obj);
    }

    // Try prepend pattern
    const prependMatch = input.match(/^prepend\s+(.+?)\s+with[:\s]+(.+)$/i);
    if (prependMatch) {
      return handleArgCommand('prepend', input, obj);
    }

    // Try clear pattern
    const clearMatch = input.match(/^clear\s+(.+)$/i);
    if (clearMatch) {
      return handleArgCommand('clear', input, obj);
    }

    return {
      success: false,
      message: `Unknown command. Type /help for available commands.`,
      suggestions: [
        { label: '/help', template: '/help', icon: 'help' },
        { label: '/fields', template: '/fields', icon: 'list' },
      ],
    };
  }, [handleArgCommand]);

  // Submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);

    // Add user message
    const userMsg: CopilotMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);

    // Process command
    const result = await processCommand(userMessage);

    // Add assistant response
    const assistantMsg: CopilotMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: result.message,
      timestamp: Date.now(),
      suggestions: result.suggestions,
    };
    setMessages(prev => [...prev, assistantMsg]);

    // Apply patch if successful
    if (result.success && result.operations && onApplyPatch) {
      onApplyPatch(result.operations);
    }

    setIsProcessing(false);
  }, [input, isProcessing, processCommand, onApplyPatch]);

  // Execute quick action
  const executeQuickAction = useCallback(async (command: string) => {
    setInput(command);
    setIsProcessing(true);

    const userMsg: CopilotMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: command,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);

    const result = await processCommand(command);

    const assistantMsg: CopilotMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: result.message,
      timestamp: Date.now(),
      suggestions: result.suggestions,
    };
    setMessages(prev => [...prev, assistantMsg]);

    if (result.success && result.operations && onApplyPatch) {
      onApplyPatch(result.operations);
    }

    setInput('');
    setIsProcessing(false);
  }, [processCommand, onApplyPatch]);

  // Get visible messages (limited by maxDisplayMessages)
  const visibleMessages = messages.slice(-config.maxDisplayMessages * 2);

  return (
    <div className="border-t border-[var(--glass-border-bright)] bg-[var(--glass-panel)]">
      {/* Header - always visible */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-4 py-2 flex items-center justify-between hover:bg-[var(--glass-solid)] transition-colors"
        aria-expanded={!isCollapsed}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-[var(--neon-green)]">
            terminal
          </span>
          <span className="text-xs font-mono text-[var(--glass-text-primary)]">
            {config.title}
          </span>
          {isProcessing && (
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--neon-green)] animate-pulse" />
          )}
          <span className="text-[10px] text-[var(--glass-text-muted)] font-mono">
            Ctrl+K
          </span>
        </div>
        <span className="material-symbols-outlined text-sm text-[var(--glass-text-muted)]">
          {isCollapsed ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Expandable content */}
      {!isCollapsed && (
        <div className="border-t border-[var(--glass-border)]">
          {/* Quick Actions (only if provided) */}
          {config.quickActions.length > 0 && (
            <div className="px-3 py-2 border-b border-[var(--glass-border)]">
              <div className="flex flex-wrap gap-1.5">
                {config.quickActions.map(action => {
                  const cmd = config.commands.find(c => c.id === action.commandId);
                  if (!cmd || !isCommandVisible(cmd, object as Record<string, unknown> | null)) {
                    return null;
                  }
                  return (
                    <button
                      key={action.commandId}
                      onClick={() => executeQuickAction(`/${cmd.trigger}`)}
                      disabled={isProcessing}
                      className="px-2 py-1 text-[10px] font-mono rounded bg-[var(--neon-green)]/10 text-[var(--neon-green)] hover:bg-[var(--neon-green)]/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {(action.icon || cmd.icon) && (
                        <span className="material-symbols-outlined text-xs">
                          {action.icon || cmd.icon}
                        </span>
                      )}
                      {action.label || cmd.trigger}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Terminal Output (monospace, no bubbles) */}
          {visibleMessages.length > 0 && (
            <div className="overflow-y-auto px-3 py-2 max-h-[160px] font-mono text-xs">
              {visibleMessages.map(message => (
                <div key={message.id} className="mb-1.5">
                  {message.role === 'user' ? (
                    <div className="text-[var(--neon-cyan)]">
                      <span className="text-[var(--glass-text-muted)]">{'>'} </span>
                      {message.content}
                    </div>
                  ) : (
                    <div>
                      <pre className="text-[var(--glass-text-secondary)] whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </pre>
                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {message.suggestions.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setInput(s.template);
                                inputRef.current?.focus();
                              }}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px]
                                         bg-[var(--neon-green)]/10 text-[var(--neon-green)]
                                         hover:bg-[var(--neon-green)]/20 transition-colors"
                            >
                              {s.icon && (
                                <span className="material-symbols-outlined text-[10px]">{s.icon}</span>
                              )}
                              {s.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-2">
            <div className="flex gap-1.5">
              <div className="flex-1 flex items-center gap-1 px-2 py-1.5 rounded border border-[var(--glass-border-bright)] bg-[var(--glass-solid)] focus-within:ring-1 focus-within:ring-[var(--neon-green)]/50 focus-within:border-[var(--neon-green)]/60">
                <span className="text-[var(--neon-green)] font-mono text-xs">{'>'}</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={config.placeholder}
                  disabled={isProcessing}
                  className="flex-1 text-xs font-mono bg-transparent text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="px-2 py-1.5 rounded bg-[var(--neon-green)]/20 text-[var(--neon-green)] hover:bg-[var(--neon-green)]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default InspectorCopilot;
