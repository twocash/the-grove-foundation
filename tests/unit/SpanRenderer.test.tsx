// tests/unit/SpanRenderer.test.tsx
// Unit tests for SpanRenderer component
// Sprint: kinetic-stream-rendering-v1

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpanRenderer } from '../../components/Terminal/Stream/SpanRenderer';
import type { RhetoricalSpan } from '../../src/core/schema/stream';

describe('SpanRenderer', () => {
  // Helper to create spans
  const createSpan = (
    overrides: Partial<RhetoricalSpan> = {}
  ): RhetoricalSpan => ({
    id: 'span-1',
    text: 'test',
    type: 'concept',
    startIndex: 0,
    endIndex: 4,
    confidence: 1.0,
    ...overrides,
  });

  describe('basic rendering', () => {
    it('renders plain content when no spans provided', () => {
      render(<SpanRenderer content="Hello world" spans={[]} />);
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('renders content with empty spans array', () => {
      render(<SpanRenderer content="Plain text" spans={[]} />);
      expect(screen.getByText('Plain text')).toBeInTheDocument();
    });
  });

  describe('concept spans', () => {
    it('renders concept span as button', () => {
      const span = createSpan({
        text: 'Ratchet',
        type: 'concept',
        startIndex: 0,
        endIndex: 7,
      });

      render(<SpanRenderer content="Ratchet Effect" spans={[span]} />);

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Ratchet');
      expect(button).toHaveClass('font-bold');
    });

    it('applies concept styling with CSS variables', () => {
      const span = createSpan({
        text: 'concept',
        type: 'concept',
        startIndex: 5,
        endIndex: 12,
      });

      render(<SpanRenderer content="This concept is key" spans={[span]} />);

      const button = screen.getByTestId('span-concept');
      expect(button).toHaveClass('text-[var(--chat-concept-text)]');
    });

    it('calls onSpanClick when concept is clicked', () => {
      const onSpanClick = vi.fn();
      const span = createSpan({
        text: 'clickable',
        type: 'concept',
        startIndex: 0,
        endIndex: 9,
      });

      render(
        <SpanRenderer
          content="clickable"
          spans={[span]}
          onSpanClick={onSpanClick}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      expect(onSpanClick).toHaveBeenCalledWith(span);
    });
  });

  describe('action spans', () => {
    it('renders action span as button', () => {
      const span = createSpan({
        text: 'learn more',
        type: 'action',
        startIndex: 0,
        endIndex: 10,
      });

      render(<SpanRenderer content="learn more about it" spans={[span]} />);

      const button = screen.getByTestId('span-action');
      expect(button).toHaveTextContent('learn more');
    });

    it('applies action styling', () => {
      const span = createSpan({
        text: 'explore',
        type: 'action',
        startIndex: 0,
        endIndex: 7,
      });

      render(<SpanRenderer content="explore this" spans={[span]} />);

      const button = screen.getByTestId('span-action');
      expect(button).toHaveClass('text-[var(--chat-action-text)]');
      expect(button).toHaveClass('hover:underline');
    });
  });

  describe('entity spans', () => {
    it('renders entity span as non-interactive text', () => {
      const span = createSpan({
        text: 'Grove Foundation',
        type: 'entity',
        startIndex: 4,
        endIndex: 20,
      });

      render(<SpanRenderer content="The Grove Foundation" spans={[span]} />);

      // Entity should NOT be a button
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.getByText('Grove Foundation')).toHaveClass('italic');
    });

    it('does not trigger click handler for entity spans', () => {
      const onSpanClick = vi.fn();
      const span = createSpan({
        text: 'Entity',
        type: 'entity',
        startIndex: 0,
        endIndex: 6,
      });

      render(
        <SpanRenderer
          content="Entity name"
          spans={[span]}
          onSpanClick={onSpanClick}
        />
      );

      // Entity is not clickable, so no button to click
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('multiple spans', () => {
    it('renders multiple spans in order', () => {
      const spans: RhetoricalSpan[] = [
        createSpan({ id: 's1', text: 'First', type: 'concept', startIndex: 0, endIndex: 5 }),
        createSpan({ id: 's2', text: 'second', type: 'action', startIndex: 10, endIndex: 16 }),
      ];

      render(<SpanRenderer content="First and second" spans={spans} />);

      expect(screen.getByTestId('span-concept')).toHaveTextContent('First');
      expect(screen.getByTestId('span-action')).toHaveTextContent('second');
    });

    it('preserves text between spans', () => {
      const spans: RhetoricalSpan[] = [
        createSpan({ id: 's1', text: 'A', type: 'concept', startIndex: 0, endIndex: 1 }),
        createSpan({ id: 's2', text: 'B', type: 'concept', startIndex: 6, endIndex: 7 }),
      ];

      render(<SpanRenderer content="A and B" spans={spans} />);

      // Check that " and " is preserved between spans
      expect(screen.getByText(/and/)).toBeInTheDocument();
    });

    it('handles overlapping spans gracefully', () => {
      const spans: RhetoricalSpan[] = [
        createSpan({ id: 's1', text: 'overlap', type: 'concept', startIndex: 0, endIndex: 7 }),
        createSpan({ id: 's2', text: 'lap', type: 'action', startIndex: 4, endIndex: 7 }),
      ];

      // Should not crash
      render(<SpanRenderer content="overlap" spans={spans} />);
      expect(screen.getByText(/over/)).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles spans at end of content', () => {
      const span = createSpan({
        text: 'end',
        type: 'concept',
        startIndex: 12,  // "At the very end" - "end" starts at index 12
        endIndex: 15,
      });

      render(<SpanRenderer content="At the very end" spans={[span]} />);
      expect(screen.getByTestId('span-concept')).toHaveTextContent('end');
    });

    it('handles empty content gracefully', () => {
      render(<SpanRenderer content="" spans={[]} />);
      // Should not crash
    });

    it('handles spans with out-of-bounds indices', () => {
      const span = createSpan({
        text: 'test',
        type: 'concept',
        startIndex: 100,
        endIndex: 104,
      });

      // Should not crash
      render(<SpanRenderer content="Short" spans={[span]} />);
      expect(screen.getByText('Short')).toBeInTheDocument();
    });

    it('clamps negative indices to 0', () => {
      const span = createSpan({
        text: 'Test',
        type: 'concept',
        startIndex: -5,
        endIndex: 4,
      });

      render(<SpanRenderer content="Test text" spans={[span]} />);
      // Should handle gracefully
      expect(screen.getByText(/Test/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('includes aria-label for interactive spans', () => {
      const span = createSpan({
        text: 'Ratchet Effect',
        type: 'concept',
        startIndex: 0,
        endIndex: 14,
      });

      render(<SpanRenderer content="Ratchet Effect" spans={[span]} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Explore Ratchet Effect');
    });
  });
});
