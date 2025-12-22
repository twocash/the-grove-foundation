// src/lib/versioned-artifact.ts
// Versioned artifact pattern for Grove content
// Sprint 4: Initial stubs for future implementation

/**
 * Base interface for all versioned artifacts in Grove.
 * Artifacts track their creation, modifications, and lifecycle status.
 */
export interface VersionedArtifact {
  /** Unique identifier */
  id: string;

  /** Version number (starts at 1) */
  version: number;

  /** ISO timestamp of creation */
  createdAt: string;

  /** ISO timestamp of last update */
  updatedAt: string;

  /** Current lifecycle status */
  status: ArtifactStatus;

  /** Version history for auditing */
  versionHistory?: VersionHistoryEntry[];
}

/**
 * Lifecycle status for artifacts
 */
export type ArtifactStatus =
  | 'draft'      // Initial creation, not visible
  | 'active'     // Published and visible
  | 'deprecated' // Still visible but marked as outdated
  | 'archived';  // Hidden from normal views

/**
 * Entry in version history
 */
export interface VersionHistoryEntry {
  version: number;
  timestamp: string;
  action: VersionAction;
  previousStatus?: ArtifactStatus;
  newStatus?: ArtifactStatus;
  changedFields?: string[];
  changedBy?: string;
}

export type VersionAction =
  | 'create'
  | 'update'
  | 'publish'
  | 'deprecate'
  | 'archive'
  | 'restore';

/**
 * Create a new versioned artifact with initial metadata
 */
export function createArtifact<T extends Omit<VersionedArtifact, 'version' | 'createdAt' | 'updatedAt' | 'status'>>(
  data: T,
  initialStatus: ArtifactStatus = 'draft'
): T & VersionedArtifact {
  const now = new Date().toISOString();
  return {
    ...data,
    version: 1,
    createdAt: now,
    updatedAt: now,
    status: initialStatus,
    versionHistory: [
      {
        version: 1,
        timestamp: now,
        action: 'create',
        newStatus: initialStatus,
      },
    ],
  };
}

/**
 * Update an artifact, incrementing version and recording change
 */
export function updateArtifact<T extends VersionedArtifact>(
  artifact: T,
  updates: Partial<Omit<T, keyof VersionedArtifact>>,
  changedBy?: string
): T {
  const now = new Date().toISOString();
  const newVersion = artifact.version + 1;
  const changedFields = Object.keys(updates);

  const historyEntry: VersionHistoryEntry = {
    version: newVersion,
    timestamp: now,
    action: 'update',
    changedFields,
    changedBy,
  };

  return {
    ...artifact,
    ...updates,
    version: newVersion,
    updatedAt: now,
    versionHistory: [...(artifact.versionHistory || []), historyEntry],
  };
}

/**
 * Change artifact status
 */
export function changeArtifactStatus<T extends VersionedArtifact>(
  artifact: T,
  newStatus: ArtifactStatus,
  changedBy?: string
): T {
  const now = new Date().toISOString();
  const previousStatus = artifact.status;

  // Determine action based on status transition
  let action: VersionAction = 'update';
  if (newStatus === 'active' && previousStatus === 'draft') action = 'publish';
  else if (newStatus === 'deprecated') action = 'deprecate';
  else if (newStatus === 'archived') action = 'archive';
  else if (previousStatus === 'archived') action = 'restore';

  const historyEntry: VersionHistoryEntry = {
    version: artifact.version,
    timestamp: now,
    action,
    previousStatus,
    newStatus,
    changedBy,
  };

  return {
    ...artifact,
    status: newStatus,
    updatedAt: now,
    versionHistory: [...(artifact.versionHistory || []), historyEntry],
  };
}

/**
 * Check if artifact is visible to users
 */
export function isArtifactVisible(artifact: VersionedArtifact): boolean {
  return artifact.status === 'active' || artifact.status === 'deprecated';
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: ArtifactStatus): string {
  switch (status) {
    case 'draft': return 'Draft';
    case 'active': return 'Published';
    case 'deprecated': return 'Deprecated';
    case 'archived': return 'Archived';
    default: return 'Unknown';
  }
}

/**
 * Get status badge color classes
 */
export function getStatusColor(status: ArtifactStatus): string {
  switch (status) {
    case 'draft':
      return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
    case 'active':
      return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300';
    case 'deprecated':
      return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300';
    case 'archived':
      return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}
