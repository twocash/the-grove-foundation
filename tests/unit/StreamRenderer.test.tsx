// tests/unit/StreamRenderer.test.tsx
// Unit tests for StreamRenderer component
// Sprint: kinetic-stream-rendering-v1

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StreamRenderer } from '../../components/Terminal/Stream/StreamRenderer';
import type { StreamItem, RhetoricalSpan, JourneyPath } from '../../src/core/schema/stream';

// Mock CognitiveBridge to avoid complex dependencies
vi.mock('../../components/Terminal/CognitiveBridge', () => ({
  default: ({ journeyId, onAccept, onDismiss }: {
    journeyId: string;
    onAccept: () => void;
    onDismiss: () => void;
  }) => (
    <div data-testid="cognitive-bridge" data-journey={journeyId}>
      <button onClick={onAccept}>Accept</button>
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  ),
}));

describe('StreamRenderer', () => {
  // Helper to create stream items
  const createItem = (overrides: Partial<StreamItem> = {}): StreamItem => ({
    id: `item-${Date.now()}`,
    type: 'response',
    timestamp: Date.now(),
    content: 'Test content',
    createdBy: 'ai',
    ...overrides,
  });

  const createQueryItem = (content: string): StreamItem =>
    createItem({ type: 'query', content, createdBy: 'user' });

  const createResponseItem = (content: string): StreamItem =>
    createItem({ type: 'response', content, createdBy: 'ai' });

  const createNavigationItem = (paths: JourneyPath[]): StreamItem =>
    createItem({ type: 'navigation', content: '', suggestedPaths: paths });

  const createSystemItem = (content: string): StreamItem =>
    createItem({ type: 'system', content, createdBy: 'system' });

  describe('basic rendering', () => {
    it('renders empty when no items', () => {
      render(<StreamRenderer items={[]} />);
      expect(screen.getByTestId('stream-renderer')).toBeEmptyDOMElement();
    });

    it('renders multiple items', () => {
      const items = [
        createQueryItem('What is Grove?'),
        createResponseItem('Grove is a foundation.'),
      ];

      render(<StreamRenderer items={items} />);

      expect(screen.getByTestId('query-block')).toBeInTheDocument();
      expect(screen.getByTestId('response-block')).toBeInTheDocument();
    });
  });

  describe('query blocks', () => {
    it('renders query block for user messages', () => {
      const items = [createQueryItem('Tell me about the ratchet')];

      render(<StreamRenderer items={items} />);

      const queryBlock = screen.getByTestId('query-block');
      expect(queryBlock).toHaveTextContent('Tell me about the ratchet');
    });

    it('strips --verbose flag from queries', () => {
      const items = [createQueryItem('Query --verbose')];

      render(<StreamRenderer items={items} />);

      expect(screen.getByTestId('query-block')).toHaveTextContent('Query');
      expect(screen.getByTestId('query-block')).not.toHaveTextContent('--verbose');
    });
  });

  describe('response blocks', () => {
    it('renders response block for AI messages', () => {
      const items = [createResponseItem('This is the response.')];

      render(<StreamRenderer items={items} />);

      expect(screen.getByTestId('response-block')).toHaveTextContent('This is the response.');
    });

    it('shows loading indicator when generating without content', () => {
      const items = [
        createItem({
          type: 'response',
          content: '',
          isGenerating: true,
        }),
      ];

      render(<StreamRenderer items={items} />);

      // LoadingIndicator should be rendered
      expect(screen.getByTestId('response-block')).toBeInTheDocument();
    });

    it('shows blinking cursor when generating with content', () => {
      const items = [
        createItem({
          type: 'response',
          content: 'Partial response...',
          isGenerating: true,
        }),
      ];

      render(<StreamRenderer items={items} />);

      // Check for cursor-blink class
      expect(document.querySelector('.cursor-blink')).toBeInTheDocument();
    });

    it('applies error styling for error messages', () => {
      const items = [createResponseItem('SYSTEM ERROR: Something went wrong')];

      render(<StreamRenderer items={items} />);

      const responseBlock = screen.getByTestId('response-block');
      expect(responseBlock.querySelector('.bg-red-50')).toBeInTheDocument();
    });
  });

  describe('navigation blocks', () => {
    it('renders navigation block with paths', () => {
      const paths: JourneyPath[] = [
        { id: 'path-1', label: 'Learn about ratchet' },
        { id: 'path-2', label: 'Explore infrastructure' },
      ];
      const items = [createNavigationItem(paths)];

      render(<StreamRenderer items={items} />);

      expect(screen.getByTestId('navigation-block')).toBeInTheDocument();
      expect(screen.getByText('Learn about ratchet')).toBeInTheDocument();
      expect(screen.getByText('Explore infrastructure')).toBeInTheDocument();
    });

    it('calls onPathClick when path is clicked', () => {
      const onPathClick = vi.fn();
      const paths: JourneyPath[] = [{ id: 'path-1', label: 'Click me' }];
      const items = [createNavigationItem(paths)];

      render(<StreamRenderer items={items} onPathClick={onPathClick} />);

      fireEvent.click(screen.getByText('Click me'));
      expect(onPathClick).toHaveBeenCalledWith(paths[0]);
    });
  });

  describe('system blocks', () => {
    it('renders system block centered', () => {
      const items = [createSystemItem('Session started')];

      render(<StreamRenderer items={items} />);

      expect(screen.getByTestId('system-block')).toHaveTextContent('Session started');
    });

    it('applies error styling for system errors', () => {
      const items = [createSystemItem('Error: Connection failed')];

      render(<StreamRenderer items={items} />);

      const systemBlock = screen.getByTestId('system-block');
      expect(systemBlock.querySelector('.bg-red-50')).toBeInTheDocument();
    });
  });

  describe('current item handling', () => {
    it('appends currentItem to items', () => {
      const items = [createQueryItem('First query')];
      const currentItem = createResponseItem('Generating...');

      render(<StreamRenderer items={items} currentItem={currentItem} />);

      expect(screen.getByTestId('query-block')).toBeInTheDocument();
      expect(screen.getByTestId('response-block')).toBeInTheDocument();
    });

    it('handles null currentItem', () => {
      const items = [createQueryItem('Query')];

      render(<StreamRenderer items={items} currentItem={null} />);

      expect(screen.getByTestId('query-block')).toBeInTheDocument();
    });
  });

  describe('cognitive bridge integration', () => {
    it('renders cognitive bridge after specific message', () => {
      const items = [createResponseItem('Triggering message')];
      items[0].id = 'trigger-msg';

      const bridgeState = {
        visible: true,
        afterMessageId: 'trigger-msg',
        journeyId: 'journey-1',
        topicMatch: { hubId: 'hub-1', confidence: 0.9 },
      };

      render(
        <StreamRenderer
          items={items}
          bridgeState={bridgeState}
          onBridgeAccept={() => {}}
          onBridgeDismiss={() => {}}
        />
      );

      expect(screen.getByTestId('cognitive-bridge')).toBeInTheDocument();
    });

    it('does not render bridge when not visible', () => {
      const items = [createResponseItem('Message')];

      const bridgeState = {
        visible: false,
        afterMessageId: items[0].id,
        journeyId: 'journey-1',
        topicMatch: { hubId: 'hub-1', confidence: 0.9 },
      };

      render(<StreamRenderer items={items} bridgeState={bridgeState} />);

      expect(screen.queryByTestId('cognitive-bridge')).not.toBeInTheDocument();
    });

    it('calls onBridgeAccept when bridge is accepted', () => {
      const onBridgeAccept = vi.fn();
      const items = [createResponseItem('Message')];
      items[0].id = 'msg-1';

      const bridgeState = {
        visible: true,
        afterMessageId: 'msg-1',
        journeyId: 'journey-1',
        topicMatch: { hubId: 'hub-1', confidence: 0.9 },
      };

      render(
        <StreamRenderer
          items={items}
          bridgeState={bridgeState}
          onBridgeAccept={onBridgeAccept}
          onBridgeDismiss={() => {}}
        />
      );

      fireEvent.click(screen.getByText('Accept'));
      expect(onBridgeAccept).toHaveBeenCalled();
    });
  });

  describe('span click handling', () => {
    it('passes onSpanClick to response blocks', () => {
      const onSpanClick = vi.fn();
      const span: RhetoricalSpan = {
        id: 'span-1',
        text: 'Ratchet',
        type: 'concept',
        startIndex: 0,
        endIndex: 7,
        confidence: 1.0,
      };

      const items = [
        createItem({
          type: 'response',
          content: 'Ratchet Effect explained',
          parsedSpans: [span],
        }),
      ];

      render(<StreamRenderer items={items} onSpanClick={onSpanClick} />);

      fireEvent.click(screen.getByTestId('span-concept'));
      expect(onSpanClick).toHaveBeenCalledWith(span);
    });
  });

  describe('unknown item types', () => {
    it('handles reveal type gracefully', () => {
      const items = [createItem({ type: 'reveal', content: 'Reveal content' })];

      // Should not crash, reveal blocks return null
      render(<StreamRenderer items={items} />);
      expect(screen.getByTestId('stream-renderer')).toBeInTheDocument();
    });

    it('logs warning for unknown types', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const items = [createItem({ type: 'unknown' as any, content: 'Unknown' })];

      render(<StreamRenderer items={items} />);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown stream item type')
      );
      consoleSpy.mockRestore();
    });
  });
});
