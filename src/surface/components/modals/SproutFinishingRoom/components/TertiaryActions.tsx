// src/surface/components/modals/SproutFinishingRoom/components/TertiaryActions.tsx
// Sprint: S3||SFR-Actions - US-D002, US-D003 Tertiary actions
// (US-D004 Export to be added in subsequent commit)

import React, { useState } from 'react';
import type { Sprout } from '@core/schema/sprout';

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
 * US-D004: Export document (to be added)
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

  return (
    <div className="p-4 mt-auto">
      {/* Section header */}
      <h3 className="text-xs font-mono text-ink-muted dark:text-paper/50 uppercase mb-3">
        More Actions
      </h3>

      <div className="space-y-2">
        {/* US-D002: Archive to Garden */}
        <button
          onClick={() => onAction('archive')}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-ink/5 dark:hover:bg-white/5 transition-colors text-left"
        >
          <span className="text-lg" role="img" aria-label="Archive">
            📁
          </span>
          <div>
            <span className="text-sm font-medium text-ink dark:text-paper">
              Archive to Garden
            </span>
            <p className="text-xs text-ink-muted dark:text-paper/50">
              Save for later reference
            </p>
          </div>
        </button>

        {/* US-D003: Add Private Note */}
        {!showNoteInput ? (
          <button
            onClick={() => setShowNoteInput(true)}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-ink/5 dark:hover:bg-white/5 transition-colors text-left"
          >
            <span className="text-lg" role="img" aria-label="Note">
              📝
            </span>
            <div>
              <span className="text-sm font-medium text-ink dark:text-paper">
                {sprout.notes ? 'Edit Note' : 'Add Private Note'}
              </span>
              <p className="text-xs text-ink-muted dark:text-paper/50">
                {sprout.notes ? 'Modify your annotation' : 'Personal annotation'}
              </p>
            </div>
          </button>
        ) : (
          <div className="p-3 bg-ink/5 dark:bg-white/5 rounded-lg">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add your private note..."
              className="w-full h-20 p-2 text-sm bg-paper dark:bg-ink border border-ink/10 dark:border-white/10 rounded resize-none focus:outline-none focus:ring-2 focus:ring-grove-forest/50 text-ink dark:text-paper placeholder:text-ink-muted dark:placeholder:text-paper/50"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveNote}
                disabled={!noteText.trim()}
                className="flex-1 py-1.5 px-3 bg-grove-forest text-paper rounded text-sm font-medium hover:bg-grove-forest/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Note
              </button>
              <button
                onClick={() => {
                  setShowNoteInput(false);
                  setNoteText(sprout.notes || '');
                }}
                className="py-1.5 px-3 text-sm text-ink-muted dark:text-paper/50 hover:bg-ink/10 dark:hover:bg-white/10 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TertiaryActions;
