// src/surface/components/modals/SproutFinishingRoom/components/PromotionChecklist.tsx
// Sprint: S3||SFR-Actions - US-D005 Declarative promotion checklist

import React, { useState } from 'react';
import type { Sprout } from '@core/schema/sprout';

interface PromotionItem {
  id: string;
  label: string;
  defaultChecked: boolean;
  getContent: (sprout: Sprout) => string;
}

const PROMOTION_ITEMS: PromotionItem[] = [
  {
    id: 'thesis',
    label: 'Thesis Statement',
    defaultChecked: true,
    getContent: (s) => s.researchDocument?.position || s.query,
  },
  {
    id: 'analysis',
    label: 'Full Analysis',
    defaultChecked: false,
    getContent: (s) => s.researchDocument?.analysis || s.response,
  },
  {
    id: 'sources',
    label: 'Discovered Sources',
    defaultChecked: true,
    getContent: (s) => {
      const citations = s.researchDocument?.citations || [];
      return citations
        .map((src) => `[${src.index}] ${src.title}: ${src.url}`)
        .join('\n');
    },
  },
  {
    id: 'notes',
    label: 'My Annotation',
    defaultChecked: false,
    getContent: (s) => s.notes || '',
  },
];

export interface PromotionChecklistProps {
  sprout: Sprout;
  onPromote: (content: string, selectedItems: string[]) => void;
}

/**
 * PromotionChecklist - Secondary action section (cyan accent)
 *
 * US-D005: Allows selective promotion of sprout content to Knowledge Commons.
 * Users can choose which parts of the research to contribute.
 */
export const PromotionChecklist: React.FC<PromotionChecklistProps> = ({
  sprout,
  onPromote,
}) => {
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(PROMOTION_ITEMS.map((item) => [item.id, item.defaultChecked]))
  );
  const [isPromoting, setIsPromoting] = useState(false);

  const toggleItem = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePromote = async () => {
    const selectedItems = PROMOTION_ITEMS.filter((item) => selected[item.id]);
    if (selectedItems.length === 0) {
      return;
    }

    setIsPromoting(true);

    // Assemble content from selected items
    const content = selectedItems
      .map((item) => {
        const itemContent = item.getContent(sprout);
        // Skip empty sections
        if (!itemContent) return null;
        return `## ${item.label}\n\n${itemContent}`;
      })
      .filter(Boolean)
      .join('\n\n---\n\n');

    onPromote(content, selectedItems.map((i) => i.id));
    setIsPromoting(false);
  };

  const hasSelection = Object.values(selected).some((v) => v);

  return (
    <div className="p-4 border-b border-ink/10 dark:border-white/10">
      {/* Section header with cyan accent */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1 h-4 bg-cyan-500 rounded-full" />
        <h3 className="text-sm font-medium text-ink dark:text-paper">
          Add to Field
        </h3>
      </div>

      <p className="text-xs text-ink-muted dark:text-paper/60 mb-3">
        Select content to promote to Knowledge Commons
      </p>

      {/* Checklist */}
      <div className="space-y-2">
        {PROMOTION_ITEMS.map((item) => (
          <label
            key={item.id}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
              selected[item.id]
                ? 'bg-cyan-500/10 border border-cyan-500/30'
                : 'hover:bg-ink/5 dark:hover:bg-white/5 border border-transparent'
            }`}
          >
            <input
              type="checkbox"
              checked={selected[item.id]}
              onChange={() => toggleItem(item.id)}
              className="w-4 h-4 rounded border-ink/20 text-cyan-500 focus:ring-cyan-500/50"
            />
            <span className="text-sm text-ink dark:text-paper">{item.label}</span>
          </label>
        ))}
      </div>

      <button
        onClick={handlePromote}
        disabled={!hasSelection || isPromoting}
        className="mt-4 w-full py-2 px-4 bg-cyan-500 text-white rounded-lg font-medium text-sm hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPromoting ? 'Promoting...' : 'Promote Selected'}
      </button>
    </div>
  );
};

export default PromotionChecklist;
