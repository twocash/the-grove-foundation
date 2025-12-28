// components/Terminal/Stream/SpanRenderer.tsx
// Renders rhetorical spans with interactive elements
// Sprint: kinetic-stream-rendering-v1

import React, { useMemo } from 'react';
import type { RhetoricalSpan, RhetoricalSpanType } from '../../../src/core/schema/stream';

export interface SpanRendererProps {
  content: string;
  spans: RhetoricalSpan[];
  onSpanClick?: (span: RhetoricalSpan) => void;
}

const SPAN_STYLES: Record<RhetoricalSpanType, string> = {
  concept: 'text-[var(--chat-concept-text)] font-bold hover:bg-[var(--chat-concept-bg-hover)] cursor-pointer transition-colors rounded px-0.5 active:scale-[0.98]',
  action: 'text-[var(--chat-action-text)] font-medium hover:underline cursor-pointer active:scale-[0.98]',
  entity: 'text-[var(--chat-entity-text)] italic'
};

export const SpanRenderer: React.FC<SpanRendererProps> = ({
  content,
  spans,
  onSpanClick
}) => {
  const elements = useMemo(() => {
    if (!spans || spans.length === 0) {
      return [<span key="content">{content}</span>];
    }

    const sortedSpans = [...spans].sort((a, b) => a.startIndex - b.startIndex);
    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedSpans.forEach((span) => {
      const start = Math.max(0, Math.min(span.startIndex, content.length));
      const end = Math.max(start, Math.min(span.endIndex, content.length));

      if (start > lastIndex) {
        result.push(
          <span key={`text-${lastIndex}`}>{content.slice(lastIndex, start)}</span>
        );
      }

      const displayText = content.slice(start, end);
      const style = SPAN_STYLES[span.type] || '';

      if (span.type === 'entity') {
        result.push(
          <span key={span.id} className={style}>{displayText}</span>
        );
      } else {
        result.push(
          <button
            key={span.id}
            onClick={() => onSpanClick?.(span)}
            className={style}
            aria-label={`Explore ${span.text}`}
            data-testid={`span-${span.type}`}
          >
            {displayText}
          </button>
        );
      }

      lastIndex = end;
    });

    if (lastIndex < content.length) {
      result.push(
        <span key={`text-${lastIndex}`}>{content.slice(lastIndex)}</span>
      );
    }

    return result;
  }, [content, spans, onSpanClick]);

  return <span className="whitespace-pre-wrap">{elements}</span>;
};

export default SpanRenderer;
