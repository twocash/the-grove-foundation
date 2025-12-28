// components/Terminal/Stream/blocks/ResponseBlock.tsx
// AI response message block with span rendering and motion
// Sprint: kinetic-stream-rendering-v1, kinetic-stream-polish-v1

import React from 'react';
import { motion } from 'framer-motion';
import type { StreamItem, RhetoricalSpan } from '../../../../src/core/schema/stream';
import { hasSpans, hasPaths } from '../../../../src/core/schema/stream';
import { SpanRenderer } from '../SpanRenderer';
import { MarkdownRenderer } from '../../MarkdownRenderer';
import LoadingIndicator from '../../LoadingIndicator';
import SuggestionChip from '../../SuggestionChip';
import { responseVariants, staggerContainer, staggerItem } from '../motion/variants';

export interface ResponseBlockProps {
  item: StreamItem;
  onSpanClick?: (span: RhetoricalSpan) => void;
  onPromptSubmit?: (prompt: string) => void;
  loadingMessages?: string[];
}

export const ResponseBlock: React.FC<ResponseBlockProps> = ({
  item,
  onSpanClick,
  onPromptSubmit,
  loadingMessages
}) => {
  const isError = item.content.startsWith('SYSTEM ERROR') ||
                  item.content.startsWith('Error:');

  return (
    <motion.div
      className="flex flex-col items-start"
      data-testid="response-block"
      variants={responseVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="flex items-center gap-2 mb-1.5 justify-start">
        <span className="text-xs font-semibold text-primary">The Grove</span>
      </div>

      <div className="max-w-[90%] md:max-w-[85%]">
        <div className={`px-5 py-3.5 rounded-2xl rounded-tl-sm shadow-sm ${
          isError
            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            : 'bg-slate-100 dark:bg-surface-dark text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-border-dark'
        }`}>
          {item.isGenerating && !item.content ? (
            <LoadingIndicator messages={loadingMessages} />
          ) : (
            <div className="font-serif text-sm leading-relaxed">
              {hasSpans(item) ? (
                <SpanRenderer
                  content={item.content}
                  spans={item.parsedSpans}
                  onSpanClick={onSpanClick}
                />
              ) : (
                <MarkdownRenderer
                  content={item.content}
                  onPromptClick={onPromptSubmit}
                />
              )}
              {item.isGenerating && (
                <span className="inline-block w-1.5 h-3 ml-1 bg-slate-500 dark:bg-slate-400 cursor-blink align-middle" />
              )}
            </div>
          )}
        </div>
      </div>

      {hasPaths(item) && !item.isGenerating && (
        <motion.div
          className="mt-3 space-y-1.5"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {item.suggestedPaths!.map((path) => (
            <motion.div key={path.id} variants={staggerItem}>
              <SuggestionChip
                prompt={path.label}
                onClick={() => onPromptSubmit?.(path.label)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default ResponseBlock;
