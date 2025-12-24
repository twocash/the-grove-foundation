// tests/unit/use-entropy-state.test.ts
// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createActor } from 'xstate';
import { engagementMachine, ENTROPY_CONFIG } from '../../src/core/engagement';
import { useEntropyState } from '../../src/core/engagement/hooks/useEntropyState';

describe('useEntropyState', () => {
  let actor: ReturnType<typeof createActor<typeof engagementMachine>>;

  beforeEach(() => {
    actor = createActor(engagementMachine);
    actor.start();
  });

  afterEach(() => {
    actor.stop();
  });

  describe('state derivation', () => {
    test('derives entropy from machine context', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));
      expect(result.current.entropy).toBe(0);
    });

    test('derives entropyThreshold from machine context', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));
      expect(result.current.entropyThreshold).toBe(ENTROPY_CONFIG.defaultThreshold);
    });
  });

  describe('computed values', () => {
    test('isHighEntropy false when entropy below threshold', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));
      expect(result.current.isHighEntropy).toBe(false);
    });

    test('isHighEntropy true when entropy at threshold', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));

      act(() => {
        result.current.updateEntropy(0.7);
      });

      expect(result.current.isHighEntropy).toBe(true);
    });

    test('isHighEntropy true when entropy above threshold', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));

      act(() => {
        result.current.updateEntropy(0.9);
      });

      expect(result.current.isHighEntropy).toBe(true);
    });

    test('entropyPercent calculates correctly', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));

      act(() => {
        result.current.updateEntropy(0.5);
      });

      expect(result.current.entropyPercent).toBe(50);
    });
  });

  describe('updateEntropy action', () => {
    test('increases entropy by delta', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));

      act(() => {
        result.current.updateEntropy(0.3);
      });

      expect(result.current.entropy).toBe(0.3);
    });

    test('decreases entropy by negative delta', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));

      act(() => {
        result.current.updateEntropy(0.5);
        result.current.updateEntropy(-0.2);
      });

      expect(result.current.entropy).toBeCloseTo(0.3);
    });

    test('clamps entropy at maxValue', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));

      act(() => {
        result.current.updateEntropy(1.5);
      });

      expect(result.current.entropy).toBe(ENTROPY_CONFIG.maxValue);
    });

    test('clamps entropy at minValue', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));

      act(() => {
        result.current.updateEntropy(-0.5);
      });

      expect(result.current.entropy).toBe(ENTROPY_CONFIG.minValue);
    });
  });

  describe('resetEntropy action', () => {
    test('resets entropy to 0', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));

      act(() => {
        result.current.updateEntropy(0.8);
      });

      expect(result.current.entropy).toBe(0.8);

      act(() => {
        result.current.resetEntropy();
      });

      expect(result.current.entropy).toBe(0);
    });

    test('no-op when already at 0', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));

      expect(result.current.entropy).toBe(0);

      act(() => {
        result.current.resetEntropy();
      });

      expect(result.current.entropy).toBe(0);
    });
  });
});
