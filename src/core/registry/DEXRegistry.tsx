// src/core/registry/DEXRegistry.tsx
// Centralized object store for DEX objects

import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from 'react';
import type { DEXObject, DEXObjectType, DEXJourney, DEXNode, DEXHub, DEXLens, DEXCard } from '../schema/dex';

// State shape
interface DEXRegistryState {
  objects: {
    journey: Record<string, DEXJourney>;
    node: Record<string, DEXNode>;
    hub: Record<string, DEXHub>;
    lens: Record<string, DEXLens>;
    card: Record<string, DEXCard>;
    sprout: Record<string, DEXObject>;
  };
  loading: boolean;
  saving: boolean;
  status: string | null;
}

const initialState: DEXRegistryState = {
  objects: {
    journey: {},
    node: {},
    hub: {},
    lens: {},
    card: {},
    sprout: {},
  },
  loading: false,
  saving: false,
  status: null,
};

// Actions
type DEXRegistryAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SAVING'; saving: boolean }
  | { type: 'SET_STATUS'; status: string | null }
  | { type: 'HYDRATE'; objects: DEXRegistryState['objects'] }
  | { type: 'UPDATE_OBJECT'; objectType: DEXObjectType; id: string; updates: Partial<DEXObject> }
  | { type: 'DELETE_OBJECT'; objectType: DEXObjectType; id: string }
  | { type: 'CREATE_OBJECT'; objectType: DEXObjectType; object: DEXObject };

function reducer(state: DEXRegistryState, action: DEXRegistryAction): DEXRegistryState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_SAVING':
      return { ...state, saving: action.saving };
    case 'SET_STATUS':
      return { ...state, status: action.status };
    case 'HYDRATE':
      return { ...state, objects: action.objects, loading: false };
    case 'UPDATE_OBJECT': {
      const typeStore = state.objects[action.objectType];
      const existing = typeStore[action.id];
      if (!existing) return state;
      return {
        ...state,
        objects: {
          ...state.objects,
          [action.objectType]: {
            ...typeStore,
            [action.id]: { ...existing, ...action.updates, updatedAt: new Date().toISOString() },
          },
        },
      };
    }
    case 'DELETE_OBJECT': {
      const typeStore = { ...state.objects[action.objectType] };
      delete typeStore[action.id];
      return {
        ...state,
        objects: { ...state.objects, [action.objectType]: typeStore },
      };
    }
    case 'CREATE_OBJECT': {
      return {
        ...state,
        objects: {
          ...state.objects,
          [action.objectType]: {
            ...state.objects[action.objectType],
            [action.object.id]: action.object,
          },
        },
      };
    }
    default:
      return state;
  }
}

// Context
interface DEXRegistryContextValue {
  state: DEXRegistryState;

  // Read
  get: <T extends DEXObject>(type: DEXObjectType, id: string) => T | null;
  getAll: <T extends DEXObject>(type: DEXObjectType) => T[];
  filter: <T extends DEXObject>(type: DEXObjectType, predicate: (item: T) => boolean) => T[];

  // Write
  update: <T extends DEXObject>(type: DEXObjectType, id: string, updates: Partial<T>) => void;
  remove: (type: DEXObjectType, id: string) => void;
  create: <T extends DEXObject>(type: DEXObjectType, partial: Omit<T, 'id' | 'version' | 'createdAt' | 'updatedAt'>) => string;

  // Lifecycle
  hydrate: (objects: DEXRegistryState['objects']) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setStatus: (status: string | null) => void;
}

const DEXRegistryContext = createContext<DEXRegistryContextValue | null>(null);

export function DEXRegistryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const get = useCallback(<T extends DEXObject>(type: DEXObjectType, id: string): T | null => {
    return (state.objects[type][id] as T) ?? null;
  }, [state.objects]);

  const getAll = useCallback(<T extends DEXObject>(type: DEXObjectType): T[] => {
    return Object.values(state.objects[type]) as T[];
  }, [state.objects]);

  const filter = useCallback(<T extends DEXObject>(
    type: DEXObjectType,
    predicate: (item: T) => boolean
  ): T[] => {
    return (Object.values(state.objects[type]) as T[]).filter(predicate);
  }, [state.objects]);

  const update = useCallback(<T extends DEXObject>(
    type: DEXObjectType,
    id: string,
    updates: Partial<T>
  ) => {
    dispatch({ type: 'UPDATE_OBJECT', objectType: type, id, updates });
  }, []);

  const remove = useCallback((type: DEXObjectType, id: string) => {
    dispatch({ type: 'DELETE_OBJECT', objectType: type, id });
  }, []);

  const create = useCallback(<T extends DEXObject>(
    type: DEXObjectType,
    partial: Omit<T, 'id' | 'version' | 'createdAt' | 'updatedAt'>
  ): string => {
    const now = new Date().toISOString();
    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const object = {
      ...partial,
      id,
      type,
      version: 1,
      createdAt: now,
      updatedAt: now,
    } as DEXObject;
    dispatch({ type: 'CREATE_OBJECT', objectType: type, object });
    return id;
  }, []);

  const hydrate = useCallback((objects: DEXRegistryState['objects']) => {
    dispatch({ type: 'HYDRATE', objects });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', loading });
  }, []);

  const setSaving = useCallback((saving: boolean) => {
    dispatch({ type: 'SET_SAVING', saving });
  }, []);

  const setStatus = useCallback((status: string | null) => {
    dispatch({ type: 'SET_STATUS', status });
  }, []);

  const value = useMemo(() => ({
    state,
    get,
    getAll,
    filter,
    update,
    remove,
    create,
    hydrate,
    setLoading,
    setSaving,
    setStatus,
  }), [state, get, getAll, filter, update, remove, create, hydrate, setLoading, setSaving, setStatus]);

  return (
    <DEXRegistryContext.Provider value={value}>
      {children}
    </DEXRegistryContext.Provider>
  );
}

export function useDEXRegistry(): DEXRegistryContextValue {
  const ctx = useContext(DEXRegistryContext);
  if (!ctx) {
    throw new Error('useDEXRegistry must be used within DEXRegistryProvider');
  }
  return ctx;
}
