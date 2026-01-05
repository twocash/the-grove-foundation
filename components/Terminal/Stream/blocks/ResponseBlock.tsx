// components/Terminal/Stream/blocks/ResponseBlock.tsx
// AI response message block with glass effect, streaming text, and motion
// Sprint: kinetic-stream-rendering-v1, kinetic-stream-polish-v1, kinetic-stream-reset-v2
// Sprint: kinetic-suggested-prompts-v1 - Added 4D context-aware navigation

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import type { ResponseStreamItem, RhetoricalSpan, JourneyFork } from '../../../../src/core/schema/stream';
import { hasSpans, hasPaths, hasNavigation } from '../../../../src/core/schema/stream';
import { GlassPanel } from '../motion/GlassPanel';
import { SpanRenderer } from '../SpanRenderer';
import { StreamingText } from '../StreamingText';
import { MarkdownRenderer } from '../../MarkdownRenderer';
import LoadingIndicator from '../../LoadingIndicator';
import SuggestionChip from '../../SuggestionChip';
import { NavigationBlock } from './NavigationBlock';
import { responseVariants, staggerContainer, staggerItem } from '../motion/variants';
import { useFeatureFlag } from '../../../../hooks/useFeatureFlags';
import { useSafeNavigationPrompts } from '../../../../src/explore/hooks/useNavigationPrompts';
import { useSafeEventBridge } from '../../../../src/core/events/hooks/useEventBridge';

export interface ResponseBlockProps {
  item: ResponseStreamItem;
  onSpanClick?: (span: RhetoricalSpan) => void;
  onForkSelect?: (fork: JourneyFork) => void;
  onPromptSubmit?: (prompt: string) => void;
  loadingMessages?: string[];
}

export const ResponseBlock: React.FC<ResponseBlockProps> = ({
  item,
  onSpanClick,
  onForkSelect,
  onPromptSubmit,
  loadingMessages
}) => {
  const isError = item.content.startsWith('SYSTEM ERROR') ||
                  item.content.startsWith('Error:');

  // Sprint: kinetic-suggested-prompts-v1 - 4D Context-aware navigation
  const isInlineNavEnabled = useFeatureFlag('inline-navigation-prompts');
  const { forks: libraryForks, isReady } = useSafeNavigationPrompts({ maxPrompts: 3 });
  const { emit } = useSafeEventBridge();

  // Merge: prefer parsed navigation from response, fallback to 4D library prompts
  const navigationForks = hasNavigation(item)
    ? item.navigation!
    : (isInlineNavEnabled && isReady ? libraryForks : []);

  // Handle fork selection with event emission
  const handleForkSelect = useCallback((fork: JourneyFork) => {
    // Emit analytics event
    emit.forkSelected(fork.id, fork.type, fork.label, item.id);

    // Execute the fork's query
    if (fork.queryPayload) {
      onPromptSubmit?.(fork.queryPayload);
    } else {
      onPromptSubmit?.(fork.label);
    }

    // Also call original handler if provided
    onForkSelect?.(fork);
  }, [emit, item.id, onPromptSubmit, onForkSelect]);

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
        <span className="text-xs font-semibold text-[var(--neon-green)]">The Grove</span>
      </div>

      <div className="max-w-[90%] md:max-w-[85%]">
        <GlassPanel
          intensity="medium"
          className={`glass-message px-5 py-3.5 ${
            isError
              ? 'glass-message-error'
              : 'glass-message-assistant'
          }`}
        >
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
              ) : item.isGenerating ? (
                // Use StreamingText for active streaming with character reveal
                <StreamingText
                  content={item.content}
                  isStreaming={true}
                  className="text-[var(--glass-text-body)]"
                />
              ) : (
                // Use MarkdownRenderer for completed responses
                <MarkdownRenderer
                  content={item.content}
                  onPromptClick={onPromptSubmit}
                />
              )}
            </div>
          )}
        </GlassPanel>
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

      {navigationForks.length > 0 && !item.isGenerating && (
        <NavigationBlock
          forks={navigationForks}
          onSelect={handleForkSelect}
        />
      )}
    </motion.div>
  );
};

export default ResponseBlock;
