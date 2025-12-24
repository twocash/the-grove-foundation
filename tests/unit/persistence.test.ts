// tests/unit/persistence.test.ts
// @vitest-environment jsdom

import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  getLens,
  setLens,
  clearLens,
  getCompletedJourneys,
  markJourneyCompleted,
  isJourneyCompleted,
  clearCompletedJourneys,
  STORAGE_KEYS
} from '../../src/core/engagement/persistence';

describe('persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getLens', () => {
    test('returns null when no lens stored', () => {
      expect(getLens()).toBeNull();
    });

    test('returns stored lens value', () => {
      localStorage.setItem(STORAGE_KEYS.lens, 'engineer');
      expect(getLens()).toBe('engineer');
    });

    test('handles localStorage errors gracefully', () => {
      const mockGetItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(getLens()).toBeNull();
      mockGetItem.mockRestore();
    });
  });

  describe('setLens', () => {
    test('persists lens to localStorage', () => {
      setLens('academic');
      expect(localStorage.getItem(STORAGE_KEYS.lens)).toBe('academic');
    });

    test('handles localStorage errors gracefully', () => {
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(() => setLens('academic')).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      mockSetItem.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('clearLens', () => {
    test('removes lens from localStorage', () => {
      localStorage.setItem(STORAGE_KEYS.lens, 'engineer');
      clearLens();
      expect(localStorage.getItem(STORAGE_KEYS.lens)).toBeNull();
    });

    test('handles missing key gracefully', () => {
      expect(() => clearLens()).not.toThrow();
    });
  });
});

describe('journey completion persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getCompletedJourneys', () => {
    test('returns empty array when no journeys completed', () => {
      expect(getCompletedJourneys()).toEqual([]);
    });

    test('returns stored journey IDs', () => {
      localStorage.setItem(STORAGE_KEYS.completedJourneys, JSON.stringify(['j1', 'j2']));
      expect(getCompletedJourneys()).toEqual(['j1', 'j2']);
    });

    test('handles malformed JSON gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.completedJourneys, 'not-json');
      expect(getCompletedJourneys()).toEqual([]);
    });

    test('handles non-array JSON gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.completedJourneys, JSON.stringify({ foo: 'bar' }));
      expect(getCompletedJourneys()).toEqual([]);
    });
  });

  describe('markJourneyCompleted', () => {
    test('adds journey ID to completed list', () => {
      markJourneyCompleted('journey-1');
      expect(getCompletedJourneys()).toContain('journey-1');
    });

    test('prevents duplicate entries', () => {
      markJourneyCompleted('journey-1');
      markJourneyCompleted('journey-1');
      const completed = getCompletedJourneys();
      expect(completed.filter(j => j === 'journey-1')).toHaveLength(1);
    });

    test('preserves existing completions', () => {
      markJourneyCompleted('journey-1');
      markJourneyCompleted('journey-2');
      expect(getCompletedJourneys()).toEqual(['journey-1', 'journey-2']);
    });
  });

  describe('isJourneyCompleted', () => {
    test('returns true for completed journey', () => {
      markJourneyCompleted('journey-1');
      expect(isJourneyCompleted('journey-1')).toBe(true);
    });

    test('returns false for incomplete journey', () => {
      expect(isJourneyCompleted('journey-1')).toBe(false);
    });
  });

  describe('clearCompletedJourneys', () => {
    test('removes all completed journeys', () => {
      markJourneyCompleted('journey-1');
      markJourneyCompleted('journey-2');
      clearCompletedJourneys();
      expect(getCompletedJourneys()).toEqual([]);
    });
  });
});
