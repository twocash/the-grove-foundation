// src/bedrock/types/experience.types.ts
// Experience Object Type Registry - Defines all object types manageable via ExperienceConsole
// Sprint: unified-experience-console-v1 (polymorphic console refactor)
//
// DEX Principle: Organic Scalability
// New experience object types are added to this registry without code changes to console-factory.
// DEX Principle: Declarative Sovereignty
// Console behavior is driven by registry configuration, not hardcoded in components.

import type { SystemPromptPayload } from '@core/schema/system-prompt';
import { DEFAULT_SYSTEM_PROMPT_PAYLOAD } from '@core/schema/system-prompt';
import type { PromptArchitectConfigPayload } from '@core/schema/prompt-architect-config';
import { DEFAULT_PROMPT_ARCHITECT_CONFIG_PAYLOAD } from '@core/schema/prompt-architect-config';
import type { FeatureFlagPayload } from '@core/schema/feature-flag';
import { createFeatureFlagPayload } from '@core/schema/feature-flag';

// =============================================================================
// Console Configuration Types (for polymorphic console)
// =============================================================================

/**
 * Metric definition for console header metrics row
 * DEX: Generated dynamically from registry at runtime
 */
export interface MetricDefinition {
  /** Unique metric ID */
  id: string;
  /** Display label */
  label: string;
  /** Material icon name */
  icon: string;
  /** Pseudo-query for counting (e.g., 'count(where: payload.available=true)') */
  query: string;
  /** Only count objects of this type (optional) */
  typeFilter?: string;
}

/**
 * Filter definition for console filter bar
 * DEX: Type-specific filters are merged with common filters at runtime
 */
export interface FilterDefinition {
  /** Field path to filter on (e.g., 'meta.status', 'payload.category') */
  field: string;
  /** Display label */
  label: string;
  /** Filter input type */
  type: 'select' | 'boolean';
  /** Options for select type */
  options?: string[];
}

/**
 * Sort option definition for console sort dropdown
 * DEX: Type-specific sorts are merged with common sorts at runtime
 */
export interface SortDefinition {
  /** Field path to sort on (e.g., 'meta.updatedAt', 'payload.headerOrder') */
  field: string;
  /** Display label */
  label: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

// =============================================================================
// Registry Types
// =============================================================================

/**
 * Definition for an experience object type
 * Each type registered here can be managed via ExperienceConsole
 *
 * Sprint: unified-experience-console-v1
 * Extended with cardComponent, dataHookName, metrics, filters, sortOptions
 * for polymorphic console rendering.
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
  /** Route path for this type's management (e.g., '/bedrock/experience') */
  routePath: string;
  /** Accent color for badges/cards (optional) */
  color?: string;

  // =========================================================================
  // NEW: Polymorphic Console Support (unified-experience-console-v1)
  // =========================================================================

  /** Card component name for grid/list view (resolved via component-registry) */
  cardComponent: string;
  /** Data hook name for CRUD operations (resolved via hook-registry) */
  dataHookName: string;
  /** Type-specific metrics for console header (optional - merged with common metrics) */
  metrics?: MetricDefinition[];
  /** Type-specific filters (optional - merged with common filters) */
  filters?: FilterDefinition[];
  /** Type-specific sort options (optional - merged with common sorts) */
  sortOptions?: SortDefinition[];
  /** Search fields for this type (merged with common search fields) */
  searchFields?: string[];
}

// =============================================================================
// Registry
// =============================================================================

/**
 * Experience Object Type Registry
 *
 * Add new experience types here to make them manageable via ExperienceConsole.
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
    routePath: '/bedrock/experience',
    color: '#2F5C3B', // grove-forest
    // Polymorphic console support (unified-experience-console-v1)
    cardComponent: 'SystemPromptCard',
    dataHookName: 'useExperienceData',
    searchFields: ['meta.title', 'meta.description', 'payload.identity', 'payload.voiceGuidelines'],
    metrics: [
      { id: 'active', label: 'Active', icon: 'check_circle', query: 'count(where: status=active)', typeFilter: 'system-prompt' },
      { id: 'drafts', label: 'Drafts', icon: 'edit_note', query: 'count(where: status=draft)', typeFilter: 'system-prompt' },
    ],
    // Note: meta.status filter is provided by common statusFilter in ExperienceConsole.config.ts
    // No type-specific filters needed for system-prompt
    sortOptions: [
      { field: 'payload.version', label: 'Version', direction: 'desc' },
    ],
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
    // Polymorphic console support (unified-experience-console-v1)
    // Note: This type has its own console for now, not unified
    cardComponent: 'PromptArchitectConfigCard',
    dataHookName: 'usePromptArchitectConfigData',
    searchFields: ['meta.title', 'meta.description'],
  } satisfies ExperienceTypeDefinition<PromptArchitectConfigPayload>,

  // Sprint: feature-flags-v1 - Feature Flag management
  // INSTANCE pattern: Many flags active simultaneously
  // Sprint: unified-experience-console-v1 - Consolidated into /bedrock/experience
  'feature-flag': {
    type: 'feature-flag',
    label: 'Feature Flag',
    icon: 'toggle_on',
    description: 'Toggle features on/off across the application',
    defaultPayload: createFeatureFlagPayload('new-flag'),
    wizardId: undefined, // Simple form, no wizard needed
    editorComponent: 'FeatureFlagEditor',
    allowMultipleActive: true, // INSTANCE: Many active simultaneously
    routePath: '/bedrock/experience', // CHANGED: Consolidated into unified console
    color: '#D95D39', // grove-clay (orange accent)
    // Polymorphic console support (unified-experience-console-v1)
    cardComponent: 'FeatureFlagCard',
    dataHookName: 'useFeatureFlagsData',
    searchFields: ['meta.title', 'meta.description', 'payload.flagId', 'payload.headerLabel'],
    metrics: [
      { id: 'available', label: 'Available', icon: 'check_circle', query: 'count(where: payload.available=true)', typeFilter: 'feature-flag' },
      { id: 'disabled', label: 'Disabled', icon: 'block', query: 'count(where: payload.available=false)', typeFilter: 'feature-flag' },
      { id: 'header', label: 'In Header', icon: 'visibility', query: 'count(where: payload.showInExploreHeader=true)', typeFilter: 'feature-flag' },
    ],
    filters: [
      { field: 'payload.available', label: 'Availability', type: 'select', options: ['true', 'false'] },
      { field: 'payload.category', label: 'Category', type: 'select', options: ['experience', 'research', 'experimental', 'internal'] },
      { field: 'payload.showInExploreHeader', label: 'Header', type: 'select', options: ['true', 'false'] },
    ],
    sortOptions: [
      { field: 'payload.flagId', label: 'Flag ID', direction: 'asc' },
      { field: 'payload.headerOrder', label: 'Header Order', direction: 'asc' },
    ],
  } satisfies ExperienceTypeDefinition<FeatureFlagPayload>,

  // Future types (commented templates for reference):
  //
  // 'welcome-config': {
  //   type: 'welcome-config',
  //   label: 'Welcome Configuration',
  //   icon: 'waving_hand',
  //   description: 'Configure onboarding and welcome experiences',
  //   defaultPayload: DEFAULT_WELCOME_CONFIG_PAYLOAD,
  //   editorComponent: 'WelcomeConfigEditor',
  //   cardComponent: 'WelcomeConfigCard',
  //   dataHookName: 'useWelcomeConfigData',
  //   allowMultipleActive: false,
  //   routePath: '/bedrock/experience',
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
  'feature-flag': FeatureFlagPayload;
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
