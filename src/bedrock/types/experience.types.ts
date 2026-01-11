// src/bedrock/types/experience.types.ts
// Experience Object Type Registry - Defines all object types manageable via ExperiencesConsole
// Hotfix: experiences-console-v1.1
//
// DEX Principle: Organic Scalability
// New experience object types are added to this registry without code changes to console-factory.

import type { SystemPromptPayload } from '@core/schema/system-prompt';
import { DEFAULT_SYSTEM_PROMPT_PAYLOAD } from '@core/schema/system-prompt';
import type { PromptArchitectConfigPayload } from '@core/schema/prompt-architect-config';
import { DEFAULT_PROMPT_ARCHITECT_CONFIG_PAYLOAD } from '@core/schema/prompt-architect-config';

// =============================================================================
// Registry Types
// =============================================================================

/**
 * Definition for an experience object type
 * Each type registered here can be managed via ExperiencesConsole
 */
export interface ExperienceTypeDefinition<T = unknown> {
  /** Unique type identifier (matches GroveObjectType) */
  type: string;
  /** Human-readable label */
  label: string;
  /** Material icon name */
  icon: string;
  /** Brief description of what this type controls */
  description: string;
  /** Default payload for new objects of this type */
  defaultPayload: T;
  /** Wizard definition ID for guided creation (optional) */
  wizardId?: string;
  /** Editor component name for inspector panel */
  editorComponent: string;
  /** Whether multiple can be active simultaneously */
  allowMultipleActive: boolean;
  /** Route path for this type's management (e.g., '/bedrock/experiences') */
  routePath: string;
  /** Accent color for badges/cards (optional) */
  color?: string;
}

// =============================================================================
// Registry
// =============================================================================

/**
 * Experience Object Type Registry
 *
 * Add new experience types here to make them manageable via ExperiencesConsole.
 * The console will automatically support CRUD, activation, and versioning.
 *
 * @example Adding a new type:
 * ```typescript
 * 'feature-flag': {
 *   type: 'feature-flag',
 *   label: 'Feature Flag',
 *   icon: 'flag',
 *   description: 'Toggle features on/off across the application',
 *   defaultPayload: DEFAULT_FEATURE_FLAG_PAYLOAD,
 *   wizardId: 'feature-flag-creator',
 *   editorComponent: 'FeatureFlagEditor',
 *   allowMultipleActive: true,
 *   routePath: '/bedrock/feature-flags',
 * },
 * ```
 */
export const EXPERIENCE_TYPE_REGISTRY = {
  'system-prompt': {
    type: 'system-prompt',
    label: 'System Prompt',
    icon: 'smart_toy',
    description: 'Controls AI behavior and personality in /explore',
    defaultPayload: DEFAULT_SYSTEM_PROMPT_PAYLOAD,
    wizardId: 'system-prompt-creator',
    editorComponent: 'SystemPromptEditor',
    allowMultipleActive: false, // Single-active model
    routePath: '/bedrock/experiences',
    color: '#2F5C3B', // grove-forest
  } satisfies ExperienceTypeDefinition<SystemPromptPayload>,

  // Sprint: sprout-research-v1 - Prompt Architect configuration
  // SINGLETON pattern: One active config per grove
  'prompt-architect-config': {
    type: 'prompt-architect-config',
    label: 'Research Config',
    icon: 'science',
    description: 'Grove-level research DNA: hypothesis goals, inference rules, quality gates',
    defaultPayload: DEFAULT_PROMPT_ARCHITECT_CONFIG_PAYLOAD,
    wizardId: undefined, // Admin-only, no wizard
    editorComponent: 'PromptArchitectConfigEditor', // Phase 4+
    allowMultipleActive: false, // SINGLETON: One active per grove
    routePath: '/bedrock/research-config',
    color: '#7E57C2', // Purple for research
  } satisfies ExperienceTypeDefinition<PromptArchitectConfigPayload>,

  // Future types (commented templates for reference):
  //
  // 'feature-flag': {
  //   type: 'feature-flag',
  //   label: 'Feature Flag',
  //   icon: 'flag',
  //   description: 'Toggle features on/off',
  //   defaultPayload: DEFAULT_FEATURE_FLAG_PAYLOAD,
  //   editorComponent: 'FeatureFlagEditor',
  //   allowMultipleActive: true,
  //   routePath: '/bedrock/feature-flags',
  // },
  //
  // 'welcome-config': {
  //   type: 'welcome-config',
  //   label: 'Welcome Configuration',
  //   icon: 'waving_hand',
  //   description: 'Configure onboarding and welcome experiences',
  //   defaultPayload: DEFAULT_WELCOME_CONFIG_PAYLOAD,
  //   editorComponent: 'WelcomeConfigEditor',
  //   allowMultipleActive: false,
  //   routePath: '/bedrock/welcome',
  // },
} as const;

// =============================================================================
// Type Utilities
// =============================================================================

/**
 * Union type of all registered experience object types
 */
export type ExperienceObjectType = keyof typeof EXPERIENCE_TYPE_REGISTRY;

/**
 * Maps experience object types to their payload interfaces.
 * Enables type-safe payload access based on object type.
 */
export interface ExperiencePayloadMap {
  'system-prompt': SystemPromptPayload;
  'prompt-architect-config': PromptArchitectConfigPayload;
  // Future: 'feature-flag': FeatureFlagPayload;
}

/**
 * Get type definition by type key
 */
export function getExperienceTypeDefinition<T extends ExperienceObjectType>(
  type: T
): (typeof EXPERIENCE_TYPE_REGISTRY)[T] {
  return EXPERIENCE_TYPE_REGISTRY[type];
}

/**
 * Check if a type key is a valid experience object type
 */
export function isExperienceObjectType(type: string): type is ExperienceObjectType {
  return type in EXPERIENCE_TYPE_REGISTRY;
}

/**
 * Get all registered type definitions as array
 */
export function getAllExperienceTypes(): ExperienceTypeDefinition[] {
  return Object.values(EXPERIENCE_TYPE_REGISTRY);
}

// =============================================================================
// Legacy Compatibility (deprecated - use new functions above)
// =============================================================================

/**
 * @deprecated Use ExperienceTypeDefinition instead
 */
export type ExperienceTypeConfig = ExperienceTypeDefinition;

/**
 * @deprecated Use getExperienceTypeDefinition instead
 */
export function getExperienceTypeConfig(type: ExperienceObjectType): ExperienceTypeDefinition | undefined {
  return isExperienceObjectType(type) ? getExperienceTypeDefinition(type) : undefined;
}

/**
 * @deprecated Use getAllExperienceTypes instead
 */
export function hasWizardSupport(type: ExperienceObjectType): boolean {
  const config = getExperienceTypeDefinition(type);
  return config?.wizardId !== undefined;
}
