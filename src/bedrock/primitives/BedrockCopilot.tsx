// src/bedrock/primitives/BedrockCopilot.tsx
// Copilot panel at bottom of inspector for AI-assisted editing
// Sprint: prompt-editor-standardization-v1
// Sprint: copilot-suggestions-hotfix-v1 - added clickable suggestion buttons

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { GroveObject } from '../../core/schema/grove-object';
import type { PatchOperation, SuggestedAction } from '../types/copilot.types';
import type { QuickAction } from '../types/console.types';
import { parseCommand, getAvailableFields } from '../patterns/copilot-commands';

// =============================================================================
// Types
// =============================================================================

interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  suggestions?: SuggestedAction[];
}

/** Result from action handler or command parser */
interface ActionResult {
  success: boolean;
  message: string;
  operations?: PatchOperation[];
  suggestions?: SuggestedAction[];
}

/** Type alias for parseCommand result (now includes suggestions) */
type CommandParseResult = ActionResult;

/** Default quick actions when none provided */
const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { id: 'activate', label: 'Activate', command: 'activate', icon: 'toggle_on' },
  { id: 'help', label: 'Help', command: 'help', icon: 'help' },
];

interface BedrockCopilotProps {
  /** Console ID for field mapping */
  consoleId: string;
  /** Currently selected object */
  object?: GroveObject;
  /** Handler to apply patch operations */
  onApplyPatch?: (operations: PatchOperation[]) => void;
  /** Panel title */
  title?: string;
  /** Placeholder text for input */
  placeholder?: string;
  /** Whether the panel is collapsed by default */
  defaultCollapsed?: boolean;
  /** External input to populate (e.g., from Fix button). Clears after being consumed. */
  externalInput?: string;
  /** Callback when external input has been consumed */
  onExternalInputConsumed?: () => void;
  /** Optional async action handler for slash commands (e.g., /make-compelling) */
  onAction?: (actionId: string, userInput: string) => Promise<ActionResult | null>;
  /** Quick action buttons (defaults to Activate + Help) */
  quickActions?: QuickAction[];
}

// =============================================================================
// Component
// =============================================================================

export function BedrockCopilot({
  consoleId,
  object,
  onApplyPatch,
  title = 'Copilot',
  placeholder = 'Try "set title to New Title" or "help"',
  defaultCollapsed = true,
  externalInput,
  onExternalInputConsumed,
  onAction,
  quickActions = DEFAULT_QUICK_ACTIONS,
}: BedrockCopilotProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle external input (e.g., from Fix/Refine button)
  useEffect(() => {
    if (externalInput) {
      setInput(externalInput);
      setIsCollapsed(false); // Expand the panel
      // Focus input after a short delay to allow panel to render
      setTimeout(() => {
        inputRef.current?.focus();
        // Move cursor to end of input
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
    };
    setMessages(prev => [...prev, userMsg]);

    let result: ActionResult;

    // Check for slash command (e.g., /make-compelling, /suggest-targeting)
    const slashMatch = userMessage.match(/^\/(\S+)(?:\s+(.*))?$/);
    if (slashMatch && onAction) {
      const [, actionId, args] = slashMatch;
      const actionResult = await onAction(actionId, args || '');
      if (actionResult) {
        result = actionResult;
      } else {
        // Fallback to parseCommand if action handler returns null
        // Sprint: upload-pipeline-unification-v1 - parseCommand is now async
        result = await parseCommand(userMessage, consoleId, object);
      }
    } else {
      // Parse as regular command
      // Sprint: upload-pipeline-unification-v1 - parseCommand is now async
      result = await parseCommand(userMessage, consoleId, object);
    }

    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 200));

    // Add assistant response with suggestions
    const assistantMsg: CopilotMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: result.message,
      suggestions: result.suggestions,
    };
    setMessages(prev => [...prev, assistantMsg]);

    // Apply patch if successful
    if (result.success && result.operations && onApplyPatch) {
      onApplyPatch(result.operations);
    }

    setIsProcessing(false);
  }, [input, isProcessing, consoleId, object, onApplyPatch, onAction]);

  // Execute quick action - handles both slash commands and regular commands
  // Sprint: prompt-copilot-actions-v1
  const executeQuickAction = useCallback(async (command: string) => {
    setInput(command);
    setIsProcessing(true);

    const userMsg: CopilotMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: command,
    };
    setMessages(prev => [...prev, userMsg]);

    let result: ActionResult;

    // Check for slash command
    const slashMatch = command.match(/^\/(\S+)(?:\s+(.*))?$/);
    if (slashMatch && onAction) {
      const [, actionId, args] = slashMatch;
      const actionResult = await onAction(actionId, args || '');
      if (actionResult) {
        result = actionResult;
      } else {
        result = await parseCommand(command, consoleId, object);
      }
    } else {
      result = await parseCommand(command, consoleId, object);
    }

    const assistantMsg: CopilotMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: result.message,
      suggestions: result.suggestions,
    };
    setMessages(prev => [...prev, assistantMsg]);

    if (result.success && result.operations && onApplyPatch) {
      onApplyPatch(result.operations);
    }
    setInput('');
    setIsProcessing(false);
  }, [consoleId, object, onApplyPatch, onAction]);

  return (
    <div className="border-t border-[var(--glass-border-bright)] bg-[var(--glass-panel)]">
      {/* Header - always visible */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--glass-solid)] transition-colors"
        aria-expanded={!isCollapsed}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg text-[var(--neon-green)]">smart_toy</span>
          <span className="text-sm font-medium text-[var(--glass-text-primary)]">
            {title}
          </span>
          {isProcessing && (
            <span className="w-2 h-2 rounded-full bg-[var(--neon-green)] animate-pulse" />
          )}
        </div>
        <span className="material-symbols-outlined text-lg text-[var(--glass-text-muted)]">
          {isCollapsed ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Expandable content */}
      {!isCollapsed && (
        <div className="border-t border-[var(--glass-border)]">
          {/* Quick Actions */}
          <div className="px-4 py-2 border-b border-[var(--glass-border)]">
            <div className="flex flex-wrap gap-2">
              {quickActions.map(action => (
                <button
                  key={action.command}
                  onClick={() => executeQuickAction(action.command)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 text-xs rounded-full bg-[var(--neon-green)]/10 text-[var(--neon-green)] hover:bg-[var(--neon-green)]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message History */}
          {messages.length > 0 && (
            <div className="overflow-y-auto px-4 py-3 space-y-3 max-h-[200px]">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`text-sm ${message.role === 'user' ? 'text-right' : ''}`}
                >
                  {message.role === 'user' ? (
                    <span className="inline-block px-3 py-2 rounded-lg bg-[var(--neon-cyan)]/20 text-[var(--glass-text-primary)] max-w-[80%]">
                      {message.content}
                    </span>
                  ) : (
                    <div className="inline-block max-w-[80%] text-left">
                      <span className="block px-3 py-2 rounded-lg bg-[var(--glass-solid)] text-[var(--glass-text-secondary)] whitespace-pre-wrap">
                        {message.content}
                      </span>
                      {/* Clickable Suggestions - Sprint: copilot-suggestions-hotfix-v1 */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-[var(--glass-border)]">
                          {message.suggestions.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setInput(s.template);
                                inputRef.current?.focus();
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px]
                                         bg-[var(--neon-green)]/10 text-[var(--neon-green)]
                                         border border-[var(--neon-green)]/20
                                         hover:bg-[var(--neon-green)]/20 hover:border-[var(--neon-green)]/40
                                         transition-colors cursor-pointer"
                            >
                              {s.icon && (
                                <span className="material-symbols-outlined text-xs">{s.icon}</span>
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
          <form onSubmit={handleSubmit} className="p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={placeholder}
                disabled={isProcessing}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--glass-border-bright)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-green)]/50 focus:border-[var(--neon-green)]/60 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="px-3 py-2 rounded-lg bg-[var(--neon-green)]/20 text-[var(--neon-green)] hover:bg-[var(--neon-green)]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-lg">send</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default BedrockCopilot;
