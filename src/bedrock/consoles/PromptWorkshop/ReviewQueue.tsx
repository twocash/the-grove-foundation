// src/bedrock/consoles/PromptWorkshop/ReviewQueue.tsx
// Review queue component for extracted prompts pending review
// Sprint: prompt-extraction-pipeline-v1
// Updated: prompt-refinement-v1 - keyboard shortcuts

import React, { useCallback, useEffect } from 'react';
import type { GroveObject } from '@core/schema/grove-object';
import type { PromptPayload } from '@core/schema/prompt';
import { GlassButton } from '../../primitives/GlassButton';

// =============================================================================
// Types
// =============================================================================

interface ReviewQueueProps {
  /** Prompts pending review */
  prompts: GroveObject<PromptPayload>[];
  /** Called when a prompt is approved */
  onApprove: (prompt: GroveObject<PromptPayload>) => Promise<void>;
  /** Called when a prompt is rejected */
  onReject: (prompt: GroveObject<PromptPayload>, notes?: string) => Promise<void>;
  /** Called when a prompt is selected for inspection */
  onSelect: (prompt: GroveObject<PromptPayload>) => void;
  /** Currently selected prompt ID */
  selectedId?: string;
  /** Called when selection is cleared (Sprint: prompt-refinement-v1) */
  onClearSelection?: () => void;
  /** Loading state */
  loading?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export const ReviewQueue: React.FC<ReviewQueueProps> = ({
  prompts,
  onApprove,
  onReject,
  onSelect,
  selectedId,
  onClearSelection,
  loading,
}) => {
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  // Get the selected prompt object
  const selectedPrompt = selectedId
    ? prompts.find(p => p.meta.id === selectedId)
    : null;

  const handleApprove = async (prompt: GroveObject<PromptPayload>, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setProcessingId(prompt.meta.id);
    try {
      await onApprove(prompt);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (prompt: GroveObject<PromptPayload>, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setProcessingId(prompt.meta.id);
    try {
      await onReject(prompt);
    } finally {
      setProcessingId(null);
    }
  };

  // Keyboard shortcuts (Sprint: prompt-refinement-v1)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if user is typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Escape: Clear selection
    if (e.key === 'Escape' && onClearSelection) {
      onClearSelection();
      return;
    }

    // Other shortcuts require a selection
    if (!selectedPrompt || processingId) return;

    switch (e.key.toLowerCase()) {
      case 'a': // Approve
        e.preventDefault();
        handleApprove(selectedPrompt);
        break;
      case 'r': // Reject
        e.preventDefault();
        handleReject(selectedPrompt);
        break;
      // Note: E for edit would just re-select, which is a no-op
    }
  }, [selectedPrompt, processingId, onClearSelection, handleApprove, handleReject]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (prompts.length === 0) {
    return (
      <div className="p-6 text-center text-[var(--glass-text-muted)]">
        <span className="material-symbols-outlined text-4xl mb-3 block opacity-50">inbox</span>
        <p className="text-sm font-medium">No prompts pending review</p>
        <p className="text-xs mt-1 opacity-70">
          Extract from documents to populate the queue
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)]"
        style={{ backgroundColor: 'var(--semantic-warning-bg)' }}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ color: 'var(--semantic-warning)' }}>pending_actions</span>
          <span className="text-sm font-medium" style={{ color: 'var(--semantic-warning)' }}>
            Review Queue
          </span>
          <span
            className="px-2 py-0.5 text-xs rounded-full"
            style={{ backgroundColor: 'var(--neon-amber-bg)', color: 'var(--neon-amber)' }}
          >
            {prompts.length}
          </span>
        </div>
      </div>

      {/* Queue Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {prompts.map((prompt) => {
          const confidence = prompt.payload.provenance?.extractionConfidence || 0;
          const isSelected = prompt.meta.id === selectedId;
          const isProcessing = processingId === prompt.meta.id;

          return (
            <div
              key={prompt.meta.id}
              className={`
                p-3 rounded-lg cursor-pointer transition-all
                ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
              `}
              style={isSelected
                ? { backgroundColor: 'var(--semantic-warning-bg)', border: '1px solid var(--semantic-warning-border)' }
                : { backgroundColor: 'var(--glass-panel)', border: '1px solid transparent' }
              }
              onClick={() => onSelect(prompt)}
            >
              <div className="flex items-start justify-between gap-2">
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate text-[var(--glass-text-primary)]">
                    {prompt.meta.title}
                  </h4>
                  <p className="text-xs text-[var(--glass-text-muted)] truncate mt-0.5">
                    {prompt.payload.provenance?.sourceDocTitles?.[0] || 'Unknown source'}
                  </p>

                  {/* Metadata Row */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {/* Confidence Badge */}
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={
                        confidence >= 0.8
                          ? { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }
                          : confidence >= 0.6
                          ? { backgroundColor: 'var(--semantic-warning-bg)', color: 'var(--semantic-warning)' }
                          : { backgroundColor: 'var(--semantic-error-bg)', color: 'var(--semantic-error)' }
                      }
                    >
                      {Math.round(confidence * 100)}% confidence
                    </span>

                    {/* Dimensions */}
                    {prompt.payload.salienceDimensions?.slice(0, 2).map((d) => (
                      <span
                        key={d}
                        className="text-xs text-[var(--glass-text-muted)] bg-[var(--glass-panel)] px-1.5 py-0.5 rounded"
                      >
                        {d}
                      </span>
                    ))}
                  </div>

                  {/* Why Interesting */}
                  {prompt.payload.interestingBecause && (
                    <p className="text-xs text-[var(--glass-text-muted)] mt-2 line-clamp-2 italic">
                      "{prompt.payload.interestingBecause}"
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={(e) => handleApprove(prompt, e)}
                    disabled={loading || isProcessing}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--semantic-success)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--semantic-success-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="Approve - Add to curated prompts"
                  >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                  </button>
                  <button
                    onClick={(e) => handleReject(prompt, e)}
                    disabled={loading || isProcessing}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--semantic-error)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--semantic-error-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="Reject - Archive this prompt"
                  >
                    <span className="material-symbols-outlined text-lg">cancel</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer with keyboard shortcuts (Sprint: prompt-refinement-v1) */}
      <div className="px-4 py-2 border-t border-[var(--glass-border)] flex items-center gap-3 text-xs text-[var(--glass-text-muted)]">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-[var(--glass-elevated)] rounded text-[10px]">A</kbd>
          Approve
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-[var(--glass-elevated)] rounded text-[10px]">R</kbd>
          Reject
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-[var(--glass-elevated)] rounded text-[10px]">Esc</kbd>
          Clear
        </span>
      </div>
    </div>
  );
};

export default ReviewQueue;
