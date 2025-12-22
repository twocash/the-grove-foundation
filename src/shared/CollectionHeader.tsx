// src/shared/CollectionHeader.tsx
// Reusable header for collection views with search, filter, sort

import { SearchInput } from './SearchInput';
import { FilterButton, FilterOption } from './FilterButton';
import { SortButton, SortOption } from './SortButton';
import { ActiveIndicator } from './ActiveIndicator';

interface CollectionHeaderProps {
  // Title and description
  title: string;
  description: string;

  // Search
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;

  // Filter (optional)
  filterOptions?: FilterOption[];
  activeFilters?: string[];
  onFilterChange?: (filters: string[]) => void;

  // Sort (optional)
  sortOptions?: SortOption[];
  activeSort?: string;
  onSortChange?: (sortId: string) => void;

  // Active indicator (optional)
  activeIndicator?: {
    label: string;
    value: string;
    icon?: string;
  };

  // Additional content
  children?: React.ReactNode;
}

export function CollectionHeader({
  title,
  description,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filterOptions,
  activeFilters = [],
  onFilterChange,
  sortOptions,
  activeSort = '',
  onSortChange,
  activeIndicator,
  children,
}: CollectionHeaderProps) {
  return (
    <div className="mb-6">
      {/* Title and Description */}
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
        {title}
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-2xl">
        {description}
      </p>

      {/* Search / Filter / Sort Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-6">
        <SearchInput
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={onSearchChange}
        />
        <div className="flex gap-2 w-full md:w-auto">
          {filterOptions && filterOptions.length > 0 && onFilterChange && (
            <FilterButton
              options={filterOptions}
              activeFilters={activeFilters}
              onChange={onFilterChange}
            />
          )}
          {sortOptions && sortOptions.length > 0 && onSortChange && (
            <SortButton
              options={sortOptions}
              activeSort={activeSort}
              onChange={onSortChange}
            />
          )}
        </div>
      </div>

      {/* Active Indicator */}
      {activeIndicator && (
        <ActiveIndicator
          label={activeIndicator.label}
          value={activeIndicator.value}
          icon={activeIndicator.icon}
          className="mb-8"
        />
      )}

      {/* Additional content */}
      {children}
    </div>
  );
}
