// src/hooks/useFederation.ts
// Federation React hook
// Sprint: EPIC5-SL-Federation v1

import { useState, useEffect, useCallback } from 'react';
import {
  getFederationRegistry,
  resetFederationRegistry,
} from '@core/federation/registry';
import {
  getFederationProtocol,
  resetFederationProtocol,
} from '@core/federation/protocol';
import {
  getProvenanceBridge,
  resetProvenanceBridge,
} from '@core/federation/provenance';
import type {
  SprintRegistration,
  DiscoveryCriteria,
  FederatedGroveObject,
  FederationEvent,
  PaginatedResult,
} from '@core/federation/schema';

export interface UseFederationReturn {
  // Registry
  registerSprint: (registration: Omit<SprintRegistration, 'registeredAt' | 'lastSeen' | 'status' | 'health'>) => Promise<SprintRegistration>;
  unregisterSprint: (sprintId: string) => Promise<void>;
  discoverSprints: (criteria: DiscoveryCriteria) => Promise<PaginatedResult<SprintRegistration>>;
  listSprints: (limit?: number, offset?: number) => Promise<PaginatedResult<SprintRegistration>>;
  getSprint: (sprintId: string) => Promise<SprintRegistration | null>;
  updateCapabilities: (sprintId: string, capabilities: SprintRegistration['capabilities']) => Promise<SprintRegistration>;
  heartbeat: (sprintId: string) => Promise<SprintRegistration>;
  getHealth: () => Promise<import('@core/federation/schema').RegistryHealth>;

  // Provenance
  attachMetadata: <T>(object: FederatedGroveObject<T>, federationId: string, options?: any) => FederatedGroveObject<T>;
  traceProvenance: (objectId: string, options?: any) => Promise<import('@core/federation/schema').ProvenanceChain>;

  // State
  sprints: SprintRegistration[];
  loading: boolean;
  error: string | null;
  health: import('@core/federation/schema').RegistryHealth | null;

  // Refetch
  refetch: () => Promise<void>;
}

export function useFederation(): UseFederationReturn {
  const [sprints, setSprints] = useState<SprintRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<import('@core/federation/schema').RegistryHealth | null>(null);

  const registry = getFederationRegistry();
  const protocol = getFederationProtocol();
  const provenance = getProvenanceBridge();

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [sprintsList, healthData] = await Promise.all([
        registry.listSprints(100, 0),
        registry.getHealth(),
      ]);

      setSprints(sprintsList.items);
      setHealth(healthData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch federation data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();

    // Set up event listeners
    const handleEvent = (event: FederationEvent) => {
      refetch();
    };

    registry.on('sprint.registered', handleEvent);
    registry.on('sprint.unregistered', handleEvent);
    registry.on('sprint.heartbeat', handleEvent);
    registry.on('health.changed', handleEvent);

    return () => {
      registry.off('sprint.registered', handleEvent);
      registry.off('sprint.unregistered', handleEvent);
      registry.off('sprint.heartbeat', handleEvent);
      registry.off('health.changed', handleEvent);
    };
  }, [refetch]);

  return {
    // Registry methods
    registerSprint: async (registration) => {
      const result = await registry.registerSprint(registration);
      await refetch();
      return result;
    },

    unregisterSprint: async (sprintId: string) => {
      await registry.unregisterSprint(sprintId);
      await refetch();
    },

    discoverSprints: async (criteria: DiscoveryCriteria) => {
      return registry.discoverSprints(criteria);
    },

    listSprints: async (limit = 50, offset = 0) => {
      return registry.listSprints(limit, offset);
    },

    getSprint: async (sprintId: string) => {
      return registry.getSprint(sprintId);
    },

    updateCapabilities: async (sprintId: string, capabilities) => {
      const result = await registry.updateCapabilities(sprintId, capabilities);
      await refetch();
      return result;
    },

    heartbeat: async (sprintId: string) => {
      const result = await registry.heartbeat(sprintId);
      await refetch();
      return result;
    },

    getHealth: async () => {
      return registry.getHealth();
    },

    // Provenance methods
    attachMetadata: <T>(object: FederatedGroveObject<T>, federationId: string, options?: any) => {
      return provenance.attachMetadata(object, federationId, options);
    },

    traceProvenance: async (objectId: string, options?: any) => {
      return provenance.traceProvenance(objectId, options);
    },

    // State
    sprints,
    loading,
    error,
    health,

    // Refetch
    refetch,
  };
}
