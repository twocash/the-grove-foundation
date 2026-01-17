/**
 * Lifecycle Model Schema
 * Sprint: EPIC4-SL-MultiModel v1
 *
 * GroveObject<LifecycleModelPayload> pattern for lifecycle models.
 * Instance cardinality: many models can exist simultaneously.
 *
 * Each model defines a tier structure and validation rules for sprout advancement.
 */

import type { GroveObject } from './grove-object';

/**
 * A single tier in a lifecycle model (e.g., Seed, Sprout, Tree).
 */
export interface LifecycleTier {
  /** Unique identifier for the tier (e.g., 'seed', 'sprout', 'tree') */
  id: string;

  /** Display label for the tier (e.g., 'Seed', 'Sprout') */
  label: string;

  /** Emoji icon for the tier (e.g., '🌰', '🌱', '🌳') */
  emoji?: string;

  /** Order for sorting tiers (0-based) */
  order: number;

  /** Description of what this tier represents */
  description: string;

  /** Optional requirements for advancement to this tier */
  requirements?: {
    /** Minimum signal strength required */
    minSignalStrength?: number;

    /** Minimum quality score required */
    minQualityScore?: number;

    /** Minimum days active required */
    minDaysActive?: number;

    /** Specific signals required */
    requiredSignals?: string[];

    /** Custom validation logic (JSON) */
    custom?: Record<string, unknown>;
  };
}

/**
 * Validation rule for tier advancement.
 */
export interface ValidationRule {
  /** Type of validation rule */
  type:
    | 'signal_threshold'    // Advancement based on signal strength
    | 'time_based'         // Advancement based on time spent
    | 'quality_score'      // Advancement based on quality metrics
    | 'custom';            // Custom validation logic

  /** Configuration for the validation rule */
  config: {
    /** Comparison operator */
    operator: 'gt' | 'gte' | 'eq' | 'lte' | 'lt';

    /** Threshold value */
    threshold: number;

    /** Signal type (if applicable) */
    signalType?: string;

    /** Time period (for time-based rules) */
    period?: 'day' | 'week' | 'month';

    /** Custom validation function (JSON) */
    custom?: Record<string, unknown>;
  };
}

/**
 * Pre-built template for a lifecycle model.
 */
export interface ModelTemplate {
  /** Unique template identifier */
  id: string;

  /** Template name */
  name: string;

  /** Template description */
  description: string;

  /** Pre-populated tier structure */
  tiers: LifecycleTier[];

  /** Pre-populated validation rules */
  validationRules: ValidationRule[];

  /** Default settings for the model */
  defaults?: {
    /** Minimum tier count */
    minTiers?: number;

    /** Maximum tier count */
    maxTiers?: number;

    /** Whether to allow tier customization */
    allowCustomTiers?: boolean;

    /** Whether to show advancement metrics */
    showAdvancementMetrics?: boolean;
  };
}

/**
 * Payload for a lifecycle model GroveObject.
 *
 * Key design decisions:
 * - modelType indicates the category (botanical, academic, research, creative)
 * - version allows for model evolution
 * - tiers array defines the progression structure
 * - validationRules define advancement criteria
 * - templates provide pre-built examples
 */
export interface LifecycleModelPayload {
  /** Model name */
  name: string;

  /** Model description */
  description: string;

  /** Category of the model */
  modelType: 'botanical' | 'academic' | 'research' | 'creative';

  /** Model version for tracking changes */
  version: string;

  /** Tier definitions (minimum 3, maximum 7) */
  tiers: LifecycleTier[];

  /** Validation rules for tier advancement */
  validationRules: ValidationRule[];

  /** Optional pre-built templates */
  templates?: ModelTemplate[];

  /** Model metadata */
  metadata?: {
    /** Author or creator */
    author?: string;

    /** Source of the model */
    source?: string;

    /** License or usage terms */
    license?: string;

    /** Tags for categorization */
    tags?: string[];

    /** Preview image URL */
    previewImage?: string;

    /** Example sprout IDs that use this model */
    exampleSprouts?: string[];

    /** Statistics */
    stats?: {
      /** Number of sprouts using this model */
      sproutCount?: number;

      /** Average advancement rate */
      advancementRate?: number;

      /** Date of last advancement */
      lastAdvancementAt?: string;
    };
  };
}

/**
 * Type guard for LifecycleModelPayload validation.
 */
export function isLifecycleModelPayload(obj: unknown): obj is LifecycleModelPayload {
  if (typeof obj !== 'object' || obj === null) return false;

  const payload = obj as Record<string, unknown>;

  return (
    typeof payload.name === 'string' &&
    typeof payload.description === 'string' &&
    ['botanical', 'academic', 'research', 'creative'].includes(
      payload.modelType as string
    ) &&
    typeof payload.version === 'string' &&
    Array.isArray(payload.tiers) &&
    payload.tiers.length >= 3 &&
    payload.tiers.length <= 7 &&
    Array.isArray(payload.validationRules)
  );
}

/**
 * Create a new LifecycleModelPayload with defaults.
 */
export function createLifecycleModelPayload(
  modelType: LifecycleModelPayload['modelType'],
  options?: Partial<Omit<LifecycleModelPayload, 'modelType'>> & {
    tiers?: LifecycleTier[];
    validationRules?: ValidationRule[];
  }
): LifecycleModelPayload {
  return {
    name: options?.name ?? '',
    description: options?.description ?? '',
    modelType,
    version: options?.version ?? '1.0.0',
    tiers: options?.tiers ?? [],
    validationRules: options?.validationRules ?? [],
    templates: options?.templates,
    metadata: options?.metadata,
  };
}

/**
 * Get tiers sorted by order.
 */
export function getSortedTiers(payload: LifecycleModelPayload): LifecycleTier[] {
  return [...payload.tiers].sort((a, b) => a.order - b.order);
}

/**
 * Get a specific tier by ID.
 */
export function getTierById(payload: LifecycleModelPayload, tierId: string): LifecycleTier | undefined {
  return payload.tiers.find(tier => tier.id === tierId);
}

/**
 * Get the next tier in sequence.
 */
export function getNextTier(payload: LifecycleModelPayload, currentTierId: string): LifecycleTier | undefined {
  const sortedTiers = getSortedTiers(payload);
  const currentIndex = sortedTiers.findIndex(tier => tier.id === currentTierId);
  return currentIndex >= 0 && currentIndex < sortedTiers.length - 1
    ? sortedTiers[currentIndex + 1]
    : undefined;
}

/**
 * Get the previous tier in sequence.
 */
export function getPreviousTier(payload: LifecycleModelPayload, currentTierId: string): LifecycleTier | undefined {
  const sortedTiers = getSortedTiers(payload);
  const currentIndex = sortedTiers.findIndex(tier => tier.id === currentTierId);
  return currentIndex > 0 ? sortedTiers[currentIndex - 1] : undefined;
}

/**
 * Validate tier requirements.
 */
export function validateTierRequirements(
  tier: LifecycleTier,
  sproutData: {
    signalStrength?: number;
    qualityScore?: number;
    daysActive?: number;
    signals?: string[];
  }
): { valid: boolean; missing?: string[] } {
  const missing: string[] = [];

  if (tier.requirements) {
    if (tier.requirements.minSignalStrength !== undefined && (sproutData.signalStrength ?? 0) < tier.requirements.minSignalStrength) {
      missing.push('minSignalStrength');
    }

    if (tier.requirements.minQualityScore !== undefined && (sproutData.qualityScore ?? 0) < tier.requirements.minQualityScore) {
      missing.push('minQualityScore');
    }

    if (tier.requirements.minDaysActive !== undefined && (sproutData.daysActive ?? 0) < tier.requirements.minDaysActive) {
      missing.push('minDaysActive');
    }

    if (tier.requirements.requiredSignals) {
      const hasRequiredSignals = tier.requirements.requiredSignals.every(
        signal => sproutData.signals?.includes(signal)
      );
      if (!hasRequiredSignals) {
        missing.push('requiredSignals');
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing: missing.length > 0 ? missing : undefined,
  };
}

/**
 * Create a template-based lifecycle model.
 */
export function createModelFromTemplate(
  template: ModelTemplate,
  options?: Partial<Omit<LifecycleModelPayload, 'tiers' | 'validationRules' | 'metadata'>> & {
    modelType?: LifecycleModelPayload['modelType'];
    metadata?: LifecycleModelPayload['metadata'];
  }
): LifecycleModelPayload {
  return {
    name: options?.name ?? template.name,
    description: options?.description ?? template.description,
    modelType: options?.modelType ?? 'botanical',
    version: options?.version ?? '1.0.0',
    tiers: template.tiers,
    validationRules: template.validationRules,
    templates: options?.templates,
    metadata: {
      ...options?.metadata,
      source: 'template',
      tags: ['template', ...(options?.metadata?.tags ?? [])],
    },
  };
}

/**
 * Complete GroveObject type for LifecycleModel.
 * Combines meta (GroveObjectMeta) with payload (LifecycleModelPayload).
 */
export type LifecycleModel = GroveObject<LifecycleModelPayload>;

// ─────────────────────────────────────────────────────────────
// Default Templates - Pre-built model templates
// ─────────────────────────────────────────────────────────────

/**
 * Botanical model template (5 tiers).
 * Tier progression: Seed → Sprout → Sapling → Tree → Grove
 */
export const BOTANICAL_MODEL_TEMPLATE: ModelTemplate = {
  id: 'botanical-5-tier',
  name: 'Botanical Growth',
  description: 'The classic 5-tier botanical lifecycle model for natural growth patterns',
  tiers: [
    {
      id: 'seed',
      label: 'Seed',
      emoji: '🌰',
      order: 0,
      description: 'Just planted, not yet sprouted'
    },
    {
      id: 'sprout',
      label: 'Sprout',
      emoji: '🌱',
      order: 1,
      description: 'Breaking ground, early growth'
    },
    {
      id: 'sapling',
      label: 'Sapling',
      emoji: '🌿',
      order: 2,
      description: 'Growing stronger, taking shape'
    },
    {
      id: 'tree',
      label: 'Tree',
      emoji: '🌳',
      order: 3,
      description: 'Fully established, bearing fruit'
    },
    {
      id: 'grove',
      label: 'Grove',
      emoji: '🌲',
      order: 4,
      description: 'Part of the greater forest'
    }
  ],
  validationRules: [
    {
      type: 'signal_threshold',
      config: {
        operator: 'gte',
        threshold: 10,
        signalType: 'engagement'
      }
    },
    {
      type: 'time_based',
      config: {
        operator: 'gte',
        threshold: 7,
        period: 'day'
      }
    }
  ],
  defaults: {
    minTiers: 3,
    maxTiers: 7,
    allowCustomTiers: true,
    showAdvancementMetrics: true
  }
};

/**
 * Academic model template (4 tiers).
 * Tier progression: Course → Project → Thesis → Publication
 */
export const ACADEMIC_MODEL_TEMPLATE: ModelTemplate = {
  id: 'academic-4-tier',
  name: 'Academic Progression',
  description: '4-tier academic model following Course → Project → Thesis → Publication',
  tiers: [
    {
      id: 'course',
      label: 'Course',
      emoji: '📚',
      order: 0,
      description: 'Learning foundation, coursework phase'
    },
    {
      id: 'project',
      label: 'Project',
      emoji: '🔬',
      order: 1,
      description: 'Hands-on application, research phase'
    },
    {
      id: 'thesis',
      label: 'Thesis',
      emoji: '📄',
      order: 2,
      description: 'Deep research, dissertation phase'
    },
    {
      id: 'publication',
      label: 'Publication',
      emoji: '🎓',
      order: 3,
      description: 'Peer-reviewed contribution to field'
    }
  ],
  validationRules: [
    {
      type: 'quality_score',
      config: {
        operator: 'gte',
        threshold: 85
      }
    },
    {
      type: 'signal_threshold',
      config: {
        operator: 'gte',
        threshold: 15,
        signalType: 'quality'
      }
    }
  ],
  defaults: {
    minTiers: 4,
    maxTiers: 5,
    allowCustomTiers: true,
    showAdvancementMetrics: true
  }
};

/**
 * Research model template (6 tiers).
 * Tier progression: Question → Hypothesis → Experiment → Analysis → Results → Theory
 */
export const RESEARCH_MODEL_TEMPLATE: ModelTemplate = {
  id: 'research-6-tier',
  name: 'Scientific Research',
  description: '6-tier research model following the scientific method',
  tiers: [
    {
      id: 'question',
      label: 'Question',
      emoji: '❓',
      order: 0,
      description: 'Research question identification'
    },
    {
      id: 'hypothesis',
      label: 'Hypothesis',
      emoji: '🤔',
      order: 1,
      description: 'Formulating testable hypothesis'
    },
    {
      id: 'experiment',
      label: 'Experiment',
      emoji: '🧪',
      order: 2,
      description: 'Designing and running experiments'
    },
    {
      id: 'analysis',
      label: 'Analysis',
      emoji: '📊',
      order: 3,
      description: 'Data analysis and interpretation'
    },
    {
      id: 'results',
      label: 'Results',
      emoji: '✅',
      order: 4,
      description: 'Validated findings and conclusions'
    },
    {
      id: 'theory',
      label: 'Theory',
      emoji: '💡',
      order: 5,
      description: 'Contribution to body of knowledge'
    }
  ],
  validationRules: [
    {
      type: 'signal_threshold',
      config: {
        operator: 'gte',
        threshold: 20,
        signalType: 'validation'
      }
    },
    {
      type: 'time_based',
      config: {
        operator: 'gte',
        threshold: 30,
        period: 'day'
      }
    }
  ],
  defaults: {
    minTiers: 4,
    maxTiers: 8,
    allowCustomTiers: true,
    showAdvancementMetrics: true
  }
};

/**
 * Creative model template (5 tiers).
 * Tier progression: Idea → Draft → Revision → Refinement → Masterpiece
 */
export const CREATIVE_MODEL_TEMPLATE: ModelTemplate = {
  id: 'creative-5-tier',
  name: 'Creative Process',
  description: '5-tier creative model for artistic and design work',
  tiers: [
    {
      id: 'idea',
      label: 'Idea',
      emoji: '💭',
      order: 0,
      description: 'Initial concept and inspiration'
    },
    {
      id: 'draft',
      label: 'Draft',
      emoji: '✏️',
      order: 1,
      description: 'First iteration, rough execution'
    },
    {
      id: 'revision',
      label: 'Revision',
      emoji: '🔄',
      order: 2,
      description: 'Feedback integration, major changes'
    },
    {
      id: 'refinement',
      label: 'Refinement',
      emoji: '🎨',
      order: 3,
      description: 'Fine-tuning, polish, details'
    },
    {
      id: 'masterpiece',
      label: 'Masterpiece',
      emoji: '🏆',
      order: 4,
      description: 'Final work, ready for audience'
    }
  ],
  validationRules: [
    {
      type: 'signal_threshold',
      config: {
        operator: 'gte',
        threshold: 12,
        signalType: 'creativity'
      }
    },
    {
      type: 'quality_score',
      config: {
        operator: 'gte',
        threshold: 90
      }
    }
  ],
  defaults: {
    minTiers: 3,
    maxTiers: 7,
    allowCustomTiers: true,
    showAdvancementMetrics: true
  }
};

/**
 * All default model templates.
 */
export const DEFAULT_MODEL_TEMPLATES = [
  BOTANICAL_MODEL_TEMPLATE,
  ACADEMIC_MODEL_TEMPLATE,
  RESEARCH_MODEL_TEMPLATE,
  CREATIVE_MODEL_TEMPLATE
];

/**
 * Get a model template by ID.
 */
export function getModelTemplate(templateId: string): ModelTemplate | undefined {
  return DEFAULT_MODEL_TEMPLATES.find(template => template.id === templateId);
}

/**
 * Create a LifecycleModel from a template with GroveObject meta.
 */
export function createLifecycleModelFromTemplate(
  template: ModelTemplate,
  options?: {
    meta?: Partial<import('./grove-object').GroveObjectMeta>;
    payload?: Partial<Omit<LifecycleModelPayload, 'tiers' | 'validationRules' | 'metadata'>> & {
      metadata?: LifecycleModelPayload['metadata'];
    };
  }
): LifecycleModel {
  const payload = createModelFromTemplate(template, options?.payload);

  const meta: import('./grove-object').GroveObjectMeta = {
    id: crypto.randomUUID(),
    type: 'lifecycle-model',
    title: payload.name,
    description: payload.description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
    tags: ['template', ...(payload.metadata?.tags ?? [])],
    favorite: false,
    ...options?.meta
  };

  return {
    meta,
    payload
  };
}
