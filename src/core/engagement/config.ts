// src/core/engagement/config.ts

// BULLETPROOF: Derive valid lenses from the actual persona definitions
// This ensures VALID_LENSES can NEVER be out of sync with DEFAULT_PERSONAS
import { DEFAULT_PERSONAS, getEnabledPersonas } from '../../../data/default-personas';

// Runtime-derived list of valid lens IDs (from enabled personas)
export const VALID_LENSES = getEnabledPersonas().map(p => p.id);

// Type is derived from the actual persona IDs
export type ValidLens = string;

// Runtime validation - checks against actual personas, not a hardcoded list
export function isValidLens(lens: string): boolean {
  // Allow custom lenses (custom-*)
  if (lens.startsWith('custom-')) return true;
  // Allow shared/ephemeral lenses (shared-*)
  if (lens.startsWith('shared-')) return true;
  // Check against actual persona IDs from DEFAULT_PERSONAS
  return lens in DEFAULT_PERSONAS;
}

export const ENTROPY_CONFIG = {
  defaultThreshold: 0.7,
  minValue: 0,
  maxValue: 1,
  resetValue: 0,
} as const;

export type EntropyConfig = typeof ENTROPY_CONFIG;
