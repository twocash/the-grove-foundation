// tests/unit/engagement-machine.test.ts

import { describe, test, expect, beforeEach } from 'vitest';
import { createActor, type Actor } from 'xstate';
import {
  engagementMachine,
  type EngagementContext,
  type Journey
} from '../../src/core/engagement';

const mockJourney: Journey = {
  id: 'test-journey',
  name: 'Test Journey',
  hubId: 'test-hub',
  steps: [
    { id: 'step-1', title: 'Step 1', content: 'Content 1' },
    { id: 'step-2', title: 'Step 2', content: 'Content 2' },
    { id: 'step-3', title: 'Step 3', content: 'Content 3' },
  ],
};

describe('Engagement Machine', () => {
  let actor: Actor<typeof engagementMachine>;

  beforeEach(() => {
    actor = createActor(engagementMachine);
    actor.start();
  });

  describe('Initial State', () => {
    test('starts in anonymous session state', () => {
      expect(actor.getSnapshot().matches('session.anonymous')).toBe(true);
    });

    test('starts with terminal closed', () => {
      expect(actor.getSnapshot().matches('terminal.closed')).toBe(true);
    });

    test('starts with null lens', () => {
      expect(actor.getSnapshot().context.lens).toBeNull();
    });

    test('starts with null journey', () => {
      expect(actor.getSnapshot().context.journey).toBeNull();
    });
  });

  describe('Session Transitions', () => {
    test('SELECT_LENS transitions from anonymous to lensActive', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
      expect(actor.getSnapshot().matches('session.lensActive')).toBe(true);
    });

    test('SELECT_LENS sets lens in context', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'url' });
      expect(actor.getSnapshot().context.lens).toBe('engineer');
      expect(actor.getSnapshot().context.lensSource).toBe('url');
    });

    test('CHANGE_LENS updates lens in lensActive', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
      actor.send({ type: 'CHANGE_LENS', lens: 'academic' });
      expect(actor.getSnapshot().context.lens).toBe('academic');
      expect(actor.getSnapshot().context.lensSource).toBe('selection');
    });

    test('START_JOURNEY transitions to journeyActive', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
      actor.send({ type: 'START_JOURNEY', journey: mockJourney });
      expect(actor.getSnapshot().matches('session.journeyActive')).toBe(true);
    });

    test('START_JOURNEY initializes journey context', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
      actor.send({ type: 'START_JOURNEY', journey: mockJourney });
      expect(actor.getSnapshot().context.journey).toEqual(mockJourney);
      expect(actor.getSnapshot().context.journeyProgress).toBe(0);
      expect(actor.getSnapshot().context.journeyTotal).toBe(3);
    });

    test('EXIT_JOURNEY returns to lensActive', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
      actor.send({ type: 'START_JOURNEY', journey: mockJourney });
      actor.send({ type: 'EXIT_JOURNEY' });
      expect(actor.getSnapshot().matches('session.lensActive')).toBe(true);
      expect(actor.getSnapshot().context.journey).toBeNull();
    });

    test('COMPLETE_JOURNEY transitions to journeyComplete', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
      actor.send({ type: 'START_JOURNEY', journey: mockJourney });
      actor.send({ type: 'COMPLETE_JOURNEY' });
      expect(actor.getSnapshot().matches('session.journeyComplete')).toBe(true);
    });
  });

  describe('Terminal Transitions', () => {
    test('OPEN_TERMINAL transitions to open', () => {
      actor.send({ type: 'OPEN_TERMINAL' });
      expect(actor.getSnapshot().matches('terminal.open')).toBe(true);
    });

    test('CLOSE_TERMINAL transitions to closed', () => {
      actor.send({ type: 'OPEN_TERMINAL' });
      actor.send({ type: 'CLOSE_TERMINAL' });
      expect(actor.getSnapshot().matches('terminal.closed')).toBe(true);
    });

    test('terminal state is independent of session state', () => {
      // Start journey
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
      actor.send({ type: 'START_JOURNEY', journey: mockJourney });

      // Open terminal
      actor.send({ type: 'OPEN_TERMINAL' });

      // Both states independent
      expect(actor.getSnapshot().matches('session.journeyActive')).toBe(true);
      expect(actor.getSnapshot().matches('terminal.open')).toBe(true);
    });
  });

  describe('Guards', () => {
    test('START_JOURNEY blocked without lens (hasLens guard)', () => {
      // Try to start journey without lens
      actor.send({ type: 'START_JOURNEY', journey: mockJourney });
      // Should still be anonymous
      expect(actor.getSnapshot().matches('session.anonymous')).toBe(true);
    });

    test('ADVANCE_STEP allowed when not at end', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
      actor.send({ type: 'START_JOURNEY', journey: mockJourney });
      actor.send({ type: 'ADVANCE_STEP' });
      expect(actor.getSnapshot().context.journeyProgress).toBe(1);
    });

    test('ADVANCE_STEP blocked at end (notAtEnd guard)', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
      actor.send({ type: 'START_JOURNEY', journey: mockJourney });
      // Advance to end
      actor.send({ type: 'ADVANCE_STEP' }); // 0 -> 1
      actor.send({ type: 'ADVANCE_STEP' }); // 1 -> 2 (last step)
      // This should be blocked
      actor.send({ type: 'ADVANCE_STEP' });
      expect(actor.getSnapshot().context.journeyProgress).toBe(2);
    });
  });

  describe('Context Updates', () => {
    test('UPDATE_ENTROPY updates entropy value', () => {
      actor.send({ type: 'UPDATE_ENTROPY', value: 0.85 });
      expect(actor.getSnapshot().context.entropy).toBe(0.85);
    });

    test('clearJourney resets journey state', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
      actor.send({ type: 'START_JOURNEY', journey: mockJourney });
      actor.send({ type: 'ADVANCE_STEP' });
      actor.send({ type: 'EXIT_JOURNEY' });

      expect(actor.getSnapshot().context.journey).toBeNull();
      expect(actor.getSnapshot().context.journeyProgress).toBe(0);
      expect(actor.getSnapshot().context.journeyTotal).toBe(0);
    });
  });

  describe('Journey Complete State', () => {
    test('can start new journey from journeyComplete', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
      actor.send({ type: 'START_JOURNEY', journey: mockJourney });
      actor.send({ type: 'COMPLETE_JOURNEY' });

      const newJourney: Journey = {
        id: 'new-journey',
        name: 'New Journey',
        hubId: 'new-hub',
        steps: [{ id: 'step-a', title: 'Step A', content: 'Content A' }],
      };

      actor.send({ type: 'START_JOURNEY', journey: newJourney });
      expect(actor.getSnapshot().matches('session.journeyActive')).toBe(true);
      expect(actor.getSnapshot().context.journey).toEqual(newJourney);
    });

    test('can exit from journeyComplete to lensActive', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
      actor.send({ type: 'START_JOURNEY', journey: mockJourney });
      actor.send({ type: 'COMPLETE_JOURNEY' });
      actor.send({ type: 'EXIT_JOURNEY' });

      expect(actor.getSnapshot().matches('session.lensActive')).toBe(true);
      expect(actor.getSnapshot().context.journey).toBeNull();
    });
  });

  describe('Lens Sources', () => {
    test('tracks URL as lens source', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'academic', source: 'url' });
      expect(actor.getSnapshot().context.lensSource).toBe('url');
    });

    test('tracks localStorage as lens source', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'academic', source: 'localStorage' });
      expect(actor.getSnapshot().context.lensSource).toBe('localStorage');
    });

    test('tracks selection as lens source', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'academic', source: 'selection' });
      expect(actor.getSnapshot().context.lensSource).toBe('selection');
    });
  });
});
