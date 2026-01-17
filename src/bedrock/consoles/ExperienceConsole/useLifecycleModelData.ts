// src/bedrock/consoles/ExperienceConsole/useLifecycleModelData.ts
// Data hook for Lifecycle Models - wraps useGroveData for console factory compatibility
// Sprint: EPIC4-SL-MultiModel v1

import { useCallback, useMemo } from 'react';
import { useGroveData } from '@core/data';
import type { GroveObject } from '@core/schema/grove-object';
import type { LifecycleModelPayload } from '@core/schema/lifecycle-model';
import {
  createLifecycleModelPayload,
  createLifecycleModelFromTemplate,
  BOTANICAL_MODEL_TEMPLATE,
  ACADEMIC_MODEL_TEMPLATE,
  RESEARCH_MODEL_TEMPLATE,
  CREATIVE_MODEL_TEMPLATE
} from '@core/schema/lifecycle-model';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import { generateUUID } from '@core/versioning/utils';

// =============================================================================
// Default Object Factory
// =============================================================================

/**
 * Create a default LifecycleModel GroveObject
 * @param template - Template to use for the model
 * @param defaults - Optional payload defaults
 */
export function createDefaultLifecycleModel(
  template: 'botanical' | 'academic' | 'research' | 'creative' = 'botanical',
  defaults?: Partial<LifecycleModelPayload>
): GroveObject<LifecycleModelPayload> {
  const now = new Date().toISOString();

  // Select template
  let selectedTemplate;
  switch (template) {
    case 'botanical':
      selectedTemplate = BOTANICAL_MODEL_TEMPLATE;
      break;
    case 'academic':
      selectedTemplate = ACADEMIC_MODEL_TEMPLATE;
      break;
    case 'research':
      selectedTemplate = RESEARCH_MODEL_TEMPLATE;
      break;
    case 'creative':
      selectedTemplate = CREATIVE_MODEL_TEMPLATE;
      break;
    default:
      selectedTemplate = BOTANICAL_MODEL_TEMPLATE;
  }

  return createLifecycleModelFromTemplate(selectedTemplate, {
    meta: {
      id: generateUUID(),
      title: defaults?.name || selectedTemplate.name,
      description: defaults?.description || selectedTemplate.description,
      status: 'active',
      tags: [],
    },
    payload: {
      name: defaults?.name || selectedTemplate.name,
      description: defaults?.description || selectedTemplate.description,
      version: defaults?.version || '1.0.0',
      modelType: defaults?.modelType || 'botanical',
    }
  });
}

// =============================================================================
// Extended Result Type
// =============================================================================

/**
 * Extended result type with lifecycle model specific helpers
 */
export interface LifecycleModelDataResult extends CollectionDataResult<LifecycleModelPayload> {
  /** Models grouped by type */
  modelsByType: Record<LifecycleModelPayload['modelType'], GroveObject<LifecycleModelPayload>[]>;
  /** Find model by ID */
  getModelById: (id: string) => GroveObject<LifecycleModelPayload> | undefined;
  /** Get models by type */
  getModelsByType: (type: LifecycleModelPayload['modelType']) => GroveObject<LifecycleModelPayload>[];
  /** Get available templates */
  getAvailableTemplates: () => Array<{ id: string; name: string; description: string; modelType: string }>;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Data hook for Lifecycle Models in Experience Console
 *
 * Wraps useGroveData<LifecycleModelPayload>('lifecycle-model') to provide:
 * - Standard CRUD operations via CollectionDataResult interface
 * - `modelsByType`: Models grouped by type
 * - `getModelById(id)`: Find model by ID
 * - `getModelsByType(type)`: Find models by type
 * - `getAvailableTemplates()`: Get list of available templates
 */
export function useLifecycleModelData(): LifecycleModelDataResult {
  const groveData = useGroveData<LifecycleModelPayload>('lifecycle-model');

  // Computed: Models grouped by type
  const modelsByType = useMemo(() => {
    const types: Record<LifecycleModelPayload['modelType'], GroveObject<LifecycleModelPayload>[]> = {
      botanical: [],
      academic: [],
      research: [],
      creative: [],
    };

    for (const model of groveData.objects) {
      if (model.meta.status === 'active') {
        types[model.payload.modelType].push(model);
      }
    }

    return types;
  }, [groveData.objects]);

  // Helper: Find model by ID
  const getModelById = useCallback(
    (id: string) => {
      return groveData.objects.find(model => model.meta.id === id);
    },
    [groveData.objects]
  );

  // Helper: Get models by type
  const getModelsByType = useCallback(
    (type: LifecycleModelPayload['modelType']) => {
      return groveData.objects.filter(
        model => model.payload.modelType === type && model.meta.status === 'active'
      );
    },
    [groveData.objects]
  );

  // Helper: Get available templates
  const getAvailableTemplates = useCallback(() => {
    return [
      {
        id: BOTANICAL_MODEL_TEMPLATE.id,
        name: BOTANICAL_MODEL_TEMPLATE.name,
        description: BOTANICAL_MODEL_TEMPLATE.description,
        modelType: 'botanical',
      },
      {
        id: ACADEMIC_MODEL_TEMPLATE.id,
        name: ACADEMIC_MODEL_TEMPLATE.name,
        description: ACADEMIC_MODEL_TEMPLATE.description,
        modelType: 'academic',
      },
      {
        id: RESEARCH_MODEL_TEMPLATE.id,
        name: RESEARCH_MODEL_TEMPLATE.name,
        description: RESEARCH_MODEL_TEMPLATE.description,
        modelType: 'research',
      },
      {
        id: CREATIVE_MODEL_TEMPLATE.id,
        name: CREATIVE_MODEL_TEMPLATE.name,
        description: CREATIVE_MODEL_TEMPLATE.description,
        modelType: 'creative',
      },
    ];
  }, []);

  return {
    ...groveData,
    modelsByType,
    getModelById,
    getModelsByType,
    getAvailableTemplates,
  };
}

export default useLifecycleModelData;
