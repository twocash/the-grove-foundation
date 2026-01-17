// tests/performance/model-analytics.perf.ts
// Sprint: EPIC4-SL-MultiModel v1 - Epic 5: Model Analytics
// Performance tests for Model Analytics components

import { describe, test, expect, beforeEach } from 'vitest';
import type { GroveObject } from '../../src/core/schema/grove-object';
import type { LifecycleModelPayload } from '../../src/core/schema/lifecycle-model';
import {
  modelDataToRenderTree,
  modelsComparisonToRenderTree,
  variantComparisonToRenderTree,
} from '../../src/bedrock/consoles/ExperienceConsole/json-render/model-analytics-transform';

// Mock performance.now()
const now = () => Date.now();

describe('Model Analytics Performance Tests', () => {
  let startTime: number;
  let endTime: number;

  beforeEach(() => {
    startTime = 0;
    endTime = 0;
  });

  describe('Transform Performance', () => {
    test('modelDataToRenderTree completes within 100ms', () => {
      const mockModel: GroveObject<LifecycleModelPayload> = {
        meta: {
          type: 'lifecycle-model',
          title: 'Performance Test Model',
          id: 'perf-test-model',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
        payload: {
          name: 'Performance Test Model',
          description: 'Model for performance testing',
          modelType: 'botanical' as const,
          version: '1.0.0',
          validationRules: [],
          tiers: [
            { id: 'seed', label: 'Seed', emoji: '🌱', order: 0, description: 'Initial seed stage' },
            { id: 'sprout', label: 'Sprout', emoji: '🌿', order: 1, description: 'Early growth stage' },
            { id: 'sapling', label: 'Sapling', emoji: '🌳', order: 2, description: 'Mid growth stage' },
            { id: 'tree', label: 'Tree', emoji: '🌲', order: 3, description: 'Mature tree stage' },
            { id: 'grove', label: 'Grove', emoji: '🌳', order: 4, description: 'Forest grove stage' },
          ],
        },
      };

      startTime = now();
      const result = modelDataToRenderTree(mockModel);
      endTime = now();

      const executionTime = endTime - startTime;
      console.log(`modelDataToRenderTree execution time: ${executionTime}ms`);

      expect(executionTime).toBeLessThan(100);
      expect(result.type).toBe('root');
      expect(result.children).toHaveLength(6);
    });

    test('modelsComparisonToRenderTree handles 10 models within 200ms', () => {
      const models: Array<GroveObject<LifecycleModelPayload>> = Array.from(
        { length: 10 },
        (_, i) => ({
          meta: {
            type: 'lifecycle-model',
            title: `Model ${i}`,
            id: `model-${i}`,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z',
          },
          payload: {
            name: `Model ${i}`,
            description: `Model ${i} for comparison`,
            modelType: (['botanical', 'academic', 'research', 'creative'][i % 4]) as const,
            version: '1.0.0',
            validationRules: [],
            tiers: [],
          },
        })
      );

      startTime = now();
      const result = modelsComparisonToRenderTree(models);
      endTime = now();

      const executionTime = endTime - startTime;
      console.log(`modelsComparisonToRenderTree (10 models) execution time: ${executionTime}ms`);

      expect(executionTime).toBeLessThan(200);
      expect(result.type).toBe('root');
      expect(result.children).toHaveLength(2);
    });

    test('variantComparisonToRenderTree handles 20 variants within 150ms', () => {
      const variants: Record<string, any> = {};
      for (let i = 0; i < 20; i++) {
        variants[`variant-${i}`] = {
          impressions: 10000 + i * 100,
          conversions: 1000 + i * 10,
          conversionRate: 0.1 + i * 0.001,
          avgEngagementTime: 5000 + i * 100,
          successRate: 0.85 + i * 0.001,
          satisfactionScore: 0.9,
          lastUpdated: '2024-01-15T00:00:00Z',
        };
      }

      startTime = now();
      const result = variantComparisonToRenderTree(variants);
      endTime = now();

      const executionTime = endTime - startTime;
      console.log(`variantComparisonToRenderTree (20 variants) execution time: ${executionTime}ms`);

      expect(executionTime).toBeLessThan(150);
      expect(result.type).toBe('root');
    });
  });

  describe('Memory Usage', () => {
    test('createEmptyModelAnalyticsTree does not leak memory', () => {
      // Create many empty trees
      const iterations = 1000;
      const results = [];

      startTime = now();
      for (let i = 0; i < iterations; i++) {
        const result = createEmptyModelAnalyticsTree();
        results.push(result);
      }
      endTime = now();

      const executionTime = endTime - startTime;
      console.log(`Created ${iterations} empty trees in ${executionTime}ms`);

      expect(executionTime).toBeLessThan(1000);
      expect(results).toHaveLength(iterations);

      // Verify all results are valid
      results.forEach((result) => {
        expect(result.type).toBe('root');
        expect(result.children).toHaveLength(1);
      });
    });

    test('repeated modelDataToRenderTree calls do not accumulate memory', () => {
      const mockModel: GroveObject<LifecycleModelPayload> = {
        meta: {
          type: 'lifecycle-model',
          title: 'Memory Test Model',
          id: 'memory-test-model',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
        payload: {
          name: 'Memory Test Model',
          description: 'Model for memory testing',
          modelType: 'academic' as const,
          version: '1.0.0',
          validationRules: [],
          tiers: Array.from({ length: 10 }, (_, i) => ({
            id: `tier-${i}`,
            label: `Tier ${i}`,
            emoji: '📊',
            order: i,
            description: `Tier ${i} stage`,
          })),
        },
      };

      const iterations = 500;
      const results = [];

      startTime = now();
      for (let i = 0; i < iterations; i++) {
        const result = modelDataToRenderTree(mockModel, {
          title: `Iteration ${i}`,
        });
        results.push(result);
      }
      endTime = now();

      const executionTime = endTime - startTime;
      console.log(`Created ${iterations} render trees in ${executionTime}ms`);

      expect(executionTime).toBeLessThan(2000);
      expect(results).toHaveLength(iterations);
    });
  });

  describe('Large Dataset Performance', () => {
    test('handles model with 50 tiers', () => {
      const mockModel: GroveObject<LifecycleModelPayload> = {
        meta: {
          type: 'lifecycle-model',
          title: 'Large Tier Model',
          id: 'large-tier-model',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
        payload: {
          name: 'Large Tier Model',
          description: 'Model with many tiers',
          modelType: 'creative' as const,
          version: '1.0.0',
          validationRules: [],
          tiers: Array.from({ length: 50 }, (_, i) => ({
            id: `tier-${i}`,
            label: `Tier ${i}`,
            emoji: '📈',
            order: i,
            description: `Tier ${i} stage`,
          })),
        },
      };

      startTime = now();
      const result = modelDataToRenderTree(mockModel);
      endTime = now();

      const executionTime = endTime - startTime;
      console.log(`modelDataToRenderTree (50 tiers) execution time: ${executionTime}ms`);

      expect(executionTime).toBeLessThan(200);
      expect(result.children[3].type).toBe('TierDistribution');
      expect((result.children[3] as any).props.tiers).toHaveLength(50);
    });

    test('modelsComparisonToRenderTree handles 50 models', () => {
      const models: Array<GroveObject<LifecycleModelPayload>> = Array.from(
        { length: 50 },
        (_, i) => ({
          meta: {
            type: 'lifecycle-model',
            title: `Large Comparison Model ${i}`,
            id: `large-comparison-model-${i}`,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z',
          },
          payload: {
            name: `Large Comparison Model ${i}`,
            description: `Model ${i} for large comparison`,
            modelType: (['botanical', 'academic', 'research', 'creative'][i % 4]) as const,
            version: '1.0.0',
            validationRules: [],
            tiers: [],
          },
        })
      );

      startTime = now();
      const result = modelsComparisonToRenderTree(models);
      endTime = now();

      const executionTime = endTime - startTime;
      console.log(`modelsComparisonToRenderTree (50 models) execution time: ${executionTime}ms`);

      expect(executionTime).toBeLessThan(500);
      expect((result.children[1] as any).props.models).toHaveLength(50);
    });
  });

  describe('Transform Options Performance', () => {
    test('custom options do not significantly impact performance', () => {
      const mockModel: GroveObject<LifecycleModelPayload> = {
        meta: {
          type: 'lifecycle-model',
          title: 'Options Test Model',
          id: 'options-test-model',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
        payload: {
          name: 'Options Test Model',
          description: 'Model for options testing',
          modelType: 'research' as const,
          version: '1.0.0',
          validationRules: [],
          tiers: [],
        },
      };

      // Test with no options
      startTime = now();
      const result1 = modelDataToRenderTree(mockModel);
      endTime = now();
      const timeWithoutOptions = endTime - startTime;

      // Test with all options
      startTime = now();
      const result2 = modelDataToRenderTree(mockModel, {
        showConversionRates: true,
        tierLimit: 20,
        showLegend: true,
        title: 'Custom Title',
        period: 'last_30d',
      });
      endTime = now();
      const timeWithOptions = endTime - startTime;

      console.log(`Without options: ${timeWithoutOptions}ms`);
      console.log(`With options: ${timeWithOptions}ms`);

      // Both should be fast (under 50ms)
      expect(timeWithoutOptions).toBeLessThan(50);
      expect(timeWithOptions).toBeLessThan(50);
      expect((result2.children[0] as any).props.title).toBe('Custom Title');
    });
  });
});

// Helper function imported from the module
import {
  createEmptyModelAnalyticsTree,
} from '../../src/bedrock/consoles/ExperienceConsole/json-render/model-analytics-transform';
