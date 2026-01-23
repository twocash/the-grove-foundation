// src/bedrock/consoles/ExperienceConsole/useOutputTemplateData.ts
// Data hook for Output Template objects
// Sprint: prompt-template-architecture-v1
//
// DEX: Organic Scalability - data hook follows established pattern from useWriterAgentConfigData
// DEX: Provenance as Infrastructure - tracks source, forkedFromId

import { useCallback, useMemo, useState } from 'react';
import { useGroveData } from '@core/data';
import type { GroveObject } from '@core/schema/grove-object';
import type {
  OutputTemplatePayload,
  AgentType,
  OutputTemplateSource,
  OutputTemplateStatus,
} from '@core/schema/output-template';
import {
  DEFAULT_OUTPUT_TEMPLATE_PAYLOAD,
  forkOutputTemplate,
} from '@core/schema/output-template';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import { generateUUID } from '@core/versioning/utils';

// =============================================================================
// Optimistic State Types
// =============================================================================

/**
 * Tracks pending activation for optimistic UI updates
 */
interface PendingActivation {
  newActiveId: string;
  oldActiveId: string | null;
  agentType: AgentType;
}

// =============================================================================
// Default Object Factory
// =============================================================================

/**
 * Create a default Output Template GroveObject
 * @param defaults - Optional payload defaults
 */
export function createDefaultOutputTemplate(
  defaults?: Partial<OutputTemplatePayload>
): GroveObject<OutputTemplatePayload> {
  const now = new Date().toISOString();
  const agentType = defaults?.agentType || 'writer';

  return {
    meta: {
      id: generateUUID(),
      type: 'output-template',
      title: defaults?.name || 'New Template',
      description: defaults?.description || 'Custom output template',
      icon: agentType === 'writer' ? 'description' : 'search',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      tags: [agentType],
    },
    payload: {
      ...DEFAULT_OUTPUT_TEMPLATE_PAYLOAD,
      ...defaults,
      source: defaults?.source || 'user-created',
    },
  };
}

// =============================================================================
// Extended Result Type
// =============================================================================

export interface OutputTemplateDataResult extends CollectionDataResult<OutputTemplatePayload> {
  /** Get templates filtered by agent type */
  getByAgentType: (agentType: AgentType) => GroveObject<OutputTemplatePayload>[];

  /** Get templates filtered by source */
  getBySource: (source: OutputTemplateSource) => GroveObject<OutputTemplatePayload>[];

  /** Get templates filtered by status */
  getByStatus: (status: OutputTemplateStatus) => GroveObject<OutputTemplatePayload>[];

  /** Get active templates for an agent type */
  activeTemplates: (agentType: AgentType) => GroveObject<OutputTemplatePayload>[];

  /** Get the default template for an agent type */
  getDefault: (agentType: AgentType) => GroveObject<OutputTemplatePayload> | undefined;

  /** System seed templates (read-only) */
  systemSeeds: GroveObject<OutputTemplatePayload>[];

  /** User-created and forked templates */
  userTemplates: GroveObject<OutputTemplatePayload>[];

  /** Fork a template (creates copy with provenance) */
  fork: (id: string) => Promise<GroveObject<OutputTemplatePayload>>;

  /** Activate a template (set status to active) */
  activate: (id: string) => Promise<void>;

  /** Archive a template */
  archive: (id: string) => Promise<void>;

  /** Publish a draft template (set status to active) */
  publish: (id: string) => Promise<void>;

  /** Set a template as default for its agent type */
  setAsDefault: (id: string) => Promise<void>;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Data hook for Output Templates in Experience Console
 *
 * Provides:
 * - Standard CRUD operations via CollectionDataResult interface
 * - Filter helpers: getByAgentType, getBySource, getByStatus
 * - Fork flow: fork(id) creates copy with provenance tracking
 * - Lifecycle: activate, archive, publish
 * - Default management: setAsDefault
 */
export function useOutputTemplateData(): OutputTemplateDataResult {
  const groveData = useGroveData<OutputTemplatePayload>('output-template');

  // Optimistic state for immediate UI updates
  const [pendingActivation, setPendingActivation] = useState<PendingActivation | null>(null);

  // Apply optimistic updates to objects array
  const objects = useMemo(() => {
    if (!pendingActivation) {
      return groveData.objects;
    }

    return groveData.objects.map((obj) => {
      if (obj.meta.id === pendingActivation.newActiveId) {
        return {
          ...obj,
          meta: { ...obj.meta, status: 'active' as const },
        };
      }
      if (obj.meta.id === pendingActivation.oldActiveId) {
        return {
          ...obj,
          meta: { ...obj.meta, status: 'archived' as const },
        };
      }
      return obj;
    });
  }, [groveData.objects, pendingActivation]);

  // =============================================================================
  // Computed Views
  // =============================================================================

  const systemSeeds = useMemo(() => {
    return objects.filter((obj) => obj.payload.source === 'system-seed');
  }, [objects]);

  const userTemplates = useMemo(() => {
    return objects.filter((obj) => obj.payload.source !== 'system-seed');
  }, [objects]);

  // =============================================================================
  // Filter Helpers
  // =============================================================================

  const getByAgentType = useCallback(
    (agentType: AgentType) => {
      return objects.filter((obj) => obj.payload.agentType === agentType);
    },
    [objects]
  );

  const getBySource = useCallback(
    (source: OutputTemplateSource) => {
      return objects.filter((obj) => obj.payload.source === source);
    },
    [objects]
  );

  const getByStatus = useCallback(
    (status: OutputTemplateStatus) => {
      return objects.filter((obj) => obj.payload.status === status);
    },
    [objects]
  );

  const activeTemplates = useCallback(
    (agentType: AgentType) => {
      return objects.filter(
        (obj) => obj.payload.agentType === agentType && obj.payload.status === 'active'
      );
    },
    [objects]
  );

  const getDefault = useCallback(
    (agentType: AgentType) => {
      return objects.find(
        (obj) =>
          obj.payload.agentType === agentType &&
          obj.payload.isDefault &&
          obj.payload.status === 'active'
      );
    },
    [objects]
  );

  // =============================================================================
  // CRUD Operations
  // =============================================================================

  const create = useCallback(
    async (defaults?: Partial<OutputTemplatePayload>) => {
      const newTemplate = createDefaultOutputTemplate(defaults);
      return groveData.create(newTemplate);
    },
    [groveData]
  );

  const duplicate = useCallback(
    async (object: GroveObject<OutputTemplatePayload>) => {
      const now = new Date().toISOString();

      const duplicated: GroveObject<OutputTemplatePayload> = {
        meta: {
          id: generateUUID(),
          type: 'output-template',
          title: `${object.meta.title} (Copy)`,
          description: object.meta.description,
          icon: object.meta.icon,
          status: 'draft',
          createdAt: now,
          updatedAt: now,
          tags: [...(object.meta.tags || [])],
        },
        payload: {
          ...object.payload,
          name: `${object.payload.name} (Copy)`,
          version: 1,
          changelog: undefined,
          previousVersionId: undefined,
          status: 'draft',
          isDefault: false,
          source: 'user-created',
          forkedFromId: undefined,
        },
      };

      return groveData.create(duplicated);
    },
    [groveData]
  );

  // =============================================================================
  // Fork Flow (Key Feature)
  // =============================================================================

  /**
   * Fork a template - creates a copy with provenance tracking.
   * System seeds are read-only, so users fork them to customize.
   */
  const fork = useCallback(
    async (id: string) => {
      const source = objects.find((obj) => obj.meta.id === id);
      if (!source) {
        throw new Error(`Template not found: ${id}`);
      }

      const now = new Date().toISOString();
      const forkedPayload = forkOutputTemplate(source.payload, id);

      const forkedTemplate: GroveObject<OutputTemplatePayload> = {
        meta: {
          id: generateUUID(),
          type: 'output-template',
          title: forkedPayload.name,
          description: forkedPayload.description,
          icon: source.meta.icon,
          status: 'draft',
          createdAt: now,
          updatedAt: now,
          tags: [...(source.meta.tags || []), 'forked'],
        },
        payload: forkedPayload,
      };

      console.log('[OutputTemplateData] Forking template:', {
        sourceId: id,
        sourceName: source.payload.name,
        newId: forkedTemplate.meta.id,
        newName: forkedPayload.name,
      });

      return groveData.create(forkedTemplate);
    },
    [objects, groveData]
  );

  // =============================================================================
  // Lifecycle Operations
  // =============================================================================

  const activate = useCallback(
    async (id: string) => {
      const now = new Date().toISOString();
      const template = objects.find((obj) => obj.meta.id === id);
      if (!template) {
        throw new Error(`Template not found: ${id}`);
      }

      // Cannot activate system seeds directly - they're always active
      if (template.payload.source === 'system-seed') {
        console.warn('[OutputTemplateData] System seeds are always active, no-op');
        return;
      }

      await groveData.update(id, [
        { op: 'replace', path: '/meta/status', value: 'active' },
        { op: 'replace', path: '/payload/status', value: 'active' },
        { op: 'replace', path: '/meta/updatedAt', value: now },
      ]);

      console.log('[OutputTemplateData] Activated template:', id);
      await groveData.refetch();
    },
    [objects, groveData]
  );

  const archive = useCallback(
    async (id: string) => {
      const now = new Date().toISOString();
      const template = objects.find((obj) => obj.meta.id === id);
      if (!template) {
        throw new Error(`Template not found: ${id}`);
      }

      // Cannot archive system seeds
      if (template.payload.source === 'system-seed') {
        throw new Error('Cannot archive system seed templates');
      }

      await groveData.update(id, [
        { op: 'replace', path: '/meta/status', value: 'archived' },
        { op: 'replace', path: '/payload/status', value: 'archived' },
        { op: 'replace', path: '/meta/updatedAt', value: now },
      ]);

      console.log('[OutputTemplateData] Archived template:', id);
      await groveData.refetch();
    },
    [objects, groveData]
  );

  const publish = useCallback(
    async (id: string) => {
      // Publish is alias for activate for draft templates
      await activate(id);
    },
    [activate]
  );

  const setAsDefault = useCallback(
    async (id: string) => {
      const now = new Date().toISOString();
      const template = objects.find((obj) => obj.meta.id === id);
      if (!template) {
        throw new Error(`Template not found: ${id}`);
      }

      const agentType = template.payload.agentType;

      // Clear existing default for this agent type
      const currentDefault = objects.find(
        (obj) =>
          obj.payload.agentType === agentType &&
          obj.payload.isDefault &&
          obj.meta.id !== id
      );

      if (currentDefault) {
        await groveData.update(currentDefault.meta.id, [
          { op: 'replace', path: '/payload/isDefault', value: false },
          { op: 'replace', path: '/meta/updatedAt', value: now },
        ]);
        console.log('[OutputTemplateData] Cleared previous default:', currentDefault.meta.id);
      }

      // Set new default
      await groveData.update(id, [
        { op: 'replace', path: '/payload/isDefault', value: true },
        { op: 'replace', path: '/meta/updatedAt', value: now },
      ]);

      console.log('[OutputTemplateData] Set as default:', id);
      await groveData.refetch();
    },
    [objects, groveData]
  );

  // =============================================================================
  // Return
  // =============================================================================

  return {
    // Standard CollectionDataResult
    objects,
    loading: groveData.loading,
    error: groveData.error,
    refetch: groveData.refetch,
    create,
    update: groveData.update,
    remove: groveData.remove,
    duplicate,

    // Filter helpers
    getByAgentType,
    getBySource,
    getByStatus,
    activeTemplates,
    getDefault,

    // Computed views
    systemSeeds,
    userTemplates,

    // Fork flow
    fork,

    // Lifecycle
    activate,
    archive,
    publish,
    setAsDefault,
  };
}

export default useOutputTemplateData;
