// src/bedrock/primitives/BedrockCopilot.tsx
// Copilot panel primitive for Bedrock consoles
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
  /** Maximum height of message history */
  maxHeight?: number;
}

// =============================================================================
// Component
// =============================================================================

export function BedrockCopilot({
  title = 'Copilot',
  placeholder = 'Ask anything about this view...',
  defaultCollapsed = true,
  maxHeight = 300,
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
    <div className="bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark transition-colors"
        aria-expanded={!isCollapsed}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg text-primary">smart_toy</span>
          <span className="text-sm font-medium text-foreground-light dark:text-foreground-dark">
            {title}
          </span>
          {isProcessing && (
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
        </div>
        <span className="material-symbols-outlined text-lg text-muted-light dark:text-muted-dark">
          {isCollapsed ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Expandable content */}
      {!isCollapsed && (
        <div className="border-t border-border-light dark:border-border-dark">
          {/* Quick Actions */}
          {availableActions.length > 0 && (
            <div className="px-4 py-2 border-b border-border-light dark:border-border-dark">
              <div className="flex flex-wrap gap-2">
                {availableActions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => handleActionClick(action.id)}
                    disabled={isProcessing}
                    className="px-3 py-1.5 text-xs rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
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
                        ? 'text-center text-muted-light dark:text-muted-dark italic'
                        : ''
                  }`}
                >
                  {message.role === 'user' ? (
                    <span className="inline-block px-3 py-2 rounded-lg bg-primary text-white max-w-[80%]">
                      {message.content}
                    </span>
                  ) : message.role === 'assistant' ? (
                    <span className="inline-block px-3 py-2 rounded-lg bg-surface-hover-light dark:bg-surface-hover-dark text-foreground-light dark:text-foreground-dark max-w-[80%] text-left">
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
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-foreground-light dark:text-foreground-dark placeholder:text-muted-light dark:placeholder:text-muted-dark focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
