// src/bedrock/components/FederatedLearningToggle.tsx
// Federated Learning Opt-In Toggle
// Sprint: S10.1-SL-AICuration v2 (Display + Filtering)
//
// DEX: Declarative Sovereignty - user controls data sharing preferences

import React, { useState, useCallback } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface FederatedLearningState {
  /** Whether federated learning is enabled */
  enabled: boolean;
  /** What data types are shared */
  dataSharing: {
    /** Share aggregate quality metrics */
    qualityMetrics: boolean;
    /** Share anonymized dimension patterns */
    dimensionPatterns: boolean;
    /** Share threshold calibration data */
    thresholdCalibration: boolean;
  };
  /** Timestamp when consent was given/updated */
  consentUpdatedAt: string | null;
}

export interface FederatedLearningToggleProps {
  /** Current federated learning state */
  value: FederatedLearningState;
  /** Called when state changes */
  onChange: (state: FederatedLearningState) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Default State
// =============================================================================

export const DEFAULT_FEDERATED_STATE: FederatedLearningState = {
  enabled: false,
  dataSharing: {
    qualityMetrics: false,
    dimensionPatterns: false,
    thresholdCalibration: false,
  },
  consentUpdatedAt: null,
};

// =============================================================================
// Sub-Components
// =============================================================================

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

function ToggleSwitch({ checked, onChange, disabled = false, size = 'md' }: ToggleSwitchProps) {
  const sizes = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
  };

  const s = sizes[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex shrink-0 cursor-pointer rounded-full
        border-2 border-transparent transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-cyan)] focus-visible:ring-opacity-75
        ${s.track}
        ${checked ? 'bg-[var(--neon-cyan)]' : 'bg-[var(--glass-border)]'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block transform rounded-full
          bg-white shadow-lg ring-0 transition duration-200
          ${s.thumb}
          ${checked ? s.translate : 'translate-x-0'}
        `}
      />
    </button>
  );
}

interface DataSharingOptionProps {
  id: string;
  icon: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function DataSharingOption({
  id,
  icon,
  title,
  description,
  checked,
  onChange,
  disabled = false,
}: DataSharingOptionProps) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${disabled ? 'opacity-50' : ''}`}>
      <ToggleSwitch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        size="sm"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-[var(--glass-text-muted)]">
            {icon}
          </span>
          <label
            htmlFor={id}
            className="text-sm font-medium text-[var(--glass-text-primary)] cursor-pointer"
          >
            {title}
          </label>
        </div>
        <p className="text-xs text-[var(--glass-text-muted)] mt-1">{description}</p>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Federated Learning Toggle
 *
 * Allows users to opt-in to federated quality learning with granular control
 * over what data is shared. Emphasizes privacy and user sovereignty.
 */
export function FederatedLearningToggle({
  value,
  onChange,
  disabled = false,
  className = '',
}: FederatedLearningToggleProps) {
  const [expanded, setExpanded] = useState(false);

  // Handle main toggle
  const handleToggle = useCallback((enabled: boolean) => {
    onChange({
      ...value,
      enabled,
      consentUpdatedAt: new Date().toISOString(),
      // If disabling, turn off all data sharing
      dataSharing: enabled ? value.dataSharing : {
        qualityMetrics: false,
        dimensionPatterns: false,
        thresholdCalibration: false,
      },
    });
  }, [value, onChange]);

  // Handle data sharing option change
  const handleDataSharingChange = useCallback(
    (key: keyof FederatedLearningState['dataSharing'], enabled: boolean) => {
      onChange({
        ...value,
        dataSharing: {
          ...value.dataSharing,
          [key]: enabled,
        },
        consentUpdatedAt: new Date().toISOString(),
      });
    },
    [value, onChange]
  );

  // Check if any data sharing is enabled
  const hasAnySharing =
    value.dataSharing.qualityMetrics ||
    value.dataSharing.dimensionPatterns ||
    value.dataSharing.thresholdCalibration;

  return (
    <div
      className={`rounded-xl border border-[var(--glass-border)] bg-[var(--glass-solid)] overflow-hidden ${className}`}
      data-testid="federated-learning-toggle"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${value.enabled ? 'bg-[var(--neon-cyan)]/10' : 'bg-[var(--glass-border)]'}`}>
            <span className={`material-symbols-outlined text-xl ${value.enabled ? 'text-[var(--neon-cyan)]' : 'text-[var(--glass-text-muted)]'}`}>
              hub
            </span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-[var(--glass-text-primary)]">
              Federated Quality Learning
            </h4>
            <p className="text-xs text-[var(--glass-text-muted)]">
              Help improve quality assessments across the network
            </p>
          </div>
        </div>
        <ToggleSwitch
          checked={value.enabled}
          onChange={handleToggle}
          disabled={disabled}
        />
      </div>

      {/* Expanded content when enabled */}
      {value.enabled && (
        <>
          <div className="border-t border-[var(--glass-border)]" />

          {/* Privacy notice */}
          <div className="p-4 bg-[var(--glass-elevated)]">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-base text-[var(--neon-cyan)] mt-0.5">
                shield
              </span>
              <div>
                <p className="text-xs text-[var(--glass-text-secondary)]">
                  <strong>Your data stays private.</strong> Only anonymized, aggregate patterns are
                  shared to improve quality assessments. No content or identifying information
                  leaves your Grove.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--glass-border)]" />

          {/* Data sharing options */}
          <div className="p-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">
                  tune
                </span>
                Data Sharing Preferences
              </span>
              <span className="flex items-center gap-2">
                {hasAnySharing && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]">
                    {Object.values(value.dataSharing).filter(Boolean).length} active
                  </span>
                )}
                <span className="material-symbols-outlined text-base">
                  {expanded ? 'expand_less' : 'expand_more'}
                </span>
              </span>
            </button>

            {expanded && (
              <div className="mt-2 space-y-1">
                <DataSharingOption
                  id="quality-metrics"
                  icon="analytics"
                  title="Quality Metrics"
                  description="Share aggregate score distributions to improve calibration"
                  checked={value.dataSharing.qualityMetrics}
                  onChange={(checked) => handleDataSharingChange('qualityMetrics', checked)}
                  disabled={disabled}
                />
                <DataSharingOption
                  id="dimension-patterns"
                  icon="category"
                  title="Dimension Patterns"
                  description="Share anonymized relationships between quality dimensions"
                  checked={value.dataSharing.dimensionPatterns}
                  onChange={(checked) => handleDataSharingChange('dimensionPatterns', checked)}
                  disabled={disabled}
                />
                <DataSharingOption
                  id="threshold-calibration"
                  icon="tune"
                  title="Threshold Calibration"
                  description="Share threshold adjustments to improve grade recommendations"
                  checked={value.dataSharing.thresholdCalibration}
                  onChange={(checked) => handleDataSharingChange('thresholdCalibration', checked)}
                  disabled={disabled}
                />
              </div>
            )}
          </div>

          {/* Consent timestamp */}
          {value.consentUpdatedAt && (
            <>
              <div className="border-t border-[var(--glass-border)]" />
              <div className="px-4 py-2 text-xs text-[var(--glass-text-muted)]">
                Consent updated: {new Date(value.consentUpdatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Learn more link */}
      <div className="border-t border-[var(--glass-border)] px-4 py-3">
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="text-xs text-[var(--neon-cyan)] hover:underline flex items-center gap-1"
        >
          Learn more about federated learning
          <span className="material-symbols-outlined text-sm">open_in_new</span>
        </a>
      </div>
    </div>
  );
}

export default FederatedLearningToggle;
