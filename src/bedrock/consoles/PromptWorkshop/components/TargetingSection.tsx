// src/bedrock/consoles/PromptWorkshop/components/TargetingSection.tsx
// 4D Targeting section showing lens compatibility matrix
// Sprint: prompt-refinement-v1

import React, { useMemo } from 'react';
import { InspectorSection } from '../../../../shared/layout/InspectorPanel';
import type { PromptStage } from '@core/schema/prompt';
import {
  LENS_STAGE_COMPATIBILITY,
  inferTargetingFromSalience,
  getStageDescription,
  type LensAffinitySuggestion,
} from '../utils/TargetingInference';

// =============================================================================
// Types
// =============================================================================

interface TargetingSectionProps {
  /** Currently selected stages */
  selectedStages: PromptStage[];
  /** Handler for stage selection changes */
  onStagesChange: (stages: PromptStage[]) => void;
  /** Salience dimensions for inference */
  salienceDimensions?: string[];
  /** Why the prompt is interesting */
  interestingBecause?: string;
  /** Handler for applying suggestions */
  onApplySuggestion?: (stages: PromptStage[], lensIds: string[]) => void;
  /** Read-only mode */
  isReadOnly?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const STAGE_CONFIG: Record<PromptStage, { label: string; color: string; icon: string }> = {
  genesis: { label: 'Genesis', color: 'var(--semantic-success)', icon: 'eco' },
  exploration: { label: 'Exploration', color: 'var(--semantic-info)', icon: 'explore' },
  synthesis: { label: 'Synthesis', color: 'rgba(168, 85, 247, 1)', icon: 'hub' },
  advocacy: { label: 'Advocacy', color: 'var(--semantic-warning)', icon: 'campaign' },
};

const ALL_STAGES: PromptStage[] = ['genesis', 'exploration', 'synthesis', 'advocacy'];

// =============================================================================
// Component
// =============================================================================

export function TargetingSection({
  selectedStages,
  onStagesChange,
  salienceDimensions = [],
  interestingBecause,
  onApplySuggestion,
  isReadOnly = false,
}: TargetingSectionProps) {
  // Infer targeting suggestions based on salience
  const suggestion = useMemo(() => {
    if (salienceDimensions.length === 0 && !interestingBecause) {
      return null;
    }
    return inferTargetingFromSalience(salienceDimensions, interestingBecause);
  }, [salienceDimensions, interestingBecause]);

  // Toggle a stage selection
  const handleStageToggle = (stage: PromptStage) => {
    if (isReadOnly) return;

    const isSelected = selectedStages.includes(stage);
    if (isSelected) {
      // Don't allow removing the last stage
      if (selectedStages.length > 1) {
        onStagesChange(selectedStages.filter(s => s !== stage));
      }
    } else {
      onStagesChange([...selectedStages, stage]);
    }
  };

  // Apply suggestion
  const handleApplySuggestion = () => {
    if (!suggestion || isReadOnly || !onApplySuggestion) return;

    const suggestedLensIds = suggestion.lensAffinities
      .filter(a => a.weight >= 0.7)
      .map(a => a.lensId);

    onApplySuggestion(suggestion.suggestedStages, suggestedLensIds);
  };

  return (
    <InspectorSection title="4D Targeting" collapsible defaultCollapsed={false}>
      <div className="space-y-4">
        {/* Stage Selection */}
        <div>
          <label className="block text-xs text-[var(--glass-text-muted)] mb-2">
            Target Stages
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_STAGES.map(stage => {
              const config = STAGE_CONFIG[stage];
              const isSelected = selectedStages.includes(stage);
              const isSuggested = suggestion?.suggestedStages.includes(stage) && !isSelected;

              return (
                <button
                  key={stage}
                  onClick={() => handleStageToggle(stage)}
                  disabled={isReadOnly}
                  className={`
                    relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                    text-xs font-medium transition-all
                    ${isSelected
                      ? 'bg-[var(--glass-elevated)] border border-[var(--glass-border)]'
                      : 'bg-[var(--glass-surface)] text-[var(--glass-text-muted)] border border-transparent'
                    }
                    ${isSuggested ? 'ring-1 ring-[var(--neon-cyan)]/50' : ''}
                    ${isReadOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-[var(--glass-hover)]'}
                  `}
                  style={isSelected ? { color: config.color } : undefined}
                  title={getStageDescription(stage)}
                >
                  <span className="material-symbols-outlined text-sm">{config.icon}</span>
                  {config.label}
                  {isSuggested && (
                    <span className="material-symbols-outlined text-xs text-[var(--neon-cyan)]">
                      auto_awesome
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-[var(--glass-text-muted)] mt-1.5">
            Select stages where this prompt can be explored
          </p>
        </div>

        {/* Lens Compatibility Matrix */}
        {suggestion && suggestion.lensAffinities.length > 0 && (
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-2">
              Lens Compatibility
            </label>
            <div className="space-y-1.5">
              {suggestion.lensAffinities.slice(0, 4).map((affinity) => (
                <LensAffinityRow key={affinity.lensId} affinity={affinity} />
              ))}
            </div>
          </div>
        )}

        {/* Suggestion Box */}
        {suggestion && (
          <div className="p-3 rounded-lg bg-[var(--neon-cyan-bg)] border border-[var(--neon-cyan-border)]">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[var(--neon-cyan)] text-base mt-0.5">
                auto_awesome
              </span>
              <div className="flex-1">
                <p className="text-xs text-[var(--neon-cyan)] font-medium">Targeting Suggestion</p>
                <p className="text-xs text-[var(--glass-text-secondary)] mt-1">
                  {suggestion.reasoning}
                </p>
                {onApplySuggestion && !isReadOnly && (
                  <button
                    onClick={handleApplySuggestion}
                    className="mt-2 flex items-center gap-1 text-xs text-[var(--neon-cyan)] hover:text-[var(--neon-cyan)] transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Apply Suggestion
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* No Suggestion Available */}
        {!suggestion && salienceDimensions.length === 0 && (
          <div className="text-xs text-[var(--glass-text-muted)] italic">
            Add salience dimensions to get targeting suggestions
          </div>
        )}
      </div>
    </InspectorSection>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface LensAffinityRowProps {
  affinity: LensAffinitySuggestion;
}

function LensAffinityRow({ affinity }: LensAffinityRowProps) {
  const weightPercent = Math.round(affinity.weight * 100);
  const stageCount = affinity.stagesAvailable.length;

  return (
    <div className="flex items-center gap-2 p-2 rounded bg-[var(--glass-surface)]">
      {/* Lens name */}
      <span className="text-xs font-medium text-[var(--glass-text-primary)] w-24 truncate">
        {formatLensId(affinity.lensId)}
      </span>

      {/* Weight bar */}
      <div className="flex-1 h-1.5 bg-[var(--glass-border)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-cyan)] rounded-full"
          style={{ width: `${weightPercent}%` }}
        />
      </div>

      {/* Weight percentage */}
      <span className="text-[10px] text-[var(--glass-text-muted)] w-10 text-right">
        {weightPercent}%
      </span>

      {/* Stage indicators */}
      <div className="flex gap-0.5">
        {ALL_STAGES.map(stage => {
          const isAvailable = affinity.stagesAvailable.includes(stage);
          const config = STAGE_CONFIG[stage];
          return (
            <span
              key={stage}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: isAvailable ? config.color : 'var(--glass-border)' }}
              title={`${config.label}: ${isAvailable ? 'Available' : 'Not available'}`}
            />
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function formatLensId(lensId: string): string {
  return lensId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default TargetingSection;
