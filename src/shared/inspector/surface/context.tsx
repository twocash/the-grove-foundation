// src/shared/inspector/surface/context.tsx
// React context for InspectorSurface

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef
} from 'react';
import type { InspectorSurface } from './types';
import { ReactInspectorSurface } from './ReactInspectorSurface';
import type { GroveObject } from '@core/schema/grove-object';

const InspectorSurfaceContext = createContext<InspectorSurface | undefined>(undefined);

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
  const [, forceUpdate] = useState({});

  const surfaceRef = useRef<ReactInspectorSurface | null>(null);

  if (!surfaceRef.current) {
    surfaceRef.current = new ReactInspectorSurface({
      objectId,
      initialObject,
      onStateChange: () => forceUpdate({})
    });
  }

  const surface = surfaceRef.current;

  useEffect(() => {
    surface.initialize();
    return () => surface.dispose();
  }, [surface]);

  return (
    <InspectorSurfaceContext.Provider value={surface}>
      {children}
    </InspectorSurfaceContext.Provider>
  );
}

export function useInspectorSurface<T = unknown>(): InspectorSurface<T> {
  const surface = useContext(InspectorSurfaceContext);

  if (!surface) {
    throw new Error(
      'useInspectorSurface must be used within an InspectorSurfaceProvider'
    );
  }

  return surface as InspectorSurface<T>;
}

/**
 * Optional version of useInspectorSurface that returns null outside provider.
 * Use this for components that need to work both inside and outside the provider.
 */
export function useOptionalInspectorSurface<T = unknown>(): InspectorSurface<T> | null {
  const surface = useContext(InspectorSurfaceContext);
  return surface as InspectorSurface<T> | null;
}
