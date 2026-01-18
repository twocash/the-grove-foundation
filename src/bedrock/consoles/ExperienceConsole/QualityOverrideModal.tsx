// src/bedrock/consoles/ExperienceConsole/QualityOverrideModal.tsx
// Sprint: S10.2-SL-AICuration v3 - Analytics + Override Workflows
// Epic 3: Quality Score Override Modal
// Pattern: Traditional React form component (NOT json-render)
//
// DEX: Provenance as Infrastructure - All quality overrides are logged with full audit trail

import React, { useState, useCallback } from 'react';
import { GlassButton } from '../../primitives';
import type { OverrideReasonCode, OverrideSubmission } from '@core/schema/quality-override';
import { validateOverride, MIN_EXPLANATION_LENGTH } from '@core/schema/quality-override';

// =============================================================================
// Types
// =============================================================================

export interface QualityOverrideModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Sprout ID being overridden */
  sproutId: string;
  /** Sprout title for display */
  sproutTitle?: string;
  /** Current quality score */
  currentScore: number;
  /** Callback when override is submitted */
  onSubmit: (submission: OverrideSubmission) => Promise<void>;
}

// =============================================================================
// Constants
// =============================================================================

const REASON_OPTIONS: { value: OverrideReasonCode; label: string; description: string }[] = [
  {
    value: 'incorrect_assessment',
    label: 'Incorrect Assessment',
    description: 'The AI assessment does not accurately reflect the content quality',
  },
  {
    value: 'missing_context',
    label: 'Missing Context',
    description: 'The assessment lacks important context that affects the score',
  },
  {
    value: 'model_error',
    label: 'Model Error',
    description: 'A technical error or hallucination affected the assessment',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Another reason not covered above',
  },
];

// =============================================================================
// Score Slider Component
// =============================================================================

interface ScoreSliderProps {
  value: number;
  originalScore: number;
  onChange: (value: number) => void;
}

function ScoreSlider({ value, originalScore, onChange }: ScoreSliderProps) {
  const delta = value - originalScore;
  const deltaColor = delta > 0 ? 'text-grove-forest' : delta < 0 ? 'text-red-500' : 'text-ink-muted dark:text-paper/50';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink dark:text-paper">New Score</span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-ink dark:text-paper" data-testid="new-score">
            {value}
          </span>
          <span className="text-lg text-ink-muted dark:text-paper/50">/100</span>
          {delta !== 0 && (
            <span className={`text-sm font-mono ${deltaColor}`} data-testid="score-delta">
              ({delta > 0 ? '+' : ''}{delta})
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        {/* Track */}
        <div className="h-2 bg-ink/10 dark:bg-white/10 rounded-full">
          {/* Original score marker */}
          <div
            className="absolute h-4 w-0.5 bg-amber-500 -top-1 z-10"
            style={{ left: `${originalScore}%` }}
            title={`Original: ${originalScore}`}
          />
          {/* Filled portion */}
          <div
            className="h-full bg-grove-forest rounded-full transition-all"
            style={{ width: `${value}%` }}
          />
        </div>

        {/* Range input */}
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          data-testid="score-slider"
        />
      </div>

      <div className="flex justify-between text-xs text-ink-muted dark:text-paper/50">
        <span>0</span>
        <span className="text-amber-500">Original: {originalScore}</span>
        <span>100</span>
      </div>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function QualityOverrideModal({
  open,
  onClose,
  sproutId,
  sproutTitle,
  currentScore,
  onSubmit,
}: QualityOverrideModalProps) {
  // Form state
  const [newScore, setNewScore] = useState(currentScore);
  const [reasonCode, setReasonCode] = useState<OverrideReasonCode | ''>('');
  const [explanation, setExplanation] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setNewScore(currentScore);
      setReasonCode('');
      setExplanation('');
      setEvidenceUrl('');
      setError(null);
    }
  }, [open, currentScore]);

  // Form validation
  const validation = React.useMemo(() => {
    if (!reasonCode) return null;

    const submission: OverrideSubmission = {
      sproutId,
      newScore,
      reasonCode,
      explanation,
      evidenceUrl: evidenceUrl || undefined,
    };

    return validateOverride(submission);
  }, [sproutId, newScore, reasonCode, explanation, evidenceUrl]);

  const canSubmit = validation?.valid && newScore !== currentScore && !submitting;

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!validation?.valid || !reasonCode) {
      setError(validation?.error || 'Please complete the form');
      return;
    }

    if (newScore === currentScore) {
      setError('New score must be different from current score');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const submission: OverrideSubmission = {
        sproutId,
        newScore,
        reasonCode,
        explanation,
        evidenceUrl: evidenceUrl || undefined,
      };

      await onSubmit(submission);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Override failed');
    } finally {
      setSubmitting(false);
    }
  }, [validation, reasonCode, newScore, currentScore, sproutId, explanation, evidenceUrl, onSubmit, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="quality-override-modal"
    >
      <div
        className="bg-paper dark:bg-ink border border-ink/10 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-ink/10 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-grove-forest/20 flex items-center justify-center">
              <span className="text-grove-forest text-xl">*</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink dark:text-paper">
                Request Score Override
              </h2>
              {sproutTitle && (
                <p className="text-sm text-ink-muted dark:text-paper/60 truncate max-w-xs">
                  {sproutTitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted dark:text-paper/60 hover:bg-ink/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Close modal"
            data-testid="modal-close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Score slider */}
          <ScoreSlider
            value={newScore}
            originalScore={currentScore}
            onChange={setNewScore}
          />

          {/* Reason selection */}
          <div>
            <label className="block text-sm font-medium text-ink dark:text-paper mb-2">
              Reason for Override *
            </label>
            <div className="space-y-2">
              {REASON_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`
                    flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                    ${reasonCode === option.value
                      ? 'border-grove-forest bg-grove-forest/5'
                      : 'border-ink/10 dark:border-white/10 hover:border-ink/20 dark:hover:border-white/20'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="reasonCode"
                    value={option.value}
                    checked={reasonCode === option.value}
                    onChange={(e) => setReasonCode(e.target.value as OverrideReasonCode)}
                    className="mt-1"
                    data-testid={`reason-${option.value}`}
                  />
                  <div>
                    <span className="font-medium text-ink dark:text-paper">{option.label}</span>
                    <p className="text-xs text-ink-muted dark:text-paper/60 mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-ink dark:text-paper mb-2">
              Explanation * <span className="text-xs text-ink-muted dark:text-paper/50">(min {MIN_EXPLANATION_LENGTH} characters)</span>
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Provide a detailed explanation for this override request..."
              rows={4}
              className={`
                w-full px-4 py-3 rounded-lg
                bg-ink/5 dark:bg-white/5 border
                ${explanation.length > 0 && explanation.length < MIN_EXPLANATION_LENGTH
                  ? 'border-amber-500'
                  : 'border-ink/10 dark:border-white/10'
                }
                text-ink dark:text-paper placeholder-ink-muted dark:placeholder-paper/50
                focus:outline-none focus:ring-2 focus:ring-grove-forest focus:border-transparent
                resize-none text-sm
              `}
              data-testid="explanation-input"
            />
            <div className="flex justify-between mt-1 text-xs text-ink-muted dark:text-paper/50">
              <span>This will be recorded in the audit trail</span>
              <span className={explanation.length < MIN_EXPLANATION_LENGTH ? 'text-amber-500' : ''}>
                {explanation.length}/{MIN_EXPLANATION_LENGTH}+
              </span>
            </div>
          </div>

          {/* Evidence URL (optional) */}
          <div>
            <label className="block text-sm font-medium text-ink dark:text-paper mb-2">
              Evidence URL <span className="text-xs text-ink-muted dark:text-paper/50">(optional)</span>
            </label>
            <input
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://..."
              className="
                w-full px-4 py-2.5 rounded-lg
                bg-ink/5 dark:bg-white/5 border border-ink/10 dark:border-white/10
                text-ink dark:text-paper placeholder-ink-muted dark:placeholder-paper/50
                focus:outline-none focus:ring-2 focus:ring-grove-forest focus:border-transparent
                text-sm
              "
              data-testid="evidence-url-input"
            />
            <p className="mt-1 text-xs text-ink-muted dark:text-paper/50">
              Link to supporting documentation or evidence
            </p>
          </div>

          {/* Error display */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm" data-testid="error-message">
              <span>!</span>
              {error}
            </div>
          )}

          {/* Info box */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm">
            <span className="text-base">i</span>
            <div>
              <div className="font-medium">About Override Requests</div>
              <div className="text-blue-600/80 dark:text-blue-400/80 mt-1">
                Override requests are reviewed by curators. Your request will be logged with full provenance
                for audit purposes.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end gap-3 px-6 py-4 border-t border-ink/10 dark:border-white/10">
          <GlassButton
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
            icon={submitting ? 'progress_activity' : 'send'}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </GlassButton>
        </footer>
      </div>
    </div>
  );
}

export default QualityOverrideModal;
