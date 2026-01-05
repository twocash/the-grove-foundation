// src/core/data/defaults.ts
// Default data for each object type.
// Used when cache is empty AND network fails.

import { DEFAULT_PERSONAS } from '@/data/default-personas';
import type { GroveObject } from '@core/schema/grove-object';
import type { GroveObjectType } from './grove-data-provider';
import type { Persona } from '@/data/narratives-schema';
import type { PromptPayload } from '@core/schema/prompt';
import type { PromptProvenance } from '@core/context-fields/types';

// Import prompt data files
import basePrompts from '@data/prompts/base.prompts.json';
import drChiangPrompts from '@data/prompts/dr-chiang.prompts.json';
import wayneTurnerPrompts from '@data/prompts/wayne-turner.prompts.json';

const EMPTY_DEFAULTS: GroveObject<unknown>[] = [];

// =============================================================================
// Legacy Prompt Type (from JSON files)
// =============================================================================

interface LegacyPrompt {
  id: string;
  objectType: string;
  created: number;
  modified: number;
  author: string;
  label: string;
  description?: string;
  executionPrompt: string;
  systemContext?: string;
  tags: string[];
  topicAffinities: Array<{ topicId: string; weight: number }>;
  lensAffinities: Array<{ lensId: string; weight: number; labelOverride?: string }>;
  targeting: {
    stages?: string[];
    excludeStages?: string[];
    entropyWindow?: { min?: number; max?: number };
    lensIds?: string[];
    excludeLenses?: string[];
    momentTriggers?: string[];
    requireMoment?: boolean;
    minInteractions?: number;
    afterPromptIds?: string[];
    topicClusters?: string[];
  };
  baseWeight: number;
  stats: {
    impressions: number;
    selections: number;
    completions: number;
    avgEntropyDelta: number;
    avgDwellAfter?: number;
    avgDwellMs?: number;
  };
  status: string;
  source: string;
  sequences?: Array<{
    groupId: string;
    groupType: string;
    order: number;
  }>;
  variant?: string;
  icon?: string;
  provenance?: PromptProvenance;
}

// =============================================================================
// Transformation Functions
// =============================================================================

/**
 * Transform a Persona to GroveObject format.
 * Used for offline fallback.
 */
function personaToGroveObject(persona: Persona): GroveObject<Persona> {
  return {
    meta: {
      id: persona.id,
      type: 'lens',
      title: persona.publicLabel,
      description: persona.description,
      icon: persona.icon,
      color: persona.color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: persona.enabled ? 'active' : 'draft',
    },
    payload: persona,
  };
}

/**
 * Transform a legacy prompt to GroveObject<PromptPayload> format.
 * Sprint: exploration-node-unification-v1
 */
function promptToGroveObject(legacy: LegacyPrompt): GroveObject<PromptPayload> {
  const createdAt = new Date(legacy.created).toISOString();
  const updatedAt = new Date(legacy.modified).toISOString();

  return {
    meta: {
      id: legacy.id,
      type: 'prompt',
      title: legacy.label,
      description: legacy.description || '',
      icon: legacy.icon || 'chat',
      status: (legacy.status as 'active' | 'draft' | 'archived') || 'active',
      createdAt,
      updatedAt,
      tags: legacy.tags || [],
    },
    payload: {
      executionPrompt: legacy.executionPrompt,
      systemContext: legacy.systemContext,
      topicAffinities: legacy.topicAffinities || [],
      lensAffinities: legacy.lensAffinities || [],
      targeting: legacy.targeting || {},
      baseWeight: legacy.baseWeight || 50,
      sequences: legacy.sequences || [],
      stats: {
        impressions: legacy.stats?.impressions || 0,
        selections: legacy.stats?.selections || 0,
        completions: legacy.stats?.completions || 0,
        avgEntropyDelta: legacy.stats?.avgEntropyDelta || 0,
        avgDwellMs: legacy.stats?.avgDwellMs || legacy.stats?.avgDwellAfter || 0,
      },
      source: (legacy.source as 'library' | 'generated' | 'user') || 'library',
      // Map provenance from root level to payload.provenance
      provenance: legacy.provenance,
    },
  };
}

/**
 * Get default objects for a type.
 * Called when localStorage is empty and Supabase is unreachable.
 */
export function getDefaults<T>(type: GroveObjectType): GroveObject<T>[] {
  switch (type) {
    case 'lens': {
      // Transform personas to GroveObject format
      const personas = Object.values(DEFAULT_PERSONAS);
      return personas.map(personaToGroveObject) as GroveObject<T>[];
    }
    case 'prompt': {
      // Transform legacy prompts to GroveObject format
      // Sprint: exploration-node-unification-v1
      const allPrompts = [
        ...(basePrompts as LegacyPrompt[]),
        ...(drChiangPrompts as LegacyPrompt[]),
        ...(wayneTurnerPrompts as LegacyPrompt[]),
      ];
      return allPrompts.map(promptToGroveObject) as GroveObject<T>[];
    }
    default:
      return EMPTY_DEFAULTS as GroveObject<T>[];
  }
}
