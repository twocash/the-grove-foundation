// src/core/json-render/factory.ts
// Sprint: S19-BD-JsonRenderFactory
// Factory function for creating catalogs with inheritance
//
// Pattern: Catalogs extend base catalog, inheriting layout primitives
// New catalogs only need to define domain-specific components

import type { CatalogDefinition, ComponentMeta, CreateCatalogOptions } from './types';
import { BaseCatalog } from './base-catalog';

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Creates a new catalog definition with optional inheritance from parent catalogs
 *
 * @param options - Catalog configuration
 * @returns CatalogDefinition with merged components from parents
 *
 * @example
 * ```typescript
 * const SignalsCatalog = createCatalog({
 *   name: 'signals',
 *   version: '1.0.0',
 *   extends: [BaseCatalog],
 *   components: {
 *     QualityGauge: { props: QualityGaugeSchema, category: 'data' },
 *     FunnelChart: { props: FunnelChartSchema, category: 'data' },
 *   },
 * });
 * ```
 */
export function createCatalog(options: CreateCatalogOptions): CatalogDefinition {
  const {
    name,
    version = '1.0.0',
    extends: parents = [BaseCatalog],
    components,
  } = options;

  // Merge components from all parent catalogs
  const inheritedComponents = parents.reduce(
    (acc, parent) => ({ ...acc, ...parent.components }),
    {} as Record<string, ComponentMeta>
  );

  // Build extends list from parent names
  const extendsList = parents.map(p => p.name);

  return {
    name,
    version,
    extends: extendsList,
    components: {
      ...inheritedComponents,
      ...components,
    },
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Checks if a catalog has a specific component
 */
export function hasComponent(catalog: CatalogDefinition, componentName: string): boolean {
  return componentName in catalog.components;
}

/**
 * Gets component metadata from a catalog
 */
export function getComponentMeta(
  catalog: CatalogDefinition,
  componentName: string
): ComponentMeta | undefined {
  return catalog.components[componentName];
}

/**
 * Lists all component names in a catalog
 */
export function listComponents(catalog: CatalogDefinition): string[] {
  return Object.keys(catalog.components);
}

/**
 * Lists components by category
 */
export function listComponentsByCategory(
  catalog: CatalogDefinition,
  category: ComponentMeta['category']
): string[] {
  return Object.entries(catalog.components)
    .filter(([, meta]) => meta.category === category)
    .map(([name]) => name);
}

/**
 * Merges multiple catalogs into one (for complex inheritance)
 */
export function mergeCatalogs(
  name: string,
  version: string,
  ...catalogs: CatalogDefinition[]
): CatalogDefinition {
  const mergedComponents = catalogs.reduce(
    (acc, catalog) => ({ ...acc, ...catalog.components }),
    {} as Record<string, ComponentMeta>
  );

  const extendsList = catalogs.map(c => c.name);

  return {
    name,
    version,
    extends: extendsList,
    components: mergedComponents,
  };
}

/**
 * Creates a catalog that only contains specified components from a parent
 */
export function pickComponents(
  catalog: CatalogDefinition,
  componentNames: string[]
): Record<string, ComponentMeta> {
  return componentNames.reduce((acc, name) => {
    if (catalog.components[name]) {
      acc[name] = catalog.components[name];
    }
    return acc;
  }, {} as Record<string, ComponentMeta>);
}

/**
 * Creates a catalog that excludes specified components from a parent
 */
export function omitComponents(
  catalog: CatalogDefinition,
  componentNames: string[]
): Record<string, ComponentMeta> {
  const excludeSet = new Set(componentNames);
  return Object.entries(catalog.components)
    .filter(([name]) => !excludeSet.has(name))
    .reduce((acc, [name, meta]) => {
      acc[name] = meta;
      return acc;
    }, {} as Record<string, ComponentMeta>);
}

// =============================================================================
// CATALOG INFO
// =============================================================================

/**
 * Gets summary info about a catalog
 */
export function getCatalogInfo(catalog: CatalogDefinition): {
  name: string;
  version: string;
  extends: string[];
  componentCount: number;
  categories: Record<string, number>;
} {
  const categories: Record<string, number> = {};

  for (const meta of Object.values(catalog.components)) {
    categories[meta.category] = (categories[meta.category] || 0) + 1;
  }

  return {
    name: catalog.name,
    version: catalog.version,
    extends: catalog.extends || [],
    componentCount: Object.keys(catalog.components).length,
    categories,
  };
}
