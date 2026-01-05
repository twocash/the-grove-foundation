// src/surface/components/KineticStream/Stream/blocks/ResponseObject.tsx
// AI response display with glass, concepts, and forks
// Sprint: kinetic-experience-v1
// Sprint: kinetic-suggested-prompts-v1 - Added 4D context-aware navigation fallback

import React, { useCallback } from 'react';
import type { ResponseStreamItem, RhetoricalSpan, JourneyFork } from '@core/schema/stream';
import { hasSpans, hasNavigation } from '@core/schema/stream';
import { GlassContainer } from '../motion/GlassContainer';
import { RhetoricRenderer } from '../../ActiveRhetoric/RhetoricRenderer';
import { NavigationObject } from './NavigationObject';
import { useSafeNavigationPrompts } from '../../../../../explore/hooks/useNavigationPrompts';
import { useSafeEventBridge } from '../../../../../core/events/hooks/useEventBridge';
import { useFeatureFlag } from '../../../../../../hooks/useFeatureFlags';

export interface ResponseObjectProps {
  item: ResponseStreamItem;
  onConceptClick?: (span: RhetoricalSpan) => void;
  onForkSelect?: (fork: JourneyFork) => void;
  /** Sprint: prompt-journey-mode-v1 - Separate display text from execution prompt */
  onPromptSubmit?: (displayText: string, executionPrompt?: string) => void;
}

export const ResponseObject: React.FC<ResponseObjectProps> = ({
  item,
  onConceptClick,
  onForkSelect,
  onPromptSubmit
}) => {
  const isError = item.content.startsWith('Error:');

  // Sprint: kinetic-suggested-prompts-v1 - 4D Context-aware navigation fallback
  // Sprint: feature-flag-cleanup-v1 - Properly wired feature flag
  // Sprint: prompt-progression-v1 - Single prompt progression (removed explicit maxPrompts)
  const isInlineNavEnabled = useFeatureFlag('inline-navigation-prompts');
  const { forks: libraryForks, isReady } = useSafeNavigationPrompts();
  const { emit } = useSafeEventBridge();

  // Merge: prefer parsed navigation from response, fallback to 4D library prompts
  const navigationForks = hasNavigation(item)
    ? item.navigation!
    : (isInlineNavEnabled && isReady ? libraryForks : []);

  // Handle fork selection with event emission
  // Sprint: prompt-journey-mode-v1 - BUG FIX: Display label in chat, send queryPayload to LLM
  const handleForkSelect = useCallback((fork: JourneyFork) => {
    emit.forkSelected(fork.id, fork.type, fork.label, item.id);

    // Display label in chat, send queryPayload (executionPrompt) to LLM
    const displayText = fork.label;
    const executionPrompt = fork.queryPayload || fork.label;

    onPromptSubmit?.(displayText, executionPrompt);
    onForkSelect?.(fork);
  }, [emit, item.id, onPromptSubmit, onForkSelect]);

  return (
    <div className="flex flex-col items-start" data-testid="response-object" data-message-id={item.id}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-sans font-semibold text-[var(--neon-green)]">The Grove</span>
        {item.isGenerating && (
          <span className="w-2 h-2 rounded-full bg-[var(--neon-green)] animate-pulse" />
        )}
      </div>

      <GlassContainer
        intensity="medium"
        variant={isError ? 'error' : 'assistant'}
        className="w-full max-w-[90%] px-5 py-4"
      >
        {item.isGenerating && !item.content ? (
          <LoadingIndicator />
        ) : (
          <div className="max-w-none font-sans text-[13px]">
            {hasSpans(item) ? (
              <RhetoricRenderer
                content={item.content}
                spans={item.parsedSpans}
                onSpanClick={onConceptClick}
              />
            ) : (
              <div
                className="text-[var(--glass-text-body)] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatMarkdown(item.content) }}
              />
            )}
          </div>
        )}
      </GlassContainer>

      {navigationForks.length > 0 && !item.isGenerating && (
        <div className="mt-4 w-full max-w-[90%]">
          <NavigationObject forks={navigationForks} onSelect={handleForkSelect} />
        </div>
      )}
    </div>
  );
};

const LoadingIndicator: React.FC = () => (
  <div className="flex items-center gap-2 text-[var(--glass-text-subtle)]">
    <div className="flex gap-1">
      <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
    <span className="text-sm">Thinking...</span>
  </div>
);

function formatMarkdown(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[var(--grove-clay)]">$1</strong>')
    .replace(/\n\n/g, '</p><p class="mt-3">')
    .replace(/\n/g, '<br />');
}

export default ResponseObject;
