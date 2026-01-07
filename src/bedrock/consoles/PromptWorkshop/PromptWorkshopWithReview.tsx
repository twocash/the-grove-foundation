// src/bedrock/consoles/PromptWorkshop/PromptWorkshopWithReview.tsx
// PromptWorkshop with Review Queue sidebar
// Sprint: extraction-pipeline-integration-v1 (moved extraction to Pipeline Monitor)

import React, { useState, useCallback, useMemo } from 'react';
import { PromptWorkshop } from './index';
import { ReviewQueue } from './ReviewQueue';
import { usePromptData } from './usePromptData';
import { GlassButton } from '../../primitives/GlassButton';
import type { GroveObject } from '@core/schema/grove-object';
import type { PromptPayload } from '@core/schema/prompt';

/**
 * PromptWorkshop with Review Queue sidebar.
 *
 * Extraction now happens in Pipeline Monitor. This wrapper provides:
 * - Review Queue sidebar for managing extracted prompts awaiting approval
 * - Filtered view showing only pending-review items when queue is active
 *
 * Sprint: extraction-pipeline-integration-v1
 * - Review Queue button moved to header (via headerContent prop)
 * - Helper text converted to tooltip
 * - Main view filters to pending-review when queue is active
 */
export function PromptWorkshopWithReview() {
  const [showReviewQueue, setShowReviewQueue] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    reviewQueue,
    approveExtracted,
    rejectExtracted,
  } = usePromptData();

  const handleSelectReviewItem = useCallback((prompt: GroveObject<PromptPayload>) => {
    setSelectedId(prompt.meta.id);
  }, []);

  // Sprint: prompt-refinement-v1 - Clear selection handler for keyboard shortcuts
  const handleClearSelection = useCallback(() => {
    setSelectedId(null);
  }, []);

  const pendingCount = reviewQueue.length;

  // External filters to pass to PromptWorkshop when review queue is active
  // Filters to show only extracted/pending-review prompts
  const externalFilters = useMemo(() => {
    if (!showReviewQueue) return undefined;
    return {
      'payload.source': 'generated',
      'payload.provenance.type': 'extracted',
    };
  }, [showReviewQueue]);

  // Header content with Review Queue button (rendered in PromptWorkshop header)
  const headerContent = useMemo(() => {
    if (pendingCount === 0) return null;
    return (
      <div className="relative group">
        <GlassButton
          variant={showReviewQueue ? 'primary' : 'secondary'}
          size="sm"
          icon="pending_actions"
          onClick={() => setShowReviewQueue(!showReviewQueue)}
        >
          Review Queue ({pendingCount})
        </GlassButton>
        {/* Tooltip on hover */}
        <div className="absolute left-0 top-full mt-2 px-3 py-2 bg-[var(--glass-solid)] border border-[var(--glass-border)] rounded-lg text-xs text-[var(--glass-text-muted)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
          <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
          Extracted prompts pending review
        </div>
      </div>
    );
  }, [pendingCount, showReviewQueue]);

  return (
    <div className="flex h-full">
      {/* Main Workshop Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* PromptWorkshop with external filters, header content, and selection */}
        <PromptWorkshop
          externalFilters={externalFilters}
          headerContent={headerContent}
          externalSelectedId={selectedId}
        />
      </div>

      {/* Review Queue Sidebar */}
      {showReviewQueue && pendingCount > 0 && (
        <div className="w-80 border-l border-[var(--glass-border)] bg-[var(--glass-solid)] flex flex-col">
          <ReviewQueue
            prompts={reviewQueue}
            onApprove={approveExtracted}
            onReject={rejectExtracted}
            onSelect={handleSelectReviewItem}
            selectedId={selectedId || undefined}
            onClearSelection={handleClearSelection}
          />
        </div>
      )}
    </div>
  );
}

// Keep old export name for backwards compatibility
export const PromptWorkshopWithExtraction = PromptWorkshopWithReview;

export default PromptWorkshopWithReview;
