/**
 * A/B Testing Utilities
 * Deterministic variant selection based on session ID
 */

import { HookVariant } from '../src/core/schema/ab-testing';

const SESSION_KEY = 'grove-session-id';

/**
 * Get or create a persistent session ID
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';

  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Simple hash function for deterministic selection
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Select a variant deterministically based on session ID and element ID
 * Same session + element always gets the same variant
 */
export function selectVariant(
  variants: HookVariant[],
  sessionId: string,
  elementId: string
): HookVariant {
  if (!variants || variants.length === 0) {
    throw new Error('No variants provided');
  }

  if (variants.length === 1) {
    return variants[0];
  }

  // Calculate total weight
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);

  // Generate deterministic random value from session + element
  const hash = hashString(`${sessionId}-${elementId}`);
  const threshold = hash % totalWeight;

  // Select variant based on weight
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (threshold < cumulative) {
      return variant;
    }
  }

  // Fallback to last variant
  return variants[variants.length - 1];
}

/**
 * Get variant for a specific hook
 */
export function getHookVariant(
  sectionId: string,
  hookIndex: number,
  variants: HookVariant[]
): HookVariant {
  const sessionId = getSessionId();
  const elementId = `hook-${sectionId}-${hookIndex}`;
  return selectVariant(variants, sessionId, elementId);
}
