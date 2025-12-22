// src/shared/FilterButton.tsx
// Filter dropdown button

import { useState, useRef, useEffect } from 'react';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterButtonProps {
  options: FilterOption[];
  activeFilters: string[];
  onChange: (filters: string[]) => void;
  label?: string;
}

export function FilterButton({ options, activeFilters, onChange, label = 'Filter' }: FilterButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFilter = (filterId: string) => {
    if (activeFilters.includes(filterId)) {
      onChange(activeFilters.filter(f => f !== filterId));
    } else {
      onChange([...activeFilters, filterId]);
    }
  };

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-center gap-2 px-3.5 py-2.5
          bg-surface-light dark:bg-slate-900 border rounded-lg text-sm font-medium
          transition-colors shadow-sm
          ${hasActiveFilters
            ? 'border-primary text-primary'
            : 'border-border-light dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-stone-50 dark:hover:bg-slate-800'
          }
        `}
      >
        <span className="material-symbols-outlined text-[18px]">filter_list</span>
        <span>{label}</span>
        {hasActiveFilters && (
          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary text-white">
            {activeFilters.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-surface-light dark:bg-slate-900 border border-border-light dark:border-slate-700 rounded-lg shadow-lg z-50 py-2">
          {options.length === 0 ? (
            <div className="px-4 py-2 text-sm text-slate-500">No filters available</div>
          ) : (
            options.map(option => (
              <button
                key={option.id}
                onClick={() => toggleFilter(option.id)}
                className="w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-lg ${activeFilters.includes(option.id) ? 'text-primary' : 'text-transparent'}`}>
                    check
                  </span>
                  <span className={activeFilters.includes(option.id) ? 'text-primary font-medium' : 'text-slate-700 dark:text-slate-300'}>
                    {option.label}
                  </span>
                </div>
                {option.count !== undefined && (
                  <span className="text-xs text-slate-400">{option.count}</span>
                )}
              </button>
            ))
          )}
          {hasActiveFilters && (
            <>
              <div className="border-t border-border-light dark:border-slate-700 my-2" />
              <button
                onClick={() => onChange([])}
                className="w-full px-4 py-2 text-sm text-left text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors"
              >
                Clear all filters
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
