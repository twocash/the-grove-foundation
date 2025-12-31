// src/bedrock/components/FilterBar.tsx
// Filter controls for collection views
// Sprint: bedrock-foundation-v1

import React, { useState, useRef, useEffect } from 'react';
import type { FilterBarProps, FilterOption } from '../patterns/collection-view.types';

// =============================================================================
// FilterBar Component
// =============================================================================

export function FilterBar({
  filterOptions,
  filters,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
}: FilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Filter Dropdowns */}
      {filterOptions.map(option => (
        <FilterDropdown
          key={option.key}
          option={option}
          value={filters[option.key]}
          onChange={(value) => onFilterChange(option.key, value)}
          isOpen={openDropdown === option.key}
          onToggle={() => setOpenDropdown(openDropdown === option.key ? null : option.key)}
          onClose={() => setOpenDropdown(null)}
        />
      ))}

      {/* Clear All */}
      {activeFilterCount > 0 && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-foreground-muted hover:text-foreground-light dark:hover:text-foreground-dark transition-colors"
        >
          <span className="material-symbols-outlined text-base">close</span>
          Clear ({activeFilterCount})
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Filter Dropdown
// =============================================================================

interface FilterDropdownProps {
  option: FilterOption;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function FilterDropdown({
  option,
  value,
  onChange,
  isOpen,
  onToggle,
  onClose,
}: FilterDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const hasValue = value !== undefined && value !== '' &&
    (!Array.isArray(value) || value.length > 0);

  const getDisplayLabel = () => {
    if (!hasValue) return option.label;

    if (Array.isArray(value)) {
      if (value.length === 1) {
        const match = option.values.find(v => v.value === value[0]);
        return match?.label ?? value[0];
      }
      return `${option.label} (${value.length})`;
    }

    const match = option.values.find(v => v.value === value);
    return match?.label ?? value;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
          border transition-colors
          ${hasValue
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border-light dark:border-border-dark hover:border-primary/50'
          }
        `}
      >
        {option.icon && (
          <span className="material-symbols-outlined text-base">{option.icon}</span>
        )}
        <span>{getDisplayLabel()}</span>
        <span className="material-symbols-outlined text-base">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg z-50">
          <div className="py-1">
            {/* Clear option */}
            {hasValue && (
              <>
                <button
                  onClick={() => {
                    onChange(option.multiple ? [] : '');
                    onClose();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-foreground-muted hover:bg-surface-hover flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                  Clear filter
                </button>
                <div className="border-t border-border-light dark:border-border-dark my-1" />
              </>
            )}

            {/* Filter values */}
            {option.values.map(filterValue => {
              const isSelected = Array.isArray(value)
                ? value.includes(filterValue.value)
                : value === filterValue.value;

              return (
                <button
                  key={filterValue.value}
                  onClick={() => {
                    if (option.multiple) {
                      const current = Array.isArray(value) ? value : [];
                      const next = isSelected
                        ? current.filter(v => v !== filterValue.value)
                        : [...current, filterValue.value];
                      onChange(next);
                    } else {
                      onChange(filterValue.value);
                      onClose();
                    }
                  }}
                  className={`
                    w-full px-3 py-2 text-left text-sm flex items-center justify-between
                    ${isSelected
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-surface-hover text-foreground-light dark:text-foreground-dark'
                    }
                  `}
                >
                  <span>{filterValue.label}</span>
                  {filterValue.count !== undefined && (
                    <span className="text-xs text-foreground-muted">{filterValue.count}</span>
                  )}
                  {isSelected && (
                    <span className="material-symbols-outlined text-base">check</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterBar;
