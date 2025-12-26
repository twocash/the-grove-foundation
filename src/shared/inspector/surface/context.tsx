// src/shared/inspector/surface/context.tsx
// React context for InspectorSurface

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo
} from 'react';
import type { InspectorSurface } from './types';
import { ReactInspectorSurface } from './ReactInspectorSurface';
import type { GroveObject } from '@core/schema/grove-object';

// Context value includes version to force re-renders when surface state changes
interface ContextValue {
  surface: InspectorSurface;
  version: number;
}

const InspectorSurfaceContext = createContext<ContextValue | undefined>(undefined);

export interface InspectorSurfaceProviderProps {
  objectId: string;
  initialObject: GroveObject;
  children: React.ReactNode;
}

export function InspectorSurfaceProvider({
  objectId,
  initialObject,
  children
}: InspectorSurfaceProviderProps) {
  const [version, setVersion] = useState(0);

  const surfaceRef = useRef<ReactInspectorSurface | null>(null);

  if (!surfaceRef.current) {
    surfaceRef.current = new ReactInspectorSurface({
      objectId,
      initialObject,
      onStateChange: () => setVersion(v => v + 1)
    });
  }

  const surface = surfaceRef.current;

  useEffect(() => {
    surface.initialize();
    return () => surface.dispose();
  }, [surface]);

  // Memoize context value to only change when version changes
  const contextValue = useMemo(() => ({ surface, version }), [surface, version]);

  return (
    <InspectorSurfaceContext.Provider value={contextValue}>
      {children}
    </InspectorSurfaceContext.Provider>
  );
}

export function useInspectorSurface<T = unknown>(): InspectorSurface<T> {
  const contextValue = useContext(InspectorSurfaceContext);

  if (!contextValue) {
    throw new Error(
      'useInspectorSurface must be used within an InspectorSurfaceProvider'
    );
  }

  return contextValue.surface as InspectorSurface<T>;
}

/**
 * Optional version of useInspectorSurface that returns null outside provider.
 * Use this for components that need to work both inside and outside the provider.
 */
export function useOptionalInspectorSurface<T = unknown>(): InspectorSurface<T> | null {
  const contextValue = useContext(InspectorSurfaceContext);
  return contextValue?.surface as InspectorSurface<T> | null;
}
