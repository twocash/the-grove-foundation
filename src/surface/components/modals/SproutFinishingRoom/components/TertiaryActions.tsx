// src/surface/components/modals/SproutFinishingRoom/components/TertiaryActions.tsx
// Sprint: S3||SFR-Actions - US-D002, US-D003, US-D004 Tertiary actions

import React, { useState } from 'react';
import type { Sprout } from '@core/schema/sprout';
import { buildCognitiveRouting } from '@core/schema/cognitive-routing';
import {
  downloadMarkdown,
  type ProvenanceInfo,
} from '@explore/utils/markdown-export';

export type TertiaryAction = 'archive' | 'annotate' | 'export';

export interface TertiaryActionsProps {
  sprout: Sprout;
  onAction: (action: TertiaryAction, payload?: unknown) => void;
}

/**
 * TertiaryActions - Bottom section with utility actions
 *
 * US-D002: Archive sprout to garden
 * US-D003: Add private note annotation
 * US-D004: Export document to markdown
 */
export const TertiaryActions: React.FC<TertiaryActionsProps> = ({
  sprout,
  onAction,
}) => {
  // US-D003: Note input state
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState(sprout.notes || '');

  const handleSaveNote = () => {
    if (noteText.trim()) {
      onAction('annotate', noteText);
      setShowNoteInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveNote();
    }
  };

  // US-D004: Export to markdown (S28-PIPE enhanced)
  const handleExport = () => {
    // Get the best available document source
    const latestArtifact = sprout.generatedArtifacts?.[sprout.generatedArtifacts.length - 1];
    const doc = latestArtifact?.document || sprout.researchDocument;

    if (doc) {
      // Full professional export with ResearchDocument
      const exportProvenance: ProvenanceInfo = {
        lensName: sprout.provenance?.lens?.name,
        journeyName: sprout.provenance?.journey?.name,
        hubName: sprout.provenance?.hub?.name,
        templateName: latestArtifact?.templateName,
        writerConfigVersion: latestArtifact?.writerConfigVersion,
        generatedAt: latestArtifact?.generatedAt || doc.createdAt,
      };

      downloadMarkdown(doc, exportProvenance);
    } else {
      // Fallback: Export raw sprout response
      const cognitiveRouting = buildCognitiveRouting(sprout.provenance);
      const content = `# ${sprout.query}

---
generated: ${new Date(sprout.capturedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
lens: ${sprout.provenance?.lens?.name || 'Default'}
cognitive_path: ${cognitiveRouting.path}
---

${sprout.response}

---
*Exported from Grove Research Platform*
`;

      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grove-research-${sprout.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }

    // Notify parent
    onAction('export');
  };

  return (
    <div className="p-4 mt-auto">
      {/* Section header */}
      <h3 className="text-xs font-mono text-[var(--glass-text-muted)] mb-3">
        More Actions
      </h3>

      <div className="space-y-2">
        {/* US-D002: Archive to Garden */}
        <button
          onClick={() => onAction('archive')}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--glass-elevated)] transition-colors text-left"
        >
          <span className="text-lg" role="img" aria-label="Archive">
            📁
          </span>
          <div>
            <span className="text-sm font-medium text-[var(--glass-text-primary)]">
              Archive to Garden
            </span>
            <p className="text-xs text-[var(--glass-text-muted)]">
              Save for later reference
            </p>
          </div>
        </button>

        {/* US-D003: Add Private Note */}
        {!showNoteInput ? (
          <button
            onClick={() => setShowNoteInput(true)}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--glass-elevated)] transition-colors text-left"
          >
            <span className="text-lg" role="img" aria-label="Note">
              📝
            </span>
            <div>
              <span className="text-sm font-medium text-[var(--glass-text-primary)]">
                {sprout.notes ? 'Edit Note' : 'Add Private Note'}
              </span>
              <p className="text-xs text-[var(--glass-text-muted)]">
                {sprout.notes ? 'Modify your annotation' : 'Personal annotation'}
              </p>
            </div>
          </button>
        ) : (
          <div className="p-3 bg-[var(--glass-elevated)] rounded-lg">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add your private note..."
              className="w-full h-20 p-2 text-sm border border-[var(--glass-border)] rounded resize-none focus:outline-none focus:ring-2 focus:ring-[var(--neon-cyan)]/50 text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)]"
              style={{ backgroundColor: 'var(--glass-panel)' }}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveNote}
                disabled={!noteText.trim()}
                className="flex-1 py-1.5 px-3 bg-[var(--neon-cyan)] text-white rounded text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Note
              </button>
              <button
                onClick={() => {
                  setShowNoteInput(false);
                  setNoteText(sprout.notes || '');
                }}
                className="py-1.5 px-3 text-sm text-[var(--glass-text-muted)] hover:bg-[var(--glass-elevated)] rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* US-D004: Export Document */}
        <button
          onClick={handleExport}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--glass-elevated)] transition-colors text-left"
        >
          <span className="text-lg" role="img" aria-label="Export">
            📤
          </span>
          <div>
            <span className="text-sm font-medium text-[var(--glass-text-primary)]">
              Export Document
            </span>
            <p className="text-xs text-[var(--glass-text-muted)]">
              Download as Markdown
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default TertiaryActions;
