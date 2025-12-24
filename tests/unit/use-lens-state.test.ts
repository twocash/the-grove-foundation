// tests/unit/use-lens-state.test.ts
// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createActor } from 'xstate';
import { engagementMachine } from '../../src/core/engagement';
import { useLensState } from '../../src/core/engagement/hooks/useLensState';
import { STORAGE_KEYS } from '../../src/core/engagement/persistence';

describe('useLensState', () => {
  let actor: ReturnType<typeof createActor<typeof engagementMachine>>;

  beforeEach(() => {
    localStorage.clear();
    // Reset URL
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true,
    });
    actor = createActor(engagementMachine);
    actor.start();
  });

  afterEach(() => {
    actor.stop();
  });

  describe('initialization', () => {
    test('starts with isHydrated false then true', async () => {
      const { result } = renderHook(() => useLensState({ actor }));

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });
    });

    test('returns null lens when no source', async () => {
      const { result } = renderHook(() => useLensState({ actor }));

      await waitFor(() => expect(result.current.isHydrated).toBe(true));

      expect(result.current.lens).toBeNull();
      expect(result.current.lensSource).toBeNull();
    });
  });

  describe('URL hydration', () => {
    test('reads lens from URL parameter', async () => {
      Object.defineProperty(window, 'location', {
        value: { search: '?lens=engineer' },
        writable: true,
      });

      const { result } = renderHook(() => useLensState({ actor }));

      await waitFor(() => {
        expect(result.current.lens).toBe('engineer');
      });
      expect(result.current.lensSource).toBe('url');
    });

    test('ignores invalid URL lens', async () => {
      Object.defineProperty(window, 'location', {
        value: { search: '?lens=invalid' },
        writable: true,
      });

      const { result } = renderHook(() => useLensState({ actor }));

      await waitFor(() => expect(result.current.isHydrated).toBe(true));

      expect(result.current.lens).toBeNull();
    });

    test('URL takes priority over localStorage', async () => {
      localStorage.setItem(STORAGE_KEYS.lens, 'citizen');
      Object.defineProperty(window, 'location', {
        value: { search: '?lens=engineer' },
        writable: true,
      });

      const { result } = renderHook(() => useLensState({ actor }));

      await waitFor(() => {
        expect(result.current.lens).toBe('engineer');
      });
      expect(result.current.lensSource).toBe('url');
    });
  });

  describe('localStorage hydration', () => {
    test('reads lens from localStorage when no URL param', async () => {
      localStorage.setItem(STORAGE_KEYS.lens, 'academic');

      const { result } = renderHook(() => useLensState({ actor }));

      await waitFor(() => {
        expect(result.current.lens).toBe('academic');
      });
      expect(result.current.lensSource).toBe('localStorage');
    });

    test('ignores invalid stored lens', async () => {
      localStorage.setItem(STORAGE_KEYS.lens, 'invalid');

      const { result } = renderHook(() => useLensState({ actor }));

      await waitFor(() => expect(result.current.isHydrated).toBe(true));

      expect(result.current.lens).toBeNull();
    });
  });

  describe('lens selection', () => {
    test('selectLens updates machine state', async () => {
      const { result } = renderHook(() => useLensState({ actor }));

      await waitFor(() => expect(result.current.isHydrated).toBe(true));

      act(() => {
        result.current.selectLens('investor');
      });

      expect(result.current.lens).toBe('investor');
      expect(result.current.lensSource).toBe('selection');
    });

    test('selectLens rejects invalid lens', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(() => useLensState({ actor }));

      await waitFor(() => expect(result.current.isHydrated).toBe(true));

      act(() => {
        result.current.selectLens('invalid');
      });

      expect(result.current.lens).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('persists selection to localStorage', async () => {
      const { result } = renderHook(() => useLensState({ actor }));

      await waitFor(() => expect(result.current.isHydrated).toBe(true));

      act(() => {
        result.current.selectLens('policymaker');
      });

      expect(localStorage.getItem(STORAGE_KEYS.lens)).toBe('policymaker');
    });
  });

  describe('machine sync', () => {
    test('updates when machine state changes externally', async () => {
      const { result } = renderHook(() => useLensState({ actor }));

      await waitFor(() => expect(result.current.isHydrated).toBe(true));

      act(() => {
        actor.send({ type: 'SELECT_LENS', lens: 'citizen', source: 'selection' });
      });

      expect(result.current.lens).toBe('citizen');
    });
  });
});
