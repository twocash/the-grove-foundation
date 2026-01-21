// src/core/json-render/validation.ts
// Sprint: S19-BD-JsonRenderFactory
// Validation utilities for render trees
//
// Pattern: Validates structure and component props against catalog schemas

import type {
  RenderTree,
  RenderElement,
  CatalogDefinition,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './types';
import { RenderTreeSchema, isRenderTree, isRenderElement } from './types';
import { parseComponentName, DEFAULT_NAMESPACE } from './namespacing';

// =============================================================================
// MAIN VALIDATION FUNCTION
// =============================================================================

/**
 * Validates a render tree against registered catalogs
 *
 * @param tree - The render tree to validate
 * @param catalogs - Map of namespace to catalog definition
 * @param options - Validation options
 * @returns ValidationResult with errors and warnings
 */
export function validateRenderTree(
  tree: unknown,
  catalogs: Map<string, CatalogDefinition>,
  options: ValidationOptions = {}
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const { strict = false, allowUnknownComponents = false } = options;

  // Step 1: Validate structure
  if (!isRenderTree(tree)) {
    const structuralResult = RenderTreeSchema.safeParse(tree);
    if (!structuralResult.success) {
      errors.push({
        path: 'root',
        message: `Invalid tree structure: ${structuralResult.error.message}`,
      });
      return { valid: false, errors, warnings };
    }
  }

  const validTree = tree as RenderTree;

  // Step 2: Validate meta if present
  if (validTree.meta) {
    if (!catalogs.has(validTree.meta.catalog)) {
      warnings.push({
        path: 'root.meta.catalog',
        message: `Unknown catalog "${validTree.meta.catalog}" in tree metadata`,
      });
    }
  }

  // Step 3: Validate each child element
  validTree.children.forEach((element, index) => {
    const elementPath = `root.children[${index}]`;
    const elementResult = validateElement(element, catalogs, elementPath, {
      strict,
      allowUnknownComponents,
    });
    errors.push(...elementResult.errors);
    warnings.push(...elementResult.warnings);
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// ELEMENT VALIDATION
// =============================================================================

interface ValidationOptions {
  strict?: boolean;
  allowUnknownComponents?: boolean;
}

/**
 * Validates a single render element
 */
function validateElement(
  element: unknown,
  catalogs: Map<string, CatalogDefinition>,
  path: string,
  options: ValidationOptions
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check basic element structure
  if (!isRenderElement(element)) {
    errors.push({
      path,
      message: 'Invalid element structure',
      element: element as RenderElement,
    });
    return { valid: false, errors, warnings };
  }

  const validElement = element as RenderElement;

  // Parse namespace and component name
  const { namespace, name, fullType } = parseComponentName(validElement.type);

  // Check if namespace exists
  const catalog = catalogs.get(namespace);
  if (!catalog) {
    if (options.allowUnknownComponents) {
      warnings.push({
        path: `${path}.type`,
        message: `Unknown namespace "${namespace}" for component "${fullType}"`,
        element: validElement,
      });
    } else {
      errors.push({
        path: `${path}.type`,
        message: `Unknown namespace "${namespace}" for component "${fullType}"`,
        element: validElement,
      });
    }
    return { valid: errors.length === 0, errors, warnings };
  }

  // Check if component exists in catalog
  const componentMeta = catalog.components[name];
  if (!componentMeta) {
    if (options.allowUnknownComponents) {
      warnings.push({
        path: `${path}.type`,
        message: `Unknown component "${name}" in namespace "${namespace}"`,
        element: validElement,
      });
    } else {
      errors.push({
        path: `${path}.type`,
        message: `Unknown component "${name}" in namespace "${namespace}"`,
        element: validElement,
      });
    }
    return { valid: errors.length === 0, errors, warnings };
  }

  // Validate props against schema
  if (options.strict && componentMeta.props) {
    const propsResult = componentMeta.props.safeParse(validElement.props);
    if (!propsResult.success) {
      errors.push({
        path: `${path}.props`,
        message: `Invalid props for "${fullType}": ${propsResult.error.message}`,
        element: validElement,
      });
    }
  }

  // Check for nested children (recursive validation)
  if (validElement.props && typeof validElement.props === 'object') {
    const props = validElement.props as Record<string, unknown>;
    if (Array.isArray(props.children)) {
      props.children.forEach((child, childIndex) => {
        if (isRenderElement(child)) {
          const childResult = validateElement(
            child,
            catalogs,
            `${path}.props.children[${childIndex}]`,
            options
          );
          errors.push(...childResult.errors);
          warnings.push(...childResult.warnings);
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// QUICK VALIDATORS
// =============================================================================

/**
 * Quick check if a tree is structurally valid (doesn't check component types)
 */
export function isValidTreeStructure(tree: unknown): tree is RenderTree {
  const result = RenderTreeSchema.safeParse(tree);
  return result.success;
}

/**
 * Validates only the structure, returns detailed errors
 */
export function validateTreeStructure(tree: unknown): ValidationResult {
  const result = RenderTreeSchema.safeParse(tree);

  if (result.success) {
    return { valid: true, errors: [], warnings: [] };
  }

  return {
    valid: false,
    errors: result.error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
    })),
    warnings: [],
  };
}

/**
 * Gets all unknown component types in a tree
 */
export function getUnknownComponents(
  tree: RenderTree,
  catalogs: Map<string, CatalogDefinition>
): string[] {
  const unknown: string[] = [];

  for (const element of tree.children) {
    const { namespace, name, fullType } = parseComponentName(element.type);
    const catalog = catalogs.get(namespace);

    if (!catalog || !catalog.components[name]) {
      unknown.push(fullType);
    }
  }

  return [...new Set(unknown)];
}

/**
 * Gets all required namespaces for a tree
 */
export function getRequiredNamespaces(tree: RenderTree): string[] {
  const namespaces = new Set<string>();

  for (const element of tree.children) {
    const { namespace } = parseComponentName(element.type);
    namespaces.add(namespace);
  }

  return [...namespaces];
}

// =============================================================================
// SANITIZATION
// =============================================================================

/**
 * Removes unknown components from a tree
 */
export function sanitizeTree(
  tree: RenderTree,
  catalogs: Map<string, CatalogDefinition>
): RenderTree {
  return {
    ...tree,
    children: tree.children.filter(element => {
      const { namespace, name } = parseComponentName(element.type);
      const catalog = catalogs.get(namespace);
      return catalog && catalog.components[name];
    }),
  };
}

/**
 * Replaces unknown components with a fallback element
 */
export function replaceUnknownComponents(
  tree: RenderTree,
  catalogs: Map<string, CatalogDefinition>,
  fallback: RenderElement
): RenderTree {
  return {
    ...tree,
    children: tree.children.map(element => {
      const { namespace, name } = parseComponentName(element.type);
      const catalog = catalogs.get(namespace);

      if (catalog && catalog.components[name]) {
        return element;
      }

      return {
        ...fallback,
        key: element.key,
        provenance: element.provenance,
      };
    }),
  };
}
