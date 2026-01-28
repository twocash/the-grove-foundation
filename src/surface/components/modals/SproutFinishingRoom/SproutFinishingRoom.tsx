// Sprint: S1-SFR-Shell → S24-SFR sfr-garden-bridge-v1
// Three-column modal workspace for inspecting and refining research artifacts

import React, { useEffect, useRef, useCallback, useState } from 'react';
import type { Sprout, GeneratedArtifact } from '@core/schema/sprout';
import type { ResearchDocument } from '@core/schema/research-document';
import { useEngagementEmit } from '../../../../../hooks/useEngagementBus';
import { useSproutStorage } from '../../../../../hooks/useSproutStorage';
import { useSproutSignals } from '../../../hooks/useSproutSignals';
import { useToast } from '@explore/context/ToastContext';
import { FinishingRoomHeader } from './FinishingRoomHeader';
import { FinishingRoomStatus } from './FinishingRoomStatus';
import { ProvenancePanel } from './ProvenancePanel';
import { DocumentViewer } from './DocumentViewer';
import { ActionPanel } from './ActionPanel';
import { promoteToGarden } from './garden-bridge';
import type { PromotionResult, PromotionError } from './garden-bridge';

// Re-export GeneratedArtifact from schema for consumers that imported from here
export type { GeneratedArtifact } from '@core/schema/sprout';

export interface SproutFinishingRoomProps {
  sprout: Sprout;
  isOpen: boolean;
  onClose: () => void;
  /** Callback when sprout is updated (archive, note, etc.) */
  onSproutUpdate?: (sprout: Sprout) => void;
}

/**
 * SproutFinishingRoom - Three-column modal workspace
 *
 * US-A001: Modal opens with proper overlay
 * US-A002: Three-column layout renders
 * US-A003: Close via button or Escape
 * US-A004: Status bar displays metadata
 * US-E001: Engagement events on open/close
 */
export const SproutFinishingRoom: React.FC<SproutFinishingRoomProps> = ({
  sprout,
  isOpen,
  onClose,
  onSproutUpdate,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const emit = useEngagementEmit();
  const { updateSprout, getSprout } = useSproutStorage();
  const signals = useSproutSignals();
  const toast = useToast();

  // S25-GSE: Restore persisted artifacts from sprout, track in state for version tabs
  const [artifacts, setArtifacts] = useState<GeneratedArtifact[]>(
    () => sprout.generatedArtifacts || []
  );
  // null = show research, number = show that artifact's version tab
  const [activeArtifactIndex, setActiveArtifactIndex] = useState<number | null>(
    () => (sprout.generatedArtifacts?.length ?? 0) > 0 ? 0 : null
  );
  // S24-SFR: Garden promotion state
  const [promotionResult, setPromotionResult] = useState<PromotionResult | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);

  // S25-GSE: Called when ActionPanel generates a new document — persist to sprout
  const handleDocumentGenerated = useCallback((document: ResearchDocument, templateId: string, templateName: string) => {
    const artifact: GeneratedArtifact = {
      document,
      templateId,
      templateName,
      generatedAt: new Date().toISOString(),
    };
    setArtifacts(prev => {
      const next = [...prev, artifact];
      // Auto-switch to the newly generated version tab
      setActiveArtifactIndex(next.length - 1);
      // Persist full artifact history to sprout (survives modal close + page refresh)
      updateSprout(sprout.id, { generatedArtifacts: next });
      return next;
    });
  }, [sprout.id, updateSprout]);

  // S24-SFR: Promote artifact to Garden (two-step: upload + provenance patch)
  const handlePromoteToGarden = useCallback(async (document: ResearchDocument) => {
    // Look up template info from the currently active artifact
    const artifact = activeArtifactIndex !== null ? artifacts[activeArtifactIndex] : null;
    if (!artifact) {
      toast.error('No artifact selected for promotion');
      return;
    }

    setIsPromoting(true);
    try {
      const result = await promoteToGarden(document, sprout, {
        templateId: artifact.templateId,
        templateName: artifact.templateName,
        generatedAt: artifact.generatedAt,
      });

      if (!result.success) {
        const err = result as PromotionError;
        toast.error(`Promotion failed (${err.step}): ${err.error}`);
        return;
      }

      setPromotionResult(result);

      // Also save the document locally to the sprout
      updateSprout(sprout.id, { researchDocument: document });
      if (onSproutUpdate) {
        // S26-NUR: Fall back to sprout prop if not in localStorage (Nursery context).
        // Nursery sprouts live in Supabase, not localStorage, so getSprout() returns undefined.
        // Enrich with promotion data so parent can persist gardenDocId.
        const base = getSprout(sprout.id) ?? sprout;
        const updated = {
          ...base,
          researchDocument: document,
          promotedAt: result.promotedAt,
          promotionGardenDocId: result.gardenDocId,
          promotionTier: result.tier,
        };
        onSproutUpdate(updated);
      }

      emit.custom('sproutPromotedToGarden', {
        sproutId: sprout.id,
        gardenDocId: result.gardenDocId,
        tier: result.tier,
      });

      toast.success('Promoted to Garden!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Promotion failed';
      toast.error(message);
    } finally {
      setIsPromoting(false);
    }
  }, [activeArtifactIndex, artifacts, sprout, updateSprout, getSprout, onSproutUpdate, emit, toast]);

  // Track view start time for duration calculation
  const viewStartRef = useRef<number>(0);

  // S6-SL-ObservableSignals: Emit sprout_viewed on open with duration tracking
  useEffect(() => {
    if (!isOpen) return;

    // Start tracking view time
    viewStartRef.current = Date.now();

    // Build provenance from sprout
    const provenance = {
      lensId: sprout.provenance?.lens?.id,
      lensName: sprout.provenance?.lens?.name,
      journeyId: sprout.provenance?.journey?.id,
      journeyName: sprout.provenance?.journey?.name,
      hubId: sprout.provenance?.hub?.id,
      hubName: sprout.provenance?.hub?.name,
    };

    // Emit viewed event (debounced by useSproutSignals)
    signals.emitViewed(sprout.id, {}, provenance);

    // Emit duration on unmount
    return () => {
      if (viewStartRef.current > 0) {
        const viewDurationMs = Date.now() - viewStartRef.current;
        signals.emitViewed(sprout.id, { viewDurationMs }, provenance);
      }
    };
  }, [isOpen, sprout.id, sprout.provenance, signals]);

  // US-E001: Emit finishingRoomOpened when modal opens
  useEffect(() => {
    if (!isOpen) return;
    emit.custom('finishingRoomOpened', { sproutId: sprout.id });
  }, [isOpen, sprout.id, emit]);

  // US-A003: Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // US-A001: Prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // US-A003: Focus trap - focus close button on mount
  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
  }, [isOpen]);

  // US-A001: Modal respects isOpen prop - early return AFTER hooks
  if (!isOpen) {
    return null;
  }

  // US-A003: Focus trap implementation
  const handleKeyDownTrap = (event: React.KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift+Tab: if on first element, go to last
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: if on last element, go to first
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  // US-A001: Clicking backdrop calls onClose
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // US-E001: Wrap onClose to emit event
  // Plain function (not useCallback) because this runs after the early return guard
  const handleClose = () => {
    emit.custom('finishingRoomClosed', { sproutId: sprout.id });
    onClose();
  };

  const headerId = 'finishing-room-title';

  return (
    // US-A001: Modal overlay with semi-transparent backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDownTrap}
      role="presentation"
    >
      {/* Modal container - centered in viewport */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headerId}
        className="bedrock-app relative flex flex-col w-[95vw] max-w-[1400px] h-[90vh] rounded-lg shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--glass-solid, var(--glass-void, #111827))' }}
      >
        {/* Header */}
        <FinishingRoomHeader
          sprout={sprout}
          headerId={headerId}
          onClose={handleClose}
          closeButtonRef={closeButtonRef}
        />

        {/* US-A002: Three-column layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left column - Provenance Panel (280px fixed) */}
          <ProvenancePanel sprout={sprout} />

          {/* Center column - Document Viewer (flex: 1) */}
          <DocumentViewer
            sprout={sprout}
            generatedArtifacts={artifacts}
            activeArtifactIndex={activeArtifactIndex}
            onArtifactSelect={setActiveArtifactIndex}
            onPromoteToGarden={handlePromoteToGarden}
            isPromoting={isPromoting}
            promotionResult={promotionResult}
          />

          {/* Right column - Action Panel (320px fixed) */}
          <ActionPanel
            sprout={sprout}
            onClose={handleClose}
            onSproutUpdate={onSproutUpdate}
            onDocumentGenerated={handleDocumentGenerated}
          />
        </div>

        {/* US-A004: Status bar footer */}
        <FinishingRoomStatus sprout={sprout} />
      </div>
    </div>
  );
};

export default SproutFinishingRoom;
