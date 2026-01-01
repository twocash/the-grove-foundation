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
  options?: string[];           // For 'select' type
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
}

export interface CopilotConfig {
  enabled: boolean;
  model?: string;
  actions: CopilotAction[];
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
// Console Configuration
// =============================================================================

export interface ConsoleConfig {
  id: string;
  title: string;
  description: string;
  primaryAction?: PrimaryActionConfig;
  metrics: MetricConfig[];
  navigation: NavItemConfig[];
  collectionView: CollectionViewConfig;
  copilot: CopilotConfig;
}
