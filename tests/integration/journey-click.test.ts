// tests/integration/journey-click.spec.ts
// Sprint: journey-schema-unification-v1
// Integration tests for unified journey lookup

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCanonicalJourney } from '@core/journey';
import { getJourneyById } from '../../src/data/journeys';
import { adaptLegacyJourney } from '@core/schema/journey-adapter';

describe('Journey Schema Unification', () => {
  describe('getCanonicalJourney', () => {
    it('should return journey from registry when available', () => {
      const journey = getCanonicalJourney('simulation');

      expect(journey).not.toBeNull();
      expect(journey?.id).toBe('simulation');
      expect(journey?.waypoints).toBeDefined();
      expect(journey?.waypoints.length).toBeGreaterThan(0);
    });

    it('should return journey with waypoints array', () => {
      const journey = getCanonicalJourney('stakes');

      expect(journey?.waypoints).toBeInstanceOf(Array);
      journey?.waypoints.forEach(wp => {
        expect(wp.id).toBeDefined();
        expect(wp.title).toBeDefined();
        expect(wp.prompt).toBeDefined();
      });
    });

    it('should return null for unknown journey', () => {
      const journey = getCanonicalJourney('nonexistent-journey-id');

      expect(journey).toBeNull();
    });

    it('should adapt legacy journey when not in registry', () => {
      const mockSchema = {
        journeys: {
          'legacy-test': {
            id: 'legacy-test',
            title: 'Legacy Test Journey',
            description: 'A test journey',
            entryNode: 'node-1',
            targetAha: 'You learned something!',
            estimatedMinutes: 10,
            status: 'active',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          }
        },
        nodes: {
          'node-1': {
            id: 'node-1',
            label: 'First Step',
            query: 'What is the first step?',
            journeyId: 'legacy-test',
            sequenceOrder: 0,
          },
          'node-2': {
            id: 'node-2',
            label: 'Second Step',
            query: 'What is the second step?',
            journeyId: 'legacy-test',
            sequenceOrder: 1,
          }
        }
      };

      const journey = getCanonicalJourney('legacy-test', mockSchema);

      expect(journey).not.toBeNull();
      expect(journey?.waypoints).toHaveLength(2);
      expect(journey?.waypoints[0].title).toBe('First Step');
      expect(journey?.waypoints[1].title).toBe('Second Step');
    });
  });

  describe('adaptLegacyJourney', () => {
    it('should return null when no nodes match journey', () => {
      const legacy = {
        id: 'orphan',
        title: 'Orphan Journey',
        description: 'No nodes',
        entryNode: 'missing',
        targetAha: 'Nothing',
        estimatedMinutes: 5,
        status: 'active' as const,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      const result = adaptLegacyJourney(legacy, []);

      expect(result).toBeNull();
    });

    it('should sort nodes by sequenceOrder', () => {
      const legacy = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        entryNode: 'a',
        targetAha: 'Done',
        estimatedMinutes: 5,
        status: 'active' as const,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      const nodes = [
        { id: 'c', label: 'Third', query: 'Q3', journeyId: 'test', sequenceOrder: 2 },
        { id: 'a', label: 'First', query: 'Q1', journeyId: 'test', sequenceOrder: 0 },
        { id: 'b', label: 'Second', query: 'Q2', journeyId: 'test', sequenceOrder: 1 },
      ];

      const result = adaptLegacyJourney(legacy, nodes);

      expect(result?.waypoints[0].title).toBe('First');
      expect(result?.waypoints[1].title).toBe('Second');
      expect(result?.waypoints[2].title).toBe('Third');
    });

    it('should map legacy fields to canonical format', () => {
      const legacy = {
        id: 'mapping-test',
        title: 'Mapping Test',
        description: 'Test description',
        entryNode: 'node-1',
        targetAha: 'Completion message here',
        estimatedMinutes: 15,
        status: 'active' as const,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      const nodes = [
        { id: 'node-1', label: 'Node Label', query: 'Node Query', journeyId: 'mapping-test', sequenceOrder: 0, sectionId: 'hub-id' },
      ];

      const result = adaptLegacyJourney(legacy, nodes);

      expect(result?.id).toBe('mapping-test');
      expect(result?.title).toBe('Mapping Test');
      expect(result?.description).toBe('Test description');
      expect(result?.estimatedTime).toBe('15 minutes');
      expect(result?.completionMessage).toBe('Completion message here');
      expect(result?.waypoints[0].hub).toBe('hub-id');
    });
  });

  describe('XState Compatibility', () => {
    it('should provide waypoints.length for XState machine', () => {
      // This is the critical property that XState needs
      const journey = getCanonicalJourney('simulation');

      expect(journey).not.toBeNull();

      // Simulate what XState does:
      const journeyTotal = journey!.waypoints.length;

      expect(journeyTotal).toBeGreaterThan(0);
      expect(typeof journeyTotal).toBe('number');
    });

    it('should work with all journeys in registry', () => {
      const journeyIds = ['simulation', 'stakes', 'ratchet', 'diary', 'architecture', 'emergence'];

      for (const id of journeyIds) {
        const journey = getCanonicalJourney(id);
        expect(journey).not.toBeNull();
        expect(journey?.waypoints.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Registry vs Schema Priority', () => {
    it('should prefer registry over schema when both exist', () => {
      // Create a mock schema with different data for the same ID
      const mockSchema = {
        journeys: {
          'simulation': {
            id: 'simulation',
            title: 'SCHEMA VERSION - Should NOT be used',
            description: 'This should not appear',
            entryNode: 'node-1',
            targetAha: 'Schema aha',
            estimatedMinutes: 1,
            status: 'active',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          }
        },
        nodes: {
          'node-1': {
            id: 'node-1',
            label: 'Schema Node',
            query: 'Schema query',
            journeyId: 'simulation',
            sequenceOrder: 0,
          }
        }
      };

      const journey = getCanonicalJourney('simulation', mockSchema);

      // Should get registry version, not schema version
      expect(journey?.title).toBe('The Ghost in the Machine');  // Registry title
      expect(journey?.title).not.toBe('SCHEMA VERSION - Should NOT be used');
      expect(journey?.waypoints.length).toBeGreaterThan(1);  // Registry has multiple waypoints
    });
  });
});
