// src/surface/components/modals/SproutFinishingRoom/components/CollapsibleSection.tsx
// Sprint: S2-SFR-Display - US-B004 Collapsible panel sections

import React, { useState, useEffect, ReactNode } from 'react';

export interface CollapsibleSectionProps {
  /** Section title */
  title: string;
  /** Icon to display next to title */
  icon: string;
  /** Icon aria-label for accessibility */
  iconLabel: string;
  /** Section content */
  children: ReactNode;
  /** Storage key for persisting collapse state (optional) */
  storageKey?: string;
  /** Initial expanded state (default: true) */
  defaultExpanded?: boolean;
}

const STORAGE_PREFIX = 'grove-sfr-section-';

/**
 * CollapsibleSection - Reusable collapsible panel section
 *
 * US-B004: All sections collapsible with persistent state.
 * Collapse state persists during session via localStorage.
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  iconLabel,
  children,
  storageKey,
  defaultExpanded = true,
}) => {
  // Initialize from localStorage if storageKey provided
  const [expanded, setExpanded] = useState(() => {
    if (storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_PREFIX + storageKey);
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return defaultExpanded;
  });

  // Persist to localStorage when expanded changes
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_PREFIX + storageKey, String(expanded));
    }
  }, [expanded, storageKey]);

  const sectionId = `section-${storageKey || title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <section className="border-b border-[var(--glass-border)] last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left group hover:bg-[var(--glass-elevated)] transition-colors"
        aria-expanded={expanded}
        aria-controls={sectionId}
      >
        <h3 className="text-xs font-mono text-[var(--glass-text-muted)] flex items-center gap-2">
          <span role="img" aria-label={iconLabel}>
            {icon}
          </span>
          {title}
        </h3>
        <span
          className={`text-[var(--glass-text-muted)] transition-transform duration-200 text-xs ${
            expanded ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>

      {expanded && (
        <div id={sectionId} className="px-4 pb-4">
          {children}
        </div>
      )}
    </section>
  );
};

export default CollapsibleSection;
