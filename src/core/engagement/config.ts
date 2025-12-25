// src/core/engagement/config.ts

// FIXED: Updated to match actual persona IDs from data/default-personas.ts
// Also includes custom-* prefix for custom lenses
export const VALID_LENSES = [
  'freestyle',
  'concerned-citizen',
  'academic',
  'engineer',
  'geopolitical',
  'big-ai-exec',
  'family-office',
  'simulation-theorist',
] as const;

export type ValidLens = typeof VALID_LENSES[number];

export function isValidLens(lens: string): boolean {
  // Allow custom lenses (custom-*)
  if (lens.startsWith('custom-')) return true;
  // Allow shared/ephemeral lenses (shared-*)
  if (lens.startsWith('shared-')) return true;
  // Check against known persona IDs
  return VALID_LENSES.includes(lens as ValidLens);
}

export const ENTROPY_CONFIG = {
  defaultThreshold: 0.7,
  minValue: 0,
  maxValue: 1,
  resetValue: 0,
} as const;

export type EntropyConfig = typeof ENTROPY_CONFIG;
