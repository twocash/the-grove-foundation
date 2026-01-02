// src/core/data/grove-data-context.tsx
// React context for GroveDataProvider

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import type { GroveDataProvider } from './grove-data-provider';
import { LocalStorageAdapter } from './adapters/local-storage-adapter';

/**
 * Context for the GroveDataProvider.
 */
const GroveDataContext = createContext<GroveDataProvider | null>(null);

/**
 * Props for GroveDataProviderComponent.
 */
export interface GroveDataProviderProps {
  /** The data provider instance to use */
  provider?: GroveDataProvider;
  /** Children components */
  children: ReactNode;
}

/**
 * Default provider (localStorage) for development/testing.
 */
let defaultProvider: GroveDataProvider | null = null;

function getDefaultProvider(): GroveDataProvider {
  if (!defaultProvider) {
    defaultProvider = new LocalStorageAdapter();
  }
  return defaultProvider;
}

/**
 * Provider component for GroveData context.
 *
 * Wraps your app to provide data access via useGroveData hook.
 *
 * @example
 * ```tsx
 * // Basic usage (localStorage)
 * <GroveDataProviderComponent>
 *   <App />
 * </GroveDataProviderComponent>
 *
 * // With Supabase
 * const supabaseAdapter = new SupabaseAdapter({ client: supabaseClient });
 * <GroveDataProviderComponent provider={supabaseAdapter}>
 *   <App />
 * </GroveDataProviderComponent>
 *
 * // With Hybrid (recommended for production)
 * const hybridAdapter = new HybridAdapter({ client: supabaseClient });
 * <GroveDataProviderComponent provider={hybridAdapter}>
 *   <App />
 * </GroveDataProviderComponent>
 * ```
 */
export function GroveDataProviderComponent({
  provider,
  children,
}: GroveDataProviderProps): React.ReactElement {
  // Memoize to prevent re-renders when provider reference changes
  const value = useMemo(() => provider ?? getDefaultProvider(), [provider]);

  return (
    <GroveDataContext.Provider value={value}>{children}</GroveDataContext.Provider>
  );
}

/**
 * Hook to access the GroveDataProvider.
 *
 * @throws Error if used outside of GroveDataProviderComponent
 */
export function useDataProvider(): GroveDataProvider {
  const context = useContext(GroveDataContext);
  if (!context) {
    throw new Error('useDataProvider must be used within a GroveDataProviderComponent');
  }
  return context;
}

/**
 * Hook to check if we're inside a GroveDataProvider.
 */
export function useHasDataProvider(): boolean {
  const context = useContext(GroveDataContext);
  return context !== null;
}
