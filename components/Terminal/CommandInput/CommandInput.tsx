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
  // Sprout System (Sprint: Sprout System)
  getLastResponse?: () => LastResponseData | null;
  getSessionContext?: () => SessionContext;
  captureSprout?: (options?: { tags?: string[]; notes?: string }) => boolean;
}

const CommandInput: React.FC<CommandInputProps> = ({
  onSubmitQuery,
  disabled = false,
  onOpenModal,
  onSwitchLens,
  onShowWelcome,
  onShowLensPicker,
  // Sprout System
  getLastResponse,
  getSessionContext,
  captureSprout
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
        }
        // Action results are handled by the command itself
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
        <div className="absolute bottom-full left-0 right-0 mb-2 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-sm font-mono rounded-lg shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Autocomplete dropdown */}
      {showAutocomplete && (
        <CommandAutocomplete
          commands={suggestions}
          selectedIndex={selectedIndex}
          onSelect={handleSelectCommand}
        />
      )}

      {/* Input container */}
      <div className="flex items-center gap-2 bg-surface-light dark:bg-surface-dark rounded-xl p-2 border border-border-light dark:border-border-dark focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 transition-all shadow-sm">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a query or type /help"
          className="flex-1 bg-transparent border-0 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-0 focus:outline-none py-2 px-2 text-sm"
          disabled={disabled}
          autoComplete="off"
        />

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shrink-0 disabled:opacity-50"
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
