// hooks/useChatPersistence.ts
// Persists Terminal chat messages across navigation and browser refresh
// Sprint: terminal-chat-persistence-hotfix

import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, TerminalState } from '../types';
import { INITIAL_TERMINAL_MESSAGE } from '../constants';

const STORAGE_KEY = 'grove-terminal-messages';
const MAX_MESSAGES = 100; // Prevent unbounded growth

/**
 * Persisted chat messages format in localStorage
 */
interface PersistedChatData {
  messages: ChatMessage[];
  lastUpdated: string;
}

/**
 * Hook for persisting Terminal chat messages across navigation and page refresh.
 *
 * Uses localStorage to store messages with automatic load/save.
 * Messages are preserved when navigating between workspace views.
 *
 * @example
 * ```tsx
 * const { terminalState, setTerminalState } = useChatPersistence();
 * // Use like normal useState, but messages persist!
 * ```
 */
export function useChatPersistence() {
  // Initialize state from localStorage or with default message
  const [terminalState, setTerminalStateInternal] = useState<TerminalState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: PersistedChatData = JSON.parse(stored);
        // Validate stored data has messages
        if (parsed.messages && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          // Filter out any streaming messages that were interrupted
          const cleanMessages = parsed.messages.filter(m => !m.isStreaming);
          return {
            isOpen: true,
            messages: cleanMessages,
            isLoading: false
          };
        }
      }
    } catch (error) {
      console.warn('[useChatPersistence] Failed to load stored messages:', error);
    }

    // Default: fresh state with initial message
    return {
      isOpen: true,
      messages: [{ id: 'init', role: 'model', text: INITIAL_TERMINAL_MESSAGE }],
      isLoading: false
    };
  });

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    // Don't persist if only loading state changed (no message content change)
    const messagesToPersist = terminalState.messages
      .filter(m => !m.isStreaming) // Don't persist incomplete streaming messages
      .slice(-MAX_MESSAGES); // Keep last N messages

    const data: PersistedChatData = {
      messages: messagesToPersist,
      lastUpdated: new Date().toISOString()
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('[useChatPersistence] Failed to persist messages:', error);
    }
  }, [terminalState.messages]);

  // Wrapper to expose the same interface as useState
  const setTerminalState: React.Dispatch<React.SetStateAction<TerminalState>> = useCallback(
    (action) => {
      setTerminalStateInternal(action);
    },
    []
  );

  // Clear chat history (for /clear command or manual reset)
  const clearChat = useCallback(() => {
    setTerminalStateInternal({
      isOpen: true,
      messages: [{ id: 'init', role: 'model', text: INITIAL_TERMINAL_MESSAGE }],
      isLoading: false
    });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    terminalState,
    setTerminalState,
    clearChat
  };
}

export default useChatPersistence;
