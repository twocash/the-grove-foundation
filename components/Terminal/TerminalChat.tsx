// components/Terminal/TerminalChat.tsx
// Chat UI component - messages, input, suggestions
// Sprint: kinetic-stream-rendering-v1 (integration)

import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../../types';
import LoadingIndicator from './LoadingIndicator';
import CognitiveBridge from './CognitiveBridge';
import { BridgeState } from './types';
import { MarkdownRenderer } from './MarkdownRenderer';

// ============================================================================
// TERMINAL CHAT PROPS
// ============================================================================

export interface TerminalChatProps {
  messages: ChatMessage[];
  isLoading: boolean;
  loadingMessages?: string[];
  // Cognitive Bridge inline injection
  bridgeState: BridgeState;
  onBridgeAccept: () => void;
  onBridgeDismiss: () => void;
  // Bold text click handler
  onPromptClick?: (prompt: string) => void;
  // Refs from parent for programmatic control
  messagesEndRef?: React.RefObject<HTMLDivElement>;
}

/**
 * TerminalChat - The chat message display area
 *
 * Responsibilities:
 * - Render message list with user/model bubbles
 * - Handle loading states with animated messages
 * - Inline Cognitive Bridge injection
 * - Auto-scroll to bottom on new messages
 */
const TerminalChat: React.FC<TerminalChatProps> = ({
  messages,
  isLoading,
  loadingMessages,
  bridgeState,
  onBridgeAccept,
  onBridgeDismiss,
  onPromptClick,
  messagesEndRef: externalMessagesEndRef
}) => {
  const internalMessagesEndRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = externalMessagesEndRef || internalMessagesEndRef;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messagesEndRef]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 terminal-scroll bg-white dark:bg-background-dark">
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.map((msg) => {
          const isSystemError = msg.text.startsWith('SYSTEM ERROR') || msg.text.startsWith('Error:');
          const showBridgeAfterThis = bridgeState.visible && bridgeState.afterMessageId === msg.id;

          return (
            <React.Fragment key={msg.id}>
              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Message Label */}
                <div className={`flex items-center gap-2 mb-1.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'user' ? (
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">You</span>
                  ) : (
                    <span className="text-xs font-semibold text-primary">The Grove</span>
                  )}
                </div>
                {/* Message Bubble */}
                <div className={`${msg.role === 'user' ? 'max-w-[85%] md:max-w-[70%]' : 'max-w-[90%] md:max-w-[85%]'}`}>
                  {msg.role === 'user' ? (
                    <div className="bg-primary text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-md">
                      <p className="text-sm md:text-base leading-relaxed">
                        {msg.text.replace(' --verbose', '')}
                      </p>
                    </div>
                  ) : (
                    <div className={`px-5 py-3.5 rounded-2xl rounded-tl-sm shadow-sm ${
                      isSystemError
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                        : 'bg-slate-100 dark:bg-surface-dark text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-border-dark'
                    }`}>
                      {msg.isStreaming && !msg.text ? (
                        <LoadingIndicator messages={loadingMessages} />
                      ) : (
                        <>
                          <MarkdownRenderer
                            content={msg.text}
                            onPromptClick={onPromptClick}
                          />
                          {msg.isStreaming && (
                            <span className="inline-block w-1.5 h-3 ml-1 bg-slate-500 dark:bg-slate-400 cursor-blink align-middle"></span>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* Cognitive Bridge - inline injection after triggering message */}
              {showBridgeAfterThis && bridgeState.journeyId && bridgeState.topicMatch && (
                <CognitiveBridge
                  journeyId={bridgeState.journeyId}
                  topicMatch={bridgeState.topicMatch}
                  onAccept={onBridgeAccept}
                  onDismiss={onBridgeDismiss}
                />
              )}
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default TerminalChat;
// Re-export from MarkdownRenderer for backward compatibility
export { MarkdownRenderer, parseInline } from './MarkdownRenderer';
