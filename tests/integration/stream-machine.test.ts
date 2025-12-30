// tests/integration/stream-machine.test.ts
// Integration tests for engagement machine stream events
// Sprint: kinetic-stream-reset-v2

import { describe, it, expect, beforeEach } from 'vitest';
import { createActor } from 'xstate';
import { engagementMachine } from '../../src/core/engagement/machine';
import type { RhetoricalSpan, JourneyFork } from '../../src/core/schema/stream';

describe('Engagement Machine - Stream Events', () => {
  let actor: ReturnType<typeof createActor<typeof engagementMachine>>;

  beforeEach(() => {
    actor = createActor(engagementMachine);
    actor.start();
  });

  describe('START_QUERY event', () => {
    it('creates query stream item', () => {
      actor.send({ type: 'START_QUERY', prompt: 'What is Grove?' });

      const state = actor.getSnapshot();
      const item = state.context.currentStreamItem;

      expect(item).not.toBeNull();
      expect(item?.type).toBe('query');
      expect(item?.content).toBe('What is Grove?');
    });

    it('sets createdBy to user', () => {
      actor.send({ type: 'START_QUERY', prompt: 'Test' });

      const item = actor.getSnapshot().context.currentStreamItem;
      expect(item?.createdBy).toBe('user');
    });

    it('generates unique ID', () => {
      actor.send({ type: 'START_QUERY', prompt: 'First' });
      const id1 = actor.getSnapshot().context.currentStreamItem?.id;

      actor.send({ type: 'START_QUERY', prompt: 'Second' });
      const id2 = actor.getSnapshot().context.currentStreamItem?.id;

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });
  });

  describe('START_RESPONSE event', () => {
    it('creates response stream item', () => {
      actor.send({ type: 'START_QUERY', prompt: 'Query' });
      actor.send({ type: 'START_RESPONSE' });

      const item = actor.getSnapshot().context.currentStreamItem;

      expect(item?.type).toBe('response');
      expect(item?.content).toBe('');
    });

    it('sets isGenerating to true', () => {
      actor.send({ type: 'START_QUERY', prompt: 'Query' });
      actor.send({ type: 'START_RESPONSE' });

      const item = actor.getSnapshot().context.currentStreamItem;
      if (item?.type === 'response') {
        expect(item.isGenerating).toBe(true);
      }
    });

    it('adds query to history', () => {
      actor.send({ type: 'START_QUERY', prompt: 'My query' });
      actor.send({ type: 'START_RESPONSE' });

      const history = actor.getSnapshot().context.streamHistory;
      expect(history.length).toBe(1);
      expect(history[0].type).toBe('query');
      expect(history[0].content).toBe('My query');
    });
  });

  describe('STREAM_CHUNK event', () => {
    it('appends chunk to response content', () => {
      actor.send({ type: 'START_QUERY', prompt: 'Query' });
      actor.send({ type: 'START_RESPONSE' });
      actor.send({ type: 'STREAM_CHUNK', chunk: 'Hello' });
      actor.send({ type: 'STREAM_CHUNK', chunk: ' World' });

      const item = actor.getSnapshot().context.currentStreamItem;
      expect(item?.content).toBe('Hello World');
    });

    it('does nothing for non-response items', () => {
      actor.send({ type: 'START_QUERY', prompt: 'Query' });
      actor.send({ type: 'STREAM_CHUNK', chunk: 'Should not appear' });

      const item = actor.getSnapshot().context.currentStreamItem;
      expect(item?.content).toBe('Query');
    });
  });

  describe('FINALIZE_RESPONSE event', () => {
    it('sets isGenerating to false', () => {
      actor.send({ type: 'START_QUERY', prompt: 'Query' });
      actor.send({ type: 'START_RESPONSE' });
      actor.send({ type: 'STREAM_CHUNK', chunk: 'Response text' });
      actor.send({ type: 'FINALIZE_RESPONSE' });

      const item = actor.getSnapshot().context.currentStreamItem;
      if (item?.type === 'response') {
        expect(item.isGenerating).toBe(false);
      }
    });

    it('adds response to history', () => {
      actor.send({ type: 'START_QUERY', prompt: 'Query' });
      actor.send({ type: 'START_RESPONSE' });
      actor.send({ type: 'STREAM_CHUNK', chunk: 'Response' });
      actor.send({ type: 'FINALIZE_RESPONSE' });

      const history = actor.getSnapshot().context.streamHistory;
      // Should have query + response
      expect(history.length).toBe(2);
      expect(history[1].type).toBe('response');
    });

    it('parses rhetorical spans from content', () => {
      actor.send({ type: 'START_QUERY', prompt: 'Query' });
      actor.send({ type: 'START_RESPONSE' });
      // Bold text triggers concept span parsing
      actor.send({ type: 'STREAM_CHUNK', chunk: 'The **Ratchet Effect** is important.' });
      actor.send({ type: 'FINALIZE_RESPONSE' });

      const item = actor.getSnapshot().context.currentStreamItem;
      if (item?.type === 'response') {
        expect(item.parsedSpans).toBeDefined();
        expect(item.parsedSpans?.length).toBeGreaterThan(0);
      }
    });

    it('extracts navigation forks from content', () => {
      actor.send({ type: 'START_QUERY', prompt: 'Query' });
      actor.send({ type: 'START_RESPONSE' });
      actor.send({
        type: 'STREAM_CHUNK',
        chunk: `Response text.

<navigation>
[{"id": "f1", "label": "Learn more", "type": "deep_dive"}]
</navigation>`
      });
      actor.send({ type: 'FINALIZE_RESPONSE' });

      const item = actor.getSnapshot().context.currentStreamItem;
      if (item?.type === 'response') {
        expect(item.navigation).toBeDefined();
        expect(item.navigation?.length).toBe(1);
        expect(item.navigation?.[0].label).toBe('Learn more');
      }
    });

    it('removes navigation block from clean content', () => {
      actor.send({ type: 'START_QUERY', prompt: 'Query' });
      actor.send({ type: 'START_RESPONSE' });
      actor.send({
        type: 'STREAM_CHUNK',
        chunk: `Main content here.

<navigation>
→ Option
</navigation>`
      });
      actor.send({ type: 'FINALIZE_RESPONSE' });

      const item = actor.getSnapshot().context.currentStreamItem;
      expect(item?.content).toBe('Main content here.');
      expect(item?.content).not.toContain('navigation');
    });
  });

  describe('USER.CLICK_PIVOT event', () => {
    it('creates query with pivot context', () => {
      const span: RhetoricalSpan = {
        id: 'span-1',
        text: 'Ratchet Effect',
        type: 'concept',
        startIndex: 0,
        endIndex: 14,
        confidence: 1.0,
        conceptId: 'concept-ratchet'
      };

      actor.send({
        type: 'USER.CLICK_PIVOT',
        span,
        responseId: 'response-123'
      });

      const item = actor.getSnapshot().context.currentStreamItem;

      expect(item?.type).toBe('query');
      expect(item?.content).toContain('Ratchet Effect');
      if (item?.type === 'query') {
        expect(item.pivot).toBeDefined();
        expect(item.pivot?.sourceResponseId).toBe('response-123');
        expect(item.pivot?.sourceText).toBe('Ratchet Effect');
      }
    });

    it('adds pivot query to history', () => {
      const span: RhetoricalSpan = {
        id: 'span-1',
        text: 'Test',
        type: 'concept',
        startIndex: 0,
        endIndex: 4,
        confidence: 1.0
      };

      actor.send({ type: 'USER.CLICK_PIVOT', span, responseId: 'r1' });

      const history = actor.getSnapshot().context.streamHistory;
      expect(history.length).toBe(1);
      expect(history[0].type).toBe('query');
    });
  });

  describe('USER.SELECT_FORK event', () => {
    it('creates query from fork selection', () => {
      const fork: JourneyFork = {
        id: 'fork-1',
        label: 'Explore infrastructure',
        type: 'pivot',
        queryPayload: 'Tell me about the infrastructure bet'
      };

      actor.send({
        type: 'USER.SELECT_FORK',
        fork,
        responseId: 'response-456'
      });

      const item = actor.getSnapshot().context.currentStreamItem;

      expect(item?.type).toBe('query');
      expect(item?.content).toBe('Tell me about the infrastructure bet');
    });

    it('uses label when queryPayload not provided', () => {
      const fork: JourneyFork = {
        id: 'fork-2',
        label: 'Learn more about this',
        type: 'deep_dive'
      };

      actor.send({
        type: 'USER.SELECT_FORK',
        fork,
        responseId: 'r1'
      });

      const item = actor.getSnapshot().context.currentStreamItem;
      expect(item?.content).toBe('Learn more about this');
    });

    it('sets intent from fork type', () => {
      const fork: JourneyFork = {
        id: 'fork-3',
        label: 'Apply this',
        type: 'apply'
      };

      actor.send({ type: 'USER.SELECT_FORK', fork, responseId: 'r1' });

      const item = actor.getSnapshot().context.currentStreamItem;
      if (item?.type === 'query') {
        expect(item.intent).toBe('apply');
      }
    });

    it('adds fork query to history', () => {
      const fork: JourneyFork = {
        id: 'fork-4',
        label: 'Go',
        type: 'pivot'
      };

      actor.send({ type: 'USER.SELECT_FORK', fork, responseId: 'r1' });

      const history = actor.getSnapshot().context.streamHistory;
      expect(history.length).toBe(1);
    });
  });

  describe('full conversation flow', () => {
    it('maintains correct history through query-response cycle', () => {
      // First exchange
      actor.send({ type: 'START_QUERY', prompt: 'Question 1' });
      actor.send({ type: 'START_RESPONSE' });
      actor.send({ type: 'STREAM_CHUNK', chunk: 'Answer 1' });
      actor.send({ type: 'FINALIZE_RESPONSE' });

      // Second exchange
      actor.send({ type: 'START_QUERY', prompt: 'Question 2' });
      actor.send({ type: 'START_RESPONSE' });
      actor.send({ type: 'STREAM_CHUNK', chunk: 'Answer 2' });
      actor.send({ type: 'FINALIZE_RESPONSE' });

      const history = actor.getSnapshot().context.streamHistory;

      expect(history.length).toBe(4);
      expect(history[0].content).toBe('Question 1');
      expect(history[1].content).toBe('Answer 1');
      expect(history[2].content).toBe('Question 2');
      expect(history[3].content).toBe('Answer 2');
    });

    it('handles pivot click mid-conversation', () => {
      // Initial exchange
      actor.send({ type: 'START_QUERY', prompt: 'Initial query' });
      actor.send({ type: 'START_RESPONSE' });
      actor.send({ type: 'STREAM_CHUNK', chunk: 'Response with **concept**' });
      actor.send({ type: 'FINALIZE_RESPONSE' });

      // Pivot click
      const span: RhetoricalSpan = {
        id: 's1',
        text: 'concept',
        type: 'concept',
        startIndex: 14,
        endIndex: 21,
        confidence: 1.0
      };
      actor.send({ type: 'USER.CLICK_PIVOT', span, responseId: 'r1' });

      const history = actor.getSnapshot().context.streamHistory;
      const current = actor.getSnapshot().context.currentStreamItem;

      expect(history.length).toBe(3); // query, response, pivot-query
      expect(current?.type).toBe('query');
      expect(current?.content).toContain('concept');
    });
  });
});
