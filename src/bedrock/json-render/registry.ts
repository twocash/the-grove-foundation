// src/bedrock/json-render/registry.ts
// Sprint: S19-BD-JsonRenderFactory
// Central component registry for json-render
//
// Pattern: Singleton registry that maps namespaced types to React components

import React from 'react';
import type {
  RenderElement,
  ComponentMeta,
  RegisteredComponent,
  CatalogDefinition,
} from '@core/json-render';
import { parseComponentName, makeComponentType } from '@core/json-render';

// =============================================================================
// REGISTRY CLASS
// =============================================================================

/**
 * ComponentRegistry - Central registry for all json-render components
 *
 * Provides:
 * - Component registration by namespace
 * - Component lookup by full type (e.g., "signals:QualityGauge")
 * - Listing components by namespace or all
 * - Integration with catalog definitions
 */
class ComponentRegistryImpl {
  private components: Map<string, RegisteredComponent> = new Map();
  private namespaces: Set<string> = new Set();
  private catalogs: Map<string, CatalogDefinition> = new Map();

  /**
   * Registers a single component
   */
  register(
    namespace: string,
    name: string,
    render: React.FC<{ element: RenderElement }>,
    meta?: Partial<ComponentMeta>
  ): void {
    const fullType = makeComponentType(namespace, name);

    this.components.set(fullType, {
      meta: {
        props: meta?.props ?? ({} as any),
        category: meta?.category ?? 'custom',
        description: meta?.description,
        agentHint: meta?.agentHint,
      },
      catalog: namespace,
      render,
    });

    this.namespaces.add(namespace);
  }

  /**
   * Registers all components from a catalog with their React implementations
   */
  registerCatalog(
    catalog: CatalogDefinition,
    implementations: Record<string, React.FC<{ element: RenderElement }>>
  ): void {
    this.catalogs.set(catalog.name, catalog);
    this.namespaces.add(catalog.name);

    for (const [name, meta] of Object.entries(catalog.components)) {
      const render = implementations[name];
      if (render) {
        const fullType = makeComponentType(catalog.name, name);
        this.components.set(fullType, {
          meta,
          catalog: catalog.name,
          render,
        });
      }
    }
  }

  /**
   * Gets a registered component by full type
   */
  get(fullType: string): RegisteredComponent | undefined {
    // Try exact match first
    if (this.components.has(fullType)) {
      return this.components.get(fullType);
    }

    // If no namespace, try with default "base" namespace
    const parsed = parseComponentName(fullType);
    return this.components.get(parsed.fullType);
  }

  /**
   * Checks if a component is registered
   */
  has(fullType: string): boolean {
    if (this.components.has(fullType)) {
      return true;
    }
    const parsed = parseComponentName(fullType);
    return this.components.has(parsed.fullType);
  }

  /**
   * Gets the render function for a component
   */
  getRenderer(fullType: string): React.FC<{ element: RenderElement }> | undefined {
    return this.get(fullType)?.render;
  }

  /**
   * Lists all registered components
   */
  listAll(): Map<string, RegisteredComponent> {
    return new Map(this.components);
  }

  /**
   * Lists components by namespace
   */
  listByNamespace(namespace: string): Map<string, RegisteredComponent> {
    const result = new Map<string, RegisteredComponent>();

    for (const [fullType, component] of this.components) {
      const parsed = parseComponentName(fullType);
      if (parsed.namespace === namespace) {
        result.set(fullType, component);
      }
    }

    return result;
  }

  /**
   * Gets all registered namespaces
   */
  getNamespaces(): string[] {
    return [...this.namespaces];
  }

  /**
   * Gets a catalog definition by name
   */
  getCatalog(name: string): CatalogDefinition | undefined {
    return this.catalogs.get(name);
  }

  /**
   * Gets all registered catalogs
   */
  getCatalogs(): Map<string, CatalogDefinition> {
    return new Map(this.catalogs);
  }

  /**
   * Gets component count
   */
  size(): number {
    return this.components.size;
  }

  /**
   * Clears all registrations (mainly for testing)
   */
  clear(): void {
    this.components.clear();
    this.namespaces.clear();
    this.catalogs.clear();
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Global component registry instance
 */
export const componentRegistry = new ComponentRegistryImpl();

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Registers a component to the global registry
 */
export function registerComponent(
  namespace: string,
  name: string,
  render: React.FC<{ element: RenderElement }>,
  meta?: Partial<ComponentMeta>
): void {
  componentRegistry.register(namespace, name, render, meta);
}

/**
 * Registers a catalog with implementations to the global registry
 */
export function registerCatalog(
  catalog: CatalogDefinition,
  implementations: Record<string, React.FC<{ element: RenderElement }>>
): void {
  componentRegistry.registerCatalog(catalog, implementations);
}

/**
 * Gets a component from the global registry
 */
export function getComponent(fullType: string): RegisteredComponent | undefined {
  return componentRegistry.get(fullType);
}

/**
 * Checks if a component exists in the global registry
 */
export function hasComponent(fullType: string): boolean {
  return componentRegistry.has(fullType);
}

export default componentRegistry;
