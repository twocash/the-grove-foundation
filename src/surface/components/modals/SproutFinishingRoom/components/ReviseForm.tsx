// src/surface/components/modals/SproutFinishingRoom/components/ReviseForm.tsx
// Sprint: S3||SFR-Actions - US-D001 Revise & Resubmit form (stubbed)

import React, { useState } from 'react';

export interface ReviseFormProps {
  sproutId: string;
  onSubmit: (notes: string) => void;
}

/**
 * ReviseForm - Primary action section (green accent)
 *
 * US-D001: Accepts revision instructions for future agent requeue.
 * v1.0: Stubbed - emits event and shows toast, no backend call.
 */
export const ReviseForm: React.FC<ReviseFormProps> = ({ sproutId, onSubmit }) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!notes.trim()) return;
    setIsSubmitting(true);
    // v1.0: Stub - just emit event via callback
    onSubmit(notes);
    setNotes('');
    setIsSubmitting(false);
  };

  return (
    <div className="p-4 border-b border-ink/10 dark:border-white/10">
      {/* Section header with green accent */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1 h-4 bg-grove-forest rounded-full" />
        <h3 className="text-sm font-medium text-ink dark:text-paper">
          Revise & Resubmit
        </h3>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="What should the next version address differently?"
        className="w-full h-24 p-3 text-sm bg-paper dark:bg-ink border border-ink/10 dark:border-white/10 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-grove-forest/50 text-ink dark:text-paper placeholder:text-ink-muted dark:placeholder:text-paper/50"
        aria-label="Revision instructions"
      />

      <button
        onClick={handleSubmit}
        disabled={!notes.trim() || isSubmitting}
        className="mt-3 w-full py-2 px-4 bg-grove-forest text-paper rounded-lg font-medium text-sm hover:bg-grove-forest/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Submitting...' : 'Submit for Revision'}
      </button>
    </div>
  );
};

export default ReviseForm;
