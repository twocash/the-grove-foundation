// src/surface/components/modals/SproutFinishingRoom/ActionPanel.tsx
// Sprint: S3||SFR-Actions - Complete Action Panel with engagement integration

import React from 'react';
import type { Sprout } from '@core/schema/sprout';
import { useEngagementEmit } from '../../../../../hooks/useEngagementBus';
import { useSproutStorage } from '../../../../../hooks/useSproutStorage';
import { useSproutSignals } from '../../../hooks/useSproutSignals';
import { useToast } from '@explore/context/ToastContext';
import { ReviseForm } from './components/ReviseForm';
import { PromotionChecklist } from './components/PromotionChecklist';
import { TertiaryActions, type TertiaryAction } from './components/TertiaryActions';

export interface ActionPanelProps {
  sprout: Sprout;
  onClose: () => void;
  onSproutUpdate?: (sprout: Sprout) => void;
}

/**
 * ActionPanel - Right column (320px fixed)
 *
 * Integrates all action components with engagement bus and sprout storage.
 * Three sections:
 * - Primary: Revise & Resubmit (green accent)
 * - Secondary: Add to Field / Promotion (cyan accent)
 * - Tertiary: Archive, Note, Export (neutral)
 */
export const ActionPanel: React.FC<ActionPanelProps> = ({
  sprout,
  onClose,
  onSproutUpdate,
}) => {
  const emit = useEngagementEmit();
  const { updateSprout, getSprout } = useSproutStorage();
  const signals = useSproutSignals();
  const toast = useToast();

  // S6-SL-ObservableSignals: Build provenance from sprout
  const buildProvenance = () => ({
    lensId: sprout.provenance?.lens?.id,
    lensName: sprout.provenance?.lens?.name,
    journeyId: sprout.provenance?.journey?.id,
    journeyName: sprout.provenance?.journey?.name,
    hubId: sprout.provenance?.hub?.id,
    hubName: sprout.provenance?.hub?.name,
  });

  // US-D001: Revise & Resubmit (stubbed)
  const handleRevisionSubmit = (notes: string) => {
    // S6-SL-ObservableSignals: Emit sprout_refined signal
    signals.emitRefined(
      sprout.id,
      { refinementType: 'revise', charsDelta: notes.length },
      buildProvenance()
    );

    emit.custom('sproutRefinementSubmitted', {
      sproutId: sprout.id,
      revisionNotes: notes,
    });
    toast.success('Revision submitted for processing!');
  };

  // US-D005: Promote to RAG - S4-SL-TierProgression: Also update stage
  const handlePromote = async (content: string, selectedItems: string[]) => {
    const previousStage = sprout.stage || 'seed';

    try {
      const response = await fetch('/api/knowledge/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sprout.query,
          content,
          tier: 'sprout', // Valid tier string: seed, sprout, sapling, tree, grove
          sourceType: 'sprout',
          sourceUrl: `sprout://${sprout.id}`,
        }),
      });

      if (!response.ok) throw new Error('Upload failed');

      // S4-SL-TierProgression: Update stage to 'established' with timestamp
      try {
        updateSprout(sprout.id, {
          stage: 'established',
          promotedAt: new Date().toISOString(),
        });

        // Notify parent of update
        if (onSproutUpdate) {
          const updated = getSprout(sprout.id);
          if (updated) onSproutUpdate(updated);
        }
      } catch (stageError) {
        console.error('Stage update failed:', stageError);
        toast.warning('Content saved, but tier update failed.');
      }

      // S6-SL-ObservableSignals: Emit sprout_promoted signal
      signals.emitPromoted(
        sprout.id,
        { fromTier: previousStage, toTier: 'established' },
        buildProvenance()
      );

      emit.custom('sproutPromotedToRag', { sproutId: sprout.id, selectedItems });
      toast.success('Promoted to Sapling! Added to Knowledge Commons.');
    } catch (error) {
      toast.error('Failed to promote content');
    }
  };

  // US-D002, D003, D004: Tertiary actions
  const handleTertiaryAction = (action: TertiaryAction, payload?: unknown) => {
    switch (action) {
      case 'archive':
        // Update sprout stage to dormant (archived)
        updateSprout(sprout.id, { stage: 'dormant' });
        emit.custom('sproutArchived', { sproutId: sprout.id });
        toast.success('Sprout archived to your garden');
        // Notify parent of update
        if (onSproutUpdate) {
          const updated = getSprout(sprout.id);
          if (updated) onSproutUpdate(updated);
        }
        onClose();
        break;

      case 'annotate':
        const note = payload as string;
        updateSprout(sprout.id, { notes: note });

        // S6-SL-ObservableSignals: Emit sprout_refined signal for annotations
        signals.emitRefined(
          sprout.id,
          { refinementType: 'annotate', charsDelta: note.length },
          buildProvenance()
        );

        emit.custom('sproutAnnotated', { sproutId: sprout.id, note });
        toast.success('Note saved');
        // Notify parent of update
        if (onSproutUpdate) {
          const updated = getSprout(sprout.id);
          if (updated) onSproutUpdate(updated);
        }
        break;

      case 'export':
        // S6-SL-ObservableSignals: Emit sprout_exported signal
        signals.emitExported(
          sprout.id,
          { format: 'markdown' },
          buildProvenance()
        );

        emit.custom('sproutExported', { sproutId: sprout.id, format: 'markdown' });
        toast.success('Document exported');
        break;
    }
  };

  return (
    <aside className="w-[320px] flex-shrink-0 border-l border-ink/10 dark:border-white/10 bg-paper/20 dark:bg-ink/20 overflow-y-auto flex flex-col">
      {/* US-D001: Primary Action - Revise & Resubmit */}
      <ReviseForm sproutId={sprout.id} onSubmit={handleRevisionSubmit} />

      {/* US-D005: Secondary Action - Promote to Field */}
      <PromotionChecklist sprout={sprout} onPromote={handlePromote} />

      {/* US-D002, D003, D004: Tertiary Actions */}
      <TertiaryActions sprout={sprout} onAction={handleTertiaryAction} />
    </aside>
  );
};

export default ActionPanel;
