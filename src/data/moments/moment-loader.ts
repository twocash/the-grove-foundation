// src/data/moments/moment-loader.ts
// Moment JSON File Loader
// Sprint: engagement-orchestrator-v1
// Cache bust: 2025-12-29-003

import type { Moment } from '@core/schema/moment';
import { isMoment } from '@core/schema/moment';

// Type for Vite's glob import result
type GlobModule = { default: unknown };
type GlobImportResult = Record<string, GlobModule>;

// Vite glob import for all moment JSON files
// Using any cast because Vite's import.meta.glob is a compile-time feature
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const momentFiles: GlobImportResult = (import.meta as any).glob(
  './**/*.moment.json',
  { eager: true }
) as GlobImportResult;

/**
 * Load all active moments from JSON files
 * Only returns moments with status: 'active'
 */
export function loadMoments(): Moment[] {
  const moments: Moment[] = [];
  const errors: string[] = [];

  for (const [path, module] of Object.entries(momentFiles)) {
    try {
      const data = module.default;
      if (isMoment(data)) {
        if (data.meta.status === 'active') {
          moments.push(data);
        }
      } else {
        errors.push(`${path}: Invalid moment structure`);
      }
    } catch (e) {
      errors.push(`${path}: ${e}`);
    }
  }

  if (errors.length > 0) {
    console.warn('[MomentLoader] Validation errors:', errors);
  }

  console.log(`[MomentLoader] Loaded ${moments.length} active moments`);
  return moments;
}

/**
 * Load all moments regardless of status (for admin/debugging)
 */
export function loadAllMoments(): Moment[] {
  const moments: Moment[] = [];

  for (const [, module] of Object.entries(momentFiles)) {
    try {
      const data = module.default;
      if (isMoment(data)) {
        moments.push(data);
      }
    } catch {
      // Skip invalid
    }
  }

  return moments;
}

/**
 * Get a specific moment by ID
 */
export function getMomentById(id: string): Moment | undefined {
  const all = loadAllMoments();
  return all.find(m => m.meta.id === id);
}
