// src/core/engagement/context.tsx

'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useActorRef } from '@xstate/react';
import type { Actor } from 'xstate';
import { engagementMachine, type EngagementMachine } from './machine';

// Context value type
export interface EngagementContextValue {
  actor: Actor<EngagementMachine>;
}

// Context with null default
const EngagementContext = createContext<EngagementContextValue | null>(null);

// Provider props
export interface EngagementProviderProps {
  children: ReactNode;
}

// Provider component
export function EngagementProvider({ children }: EngagementProviderProps): JSX.Element {
  const actor = useActorRef(engagementMachine);

  return (
    <EngagementContext.Provider value={{ actor }}>
      {children}
    </EngagementContext.Provider>
  );
}

// Hook for accessing context
export function useEngagement(): EngagementContextValue {
  const context = useContext(EngagementContext);

  if (!context) {
    throw new Error(
      'useEngagement must be used within an EngagementProvider. ' +
      'Wrap your component tree with <EngagementProvider>.'
    );
  }

  return context;
}

// Export context for testing
export { EngagementContext };
