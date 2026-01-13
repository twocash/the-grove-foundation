// src/bedrock/types/ConsoleSchema.ts
// Console Factory v2 - Schema contracts for declarative console rendering
// Sprint: unified-experience-console-v1 (Console Factory v2)
//
// DEX Principle: Declarative Sovereignty
// Console behavior defined in schema, not code. Adding a new console type
// requires only a schema definition—no new components.

import type { LucideIcon } from 'lucide-react';
import type { InspectorCopilotConfig } from './InspectorCopilotConfig';

// =============================================================================
// Filter Schema
// =============================================================================

/**
 * Filter definition for console filter bar
 * Rendered by FilterBar component based on type
 */
export interface FilterDef {
  /** Unique filter ID */
  id: string;
  /** Display label */
  label: string;
  /** Filter input type */
  type: 'select' | 'text' | 'boolean';
  /** Options for select type */
  options?: string[];
  /** Field path to filter on (e.g., 'meta.status', 'payload.category') */
  field?: string;
}

// =============================================================================
// Inspector Schema
// =============================================================================

/**
 * Field definition for inspector form
 * Rendered by InspectorForm component based on type
 */
export interface InspectorField {
  /** Unique field ID (maps to data key) */
  id: string;
  /** Display label */
  label: string;
  /** Field input type */
  type: 'text' | 'textarea' | 'toggle' | 'number' | 'select' | 'readonly';
  /** Section grouping for accordion layout */
  section: 'identity' | 'config' | 'logic' | 'metadata';
  /** Placeholder text for inputs */
  placeholder?: string;
  /** Help text shown below field */
  helpText?: string;
  /** Options for select type */
  options?: { value: string; label: string }[];
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled/readonly */
  disabled?: boolean;
  /** Path in data object (defaults to id) */
  path?: string;
}

/**
 * Inspector schema defining the editor panel layout
 * Controls header, sections, and form fields
 */
export interface InspectorSchema {
  /** Field path for main title (H1) */
  titleField: string;
  /** Field path for subtitle (usually ID in monospace) */
  subtitleField?: string;
  /** Field path for status indicator */
  statusField?: string;
  /** Status field value that indicates "active" state */
  activeValue?: unknown;
  /** Form fields grouped by section */
  fields: InspectorField[];
  /** Section configuration */
  sections?: {
    identity?: { title: string; defaultExpanded: boolean };
    config?: { title: string; defaultExpanded: boolean };
    logic?: { title: string; defaultExpanded: boolean };
    metadata?: { title: string; defaultExpanded: boolean };
  };
  /** Copilot configuration (Sprint: inspector-copilot-v1) */
  copilot?: InspectorCopilotConfig;
}

// =============================================================================
// List Schema
// =============================================================================

/**
 * Sort option for console list
 */
export interface SortDef {
  /** Unique sort ID */
  id: string;
  /** Display label */
  label: string;
  /** Field path to sort on */
  field: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * List/grid configuration
 */
export interface ListSchema {
  /** Card display variant */
  cardVariant: 'standard' | 'compact' | 'detailed';
  /** Available sort options */
  sortOptions: SortDef[];
  /** Default sort option ID */
  defaultSort?: string;
  /** Enable grid/list view toggle */
  viewToggle?: boolean;
}

// =============================================================================
// Actions Schema
// =============================================================================

/**
 * Action definition for cards and inspector
 */
export interface ActionDef {
  /** Unique action ID */
  id: string;
  /** Display label */
  label: string;
  /** Material icon name */
  icon?: string;
  /** Action type */
  type: 'primary' | 'secondary' | 'danger';
  /** Confirmation message (if requires confirm) */
  confirmMessage?: string;
}

// =============================================================================
// Main Console Schema
// =============================================================================

/**
 * Complete console schema definition
 * This is the "DNA" of a console—everything needed to render it
 */
export interface ConsoleSchema {
  /** Unique console ID (matches service registry key) */
  id: string;

  /** Console identity (header display) */
  identity: {
    /** Console title */
    title: string;
    /** Console subtitle/description */
    subtitle?: string;
    /** Lucide icon component */
    icon: LucideIcon;
    /** Accent color class (e.g., 'text-emerald-500') */
    color: string;
  };

  /** Filter bar configuration */
  filters: FilterDef[];

  /** List/grid configuration */
  list: ListSchema;

  /** Inspector panel configuration */
  inspector: InspectorSchema;

  /** Card quick actions */
  cardActions?: ActionDef[];

  /** Inspector footer actions */
  inspectorActions?: {
    primary?: ActionDef;
    secondary?: ActionDef[];
  };

  /** Metrics for header display */
  metrics?: {
    id: string;
    label: string;
    icon: string;
    /** Pseudo-query (e.g., 'count(where: status=active)') */
    query: string;
  }[];
}

// =============================================================================
// Schema Registry Type
// =============================================================================

/**
 * Registry mapping console IDs to schemas
 */
export type ConsoleSchemaRegistry = Record<string, ConsoleSchema>;

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if value is a valid ConsoleSchema
 */
export function isConsoleSchema(value: unknown): value is ConsoleSchema {
  if (!value || typeof value !== 'object') return false;
  const schema = value as ConsoleSchema;
  return (
    typeof schema.id === 'string' &&
    typeof schema.identity === 'object' &&
    Array.isArray(schema.filters) &&
    typeof schema.list === 'object' &&
    typeof schema.inspector === 'object'
  );
}
