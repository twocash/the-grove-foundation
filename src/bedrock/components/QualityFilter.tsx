// src/bedrock/components/QualityFilter.tsx
// Quality Score Filter Components
// Sprint: S10.1-SL-AICuration v2 (Display + Filtering)
//
// DEX: Declarative Sovereignty - filter state persists in URL

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { QualityFilterState, QualityFilterPreset, QualityGrade } from '@core/schema';
import { QUALITY_FILTER_PRESETS, getQualityGrade, QUALITY_GRADE_CONFIGS, DIMENSION_CONFIGS } from '@core/schema';

// =============================================================================
// Types
// =============================================================================

export interface QualityFilterProps {
  /** Current filter state */
  value: QualityFilterState;
  /** Called when filter changes */
  onChange: (filter: QualityFilterState) => void;
  /** Whether to show advanced dimension filters */
  showAdvanced?: boolean;
  /** Compact mode for toolbar integration */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

export interface QualitySliderProps {
  /** Current minimum quality value (0-100) */
  value: number | undefined;
  /** Called when value changes */
  onChange: (value: number | undefined) => void;
  /** Label for the slider */
  label?: string;
  /** Whether slider is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

export interface QualityPresetButtonsProps {
  /** Currently active preset (if any) */
  activePreset?: QualityFilterPreset;
  /** Called when a preset is selected */
  onSelect: (preset: QualityFilterPreset) => void;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Grade Color Mapping
// =============================================================================

const GRADE_COLORS: Record<QualityGrade, string> = {
  excellent: 'var(--neon-green)',
  good: 'var(--neon-amber)',
  fair: '#f97316',
  'needs-improvement': '#ef4444',
};

// =============================================================================
// Quality Slider Component
// =============================================================================

/**
 * Horizontal slider for quality score filtering
 */
export function QualitySlider({
  value,
  onChange,
  label = 'Min Quality',
  disabled = false,
  className = '',
}: QualitySliderProps) {
  const [localValue, setLocalValue] = useState<number>(value ?? 0);
  const [isDragging, setIsDragging] = useState(false);

  // Sync local value when prop changes (unless dragging)
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value ?? 0);
    }
  }, [value, isDragging]);

  const grade = getQualityGrade(localValue);
  const gradeColor = GRADE_COLORS[grade];

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setLocalValue(newValue);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (localValue === 0) {
      onChange(undefined); // Clear filter at 0
    } else {
      onChange(localValue);
    }
  }, [localValue, onChange]);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--glass-text-secondary)]">{label}</span>
        <span
          className="text-sm font-medium"
          style={{ color: localValue > 0 ? gradeColor : 'var(--glass-text-muted)' }}
        >
          {localValue > 0 ? `≥${localValue}` : 'Any'}
        </span>
      </div>

      <div className="relative">
        {/* Track background */}
        <div className="h-2 rounded-full bg-[var(--glass-border)]" />

        {/* Filled portion */}
        <div
          className="absolute top-0 left-0 h-2 rounded-full transition-all"
          style={{
            width: `${localValue}%`,
            backgroundColor: gradeColor,
            opacity: localValue > 0 ? 1 : 0.3,
          }}
        />

        {/* Range input */}
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={localValue}
          onChange={handleChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          disabled={disabled}
          className="absolute top-0 left-0 w-full h-2 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          style={{ margin: 0 }}
        />

        {/* Thumb indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 bg-[var(--glass-solid)] shadow-lg transition-all"
          style={{
            left: `calc(${localValue}% - 8px)`,
            borderColor: gradeColor,
          }}
        />
      </div>

      {/* Grade markers */}
      <div className="flex justify-between text-[10px] text-[var(--glass-text-muted)] px-1">
        <span>0</span>
        <span style={{ color: GRADE_COLORS['needs-improvement'] }}>50</span>
        <span style={{ color: GRADE_COLORS['good'] }}>70</span>
        <span style={{ color: GRADE_COLORS['excellent'] }}>90</span>
        <span>100</span>
      </div>
    </div>
  );
}

// =============================================================================
// Preset Buttons Component
// =============================================================================

/**
 * Quick preset filter buttons
 */
export function QualityPresetButtons({
  activePreset,
  onSelect,
  className = '',
}: QualityPresetButtonsProps) {
  const presets = Object.entries(QUALITY_FILTER_PRESETS) as [QualityFilterPreset, typeof QUALITY_FILTER_PRESETS[QualityFilterPreset]][];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {presets.map(([key, config]) => {
        const isActive = activePreset === key;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              border
              ${isActive
                ? 'border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)]'
                : 'border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-secondary)] hover:border-[var(--glass-border-bright)] hover:text-[var(--glass-text-primary)]'
              }
            `}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// Advanced Dimension Filters
// =============================================================================

interface DimensionSliderProps {
  dimension: keyof typeof DIMENSION_CONFIGS;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

function DimensionSlider({ dimension, value, onChange }: DimensionSliderProps) {
  const config = DIMENSION_CONFIGS[dimension];

  return (
    <QualitySlider
      value={value}
      onChange={onChange}
      label={config.label}
      className="flex-1 min-w-[150px]"
    />
  );
}

interface QualityAdvancedFiltersProps {
  filter: QualityFilterState;
  onChange: (filter: QualityFilterState) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

function QualityAdvancedFilters({
  filter,
  onChange,
  isExpanded,
  onToggle,
}: QualityAdvancedFiltersProps) {
  const hasAdvancedFilters = [
    filter.minAccuracy,
    filter.minUtility,
    filter.minNovelty,
    filter.minProvenance,
  ].some(v => v !== undefined);

  return (
    <div className="border-t border-[var(--glass-border)] pt-3 mt-3">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-xs text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)] transition-colors"
      >
        <span className="material-symbols-outlined text-sm">
          {isExpanded ? 'expand_less' : 'expand_more'}
        </span>
        <span>Dimension Filters</span>
        {hasAdvancedFilters && (
          <span className="px-1.5 py-0.5 rounded bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] text-[10px]">
            Active
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          <DimensionSlider
            dimension="accuracy"
            value={filter.minAccuracy}
            onChange={(v) => onChange({ ...filter, minAccuracy: v })}
          />
          <DimensionSlider
            dimension="utility"
            value={filter.minUtility}
            onChange={(v) => onChange({ ...filter, minUtility: v })}
          />
          <DimensionSlider
            dimension="novelty"
            value={filter.minNovelty}
            onChange={(v) => onChange({ ...filter, minNovelty: v })}
          />
          <DimensionSlider
            dimension="provenance"
            value={filter.minProvenance}
            onChange={(v) => onChange({ ...filter, minProvenance: v })}
          />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Quality Filter Component
// =============================================================================

/**
 * Complete quality filter panel with slider, presets, and advanced options
 */
export function QualityFilter({
  value,
  onChange,
  showAdvanced = true,
  compact = false,
  className = '',
}: QualityFilterProps) {
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  // Detect active preset from current filter state
  const activePreset = useMemo((): QualityFilterPreset | undefined => {
    const presets = Object.entries(QUALITY_FILTER_PRESETS) as [QualityFilterPreset, typeof QUALITY_FILTER_PRESETS[QualityFilterPreset]][];

    for (const [key, config] of presets) {
      const f = config.filter;
      if (
        f.minQuality === value.minQuality &&
        f.includeUnscored === value.includeUnscored &&
        !value.minAccuracy &&
        !value.minUtility &&
        !value.minNovelty &&
        !value.minProvenance
      ) {
        return key;
      }
    }
    return undefined;
  }, [value]);

  const handlePresetSelect = useCallback((preset: QualityFilterPreset) => {
    const presetFilter = QUALITY_FILTER_PRESETS[preset].filter;
    onChange({
      ...presetFilter,
      // Clear dimension filters when selecting preset
      minAccuracy: undefined,
      minUtility: undefined,
      minNovelty: undefined,
      minProvenance: undefined,
    });
  }, [onChange]);

  const handleSliderChange = useCallback((minQuality: number | undefined) => {
    onChange({
      ...value,
      minQuality,
      // Auto-adjust includeUnscored based on slider
      includeUnscored: minQuality === undefined || minQuality === 0,
    });
  }, [value, onChange]);

  const handleIncludeUnscoredToggle = useCallback(() => {
    onChange({
      ...value,
      includeUnscored: !value.includeUnscored,
    });
  }, [value, onChange]);

  const handleClear = useCallback(() => {
    onChange({
      includeUnscored: true,
    });
  }, [onChange]);

  const hasAnyFilter = value.minQuality !== undefined ||
    value.minAccuracy !== undefined ||
    value.minUtility !== undefined ||
    value.minNovelty !== undefined ||
    value.minProvenance !== undefined ||
    value.includeUnscored === false;

  if (compact) {
    // Compact mode: just preset buttons
    return (
      <QualityPresetButtons
        activePreset={activePreset}
        onSelect={handlePresetSelect}
        className={className}
      />
    );
  }

  return (
    <div className={`p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-solid)] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg text-[var(--neon-cyan)]">
            verified
          </span>
          <span className="text-sm font-medium text-[var(--glass-text-primary)]">
            Quality Filter
          </span>
        </div>
        {hasAnyFilter && (
          <button
            onClick={handleClear}
            className="text-xs text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)] transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Preset Buttons */}
      <QualityPresetButtons
        activePreset={activePreset}
        onSelect={handlePresetSelect}
        className="mb-4"
      />

      {/* Main Quality Slider */}
      <QualitySlider
        value={value.minQuality}
        onChange={handleSliderChange}
        label="Minimum Overall Quality"
        className="mb-4"
      />

      {/* Include unscored toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value.includeUnscored !== false}
          onChange={handleIncludeUnscoredToggle}
          className="w-4 h-4 rounded border-[var(--glass-border)] bg-transparent accent-[var(--neon-cyan)]"
        />
        <span className="text-xs text-[var(--glass-text-secondary)]">
          Include sprouts without quality scores
        </span>
      </label>

      {/* Advanced dimension filters */}
      {showAdvanced && (
        <QualityAdvancedFilters
          filter={value}
          onChange={onChange}
          isExpanded={advancedExpanded}
          onToggle={() => setAdvancedExpanded(!advancedExpanded)}
        />
      )}
    </div>
  );
}

// =============================================================================
// Toolbar Integration Component
// =============================================================================

export interface QualityFilterToolbarProps {
  /** Current filter state */
  value: QualityFilterState;
  /** Called when filter changes */
  onChange: (filter: QualityFilterState) => void;
  /** Additional class names */
  className?: string;
}

/**
 * Compact quality filter for toolbar integration
 * Shows a button that opens a dropdown with the full filter panel
 */
export function QualityFilterToolbar({
  value,
  onChange,
  className = '',
}: QualityFilterToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const hasActiveFilter = value.minQuality !== undefined ||
    value.minAccuracy !== undefined ||
    value.includeUnscored === false;

  const filterCount = [
    value.minQuality !== undefined,
    value.minAccuracy !== undefined,
    value.minUtility !== undefined,
    value.minNovelty !== undefined,
    value.minProvenance !== undefined,
    value.includeUnscored === false,
  ].filter(Boolean).length;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-sm
          border transition-colors
          ${hasActiveFilter
            ? 'border-[var(--neon-cyan)]/60 bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)]'
            : 'border-[var(--glass-border-bright)] bg-[var(--glass-solid)] text-[var(--glass-text-secondary)] hover:border-[var(--neon-cyan)]/50'
          }
        `}
      >
        <span className="material-symbols-outlined text-base">verified</span>
        <span>Quality</span>
        {filterCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-[var(--neon-cyan)]/20 text-[10px] font-medium">
            {filterCount}
          </span>
        )}
        <span className="material-symbols-outlined text-base">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[320px]">
          <QualityFilter
            value={value}
            onChange={onChange}
            showAdvanced={true}
          />
        </div>
      )}
    </div>
  );
}

export default QualityFilter;
