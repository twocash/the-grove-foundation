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

/** Default quick actions when none provided
 * Sprint: inspector-copilot-v1 - Removed activate (should be context-aware, not universal)
 * Keep only help for discoverability
 */
const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { id: 'help', label: 'Help', command: '/help', icon: 'help' },
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

    // Sprint: inspector-copilot-v1 - Auto-focus input after response
    // Use requestAnimationFrame to ensure DOM is updated before focusing
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
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

    // Sprint: inspector-copilot-v1 - Auto-focus input after response
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [consoleId, object, onApplyPatch, onAction]);

  // Sprint: inspector-copilot-v1 - Terminal styling
  // Mini-terminal aesthetic with JetBrains Mono, clearly differentiated from inspector
  // Simple markdown renderer for terminal output
  const renderMarkdown = (text: string) => {
    // Split by lines and process each
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Bold: **text** or __text__
      let processed = line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#00ff00]">$1</strong>');
      processed = processed.replace(/__(.+?)__/g, '<strong class="text-[#00ff00]">$1</strong>');
      // Inline code: `code`
      processed = processed.replace(/`(.+?)`/g, '<code class="px-1 bg-[#1a1a1a] rounded text-[#00ff00]/80">$1</code>');
      // Bullet points: • or -
      if (processed.startsWith('• ') || processed.startsWith('- ')) {
        processed = `<span class="text-[#00ff00]/60">•</span> ${processed.slice(2)}`;
      }
      return (
        <span key={i} className="block" dangerouslySetInnerHTML={{ __html: processed }} />
      );
    });
  };

  return (
    <div className="border-t border-[#1a1a1a] bg-[#0d0d0d] font-mono mx-2 mb-2 rounded-lg overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors"
        aria-expanded={!isCollapsed}
      >
        <div className="flex items-center gap-2">
          <span className="text-[#00ff00] text-xs">▸</span>
          <span className="text-xs font-medium text-[#00ff00]/80 uppercase tracking-wider">
            {title}
          </span>
          {isProcessing && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff00] animate-pulse" />
          )}
        </div>
        <span className="text-xs text-[#666]">
          {isCollapsed ? '[+]' : '[-]'}
        </span>
      </button>

      {/* Expandable content */}
      {!isCollapsed && (
        <div className="border-t border-[#1a1a1a]">
          {/* Quick Actions - only show if there are any */}
          {quickActions.length > 0 && (
            <div className="px-4 py-2.5 border-b border-[#1a1a1a]">
              <div className="flex flex-wrap gap-2">
                {quickActions.map(action => (
                  <button
                    key={action.command}
                    onClick={() => executeQuickAction(action.command)}
                    disabled={isProcessing}
                    className="px-2.5 py-1 text-[10px] rounded border border-[#333] bg-[#1a1a1a] text-[#00ff00]/70 hover:bg-[#222] hover:border-[#00ff00]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono uppercase tracking-wide"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message History - Terminal style with markdown */}
          {messages.length > 0 && (
            <div className="overflow-y-auto px-4 py-3 space-y-2 max-h-[200px] text-xs">
              {messages.map(message => (
                <div key={message.id} className="leading-relaxed">
                  {message.role === 'user' ? (
                    <div className="text-[#888]">
                      <span className="text-[#00ff00]">{'>'}</span> {message.content}
                    </div>
                  ) : (
                    <div className="mt-1">
                      <div className="text-[#aaa] pl-3 border-l-2 border-[#333] space-y-0.5">
                        {renderMarkdown(message.content)}
                      </div>
                      {/* Clickable Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pl-3">
                          {message.suggestions.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setInput(s.template);
                                inputRef.current?.focus();
                              }}
                              className="text-[10px] px-2 py-1 rounded border border-[#333] bg-[#1a1a1a] text-[#00ff00]/60 hover:text-[#00ff00] hover:border-[#00ff00]/30 transition-colors"
                            >
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

          {/* Input - Terminal prompt style */}
          <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-[#1a1a1a]">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff00] text-xs">{'>'}</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={placeholder}
                disabled={isProcessing}
                className="flex-1 bg-transparent text-xs text-[#ccc] placeholder:text-[#444] focus:outline-none disabled:opacity-50 font-mono"
              />
              {input.trim() && (
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="text-[#00ff00]/60 hover:text-[#00ff00] transition-colors text-xs px-2"
                >
                  ⏎
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default BedrockCopilot;
