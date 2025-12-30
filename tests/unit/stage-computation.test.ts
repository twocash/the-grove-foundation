import { describe, it, expect } from 'vitest';
import { computeMomentStage, MOMENT_STAGE_THRESHOLDS } from '../../src/core/config/defaults';

describe('computeMomentStage', () => {
  describe('with default thresholds', () => {
    it('returns ARRIVAL for 0 exchanges', () => {
      expect(computeMomentStage(0)).toBe('ARRIVAL');
    });

    it('returns ORIENTED for 1 exchange', () => {
      expect(computeMomentStage(1)).toBe('ORIENTED');
    });

    it('returns ORIENTED for 2 exchanges', () => {
      expect(computeMomentStage(2)).toBe('ORIENTED');
    });

    it('returns EXPLORING for 3 exchanges', () => {
      expect(computeMomentStage(3)).toBe('EXPLORING');
    });

    it('returns EXPLORING for 4 exchanges', () => {
      expect(computeMomentStage(4)).toBe('EXPLORING');
    });

    it('returns EXPLORING for 5 exchanges', () => {
      expect(computeMomentStage(5)).toBe('EXPLORING');
    });

    it('returns ENGAGED for 6 exchanges', () => {
      expect(computeMomentStage(6)).toBe('ENGAGED');
    });

    it('returns ENGAGED for exchanges above threshold', () => {
      expect(computeMomentStage(10)).toBe('ENGAGED');
      expect(computeMomentStage(50)).toBe('ENGAGED');
      expect(computeMomentStage(100)).toBe('ENGAGED');
    });
  });

  describe('with custom thresholds', () => {
    const customThresholds = {
      ARRIVAL: 0,
      ORIENTED: 5,
      EXPLORING: 10,
      ENGAGED: 20,
    } as typeof MOMENT_STAGE_THRESHOLDS;

    it('returns ARRIVAL for counts below ORIENTED threshold', () => {
      expect(computeMomentStage(0, customThresholds)).toBe('ARRIVAL');
      expect(computeMomentStage(3, customThresholds)).toBe('ARRIVAL');
      expect(computeMomentStage(4, customThresholds)).toBe('ARRIVAL');
    });

    it('returns ORIENTED for counts at or above ORIENTED but below EXPLORING', () => {
      expect(computeMomentStage(5, customThresholds)).toBe('ORIENTED');
      expect(computeMomentStage(7, customThresholds)).toBe('ORIENTED');
      expect(computeMomentStage(9, customThresholds)).toBe('ORIENTED');
    });

    it('returns EXPLORING for counts at or above EXPLORING but below ENGAGED', () => {
      expect(computeMomentStage(10, customThresholds)).toBe('EXPLORING');
      expect(computeMomentStage(15, customThresholds)).toBe('EXPLORING');
      expect(computeMomentStage(19, customThresholds)).toBe('EXPLORING');
    });

    it('returns ENGAGED for counts at or above ENGAGED', () => {
      expect(computeMomentStage(20, customThresholds)).toBe('ENGAGED');
      expect(computeMomentStage(25, customThresholds)).toBe('ENGAGED');
      expect(computeMomentStage(100, customThresholds)).toBe('ENGAGED');
    });
  });

  describe('edge cases', () => {
    it('handles negative counts as ARRIVAL', () => {
      expect(computeMomentStage(-1)).toBe('ARRIVAL');
      expect(computeMomentStage(-100)).toBe('ARRIVAL');
    });

    it('handles fractional counts', () => {
      expect(computeMomentStage(0.5)).toBe('ARRIVAL');
      expect(computeMomentStage(1.5)).toBe('ORIENTED');
      expect(computeMomentStage(5.9)).toBe('EXPLORING');
      expect(computeMomentStage(6.0)).toBe('ENGAGED');
    });

    it('handles very large counts', () => {
      expect(computeMomentStage(Number.MAX_SAFE_INTEGER)).toBe('ENGAGED');
    });
  });

  describe('threshold configuration', () => {
    it('exports MOMENT_STAGE_THRESHOLDS with expected values', () => {
      expect(MOMENT_STAGE_THRESHOLDS.ARRIVAL).toBe(0);
      expect(MOMENT_STAGE_THRESHOLDS.ORIENTED).toBe(1);
      expect(MOMENT_STAGE_THRESHOLDS.EXPLORING).toBe(3);
      expect(MOMENT_STAGE_THRESHOLDS.ENGAGED).toBe(6);
    });

    it('allows different engagement curves via custom thresholds', () => {
      // Aggressive engagement curve
      const aggressive = {
        ARRIVAL: 0,
        ORIENTED: 1,
        EXPLORING: 2,
        ENGAGED: 3,
      } as typeof MOMENT_STAGE_THRESHOLDS;

      expect(computeMomentStage(2, aggressive)).toBe('EXPLORING');
      expect(computeMomentStage(3, aggressive)).toBe('ENGAGED');

      // Gradual engagement curve
      const gradual = {
        ARRIVAL: 0,
        ORIENTED: 3,
        EXPLORING: 8,
        ENGAGED: 15,
      } as typeof MOMENT_STAGE_THRESHOLDS;

      expect(computeMomentStage(2, gradual)).toBe('ARRIVAL');
      expect(computeMomentStage(5, gradual)).toBe('ORIENTED');
      expect(computeMomentStage(10, gradual)).toBe('EXPLORING');
      expect(computeMomentStage(20, gradual)).toBe('ENGAGED');
    });
  });
});
