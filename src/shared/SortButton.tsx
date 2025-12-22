// src/shared/SortButton.tsx
// Sort dropdown button

import { useState, useRef, useEffect } from 'react';

export interface SortOption {
  id: string;
  label: string;
}

interface SortButtonProps {
  options: SortOption[];
  activeSort: string;
  onChange: (sortId: string) => void;
  label?: string;
}

export function SortButton({ options, activeSort, onChange, label = 'Sort' }: SortButtonProps) {
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

  const activeOption = options.find(o => o.id === activeSort);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-surface-light dark:bg-slate-900 border border-border-light dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
      >
        <span className="material-symbols-outlined text-[18px]">sort</span>
        <span>{activeOption?.label || label}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-surface-light dark:bg-slate-900 border border-border-light dark:border-slate-700 rounded-lg shadow-lg z-50 py-2">
          {options.map(option => (
            <button
              key={option.id}
              onClick={() => {
                onChange(option.id);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className={`material-symbols-outlined text-lg ${activeSort === option.id ? 'text-primary' : 'text-transparent'}`}>
                check
              </span>
              <span className={activeSort === option.id ? 'text-primary font-medium' : 'text-slate-700 dark:text-slate-300'}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
