// src/surface/components/KineticStream/Stream/blocks/ResponseObject.tsx
// AI response display with glass, concepts, and forks
// Sprint: kinetic-experience-v1

import React from 'react';
import type { ResponseStreamItem, RhetoricalSpan, JourneyFork } from '@core/schema/stream';
import { hasSpans, hasNavigation } from '@core/schema/stream';
import { GlassContainer } from '../motion/GlassContainer';
import { RhetoricRenderer } from '../../ActiveRhetoric/RhetoricRenderer';
import { NavigationObject } from './NavigationObject';

export interface ResponseObjectProps {
  item: ResponseStreamItem;
  onConceptClick?: (span: RhetoricalSpan) => void;
  onForkSelect?: (fork: JourneyFork) => void;
  onPromptSubmit?: (prompt: string) => void;
}

export const ResponseObject: React.FC<ResponseObjectProps> = ({
  item,
  onConceptClick,
  onForkSelect,
  onPromptSubmit
}) => {
  const isError = item.content.startsWith('Error:');

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

      {hasNavigation(item) && !item.isGenerating && (
        <div className="mt-4 w-full max-w-[90%]">
          <NavigationObject forks={item.navigation!} onSelect={onForkSelect} />
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
