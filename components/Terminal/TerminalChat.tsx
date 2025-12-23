// components/Terminal/TerminalChat.tsx
// Chat UI component - messages, input, suggestions
// Sprint: Terminal Architecture Refactor v1.0

import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../../types';
import { Card, JourneyNode } from '../../data/narratives-schema';
import LoadingIndicator from './LoadingIndicator';
import SuggestionChip from './SuggestionChip';
import CognitiveBridge from './CognitiveBridge';
import { BridgeState, V21JourneyContext } from './types';

// ============================================================================
// MARKDOWN RENDERER (extracted from Terminal.tsx)
// ============================================================================

/**
 * Parse inline markdown: **bold**, *italic*, _italic_
 */
const parseInline = (text: string, onBoldClick?: (phrase: string) => void) => {
  const parts = text.split(/(\*\*.*?\*\*|\*[^*]+\*|_[^_]+_)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const phrase = part.slice(2, -2);
      if (onBoldClick) {
        return (
          <button
            key={i}
            onClick={() => onBoldClick(phrase)}
            className="text-grove-clay font-bold hover:underline hover:decoration-grove-clay/50 hover:decoration-2 underline-offset-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            {phrase}
          </button>
        );
      }
      return (
        <strong key={i} className="text-grove-clay font-bold">
          {phrase}
        </strong>
      );
    }
    if ((part.startsWith('*') && part.endsWith('*') && part.length > 2) ||
        (part.startsWith('_') && part.endsWith('_') && part.length > 2)) {
      return (
        <em key={i} className="italic text-slate-600 dark:text-slate-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
};

interface MarkdownRendererProps {
  content: string;
  onPromptClick?: (prompt: string) => void;
}

/**
 * Simple markdown renderer for terminal responses.
 * Handles: bold, italic, bullet lists, arrow prompts.
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onPromptClick }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let currentListItems: string[] = [];
  let currentTextBuffer: string[] = [];
  let currentPrompts: string[] = [];

  const flushText = () => {
    if (currentTextBuffer.length > 0) {
      const text = currentTextBuffer.join('\n');
      if (text.trim()) {
        elements.push(
          <span key={`text-${elements.length}`} className="whitespace-pre-wrap block mb-3 last:mb-0 leading-relaxed font-serif text-sm">
            {parseInline(text, onPromptClick)}
          </span>
        );
      }
      currentTextBuffer = [];
    }
  };

  const flushList = () => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="mb-4 space-y-1 ml-4 list-none">
          {currentListItems.map((item, i) => (
            <li key={i} className="pl-4 relative text-sm font-sans text-slate-600 dark:text-slate-300">
              <span className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span>{parseInline(item, onPromptClick)}</span>
            </li>
          ))}
        </ul>
      );
      currentListItems = [];
    }
  };

  const flushPrompts = () => {
    if (currentPrompts.length > 0) {
      elements.push(
        <div key={`prompts-${elements.length}`} className="mb-3 space-y-1.5">
          {currentPrompts.map((prompt, i) => (
            onPromptClick ? (
              <SuggestionChip
                key={i}
                prompt={prompt}
                onClick={onPromptClick}
              />
            ) : (
              <div
                key={i}
                className="px-4 py-2.5 text-sm font-serif text-slate-600 dark:text-slate-300"
              >
                <span className="text-primary mr-2">→</span>
                {prompt}
              </div>
            )
          ))}
        </div>
      );
      currentPrompts = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    const isList = trimmed.startsWith('* ') || trimmed.startsWith('- ');
    const isPrompt = trimmed.startsWith('→ ') || trimmed.startsWith('-> ');

    if (isPrompt) {
      flushText();
      flushList();
      const promptText = trimmed.replace(/^(→|->)\s+/, '');
      currentPrompts.push(promptText);
    } else if (isList) {
      flushText();
      flushPrompts();
      currentListItems.push(line.replace(/^(\*|-)\s+/, ''));
    } else {
      flushList();
      flushPrompts();
      currentTextBuffer.push(line);
    }
  });

  flushText();
  flushList();
  flushPrompts();

  return <>{elements}</>;
};

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
export { MarkdownRenderer, parseInline };
