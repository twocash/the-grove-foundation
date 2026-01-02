// components/Terminal/MarkdownRenderer.tsx
// Extracted from TerminalChat.tsx for reuse in StreamRenderer
// Sprint: kinetic-stream-rendering-v1

import React from 'react';
import SuggestionChip from './SuggestionChip';

/**
 * Parse inline markdown: **bold**, *italic*, _italic_
 */
export const parseInline = (text: string, onBoldClick?: (phrase: string) => void) => {
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

export interface MarkdownRendererProps {
  content: string;
  onPromptClick?: (prompt: string) => void;
}

/**
 * Simple markdown renderer for terminal responses.
 * Handles: bold, italic, bullet lists, arrow prompts.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onPromptClick }) => {
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
          <span key={`text-${elements.length}`} className="whitespace-pre-wrap block mb-3 last:mb-0 leading-relaxed font-mono text-sm text-emerald-500/75">
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
                className="px-4 py-2.5 text-sm font-mono text-emerald-500/75"
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

export default MarkdownRenderer;
