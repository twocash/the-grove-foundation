// tests/unit/model-analytics-catalog.test.ts
// Sprint: EPIC4-SL-MultiModel v1 - Epic 5: Model Analytics
// Testing json-render catalog Zod schemas

import { describe, test, expect } from 'vitest';
import {
  ModelAnalyticsHeaderSchema,
  ModelMetricCardSchema,
  ModelMetricRowSchema,
  ModelComparisonSchema,
  TierDistributionSchema,
  ConversionFunnelSchema,
  PerformanceHeatmapSchema,
  ModelVariantComparisonSchema,
  TimeSeriesChartSchema,
  ModelSummarySchema,
} from '../../src/bedrock/consoles/ExperienceConsole/json-render/model-analytics-catalog';

describe('Model Analytics Catalog Schemas', () => {
  describe('ModelAnalyticsHeaderSchema', () => {
    test('validates correct header data', () => {
      const validData = {
        title: 'Model Analytics Dashboard',
        subtitle: 'Performance metrics',
        modelType: 'botanical',
        modelName: 'Green Thumb Model',
        period: 'last_30d',
        lastUpdated: '2024-01-15T00:00:00Z',
      };

      const result = ModelAnalyticsHeaderSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('accepts minimal required fields', () => {
      const validData = {
        title: 'Analytics',
      };

      const result = ModelAnalyticsHeaderSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('validates modelType enum', () => {
      const invalidData = {
        title: 'Test',
        modelType: 'invalid-type',
      };

      const result = ModelAnalyticsHeaderSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('validates period enum', () => {
      const invalidData = {
        title: 'Test',
        period: 'invalid-period',
      };

      const result = ModelAnalyticsHeaderSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('ModelMetricCardSchema', () => {
    test('validates correct metric card', () => {
      const validData = {
        label: 'Success Rate',
        value: 85.5,
        format: 'percent',
        trend: {
          direction: 'up',
          delta: 5.5,
          period: '7d',
          deltaPercent: 6.9,
        },
        icon: 'trending_up',
        color: 'green',
        helpText: 'Percentage of successful completions',
      };

      const result = ModelMetricCardSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('accepts minimal required fields', () => {
      const validData = {
        label: 'Total Items',
        value: 100,
      };

      const result = ModelMetricCardSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('validates value is number', () => {
      const invalidData = {
        label: 'Test',
        value: 'not a number',
      };

      const result = ModelMetricCardSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('validates format enum', () => {
      const invalidData = {
        label: 'Test',
        value: 100,
        format: 'invalid-format',
      };

      const result = ModelMetricCardSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('validates trend direction enum', () => {
      const invalidData = {
        label: 'Test',
        value: 100,
        trend: {
          direction: 'invalid-direction',
        },
      };

      const result = ModelMetricCardSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('validates color enum', () => {
      const invalidData = {
        label: 'Test',
        value: 100,
        color: 'invalid-color',
      };

      const result = ModelMetricCardSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('ModelMetricRowSchema', () => {
    test('validates correct metric row', () => {
      const validData = {
        metrics: [
          {
            label: 'Metric 1',
            value: 100,
            format: 'number',
          },
          {
            label: 'Metric 2',
            value: 85.5,
            format: 'percent',
          },
        ],
        columns: 2,
      };

      const result = ModelMetricRowSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('validates columns range', () => {
      const invalidData = {
        metrics: [],
        columns: 10, // Should be max 6
      };

      const result = ModelMetricRowSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('ModelComparisonSchema', () => {
    test('validates correct model comparison', () => {
      const validData = {
        models: [
          {
            id: 'model-1',
            name: 'Model 1',
            modelType: 'botanical',
            metrics: {
              totalItems: 100,
              successRate: 0.85,
            },
            color: '#10b981',
          },
          {
            id: 'model-2',
            name: 'Model 2',
            modelType: 'academic',
            metrics: {
              totalItems: 150,
              successRate: 0.92,
            },
          },
        ],
        compareBy: ['totalItems', 'successRate'],
      };

      const result = ModelComparisonSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('validates modelType enum', () => {
      const invalidData = {
        models: [
          {
            id: 'model-1',
            name: 'Model 1',
            modelType: 'invalid',
            metrics: {},
          },
        ],
        compareBy: [],
      };

      const result = ModelComparisonSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('TierDistributionSchema', () => {
    test('validates correct tier distribution', () => {
      const validData = {
        tiers: [
          {
            id: 'seed',
            label: 'Seed',
            emoji: '🌱',
            count: 100,
            percentage: 25.0,
          },
          {
            id: 'sprout',
            label: 'Sprout',
            emoji: '🌿',
            count: 200,
            percentage: 50.0,
          },
        ],
        total: 400,
      };

      const result = TierDistributionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('validates percentage range', () => {
      const invalidData = {
        tiers: [
          {
            id: 'test',
            label: 'Test',
            count: 100,
            percentage: 150, // Should be 0-100
          },
        ],
        total: 100,
      };

      const result = TierDistributionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('ConversionFunnelSchema', () => {
    test('validates correct conversion funnel', () => {
      const validData = {
        stages: [
          {
            label: 'Stage 1',
            count: 1000,
            percentage: 100.0,
          },
          {
            label: 'Stage 2',
            count: 500,
            percentage: 50.0,
            conversionsFromPrevious: 50.0,
          },
        ],
        showConversionRates: true,
      };

      const result = ConversionFunnelSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('PerformanceHeatmapSchema', () => {
    test('validates correct performance heatmap', () => {
      const validData = {
        metrics: [
          {
            name: 'Accuracy',
            values: {
              'model-1': 0.85,
              'model-2': 0.92,
            },
            min: 0,
            max: 1,
          },
        ],
        models: [
          {
            id: 'model-1',
            name: 'Model 1',
            type: 'botanical',
          },
          {
            id: 'model-2',
            name: 'Model 2',
            type: 'academic',
          },
        ],
      };

      const result = PerformanceHeatmapSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('ModelVariantComparisonSchema', () => {
    test('validates correct variant comparison', () => {
      const validData = {
        variants: [
          {
            id: 'variant-a',
            name: 'Variant A',
            trafficAllocation: 50.0,
            impressions: 5000,
            conversions: 500,
            conversionRate: 0.1,
            avgEngagementTime: 4500,
            successRate: 0.85,
          },
        ],
      };

      const result = ModelVariantComparisonSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('TimeSeriesChartSchema', () => {
    test('validates correct time series chart', () => {
      const validData = {
        series: [
          {
            name: 'Completions',
            data: [
              {
                timestamp: '2024-01-01T00:00:00Z',
                value: 100,
              },
              {
                timestamp: '2024-01-02T00:00:00Z',
                value: 150,
              },
            ],
            color: '#10b981',
          },
        ],
        yAxisLabel: 'Completions',
        showLegend: true,
      };

      const result = TimeSeriesChartSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('ModelSummarySchema', () => {
    test('validates correct model summary', () => {
      const validData = {
        modelId: 'model-1',
        name: 'Test Model',
        modelType: 'botanical',
        version: '1.0.0',
        tierCount: 5,
        totalItems: 1000,
        activeItems: 800,
        avgCompletionTime: 5.2,
        successRate: 0.85,
        createdAt: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-15T00:00:00Z',
      };

      const result = ModelSummarySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('accepts optional avgCompletionTime', () => {
      const validData = {
        modelId: 'model-1',
        name: 'Test Model',
        modelType: 'botanical',
        version: '1.0.0',
        tierCount: 5,
        totalItems: 1000,
        activeItems: 800,
        successRate: 0.85,
        createdAt: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-15T00:00:00Z',
      };

      const result = ModelSummarySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
