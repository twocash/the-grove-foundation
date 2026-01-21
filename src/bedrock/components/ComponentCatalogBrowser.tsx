// src/bedrock/components/ComponentCatalogBrowser.tsx
// Sprint: S19-BD-JsonRenderFactory - Phase 11
// Component Catalog Browser for System Settings
//
// Displays all registered json-render catalogs and their components
// with metadata, descriptions, and agent hints.

import React, { useState, useMemo } from 'react';
import { componentRegistry } from '@bedrock/json-render';
import type { ComponentMeta } from '@core/json-render';

// =============================================================================
// TYPES
// =============================================================================

interface CatalogSummary {
  name: string;
  version: string;
  componentCount: number;
}

interface ComponentEntry {
  fullType: string;
  name: string;
  namespace: string;
  meta: ComponentMeta;
}

// =============================================================================
// CATEGORY BADGE
// =============================================================================

const CATEGORY_COLORS: Record<string, string> = {
  data: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  layout: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  feedback: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  action: 'bg-green-500/20 text-green-300 border-green-500/30',
  custom: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

function CategoryBadge({ category }: { category: string }) {
  const colorClasses = CATEGORY_COLORS[category] || CATEGORY_COLORS.custom;
  return (
    <span className={`px-2 py-0.5 text-xs rounded border ${colorClasses}`}>
      {category}
    </span>
  );
}

// =============================================================================
// COMPONENT CARD
// =============================================================================

function ComponentCard({ entry }: { entry: ComponentEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="bg-[var(--glass-panel)] rounded-lg border border-white/5 p-4 hover:border-white/10 transition-colors cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm text-[var(--glass-text-primary)] font-medium">
              {entry.name}
            </span>
            <CategoryBadge category={entry.meta.category} />
          </div>
          <p className="text-xs text-[var(--glass-text-muted)] truncate">
            {entry.meta.description || 'No description'}
          </p>
        </div>
        <span className="text-[var(--glass-text-muted)] text-xs">
          {expanded ? '▼' : '▶'}
        </span>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
          <div>
            <span className="text-xs text-[var(--glass-text-muted)]">Full Type:</span>
            <code className="ml-2 px-1.5 py-0.5 bg-black/30 rounded text-xs text-cyan-300 font-mono">
              {entry.fullType}
            </code>
          </div>

          {entry.meta.agentHint && (
            <div>
              <span className="text-xs text-[var(--glass-text-muted)]">Agent Hint:</span>
              <p className="mt-1 text-xs text-[var(--glass-text-secondary)] italic">
                "{entry.meta.agentHint}"
              </p>
            </div>
          )}

          {entry.meta.props && (
            <div>
              <span className="text-xs text-[var(--glass-text-muted)]">Props Schema:</span>
              <p className="mt-1 text-xs text-green-300/70">
                Zod schema available
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CATALOG SECTION
// =============================================================================

function CatalogSection({
  namespace,
  components,
  isExpanded,
  onToggle,
}: {
  namespace: string;
  components: ComponentEntry[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const catalog = componentRegistry.getCatalog(namespace);

  return (
    <div className="bg-[var(--glass-solid)] rounded-xl border border-white/5 overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[var(--glass-text-primary)] font-medium">
            {namespace}
          </span>
          {catalog && (
            <span className="text-xs text-[var(--glass-text-muted)]">
              v{catalog.version}
            </span>
          )}
          <span className="px-2 py-0.5 bg-white/5 rounded text-xs text-[var(--glass-text-muted)]">
            {components.length} components
          </span>
        </div>
        <span className="text-[var(--glass-text-muted)]">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {/* Components List */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {components.map((entry) => (
            <ComponentCard key={entry.fullType} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SEARCH INPUT
// =============================================================================

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search components..."
        className="w-full px-4 py-2 pl-10 bg-[var(--glass-panel)] border border-white/10 rounded-lg text-sm text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
      />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--glass-text-muted)]">
        🔍
      </span>
    </div>
  );
}

// =============================================================================
// STATS BAR
// =============================================================================

function StatsBar({
  catalogs,
  totalComponents,
}: {
  catalogs: CatalogSummary[];
  totalComponents: number;
}) {
  return (
    <div className="flex items-center gap-4 text-sm text-[var(--glass-text-muted)]">
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
        {catalogs.length} catalogs
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-violet-500"></span>
        {totalComponents} components
      </span>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export interface ComponentCatalogBrowserProps {
  className?: string;
  defaultExpanded?: string[];
}

/**
 * ComponentCatalogBrowser - Browse all registered json-render components
 *
 * Features:
 * - Lists all registered catalogs/namespaces
 * - Shows components grouped by catalog
 * - Displays metadata, descriptions, and agent hints
 * - Searchable by component name or description
 */
export function ComponentCatalogBrowser({
  className = '',
  defaultExpanded = [],
}: ComponentCatalogBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNamespaces, setExpandedNamespaces] = useState<Set<string>>(
    new Set(defaultExpanded)
  );

  // Get all components grouped by namespace
  const { namespaces, componentsByNamespace, catalogSummaries } = useMemo(() => {
    const allComponents = componentRegistry.listAll();
    const namespaces = componentRegistry.getNamespaces().sort();

    const componentsByNamespace: Record<string, ComponentEntry[]> = {};
    const catalogSummaries: CatalogSummary[] = [];

    for (const namespace of namespaces) {
      const components = componentRegistry.listByNamespace(namespace);
      const entries: ComponentEntry[] = [];

      for (const [fullType, registered] of components) {
        const parts = fullType.split(':');
        const name = parts.length > 1 ? parts[1] : parts[0];

        entries.push({
          fullType,
          name,
          namespace,
          meta: registered.meta,
        });
      }

      // Sort by name
      entries.sort((a, b) => a.name.localeCompare(b.name));
      componentsByNamespace[namespace] = entries;

      const catalog = componentRegistry.getCatalog(namespace);
      catalogSummaries.push({
        name: namespace,
        version: catalog?.version || '1.0.0',
        componentCount: entries.length,
      });
    }

    return { namespaces, componentsByNamespace, catalogSummaries };
  }, []);

  // Filter by search query
  const filteredComponentsByNamespace = useMemo(() => {
    if (!searchQuery.trim()) {
      return componentsByNamespace;
    }

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, ComponentEntry[]> = {};

    for (const [namespace, components] of Object.entries(componentsByNamespace)) {
      const matchingComponents = components.filter(
        (entry) =>
          entry.name.toLowerCase().includes(query) ||
          entry.fullType.toLowerCase().includes(query) ||
          entry.meta.description?.toLowerCase().includes(query) ||
          entry.meta.agentHint?.toLowerCase().includes(query) ||
          entry.meta.category.toLowerCase().includes(query)
      );

      if (matchingComponents.length > 0) {
        filtered[namespace] = matchingComponents;
      }
    }

    return filtered;
  }, [componentsByNamespace, searchQuery]);

  const filteredNamespaces = Object.keys(filteredComponentsByNamespace).sort();
  const totalFilteredComponents = Object.values(filteredComponentsByNamespace).reduce(
    (sum, components) => sum + components.length,
    0
  );

  const toggleNamespace = (namespace: string) => {
    setExpandedNamespaces((prev) => {
      const next = new Set(prev);
      if (next.has(namespace)) {
        next.delete(namespace);
      } else {
        next.add(namespace);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedNamespaces(new Set(filteredNamespaces));
  };

  const collapseAll = () => {
    setExpandedNamespaces(new Set());
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
            Component Catalog Browser
          </h3>
          <p className="text-sm text-[var(--glass-text-muted)] mt-0.5">
            Browse registered json-render components and their metadata
          </p>
        </div>
        <StatsBar
          catalogs={catalogSummaries}
          totalComponents={componentRegistry.size()}
        />
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <SearchInput value={searchQuery} onChange={setSearchQuery} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-2 text-xs text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)] bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-2 text-xs text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)] bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Results Summary */}
      {searchQuery && (
        <div className="text-sm text-[var(--glass-text-muted)]">
          Found {totalFilteredComponents} component{totalFilteredComponents !== 1 ? 's' : ''} in{' '}
          {filteredNamespaces.length} catalog{filteredNamespaces.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Catalog List */}
      <div className="space-y-3">
        {filteredNamespaces.length === 0 ? (
          <div className="bg-[var(--glass-solid)] rounded-xl p-8 text-center">
            <p className="text-[var(--glass-text-muted)]">
              {searchQuery
                ? 'No components match your search'
                : 'No components registered yet'}
            </p>
            <p className="text-xs text-[var(--glass-text-muted)] mt-1">
              {searchQuery
                ? 'Try a different search term'
                : 'Import register-* files to populate the catalog'}
            </p>
          </div>
        ) : (
          filteredNamespaces.map((namespace) => (
            <CatalogSection
              key={namespace}
              namespace={namespace}
              components={filteredComponentsByNamespace[namespace]}
              isExpanded={expandedNamespaces.has(namespace)}
              onToggle={() => toggleNamespace(namespace)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ComponentCatalogBrowser;
