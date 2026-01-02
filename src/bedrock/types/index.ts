// src/bedrock/types/index.ts
// Barrel export for Bedrock types
// Sprint: bedrock-foundation-v1

// Sprout types
export {
  type SproutType,
  type SproutStatus,
  type SproutClaim,
  type SproutSource,
  type SproutPayload,
  type Sprout,
  type SproutInput,
  type DocumentSprout,
  type InsightSprout,
  type QuestionSprout,
  type ConnectionSprout,
  createSprout,
  isSprout,
} from './sprout';

// Console configuration types
export {
  type MetricConfig,
  type NavItemConfig,
  type SortOption,
  type FilterType,
  type FilterOption,
  type CollectionViewConfig,
  type CopilotAction,
  type CopilotConfig,
  type PrimaryActionConfig,
  type ConsoleConfig,
} from './console.types';

// Copilot types
export {
  type PatchOperationType,
  type PatchOperation,
  type SchemaPropertyType,
  type SchemaProperty,
  type ObjectSchema,
  type CopilotContext,
  type CopilotState,
  type CopilotGenerationResult,
  type PatchHistoryEntry,
} from './copilot.types';

// Lens types
export {
  type LensCategory,
  type FilterOperator,
  type LensFilter,
  type LensFilterValue,
  type LensPayload,
  type Lens,
  LENS_SCHEMA,
  DEFAULT_LENS_PAYLOAD,
  isLens,
  isLensPayload,
} from './lens';
