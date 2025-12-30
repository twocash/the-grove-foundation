// src/surface/components/KineticStream/Capture/utils/sproutAdapter.ts
// Adapter utilities for sprout data transformations
// Sprint: kinetic-cultivation-v1

import type { Sprout, SproutProvenance } from '@core/schema/sprout';

/**
 * Legacy sprout format (pre-provenance)
 */
interface LegacySprout extends Omit<Sprout, 'provenance'> {
  personaId?: string;
  journeyId?: string;
  query?: string;
  nodeId?: string;
}

/**
 * Flatten nested provenance to legacy format
 * Use for backward compatibility with older consumers
 */
export function flattenSprout(sprout: Sprout): LegacySprout {
  const { provenance, ...rest } = sprout;
  return {
    ...rest,
    personaId: provenance?.lens?.id ?? rest.personaId ?? undefined,
    journeyId: provenance?.journey?.id ?? rest.journeyId ?? undefined,
    nodeId: provenance?.node?.id ?? rest.nodeId ?? undefined,
    query: rest.query,
  };
}

/**
 * Nest flat fields into provenance structure
 * Use when migrating legacy data
 */
export function nestSprout(legacy: LegacySprout): Sprout {
  const provenance: SproutProvenance = {
    lens: legacy.personaId ? { id: legacy.personaId, name: legacy.personaId } : null,
    hub: null,
    journey: legacy.journeyId ? { id: legacy.journeyId, name: legacy.journeyId } : null,
    node: legacy.nodeId ? { id: legacy.nodeId, name: legacy.nodeId } : null,
    knowledgeFiles: [],
    generatedAt: legacy.capturedAt,
  };

  // Map old status to new stage (sprout-declarative-v1)
  const stageMap: Record<string, Sprout['stage']> = {
    'sprout': 'tender',
    'sapling': 'rooting',
    'tree': 'established'
  };
  const stage = (legacy as Sprout).stage ?? stageMap[legacy.status] ?? 'tender';

  return {
    ...legacy,
    provenance,
    personaId: legacy.personaId ?? null,
    journeyId: legacy.journeyId ?? null,
    hubId: null,
    nodeId: legacy.nodeId ?? null,
    status: legacy.status ?? 'sprout',
    stage,
    creatorId: legacy.creatorId ?? null,
  };
}

/**
 * Check if sprout has nested provenance format
 */
export function hasNestedProvenance(sprout: Sprout): boolean {
  return Boolean(sprout.provenance);
}

/**
 * Migrate legacy sprout to current format
 */
export function migrateSprout(sprout: Sprout | LegacySprout): Sprout {
  if (hasNestedProvenance(sprout as Sprout)) {
    return sprout as Sprout;
  }
  return nestSprout(sprout as LegacySprout);
}
