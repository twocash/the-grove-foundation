// src/core/schema/sprout-queue.ts
// Sprout moderation queue type definitions

/**
 * Sprout moderation status
 */
export type SproutQueueStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

/**
 * Capture context for a queued sprout
 */
export interface SproutCaptureContext {
  userId: string;
  timestamp: string;
  lensId: string;
  lensVersion: string;
  journeyId?: string;
  journeyStep?: number;
  nodeId?: string;
  sessionId: string;
}

/**
 * Moderation decision record
 */
export interface SproutModeration {
  reviewedBy: string;
  reviewedAt: string;
  decision: 'approved' | 'rejected' | 'flagged';
  notes?: string;
  qualityScore?: number;
}

/**
 * Target location for approved sprouts
 */
export interface SproutTargetCommons {
  category: string;
  tags: string[];
}

/**
 * Queued sprout for moderation
 */
export interface QueuedSprout {
  id: string;
  content: string;
  status: SproutQueueStatus;

  // Capture context
  captureContext: SproutCaptureContext;

  // Moderation (populated after review)
  moderation?: SproutModeration;

  // Target location (for approved sprouts)
  targetCommons?: SproutTargetCommons;
}

/**
 * Sprout queue counts
 */
export interface SproutQueueCounts {
  pending: number;
  approved: number;
  rejected: number;
  flagged: number;
  total: number;
}

/**
 * Sprout queue filter options
 */
export type SproutQueueFilter = 'pending' | 'approved' | 'rejected' | 'flagged' | 'all';
