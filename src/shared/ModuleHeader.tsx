// src/shared/ModuleHeader.tsx
// Consistent header for module pages
// Sprint: route-selection-flow-v1

import { type ReactNode } from 'react';
import { SearchInput } from './SearchInput';

interface ModuleHeaderProps {
  title?: string;
  description?: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  contextualFeatures?: ReactNode;
}

export function ModuleHeader({
  title,
  description,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  contextualFeatures,
}: ModuleHeaderProps) {
  return (
    <div className="mb-6">
      {/* Optional title/description */}
      {title && (
        <h1 className="text-3xl font-bold text-[var(--glass-text-primary)] mb-3">
          {title}
        </h1>
      )}
      {description && (
        <p className="text-[var(--glass-text-muted)] mb-6 leading-relaxed max-w-2xl">
          {description}
        </p>
      )}

      {/* Search / Features Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Search */}
        <div className="flex-1 max-w-sm">
          <SearchInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={onSearchChange}
          />
        </div>

        {/* Right: Contextual Features */}
        {contextualFeatures && (
          <div className="flex items-center gap-2">
            {contextualFeatures}
          </div>
        )}
      </div>
    </div>
  );
}
