// src/bedrock/consoles/FederationConsole/hook-registry.ts
// Hook Registry for Federation Console
// Maps string names to data hooks for runtime composition
// Sprint: S9-SL-Federation v1
//
// DEX: Declarative Sovereignty - data sources defined in config, resolved at runtime

import type { CollectionDataResult } from '../../patterns/console-factory.types';
import { useFederatedGrovesData } from './useFederatedGrovesData';
import { useTierMappingsData } from './useTierMappingsData';
import { useFederationExchangesData } from './useFederationExchangesData';
import { useTrustRelationshipsData } from './useTrustRelationshipsData';

// =============================================================================
// Hook Registry
// =============================================================================

/**
 * Data hook registry
 * Maps hook names (from FEDERATION_TYPE_REGISTRY.dataHookName) to actual hooks
 *
 * When adding a new type:
 * 1. Create useYourTypeData.ts hook
 * 2. Import it here
 * 3. Add entry: useYourTypeData
 *
 * IMPORTANT: React hooks cannot be called conditionally/dynamically.
 * This registry is used for validation and introspection.
 * Actual hook calls must be explicit in useFederationData.
 */
export const FEDERATION_HOOK_REGISTRY: Record<string, () => CollectionDataResult<any>> = {
  useFederatedGrovesData,
  useTierMappingsData,
  useFederationExchangesData,
  useTrustRelationshipsData,
};

// =============================================================================
// Resolution Functions
// =============================================================================

/**
 * Resolve data hook by name
 * @param name Hook name from FEDERATION_TYPE_REGISTRY.dataHookName
 * @returns The React hook function
 * @throws Error if hook not found (fail-fast for missing registrations)
 *
 * NOTE: Due to React's Rules of Hooks, you cannot call the returned hook
 * dynamically. This function is primarily for validation and introspection.
 */
export function resolveFederationDataHook(name: string): () => CollectionDataResult<any> {
  const hook = FEDERATION_HOOK_REGISTRY[name];
  if (!hook) {
    throw new Error(
      `Federation data hook "${name}" not found in registry. ` +
      `Did you forget to add it to FEDERATION_HOOK_REGISTRY in hook-registry.ts?`
    );
  }
  return hook;
}

/**
 * Check if a data hook is registered
 * @param name Hook name
 * @returns true if registered
 */
export function hasFederationDataHook(name: string): boolean {
  return name in FEDERATION_HOOK_REGISTRY;
}

/**
 * Get all registered hook names
 * @returns Array of hook names
 */
export function getRegisteredFederationHooks(): string[] {
  return Object.keys(FEDERATION_HOOK_REGISTRY);
}

/**
 * Validate that all federation types have registered hooks
 * @param typeRegistry The FEDERATION_TYPE_REGISTRY
 * @returns Array of missing hook names (empty if all valid)
 */
export function validateFederationHookRegistrations(
  typeRegistry: Record<string, { dataHookName: string }>
): string[] {
  const missing: string[] = [];
  for (const [type, def] of Object.entries(typeRegistry)) {
    if (!hasFederationDataHook(def.dataHookName)) {
      missing.push(`${type}: ${def.dataHookName}`);
    }
  }
  return missing;
}
