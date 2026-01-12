// src/bedrock/console-factory-v2/index.ts
// Console Factory v2 - Public API Exports
// Sprint: console-factory-v2
//
// DEX Principle: Declarative Sovereignty
// Schema-driven console rendering for Bedrock.

// =============================================================================
// Types
// =============================================================================

export type {
  ConsoleSchema,
  ConsoleSchemaRegistry,
  FilterDef,
  SortDef,
  ListSchema,
  InspectorField,
  InspectorSchema,
  ActionDef,
} from '../types/ConsoleSchema';

export type {
  ServiceResponse,
  IDataService,
  IQueryableDataService,
  BaseEntity,
  EntityWithMeta,
  DraftState,
  DraftActions,
} from '../services/types';

// =============================================================================
// Schema Registry
// =============================================================================

export {
  CONSOLE_SCHEMA_REGISTRY,
  getConsoleSchema,
  getAllConsoleSchemas,
  hasConsoleSchema,
  // Individual schemas
  systemPromptSchema,
  featureFlagSchema,
  researchSproutSchema,
  promptArchitectConfigSchema,
} from '../config/consoles';

// =============================================================================
// Services
// =============================================================================

export {
  createMockService,
  getMockService,
  MOCK_SERVICE_REGISTRY,
  // Mock data for testing
  mockSystemPrompts,
  mockFeatureFlags,
  mockResearchSprouts,
} from '../services/mock-service';

export { isSuccessResponse, isBaseEntity } from '../services/types';

// =============================================================================
// Hooks
// =============================================================================

export {
  useConsoleData,
  type UseConsoleDataReturn,
  type FilterState,
  type SortState,
  type LoadingState,
} from '../hooks/useConsoleData';

// =============================================================================
// Utils / Adapters
// =============================================================================

export {
  // Filter adapters
  toFilterOption,
  toFilterOptions,
  // Sort adapters
  toSortOption,
  toSortOptions,
  // Inspector field adapters
  groupFieldsBySection,
  getFieldValue,
  setFieldValue,
  // Metric adapters
  evaluateMetricQuery,
  // Collection view adapter
  toCollectionViewConfig,
} from '../utils/schema-adapters';

// =============================================================================
// Components
// =============================================================================

export { UniversalInspector, type UniversalInspectorProps } from '../components/UniversalInspector';
export { SchemaConsole, type SchemaConsoleProps } from '../components/SchemaConsole';
