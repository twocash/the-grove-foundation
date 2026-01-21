// src/bedrock/components/QualityThresholdSettings.tsx
// Quality Threshold Configuration Panel
// Sprint: S10.1-SL-AICuration v2 (Display + Filtering)
//
// DEX: Declarative Sovereignty - thresholds configurable via admin settings

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { QualityThresholds, QualityGrade } from '@core/schema';
import { DEFAULT_QUALITY_THRESHOLDS, getQualityGradeWithThresholds, QUALITY_GRADE_CONFIGS } from '@core/schema';

// =============================================================================
// Types
// =============================================================================

export interface QualityThresholdSettingsProps {
  /** Current threshold values */
  value: QualityThresholds;
  /** Called when thresholds change */
  onChange: (thresholds: QualityThresholds) => void;
  /** Called when user saves changes */
  onSave?: () => void;
  /** Whether saving is in progress */
  isSaving?: boolean;
  /** Additional class names */
  className?: string;
}

export interface DimensionWeights {
  accuracy: number;
  utility: number;
  novelty: number;
  provenance: number;
}

export interface QualitySettingsState {
  thresholds: QualityThresholds;
  dimensionWeights: DimensionWeights;
  autoActionThresholds: {
    autoPromote: number;
    autoFlag: number;
  };
}

// =============================================================================
// Default Values
// =============================================================================

const DEFAULT_DIMENSION_WEIGHTS: DimensionWeights = {
  accuracy: 25,
  utility: 25,
  novelty: 25,
  provenance: 25,
};

const DEFAULT_AUTO_ACTION_THRESHOLDS = {
  autoPromote: 85,
  autoFlag: 40,
};

// =============================================================================
// Grade Color Mapping
// =============================================================================

const GRADE_COLORS: Record<QualityGrade, { color: string; backgroundColor: string; borderColor: string }> = {
  excellent: {
    color: 'var(--semantic-success)',
    backgroundColor: 'var(--semantic-success-bg)',
    borderColor: 'var(--semantic-success-border)',
  },
  good: {
    color: 'var(--semantic-warning)',
    backgroundColor: 'var(--semantic-warning-bg)',
    borderColor: 'var(--semantic-warning-border)',
  },
  fair: {
    color: 'var(--semantic-warning)',
    backgroundColor: 'var(--semantic-warning-bg)',
    borderColor: 'var(--semantic-warning-border)',
  },
  'needs-improvement': {
    color: 'var(--semantic-error)',
    backgroundColor: 'var(--semantic-error-bg)',
    borderColor: 'var(--semantic-error-border)',
  },
};

// =============================================================================
// Threshold Input Component
// =============================================================================

interface ThresholdInputProps {
  grade: Exclude<QualityGrade, 'needs-improvement'>;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

function ThresholdInput({ grade, value, onChange, min = 0, max = 100 }: ThresholdInputProps) {
  const gradeConfig = QUALITY_GRADE_CONFIGS[grade];
  const colors = GRADE_COLORS[grade];

  return (
    <div className="flex items-center gap-4">
      {/* Grade badge */}
      <div
        className="flex items-center gap-2 w-32 px-3 py-2 rounded-lg border"
        style={{ backgroundColor: colors.backgroundColor, borderColor: colors.borderColor }}
      >
        <span className="material-symbols-outlined text-lg" style={{ color: colors.color }}>
          {gradeConfig.icon}
        </span>
        <span className="text-sm font-medium" style={{ color: colors.color }}>
          {gradeConfig.label}
        </span>
      </div>

      {/* Threshold input */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--glass-text-muted)]">≥</span>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
          className="w-20 px-3 py-2 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] text-center focus:border-[var(--neon-cyan)] focus:outline-none"
        />
      </div>

      {/* Preview bar */}
      <div className="flex-1 h-2 bg-[var(--glass-border)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colors.bg.replace('/20', '')}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Weight Slider Component
// =============================================================================

interface WeightSliderProps {
  dimension: keyof DimensionWeights;
  label: string;
  icon: string;
  value: number;
  onChange: (value: number) => void;
  totalWeight: number;
}

function WeightSlider({ dimension, label, icon, value, onChange, totalWeight }: WeightSliderProps) {
  const isBalanced = totalWeight === 100;
  const contribution = isBalanced ? value : Math.round((value / totalWeight) * 100);

  return (
    <div className="flex items-center gap-4">
      {/* Dimension info */}
      <div className="flex items-center gap-2 w-28">
        <span className="material-symbols-outlined text-base text-[var(--glass-text-muted)]">
          {icon}
        </span>
        <span className="text-sm text-[var(--glass-text-secondary)]">{label}</span>
      </div>

      {/* Slider */}
      <div className="flex-1 relative">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="w-full h-2 appearance-none bg-[var(--glass-border)] rounded-full cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:bg-[var(--neon-cyan)]
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* Value */}
      <div className="w-16 text-right">
        <span className="text-sm font-medium text-[var(--glass-text-primary)]">{value}%</span>
        {!isBalanced && (
          <span className="text-xs text-[var(--glass-text-muted)] block">({contribution}%)</span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Quality Threshold Settings Panel
 *
 * Allows configuration of:
 * - Grade thresholds (excellent, good, fair)
 * - Dimension weights for overall score calculation
 * - Auto-action thresholds (promote, flag)
 */
export function QualityThresholdSettings({
  value,
  onChange,
  onSave,
  isSaving = false,
  className = '',
}: QualityThresholdSettingsProps) {
  // Local state for dimension weights (not persisted in this sprint)
  const [dimensionWeights, setDimensionWeights] = useState<DimensionWeights>(DEFAULT_DIMENSION_WEIGHTS);
  const [autoActionThresholds, setAutoActionThresholds] = useState(DEFAULT_AUTO_ACTION_THRESHOLDS);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const hasThresholdChanges =
      value.excellent !== DEFAULT_QUALITY_THRESHOLDS.excellent ||
      value.good !== DEFAULT_QUALITY_THRESHOLDS.good ||
      value.fair !== DEFAULT_QUALITY_THRESHOLDS.fair;

    const hasWeightChanges =
      dimensionWeights.accuracy !== DEFAULT_DIMENSION_WEIGHTS.accuracy ||
      dimensionWeights.utility !== DEFAULT_DIMENSION_WEIGHTS.utility ||
      dimensionWeights.novelty !== DEFAULT_DIMENSION_WEIGHTS.novelty ||
      dimensionWeights.provenance !== DEFAULT_DIMENSION_WEIGHTS.provenance;

    setHasChanges(hasThresholdChanges || hasWeightChanges);
  }, [value, dimensionWeights]);

  // Calculate total weight for validation
  const totalWeight = useMemo(() => {
    return dimensionWeights.accuracy + dimensionWeights.utility + dimensionWeights.novelty + dimensionWeights.provenance;
  }, [dimensionWeights]);

  // Handle threshold change
  const handleThresholdChange = useCallback((grade: keyof QualityThresholds, newValue: number) => {
    onChange({
      ...value,
      [grade]: newValue,
    });
  }, [value, onChange]);

  // Handle weight change
  const handleWeightChange = useCallback((dimension: keyof DimensionWeights, newValue: number) => {
    setDimensionWeights(prev => ({
      ...prev,
      [dimension]: newValue,
    }));
  }, []);

  // Normalize weights to 100%
  const handleNormalizeWeights = useCallback(() => {
    if (totalWeight === 0) {
      setDimensionWeights(DEFAULT_DIMENSION_WEIGHTS);
      return;
    }

    const factor = 100 / totalWeight;
    setDimensionWeights({
      accuracy: Math.round(dimensionWeights.accuracy * factor),
      utility: Math.round(dimensionWeights.utility * factor),
      novelty: Math.round(dimensionWeights.novelty * factor),
      provenance: Math.round(dimensionWeights.provenance * factor),
    });
  }, [totalWeight, dimensionWeights]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    onChange(DEFAULT_QUALITY_THRESHOLDS);
    setDimensionWeights(DEFAULT_DIMENSION_WEIGHTS);
    setAutoActionThresholds(DEFAULT_AUTO_ACTION_THRESHOLDS);
  }, [onChange]);

  // Preview section - show how a sample score would be graded
  const previewScore = 75;
  const previewGrade = getQualityGradeWithThresholds(previewScore, value);

  return (
    <div className={`space-y-6 ${className}`} data-testid="quality-threshold-settings">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xl text-[var(--neon-cyan)]">
            tune
          </span>
          <h3 className="text-lg font-medium text-[var(--glass-text-primary)]">
            Quality Thresholds
          </h3>
        </div>
        {hasChanges && (
          <span className="px-2 py-1 text-xs rounded-full bg-[var(--neon-amber)]/20 text-[var(--neon-amber)]">
            Unsaved changes
          </span>
        )}
      </div>

      {/* Grade Thresholds Section */}
      <div className="p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-solid)]">
        <h4 className="text-sm font-medium text-[var(--glass-text-primary)] mb-4">
          Grade Boundaries
        </h4>
        <p className="text-xs text-[var(--glass-text-muted)] mb-4">
          Configure the minimum scores required for each quality grade.
        </p>

        <div className="space-y-4">
          <ThresholdInput
            grade="excellent"
            value={value.excellent}
            onChange={(v) => handleThresholdChange('excellent', v)}
            min={value.good + 1}
          />
          <ThresholdInput
            grade="good"
            value={value.good}
            onChange={(v) => handleThresholdChange('good', v)}
            min={value.fair + 1}
            max={value.excellent - 1}
          />
          <ThresholdInput
            grade="fair"
            value={value.fair}
            onChange={(v) => handleThresholdChange('fair', v)}
            max={value.good - 1}
          />
          <div className="flex items-center gap-4 opacity-50">
            <div
              className="flex items-center gap-2 w-32 px-3 py-2 rounded-lg border"
              style={{ backgroundColor: GRADE_COLORS['needs-improvement'].backgroundColor, borderColor: GRADE_COLORS['needs-improvement'].borderColor }}
            >
              <span className="material-symbols-outlined text-lg" style={{ color: GRADE_COLORS['needs-improvement'].color }}>
                {QUALITY_GRADE_CONFIGS['needs-improvement'].icon}
              </span>
              <span className="text-sm font-medium" style={{ color: GRADE_COLORS['needs-improvement'].color }}>
                Needs Work
              </span>
            </div>
            <span className="text-sm text-[var(--glass-text-muted)]">{'<'} {value.fair}</span>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-4 p-3 rounded-lg bg-[var(--glass-elevated)] border border-[var(--glass-border)]">
          <span className="text-xs text-[var(--glass-text-muted)]">Preview: </span>
          <span className="text-sm text-[var(--glass-text-primary)]">Score {previewScore} = </span>
          <span className="text-sm font-medium" style={{ color: GRADE_COLORS[previewGrade].color }}>
            {QUALITY_GRADE_CONFIGS[previewGrade].label}
          </span>
        </div>
      </div>

      {/* Dimension Weights Section */}
      <div className="p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-solid)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-medium text-[var(--glass-text-primary)]">
              Dimension Weights
            </h4>
            <p className="text-xs text-[var(--glass-text-muted)] mt-1">
              How each dimension contributes to the overall score.
            </p>
          </div>
          {totalWeight !== 100 && (
            <button
              onClick={handleNormalizeWeights}
              className="px-3 py-1 text-xs rounded-lg border border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/10 transition-colors"
            >
              Normalize to 100%
            </button>
          )}
        </div>

        <div className="space-y-4">
          <WeightSlider
            dimension="accuracy"
            label="Accuracy"
            icon="fact_check"
            value={dimensionWeights.accuracy}
            onChange={(v) => handleWeightChange('accuracy', v)}
            totalWeight={totalWeight}
          />
          <WeightSlider
            dimension="utility"
            label="Utility"
            icon="build"
            value={dimensionWeights.utility}
            onChange={(v) => handleWeightChange('utility', v)}
            totalWeight={totalWeight}
          />
          <WeightSlider
            dimension="novelty"
            label="Novelty"
            icon="lightbulb"
            value={dimensionWeights.novelty}
            onChange={(v) => handleWeightChange('novelty', v)}
            totalWeight={totalWeight}
          />
          <WeightSlider
            dimension="provenance"
            label="Provenance"
            icon="history"
            value={dimensionWeights.provenance}
            onChange={(v) => handleWeightChange('provenance', v)}
            totalWeight={totalWeight}
          />
        </div>

        {/* Total indicator */}
        <div className={`mt-4 p-2 rounded-lg text-center ${totalWeight === 100 ? 'bg-[var(--neon-green)]/10 text-[var(--neon-green)]' : 'bg-[var(--neon-amber)]/10 text-[var(--neon-amber)]'}`}>
          <span className="text-sm font-medium">Total: {totalWeight}%</span>
          {totalWeight !== 100 && (
            <span className="text-xs ml-2">(should be 100%)</span>
          )}
        </div>
      </div>

      {/* Auto-Action Thresholds Section */}
      <div className="p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-solid)]">
        <h4 className="text-sm font-medium text-[var(--glass-text-primary)] mb-4">
          Auto-Action Thresholds
        </h4>
        <p className="text-xs text-[var(--glass-text-muted)] mb-4">
          Configure automatic actions based on quality scores (future feature).
        </p>

        <div className="space-y-4 opacity-50 pointer-events-none">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 w-40">
              <span className="material-symbols-outlined text-base text-[var(--neon-green)]">
                rocket_launch
              </span>
              <span className="text-sm text-[var(--glass-text-secondary)]">Auto-Promote</span>
            </div>
            <span className="text-sm text-[var(--glass-text-muted)]">≥</span>
            <input
              type="number"
              min={0}
              max={100}
              value={autoActionThresholds.autoPromote}
              onChange={(e) => setAutoActionThresholds(prev => ({ ...prev, autoPromote: parseInt(e.target.value, 10) || 0 }))}
              disabled
              className="w-20 px-3 py-2 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] text-center"
            />
            <span className="text-xs text-[var(--glass-text-muted)]">Coming in v3</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 w-40">
              <span className="material-symbols-outlined text-base" style={{ color: 'var(--semantic-error)' }}>
                flag
              </span>
              <span className="text-sm text-[var(--glass-text-secondary)]">Auto-Flag</span>
            </div>
            <span className="text-sm text-[var(--glass-text-muted)]">{'<'}</span>
            <input
              type="number"
              min={0}
              max={100}
              value={autoActionThresholds.autoFlag}
              onChange={(e) => setAutoActionThresholds(prev => ({ ...prev, autoFlag: parseInt(e.target.value, 10) || 0 }))}
              disabled
              className="w-20 px-3 py-2 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] text-center"
            />
            <span className="text-xs text-[var(--glass-text-muted)]">Coming in v3</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm rounded-lg border border-[var(--glass-border)] text-[var(--glass-text-secondary)] hover:border-[var(--glass-border-bright)] transition-colors"
        >
          Reset to Defaults
        </button>

        {onSave && (
          <button
            onClick={onSave}
            disabled={isSaving || !hasChanges}
            className={`
              px-4 py-2 text-sm rounded-lg font-medium transition-colors
              ${hasChanges
                ? 'bg-[var(--neon-cyan)] text-black hover:bg-[var(--neon-cyan)]/90'
                : 'bg-[var(--glass-border)] text-[var(--glass-text-muted)] cursor-not-allowed'
              }
            `}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>
    </div>
  );
}

export default QualityThresholdSettings;
