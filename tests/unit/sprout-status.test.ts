// tests/unit/sprout-status.test.ts
// Unit tests for Sprout Status Panel types and utilities
// Sprint: sprout-status-panel-v1, Phase 6

import { describe, it, expect } from 'vitest';
import {
  STATUS_EMOJI,
  STATUS_LABEL,
  NOTIFIABLE_TRANSITIONS,
  NOTIFICATION_CONFIG,
  STATUS_DISPLAY_ORDER,
  groupSproutsByStatus,
  type SproutNotificationType,
} from '@explore/types/sprout-status';
import type { ResearchSprout, ResearchSproutStatus } from '@core/schema/research-sprout';

// =============================================================================
// Test Data
// =============================================================================

const createMockSprout = (
  id: string,
  status: ResearchSproutStatus,
  title: string = `Test Sprout ${id}`
): ResearchSprout => ({
  id,
  groveId: 'test-grove',
  spark: 'test spark',
  title,
  status,
  priority: 'medium',
  evidence: [],
  statusHistory: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// =============================================================================
// Tests
// =============================================================================

describe('Sprout Status Types', () => {
  describe('STATUS_EMOJI', () => {
    it('should have emoji for all statuses', () => {
      const statuses: ResearchSproutStatus[] = [
        'pending', 'active', 'paused', 'blocked', 'completed', 'archived'
      ];

      for (const status of statuses) {
        expect(STATUS_EMOJI[status]).toBeDefined();
        expect(typeof STATUS_EMOJI[status]).toBe('string');
      }
    });

    it('should use expected emojis', () => {
      expect(STATUS_EMOJI.pending).toBe('🌱');
      expect(STATUS_EMOJI.active).toBe('🌿');
      expect(STATUS_EMOJI.completed).toBe('🌻');
      expect(STATUS_EMOJI.blocked).toBe('❌');
    });
  });

  describe('STATUS_LABEL', () => {
    it('should have labels for all statuses', () => {
      const statuses: ResearchSproutStatus[] = [
        'pending', 'active', 'paused', 'blocked', 'completed', 'archived'
      ];

      for (const status of statuses) {
        expect(STATUS_LABEL[status]).toBeDefined();
        expect(typeof STATUS_LABEL[status]).toBe('string');
      }
    });

    it('should use user-friendly labels', () => {
      expect(STATUS_LABEL.pending).toBe('Planted');
      expect(STATUS_LABEL.active).toBe('Growing');
      expect(STATUS_LABEL.completed).toBe('Ready');
      expect(STATUS_LABEL.blocked).toBe('Failed');
    });
  });

  describe('NOTIFIABLE_TRANSITIONS', () => {
    it('should define ready notification for active→completed', () => {
      const readyTransition = NOTIFIABLE_TRANSITIONS.find(
        t => t.from === 'active' && t.to === 'completed'
      );
      expect(readyTransition).toBeDefined();
      expect(readyTransition?.notificationType).toBe('ready');
    });

    it('should define failed notification for active→blocked', () => {
      const failedTransition = NOTIFIABLE_TRANSITIONS.find(
        t => t.from === 'active' && t.to === 'blocked'
      );
      expect(failedTransition).toBeDefined();
      expect(failedTransition?.notificationType).toBe('failed');
    });
  });

  describe('NOTIFICATION_CONFIG', () => {
    it('should have config for all notification types', () => {
      const types: SproutNotificationType[] = ['ready', 'failed', 'spawned'];

      for (const type of types) {
        expect(NOTIFICATION_CONFIG[type]).toBeDefined();
        expect(NOTIFICATION_CONFIG[type].emoji).toBeDefined();
        expect(NOTIFICATION_CONFIG[type].title).toBeDefined();
        expect(NOTIFICATION_CONFIG[type].toastType).toBeDefined();
      }
    });

    it('should use correct toast types', () => {
      expect(NOTIFICATION_CONFIG.ready.toastType).toBe('success');
      expect(NOTIFICATION_CONFIG.failed.toastType).toBe('error');
      expect(NOTIFICATION_CONFIG.spawned.toastType).toBe('info');
    });
  });

  describe('STATUS_DISPLAY_ORDER', () => {
    it('should show completed first (actionable)', () => {
      expect(STATUS_DISPLAY_ORDER[0]).toBe('completed');
    });

    it('should show active second (in progress)', () => {
      expect(STATUS_DISPLAY_ORDER[1]).toBe('active');
    });

    it('should include all statuses', () => {
      expect(STATUS_DISPLAY_ORDER).toHaveLength(6);
    });
  });

  describe('groupSproutsByStatus', () => {
    it('should return empty array for no sprouts', () => {
      const groups = groupSproutsByStatus([]);
      expect(groups).toEqual([]);
    });

    it('should group sprouts by status', () => {
      const sprouts = [
        createMockSprout('1', 'completed'),
        createMockSprout('2', 'active'),
        createMockSprout('3', 'completed'),
        createMockSprout('4', 'pending'),
      ];

      const groups = groupSproutsByStatus(sprouts);

      expect(groups).toHaveLength(3); // completed, active, pending

      const completedGroup = groups.find(g => g.status === 'completed');
      expect(completedGroup?.count).toBe(2);
      expect(completedGroup?.sprouts).toHaveLength(2);
    });

    it('should order groups by STATUS_DISPLAY_ORDER', () => {
      const sprouts = [
        createMockSprout('1', 'pending'),
        createMockSprout('2', 'completed'),
        createMockSprout('3', 'active'),
      ];

      const groups = groupSproutsByStatus(sprouts);

      // Should be: completed, active, pending
      expect(groups[0].status).toBe('completed');
      expect(groups[1].status).toBe('active');
      expect(groups[2].status).toBe('pending');
    });

    it('should include label and emoji in groups', () => {
      const sprouts = [createMockSprout('1', 'completed')];

      const groups = groupSproutsByStatus(sprouts);

      expect(groups[0].label).toBe('Ready');
      expect(groups[0].emoji).toBe('🌻');
    });

    it('should not include empty status groups', () => {
      const sprouts = [
        createMockSprout('1', 'completed'),
        createMockSprout('2', 'completed'),
      ];

      const groups = groupSproutsByStatus(sprouts);

      // Only completed group
      expect(groups).toHaveLength(1);
      expect(groups[0].status).toBe('completed');
    });
  });
});
