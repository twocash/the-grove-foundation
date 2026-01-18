// src/core/quality/thresholds.ts
// Quality Threshold Manager
// Sprint: S10-SL-AICuration v1

import { EventEmitter } from '@core/utils/event-emitter';
import type { GroveObjectMeta } from '@core/schema/grove-object';
import {
  QualityThreshold,
  QualityThresholdPayload,
  QualityEventType,
  QualityConfig,
  DEFAULT_QUALITY_CONFIG,
  DEFAULT_QUALITY_THRESHOLDS,
} from './schema';

/**
 * Threshold Manager
 *
 * Manages quality threshold configurations for the grove.
 * Follows the GroveObject pattern for persistence.
 */
export class ThresholdManager extends EventEmitter {
  private config: QualityConfig;
  private cachedThresholds: QualityThreshold | null = null;
  private cacheExpiry: number = 0;

  constructor(config: Partial<QualityConfig> = {}) {
    super();
    this.config = { ...DEFAULT_QUALITY_CONFIG, ...config };
  }

  /**
   * Get active thresholds
   */
  async getActiveThresholds(): Promise<QualityThreshold | null> {
    // Check cache
    if (this.cachedThresholds && Date.now() < this.cacheExpiry) {
      return this.cachedThresholds;
    }

    // In production, fetch from database
    // For now, return default thresholds
    const thresholds = this.createDefaultThresholds();

    // Cache result
    this.cachedThresholds = thresholds;
    this.cacheExpiry = Date.now() + this.config.thresholds.cacheDuration;

    return thresholds;
  }

  /**
   * Get cached thresholds (sync)
   */
  getCachedThresholds(): QualityThreshold | null {
    return this.cachedThresholds;
  }

  /**
   * Update thresholds
   */
  async updateThresholds(payload: Partial<QualityThresholdPayload>): Promise<QualityThreshold> {
    const current = await this.getActiveThresholds();
    const updatedPayload: QualityThresholdPayload = {
      ...DEFAULT_QUALITY_THRESHOLDS,
      ...current?.payload,
      ...payload,
    };

    const meta: GroveObjectMeta = {
      ...(current?.meta || this.createDefaultMeta()),
      updatedAt: new Date().toISOString(),
    };

    const updated: QualityThreshold = {
      meta,
      payload: updatedPayload,
    };

    // Update cache
    this.cachedThresholds = updated;
    this.cacheExpiry = Date.now() + this.config.thresholds.cacheDuration;

    // Emit event
    this.emit(QualityEventType.THRESHOLD_UPDATED, {
      thresholds: updated,
      changes: payload,
    });

    return updated;
  }

  /**
   * Update dimension threshold
   */
  async updateDimensionThreshold(
    dimension: keyof QualityThresholdPayload['thresholds'],
    minimum: number,
    target: number
  ): Promise<QualityThreshold> {
    const current = await this.getActiveThresholds();

    return this.updateThresholds({
      thresholds: {
        ...current?.payload.thresholds || DEFAULT_QUALITY_THRESHOLDS.thresholds,
        [dimension]: { minimum, target },
      },
    });
  }

  /**
   * Update composite thresholds
   */
  async updateCompositeThresholds(
    minimum: number,
    target: number,
    excellent: number
  ): Promise<QualityThreshold> {
    return this.updateThresholds({
      composite: { minimum, target, excellent },
    });
  }

  /**
   * Update dimension weights
   */
  async updateWeights(weights: Partial<QualityThresholdPayload['weights']>): Promise<QualityThreshold> {
    const current = await this.getActiveThresholds();

    return this.updateThresholds({
      weights: {
        ...current?.payload.weights || DEFAULT_QUALITY_THRESHOLDS.weights,
        ...weights,
      },
    });
  }

  /**
   * Toggle auto-filtering
   */
  async setAutoFilter(enabled: boolean): Promise<QualityThreshold> {
    return this.updateThresholds({ autoFilterEnabled: enabled });
  }

  /**
   * Update target types
   */
  async updateTargetTypes(types: string[]): Promise<QualityThreshold> {
    return this.updateThresholds({ targetTypes: types });
  }

  /**
   * Reset to defaults
   */
  async resetToDefaults(): Promise<QualityThreshold> {
    return this.updateThresholds(DEFAULT_QUALITY_THRESHOLDS);
  }

  /**
   * Invalidate cache
   */
  invalidateCache(): void {
    this.cachedThresholds = null;
    this.cacheExpiry = 0;
  }

  /**
   * Create default thresholds GroveObject
   */
  private createDefaultThresholds(): QualityThreshold {
    return {
      meta: this.createDefaultMeta(),
      payload: { ...DEFAULT_QUALITY_THRESHOLDS },
    };
  }

  /**
   * Create default meta
   */
  private createDefaultMeta(): GroveObjectMeta {
    const now = new Date().toISOString();
    return {
      id: 'default-quality-thresholds',
      type: 'quality-threshold',
      title: 'Default Quality Thresholds',
      description: 'Default quality threshold configuration',
      createdAt: now,
      updatedAt: now,
      status: 'active',
    };
  }
}

/**
 * Singleton instance
 */
let managerInstance: ThresholdManager | null = null;

export function getThresholdManager(): ThresholdManager {
  if (!managerInstance) {
    managerInstance = new ThresholdManager();
  }
  return managerInstance;
}

export function resetThresholdManager(): void {
  if (managerInstance) {
    managerInstance.invalidateCache();
    managerInstance = null;
  }
}
