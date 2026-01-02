// tests/integration/grove-data-layer.test.ts
// Integration tests for Grove Data Layer
// Sprint: grove-data-layer-v1 (Epic 5)

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalStorageAdapter } from '../../src/core/data/adapters/local-storage-adapter';
import type { GroveObject } from '../../src/core/schema/grove-object';

// =============================================================================
// Test Fixtures
// =============================================================================

interface TestPayload {
  name: string;
  description: string;
  priority: number;
  isActive: boolean;
}

function createTestObject(overrides: Partial<GroveObject<TestPayload>> = {}): GroveObject<TestPayload> {
  return {
    meta: {
      id: `test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: 'lens',
      title: 'Test Object',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides.meta,
    },
    payload: {
      name: 'Test Name',
      description: 'Test description',
      priority: 50,
      isActive: true,
      ...overrides.payload,
    },
  };
}

// =============================================================================
// LocalStorageAdapter Tests
// =============================================================================

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    adapter = new LocalStorageAdapter();
    // Clear all test data
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('CRUD Operations', () => {
    it('creates and retrieves an object', async () => {
      const obj = createTestObject({ meta: { id: 'create-test-1', type: 'lens', title: 'Create Test' } });

      const created = await adapter.create('lens', obj);

      expect(created.meta.id).toBe('create-test-1');
      expect(created.meta.createdAt).toBeDefined();
      expect(created.meta.updatedAt).toBeDefined();

      const retrieved = await adapter.get<TestPayload>('lens', 'create-test-1');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.payload.name).toBe('Test Name');
    });

    it('lists all objects of a type', async () => {
      const obj1 = createTestObject({ meta: { id: 'list-1', type: 'lens', title: 'List 1' } });
      const obj2 = createTestObject({ meta: { id: 'list-2', type: 'lens', title: 'List 2' } });

      await adapter.create('lens', obj1);
      await adapter.create('lens', obj2);

      const all = await adapter.list<TestPayload>('lens');
      expect(all.length).toBeGreaterThanOrEqual(2);
      expect(all.find(o => o.meta.id === 'list-1')).toBeDefined();
      expect(all.find(o => o.meta.id === 'list-2')).toBeDefined();
    });

    it('updates an object with patches', async () => {
      const obj = createTestObject({ meta: { id: 'update-test-1', type: 'lens', title: 'Update Test' } });
      await adapter.create('lens', obj);

      const updated = await adapter.update<TestPayload>('lens', 'update-test-1', [
        { op: 'replace', path: '/payload/name', value: 'Updated Name' },
        { op: 'replace', path: '/payload/priority', value: 100 },
      ]);

      expect(updated.payload.name).toBe('Updated Name');
      expect(updated.payload.priority).toBe(100);
      expect(updated.meta.updatedAt).not.toBe(obj.meta.updatedAt);
    });

    it('deletes an object', async () => {
      const obj = createTestObject({ meta: { id: 'delete-test-1', type: 'lens', title: 'Delete Test' } });
      await adapter.create('lens', obj);

      await adapter.delete('lens', 'delete-test-1');

      const retrieved = await adapter.get<TestPayload>('lens', 'delete-test-1');
      expect(retrieved).toBeNull();
    });

    it('throws on duplicate ID', async () => {
      const obj = createTestObject({ meta: { id: 'dup-test-1', type: 'lens', title: 'Dup Test' } });
      await adapter.create('lens', obj);

      await expect(adapter.create('lens', obj)).rejects.toThrow('already exists');
    });

    it('throws on update for non-existent object', async () => {
      await expect(
        adapter.update('lens', 'non-existent', [{ op: 'replace', path: '/payload/name', value: 'New' }])
      ).rejects.toThrow('not found');
    });

    it('throws on delete for non-existent object', async () => {
      await expect(adapter.delete('lens', 'non-existent')).rejects.toThrow('not found');
    });
  });

  describe('List Options', () => {
    beforeEach(async () => {
      // Create test data with different priorities
      await adapter.create('lens', createTestObject({
        meta: { id: 'filter-1', type: 'lens', title: 'Filter 1' },
        payload: { name: 'A', description: 'First', priority: 10, isActive: true },
      }));
      await adapter.create('lens', createTestObject({
        meta: { id: 'filter-2', type: 'lens', title: 'Filter 2' },
        payload: { name: 'B', description: 'Second', priority: 50, isActive: false },
      }));
      await adapter.create('lens', createTestObject({
        meta: { id: 'filter-3', type: 'lens', title: 'Filter 3' },
        payload: { name: 'C', description: 'Third', priority: 100, isActive: true },
      }));
    });

    it('filters by payload field', async () => {
      const active = await adapter.list<TestPayload>('lens', {
        filter: { isActive: true },
      });

      expect(active.every(o => o.payload.isActive)).toBe(true);
    });

    it('sorts by field ascending', async () => {
      const sorted = await adapter.list<TestPayload>('lens', {
        sort: { field: 'priority', direction: 'asc' },
      });

      const priorities = sorted.map(o => o.payload.priority);
      expect(priorities).toEqual([...priorities].sort((a, b) => a - b));
    });

    it('sorts by field descending', async () => {
      const sorted = await adapter.list<TestPayload>('lens', {
        filter: { isActive: true }, // Filter to our test data only
        sort: { field: 'priority', direction: 'desc' },
      });

      // Get only our test objects (those with defined priority)
      const testObjects = sorted.filter(o => o.payload.priority !== undefined);
      const priorities = testObjects.map(o => o.payload.priority);

      // Verify descending order
      for (let i = 1; i < priorities.length; i++) {
        expect(priorities[i - 1]).toBeGreaterThanOrEqual(priorities[i]);
      }
    });

    it('paginates with offset and limit', async () => {
      const page = await adapter.list<TestPayload>('lens', {
        sort: { field: 'priority', direction: 'asc' },
        offset: 1,
        limit: 1,
      });

      expect(page.length).toBe(1);
      expect(page[0].payload.priority).toBe(50);
    });
  });

  describe('Subscriptions', () => {
    it('notifies subscribers on create', async () => {
      const callback = vi.fn();
      adapter.subscribe('lens', callback);

      const obj = createTestObject({ meta: { id: 'sub-create-1', type: 'lens', title: 'Sub Create' } });
      await adapter.create('lens', obj);

      expect(callback).toHaveBeenCalled();
      const lastCall = callback.mock.calls[callback.mock.calls.length - 1][0];
      expect(lastCall.find((o: GroveObject<TestPayload>) => o.meta.id === 'sub-create-1')).toBeDefined();
    });

    it('notifies subscribers on update', async () => {
      const obj = createTestObject({ meta: { id: 'sub-update-1', type: 'lens', title: 'Sub Update' } });
      await adapter.create('lens', obj);

      const callback = vi.fn();
      adapter.subscribe('lens', callback);

      await adapter.update('lens', 'sub-update-1', [
        { op: 'replace', path: '/payload/name', value: 'Updated' },
      ]);

      expect(callback).toHaveBeenCalled();
    });

    it('notifies subscribers on delete', async () => {
      const obj = createTestObject({ meta: { id: 'sub-delete-1', type: 'lens', title: 'Sub Delete' } });
      await adapter.create('lens', obj);

      const callback = vi.fn();
      adapter.subscribe('lens', callback);

      await adapter.delete('lens', 'sub-delete-1');

      expect(callback).toHaveBeenCalled();
      const lastCall = callback.mock.calls[callback.mock.calls.length - 1][0];
      expect(lastCall.find((o: GroveObject<TestPayload>) => o.meta.id === 'sub-delete-1')).toBeUndefined();
    });

    it('unsubscribes correctly', async () => {
      const callback = vi.fn();
      const unsubscribe = adapter.subscribe('lens', callback);

      unsubscribe();

      const obj = createTestObject({ meta: { id: 'sub-unsub-1', type: 'lens', title: 'Sub Unsub' } });
      await adapter.create('lens', obj);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Clear Operations', () => {
    it('clears all data for a type', async () => {
      await adapter.create('lens', createTestObject({ meta: { id: 'clear-1', type: 'lens', title: 'Clear 1' } }));
      await adapter.create('lens', createTestObject({ meta: { id: 'clear-2', type: 'lens', title: 'Clear 2' } }));

      await adapter.clear('lens');

      const all = await adapter.list('lens');
      // Should return defaults, not the created objects
      expect(all.find(o => o.meta.id === 'clear-1')).toBeUndefined();
      expect(all.find(o => o.meta.id === 'clear-2')).toBeUndefined();
    });
  });
});

// =============================================================================
// Defaults Tests
// =============================================================================

describe('Data Layer Defaults', () => {
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    adapter = new LocalStorageAdapter();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns lens defaults when storage is empty', async () => {
    const lenses = await adapter.list('lens');

    // Should have default personas
    expect(lenses.length).toBeGreaterThan(0);
    expect(lenses[0].meta.type).toBe('lens');
  });

  it('returns empty array for types without defaults', async () => {
    const hubs = await adapter.list('hub');
    expect(hubs).toEqual([]);

    const documents = await adapter.list('document');
    expect(documents).toEqual([]);
  });
});

// =============================================================================
// Type Safety Tests
// =============================================================================

describe('Type Safety', () => {
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    adapter = new LocalStorageAdapter();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('isolates data by object type', async () => {
    const lensObj = createTestObject({
      meta: { id: 'type-lens-1', type: 'lens', title: 'Lens' },
    });
    const journeyObj = createTestObject({
      meta: { id: 'type-journey-1', type: 'journey', title: 'Journey' },
    });

    await adapter.create('lens', lensObj);
    await adapter.create('journey', journeyObj);

    const lenses = await adapter.list('lens');
    const journeys = await adapter.list('journey');

    expect(lenses.find(o => o.meta.id === 'type-lens-1')).toBeDefined();
    expect(lenses.find(o => o.meta.id === 'type-journey-1')).toBeUndefined();

    expect(journeys.find(o => o.meta.id === 'type-journey-1')).toBeDefined();
    expect(journeys.find(o => o.meta.id === 'type-lens-1')).toBeUndefined();
  });
});
