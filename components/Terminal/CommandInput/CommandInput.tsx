// CommandInput - Composite input component with command palette support
// Sprint v0.16: Command Palette feature
// Sprint: Sprout System - Added sprout capture props

import React, { useState, useRef, useEffect, useCallback } from 'react';
import CommandAutocomplete from './CommandAutocomplete';
import { useCommandParser } from './useCommandParser';
import { Command, CommandContext, LastResponseData, SessionContext } from './CommandRegistry';

interface CommandInputProps {
  onSubmitQuery: (query: string) => void;
  disabled?: boolean;
  onOpenModal: (modal: 'help' | 'journeys' | 'stats' | 'garden') => void;
  onSwitchLens: (lensId: string) => void;
  onShowWelcome: () => void;
  onShowLensPicker: () => void;
  // Sprint: route-selection-flow-v1 - Navigation support
  onNavigate?: (path: string) => void;
  // Sprint: Sprout System Wiring - Mode switching for /garden command
  onSwitchMode?: (mode: string) => void;
  // Sprout System (Sprint: Sprout System)
  getLastResponse?: () => LastResponseData | null;
  getSessionContext?: () => SessionContext;
  captureSprout?: (options?: { tags?: string[]; notes?: string }) => boolean;
  // Chat Column Unification (Sprint: chat-column-unification-v1)
  embedded?: boolean;
  // Sprint: declarative-ui-config-v1 - Lens-specific placeholder
  placeholder?: string;
}

const CommandInput: React.FC<CommandInputProps> = ({
  onSubmitQuery,
  disabled = false,
  onOpenModal,
  onSwitchLens,
  onShowWelcome,
  onShowLensPicker,
  // Sprint: route-selection-flow-v1
  onNavigate,
  // Sprint: Sprout System Wiring
  onSwitchMode,
  // Sprout System
  getLastResponse,
  getSessionContext,
  captureSprout,
  // Chat Column Unification
  embedded = false,
  // Sprint: declarative-ui-config-v1
  placeholder: customPlaceholder
}) => {
  const [input, setInput] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { parseInput, getSuggestions, executeCommand } = useCommandParser();

  // Get suggestions based on current input
  const suggestions = getSuggestions(input);

  // Show autocomplete when typing a command
  useEffect(() => {
    const shouldShow = input.startsWith('/') && suggestions.length > 0;
    setShowAutocomplete(shouldShow);
    if (shouldShow) {
      setSelectedIndex(0);
    }
  }, [input, suggestions.length]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Create command context
  const commandContext: CommandContext = {
    openModal: onOpenModal,
    switchLens: onSwitchLens,
    showToast: (message: string) => setToast(message),
    showWelcome: onShowWelcome,
    showLensPicker: onShowLensPicker,
    // Sprout System (Sprint: Sprout System)
    getLastResponse,
    getSessionContext,
    captureSprout
  };

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const parsed = parseInput(trimmed);

    if (parsed.isCommand && parsed.commandId) {
      // Execute command
      const result = executeCommand(parsed.commandId, commandContext, parsed.args || undefined);

      if (result) {
        if (result.type === 'error') {
          setToast(result.message);
        } else if (result.type === 'modal') {
          onOpenModal(result.modal);
        } else if (result.type === 'navigate' && onNavigate) {
          onNavigate(result.path);
        } else if (result.type === 'action' && result.action === 'switch-mode' && onSwitchMode) {
          // Sprint: Sprout System Wiring - Handle mode switching (e.g., /garden command)
          const payload = result.payload as { mode: string } | undefined;
          if (payload?.mode) {
            onSwitchMode(payload.mode);
          }
        }
        // Other action results are handled by the command itself
      }

      setInput('');
      setShowAutocomplete(false);
    } else {
      // Regular query - pass to parent
      onSubmitQuery(trimmed);
      setInput('');
    }
  }, [input, parseInput, executeCommand, commandContext, onSubmitQuery]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showAutocomplete) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Tab':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          setInput(`/${suggestions[selectedIndex].id} `);
          setShowAutocomplete(false);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          // Complete the command and execute it
          const command = suggestions[selectedIndex];
          setInput(`/${command.id}`);
          setShowAutocomplete(false);

          // Execute the command
          const result = executeCommand(command.id, commandContext);
          if (result?.type === 'error') {
            setToast(result.message);
          } else if (result?.type === 'modal') {
            onOpenModal(result.modal);
          }
          setInput('');
        } else {
          handleSubmit();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowAutocomplete(false);
        setInput('');
        break;
    }
  }, [showAutocomplete, suggestions, selectedIndex, handleSubmit, executeCommand, commandContext]);

  const handleSelectCommand = useCallback((command: Command) => {
    setInput('');
    setShowAutocomplete(false);

    const result = executeCommand(command.id, commandContext);
    if (result?.type === 'error') {
      setToast(result.message);
    } else if (result?.type === 'modal') {
      onOpenModal(result.modal);
    }
  }, [executeCommand, commandContext, onOpenModal]);

  return (
    <div className="relative">
      {/* Toast notification */}
      {toast && (
        <div className={`absolute bottom-full left-0 right-0 mb-2 px-3 py-2 text-sm font-mono rounded-lg shadow-lg animate-fade-in ${
          embedded
            ? 'bg-[var(--chat-surface)] text-[var(--chat-text)] border border-[var(--chat-border)]'
            : 'bg-[var(--glass-solid)] text-[var(--glass-text-primary)] border border-[var(--glass-border)]'
        }`}>
          {toast}
        </div>
      )}

      {/* Autocomplete dropdown */}
      {showAutocomplete && (
        <CommandAutocomplete
          commands={suggestions}
          selectedIndex={selectedIndex}
          onSelect={handleSelectCommand}
          embedded={embedded}
        />
      )}

      {/* Input container */}
      <div className={`flex items-center gap-2 rounded-xl p-2 transition-all shadow-sm ${
        embedded
          ? 'bg-[var(--chat-input-bg)] border border-[var(--chat-border)] focus-within:border-[var(--chat-border-focus)] focus-within:ring-1 focus-within:ring-[var(--chat-accent)]/30'
          : 'glass-input-wrapper'
      }`}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={customPlaceholder || "Write a query or type /help"}
          className={`flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none py-2 px-2 text-sm ${
            embedded
              ? 'text-[var(--chat-text)] placeholder:text-[var(--chat-text-dim)]'
              : 'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-subtle)]'
          }`}
          disabled={disabled}
          autoComplete="off"
        />

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          className={`p-2 rounded-lg transition-colors shrink-0 disabled:opacity-50 ${
            embedded
              ? 'bg-[var(--chat-accent)] text-[var(--chat-accent-text)] hover:bg-[var(--chat-accent-hover)]'
              : 'glass-send-btn'
          }`}
          disabled={disabled}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CommandInput;
