// src/surface/components/KineticStream/Stream/blocks/ResponseObject.tsx
// AI response display with glass, concepts, and forks
// Sprint: kinetic-experience-v1
// Sprint: kinetic-suggested-prompts-v1 - Added 4D context-aware navigation fallback
// Sprint: 4d-prompt-refactor-telemetry-v1 - Prompt telemetry integration

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ResponseStreamItem, RhetoricalSpan, JourneyFork, JourneyForkType } from '@core/schema/stream';
import { hasSpans, hasNavigation } from '@core/schema/stream';
import { GlassContainer } from '../motion/GlassContainer';
import { RhetoricRenderer } from '../../ActiveRhetoric/RhetoricRenderer';
import { NavigationObject } from './NavigationObject';
import { useSafeNavigationPrompts } from '../../../../../explore/hooks/useNavigationPrompts';
import { useSafeEventBridge } from '../../../../../core/events/hooks/useEventBridge';
import { useFeatureFlag } from '../../../../../../hooks/useFeatureFlags';
import { usePromptTelemetry } from '../../../../../core/telemetry';
import { getSessionId } from '../../../../../lib/session';

export interface ResponseObjectProps {
  item: ResponseStreamItem;
  onConceptClick?: (span: RhetoricalSpan) => void;
  onForkSelect?: (fork: JourneyFork) => void;
  /** Sprint: prompt-journey-mode-v1 - Separate display text from execution prompt */
  onPromptSubmit?: (displayText: string, executionPrompt?: string) => void;
  /** Sprint: inline-prompts-wiring-v1 - Only show navigation on most recent response */
  isLast?: boolean;
}

export const ResponseObject: React.FC<ResponseObjectProps> = ({
  item,
  onConceptClick,
  onForkSelect,
  onPromptSubmit,
  isLast = false
}) => {
  const isError = item.content.startsWith('Error:');

  // Sprint: kinetic-suggested-prompts-v1 - 4D Context-aware navigation fallback
  // Sprint: feature-flag-cleanup-v1 - Properly wired feature flag
  // Sprint: prompt-progression-v1 - Single prompt progression (removed explicit maxPrompts)
  const isInlineNavEnabled = useFeatureFlag('inline-navigation-prompts');
  const { forks: libraryForks, isReady, scoredPrompts, context } = useSafeNavigationPrompts();
  const { emit } = useSafeEventBridge();

  // Sprint: 4d-prompt-refactor-telemetry-v1 - Prompt telemetry
  const { recordImpressions, recordSelection } = usePromptTelemetry({
    sessionId: getSessionId(),
    enabled: isInlineNavEnabled && isReady,
  });

  // Track which prompts we've already recorded impressions for
  const recordedPromptsRef = useRef<Set<string>>(new Set());

  // Record impressions when library prompts are displayed (not for parsed navigation)
  useEffect(() => {
    if (!isInlineNavEnabled || !isReady || scoredPrompts.length === 0) return;
    if (hasNavigation(item)) return; // Don't track parsed navigation, only 4D prompts

    // Filter to only new prompts we haven't recorded yet
    const newPrompts = scoredPrompts.filter(
      sp => !recordedPromptsRef.current.has(sp.prompt.id)
    );

    if (newPrompts.length > 0) {
      recordImpressions(newPrompts, context);
      newPrompts.forEach(sp => recordedPromptsRef.current.add(sp.prompt.id));
    }
  }, [scoredPrompts, context, isInlineNavEnabled, isReady, item, recordImpressions]);

  // Merge: prefer parsed navigation from response, fallback to 4D library prompts
  const navigationForks = hasNavigation(item)
    ? item.navigation!
    : (isInlineNavEnabled && isReady ? libraryForks : []);

  // Sprint: dedupe-prompts-v1 - Deduplicate forks by label text
  const TYPE_PRIORITY: Record<JourneyForkType, number> = {
    deep_dive: 4,
    pivot: 3,
    apply: 2,
    challenge: 1
  };

  const deduplicatedForks = useMemo(() => {
    const seen = new Map<string, JourneyFork>();

    for (const fork of navigationForks) {
      const key = fork.label.toLowerCase().trim();
      const existing = seen.get(key);

      if (!existing || TYPE_PRIORITY[fork.type] > TYPE_PRIORITY[existing.type]) {
        seen.set(key, fork);
      }
    }

    return Array.from(seen.values());
  }, [navigationForks]);

  // Handle fork selection with event emission
  // Sprint: prompt-journey-mode-v1 - BUG FIX: Display label in chat, send queryPayload to LLM
  // Sprint: 4d-prompt-refactor-telemetry-v1 - Record selection telemetry
  const handleForkSelect = useCallback((fork: JourneyFork) => {
    emit.forkSelected(fork.id, fork.type, fork.label, item.id);

    // Record selection telemetry for 4D prompts (not parsed navigation)
    if (!hasNavigation(item) && isInlineNavEnabled) {
      recordSelection(fork.id);
    }

    // Display label in chat, send queryPayload (executionPrompt) to LLM
    const displayText = fork.label;
    const executionPrompt = fork.queryPayload || fork.label;

    onPromptSubmit?.(displayText, executionPrompt);
    onForkSelect?.(fork);
  }, [emit, item, isInlineNavEnabled, recordSelection, onPromptSubmit, onForkSelect]);

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
          <div className="max-w-none font-mono text-[13px]">
            {hasSpans(item) ? (
              <RhetoricRenderer
                content={item.content}
                spans={item.parsedSpans}
                onSpanClick={onConceptClick}
              />
            ) : (
              <div
                className="text-[#94a3b8] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatMarkdown(item.content) }}
              />
            )}
          </div>
        )}
      </GlassContainer>

      {/* Sprint: inline-prompts-wiring-v1 - Only show navigation on most recent response */}
      {/* Sprint: dedupe-prompts-v1 - Use deduplicated forks */}
      {deduplicatedForks.length > 0 && !item.isGenerating && isLast && (
        <div className="mt-4 w-full max-w-[90%]">
          <NavigationObject forks={deduplicatedForks} onSelect={handleForkSelect} />
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
  // Pre-process: normalize various LLM list formats
  let normalized = content;

  // Pattern 1: "...sentence. 2.\n**Title**" → "...sentence.\n2. **Title**"
  // Split number from end of previous sentence to its own logical line
  normalized = normalized.replace(/\.\s*(\d+)\.\s*\n/g, '.\n$1. ');

  // Pattern 2: "1.\n**Title**" → "1. **Title**" (number alone on line)
  normalized = normalized.replace(/^(\d+)\.\s*\n+(?=\S)/gm, '$1. ');

  // Pattern 3: "...sentence. 2. **Title**" (all on same line, no newline after number)
  // Split into separate lines for list detection
  normalized = normalized.replace(/\.\s*(\d+)\.\s+(?=\*\*)/g, '.\n$1. ');

  // Process lists BEFORE newline normalization
  const lines = normalized.split('\n');
  const processedLines: string[] = [];
  let inBulletList = false;
  let inNumberedList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const bulletMatch = line.match(/^[*-]\s+(.+)$/);
    const numberedMatch = line.match(/^(\d+)\.\s*(.+)$/);

    if (bulletMatch) {
      if (inNumberedList) {
        processedLines.push('</ol>');
        inNumberedList = false;
      }
      if (!inBulletList) {
        processedLines.push('<ul class="list-disc pl-5 my-3 space-y-2">');
        inBulletList = true;
      }
      processedLines.push(`<li>${bulletMatch[1]}</li>`);
    } else if (numberedMatch) {
      if (inBulletList) {
        processedLines.push('</ul>');
        inBulletList = false;
      }
      if (!inNumberedList) {
        processedLines.push('<ol class="list-decimal pl-5 my-3 space-y-2">');
        inNumberedList = true;
      }
      processedLines.push(`<li>${numberedMatch[2]}</li>`);
    } else {
      // Close any open lists when hitting a non-list line
      if (inBulletList) {
        processedLines.push('</ul>');
        inBulletList = false;
      }
      if (inNumberedList) {
        processedLines.push('</ol>');
        inNumberedList = false;
      }
      if (line) {
        processedLines.push(line);
      } else if (processedLines.length > 0) {
        // Empty line = paragraph break
        processedLines.push('</p><p class="mt-3">');
      }
    }
  }

  // Close any trailing open lists
  if (inBulletList) processedLines.push('</ul>');
  if (inNumberedList) processedLines.push('</ol>');

  let result = processedLines.join(' ');

  // Inline formatting (order matters!)
  // 1. Bold: **text** → <strong> (must be before italics)
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#d97706]">$1</strong>');

  // 2. Italics: *text* → <em> (single asterisks, not inside tags)
  result = result.replace(/(?<![<\w])\*([^*<>]+)\*(?![>\w])/g, '<em class="italic text-[#cbd5e1]">$1</em>');

  // 3. Clean up multiple spaces
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}

export default ResponseObject;
