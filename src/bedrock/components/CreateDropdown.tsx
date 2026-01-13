// src/bedrock/components/CreateDropdown.tsx
// Dropdown for selecting type when creating new objects
// Sprint: experience-console-cleanup-v1
//
// DEX: Declarative Sovereignty - types derived from registry

import React, { useState, useRef, useEffect } from 'react';
import { GlassButton } from '../primitives/GlassButton';

// =============================================================================
// Types
// =============================================================================

export interface CreateDropdownOption {
  /** Unique type identifier */
  type: string;
  /** Human-readable label */
  label: string;
  /** Material Symbols icon name */
  icon: string;
  /** Optional accent color */
  color?: string;
  /** Optional description */
  description?: string;
}

export interface CreateDropdownProps {
  /** Available type options */
  options: CreateDropdownOption[];
  /** Callback when type is selected */
  onSelect: (type: string) => void;
  /** Disable the dropdown */
  disabled?: boolean;
  /** Button label */
  label?: string;
}

// =============================================================================
// Component
// =============================================================================

export const CreateDropdown: React.FC<CreateDropdownProps> = ({
  options,
  onSelect,
  disabled = false,
  label = 'New',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // =========================================================================
  // Close on outside click
  // =========================================================================
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // =========================================================================
  // Close on Escape
  // =========================================================================
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // =========================================================================
  // Handle selection
  // =========================================================================
  const handleSelect = (type: string) => {
    onSelect(type);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <GlassButton
        onClick={() => setIsOpen(!isOpen)}
        variant="primary"
        size="sm"
        disabled={disabled}
      >
        <span className="material-symbols-outlined text-lg">add</span>
        {label}
        <span className="material-symbols-outlined text-sm ml-1">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </GlassButton>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="
            absolute top-full right-0 mt-1 min-w-[240px]
            rounded-lg border border-[var(--glass-border)]
            bg-[var(--glass-solid)] shadow-lg z-50 py-1
            backdrop-blur-sm
          "
        >
          {options.map((option) => (
            <button
              key={option.type}
              onClick={() => handleSelect(option.type)}
              className="
                w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left
                hover:bg-[var(--glass-panel)] transition-colors
              "
            >
              <span
                className="material-symbols-outlined text-lg"
                style={{ color: option.color || 'var(--glass-text)' }}
              >
                {option.icon}
              </span>
              <div className="flex flex-col">
                <span className="text-[var(--glass-text-primary)] font-medium">
                  {option.label}
                </span>
                {option.description && (
                  <span className="text-[var(--glass-text-muted)] text-xs line-clamp-1">
                    {option.description}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CreateDropdown;
