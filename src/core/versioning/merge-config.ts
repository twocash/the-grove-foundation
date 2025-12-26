// src/core/versioning/merge-config.ts
// Declarative merge configuration for versioned collections
// Sprint: versioned-collection-refactor-v1

import type { GroveObjectType } from '@core/schema/grove-object';
import type { StoredObject } from './schema';

export interface MetaFieldMapping {
  /** Field name in versioned meta (e.g., 'title') */
  source: string;
  /** Field name in schema item (e.g., 'publicLabel') */
  target: string;
}

export interface PayloadFieldMapping {
  /** Field name in versioned payload */
  source: string;
  /** Field name in schema item (defaults to source if not specified) */
  target?: string;
}

/**
 * Declarative configuration for merging versioned data over schema data.
 * Follows DEX principle: domain logic in config, not code.
 */
export interface MergeConfig {
  metaFields: MetaFieldMapping[];
  payloadFields: PayloadFieldMapping[];
}

/**
 * Registry of merge configs per object type.
 * To add a new versioned collection, add an entry here - no code changes needed.
 */
export const MERGE_CONFIGS: Partial<Record<GroveObjectType, MergeConfig>> = {
  lens: {
    metaFields: [
      { source: 'title', target: 'publicLabel' },
      { source: 'description', target: 'description' },
      { source: 'icon', target: 'icon' },
    ],
    payloadFields: [
      { source: 'color' },
      { source: 'toneGuidance' },
      { source: 'narrativeStyle' },
    ],
  },
  journey: {
    metaFields: [
      { source: 'title', target: 'title' },
      { source: 'description', target: 'description' },
    ],
    payloadFields: [
      { source: 'targetAha' },
      { source: 'estimatedMinutes' },
    ],
  },
};

/**
 * Apply merge config to combine versioned data over schema item.
 * Pure function - no side effects.
 */
export function applyMergeConfig<T extends Record<string, unknown>>(
  item: T,
  stored: StoredObject,
  config: MergeConfig
): T & { versionOrdinal: number; hasLocalModifications: true } {
  const meta = stored.current.meta as Record<string, unknown>;
  const payload = stored.current.payload as Record<string, unknown>;

  const merged = { ...item } as Record<string, unknown>;

  // Apply meta field mappings
  for (const { source, target } of config.metaFields) {
    const value = meta[source];
    if (value !== undefined && value !== null && value !== '') {
      merged[target] = value;
    }
  }

  // Apply payload field mappings
  for (const { source, target } of config.payloadFields) {
    const targetKey = target ?? source;
    const value = payload[source];
    if (value !== undefined && value !== null && value !== '') {
      merged[targetKey] = value;
    }
  }

  return {
    ...merged,
    versionOrdinal: stored.versionCount,
    hasLocalModifications: true,
  } as T & { versionOrdinal: number; hasLocalModifications: true };
}
