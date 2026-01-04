// src/bedrock/patterns/index.ts
// Barrel export for Bedrock patterns
// Sprint: bedrock-foundation-v1, hotfix/console-factory

// Console Factory
export { createBedrockConsole } from './console-factory';

// Collection view hook
export { useCollectionView, getNestedValue } from './useCollectionView';

// Grove API client
export {
  GroveApi,
  groveApi,
  type ApiResponse,
  type ApiError,
  type ListParams,
} from './GroveApi';

// Patch history hook
export {
  usePatchHistory,
  getValueAtPath,
  generateInversePatch,
  generateInversePatches,
  type UsePatchHistoryOptions,
  type UsePatchHistoryReturn,
} from './usePatchHistory';

// Copilot command parser
export {
  parseCommand,
  getAvailableFields,
  type CommandResult,
  type FieldMapping,
} from './copilot-commands';

// Console factory types
export type {
  CollectionDataResult,
  ObjectCardProps,
  ObjectEditorProps,
  BedrockConsoleOptions,
  InspectorConfig,
  MetricData,
} from './console-factory.types';

// Collection view types
export type {
  FilterValue,
  FilterOption,
  SortDirection,
  SortOption,
  CollectionViewConfig,
  CollectionViewState,
  FilterBarProps,
  SortDropdownProps,
  FavoriteToggleProps,
  SearchInputProps,
} from './collection-view.types';
