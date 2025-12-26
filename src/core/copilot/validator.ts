// src/core/copilot/validator.ts
// Validate JSON patches against object schema

import type { JsonPatch, ValidationResult, ValidationError } from './schema';
import type { GroveObjectType } from '@core/schema/grove-object';

/**
 * Valid paths for meta fields (all object types)
 */
const VALID_META_PATHS = [
  '/meta/title',
  '/meta/description',
  '/meta/icon',
  '/meta/color',
  '/meta/status',
  '/meta/favorite',
  '/meta/tags',
  '/meta/tags/-', // Add to array
];

/**
 * Valid payload paths by object type
 */
const VALID_PAYLOAD_PATHS: Record<string, string[]> = {
  journey: [
    '/payload/entryNode',
    '/payload/targetAha',
    '/payload/linkedHubId',
    '/payload/estimatedMinutes',
  ],
  lens: [
    '/payload/toneGuidance',
    '/payload/arcEmphasis',
    '/payload/vocabularyLevel',
    '/payload/entryPoints',
  ],
  node: [
    '/payload/label',
    '/payload/contextSnippet',
    '/payload/next',
    '/payload/personas',
  ],
  hub: [
    '/payload/tags',
    '/payload/priority',
    '/payload/commonMisconceptions',
    '/payload/primarySource',
  ],
  sprout: [
    '/payload/type',
    '/payload/hubId',
    '/payload/growthStage',
    '/payload/content',
  ],
};

/**
 * Required fields that cannot be removed
 */
const REQUIRED_FIELDS = ['/meta/id', '/meta/type', '/meta/title'];

/**
 * Validate a patch path
 */
function isValidPath(path: string, objectType: GroveObjectType): boolean {
  // Check meta paths
  if (path.startsWith('/meta/')) {
    // Allow array index paths for tags
    if (path.match(/^\/meta\/tags\/\d+$/)) return true;
    return VALID_META_PATHS.includes(path);
  }

  // Check payload paths
  if (path.startsWith('/payload/')) {
    const typePaths = VALID_PAYLOAD_PATHS[objectType] || [];
    return typePaths.some(p => path.startsWith(p));
  }

  return false;
}

/**
 * Validate a JSON patch against object schema
 */
export function validatePatch(
  patch: JsonPatch,
  objectType: GroveObjectType
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const op of patch) {
    // Check for required field removal
    if (op.op === 'remove' && REQUIRED_FIELDS.includes(op.path)) {
      errors.push({
        path: op.path,
        message: `Cannot remove required field: ${op.path.split('/').pop()}`,
        code: 'REQUIRED_FIELD',
      });
      continue;
    }

    // Check path validity
    if (!isValidPath(op.path, objectType)) {
      errors.push({
        path: op.path,
        message: `Invalid field path: ${op.path}`,
        code: 'INVALID_PATH',
      });
      continue;
    }

    // Type checking for known fields
    if (op.path === '/meta/favorite' && typeof op.value !== 'boolean') {
      errors.push({
        path: op.path,
        message: 'Favorite must be true or false',
        code: 'TYPE_MISMATCH',
      });
    }

    if (op.path === '/payload/estimatedMinutes' && typeof op.value !== 'number') {
      const parsed = parseInt(String(op.value), 10);
      if (isNaN(parsed)) {
        errors.push({
          path: op.path,
          message: 'Duration must be a number',
          code: 'TYPE_MISMATCH',
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
