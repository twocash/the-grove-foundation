// src/bedrock/types/console.types.ts
// Console configuration types for Bedrock
// Sprint: bedrock-foundation-v1 (Epic 1, Story 1.1)

// =============================================================================
// Metric Configuration
// =============================================================================

export interface MetricConfig {
  id: string;
  label: string;
  query: string;           // e.g., 'count(*)' or 'count(where: isActive)'
  format?: 'number' | 'relative' | 'percentage';
  icon?: string;
  accent?: 'cyan' | 'violet' | 'amber' | 'green' | 'red';
}

// =============================================================================
// Navigation Configuration
// =============================================================================

export interface NavItemConfig {
  id?: string;
  type?: 'divider' | 'header';
  label?: string;
  icon?: string;
  filter?: Record<string, unknown>;
  badge?: number;
}

// =============================================================================
// Sort Configuration
// =============================================================================

export interface SortOption {
  field: string;
  label: string;
  direction: 'asc' | 'desc';
}

// =============================================================================
// Filter Configuration
// =============================================================================

export type FilterType = 'select' | 'boolean' | 'date-range' | 'number-range' | 'text';

export interface FilterOption {
  field: string;
  label: string;
  type: FilterType;
  options?: string[];           // For 'select' type (static options)
  dynamic?: boolean;            // If true, options computed from data
  dynamicThreshold?: number;    // Minimum count to include in dynamic options (default: 5)
  trueLabel?: string;           // For 'boolean' type
  falseLabel?: string;          // For 'boolean' type
  min?: number;                 // For 'number-range' type
  max?: number;                 // For 'number-range' type
}

// =============================================================================
// Collection View Configuration
// =============================================================================

export interface CollectionViewConfig {
  searchFields: string[];
  sortOptions: SortOption[];
  defaultSort: SortOption;
  filterOptions: FilterOption[];
  /** Default filter values applied on initial load */
  defaultFilters?: Record<string, string | string[]>;
  viewModes: ('grid' | 'list')[];
  defaultViewMode: 'grid' | 'list';
  favoritesKey: string;
  pageSize?: number;
}

// =============================================================================
// Copilot Configuration
// =============================================================================

export interface CopilotAction {
  id: string;
  trigger: string;              // e.g., 'set * to *'
  description: string;
  modelPreference?: 'local' | 'hybrid' | 'cloud';
  aliases?: string[];           // Alternative trigger phrases
}

/**
 * Quick action button configuration for Copilot UI
 * Sprint: prompt-copilot-actions-v1
 */
export interface QuickAction {
  /** Unique action identifier (matches action handler) */
  id: string;
  /** Button label */
  label: string;
  /** Material Symbols icon name */
  icon: string;
  /** Command or action ID to execute */
  command: string;
}

export interface CopilotConfig {
  enabled: boolean;
  model?: string;
  actions: CopilotAction[];
  /** Quick action buttons shown in Copilot UI */
  quickActions?: QuickAction[];
}

// =============================================================================
// Singleton Configuration
// Sprint: singleton-pattern-factory-v1
// =============================================================================

/**
 * Versioning configuration for singleton objects
 * Enables automatic version creation when editing active configs
 */
export interface SingletonVersioningConfig {
  /** Field path for version number, e.g., 'payload.version' */
  versionField: string;
  /** Field path for previous version ID, e.g., 'payload.previousVersionId' */
  previousIdField: string;
  /** Optional field path for changelog notes, e.g., 'payload.changelog' */
  changelogField?: string;
}

/**
 * Configuration for singleton behavior in consoles
 * Ensures only one object of a type can be active at a time
 */
export interface SingletonConfig {
  /** Enable singleton behavior */
  enabled: boolean;
  /** Field path for status, e.g., 'meta.status' */
  statusField: string;
  /** Value indicating active status, e.g., 'active' */
  activeValue: string;
  /** Value indicating draft status, e.g., 'draft' */
  draftValue: string;
  /** Value indicating archived status, e.g., 'archived' */
  archivedValue: string;
  /**
   * For polymorphic consoles: field path for type discrimination
   * When set, singletons are per-type (e.g., one active ResearchAgent, one active WriterAgent)
   * e.g., 'meta.type'
   */
  typeField?: string;
  /** Versioning configuration (optional) */
  versioning?: SingletonVersioningConfig;
  /** Cache invalidation endpoint (optional), e.g., '/api/cache/invalidate' */
  cacheInvalidationEndpoint?: string;
  /** Cache invalidation type identifier, e.g., 'system-prompt' */
  cacheInvalidationType?: string;
}

// =============================================================================
// Primary Action Configuration
// =============================================================================

export interface PrimaryActionConfig {
  label: string;
  icon: string;
  action: 'create' | 'custom';
  customAction?: () => void;
}

// =============================================================================
// Secondary Action Configuration
// Sprint: prompt-extraction-pipeline-v1
// =============================================================================

export interface SecondaryActionConfig {
  id: string;
  label: string;
  icon: string;
  /** Action type - 'modal' opens a modal, 'custom' calls customAction */
  action: 'modal' | 'custom';
  /** Modal ID to open (for 'modal' action type) */
  modalId?: string;
  /** Custom handler (for 'custom' action type) */
  customAction?: () => void;
}

// =============================================================================
// Console Configuration
// =============================================================================

export interface ConsoleConfig {
  id: string;
  title: string;
  /** Sprint: exploration-node-unification-v1 - Optional subtitle for display */
  subtitle?: string;
  description: string;
  primaryAction?: PrimaryActionConfig;
  /** Sprint: prompt-extraction-pipeline-v1 - Secondary action buttons */
  secondaryActions?: SecondaryActionConfig[];
  metrics: MetricConfig[];
  navigation: NavItemConfig[];
  collectionView: CollectionViewConfig;
  copilot: CopilotConfig;
  /**
   * Singleton configuration for enforcing single-active-object behavior
   * Sprint: singleton-pattern-factory-v1
   */
  singleton?: SingletonConfig;
}
