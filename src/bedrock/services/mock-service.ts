// src/bedrock/services/mock-service.ts
// Console Factory v2 - Mock Service Implementation
// Sprint: console-factory-v2
//
// DEX Principle: Capability Agnosticism
// Mock services enable development/testing without backend dependency.

import type { IDataService, ServiceResponse, BaseEntity } from './types';

// =============================================================================
// Mock Data Store
// =============================================================================

/**
 * In-memory data store for mock services
 * Simulates a database with basic CRUD operations
 */
class MockDataStore<T extends BaseEntity> {
  private data: Map<string, T> = new Map();
  private idCounter: number = 1;

  constructor(initialData?: T[]) {
    if (initialData) {
      initialData.forEach((item) => {
        this.data.set(item.id, item);
        // Update counter to avoid ID collisions
        const numericId = parseInt(item.id.replace(/\D/g, ''), 10);
        if (!isNaN(numericId) && numericId >= this.idCounter) {
          this.idCounter = numericId + 1;
        }
      });
    }
  }

  generateId(prefix: string = 'item'): string {
    return `${prefix}-${this.idCounter++}`;
  }

  getAll(): T[] {
    return Array.from(this.data.values());
  }

  getById(id: string): T | null {
    return this.data.get(id) || null;
  }

  create(item: T): T {
    this.data.set(item.id, item);
    return item;
  }

  update(id: string, updates: Partial<T>): T | null {
    const existing = this.data.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.data.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.data.delete(id);
  }

  count(predicate?: (item: T) => boolean): number {
    if (!predicate) return this.data.size;
    return this.getAll().filter(predicate).length;
  }

  filter(predicate: (item: T) => boolean): T[] {
    return this.getAll().filter(predicate);
  }
}

// =============================================================================
// Generic Mock Service Factory
// =============================================================================

/**
 * Options for creating a mock service
 */
export interface MockServiceOptions<T extends BaseEntity> {
  /** Initial data to populate the store */
  initialData?: T[];
  /** ID prefix for new items */
  idPrefix?: string;
  /** Simulated network delay in ms */
  delay?: number;
  /** Factory function to create new items */
  createDefaults?: () => Partial<T>;
}

/**
 * Create a mock service implementing IDataService
 * Useful for development and testing without backend
 */
export function createMockService<T extends BaseEntity>(
  options: MockServiceOptions<T> = {}
): IDataService<T> {
  const {
    initialData = [],
    idPrefix = 'item',
    delay = 50,
    createDefaults = () => ({} as Partial<T>),
  } = options;

  const store = new MockDataStore<T>(initialData);

  // Simulate async delay
  const withDelay = <R>(fn: () => R): Promise<R> =>
    new Promise((resolve) => setTimeout(() => resolve(fn()), delay));

  return {
    async getAll(): Promise<T[]> {
      return withDelay(() => store.getAll());
    },

    async getById(id: string): Promise<T | null> {
      return withDelay(() => store.getById(id));
    },

    async update(id: string, updates: Partial<T>): Promise<ServiceResponse<T>> {
      return withDelay(() => {
        const updated = store.update(id, updates);
        if (!updated) {
          return { success: false, error: `Item not found: ${id}` };
        }
        return {
          success: true,
          data: updated,
          meta: { timestamp: new Date().toISOString(), source: 'mock' },
        };
      });
    },

    async create(newItem: Omit<T, 'id'>): Promise<ServiceResponse<T>> {
      return withDelay(() => {
        const id = store.generateId(idPrefix);
        const defaults = createDefaults();
        const item = { ...defaults, ...newItem, id } as T;
        const created = store.create(item);
        return {
          success: true,
          data: created,
          meta: { timestamp: new Date().toISOString(), source: 'mock' },
        };
      });
    },

    async delete(id: string): Promise<ServiceResponse<void>> {
      return withDelay(() => {
        const deleted = store.delete(id);
        if (!deleted) {
          return { success: false, error: `Item not found: ${id}` };
        }
        return {
          success: true,
          meta: { timestamp: new Date().toISOString(), source: 'mock' },
        };
      });
    },
  };
}

// =============================================================================
// Console-Specific Mock Data
// =============================================================================

/**
 * Mock system prompt data
 */
export const mockSystemPrompts = [
  {
    id: 'sp-1',
    meta: {
      id: 'sp-1',
      type: 'system-prompt',
      title: 'Grove Explorer',
      description: 'Default conversational guide for the Grove experience',
      status: 'active',
      createdAt: '2025-12-01T00:00:00Z',
      updatedAt: '2026-01-10T00:00:00Z',
    },
    payload: {
      identity: 'You are the Grove, a wise and curious AI companion...',
      voiceGuidelines: 'Warm, inviting, intellectually curious',
      responseMode: 'architect',
      closingBehavior: 'navigation',
      maxTokens: 1024,
      temperature: 0.7,
      version: 3,
    },
  },
  {
    id: 'sp-2',
    meta: {
      id: 'sp-2',
      type: 'system-prompt',
      title: 'Research Assistant',
      description: 'Academic research companion with citation focus',
      status: 'draft',
      createdAt: '2025-12-15T00:00:00Z',
      updatedAt: '2026-01-05T00:00:00Z',
    },
    payload: {
      identity: 'You are a meticulous research assistant...',
      voiceGuidelines: 'Precise, academic, thorough',
      responseMode: 'librarian',
      closingBehavior: 'question',
      maxTokens: 2048,
      temperature: 0.5,
      version: 1,
    },
  },
];

/**
 * Mock feature flag data
 */
export const mockFeatureFlags = [
  {
    id: 'ff-1',
    meta: {
      id: 'ff-1',
      type: 'feature-flag',
      title: 'RAG Context',
      description: 'Enable document retrieval for chat responses',
      status: 'active',
      createdAt: '2025-11-01T00:00:00Z',
      updatedAt: '2026-01-08T00:00:00Z',
    },
    payload: {
      flagId: 'rag-context',
      available: true,
      enabledByDefault: true,
      category: 'experience',
      showInExploreHeader: true,
      headerLabel: 'RAG',
      headerOrder: 1,
    },
  },
  {
    id: 'ff-2',
    meta: {
      id: 'ff-2',
      type: 'feature-flag',
      title: 'Sprout Research',
      description: 'Enable AI-assisted research capabilities',
      status: 'active',
      createdAt: '2025-12-01T00:00:00Z',
      updatedAt: '2026-01-10T00:00:00Z',
    },
    payload: {
      flagId: 'sprout-research',
      available: true,
      enabledByDefault: false,
      category: 'research',
      showInExploreHeader: true,
      headerLabel: 'Research',
      headerOrder: 2,
    },
  },
  {
    id: 'ff-3',
    meta: {
      id: 'ff-3',
      type: 'feature-flag',
      title: 'Experimental UI',
      description: 'Preview new interface components',
      status: 'active',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-11T00:00:00Z',
    },
    payload: {
      flagId: 'experimental-ui',
      available: false,
      enabledByDefault: false,
      category: 'experimental',
      showInExploreHeader: false,
      headerLabel: '',
      headerOrder: 99,
    },
  },
];

/**
 * Mock research sprout data
 */
export const mockResearchSprouts = [
  {
    id: 'rs-1',
    name: 'AI Governance Landscape',
    seed_query: 'What are the current approaches to AI governance globally?',
    status: 'completed',
    hypothesis_type: 'exploratory',
    model: 'gemini-2.0-flash',
    created_at: '2026-01-05T10:00:00Z',
    completed_at: '2026-01-05T10:15:00Z',
  },
  {
    id: 'rs-2',
    name: 'Local vs Cloud AI',
    seed_query: 'Compare benefits of local AI inference vs cloud-based AI services',
    status: 'running',
    hypothesis_type: 'comparative',
    model: 'gemini-2.5-flash',
    created_at: '2026-01-12T09:00:00Z',
    completed_at: null,
  },
  {
    id: 'rs-3',
    name: 'Knowledge Commons Impact',
    seed_query: 'How might knowledge commons affect AI training data quality?',
    status: 'pending',
    hypothesis_type: 'causal',
    model: 'gemini-2.5-flash',
    created_at: '2026-01-12T11:00:00Z',
    completed_at: null,
  },
];

// =============================================================================
// Pre-configured Mock Services
// =============================================================================

/**
 * Mock service for system prompts
 */
export const mockSystemPromptService = createMockService({
  initialData: mockSystemPrompts,
  idPrefix: 'sp',
  createDefaults: () => ({
    meta: {
      type: 'system-prompt',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    payload: {
      version: 1,
      responseMode: 'architect',
      closingBehavior: 'navigation',
      maxTokens: 1024,
      temperature: 0.7,
    },
  }),
});

/**
 * Mock service for feature flags
 */
export const mockFeatureFlagService = createMockService({
  initialData: mockFeatureFlags,
  idPrefix: 'ff',
  createDefaults: () => ({
    meta: {
      type: 'feature-flag',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    payload: {
      available: true,
      enabledByDefault: false,
      category: 'experience',
      showInExploreHeader: false,
      headerOrder: 99,
    },
  }),
});

/**
 * Mock service for research sprouts
 */
export const mockResearchSproutService = createMockService({
  initialData: mockResearchSprouts,
  idPrefix: 'rs',
  createDefaults: () => ({
    status: 'pending',
    hypothesis_type: 'exploratory',
    model: 'gemini-2.5-flash',
    created_at: new Date().toISOString(),
    completed_at: null,
  }),
});

// =============================================================================
// Service Registry for Console Factory
// =============================================================================

import type { ServiceRegistry } from './types';

/**
 * Mock service registry for development/testing
 * Maps console IDs to mock service instances
 */
export const MOCK_SERVICE_REGISTRY: ServiceRegistry = {
  'system-prompt': mockSystemPromptService,
  'feature-flag': mockFeatureFlagService,
  'research-sprout': mockResearchSproutService,
};

/**
 * Get mock service by console ID
 */
export function getMockService<T extends BaseEntity>(
  consoleId: string
): IDataService<T> | undefined {
  return MOCK_SERVICE_REGISTRY[consoleId] as IDataService<T> | undefined;
}
