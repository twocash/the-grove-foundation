// src/core/schema/experience-4d.ts
// 4D Experience Model Type Aliases
// Sprint: terminology-migration-4d
//
// This module provides the canonical 4D Experience Model type names
// with backward-compatible aliases for gradual migration.
//
// Terminology Mapping:
// | Legacy Term | 4D Term             | Description                        |
// |-------------|---------------------|------------------------------------|
// | Hub         | ExperiencePath      | Declarative route through content  |
// | Journey     | ExperienceSequence  | Ordered collection of experiences  |
// | Node        | ExperienceMoment    | Single interaction point           |
// | TopicHub    | CognitiveDomain     | Knowledge area for routing         |

import type { TopicHub, Journey, JourneyNode } from './narrative';

// ============================================================================
// 4D EXPERIENCE MODEL - CANONICAL TYPES
// ============================================================================

/**
 * CognitiveDomain - Knowledge area for routing queries
 *
 * Replaces the legacy "TopicHub" terminology.
 * A cognitive domain represents a conceptual area that groups
 * related content and provides specialized framing.
 *
 * @see TopicHub for the underlying type definition
 */
export type CognitiveDomain = TopicHub;

/**
 * ExperienceSequence - Ordered collection of experiences
 *
 * Replaces the legacy "Journey" terminology.
 * An experience sequence is a curated path through content
 * designed for progressive understanding.
 *
 * @see Journey for the underlying type definition
 */
export type ExperienceSequence = Journey;

/**
 * ExperienceMoment - Single interaction point
 *
 * Replaces the legacy "JourneyNode" terminology.
 * An experience moment is an individual step within a sequence,
 * representing a discrete learning or interaction opportunity.
 *
 * @see JourneyNode for the underlying type definition
 */
export type ExperienceMoment = JourneyNode;

// ============================================================================
// LEGACY ALIASES WITH DEPRECATION WARNINGS
// ============================================================================

/**
 * @deprecated Use `CognitiveDomain` instead.
 * This alias is provided for backward compatibility during migration.
 *
 * Migration: Replace `Hub` with `CognitiveDomain` in your code.
 * The underlying type is unchanged - only the name is updated.
 */
export type Hub = CognitiveDomain;

/**
 * @deprecated Use `ExperienceSequence` instead.
 * This alias is provided for backward compatibility during migration.
 *
 * Migration: Replace `Sequence` with `ExperienceSequence` in your code.
 * The underlying type is unchanged - only the name is updated.
 */
export type Sequence = ExperienceSequence;

/**
 * @deprecated Use `ExperienceMoment` instead.
 * This alias is provided for backward compatibility during migration.
 *
 * Migration: Replace `Moment` with `ExperienceMoment` in your code.
 * The underlying type is unchanged - only the name is updated.
 */
export type Moment = ExperienceMoment;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for CognitiveDomain (TopicHub)
 */
export function isCognitiveDomain(obj: unknown): obj is CognitiveDomain {
  if (typeof obj !== 'object' || obj === null) return false;
  const domain = obj as Record<string, unknown>;
  return (
    typeof domain.id === 'string' &&
    typeof domain.title === 'string' &&
    Array.isArray(domain.tags) &&
    typeof domain.enabled === 'boolean'
  );
}

/**
 * Type guard for ExperienceSequence (Journey)
 */
export function isExperienceSequence(obj: unknown): obj is ExperienceSequence {
  if (typeof obj !== 'object' || obj === null) return false;
  const sequence = obj as Record<string, unknown>;
  return (
    typeof sequence.id === 'string' &&
    typeof sequence.title === 'string' &&
    Array.isArray(sequence.nodes)
  );
}

/**
 * Type guard for ExperienceMoment (JourneyNode)
 */
export function isExperienceMoment(obj: unknown): obj is ExperienceMoment {
  if (typeof obj !== 'object' || obj === null) return false;
  const moment = obj as Record<string, unknown>;
  return (
    typeof moment.cardId === 'string' &&
    typeof moment.sequenceOrder === 'number'
  );
}

// ============================================================================
// MIGRATION UTILITIES
// ============================================================================

/**
 * 4D Experience Model terminology reference
 */
export const EXPERIENCE_4D_TERMINOLOGY = {
  // Legacy → 4D mapping
  hub: 'CognitiveDomain',
  journey: 'ExperienceSequence',
  node: 'ExperienceMoment',
  topicHub: 'CognitiveDomain',
  journeyNode: 'ExperienceMoment',

  // 4D → Legacy mapping (for backward compatibility)
  cognitiveDomain: 'TopicHub',
  experienceSequence: 'Journey',
  experienceMoment: 'JourneyNode',
} as const;

/**
 * Get the 4D terminology for a legacy term
 */
export function get4DTerminology(legacyTerm: string): string | undefined {
  const normalized = legacyTerm.toLowerCase().replace(/[_-]/g, '');
  return EXPERIENCE_4D_TERMINOLOGY[normalized as keyof typeof EXPERIENCE_4D_TERMINOLOGY];
}
