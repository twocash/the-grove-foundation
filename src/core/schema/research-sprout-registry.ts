// src/core/schema/research-sprout-registry.ts
// Research Sprout Registry - Constants and configuration
// Sprint: sprout-research-v1, Phase 2b
//
// This registry provides type configuration for ResearchSprouts.
// Unlike EXPERIENCE_TYPE_REGISTRY (for singletons), this is for
// the INSTANCE pattern where many active objects coexist.

import type { ResearchSproutStatus } from './research-sprout';

// =============================================================================
// Status Configuration
// =============================================================================

/**
 * Human-readable labels for sprout statuses
 */
export const RESEARCH_SPROUT_STATUS_LABELS: Record<ResearchSproutStatus, string> = {
  pending: 'Pending',
  active: 'In Progress',
  paused: 'Paused',
  blocked: 'Needs Attention',
  completed: 'Completed',
  archived: 'Archived',
};

/**
 * Material icons for sprout statuses
 */
export const RESEARCH_SPROUT_STATUS_ICONS: Record<ResearchSproutStatus, string> = {
  pending: 'hourglass_empty',
  active: 'play_circle',
  paused: 'pause_circle',
  blocked: 'warning',
  completed: 'check_circle',
  archived: 'archive',
};

/**
 * Colors for sprout statuses (Tailwind color names)
 */
export const RESEARCH_SPROUT_STATUS_COLORS: Record<ResearchSproutStatus, string> = {
  pending: 'amber',
  active: 'blue',
  paused: 'slate',
  blocked: 'red',
  completed: 'green',
  archived: 'gray',
};

/**
 * Statuses that indicate the sprout is "live" (not terminal)
 */
export const ACTIVE_STATUSES: ResearchSproutStatus[] = [
  'pending',
  'active',
  'paused',
  'blocked',
];

/**
 * Statuses that indicate the sprout is terminal (cannot resume)
 */
export const TERMINAL_STATUSES: ResearchSproutStatus[] = [
  'completed',
  'archived',
];

// =============================================================================
// Table Configuration (Supabase)
// =============================================================================

/**
 * Supabase table name for research sprouts
 */
export const RESEARCH_SPROUTS_TABLE = 'research_sprouts';

/**
 * Supabase table name for sprout status history
 */
export const SPROUT_STATUS_HISTORY_TABLE = 'research_sprout_status_history';

/**
 * Supabase table name for sprout gate decisions
 */
export const SPROUT_GATE_DECISIONS_TABLE = 'research_sprout_gate_decisions';

/**
 * Supabase table name for sprout evidence
 */
export const SPROUT_EVIDENCE_TABLE = 'research_sprout_evidence';

// =============================================================================
// Query Defaults
// =============================================================================

/**
 * Default page size for sprout queries
 */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Default sort order for sprout lists
 */
export const DEFAULT_SORT_ORDER: {
  field: 'createdAt' | 'updatedAt' | 'status';
  direction: 'asc' | 'desc';
} = {
  field: 'updatedAt',
  direction: 'desc',
};

/**
 * Filter presets for Garden Inspector
 */
export const FILTER_PRESETS = {
  /** Active research (not completed/archived) */
  active: {
    id: 'active',
    label: 'Active Research',
    statuses: ACTIVE_STATUSES,
  },
  /** Needs attention (blocked) */
  attention: {
    id: 'attention',
    label: 'Needs Attention',
    statuses: ['blocked' as ResearchSproutStatus],
  },
  /** Completed research */
  completed: {
    id: 'completed',
    label: 'Completed',
    statuses: ['completed' as ResearchSproutStatus],
  },
  /** All sprouts including archived */
  all: {
    id: 'all',
    label: 'All Research',
    statuses: [...ACTIVE_STATUSES, ...TERMINAL_STATUSES],
  },
} as const;

// =============================================================================
// Feature Flags
// =============================================================================

/**
 * Feature flag keys for the sprout research system
 */
export const SPROUT_RESEARCH_FLAGS = {
  /** Master flag for the entire sprout research system */
  ENABLED: 'sprout-research',

  /** Flag for Garden Inspector panel */
  GARDEN_INSPECTOR: 'garden-inspector',

  /** Flag for agent auto-execution */
  AGENT_AUTO_EXECUTE: 'research-agent-auto-execute',

  /** Flag for legacy sprout capture (should be disabled in /explore) */
  LEGACY_DISABLED: 'legacy-sprout-disabled',
} as const;

// =============================================================================
// Limits
// =============================================================================

/**
 * System-level limits (can be overridden by PromptArchitectConfig)
 */
export const SYSTEM_LIMITS = {
  /** Maximum number of pending sprouts per user */
  MAX_PENDING_PER_USER: 10,

  /** Maximum number of active sprouts per grove */
  MAX_ACTIVE_PER_GROVE: 50,

  /** Maximum characters in spark */
  MAX_SPARK_LENGTH: 2000,

  /** Maximum branches per sprout (default) */
  MAX_BRANCHES: 5,

  /** Maximum spawn depth (default) */
  MAX_SPAWN_DEPTH: 2,

  /** Evidence retention days */
  EVIDENCE_RETENTION_DAYS: 90,
} as const;

// =============================================================================
// Type Registry Entry
// =============================================================================

/**
 * Type registry entry for ResearchSprout
 *
 * This follows the pattern of EXPERIENCE_TYPE_REGISTRY but for
 * the INSTANCE pattern (many active) vs SINGLETON (one active).
 */
export const RESEARCH_SPROUT_TYPE_CONFIG = {
  /** Type identifier (matches GroveObjectType) */
  type: 'research-sprout',

  /** Human-readable label */
  label: 'Research Sprout',

  /** Material icon name */
  icon: 'science',

  /** Description */
  description: 'Agent-driven research investigation with full provenance',

  /** Pattern: INSTANCE (many active per grove) */
  pattern: 'instance' as const,

  /** Supabase table */
  table: RESEARCH_SPROUTS_TABLE,

  /** Route path for management */
  routePath: '/explore',

  /** Accent color */
  color: '#7E57C2', // Purple for research
} as const;

// =============================================================================
// Exports
// =============================================================================

export type FilterPresetId = keyof typeof FILTER_PRESETS;
