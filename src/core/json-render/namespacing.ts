// src/core/json-render/namespacing.ts
// Sprint: S19-BD-JsonRenderFactory
// Namespace utilities for component type resolution
//
// Convention: "namespace:ComponentName" (e.g., "base:Stack", "signals:QualityGauge")
// Default namespace is "base" if not specified

import type { ParsedComponentName, RenderElement, RenderTree } from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

export const NAMESPACE_SEPARATOR = ':';
export const DEFAULT_NAMESPACE = 'base';

// =============================================================================
// PARSING FUNCTIONS
// =============================================================================

/**
 * Parses a component type string into namespace and name
 *
 * @param fullType - Component type string (e.g., "base:Stack" or "Stack")
 * @returns Parsed namespace and component name
 *
 * @example
 * parseComponentName("signals:QualityGauge")
 * // { namespace: "signals", name: "QualityGauge", fullType: "signals:QualityGauge" }
 *
 * parseComponentName("Stack")
 * // { namespace: "base", name: "Stack", fullType: "base:Stack" }
 */
export function parseComponentName(fullType: string): ParsedComponentName {
  const separatorIndex = fullType.indexOf(NAMESPACE_SEPARATOR);

  if (separatorIndex === -1) {
    // No namespace specified, use default
    return {
      namespace: DEFAULT_NAMESPACE,
      name: fullType,
      fullType: `${DEFAULT_NAMESPACE}${NAMESPACE_SEPARATOR}${fullType}`,
    };
  }

  const namespace = fullType.substring(0, separatorIndex);
  const name = fullType.substring(separatorIndex + 1);

  return {
    namespace,
    name,
    fullType: `${namespace}${NAMESPACE_SEPARATOR}${name}`,
  };
}

/**
 * Creates a fully qualified component type string
 *
 * @param namespace - Component namespace
 * @param name - Component name
 * @returns Full type string
 */
export function makeComponentType(namespace: string, name: string): string {
  return `${namespace}${NAMESPACE_SEPARATOR}${name}`;
}

/**
 * Checks if a type string is namespaced
 */
export function isNamespaced(fullType: string): boolean {
  return fullType.includes(NAMESPACE_SEPARATOR);
}

/**
 * Normalizes a component type to always include namespace
 */
export function normalizeType(fullType: string): string {
  if (isNamespaced(fullType)) {
    return fullType;
  }
  return makeComponentType(DEFAULT_NAMESPACE, fullType);
}

// =============================================================================
// TREE TRANSFORMATION
// =============================================================================

/**
 * Adds namespace prefix to all elements in a render tree that don't have one
 *
 * @param tree - RenderTree to transform
 * @param defaultNamespace - Namespace to add if missing (defaults to "base")
 * @returns New tree with normalized types
 */
export function normalizeTreeNamespaces(
  tree: RenderTree,
  defaultNamespace: string = DEFAULT_NAMESPACE
): RenderTree {
  return {
    ...tree,
    children: tree.children.map(element => normalizeElementNamespace(element, defaultNamespace)),
  };
}

/**
 * Adds namespace prefix to an element if it doesn't have one
 */
export function normalizeElementNamespace<T>(
  element: RenderElement<T>,
  defaultNamespace: string = DEFAULT_NAMESPACE
): RenderElement<T> {
  if (isNamespaced(element.type)) {
    return element;
  }

  return {
    ...element,
    type: makeComponentType(defaultNamespace, element.type),
  };
}

/**
 * Changes the namespace of all elements in a tree from one namespace to another
 *
 * @param tree - RenderTree to transform
 * @param fromNamespace - Original namespace to replace
 * @param toNamespace - New namespace
 * @returns New tree with updated namespaces
 */
export function remapTreeNamespace(
  tree: RenderTree,
  fromNamespace: string,
  toNamespace: string
): RenderTree {
  return {
    ...tree,
    children: tree.children.map(element => {
      const parsed = parseComponentName(element.type);
      if (parsed.namespace === fromNamespace) {
        return {
          ...element,
          type: makeComponentType(toNamespace, parsed.name),
        };
      }
      return element;
    }),
  };
}

// =============================================================================
// SHORTHAND EXPANSION
// =============================================================================

/**
 * Shorthand mapping for common component types
 * Allows using abbreviated types in render trees
 */
const SHORTHAND_MAP: Record<string, string> = {
  // Layout shortcuts
  's': 'base:Stack',
  'stack': 'base:Stack',
  'g': 'base:Grid',
  'grid': 'base:Grid',
  'c': 'base:Container',
  'container': 'base:Container',
  'sp': 'base:Spacer',
  'spacer': 'base:Spacer',
  'd': 'base:Divider',
  'divider': 'base:Divider',

  // Data shortcuts
  't': 'base:Text',
  'text': 'base:Text',
  'm': 'base:Metric',
  'metric': 'base:Metric',
  'b': 'base:Badge',
  'badge': 'base:Badge',
  'p': 'base:Progress',
  'progress': 'base:Progress',
  'h': 'base:Header',
  'header': 'base:Header',

  // Feedback shortcuts
  'e': 'base:Empty',
  'empty': 'base:Empty',
  'l': 'base:Loading',
  'loading': 'base:Loading',
  'a': 'base:Alert',
  'alert': 'base:Alert',
};

/**
 * Expands shorthand type to full namespaced type
 */
export function expandShorthand(shortType: string): string {
  const lower = shortType.toLowerCase();
  if (SHORTHAND_MAP[lower]) {
    return SHORTHAND_MAP[lower];
  }
  return normalizeType(shortType);
}

/**
 * Expands all shorthand types in a render tree
 */
export function expandTreeShorthands(tree: RenderTree): RenderTree {
  return {
    ...tree,
    children: tree.children.map(element => ({
      ...element,
      type: expandShorthand(element.type),
    })),
  };
}

// =============================================================================
// NAMESPACE UTILITIES
// =============================================================================

/**
 * Extracts all unique namespaces from a render tree
 */
export function extractNamespaces(tree: RenderTree): Set<string> {
  const namespaces = new Set<string>();

  for (const element of tree.children) {
    const parsed = parseComponentName(element.type);
    namespaces.add(parsed.namespace);
  }

  return namespaces;
}

/**
 * Groups elements by namespace
 */
export function groupByNamespace(
  tree: RenderTree
): Map<string, RenderElement[]> {
  const groups = new Map<string, RenderElement[]>();

  for (const element of tree.children) {
    const parsed = parseComponentName(element.type);
    const existing = groups.get(parsed.namespace) || [];
    existing.push(element);
    groups.set(parsed.namespace, existing);
  }

  return groups;
}

/**
 * Filters tree to only include elements from specified namespaces
 */
export function filterByNamespace(
  tree: RenderTree,
  namespaces: string[]
): RenderTree {
  const namespaceSet = new Set(namespaces);

  return {
    ...tree,
    children: tree.children.filter(element => {
      const parsed = parseComponentName(element.type);
      return namespaceSet.has(parsed.namespace);
    }),
  };
}
