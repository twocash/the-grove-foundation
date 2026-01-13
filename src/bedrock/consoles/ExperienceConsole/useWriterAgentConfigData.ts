// src/bedrock/consoles/ExperienceConsole/useWriterAgentConfigData.ts
// Data hook for Writer Agent Config objects
// Sprint: experience-console-cleanup-v1
//
// DEX: Organic Scalability - data hook follows established pattern

import { useCallback, useMemo } from 'react';
import { useGroveData } from '@core/data';
import type { GroveObject } from '@core/schema/grove-object';
import type { WriterAgentConfigPayload } from '@core/schema/writer-agent-config';
import { DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD } from '@core/schema/writer-agent-config';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import { generateUUID } from '@core/versioning/utils';

// =============================================================================
// Default Object Factory
// =============================================================================

/**
 * Create a default Writer Agent Config GroveObject
 * @param defaults - Optional payload defaults
 */
export function createDefaultWriterAgentConfig(
  defaults?: Partial<WriterAgentConfigPayload>
): GroveObject<WriterAgentConfigPayload> {
  const now = new Date().toISOString();

  return {
    meta: {
      id: generateUUID(),
      type: 'writer-agent-config',
      title: 'Writer Agent Config',
      description: 'Configure document writing behavior',
      icon: 'edit_note',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
    payload: {
      ...DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD,
      ...defaults,
    },
  };
}

// =============================================================================
// Extended Result Type
// =============================================================================

export interface WriterAgentConfigDataResult extends CollectionDataResult<WriterAgentConfigPayload> {
  /** Get the active (singleton) config */
  activeConfig: GroveObject<WriterAgentConfigPayload> | undefined;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Data hook for Writer Agent Config in Experience Console
 *
 * This is a SINGLETON type - only one active instance should exist.
 * Wraps useGroveData<WriterAgentConfigPayload>('writer-agent-config') to provide:
 * - Standard CRUD operations via CollectionDataResult interface
 * - `activeConfig`: The active configuration instance
 */
export function useWriterAgentConfigData(): WriterAgentConfigDataResult {
  const groveData = useGroveData<WriterAgentConfigPayload>('writer-agent-config');

  // Computed: Get the active config (first active one - should be only one for SINGLETON)
  const activeConfig = useMemo(() => {
    return groveData.objects.find((obj) => obj.meta.status === 'active');
  }, [groveData.objects]);

  // Create with defaults
  const create = useCallback(
    async (defaults?: Partial<WriterAgentConfigPayload>) => {
      const newConfig = createDefaultWriterAgentConfig(defaults);
      return groveData.create(newConfig);
    },
    [groveData]
  );

  // Duplicate config
  const duplicate = useCallback(
    async (object: GroveObject<WriterAgentConfigPayload>) => {
      const now = new Date().toISOString();

      const duplicated: GroveObject<WriterAgentConfigPayload> = {
        meta: {
          id: generateUUID(),
          type: 'writer-agent-config',
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

export default useWriterAgentConfigData;
