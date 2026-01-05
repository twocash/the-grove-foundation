// src/bedrock/primitives/GroupedChips.tsx
// Grouped chip component for entity categorization
// Sprint: pipeline-inspector-v1 (Epic 3)

import React, { useState, KeyboardEvent } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface GroupedChipsProps {
  value: Record<string, string[]>;
  onChange?: (groups: Record<string, string[]>) => void;
  groups: string[];
  readOnly?: boolean;
  labels?: Record<string, string>;
}

// =============================================================================
// Component
// =============================================================================

export function GroupedChips({
  value = {},
  onChange,
  groups,
  readOnly = false,
  labels = {},
}: GroupedChipsProps) {
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const handleKeyDown = (group: string, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValues[group]?.trim()) {
      e.preventDefault();
      const newItem = inputValues[group].trim();
      const currentItems = value[group] || [];
      if (!currentItems.includes(newItem)) {
        onChange?.({
          ...value,
          [group]: [...currentItems, newItem],
        });
      }
      setInputValues({ ...inputValues, [group]: '' });
    }
  };

  const removeItem = (group: string, index: number) => {
    const currentItems = value[group] || [];
    onChange?.({
      ...value,
      [group]: currentItems.filter((_, i) => i !== index),
    });
  };

  const getLabel = (group: string): string => {
    return labels[group] || group.charAt(0).toUpperCase() + group.slice(1);
  };

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const items = value[group] || [];
        return (
          <div key={group} className="flex items-start gap-3">
            {/* Group label */}
            <span className="w-28 flex-shrink-0 text-xs text-[var(--glass-text-muted)] font-medium pt-2">
              {getLabel(group)}:
            </span>

            {/* Items and input */}
            <div className="flex-1 flex flex-wrap items-center gap-2">
              {items.map((item, index) => (
                <span
                  key={`${group}-${item}-${index}`}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-[var(--card-bg,var(--glass-panel))] border border-[var(--card-border,var(--glass-border))] text-[var(--card-text,var(--glass-text-secondary))]"
                >
                  {item}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => removeItem(group, index)}
                      className="ml-0.5 w-4 h-4 flex items-center justify-center rounded hover:bg-[var(--glass-elevated)] transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </span>
              ))}

              {!readOnly && (
                <input
                  type="text"
                  value={inputValues[group] || ''}
                  onChange={(e) =>
                    setInputValues({ ...inputValues, [group]: e.target.value })
                  }
                  onKeyDown={(e) => handleKeyDown(group, e)}
                  placeholder={`Add ${group}...`}
                  className="flex-1 min-w-[120px] max-w-[200px] px-2 py-1 text-xs bg-transparent border-b border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-subtle)] focus:border-[var(--neon-cyan)] focus:outline-none"
                />
              )}

              {items.length === 0 && readOnly && (
                <span className="text-xs text-[var(--glass-text-subtle)] italic">
                  None
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default GroupedChips;
