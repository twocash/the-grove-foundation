// src/explore/components/RightRail/SproutTypePicker.tsx
// Sprout type selection UI
// Sprint: bedrock-foundation-v1

import React from 'react';
import { SPROUT_MANIFESTS, type SproutManifest } from '../../../bedrock/config/sprout-manifests';
import type { SproutType } from '../../../bedrock/types/sprout';

// =============================================================================
// Types
// =============================================================================

interface SproutTypePickerProps {
  onSelect: (type: SproutType) => void;
  onCancel: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function SproutTypePicker({ onSelect, onCancel }: SproutTypePickerProps) {
  const manifests = Object.values(SPROUT_MANIFESTS);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border-light dark:border-border-dark">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground-light dark:text-foreground-dark">
            New Contribution
          </h3>
          <button
            onClick={onCancel}
            className="p-1 rounded-md hover:bg-surface-hover text-foreground-muted"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <p className="text-sm text-foreground-muted dark:text-foreground-muted-dark mt-1">
          What would you like to capture?
        </p>
      </div>

      {/* Type Options */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {manifests.map(manifest => (
          <TypeOption
            key={manifest.type}
            manifest={manifest}
            onClick={() => onSelect(manifest.type)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border-light dark:border-border-dark">
        <button
          onClick={onCancel}
          className="w-full py-2 text-sm text-foreground-muted hover:text-foreground-light dark:hover:text-foreground-dark transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Type Option Card
// =============================================================================

interface TypeOptionProps {
  manifest: SproutManifest;
  onClick: () => void;
}

function TypeOption({ manifest, onClick }: TypeOptionProps) {
  const colorClasses = getColorClasses(manifest.color);

  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 rounded-lg border text-left
        border-border-light dark:border-border-dark
        hover:border-primary hover:bg-primary/5
        transition-colors group
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colorClasses.bg}`}>
          <span className={`material-symbols-outlined text-xl ${colorClasses.text}`}>
            {manifest.icon}
          </span>
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-foreground-light dark:text-foreground-dark group-hover:text-primary transition-colors">
            {manifest.label}
          </h4>
          <p className="text-sm text-foreground-muted dark:text-foreground-muted-dark mt-0.5">
            {manifest.description}
          </p>
        </div>
        <span className="material-symbols-outlined text-foreground-muted group-hover:text-primary transition-colors">
          chevron_right
        </span>
      </div>
    </button>
  );
}

// =============================================================================
// Color Helpers
// =============================================================================

function getColorClasses(color?: string): { bg: string; text: string } {
  switch (color) {
    case 'blue':
      return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' };
    case 'amber':
      return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' };
    case 'purple':
      return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' };
    case 'green':
      return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' };
    default:
      return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' };
  }
}

export default SproutTypePicker;
