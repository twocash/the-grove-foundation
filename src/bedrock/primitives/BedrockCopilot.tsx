// src/bedrock/primitives/BedrockCopilot.tsx
// Copilot panel at bottom of inspector for AI-assisted editing
// Sprint: prompt-editor-standardization-v1

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { GroveObject } from '../../core/schema/grove-object';
import type { PatchOperation } from '../types/copilot.types';
import { parseCommand, getAvailableFields } from '../patterns/copilot-commands';

// =============================================================================
// Types
// =============================================================================

interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

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
}: BedrockCopilotProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

    // Parse command
    const result = parseCommand(userMessage, consoleId, object);

    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 200));

    // Add assistant response
    const assistantMsg: CopilotMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: result.message,
    };
    setMessages(prev => [...prev, assistantMsg]);

    // Apply patch if successful
    if (result.success && result.operations && onApplyPatch) {
      onApplyPatch(result.operations);
    }

    setIsProcessing(false);
  }, [input, isProcessing, consoleId, object, onApplyPatch]);

  // Quick action buttons
  const quickActions = [
    { label: 'Activate', command: 'activate', icon: 'toggle_on' },
    { label: 'Help', command: 'help', icon: 'help' },
  ];

  const executeQuickAction = useCallback((command: string) => {
    setInput(command);
    // Trigger submit
    const result = parseCommand(command, consoleId, object);
    
    const userMsg: CopilotMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: command,
    };
    const assistantMsg: CopilotMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: result.message,
    };
    setMessages(prev => [...prev, userMsg, assistantMsg]);

    if (result.success && result.operations && onApplyPatch) {
      onApplyPatch(result.operations);
    }
    setInput('');
  }, [consoleId, object, onApplyPatch]);

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
                    <span className="inline-block px-3 py-2 rounded-lg bg-[var(--glass-solid)] text-[var(--glass-text-secondary)] max-w-[80%] text-left whitespace-pre-wrap">
                      {message.content}
                    </span>
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
