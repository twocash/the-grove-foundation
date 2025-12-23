// components/Terminal/TerminalShell.tsx
// Chrome wrapper for Terminal - handles drawer, positioning, minimize/expand
// Sprint: Terminal Architecture Refactor v1.0

import React, { forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import TerminalPill from './TerminalPill';
import { TerminalShellHandle, TerminalShellProps } from './types';

/**
 * TerminalShell - The chrome layer of the Terminal
 *
 * Responsibilities:
 * - Drawer positioning and animation (slide in/out from right)
 * - Minimize to pill functionality
 * - Floating action button
 * - Focus management
 *
 * This component wraps the content (children) and provides
 * programmatic control via the ref handle.
 */
const TerminalShell = forwardRef<TerminalShellHandle, TerminalShellProps>(({
  isOpen,
  isMinimized,
  isLoading = false,
  enableMinimize = true,
  onClose,
  onMinimize,
  onExpand,
  onToggle,
  children
}, ref) => {
  // Refs for programmatic control
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputValueRef = useRef<string>('');

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Focus the input field
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Inject system message (placeholder - will be wired up in composition)
  const injectSystemMessage = useCallback((text: string) => {
    console.log('[TerminalShell] System message injection:', text);
    // This will be implemented when Terminal.tsx is refactored to use this shell
  }, []);

  // Get current input value
  const getInput = useCallback(() => {
    return inputValueRef.current;
  }, []);

  // Set input value
  const setInput = useCallback((value: string) => {
    inputValueRef.current = value;
    if (inputRef.current) {
      inputRef.current.value = value;
    }
  }, []);

  // Expose imperative handle to parent
  useImperativeHandle(ref, () => ({
    focusInput,
    scrollToBottom,
    injectSystemMessage,
    getInput,
    setInput
  }), [focusInput, scrollToBottom, injectSystemMessage, getInput, setInput]);

  return (
    <>
      {/* Minimized Pill - shown when terminal is open but minimized */}
      {isOpen && isMinimized && enableMinimize && (
        <div className="terminal-slide-up">
          <TerminalPill isLoading={isLoading} onExpand={onExpand} />
        </div>
      )}

      {/* Floating Action Button - hidden when minimized */}
      {!(isOpen && isMinimized && enableMinimize) && (
        <button
          onClick={onToggle}
          className={`fixed bottom-8 right-8 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 border border-ink/10 ${
            isOpen ? 'bg-white text-ink' : 'bg-ink text-white'
          }`}
          aria-label={isOpen ? 'Close terminal' : 'Open terminal'}
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <span className="font-mono text-xl font-bold">{`>_`}</span>
          )}
        </button>
      )}

      {/* Drawer - Library Marginalia Style (hidden when minimized) */}
      <div
        className={`fixed inset-y-0 right-0 z-[60] w-full md:w-[480px] bg-white dark:bg-background-dark border-l border-border-light dark:border-border-dark transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] ${
          isOpen && !isMinimized ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Grove Terminal"
      >
        <div className="flex flex-col h-full text-slate-900 dark:text-slate-100 font-sans">
          {/* Content rendered via children */}
          {children}
        </div>
      </div>
    </>
  );
});

TerminalShell.displayName = 'TerminalShell';

export default TerminalShell;
