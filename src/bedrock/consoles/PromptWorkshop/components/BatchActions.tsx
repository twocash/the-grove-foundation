// src/bedrock/consoles/PromptWorkshop/components/BatchActions.tsx
// Batch action bar for multi-select operations
// Sprint: prompt-refinement-v1

import { GlassButton } from '../../../primitives/GlassButton';

// =============================================================================
// Types
// =============================================================================

interface BatchActionsProps {
  /** Number of selected items */
  selectedCount: number;
  /** Handler for approving all selected */
  onApproveAll: () => void;
  /** Handler for rejecting all selected */
  onRejectAll: () => void;
  /** Handler for running QA check on all selected */
  onQACheckAll: () => void;
  /** Handler for clearing selection */
  onClearSelection: () => void;
  /** Whether a batch operation is in progress */
  isProcessing?: boolean;
  /** Current operation in progress */
  currentOperation?: 'approve' | 'reject' | 'qa-check' | null;
}

// =============================================================================
// Component
// =============================================================================

export function BatchActions({
  selectedCount,
  onApproveAll,
  onRejectAll,
  onQACheckAll,
  onClearSelection,
  isProcessing = false,
  currentOperation = null,
}: BatchActionsProps) {
  // Don't render if no selection
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-[var(--glass-panel)] border-b border-[var(--glass-border)]">
      {/* Selection count */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[var(--accent-cyan)]">
          check_box
        </span>
        <span className="text-sm font-medium text-[var(--glass-text-primary)]">
          {selectedCount} selected
        </span>
      </div>

      {/* Separator */}
      <div className="h-4 w-px bg-[var(--glass-border)]" />

      {/* Batch actions */}
      <div className="flex items-center gap-2">
        <GlassButton
          variant="secondary"
          size="sm"
          onClick={onApproveAll}
          disabled={isProcessing || currentOperation === 'approve'}
          data-testid="batch-approve"
        >
          {currentOperation === 'approve' ? (
            <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-base">check_circle</span>
          )}
          Approve All
        </GlassButton>

        <GlassButton
          variant="secondary"
          size="sm"
          onClick={onRejectAll}
          disabled={isProcessing || currentOperation === 'reject'}
          data-testid="batch-reject"
        >
          {currentOperation === 'reject' ? (
            <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-base">cancel</span>
          )}
          Reject All
        </GlassButton>

        <GlassButton
          variant="secondary"
          size="sm"
          onClick={onQACheckAll}
          disabled={isProcessing || currentOperation === 'qa-check'}
        >
          {currentOperation === 'qa-check' ? (
            <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-base">fact_check</span>
          )}
          QA Check All
        </GlassButton>
      </div>

      {/* Separator */}
      <div className="h-4 w-px bg-[var(--glass-border)]" />

      {/* Clear selection */}
      <button
        onClick={onClearSelection}
        disabled={isProcessing}
        className="flex items-center gap-1 text-sm text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)] transition-colors disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-base">close</span>
        Clear
      </button>

      {/* Keyboard hint */}
      <div className="ml-auto flex items-center gap-3 text-xs text-[var(--glass-text-muted)]">
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
}

export default BatchActions;
