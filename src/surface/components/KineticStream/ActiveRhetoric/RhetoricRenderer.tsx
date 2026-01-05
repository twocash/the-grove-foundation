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
    <div className="text-[#94a3b8] leading-relaxed font-mono">
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
  let result = text;

  // IMPORTANT: This renders inside a <span>, so only use INLINE elements
  // No block elements (<p>, <div>, <ul>, <ol>) allowed!

  // Handle list numbers: "...sentence. 2." → line break before number
  // Using <br> for line breaks since we're in inline context
  result = result.replace(/\.\s*(\d+)\.\s*/g, '.<br/><br/><strong class="text-[#d97706]">$1.</strong> ');

  // Handle standalone numbers at start: "1." → styled number
  result = result.replace(/^(\d+)\.\s*/gm, '<strong class="text-[#d97706]">$1.</strong> ');

  // Handle bullet points: "* item" → bullet character with line break
  result = result.replace(/^[*-]\s+/gm, '<br/>• ');

  // Bold: **text** → <strong>
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#d97706]">$1</strong>');

  // Italics: *text* → <em>
  result = result.replace(/(?<![<\w*])\*([^*<>]+)\*(?![>\w])/g, '<em class="italic text-[#cbd5e1]">$1</em>');

  // Paragraph breaks → double line break
  result = result.replace(/\n\n/g, '<br/><br/>');
  result = result.replace(/\n/g, ' ');

  return result;
}

export default RhetoricRenderer;
