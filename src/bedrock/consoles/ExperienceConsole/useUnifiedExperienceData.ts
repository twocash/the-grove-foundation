// src/bedrock/consoles/ExperienceConsole/useUnifiedExperienceData.ts
// Unified Experience Data Hook
// Dynamically composes data from all registered experience types
// Sprint: unified-experience-console-v1, experience-console-cleanup-v1
//
// DEX: Organic Scalability - new types discovered automatically from registry

import { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import type { GroveObject } from '@core/schema/grove-object';
import type { SystemPromptPayload } from '@core/schema/system-prompt';
import type { FeatureFlagPayload } from '@core/schema/feature-flag';
import type { ResearchAgentConfigPayload } from '@core/schema/research-agent-config';
import type { WriterAgentConfigPayload } from '@core/schema/writer-agent-config';
import type { CopilotStylePayload } from '@core/schema/copilot-style';
import type { LifecycleConfigPayload } from '@core/schema/lifecycle-config';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import type { PatchOperation } from '@core/data/grove-data-provider';
import { useExperienceData } from './useExperienceData';
import { useFeatureFlagsData } from './useFeatureFlagsData';
import { useResearchAgentConfigData } from './useResearchAgentConfigData';
import { useWriterAgentConfigData } from './useWriterAgentConfigData';
import { useCopilotStyleData } from './useCopilotStyleData';
import { useLifecycleConfigData } from './useLifecycleConfigData';
import { getAllExperienceTypes } from '../../types/experience.types';

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
  | FeatureFlagPayload
  | ResearchAgentConfigPayload
  | WriterAgentConfigPayload
  | CopilotStylePayload
  | LifecycleConfigPayload; // Sprint: S5-SL-LifecycleEngine v1

// =============================================================================
// Extended Result Type
// =============================================================================

export interface UnifiedExperienceDataResult extends CollectionDataResult<UnifiedExperiencePayload> {
  /**
   * Create an object of a specific type
   * @param type - The experience type to create
   * @param defaults - Optional payload defaults
   */
  createTyped: (type: string, defaults?: Partial<UnifiedExperiencePayload>) => Promise<GroveObject<UnifiedExperiencePayload>>;
}

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
 * - Auto-creates default instances for SINGLETON types (experience-console-cleanup-v1)
 *
 * KNOWN LIMITATION: React hooks cannot be called conditionally/dynamically.
 * When adding new types, this hook must be updated to call the new hook.
 * This is documented and acceptable - the key DEX win is that the CONSOLE
 * component doesn't need modification, only this data composition layer.
 *
 * @returns CollectionDataResult with objects from all registered types
 */
export function useUnifiedExperienceData(): UnifiedExperienceDataResult {
  // =========================================================================
  // Explicit hook calls - update when adding new types
  // This is required due to React's Rules of Hooks
  // =========================================================================
  const systemPromptData = useExperienceData();
  const featureFlagData = useFeatureFlagsData();
  const researchAgentConfigData = useResearchAgentConfigData();
  const writerAgentConfigData = useWriterAgentConfigData();
  const copilotStyleData = useCopilotStyleData();
  const lifecycleConfigData = useLifecycleConfigData(); // Sprint: S5-SL-LifecycleEngine v1

  // =========================================================================
  // Merge objects from all sources
  // =========================================================================
  const objects = useMemo(() => {
    return [
      ...systemPromptData.objects,
      ...featureFlagData.objects,
      ...researchAgentConfigData.objects,
      ...writerAgentConfigData.objects,
      ...copilotStyleData.objects,
      ...lifecycleConfigData.objects, // Sprint: S5-SL-LifecycleEngine v1
    ] as GroveObject<UnifiedExperiencePayload>[];
  }, [
    systemPromptData.objects,
    featureFlagData.objects,
    researchAgentConfigData.objects,
    writerAgentConfigData.objects,
    copilotStyleData.objects,
    lifecycleConfigData.objects, // Sprint: S5-SL-LifecycleEngine v1
  ]);

  // =========================================================================
  // Aggregate loading state (any hook loading = unified loading)
  // =========================================================================
  const loading =
    systemPromptData.loading ||
    featureFlagData.loading ||
    researchAgentConfigData.loading ||
    writerAgentConfigData.loading ||
    copilotStyleData.loading ||
    lifecycleConfigData.loading; // Sprint: S5-SL-LifecycleEngine v1

  // =========================================================================
  // Aggregate errors (first error wins - could be improved to show all)
  // =========================================================================
  const error =
    systemPromptData.error ||
    featureFlagData.error ||
    researchAgentConfigData.error ||
    writerAgentConfigData.error ||
    copilotStyleData.error ||
    lifecycleConfigData.error; // Sprint: S5-SL-LifecycleEngine v1

  // =========================================================================
  // Refetch all data sources
  // =========================================================================
  const refetch = useCallback(() => {
    systemPromptData.refetch();
    featureFlagData.refetch();
    researchAgentConfigData.refetch();
    writerAgentConfigData.refetch();
    copilotStyleData.refetch();
    lifecycleConfigData.refetch(); // Sprint: S5-SL-LifecycleEngine v1
  }, [
    systemPromptData.refetch,
    featureFlagData.refetch,
    researchAgentConfigData.refetch,
    writerAgentConfigData.refetch,
    copilotStyleData.refetch,
    lifecycleConfigData.refetch, // Sprint: S5-SL-LifecycleEngine v1
  ]);

  // =========================================================================
  // Route create to appropriate hook based on type
  // Sprint: experience-console-cleanup-v1 - Added type parameter support
  // =========================================================================
  const createTyped = useCallback(
    async (
      type: string,
      defaults?: Partial<UnifiedExperiencePayload>
    ): Promise<GroveObject<UnifiedExperiencePayload>> => {
      switch (type) {
        case 'system-prompt':
          return systemPromptData.create(defaults as Partial<SystemPromptPayload>) as Promise<
            GroveObject<UnifiedExperiencePayload>
          >;
        case 'feature-flag':
          return featureFlagData.create(defaults as Partial<FeatureFlagPayload>) as Promise<
            GroveObject<UnifiedExperiencePayload>
          >;
        case 'research-agent-config':
          return researchAgentConfigData.create(defaults as Partial<ResearchAgentConfigPayload>) as Promise<
            GroveObject<UnifiedExperiencePayload>
          >;
        case 'writer-agent-config':
          return writerAgentConfigData.create(defaults as Partial<WriterAgentConfigPayload>) as Promise<
            GroveObject<UnifiedExperiencePayload>
          >;
        case 'copilot-style':
          return copilotStyleData.create(defaults as Partial<CopilotStylePayload>) as Promise<
            GroveObject<UnifiedExperiencePayload>
          >;
        case 'lifecycle-config': // Sprint: S5-SL-LifecycleEngine v1
          return lifecycleConfigData.create(defaults as Partial<LifecycleConfigPayload>) as Promise<
            GroveObject<UnifiedExperiencePayload>
          >;
        default:
          throw new Error(`Unknown experience type: ${type}`);
      }
    },
    [systemPromptData.create, featureFlagData.create, researchAgentConfigData.create, writerAgentConfigData.create, copilotStyleData.create, lifecycleConfigData.create]
  );

  // Legacy create (defaults to system-prompt for backwards compatibility)
  const create = useCallback(
    async (defaults?: Partial<UnifiedExperiencePayload>): Promise<GroveObject<UnifiedExperiencePayload>> => {
      // Default to system-prompt if not specified
      // In practice, the console should use createTyped
      return createTyped('system-prompt', defaults);
    },
    [createTyped]
  );

  // =========================================================================
  // Route update to appropriate hook based on object type
  // =========================================================================
  const update = useCallback(
    async (id: string, operations: PatchOperation[]) => {
      const obj = objects.find((o) => o.meta.id === id);
      if (!obj) {
        throw new Error(`Object not found: ${id}`);
      }

      switch (obj.meta.type) {
        case 'system-prompt':
          return systemPromptData.update(id, operations);
        case 'feature-flag':
          return featureFlagData.update(id, operations);
        case 'research-agent-config':
          return researchAgentConfigData.update(id, operations);
        case 'writer-agent-config':
          return writerAgentConfigData.update(id, operations);
        case 'copilot-style':
          return copilotStyleData.update(id, operations);
        case 'lifecycle-config': // Sprint: S5-SL-LifecycleEngine v1
          return lifecycleConfigData.update(id, operations);
        default:
          throw new Error(`Unknown experience type: ${obj.meta.type}`);
      }
    },
    [objects, systemPromptData.update, featureFlagData.update, researchAgentConfigData.update, writerAgentConfigData.update, copilotStyleData.update, lifecycleConfigData.update]
  );

  // =========================================================================
  // Route remove to appropriate hook based on object type
  // =========================================================================
  const remove = useCallback(
    async (id: string) => {
      const obj = objects.find((o) => o.meta.id === id);
      if (!obj) {
        throw new Error(`Object not found: ${id}`);
      }

      switch (obj.meta.type) {
        case 'system-prompt':
          return systemPromptData.remove(id);
        case 'feature-flag':
          return featureFlagData.remove(id);
        case 'research-agent-config':
          return researchAgentConfigData.remove(id);
        case 'writer-agent-config':
          return writerAgentConfigData.remove(id);
        case 'copilot-style':
          return copilotStyleData.remove(id);
        case 'lifecycle-config': // Sprint: S5-SL-LifecycleEngine v1
          return lifecycleConfigData.remove(id);
        default:
          throw new Error(`Unknown experience type: ${obj.meta.type}`);
      }
    },
    [objects, systemPromptData.remove, featureFlagData.remove, researchAgentConfigData.remove, writerAgentConfigData.remove, copilotStyleData.remove, lifecycleConfigData.remove]
  );

  // =========================================================================
  // Route duplicate to appropriate hook based on object type
  // Sprint: singleton-pattern-factory-v1 - added overrides param for factory support
  // =========================================================================
  const duplicate = useCallback(
    async (
      object: GroveObject<UnifiedExperiencePayload>,
      overrides?: Record<string, unknown>
    ): Promise<GroveObject<UnifiedExperiencePayload>> => {
      let result: GroveObject<UnifiedExperiencePayload>;

      switch (object.meta.type) {
        case 'system-prompt':
          result = await systemPromptData.duplicate(object as GroveObject<SystemPromptPayload>) as GroveObject<UnifiedExperiencePayload>;
          break;
        case 'feature-flag':
          result = await featureFlagData.duplicate(object as GroveObject<FeatureFlagPayload>) as GroveObject<UnifiedExperiencePayload>;
          break;
        case 'research-agent-config':
          result = await researchAgentConfigData.duplicate(object as GroveObject<ResearchAgentConfigPayload>) as GroveObject<UnifiedExperiencePayload>;
          break;
        case 'writer-agent-config':
          result = await writerAgentConfigData.duplicate(object as GroveObject<WriterAgentConfigPayload>) as GroveObject<UnifiedExperiencePayload>;
          break;
        case 'copilot-style':
          result = await copilotStyleData.duplicate(object as GroveObject<CopilotStylePayload>) as GroveObject<UnifiedExperiencePayload>;
          break;
        case 'lifecycle-config': // Sprint: S5-SL-LifecycleEngine v1
          result = await lifecycleConfigData.duplicate(object as GroveObject<LifecycleConfigPayload>) as GroveObject<UnifiedExperiencePayload>;
          break;
        default:
          throw new Error(`Unknown experience type: ${object.meta.type}`);
      }

      // Apply overrides if provided (factory singleton pattern support)
      // Note: Underlying hooks already set status='draft' and reset versioning
      // Overrides are mainly for consistency with factory's declarative config
      if (overrides) {
        // Apply dot-path overrides to nested object structure
        for (const [path, value] of Object.entries(overrides)) {
          const parts = path.split('.');
          let current: Record<string, unknown> = result as unknown as Record<string, unknown>;
          for (let i = 0; i < parts.length - 1; i++) {
            current = current[parts[i]] as Record<string, unknown>;
          }
          current[parts[parts.length - 1]] = value;
        }
      }

      return result;
    },
    [
      systemPromptData.duplicate,
      featureFlagData.duplicate,
      researchAgentConfigData.duplicate,
      writerAgentConfigData.duplicate,
      copilotStyleData.duplicate,
      lifecycleConfigData.duplicate, // Sprint: S5-SL-LifecycleEngine v1
    ]
  );

  // =========================================================================
  // Auto-create default instances for SINGLETON types
  // Sprint: experience-console-cleanup-v1
  // =========================================================================
  const defaultsCreatedRef = useRef(false);
  const [, setDefaultsVersion] = useState(0);

  useEffect(() => {
    // Only run once, after initial load
    if (defaultsCreatedRef.current || loading) return;

    // HOTFIX: Mark as in-progress IMMEDIATELY to prevent race condition
    // The effect was re-triggering due to objects changing before async completed
    // Sprint: experience-console-cleanup-v1
    defaultsCreatedRef.current = true;

    // Find SINGLETON types that need default instances in the Experience Console
    // Excludes types that allow multiple active (like feature-flag)
    const singletonTypes = getAllExperienceTypes().filter(
      (t) => t.routePath === '/bedrock/experience' && !t.allowMultipleActive
    );

    const createDefaultsAsync = async () => {
      let createdAny = false;

      for (const typeDef of singletonTypes) {
        // Check if instance exists for this type
        const existingInstance = objects.find((o) => o.meta.type === typeDef.type);

        if (!existingInstance) {
          console.log(`[ExperienceConsole] Creating default instance for: ${typeDef.type}`);

          try {
            await createTyped(typeDef.type);
            createdAny = true;
          } catch (err) {
            console.error(`[ExperienceConsole] Failed to create default for ${typeDef.type}:`, err);
          }
        }
      }

      // Force re-render if we created any defaults
      if (createdAny) {
        setDefaultsVersion((v) => v + 1);
        // Refetch to ensure consistency with server
        setTimeout(() => {
          refetch();
        }, 100);
      }
    };

    createDefaultsAsync();
  }, [objects, loading, createTyped, refetch]);

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
    createTyped,
  };
}

// =============================================================================
// Type-specific hooks re-export (for direct access when needed)
// =============================================================================
export { useExperienceData } from './useExperienceData';
export { useFeatureFlagsData } from './useFeatureFlagsData';
export { useResearchAgentConfigData } from './useResearchAgentConfigData';
export { useWriterAgentConfigData } from './useWriterAgentConfigData';
export { useCopilotStyleData } from './useCopilotStyleData';
export { useLifecycleConfigData } from './useLifecycleConfigData'; // Sprint: S5-SL-LifecycleEngine v1
