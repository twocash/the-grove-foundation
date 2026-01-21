// src/bedrock/json-render/index.ts
// Sprint: S19-BD-JsonRenderFactory
// Public API exports for bedrock json-render
//
// Usage:
//   import { JsonRenderer, componentRegistry } from '@bedrock/json-render';
//   import '@bedrock/json-render/register-base'; // Register base components

// =============================================================================
// MAIN RENDERER
// =============================================================================

export {
  JsonRenderer,
  ElementRenderer,
  ElementPreview,
  UnknownComponent,
  RenderErrorBoundary,
} from './JsonRenderer';

export type { JsonRendererProps } from './JsonRenderer';

// =============================================================================
// REGISTRY
// =============================================================================

export {
  componentRegistry,
  registerComponent,
  registerCatalog,
  getComponent,
  hasComponent,
} from './registry';

// =============================================================================
// RE-EXPORT CORE TYPES
// =============================================================================

export type {
  RenderElement,
  RenderTree,
  RenderProvenance,
  ComponentMeta,
  CatalogDefinition,
  RegisteredComponent,
  ParsedComponentName,
} from '@core/json-render';

export {
  parseComponentName,
  makeComponentType,
  isNamespaced,
  normalizeType,
  BaseCatalog,
  isRenderElement,
  isRenderTree,
} from '@core/json-render';

// =============================================================================
// BASE COMPONENTS
// =============================================================================

export { BaseComponents } from './components/base';
export {
  Stack,
  Grid,
  Container,
  Spacer,
  Divider,
  Text,
  Metric,
  Badge,
  Progress,
  Header,
  Empty,
  Loading,
  Alert,
} from './components/base';
