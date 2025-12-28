// src/core/transformers/RhetoricalParser.ts
// Parse markdown content to extract rhetorical spans
// Sprint: kinetic-stream-schema-v1

import type { RhetoricalSpan, RhetoricalSpanType } from '../schema/stream';

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export interface ParseResult {
  spans: RhetoricalSpan[];
  content: string;
}

// ─────────────────────────────────────────────────────────────────
// PATTERNS
// ─────────────────────────────────────────────────────────────────

const PATTERNS = {
  bold: /\*\*([^*]+)\*\*/g,
  arrow: /^(?:→|->)\s+(.+)$/gm,
} as const;

// ─────────────────────────────────────────────────────────────────
// ID GENERATION
// ─────────────────────────────────────────────────────────────────

let spanIdCounter = 0;

function generateSpanId(): string {
  return `span_${++spanIdCounter}_${Date.now()}`;
}

// Reset counter (useful for testing)
export function resetSpanIdCounter(): void {
  spanIdCounter = 0;
}

// ─────────────────────────────────────────────────────────────────
// PARSER
// ─────────────────────────────────────────────────────────────────

export function parse(content: string): ParseResult {
  if (!content) {
    return { spans: [], content: '' };
  }

  const spans: RhetoricalSpan[] = [];
  let match: RegExpExecArray | null;

  // Extract bold (concepts)
  const boldRegex = new RegExp(PATTERNS.bold.source, 'g');
  while ((match = boldRegex.exec(content)) !== null) {
    spans.push({
      id: generateSpanId(),
      text: match[1],
      type: 'concept',
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      confidence: 1.0
    });
  }

  // Extract arrows (actions)
  const arrowRegex = new RegExp(PATTERNS.arrow.source, 'gm');
  while ((match = arrowRegex.exec(content)) !== null) {
    spans.push({
      id: generateSpanId(),
      text: match[1],
      type: 'action',
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      confidence: 1.0
    });
  }

  // Sort by position
  spans.sort((a, b) => a.startIndex - b.startIndex);

  return { spans, content };
}

export function parseByType(
  content: string,
  type: RhetoricalSpanType
): RhetoricalSpan[] {
  return parse(content).spans.filter(s => s.type === type);
}

export function hasRhetoricalContent(content: string): boolean {
  if (!content) return false;
  // Need to reset regex lastIndex for test() to work correctly
  const boldTest = new RegExp(PATTERNS.bold.source, 'g');
  const arrowTest = new RegExp(PATTERNS.arrow.source, 'gm');
  return boldTest.test(content) || arrowTest.test(content);
}
