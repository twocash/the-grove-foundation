// src/data/prompts/index.ts
// Prompt library loader
// Sprint: genesis-context-fields-v1 (Epic 2)

import type { PromptObject } from '@core/context-fields/types';

// Import prompt data files
import basePrompts from './base.prompts.json';
import drChiangPrompts from './dr-chiang.prompts.json';
import wayneTurnerPrompts from './wayne-turner.prompts.json';

/**
 * All library prompts combined
 */
export const libraryPrompts: PromptObject[] = [
  ...(basePrompts as PromptObject[]),
  ...(drChiangPrompts as PromptObject[]),
  ...(wayneTurnerPrompts as PromptObject[]),
];

/**
 * Get prompts by source type
 */
export function getPromptsBySource(source: 'library' | 'generated' | 'user'): PromptObject[] {
  return libraryPrompts.filter(p => p.source === source);
}

/**
 * Get prompts by lens affinity
 */
export function getPromptsForLens(lensId: string): PromptObject[] {
  return libraryPrompts.filter(p =>
    p.lensAffinities.some(a => a.lensId === lensId)
  );
}

/**
 * Get prompt by ID
 */
export function getPromptById(id: string): PromptObject | undefined {
  return libraryPrompts.find(p => p.id === id);
}

/**
 * Get active prompts only
 */
export function getActivePrompts(): PromptObject[] {
  return libraryPrompts.filter(p => p.status === 'active');
}

// Re-export for convenience
export { basePrompts, drChiangPrompts, wayneTurnerPrompts };
