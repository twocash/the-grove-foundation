// tests/unit/lens-config-sync.test.ts
// Regression tests for lens configuration synchronization
// These tests prevent the bug where VALID_LENSES in engagement config
// didn't match actual persona IDs in default-personas.ts

import { describe, test, expect } from 'vitest';
import { VALID_LENSES, isValidLens } from '../../src/core/engagement/config';
import { DEFAULT_PERSONAS, getEnabledPersonas } from '../../data/default-personas';

describe('Lens Configuration Sync', () => {
  describe('VALID_LENSES matches DEFAULT_PERSONAS', () => {
    test('every enabled persona ID should be in VALID_LENSES', () => {
      const enabledPersonas = getEnabledPersonas();
      const missingFromConfig: string[] = [];

      for (const persona of enabledPersonas) {
        if (!VALID_LENSES.includes(persona.id as any)) {
          missingFromConfig.push(persona.id);
        }
      }

      expect(missingFromConfig).toEqual([]);
      if (missingFromConfig.length > 0) {
        throw new Error(
          `Persona IDs missing from VALID_LENSES: ${missingFromConfig.join(', ')}\n` +
          `Add these to src/core/engagement/config.ts VALID_LENSES array.`
        );
      }
    });

    test('every VALID_LENS should exist in DEFAULT_PERSONAS', () => {
      const invalidLenses: string[] = [];

      for (const lens of VALID_LENSES) {
        if (!DEFAULT_PERSONAS[lens]) {
          invalidLenses.push(lens);
        }
      }

      expect(invalidLenses).toEqual([]);
      if (invalidLenses.length > 0) {
        throw new Error(
          `VALID_LENSES contains non-existent personas: ${invalidLenses.join(', ')}\n` +
          `Remove these from src/core/engagement/config.ts or add to data/default-personas.ts.`
        );
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
