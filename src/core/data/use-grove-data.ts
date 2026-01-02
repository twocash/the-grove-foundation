// src/core/data/use-grove-data.ts
// React hook for CRUD operations on Grove objects

import { useState, useEffect, useCallback, useRef } from 'react';
import type { GroveObject } from '../schema/grove-object';
import type { GroveObjectType, CreateOptions, PatchOperation } from './grove-data-provider';
import { useDataProvider } from './grove-data-context';

/**
 * Result of useGroveData hook.
 */
export interface UseGroveDataResult<T> {
  /** All objects of this type */
  objects: GroveObject<T>[];
  /** Loading state (true during initial load) */
  loading: boolean;
  /** Error message if load failed */
  error: string | null;
  /** Create a new object */
  create: (object: GroveObject<T>, options?: CreateOptions) => Promise<GroveObject<T>>;
  /** Update an object using JSON patches */
  update: (id: string, patches: PatchOperation[]) => Promise<void>;
  /** Delete an object */
  remove: (id: string) => Promise<void>;
  /** Get an object by ID (from current state) */
  getById: (id: string) => GroveObject<T> | undefined;
  /** Force refetch from provider */
  refetch: () => Promise<void>;
}

/**
 * React hook for CRUD operations on Grove objects.
 *
 * @example
 * ```tsx
 * function LensEditor() {
 *   const { objects: lenses, loading, create, update, remove } = useGroveData<LensPayload>('lens');
 *
 *   if (loading) return <Spinner />;
 *
 *   return (
 *     <div>
 *       {lenses.map(lens => (
 *         <LensCard key={lens.meta.id} lens={lens} onUpdate={update} onDelete={remove} />
 *       ))}
 *       <button onClick={() => create(newLens)}>Add Lens</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useGroveData<T>(type: GroveObjectType): UseGroveDataResult<T> {
  const provider = useDataProvider();
  const [objects, setObjects] = useState<GroveObject<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track if component is mounted to avoid state updates after unmount
  const mountedRef = useRef(true);

  const loadData = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);
      const data = await provider.list<T>(type);
      if (mountedRef.current) {
        setObjects(data);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [provider, type]);

  useEffect(() => {
    mountedRef.current = true;

    loadData();

    // Subscribe to changes if provider supports it
    const unsubscribe = provider.subscribe?.<T>(type, (newObjects) => {
      if (mountedRef.current) {
        setObjects(newObjects);
      }
    });

    return () => {
      mountedRef.current = false;
      unsubscribe?.();
    };
  }, [loadData, provider, type]);

  const create = useCallback(
    async (object: GroveObject<T>, options?: CreateOptions) => {
      const created = await provider.create<T>(type, object, options);
      // Optimistically update local state
      setObjects((prev) => [...prev, created]);
      return created;
    },
    [provider, type]
  );

  const update = useCallback(
    async (id: string, patches: PatchOperation[]) => {
      const updated = await provider.update<T>(type, id, patches);
      // Optimistically update local state
      setObjects((prev) => prev.map((obj) => (obj.meta.id === id ? updated : obj)));
    },
    [provider, type]
  );

  const remove = useCallback(
    async (id: string) => {
      await provider.delete(type, id);
      // Optimistically update local state
      setObjects((prev) => prev.filter((obj) => obj.meta.id !== id));
    },
    [provider, type]
  );

  const getById = useCallback(
    (id: string) => {
      return objects.find((obj) => obj.meta.id === id);
    },
    [objects]
  );

  return {
    objects,
    loading,
    error,
    create,
    update,
    remove,
    getById,
    refetch: loadData,
  };
}

/**
 * Hook for single object access.
 *
 * @example
 * ```tsx
 * function LensDetail({ lensId }: { lensId: string }) {
 *   const { object: lens, loading, update } = useGroveObject<LensPayload>('lens', lensId);
 *
 *   if (loading) return <Spinner />;
 *   if (!lens) return <NotFound />;
 *
 *   return <LensEditor lens={lens} onSave={update} />;
 * }
 * ```
 */
export function useGroveObject<T>(
  type: GroveObjectType,
  id: string
): {
  object: GroveObject<T> | null;
  loading: boolean;
  error: string | null;
  update: (patches: PatchOperation[]) => Promise<void>;
  refetch: () => Promise<void>;
} {
  const provider = useDataProvider();
  const [object, setObject] = useState<GroveObject<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  const loadData = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);
      const data = await provider.get<T>(type, id);
      if (mountedRef.current) {
        setObject(data);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [provider, type, id]);

  useEffect(() => {
    mountedRef.current = true;
    loadData();
    return () => {
      mountedRef.current = false;
    };
  }, [loadData]);

  const update = useCallback(
    async (patches: PatchOperation[]) => {
      const updated = await provider.update<T>(type, id, patches);
      setObject(updated);
    },
    [provider, type, id]
  );

  return {
    object,
    loading,
    error,
    update,
    refetch: loadData,
  };
}
