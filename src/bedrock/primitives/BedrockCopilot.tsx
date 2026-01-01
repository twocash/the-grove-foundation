// src/bedrock/primitives/BedrockCopilot.tsx
// Copilot panel at bottom of inspector for AI-assisted editing
// Sprint: bedrock-foundation-v1

import React, { useState, useRef, useEffect } from 'react';
import { useBedrockCopilot } from '../context/BedrockCopilotContext';

// =============================================================================
// Types
// =============================================================================

interface BedrockCopilotProps {
  /** Panel title */
  title?: string;
  /** Placeholder text for input */
  placeholder?: string;
  /** Whether the panel is collapsed by default */
  defaultCollapsed?: boolean;
  /** Maximum height when expanded */
  maxHeight?: number;
}

// =============================================================================
// Component
// =============================================================================

export function BedrockCopilot({
  title = 'Copilot',
  placeholder = 'Ask anything about this object...',
  defaultCollapsed = true,
  maxHeight = 280,
}: BedrockCopilotProps) {
  const {
    messages,
    isProcessing,
    availableActions,
    sendMessage,
    executeAction,
  } = useBedrockCopilot();

  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [input, setInput] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleActionClick = async (actionId: string) => {
    await executeAction(actionId);
  };

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
          {availableActions.length > 0 && (
            <div className="px-4 py-2 border-b border-[var(--glass-border)]">
              <div className="flex flex-wrap gap-2">
                {availableActions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => handleActionClick(action.id)}
                    disabled={isProcessing}
                    className="px-3 py-1.5 text-xs rounded-full bg-[var(--neon-green)]/10 text-[var(--neon-green)] hover:bg-[var(--neon-green)]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    title={action.description}
                  >
                    {action.icon && (
                      <span className="material-symbols-outlined text-sm">{action.icon}</span>
                    )}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message History */}
          {messages.length > 0 && (
            <div
              className="overflow-y-auto px-4 py-3 space-y-3"
              style={{ maxHeight }}
            >
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`text-sm ${
                    message.role === 'user'
                      ? 'text-right'
                      : message.role === 'system'
                        ? 'text-center text-[var(--glass-text-muted)] italic'
                        : ''
                  }`}
                >
                  {message.role === 'user' ? (
                    <span className="inline-block px-3 py-2 rounded-lg bg-[var(--neon-cyan)]/20 text-[var(--glass-text-primary)] max-w-[80%]">
                      {message.content}
                    </span>
                  ) : message.role === 'assistant' ? (
                    <span className="inline-block px-3 py-2 rounded-lg bg-[var(--glass-solid)] text-[var(--glass-text-secondary)] max-w-[80%] text-left">
                      {message.content}
                    </span>
                  ) : (
                    <span className="text-xs">{message.content}</span>
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
