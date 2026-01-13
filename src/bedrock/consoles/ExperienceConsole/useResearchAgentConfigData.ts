// src/bedrock/consoles/ExperienceConsole/useResearchAgentConfigData.ts
// Data hook for Research Agent Config objects
// Sprint: experience-console-cleanup-v1
//
// DEX: Organic Scalability - data hook follows established pattern

import { useCallback, useMemo } from 'react';
import { useGroveData } from '@core/data';
import type { GroveObject } from '@core/schema/grove-object';
import type { ResearchAgentConfigPayload } from '@core/schema/research-agent-config';
import { DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD } from '@core/schema/research-agent-config';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import { generateUUID } from '@core/versioning/utils';

// =============================================================================
// Default Object Factory
// =============================================================================

/**
 * Create a default Research Agent Config GroveObject
 * @param defaults - Optional payload defaults
 */
export function createDefaultResearchAgentConfig(
  defaults?: Partial<ResearchAgentConfigPayload>
): GroveObject<ResearchAgentConfigPayload> {
  const now = new Date().toISOString();

  return {
    meta: {
      id: generateUUID(),
      type: 'research-agent-config',
      title: 'Research Agent Config',
      description: 'Configure research execution behavior',
      icon: 'search',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
    payload: {
      ...DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD,
      ...defaults,
    },
  };
}

// =============================================================================
// Extended Result Type
// =============================================================================

export interface ResearchAgentConfigDataResult extends CollectionDataResult<ResearchAgentConfigPayload> {
  /** Get the active (singleton) config */
  activeConfig: GroveObject<ResearchAgentConfigPayload> | undefined;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Data hook for Research Agent Config in Experience Console
 *
 * This is a SINGLETON type - only one active instance should exist.
 * Wraps useGroveData<ResearchAgentConfigPayload>('research-agent-config') to provide:
 * - Standard CRUD operations via CollectionDataResult interface
 * - `activeConfig`: The active configuration instance
 */
export function useResearchAgentConfigData(): ResearchAgentConfigDataResult {
  const groveData = useGroveData<ResearchAgentConfigPayload>('research-agent-config');

  // Computed: Get the active config (first active one - should be only one for SINGLETON)
  const activeConfig = useMemo(() => {
    return groveData.objects.find((obj) => obj.meta.status === 'active');
  }, [groveData.objects]);

  // Create with defaults
  const create = useCallback(
    async (defaults?: Partial<ResearchAgentConfigPayload>) => {
      const newConfig = createDefaultResearchAgentConfig(defaults);
      return groveData.create(newConfig);
    },
    [groveData]
  );

  // Duplicate config
  const duplicate = useCallback(
    async (object: GroveObject<ResearchAgentConfigPayload>) => {
      const now = new Date().toISOString();

      const duplicated: GroveObject<ResearchAgentConfigPayload> = {
        meta: {
          id: generateUUID(),
          type: 'research-agent-config',
          title: `${object.meta.title} (Copy)`,
          description: object.meta.description,
          icon: object.meta.icon,
          status: 'active',
          createdAt: now,
          updatedAt: now,
          tags: [...(object.meta.tags || [])],
        },
        payload: {
          ...object.payload,
        },
      };

      return groveData.create(duplicated);
    },
    [groveData]
  );

  return {
    // Standard CollectionDataResult
    objects: groveData.objects,
    loading: groveData.loading,
    error: groveData.error,
    refetch: groveData.refetch,
    create,
    update: groveData.update,
    remove: groveData.remove,
    duplicate,

    // Extended functionality
    activeConfig,
  };
}

export default useResearchAgentConfigData;
