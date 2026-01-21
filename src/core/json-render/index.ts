// src/core/json-render/index.ts
// Sprint: S19-BD-JsonRenderFactory
// Public API exports for json-render factory
//
// Usage:
//   import { createCatalog, BaseCatalog, parseComponentName } from '@core/json-render';

// =============================================================================
// TYPES
// =============================================================================

export type {
  RenderElement,
  RenderTree,
  RenderProvenance,
  ComponentMeta,
  CatalogDefinition,
  RegisteredComponent,
  ComponentRegistry,
  ParsedComponentName,
  CreateCatalogOptions,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './types';

export {
  RenderElementSchema,
  RenderTreeSchema,
  RenderProvenanceSchema,
  isRenderElement,
  isRenderTree,
} from './types';

// =============================================================================
// BASE CATALOG
// =============================================================================

export { BaseCatalog } from './base-catalog';

// Base component schemas
export {
  StackSchema,
  GridSchema,
  ContainerSchema,
  SpacerSchema,
  DividerSchema,
  TextSchema,
  MetricSchema,
  BadgeSchema,
  ProgressSchema,
  HeaderSchema,
  EmptySchema,
  LoadingSchema,
  AlertSchema,
} from './base-catalog';

// Base component prop types
export type {
  StackProps,
  GridProps,
  ContainerProps,
  SpacerProps,
  DividerProps,
  TextProps,
  MetricProps,
  BadgeProps,
  ProgressProps,
  HeaderProps,
  EmptyProps,
  LoadingProps,
  AlertProps,
} from './base-catalog';

// =============================================================================
// FACTORY
// =============================================================================

export {
  createCatalog,
  hasComponent,
  getComponentMeta,
  listComponents,
  listComponentsByCategory,
  mergeCatalogs,
  pickComponents,
  omitComponents,
  getCatalogInfo,
} from './factory';

// =============================================================================
// NAMESPACING
// =============================================================================

export {
  NAMESPACE_SEPARATOR,
  DEFAULT_NAMESPACE,
  parseComponentName,
  makeComponentType,
  isNamespaced,
  normalizeType,
  normalizeTreeNamespaces,
  normalizeElementNamespace,
  remapTreeNamespace,
  expandShorthand,
  expandTreeShorthands,
  extractNamespaces,
  groupByNamespace,
  filterByNamespace,
} from './namespacing';

// =============================================================================
// VALIDATION
// =============================================================================

export {
  validateRenderTree,
  isValidTreeStructure,
  validateTreeStructure,
  getUnknownComponents,
  getRequiredNamespaces,
  sanitizeTree,
  replaceUnknownComponents,
} from './validation';
