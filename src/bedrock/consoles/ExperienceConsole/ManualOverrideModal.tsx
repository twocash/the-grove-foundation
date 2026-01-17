// src/bedrock/consoles/ExperienceConsole/ManualOverrideModal.tsx
// Modal for manually overriding a sprout's tier
// Sprint: S7-SL-AutoAdvancement v1
//
// DEX: Provenance as Infrastructure - All manual overrides are logged

import React, { useState } from 'react';
import { GlassButton } from '../../primitives';

// =============================================================================
// Types
// =============================================================================

interface ManualOverrideModalProps {
  open: boolean;
  onClose: () => void;
  sproutId: string;
  sproutTitle?: string;
  currentTier: string;
  onOverride: (toTier: string, reason: string) => Promise<void>;
}

// =============================================================================
// Constants
// =============================================================================

const TIERS = [
  { value: 'seed', label: 'Seed', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  { value: 'sprout', label: 'Sprout', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { value: 'sapling', label: 'Sapling', color: 'text-green-400', bg: 'bg-green-500/20' },
  { value: 'tree', label: 'Tree', color: 'text-teal-400', bg: 'bg-teal-500/20' },
  { value: 'grove', label: 'Grove', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
];

// =============================================================================
// Component
// =============================================================================

export function ManualOverrideModal({
  open,
  onClose,
  sproutId,
  sproutTitle,
  currentTier,
  onOverride,
}: ManualOverrideModalProps) {
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!selectedTier || !reason.trim()) {
      setError('Please select a tier and provide a reason');
      return;
    }

    if (selectedTier === currentTier) {
      setError('Selected tier is the same as current tier');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onOverride(selectedTier, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Override failed');
    } finally {
      setSubmitting(false);
    }
  };

  const currentTierConfig = TIERS.find((t) => t.value === currentTier);
  const selectedTierConfig = TIERS.find((t) => t.value === selectedTier);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--glass-solid)] border border-[var(--glass-border)] rounded-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-400">
                swap_vert
              </span>
            </div>
            <div>
              <h2 className="text-lg font-medium text-[var(--glass-text-primary)]">
                Manual Override
              </h2>
              {sproutTitle && (
                <p className="text-sm text-[var(--glass-text-muted)]">
                  {sproutTitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)] transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Tier Display */}
          <div>
            <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-2">
              Current Tier
            </label>
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${currentTierConfig?.bg || 'bg-slate-500/20'}`}>
              <span className={`text-sm font-medium ${currentTierConfig?.color || 'text-slate-400'}`}>
                {currentTierConfig?.label || currentTier}
              </span>
            </div>
          </div>

          {/* Tier Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-2">
              New Tier
            </label>
            <div className="grid grid-cols-5 gap-2">
              {TIERS.map((tier) => (
                <button
                  key={tier.value}
                  onClick={() => setSelectedTier(tier.value)}
                  disabled={tier.value === currentTier}
                  className={`
                    p-3 rounded-lg text-center transition-all
                    ${tier.value === currentTier
                      ? 'opacity-30 cursor-not-allowed'
                      : selectedTier === tier.value
                        ? `${tier.bg} ring-2 ring-offset-2 ring-offset-[var(--glass-solid)] ring-[var(--neon-cyan)]`
                        : `${tier.bg} hover:ring-1 hover:ring-[var(--glass-border-bright)]`
                    }
                  `}
                >
                  <span className={`text-xs font-medium ${tier.color}`}>
                    {tier.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tier Change Visualization */}
          {selectedTier && selectedTier !== currentTier && (
            <div className="flex items-center justify-center gap-4 py-4 px-4 rounded-lg bg-[var(--glass-elevated)]">
              <div className={`px-3 py-1.5 rounded ${currentTierConfig?.bg} ${currentTierConfig?.color}`}>
                {currentTierConfig?.label}
              </div>
              <span className="material-symbols-outlined text-[var(--glass-text-muted)]">
                arrow_forward
              </span>
              <div className={`px-3 py-1.5 rounded ${selectedTierConfig?.bg} ${selectedTierConfig?.color}`}>
                {selectedTierConfig?.label}
              </div>
            </div>
          )}

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-2">
              Reason for Override *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this manual override is necessary..."
              rows={3}
              className={`
                w-full px-4 py-3 rounded-lg
                bg-[var(--glass-elevated)] border border-[var(--glass-border)]
                text-[var(--glass-text-primary)] placeholder-[var(--glass-text-muted)]
                focus:outline-none focus:ring-2 focus:ring-[var(--neon-cyan)] focus:border-transparent
                resize-none text-sm
              `}
            />
            <p className="mt-1 text-xs text-[var(--glass-text-muted)]">
              This will be recorded in the audit trail
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/10 text-orange-400 text-sm">
            <span className="material-symbols-outlined text-sm mt-0.5">warning</span>
            <div>
              <div className="font-medium">Manual Override Warning</div>
              <div className="text-orange-400/80 mt-1">
                This action bypasses automatic advancement rules. The override will be logged with your operator ID.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--glass-border)]">
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
            disabled={!selectedTier || !reason.trim() || submitting}
            icon={submitting ? 'progress_activity' : 'check'}
          >
            {submitting ? 'Applying...' : 'Apply Override'}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}

export default ManualOverrideModal;
