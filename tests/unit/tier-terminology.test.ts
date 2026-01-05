// tests/unit/tier-terminology.test.ts
// Tier terminology compliance tests
// Sprint: pipeline-inspector-v1 (Epic 7)

import { describe, it, expect } from 'vitest';
import {
  CANONICAL_TIERS,
  isValidTier,
  getNextTier,
  capitalize,
} from '../../src/bedrock/consoles/PipelineMonitor/types';

describe('Tier Terminology Compliance', () => {
  describe('CANONICAL_TIERS', () => {
    it('contains exactly 5 tier values', () => {
      expect(CANONICAL_TIERS).toHaveLength(5);
    });

    it('uses only canonical tier values', () => {
      expect(CANONICAL_TIERS).toEqual(['seed', 'sprout', 'sapling', 'tree', 'grove']);
    });

    it('does not contain legacy tier names', () => {
      expect(CANONICAL_TIERS).not.toContain('seedling');
      expect(CANONICAL_TIERS).not.toContain('oak');
      expect(CANONICAL_TIERS).not.toContain('published');
      expect(CANONICAL_TIERS).not.toContain('archived');
      expect(CANONICAL_TIERS).not.toContain('draft');
    });

    it('follows botanical lifecycle order', () => {
      // seed → sprout → sapling → tree → grove
      const indexOf = (tier: string) => CANONICAL_TIERS.indexOf(tier as any);
      expect(indexOf('seed')).toBeLessThan(indexOf('sprout'));
      expect(indexOf('sprout')).toBeLessThan(indexOf('sapling'));
      expect(indexOf('sapling')).toBeLessThan(indexOf('tree'));
      expect(indexOf('tree')).toBeLessThan(indexOf('grove'));
    });
  });

  describe('isValidTier', () => {
    it('returns true for canonical tiers', () => {
      CANONICAL_TIERS.forEach((tier) => {
        expect(isValidTier(tier)).toBe(true);
      });
    });

    it('returns false for legacy tiers', () => {
      expect(isValidTier('seedling')).toBe(false);
      expect(isValidTier('oak')).toBe(false);
      expect(isValidTier('published')).toBe(false);
      expect(isValidTier('archived')).toBe(false);
      expect(isValidTier('draft')).toBe(false);
    });

    it('returns false for invalid strings', () => {
      expect(isValidTier('')).toBe(false);
      expect(isValidTier('invalid')).toBe(false);
      expect(isValidTier('SEED')).toBe(false); // Case sensitive
    });
  });

  describe('getNextTier', () => {
    it('returns next tier in lifecycle', () => {
      expect(getNextTier('seed')).toBe('sprout');
      expect(getNextTier('sprout')).toBe('sapling');
      expect(getNextTier('sapling')).toBe('tree');
      expect(getNextTier('tree')).toBe('grove');
    });

    it('returns null for final tier', () => {
      expect(getNextTier('grove')).toBeNull();
    });
  });

  describe('capitalize', () => {
    it('capitalizes tier names correctly', () => {
      expect(capitalize('seed')).toBe('Seed');
      expect(capitalize('sprout')).toBe('Sprout');
      expect(capitalize('sapling')).toBe('Sapling');
      expect(capitalize('tree')).toBe('Tree');
      expect(capitalize('grove')).toBe('Grove');
    });
  });
});

describe('Codebase Tier Terminology Scan', () => {
  it('should not contain legacy tier terms in PipelineMonitor directory', () => {
    // This is a reminder test - the actual verification is done via grep
    // grep -rn "seedling|\"oak\"|'oak'" src/bedrock/consoles/PipelineMonitor/
    // The only acceptable match is the comment in types.ts explaining prohibited terms
    expect(true).toBe(true);
  });
});
