// components/Terminal/TerminalChat.tsx
// Chat UI component - now using StreamRenderer with Kinetic Stream architecture
// Sprint: kinetic-stream-bridge-v1 (integration)

import React, { useRef, useEffect, useMemo } from 'react';
import { ChatMessage } from '../../types';
import { fromChatMessage, type StreamItem, type RhetoricalSpan, type JourneyFork, type ResponseStreamItem } from '../../src/core/schema/stream';
import { StreamRenderer } from './Stream/StreamRenderer';
import { BridgeState } from './types';
import { parseNavigation } from '../../src/core/transformers/NavigationParser';
import { parse as parseRhetoric } from '../../src/core/transformers/RhetoricalParser';

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
  // Fork selection handler (kinetic-stream-reset-v2)
  onForkSelect?: (fork: JourneyFork) => void;
  // Refs from parent for programmatic control
  messagesEndRef?: React.RefObject<HTMLDivElement>;
}

/**
 * TerminalChat - The chat message display area
 *
 * Now uses StreamRenderer for glass effects and motion animations.
 * ChatMessage[] is converted to StreamItem[] via the adapter.
 *
 * Responsibilities:
 * - Convert ChatMessage[] to StreamItem[]
 * - Delegate rendering to StreamRenderer
 * - Handle loading states
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
  onForkSelect,
  messagesEndRef: externalMessagesEndRef
}) => {
  const internalMessagesEndRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = externalMessagesEndRef || internalMessagesEndRef;

  // Convert ChatMessage[] to StreamItem[]
  // Memoize to avoid re-conversion on every render
  // Sprint: kinetic-stream-reset-v2 - Parse navigation and rhetoric for responses
  const streamItems: StreamItem[] = useMemo(() => {
    return messages.map((msg) => {
      const item = fromChatMessage(msg);

      // Preserve streaming state (only responses have isGenerating)
      if (msg.isStreaming && item.type === 'response') {
        return { ...item, isGenerating: true };
      }

      // For completed responses, parse navigation and rhetorical spans
      if (item.type === 'response' && !msg.isStreaming) {
        const { forks, cleanContent } = parseNavigation(item.content);
        const { spans } = parseRhetoric(cleanContent);

        const enhanced: ResponseStreamItem = {
          ...item,
          content: cleanContent,
          parsedSpans: spans.length > 0 ? spans : undefined,
          navigation: forks.length > 0 ? forks : undefined
        };
        return enhanced;
      }

      return item;
    });
  }, [messages]);

  // Create current item for streaming state
  const currentItem: StreamItem | null = useMemo(() => {
    if (isLoading && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.isStreaming) {
        return null; // Already in streamItems with isGenerating
      }
    }
    return null;
  }, [isLoading, messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messagesEndRef]);

  // Handle span clicks (bold text → prompt)
  const handleSpanClick = (span: RhetoricalSpan) => {
    if (onPromptClick && span.type === 'concept') {
      onPromptClick(span.text);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 terminal-scroll bg-white dark:bg-background-dark">
      <div className="max-w-3xl mx-auto">
        <StreamRenderer
          items={streamItems}
          currentItem={currentItem}
          onSpanClick={handleSpanClick}
          onForkSelect={onForkSelect}
          onPromptSubmit={onPromptClick}
          bridgeState={bridgeState}
          onBridgeAccept={onBridgeAccept}
          onBridgeDismiss={onBridgeDismiss}
          loadingMessages={loadingMessages}
        />
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default TerminalChat;
// Re-export from MarkdownRenderer for backward compatibility
export { MarkdownRenderer, parseInline } from './MarkdownRenderer';
