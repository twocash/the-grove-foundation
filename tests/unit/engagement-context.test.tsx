// tests/unit/engagement-context.test.tsx
// @vitest-environment jsdom

import { describe, test, expect } from 'vitest';
import { render, screen, renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  EngagementProvider,
  useEngagement,
  type EngagementContextValue
} from '../../src/core/engagement/context';
import { useLensState } from '../../src/core/engagement/hooks/useLensState';
import { useJourneyState } from '../../src/core/engagement/hooks/useJourneyState';
import { useEntropyState } from '../../src/core/engagement/hooks/useEntropyState';

describe('EngagementProvider', () => {
  test('renders children', () => {
    render(
      <EngagementProvider>
        <div data-testid="child">Hello</div>
      </EngagementProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  test('provides actor via context', () => {
    let contextValue: EngagementContextValue | null = null;

    function Consumer() {
      contextValue = useEngagement();
      return null;
    }

    render(
      <EngagementProvider>
        <Consumer />
      </EngagementProvider>
    );

    expect(contextValue).not.toBeNull();
    expect(contextValue!.actor).toBeDefined();
  });

  test('actor is started on mount', () => {
    let contextValue: EngagementContextValue | null = null;

    function Consumer() {
      contextValue = useEngagement();
      return null;
    }

    render(
      <EngagementProvider>
        <Consumer />
      </EngagementProvider>
    );

    // Actor should be in a valid state
    expect(contextValue!.actor.getSnapshot()).toBeDefined();
  });
});

describe('useEngagement', () => {
  test('returns context value when inside provider', () => {
    const { result } = renderHook(() => useEngagement(), {
      wrapper: EngagementProvider,
    });

    expect(result.current.actor).toBeDefined();
  });

  test('throws descriptive error when outside provider', () => {
    expect(() => {
      renderHook(() => useEngagement());
    }).toThrow('useEngagement must be used within an EngagementProvider');
  });
});

describe('integration', () => {
  test('multiple consumers share same actor', () => {
    let actor1: any = null;
    let actor2: any = null;

    function Consumer1() {
      const { actor } = useEngagement();
      actor1 = actor;
      return null;
    }

    function Consumer2() {
      const { actor } = useEngagement();
      actor2 = actor;
      return null;
    }

    render(
      <EngagementProvider>
        <Consumer1 />
        <Consumer2 />
      </EngagementProvider>
    );

    expect(actor1).toBe(actor2);
  });

  test('useLensState works via useEngagement', () => {
    function Consumer() {
      const { actor } = useEngagement();
      const { lens, selectLens } = useLensState({ actor });
      return (
        <div>
          <span data-testid="lens">{lens ?? 'none'}</span>
          <button onClick={() => selectLens('engineer')}>Select</button>
        </div>
      );
    }

    render(
      <EngagementProvider>
        <Consumer />
      </EngagementProvider>
    );

    expect(screen.getByTestId('lens').textContent).toBe('none');
  });

  test('all hooks work together via context', () => {
    function Consumer() {
      const { actor } = useEngagement();
      const lens = useLensState({ actor });
      const journey = useJourneyState({ actor });
      const entropy = useEntropyState({ actor });

      return (
        <div>
          <span data-testid="lens">{lens.lens ?? 'none'}</span>
          <span data-testid="journey">{journey.isActive ? 'active' : 'inactive'}</span>
          <span data-testid="entropy">{entropy.entropy}</span>
        </div>
      );
    }

    render(
      <EngagementProvider>
        <Consumer />
      </EngagementProvider>
    );

    expect(screen.getByTestId('lens').textContent).toBe('none');
    expect(screen.getByTestId('journey').textContent).toBe('inactive');
    expect(screen.getByTestId('entropy').textContent).toBe('0');
  });
});
