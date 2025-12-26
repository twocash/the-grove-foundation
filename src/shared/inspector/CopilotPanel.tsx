// src/shared/inspector/CopilotPanel.tsx
// Main Copilot Configurator panel

import { useState, useRef, useEffect } from 'react';
import type { GroveObject } from '@core/schema/grove-object';
import type { JsonPatch } from '@core/copilot';
import { useCopilot } from './hooks/useCopilot';
import { CopilotMessage } from './CopilotMessage';
import { SuggestedActions } from './SuggestedActions';

interface CopilotPanelProps {
  object: GroveObject;
  onApplyPatch: (patch: JsonPatch) => void;
}

export function CopilotPanel({ object, onApplyPatch }: CopilotPanelProps) {
  const {
    messages,
    isProcessing,
    isCollapsed,
    currentModel,
    sendMessage,
    applyPatch,
    rejectPatch,
    toggleCollapse,
  } = useCopilot(object, onApplyPatch);

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 80)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionSelect = (template: string) => {
    setInput(template);
    textareaRef.current?.focus();
  };

  // Collapsed state
  if (isCollapsed) {
    return (
      <button
        onClick={toggleCollapse}
        className="w-full h-10 flex items-center justify-center gap-2
                   bg-gradient-to-r from-indigo-900/40 to-slate-900
                   border-t border-[var(--copilot-border)]
                   text-indigo-300 text-xs hover:bg-indigo-900/50 transition-colors"
      >
        <span className="material-symbols-outlined text-sm animate-pulse">auto_awesome</span>
        <span>Copilot Configurator</span>
        <span className="material-symbols-outlined text-sm">expand_less</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col max-h-[45vh] bg-[var(--copilot-bg)] border-t border-[var(--copilot-border)] shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div
        className="h-8 flex items-center justify-between px-3
                   bg-gradient-to-r from-indigo-900/40 to-slate-900
                   border-b border-white/5 cursor-pointer"
        onClick={toggleCollapse}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-400 text-sm animate-pulse">
            auto_awesome
          </span>
          <span className="text-xs font-medium text-indigo-100">Copilot Configurator</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20">
            Beta
          </span>
          <button className="text-slate-500 hover:text-white">
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#0b1120]">
        {messages.map((message) => (
          <div key={message.id}>
            <CopilotMessage
              message={message}
              object={object}
              onApply={() => applyPatch(message.id)}
              onRetry={() => {
                rejectPatch(message.id);
                // Could trigger retry logic here
              }}
            />
            {/* Show suggestions on welcome message */}
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="ml-8 mt-1">
                <SuggestedActions
                  suggestions={message.suggestions}
                  onSelect={handleSuggestionSelect}
                />
              </div>
            )}
          </div>
        ))}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex gap-2 items-center text-indigo-400 text-xs">
            <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
            <span>Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-[#0f172a] border-t border-slate-800">
        <div className="relative flex items-end gap-2 bg-[#1e293b] border border-slate-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 rounded-lg p-2 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Copilot to edit configuration..."
            disabled={isProcessing}
            rows={1}
            className="w-full bg-transparent border-none text-xs text-white placeholder-slate-500 focus:ring-0 resize-none py-1 max-h-20"
          />
          <div className="flex gap-1 shrink-0 pb-0.5">
            <button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 disabled:hover:scale-100"
            >
              <span className="material-symbols-outlined text-sm">arrow_upward</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-1.5 px-1">
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isProcessing
                  ? 'bg-[var(--copilot-model-processing)]'
                  : 'bg-[var(--copilot-model-ready)]'
              }`}
            />
            Model: {currentModel.name}
          </div>
          <div className="text-[10px] text-slate-600">
            Press <span className="bg-slate-800 border border-slate-700 px-1 rounded text-slate-400">Enter</span> to send
          </div>
        </div>
      </div>
    </div>
  );
}
