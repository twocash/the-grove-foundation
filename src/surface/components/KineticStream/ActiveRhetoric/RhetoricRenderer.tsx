// src/surface/components/KineticStream/ActiveRhetoric/RhetoricRenderer.tsx
// Renders content with concept spans injected
// Sprint: kinetic-experience-v1

import React, { useMemo } from 'react';
import type { RhetoricalSpan } from '@core/schema/stream';
import { ConceptSpan } from './ConceptSpan';

export interface RhetoricRendererProps {
  content: string;
  spans: RhetoricalSpan[];
  onSpanClick?: (span: RhetoricalSpan) => void;
}

interface ContentSegment {
  type: 'text' | 'span';
  content: string;
  span?: RhetoricalSpan;
}

export const RhetoricRenderer: React.FC<RhetoricRendererProps> = ({
  content,
  spans,
  onSpanClick
}) => {
  const segments = useMemo(() => {
    if (!spans || spans.length === 0) {
      return [{ type: 'text' as const, content }];
    }

    // Sort spans by start index
    const sortedSpans = [...spans].sort((a, b) => a.startIndex - b.startIndex);
    const result: ContentSegment[] = [];
    let lastIndex = 0;

    for (const span of sortedSpans) {
      // Add text before this span
      if (span.startIndex > lastIndex) {
        result.push({
          type: 'text',
          content: content.slice(lastIndex, span.startIndex)
        });
      }

      // Add the span
      result.push({
        type: 'span',
        content: span.text,
        span
      });

      lastIndex = span.endIndex;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      result.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }

    return result;
  }, [content, spans]);

  return (
    <div className="text-[var(--glass-text-body)] leading-relaxed font-sans">
      {segments.map((segment, index) => {
        if (segment.type === 'span' && segment.span) {
          return (
            <ConceptSpan
              key={`span-${index}`}
              span={segment.span}
              onClick={onSpanClick}
            />
          );
        }
        // Render text with basic formatting
        return (
          <span
            key={`text-${index}`}
            dangerouslySetInnerHTML={{
              __html: formatText(segment.content)
            }}
          />
        );
      })}
    </div>
  );
};

function formatText(text: string): string {
  return text
    .replace(/\n\n/g, '</p><p class="mt-3">')
    .replace(/\n/g, '<br />');
}

export default RhetoricRenderer;
