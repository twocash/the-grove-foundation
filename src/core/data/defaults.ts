// src/core/data/defaults.ts
// Default data for each object type.
// Used when cache is empty AND network fails.

import { DEFAULT_PERSONAS } from '@/data/default-personas';
import type { GroveObject } from '@core/schema/grove-object';
import type { GroveObjectType } from './grove-data-provider';
import type { Persona } from '@/data/narratives-schema';

const EMPTY_DEFAULTS: GroveObject<unknown>[] = [];

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
    default:
      return EMPTY_DEFAULTS as GroveObject<T>[];
  }
}
