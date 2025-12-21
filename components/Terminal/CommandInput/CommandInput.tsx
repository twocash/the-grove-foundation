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
        }
        // Modal and action results are handled by the context callbacks
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
    }
  }, [executeCommand, commandContext]);

  return (
    <div className="relative">
      {/* Toast notification */}
      {toast && (
        <div className="absolute bottom-full left-0 right-0 mb-2 px-3 py-2 bg-ink text-paper text-sm font-mono rounded shadow-lg animate-fade-in">
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

      {/* Input field */}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write a query or type /help"
        className="w-full bg-white border border-ink/20 p-3 pl-4 pr-10 text-sm font-serif text-ink focus:outline-none focus:border-grove-forest focus:ring-1 focus:ring-grove-forest/20 transition-all rounded-sm placeholder:italic"
        disabled={disabled}
        autoComplete="off"
      />

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-grove-forest transition-colors"
        disabled={disabled}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default CommandInput;
