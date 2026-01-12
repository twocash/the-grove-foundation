// src/explore/types/sprout-status.ts
// Types for Sprout Status Panel feature
// Sprint: sprout-status-panel-v1, Phase 1

import type { ResearchSprout, ResearchSproutStatus } from '@core/schema/research-sprout';

// =============================================================================
// UI State Types (Phase 1a)
// =============================================================================

/**
 * State for the Garden Tray UI
 */
export interface GardenTrayState {
  /** Whether the tray is expanded (hovered) */
  isExpanded: boolean;

  /** Currently selected sprout ID for expansion */
  selectedSproutId: string | null;

  /** Search term for filtering */
  searchTerm: string;

  /** Status filter */
  statusFilter: ResearchSproutStatus | 'all';
}

/**
 * State for an expanded sprout card
 */
export interface ExpandedSproutState {
  /** The sprout being viewed */
  sprout: ResearchSprout;

  /** Which section is active (summary, evidence, etc.) */
  activeSection: 'summary' | 'evidence' | 'provenance';

  /** Whether details are loading */
  isLoading: boolean;
}

// =============================================================================
// Notification Types (Phase 1b)
// =============================================================================

/**
 * Types of notifications the status panel can emit
 */
export type SproutNotificationType =
  | 'ready'      // Research completed successfully
  | 'failed'     // Research failed/blocked
  | 'spawned';   // Child sprout created

/**
 * Notification payload for sprout status changes
 */
export interface SproutNotification {
  /** Notification type */
  type: SproutNotificationType;

  /** The sprout that triggered the notification */
  sprout: ResearchSprout;

  /** ISO timestamp when notification was created */
  createdAt: string;

  /** Whether notification has been seen/dismissed */
  dismissed: boolean;
}

/**
 * Pulse animation state for the badge
 */
export interface PulseState {
  /** Whether the badge should pulse */
  isPulsing: boolean;

  /** Count of new ready sprouts causing the pulse */
  newReadyCount: number;

  /** IDs of sprouts that triggered the pulse */
  pulseSourceIds: string[];
}

// =============================================================================
// Status Transition Detection
// =============================================================================

/**
 * Represents a detected status transition
 * Used for triggering notifications
 */
export interface StatusTransitionEvent {
  /** Sprout that transitioned */
  sproutId: string;

  /** Previous status */
  from: ResearchSproutStatus;

  /** New status */
  to: ResearchSproutStatus;

  /** When transition was detected */
  detectedAt: string;
}

/**
 * Transitions that should trigger notifications
 */
export const NOTIFIABLE_TRANSITIONS: Array<{
  from: ResearchSproutStatus;
  to: ResearchSproutStatus;
  notificationType: SproutNotificationType;
}> = [
  { from: 'active', to: 'completed', notificationType: 'ready' },
  { from: 'pending', to: 'completed', notificationType: 'ready' },
  { from: 'active', to: 'blocked', notificationType: 'failed' },
];

// =============================================================================
// Display Helpers
// =============================================================================

/**
 * Status → Emoji mapping
 */
export const STATUS_EMOJI: Record<ResearchSproutStatus, string> = {
  pending: '🌱',
  active: '🌿',
  paused: '⏸️',
  blocked: '❌',
  completed: '🌻',
  archived: '📦',
};

/**
 * Status → Display label mapping
 */
export const STATUS_LABEL: Record<ResearchSproutStatus, string> = {
  pending: 'Planted',
  active: 'Growing',
  paused: 'Paused',
  blocked: 'Failed',
  completed: 'Ready',
  archived: 'Archived',
};

/**
 * Notification type → Toast config mapping
 */
export const NOTIFICATION_CONFIG: Record<SproutNotificationType, {
  emoji: string;
  title: string;
  toastType: 'success' | 'error' | 'info';
}> = {
  ready: {
    emoji: '🌻',
    title: 'Research Complete',
    toastType: 'success',
  },
  failed: {
    emoji: '❌',
    title: 'Research Failed',
    toastType: 'error',
  },
  spawned: {
    emoji: '🌱',
    title: 'New Research Spawned',
    toastType: 'info',
  },
};

// =============================================================================
// Grouping Utilities
// =============================================================================

/**
 * Group sprouts by status for display
 */
export interface SproutGroup {
  status: ResearchSproutStatus;
  label: string;
  emoji: string;
  sprouts: ResearchSprout[];
  count: number;
}

/**
 * Order in which status groups should be displayed
 * (Ready first, then active work, then archived/failed)
 */
export const STATUS_DISPLAY_ORDER: ResearchSproutStatus[] = [
  'completed',  // Show ready sprouts first (actionable)
  'active',     // Then work in progress
  'pending',    // Then queued
  'blocked',    // Then failed (needs attention)
  'paused',     // Then paused
  'archived',   // Last
];

/**
 * Group sprouts by status in display order
 */
export function groupSproutsByStatus(sprouts: ResearchSprout[]): SproutGroup[] {
  const groups: SproutGroup[] = [];

  for (const status of STATUS_DISPLAY_ORDER) {
    const matching = sprouts.filter(s => s.status === status);
    if (matching.length > 0) {
      groups.push({
        status,
        label: STATUS_LABEL[status],
        emoji: STATUS_EMOJI[status],
        sprouts: matching,
        count: matching.length,
      });
    }
  }

  return groups;
}
