// src/core/json-render/types.ts
// Sprint: S19-BD-JsonRenderFactory
// Single source of truth for json-render types
//
// Pattern: Defines the component vocabulary and render tree structure
// All catalogs import from here to avoid duplication

import { z } from 'zod';

// =============================================================================
// RENDER ELEMENT TYPES
// =============================================================================

/**
 * Provenance tracking for render elements
 * Tracks who/what created each element for audit trail
 */
export interface RenderProvenance {
  createdBy: 'system' | 'agent' | 'user';
  timestamp?: string;
  source?: string;
}

/**
 * RenderElement - Single unit in a render tree
 *
 * @template T - Props type for the element
 * @property type - Namespaced component type (e.g., "base:Stack", "signals:QualityGauge")
 * @property props - Component-specific props
 * @property key - Optional React key for lists
 * @property provenance - Optional tracking of element origin
 */
export interface RenderElement<T = unknown> {
  type: string;
  props: T;
  key?: string;
  provenance?: RenderProvenance;
}

/**
 * RenderTree - Root container for render elements
 *
 * @property type - Always 'root'
 * @property children - Array of RenderElements to render
 * @property meta - Optional metadata about the tree
 */
export interface RenderTree {
  type: 'root';
  children: RenderElement[];
  meta?: {
    catalog: string;
    version: string;
    generatedAt?: string;
    generatedBy?: 'system' | 'agent' | 'user';
  };
}

// =============================================================================
// CATALOG TYPES
// =============================================================================

/**
 * Component metadata for catalog registration
 *
 * @template T - Zod schema type for props validation
 * @property props - Zod schema defining valid props
 * @property description - Human-readable component description
 * @property category - Component category for organization
 * @property agentHint - Hint for AI agents on when to use this component
 */
export interface ComponentMeta<T extends z.ZodType = z.ZodType> {
  props: T;
  description?: string;
  category: 'layout' | 'data' | 'feedback' | 'navigation' | 'custom';
  agentHint?: string;
}

/**
 * Catalog definition containing component vocabulary
 *
 * @property name - Catalog name (used as namespace prefix)
 * @property version - Semantic version
 * @property components - Map of component names to metadata
 * @property extends - Parent catalogs this inherits from
 */
export interface CatalogDefinition {
  name: string;
  version: string;
  components: Record<string, ComponentMeta>;
  extends?: string[];
}

// =============================================================================
// REGISTRY TYPES
// =============================================================================

/**
 * Registered component with React implementation
 */
export interface RegisteredComponent {
  meta: ComponentMeta;
  catalog: string;
  render: React.FC<{ element: RenderElement }>;
}

/**
 * Component registry interface
 */
export interface ComponentRegistry {
  register(namespace: string, name: string, component: RegisteredComponent): void;
  get(fullType: string): RegisteredComponent | undefined;
  has(fullType: string): boolean;
  listAll(): Map<string, RegisteredComponent>;
  listByNamespace(namespace: string): Map<string, RegisteredComponent>;
  getNamespaces(): string[];
}

// =============================================================================
// HELPER TYPES
// =============================================================================

/**
 * Parsed component name with namespace
 */
export interface ParsedComponentName {
  namespace: string;
  name: string;
  fullType: string;
}

/**
 * Options for creating a new catalog
 */
export interface CreateCatalogOptions {
  name: string;
  version?: string;
  extends?: CatalogDefinition[];
  components: Record<string, ComponentMeta>;
}

/**
 * Validation result for render trees
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  element?: RenderElement;
}

export interface ValidationWarning {
  path: string;
  message: string;
  element?: RenderElement;
}

// =============================================================================
// ZOD SCHEMAS FOR CORE TYPES
// =============================================================================

export const RenderProvenanceSchema = z.object({
  createdBy: z.enum(['system', 'agent', 'user']),
  timestamp: z.string().optional(),
  source: z.string().optional(),
});

export const RenderElementSchema: z.ZodType<RenderElement> = z.object({
  type: z.string().min(1),
  props: z.unknown(),
  key: z.string().optional(),
  provenance: RenderProvenanceSchema.optional(),
});

export const RenderTreeSchema: z.ZodType<RenderTree> = z.object({
  type: z.literal('root'),
  children: z.array(RenderElementSchema),
  meta: z.object({
    catalog: z.string(),
    version: z.string(),
    generatedAt: z.string().optional(),
    generatedBy: z.enum(['system', 'agent', 'user']).optional(),
  }).optional(),
});

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isRenderElement(value: unknown): value is RenderElement {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as RenderElement).type === 'string' &&
    'props' in value
  );
}

export function isRenderTree(value: unknown): value is RenderTree {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    (value as RenderTree).type === 'root' &&
    'children' in value &&
    Array.isArray((value as RenderTree).children)
  );
}
