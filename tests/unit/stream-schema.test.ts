// tests/unit/stream-schema.test.ts
// Unit tests for stream schema type guards and types
// Sprint: kinetic-stream-reset-v2

import { describe, it, expect } from 'vitest';
import {
  isQueryItem,
  isResponseItem,
  isNavigationItem,
  isSystemItem,
  hasSpans,
  hasPaths,
  hasNavigation,
  fromChatMessage,
  type StreamItem,
  type QueryStreamItem,
  type ResponseStreamItem,
  type NavigationStreamItem,
  type SystemStreamItem,
  type RhetoricalSpan,
  type JourneyPath,
  type JourneyFork
} from '../../src/core/schema/stream';

describe('Stream Schema', () => {
  describe('isQueryItem', () => {
    it('returns true for query items', () => {
      const item: StreamItem = {
        id: 'q1',
        type: 'query',
        content: 'What is Grove?',
        timestamp: Date.now(),
        role: 'user',
        createdBy: 'user'
      };

      expect(isQueryItem(item)).toBe(true);
    });

    it('returns false for response items', () => {
      const item: StreamItem = {
        id: 'r1',
        type: 'response',
        content: 'Grove is...',
        timestamp: Date.now(),
        role: 'assistant',
        createdBy: 'ai',
        isGenerating: false
      };

      expect(isQueryItem(item)).toBe(false);
    });

    it('returns false for navigation items', () => {
      const item: StreamItem = {
        id: 'n1',
        type: 'navigation',
        timestamp: Date.now(),
        forks: [],
        sourceResponseId: 'r1'
      };

      expect(isQueryItem(item)).toBe(false);
    });

    it('returns false for system items', () => {
      const item: StreamItem = {
        id: 's1',
        type: 'system',
        content: 'Session started',
        timestamp: Date.now(),
        createdBy: 'system'
      };

      expect(isQueryItem(item)).toBe(false);
    });
  });

  describe('isResponseItem', () => {
    it('returns true for response items', () => {
      const item: StreamItem = {
        id: 'r1',
        type: 'response',
        content: 'Response text',
        timestamp: Date.now(),
        role: 'assistant',
        createdBy: 'ai',
        isGenerating: false
      };

      expect(isResponseItem(item)).toBe(true);
    });

    it('returns false for query items', () => {
      const item: StreamItem = {
        id: 'q1',
        type: 'query',
        content: 'Query',
        timestamp: Date.now(),
        role: 'user',
        createdBy: 'user'
      };

      expect(isResponseItem(item)).toBe(false);
    });
  });

  describe('isNavigationItem', () => {
    it('returns true for navigation items', () => {
      const item: StreamItem = {
        id: 'n1',
        type: 'navigation',
        timestamp: Date.now(),
        forks: [{ id: 'f1', label: 'Option', type: 'pivot' }],
        sourceResponseId: 'r1'
      };

      expect(isNavigationItem(item)).toBe(true);
    });

    it('returns false for other types', () => {
      const item: StreamItem = {
        id: 'r1',
        type: 'response',
        content: 'Text',
        timestamp: Date.now(),
        role: 'assistant',
        createdBy: 'ai',
        isGenerating: false
      };

      expect(isNavigationItem(item)).toBe(false);
    });
  });

  describe('isSystemItem', () => {
    it('returns true for system items', () => {
      const item: StreamItem = {
        id: 's1',
        type: 'system',
        content: 'System message',
        timestamp: Date.now(),
        createdBy: 'system'
      };

      expect(isSystemItem(item)).toBe(true);
    });

    it('returns false for other types', () => {
      const item: StreamItem = {
        id: 'q1',
        type: 'query',
        content: 'Query',
        timestamp: Date.now(),
        role: 'user',
        createdBy: 'user'
      };

      expect(isSystemItem(item)).toBe(false);
    });
  });

  describe('hasSpans', () => {
    it('returns true when response has parsedSpans', () => {
      const spans: RhetoricalSpan[] = [
        { id: 's1', text: 'Ratchet', type: 'concept', startIndex: 0, endIndex: 7, confidence: 1 }
      ];

      const item: ResponseStreamItem = {
        id: 'r1',
        type: 'response',
        content: 'Ratchet effect',
        timestamp: Date.now(),
        role: 'assistant',
        createdBy: 'ai',
        isGenerating: false,
        parsedSpans: spans
      };

      expect(hasSpans(item)).toBe(true);
    });

    it('returns false when parsedSpans is empty', () => {
      const item: ResponseStreamItem = {
        id: 'r1',
        type: 'response',
        content: 'Text',
        timestamp: Date.now(),
        role: 'assistant',
        createdBy: 'ai',
        isGenerating: false,
        parsedSpans: []
      };

      expect(hasSpans(item)).toBe(false);
    });

    it('returns false when parsedSpans is undefined', () => {
      const item: ResponseStreamItem = {
        id: 'r1',
        type: 'response',
        content: 'Text',
        timestamp: Date.now(),
        role: 'assistant',
        createdBy: 'ai',
        isGenerating: false
      };

      expect(hasSpans(item)).toBe(false);
    });

    it('returns false for non-response items', () => {
      const item: QueryStreamItem = {
        id: 'q1',
        type: 'query',
        content: 'Query',
        timestamp: Date.now(),
        role: 'user',
        createdBy: 'user'
      };

      expect(hasSpans(item)).toBe(false);
    });
  });

  describe('hasPaths', () => {
    it('returns true when response has suggestedPaths', () => {
      const paths: JourneyPath[] = [
        { id: 'p1', label: 'Learn more' }
      ];

      const item: ResponseStreamItem = {
        id: 'r1',
        type: 'response',
        content: 'Text',
        timestamp: Date.now(),
        role: 'assistant',
        createdBy: 'ai',
        isGenerating: false,
        suggestedPaths: paths
      };

      expect(hasPaths(item)).toBe(true);
    });

    it('returns false when suggestedPaths is empty', () => {
      const item: ResponseStreamItem = {
        id: 'r1',
        type: 'response',
        content: 'Text',
        timestamp: Date.now(),
        role: 'assistant',
        createdBy: 'ai',
        isGenerating: false,
        suggestedPaths: []
      };

      expect(hasPaths(item)).toBe(false);
    });

    it('returns false when suggestedPaths is undefined', () => {
      const item: ResponseStreamItem = {
        id: 'r1',
        type: 'response',
        content: 'Text',
        timestamp: Date.now(),
        role: 'assistant',
        createdBy: 'ai',
        isGenerating: false
      };

      expect(hasPaths(item)).toBe(false);
    });
  });

  describe('hasNavigation', () => {
    it('returns true when response has navigation forks', () => {
      const forks: JourneyFork[] = [
        { id: 'f1', label: 'Deep dive', type: 'deep_dive' }
      ];

      const item: ResponseStreamItem = {
        id: 'r1',
        type: 'response',
        content: 'Text',
        timestamp: Date.now(),
        role: 'assistant',
        createdBy: 'ai',
        isGenerating: false,
        navigation: forks
      };

      expect(hasNavigation(item)).toBe(true);
    });

    it('returns false when navigation is empty', () => {
      const item: ResponseStreamItem = {
        id: 'r1',
        type: 'response',
        content: 'Text',
        timestamp: Date.now(),
        role: 'assistant',
        createdBy: 'ai',
        isGenerating: false,
        navigation: []
      };

      expect(hasNavigation(item)).toBe(false);
    });

    it('returns false when navigation is undefined', () => {
      const item: ResponseStreamItem = {
        id: 'r1',
        type: 'response',
        content: 'Text',
        timestamp: Date.now(),
        role: 'assistant',
        createdBy: 'ai',
        isGenerating: false
      };

      expect(hasNavigation(item)).toBe(false);
    });

    it('returns false for non-response items', () => {
      const item: QueryStreamItem = {
        id: 'q1',
        type: 'query',
        content: 'Query',
        timestamp: Date.now(),
        role: 'user',
        createdBy: 'user'
      };

      expect(hasNavigation(item)).toBe(false);
    });
  });

  describe('fromChatMessage', () => {
    it('creates query item from user message', () => {
      // ChatMessage uses 'text' field, not 'content'
      const message = {
        id: 'msg-1',
        role: 'user' as const,
        text: 'What is Grove?'
      };

      const item = fromChatMessage(message);

      expect(item.type).toBe('query');
      expect(item.content).toBe('What is Grove?');
      expect(item.role).toBe('user');
      expect(item.id).toBe('msg-1');
      expect(item.timestamp).toBeTruthy();
    });

    it('creates response item from assistant message', () => {
      const message = {
        id: 'msg-2',
        role: 'assistant' as const,
        text: 'Grove is a foundation...'
      };

      const item = fromChatMessage(message);

      expect(item.type).toBe('response');
      expect(item.content).toBe('Grove is a foundation...');
      expect(item.role).toBe('assistant');
      if (isResponseItem(item)) {
        expect(item.isGenerating).toBe(false);
        expect(item.createdBy).toBe('ai');
      }
    });

    it('creates response item with isGenerating from streaming message', () => {
      const message = {
        id: 'msg-3',
        role: 'assistant' as const,
        text: 'Streaming...',
        isStreaming: true
      };

      const item = fromChatMessage(message);

      expect(item.type).toBe('response');
      if (isResponseItem(item)) {
        expect(item.isGenerating).toBe(true);
      }
    });

    it('preserves message ID in stream item', () => {
      const message = { id: 'unique-id-123', role: 'user' as const, text: 'Test' };

      const item = fromChatMessage(message);

      expect(item.id).toBe('unique-id-123');
    });
  });

  describe('type narrowing in switch statements', () => {
    it('correctly narrows types in switch', () => {
      const items: StreamItem[] = [
        { id: 'q1', type: 'query', content: 'Q', timestamp: 0, role: 'user', createdBy: 'user' },
        { id: 'r1', type: 'response', content: 'R', timestamp: 0, role: 'assistant', createdBy: 'ai', isGenerating: false },
        { id: 'n1', type: 'navigation', timestamp: 0, forks: [], sourceResponseId: 'r1' },
        { id: 's1', type: 'system', content: 'S', timestamp: 0, createdBy: 'system' }
      ];

      const results: string[] = [];

      for (const item of items) {
        switch (item.type) {
          case 'query':
            // TypeScript should narrow to QueryStreamItem
            results.push(`query:${item.content}`);
            break;
          case 'response':
            // TypeScript should narrow to ResponseStreamItem
            results.push(`response:${item.content}:${item.isGenerating}`);
            break;
          case 'navigation':
            // TypeScript should narrow to NavigationStreamItem
            results.push(`navigation:${item.forks.length}`);
            break;
          case 'system':
            // TypeScript should narrow to SystemStreamItem
            results.push(`system:${item.content}`);
            break;
        }
      }

      expect(results).toEqual([
        'query:Q',
        'response:R:false',
        'navigation:0',
        'system:S'
      ]);
    });
  });

  describe('JourneyFork type', () => {
    it('has required fields', () => {
      const fork: JourneyFork = {
        id: 'fork-1',
        label: 'Learn more',
        type: 'deep_dive'
      };

      expect(fork.id).toBe('fork-1');
      expect(fork.label).toBe('Learn more');
      expect(fork.type).toBe('deep_dive');
    });

    it('supports optional fields', () => {
      const fork: JourneyFork = {
        id: 'fork-1',
        label: 'Apply this',
        type: 'apply',
        targetId: 'target-123',
        queryPayload: 'Full query text',
        context: 'Additional context'
      };

      expect(fork.targetId).toBe('target-123');
      expect(fork.queryPayload).toBe('Full query text');
      expect(fork.context).toBe('Additional context');
    });

    it('accepts all valid fork types', () => {
      const types: Array<JourneyFork['type']> = ['deep_dive', 'pivot', 'apply'];

      types.forEach(type => {
        const fork: JourneyFork = { id: '1', label: 'Test', type };
        expect(fork.type).toBe(type);
      });
    });
  });
});
