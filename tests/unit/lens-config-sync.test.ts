// tests/unit/lens-config-sync.test.ts
// Regression tests for lens configuration synchronization
// BULLETPROOF: VALID_LENSES is now derived from DEFAULT_PERSONAS at runtime
// These tests verify the derivation works correctly

import { describe, test, expect } from 'vitest';
import { VALID_LENSES, isValidLens } from '../../src/core/engagement/config';
import { DEFAULT_PERSONAS, getEnabledPersonas } from '../../data/default-personas';

describe('Lens Configuration Sync', () => {
  describe('VALID_LENSES is derived from DEFAULT_PERSONAS', () => {
    test('VALID_LENSES contains exactly the enabled persona IDs', () => {
      const enabledPersonas = getEnabledPersonas();
      const enabledIds = enabledPersonas.map(p => p.id);

      // VALID_LENSES should be derived from enabled personas
      expect(VALID_LENSES).toEqual(enabledIds);
    });

    test('VALID_LENSES length matches enabled personas count', () => {
      const enabledPersonas = getEnabledPersonas();
      expect(VALID_LENSES.length).toBe(enabledPersonas.length);
    });

    test('isValidLens uses DEFAULT_PERSONAS directly', () => {
      // All persona IDs in DEFAULT_PERSONAS should be valid
      for (const id of Object.keys(DEFAULT_PERSONAS)) {
        expect(isValidLens(id)).toBe(true);
      }
    });
  });

  describe('isValidLens function', () => {
    test('validates all enabled persona IDs', () => {
      const enabledPersonas = getEnabledPersonas();

      for (const persona of enabledPersonas) {
        expect(isValidLens(persona.id)).toBe(true);
      }
    });

    test('validates specific known persona IDs', () => {
      // These are the actual persona IDs that should always work
      const knownPersonaIds = [
        'freestyle',
        'concerned-citizen',
        'academic',
        'engineer',
        'geopolitical',
        'big-ai-exec',
        'family-office',
        'simulation-theorist',
      ];

      for (const id of knownPersonaIds) {
        expect(isValidLens(id)).toBe(true);
      }
    });

    test('validates custom lens prefixes', () => {
      expect(isValidLens('custom-abc123')).toBe(true);
      expect(isValidLens('custom-my-lens')).toBe(true);
    });

    test('validates shared lens prefixes', () => {
      expect(isValidLens('shared-xyz789')).toBe(true);
      expect(isValidLens('shared-1234567890')).toBe(true);
    });

    test('rejects invalid lens IDs', () => {
      expect(isValidLens('invalid')).toBe(false);
      expect(isValidLens('citizen')).toBe(false); // OLD wrong ID
      expect(isValidLens('investor')).toBe(false); // OLD wrong ID
      expect(isValidLens('policymaker')).toBe(false); // OLD wrong ID
      expect(isValidLens('')).toBe(false);
    });
  });

  describe('Regression: Old wrong values should NOT be valid', () => {
    // These were the old wrong values that caused the bug
    test('old incorrect persona IDs are rejected', () => {
      const oldWrongValues = ['citizen', 'investor', 'policymaker'];

      for (const wrongId of oldWrongValues) {
        expect(isValidLens(wrongId)).toBe(false);
      }
    });
  });
});
