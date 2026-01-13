// src/bedrock/utils/nested-field.ts
// Utilities for working with nested field paths in objects
// Sprint: singleton-pattern-factory-v1

/**
 * Get a value from a nested path in an object
 * @param obj - The object to read from
 * @param path - Dot-separated path, e.g., 'meta.status' or 'payload.version'
 * @returns The value at the path, or undefined if not found
 *
 * @example
 * getNestedValue({ meta: { status: 'active' } }, 'meta.status') // 'active'
 * getNestedValue({ payload: { version: 1 } }, 'payload.version') // 1
 */
export function getNestedValue<T = unknown>(obj: unknown, path: string): T | undefined {
  if (!obj || typeof obj !== 'object') return undefined;

  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current as T;
}

/**
 * Set a value at a nested path in an object (mutates the object)
 * Creates intermediate objects as needed
 * @param obj - The object to modify
 * @param path - Dot-separated path, e.g., 'meta.status' or 'payload.version'
 * @param value - The value to set
 *
 * @example
 * const obj = { meta: {} };
 * setNestedValue(obj, 'meta.status', 'draft');
 * // obj is now { meta: { status: 'draft' } }
 */
export function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  const lastPart = parts[parts.length - 1];
  current[lastPart] = value;
}

/**
 * Convert a dot-separated path to JSON Pointer format
 * @param path - Dot-separated path, e.g., 'meta.status'
 * @returns JSON Pointer path, e.g., '/meta/status'
 *
 * @example
 * toJsonPointer('meta.status') // '/meta/status'
 * toJsonPointer('payload.version') // '/payload/version'
 */
export function toJsonPointer(path: string): string {
  return '/' + path.split('.').join('/');
}

/**
 * Convert JSON Pointer format to dot-separated path
 * @param pointer - JSON Pointer path, e.g., '/meta/status'
 * @returns Dot-separated path, e.g., 'meta.status'
 *
 * @example
 * fromJsonPointer('/meta/status') // 'meta.status'
 */
export function fromJsonPointer(pointer: string): string {
  return pointer.replace(/^\//, '').split('/').join('.');
}

/**
 * Create a shallow clone of an object with overrides applied at nested paths
 * @param obj - The object to clone
 * @param overrides - Object with dot-path keys and values to set
 * @returns A new object with overrides applied
 *
 * @example
 * const original = { meta: { status: 'active' }, payload: { version: 3 } };
 * const result = applyOverrides(original, { 'meta.status': 'draft', 'payload.version': 1 });
 * // result is { meta: { status: 'draft' }, payload: { version: 1 } }
 */
export function applyOverrides<T extends Record<string, unknown>>(
  obj: T,
  overrides: Record<string, unknown>
): T {
  // Deep clone to avoid mutation
  const result = JSON.parse(JSON.stringify(obj)) as T;

  for (const [path, value] of Object.entries(overrides)) {
    setNestedValue(result as Record<string, unknown>, path, value);
  }

  return result;
}
