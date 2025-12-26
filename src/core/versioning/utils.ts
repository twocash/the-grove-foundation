// src/core/versioning/utils.ts
// Utility functions for versioning

import type { JsonPatch } from '../copilot/schema';

/**
 * Generate UUID v4.
 * Uses crypto.randomUUID() where available, fallback for older browsers.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Format ISO timestamp as relative time.
 * e.g., "just now", "2 min ago", "1 hour ago", "yesterday"
 */
export function formatRelativeTime(isoDate: string | null): string {
  if (!isoDate) return 'never';

  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 30) return 'just now';
  if (diffSec < 60) return `${diffSec} sec ago`;
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;

  return date.toLocaleDateString();
}

/**
 * Generate human-readable change message from patch operations.
 * e.g., "Updated title and description"
 */
export function generateChangeMessage(patch: JsonPatch): string {
  if (!patch || patch.length === 0) {
    return 'No changes';
  }

  // Extract field names from paths
  const fields = patch.map((op) => {
    const path = op.path;
    // Extract meaningful segment of path, e.g., "/meta/title" -> "title"
    // Handle array append notation: "/meta/tags/-" -> "tags"
    const segments = path.split('/').filter(Boolean);
    // Skip array index markers like "-" or numeric indices
    for (let i = segments.length - 1; i >= 0; i--) {
      const segment = segments[i];
      if (segment !== '-' && !/^\d+$/.test(segment)) {
        return segment;
      }
    }
    return segments[segments.length - 1];
  });

  // Deduplicate
  const uniqueFields = [...new Set(fields)];

  if (uniqueFields.length === 0) {
    return 'Modified content';
  }

  if (uniqueFields.length === 1) {
    return `Updated ${uniqueFields[0]}`;
  }

  if (uniqueFields.length === 2) {
    return `Updated ${uniqueFields[0]} and ${uniqueFields[1]}`;
  }

  return `Updated ${uniqueFields.slice(0, -1).join(', ')}, and ${uniqueFields[uniqueFields.length - 1]}`;
}
