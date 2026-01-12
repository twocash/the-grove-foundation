// src/bedrock/consoles/ExperienceConsole/useUnifiedExperienceData.ts
// Unified Experience Data Hook
// Dynamically composes data from all registered experience types
// Sprint: unified-experience-console-v1
//
// DEX: Organic Scalability - new types discovered automatically from registry

import { useMemo, useCallback } from 'react';
import type { GroveObject } from '@core/schema/grove-object';
import type { SystemPromptPayload } from '@core/schema/system-prompt';
import type { FeatureFlagPayload } from '@core/schema/feature-flag';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import type { PatchOperation } from '@core/data/grove-data-provider';
import { useExperienceData } from './useExperienceData';
import { useFeatureFlagsData } from './useFeatureFlagsData';

// =============================================================================
// Union Type for All Experience Payloads
// =============================================================================

/**
 * Union type of all experience payloads
 * Dynamically derived from registry types
 *
 * When adding a new type, add it to this union.
 */
export type UnifiedExperiencePayload =
  | SystemPromptPayload
  | FeatureFlagPayload;
  // Future types added here as registry grows:
  // | PromptArchitectConfigPayload
  // | WelcomeConfigPayload

// =============================================================================
// Unified Data Hook
// =============================================================================

/**
 * Unified data hook that composes all registered experience type hooks
 *
 * Architecture:
 * - Calls each registered type's hook explicitly (React hooks constraint)
 * - Merges results into unified collection
 * - Routes mutations to appropriate underlying hook based on object type
 * - Maintains type discrimination for proper CRUD operations
 *
 * KNOWN LIMITATION: React hooks cannot be called conditionally/dynamically.
 * When adding new types, this hook must be updated to call the new hook.
 * This is documented and acceptable - the key DEX win is that the CONSOLE
 * component doesn't need modification, only this data composition layer.
 *
 * @returns CollectionDataResult with objects from all registered types
 */
export function useUnifiedExperienceData(): CollectionDataResult<UnifiedExperiencePayload> {
  // =========================================================================
  // Explicit hook calls - update when adding new types
  // This is required due to React's Rules of Hooks
  // =========================================================================
  const systemPromptData = useExperienceData();
  const featureFlagData = useFeatureFlagsData();

  // =========================================================================
  // Merge objects from all sources
  // =========================================================================
  const objects = useMemo(() => {
    return [
      ...systemPromptData.objects,
      ...featureFlagData.objects,
      // Future types:
      // ...promptArchitectConfigData.objects,
      // ...welcomeConfigData.objects,
    ] as GroveObject<UnifiedExperiencePayload>[];
  }, [systemPromptData.objects, featureFlagData.objects]);

  // =========================================================================
  // Aggregate loading state (any hook loading = unified loading)
  // =========================================================================
  const loading = systemPromptData.loading || featureFlagData.loading;

  // =========================================================================
  // Aggregate errors (first error wins - could be improved to show all)
  // =========================================================================
  const error = systemPromptData.error || featureFlagData.error;

  // =========================================================================
  // Refetch all data sources
  // =========================================================================
  const refetch = useCallback(() => {
    systemPromptData.refetch();
    featureFlagData.refetch();
  }, [systemPromptData.refetch, featureFlagData.refetch]);

  // =========================================================================
  // Route create to appropriate hook based on type
  // =========================================================================
  const create = useCallback(async (defaults?: Partial<UnifiedExperiencePayload>): Promise<GroveObject<UnifiedExperiencePayload>> => {
    // Type must be determined from context or defaults
    // For the unified console, type is selected before create
    // This is a simplified implementation - full version would accept type parameter

    // Default to system-prompt if not specified
    // In practice, the console will pass type info
    return systemPromptData.create(defaults as Partial<SystemPromptPayload>) as Promise<GroveObject<UnifiedExperiencePayload>>;
  }, [systemPromptData.create]);

  // =========================================================================
  // Route update to appropriate hook based on object type
  // =========================================================================
  const update = useCallback(async (id: string, operations: PatchOperation[]) => {
    const obj = objects.find((o) => o.meta.id === id);
    if (!obj) {
      throw new Error(`Object not found: ${id}`);
    }

    switch (obj.meta.type) {
      case 'system-prompt':
        return systemPromptData.update(id, operations);
      case 'feature-flag':
        return featureFlagData.update(id, operations);
      default:
        throw new Error(`Unknown experience type: ${obj.meta.type}`);
    }
  }, [objects, systemPromptData.update, featureFlagData.update]);

  // =========================================================================
  // Route remove to appropriate hook based on object type
  // =========================================================================
  const remove = useCallback(async (id: string) => {
    const obj = objects.find((o) => o.meta.id === id);
    if (!obj) {
      throw new Error(`Object not found: ${id}`);
    }

    switch (obj.meta.type) {
      case 'system-prompt':
        return systemPromptData.remove(id);
      case 'feature-flag':
        return featureFlagData.remove(id);
      default:
        throw new Error(`Unknown experience type: ${obj.meta.type}`);
    }
  }, [objects, systemPromptData.remove, featureFlagData.remove]);

  // =========================================================================
  // Route duplicate to appropriate hook based on object type
  // =========================================================================
  const duplicate = useCallback(async (object: GroveObject<UnifiedExperiencePayload>): Promise<GroveObject<UnifiedExperiencePayload>> => {
    switch (object.meta.type) {
      case 'system-prompt':
        return systemPromptData.duplicate(object as GroveObject<SystemPromptPayload>) as Promise<GroveObject<UnifiedExperiencePayload>>;
      case 'feature-flag':
        return featureFlagData.duplicate(object as GroveObject<FeatureFlagPayload>) as Promise<GroveObject<UnifiedExperiencePayload>>;
      default:
        throw new Error(`Unknown experience type: ${object.meta.type}`);
    }
  }, [systemPromptData.duplicate, featureFlagData.duplicate]);

  // =========================================================================
  // Return unified result
  // =========================================================================
  return {
    objects,
    loading,
    error,
    refetch,
    create,
    update,
    remove,
    duplicate,
  };
}

// =============================================================================
// Type-specific hooks re-export (for direct access when needed)
// =============================================================================
export { useExperienceData } from './useExperienceData';
export { useFeatureFlagsData } from './useFeatureFlagsData';
