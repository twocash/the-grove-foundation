// src/bedrock/consoles/LensWorkshop/lens-transforms.ts
// Transform functions between legacy Persona and GroveObject<LensPayload>
// Migration: MIGRATION-001-lens

import type { Persona } from '../../../../data/narratives-schema';
import type { GroveObject } from '../../../core/schema/grove-object';
import type { LensPayload } from '../../types/lens';
import { DEFAULT_LENS_PAYLOAD } from '../../types/lens';

/**
 * Convert legacy Persona to GroveObject<LensPayload>
 */
export function personaToLens(persona: Persona): GroveObject<LensPayload> {
  return {
    meta: {
      id: persona.id,
      type: 'lens',
      title: persona.publicLabel,
      description: persona.description,
      icon: persona.icon,
      status: persona.enabled ? 'active' : 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    payload: {
      color: persona.color,
      toneGuidance: persona.toneGuidance,
      systemPrompt: persona.systemPrompt,
      openingTemplate: persona.openingTemplate,
      narrativeStyle: persona.narrativeStyle,
      arcEmphasis: { ...persona.arcEmphasis },
      openingPhase: persona.openingPhase,
      vocabularyLevel: persona.vocabularyLevel ?? 'accessible',
      emotionalRegister: persona.emotionalRegister ?? 'warm',
      defaultThreadLength: persona.defaultThreadLength,
      entryPoints: [...persona.entryPoints],
      suggestedThread: [...persona.suggestedThread],
    },
  };
}

/**
 * Convert GroveObject<LensPayload> back to legacy Persona
 * Used for backward compatibility with existing Terminal/Genesis code
 */
export function lensToPersona(lens: GroveObject<LensPayload>): Persona {
  return {
    id: lens.meta.id,
    publicLabel: lens.meta.title,
    description: lens.meta.description ?? '',
    icon: lens.meta.icon ?? 'Compass',
    color: lens.payload.color,
    enabled: lens.meta.status === 'active',
    toneGuidance: lens.payload.toneGuidance,
    systemPrompt: lens.payload.systemPrompt,
    openingTemplate: lens.payload.openingTemplate,
    narrativeStyle: lens.payload.narrativeStyle,
    arcEmphasis: { ...lens.payload.arcEmphasis },
    openingPhase: lens.payload.openingPhase,
    vocabularyLevel: lens.payload.vocabularyLevel,
    emotionalRegister: lens.payload.emotionalRegister,
    defaultThreadLength: lens.payload.defaultThreadLength,
    entryPoints: [...lens.payload.entryPoints],
    suggestedThread: [...lens.payload.suggestedThread],
  };
}

/**
 * Create a new lens with default values
 */
export function createDefaultLens(overrides?: Partial<LensPayload>): GroveObject<LensPayload> {
  const id = `lens-${Date.now()}`;
  return {
    meta: {
      id,
      type: 'lens',
      title: 'New Lens',
      description: 'A new persona lens',
      icon: 'Compass',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    payload: {
      ...DEFAULT_LENS_PAYLOAD,
      toneGuidance: '[PERSONA: New Lens]\nDescribe the tone and approach for this persona...',
      ...overrides,
    },
  };
}
