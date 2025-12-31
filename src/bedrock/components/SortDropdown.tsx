// src/bedrock/components/SortDropdown.tsx
// Sort controls for collection views
// Sprint: bedrock-foundation-v1

import React, { useState, useRef, useEffect } from 'react';
import type { SortDropdownProps, SortDirection } from '../patterns/collection-view.types';

// =============================================================================
// SortDropdown Component
// =============================================================================

export function SortDropdown({
  sortOptions,
  sortField,
  sortDirection,
  onSortChange,
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentOption = sortOptions.find(opt => opt.field === sortField);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-border-light dark:border-border-dark hover:border-primary/50 transition-colors"
      >
        <span className="material-symbols-outlined text-base">sort</span>
        <span>{currentOption?.label ?? 'Sort'}</span>
        <span className="material-symbols-outlined text-base">
          {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg z-50">
          <div className="py-1">
            {sortOptions.map(option => {
              const isSelected = option.field === sortField;

              return (
                <div key={option.field}>
                  <button
                    onClick={() => {
                      if (isSelected) {
                        // Toggle direction if already selected
                        onSortChange(option.field, sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        // Use default direction or 'asc'
                        onSortChange(option.field, option.defaultDirection ?? 'asc');
                      }
                      setIsOpen(false);
                    }}
                    className={`
                      w-full px-3 py-2 text-left text-sm flex items-center justify-between
                      ${isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-surface-hover text-foreground-light dark:text-foreground-dark'
                      }
                    `}
                  >
                    <span>{option.label}</span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-base">
                        {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Direction toggle */}
          <div className="border-t border-border-light dark:border-border-dark px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-foreground-muted">
              <span>Direction:</span>
              <button
                onClick={() => onSortChange(sortField, 'asc')}
                className={`
                  px-2 py-1 rounded
                  ${sortDirection === 'asc'
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-surface-hover'
                  }
                `}
              >
                A→Z
              </button>
              <button
                onClick={() => onSortChange(sortField, 'desc')}
                className={`
                  px-2 py-1 rounded
                  ${sortDirection === 'desc'
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-surface-hover'
                  }
                `}
              >
                Z→A
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SortDropdown;
