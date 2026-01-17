// tests/unit/model-analytics-transform.test.ts
// Sprint: EPIC4-SL-MultiModel v1 - Epic 5: Model Analytics
// Testing json-render transform functions

import { describe, test, expect } from 'vitest';
import type { GroveObject } from '../../src/core/schema/grove-object';
import type { LifecycleModelPayload } from '../../src/core/schema/lifecycle-model';
import type { VariantPerformanceMetrics } from '../../src/core/schema/feature-flag';
import {
  modelDataToRenderTree,
  modelsComparisonToRenderTree,
  variantComparisonToRenderTree,
  createEmptyModelAnalyticsTree,
} from '../../src/bedrock/consoles/ExperienceConsole/json-render/model-analytics-transform';

describe('Model Analytics Transform', () => {
  describe('modelDataToRenderTree', () => {
    test('creates render tree with all expected elements', () => {
      const mockModel: GroveObject<LifecycleModelPayload> = {
        meta: {
          type: 'lifecycle-model',
          title: 'Test Model',
          id: 'model-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
        payload: {
          name: 'Test Model',
          description: 'A test model',
          modelType: 'botanical' as const,
          version: '1.0.0',
          validationRules: [],
          tiers: [
            {
              id: 'seed',
              label: 'Seed',
              emoji: '🌱',
              order: 0,
              description: 'Initial seed stage',
            },
            {
              id: 'sprout',
              label: 'Sprout',
              emoji: '🌿',
              order: 1,
              description: 'Early growth stage',
            },
          ],
        },
      };

      const result = modelDataToRenderTree(mockModel);

      expect(result.type).toBe('root');
      expect(result.children).toHaveLength(6);
      expect(result.children[0].type).toBe('ModelAnalyticsHeader');
      expect(result.children[1].type).toBe('ModelSummary');
      expect(result.children[2].type).toBe('ModelMetricRow');
      expect(result.children[3].type).toBe('TierDistribution');
      expect(result.children[4].type).toBe('ConversionFunnel');
      expect(result.children[5].type).toBe('TimeSeriesChart');
    });

    test('applies custom options correctly', () => {
      const mockModel: GroveObject<LifecycleModelPayload> = {
        meta: {
          type: 'lifecycle-model',
          title: 'Test Model',
          id: 'model-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
        payload: {
          name: 'Test Model',
          description: 'A test model',
          modelType: 'academic' as const,
          version: '1.0.0',
          validationRules: [],
          tiers: [],
        },
      };

      const result = modelDataToRenderTree(mockModel, {
        title: 'Custom Title',
        period: 'last_7d',
        showConversionRates: false,
      });

      const header = result.children[0] as any;
      expect(header.props.title).toBe('Custom Title');
      expect(header.props.period).toBe('last_7d');

      const funnel = result.children[4] as any;
      expect(funnel.props.showConversionRates).toBe(false);
    });

    test('maps model type correctly', () => {
      const testCases: Array<{ type: 'botanical' | 'academic' | 'research' | 'creative'; expectedColor: string }> = [
        { type: 'botanical', expectedColor: '#10b981' },
        { type: 'academic', expectedColor: '#3b82f6' },
        { type: 'research', expectedColor: '#8b5cf6' },
        { type: 'creative', expectedColor: '#f59e0b' },
      ];

      for (const testCase of testCases) {
        const mockModel: GroveObject<LifecycleModelPayload> = {
          meta: {
            type: 'lifecycle-model',
            title: 'Test Model',
            id: 'model-1',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z',
          },
          payload: {
            name: 'Test Model',
            description: 'A test model',
            modelType: testCase.type,
            version: '1.0.0',
            validationRules: [],
            tiers: [],
          },
        };

        const result = modelDataToRenderTree(mockModel);
        const header = result.children[0] as any;
        expect(header.props.modelType).toBe(testCase.type);
      }
    });
  });

  describe('modelsComparisonToRenderTree', () => {
    test('creates comparison render tree', () => {
      const models: Array<GroveObject<LifecycleModelPayload>> = [
        {
          meta: {
            type: 'lifecycle-model',
            title: 'Model 1',
            id: 'model-1',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z',
          },
          payload: {
            name: 'Model 1',
            description: 'First model',
            modelType: 'botanical' as const,
            version: '1.0.0',
            validationRules: [],
            tiers: [],
          },
        },
        {
          meta: {
            type: 'lifecycle-model',
            title: 'Model 2',
            id: 'model-2',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z',
          },
          payload: {
            name: 'Model 2',
            description: 'Second model',
            modelType: 'academic' as const,
            version: '1.0.0',
            validationRules: [],
            tiers: [],
          },
        },
      ];

      const result = modelsComparisonToRenderTree(models);

      expect(result.type).toBe('root');
      expect(result.children).toHaveLength(2);
    });

    test('applies correct colors to models', () => {
      const models: Array<GroveObject<LifecycleModelPayload>> = [
        {
          meta: {
            type: 'lifecycle-model',
            title: 'Botanical Model',
            id: 'model-1',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z',
          },
          payload: {
            name: 'Botanical Model',
            description: 'A botanical model',
            modelType: 'botanical' as const,
            version: '1.0.0',
            validationRules: [],
            tiers: [],
          },
        },
      ];

      const result = modelsComparisonToRenderTree(models);
      const comparison = result.children[1] as any;
      expect(comparison.props.models[0].color).toBe('#10b981');
    });
  });

  describe('variantComparisonToRenderTree', () => {
    test('creates variant comparison render tree', () => {
      const variants: Record<string, VariantPerformanceMetrics> = {
        variantA: {
          impressions: 1000,
          conversions: 100,
          conversionRate: 0.1,
          avgEngagementTime: 5000,
          successRate: 0.85,
          satisfactionScore: 0.9,
          lastUpdated: '2024-01-15T00:00:00Z',
        },
        variantB: {
          impressions: 1200,
          conversions: 150,
          conversionRate: 0.125,
          avgEngagementTime: 5500,
          successRate: 0.88,
          satisfactionScore: 0.92,
          lastUpdated: '2024-01-15T00:00:00Z',
        },
      };

      const result = variantComparisonToRenderTree(variants);

      expect(result.type).toBe('root');
    });

    test('maps performance metrics correctly', () => {
      const variants: Record<string, VariantPerformanceMetrics> = {
        variantA: {
          impressions: 1000,
          conversions: 100,
          conversionRate: 0.1,
          avgEngagementTime: 5000,
          successRate: 0.85,
          satisfactionScore: 0.9,
          lastUpdated: '2024-01-15T00:00:00Z',
        },
      };

      const result = variantComparisonToRenderTree(variants);
      const comparison = result.children[1] as any;
      expect(comparison.props.variants.variantA.impressions).toBe(1000);
      expect(comparison.props.variantA.conversionRate).toBe(0.1);
    });
  });

  describe('createEmptyModelAnalyticsTree', () => {
    test('creates tree with header and message', () => {
      const result = createEmptyModelAnalyticsTree('No models found');

      expect(result.type).toBe('root');
      expect(result.children).toHaveLength(1);
      expect(result.children[0].type).toBe('ModelAnalyticsHeader');
      expect((result.children[0] as any).props.title).toBe('No models found');
    });

    test('uses default message when none provided', () => {
      const result = createEmptyModelAnalyticsTree();

      expect(result.type).toBe('root');
      expect(result.children).toHaveLength(1);
      expect(result.children[0].type).toBe('ModelAnalyticsHeader');
      expect((result.children[0] as any).props.title).toBe('Model Analytics');
    });
  });

  describe('ModelAnalyticsTransformOptions', () => {
    test('accepts all valid options', () => {
      const mockModel: GroveObject<LifecycleModelPayload> = {
        meta: {
          type: 'lifecycle-model',
          title: 'Test Model',
          id: 'model-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
        payload: {
          name: 'Test Model',
          description: 'A test model',
          modelType: 'academic' as const,
          version: '1.0.0',
          validationRules: [],
          tiers: [],
        },
      };

      const result = modelDataToRenderTree(mockModel, {
        showConversionRates: true,
        tierLimit: 20,
        showLegend: true,
        title: 'Custom Title',
        period: 'last_30d',
      });

      expect(result.type).toBe('root');
    });
  });
});
