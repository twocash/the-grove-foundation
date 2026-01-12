// src/bedrock/services/index.ts
// Console Factory v2 - Service Layer Exports
// Sprint: console-factory-v2

// Types
export type {
  ServiceResponse,
  IDataService,
  IQueryableDataService,
  ServiceRegistry,
  BaseEntity,
  EntityWithMeta,
  DraftState,
  DraftActions,
} from './types';

export { isSuccessResponse, isBaseEntity } from './types';

// Mock services (for development/testing)
export {
  createMockService,
  mockSystemPromptService,
  mockFeatureFlagService,
  mockResearchSproutService,
  MOCK_SERVICE_REGISTRY,
  getMockService,
  // Mock data for testing
  mockSystemPrompts,
  mockFeatureFlags,
  mockResearchSprouts,
} from './mock-service';

export type { MockServiceOptions } from './mock-service';
