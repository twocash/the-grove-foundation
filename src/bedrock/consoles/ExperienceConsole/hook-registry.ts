// src/bedrock/consoles/ExperienceConsole/hook-registry.ts
// Hook Registry for Experience Console
// Maps string names to data hooks for runtime composition
// Sprint: unified-experience-console-v1
//
// DEX: Declarative Sovereignty - data sources defined in config, resolved at runtime

import type { CollectionDataResult } from '../../patterns/console-factory.types';
import { useExperienceData } from './useExperienceData';
import { useFeatureFlagsData } from './useFeatureFlagsData';
import { useCopilotStyleData } from './useCopilotStyleData';
import { useLifecycleConfigData } from './useLifecycleConfigData';

// =============================================================================
// Hook Registry
// =============================================================================

/**
 * Data hook registry
 * Maps hook names (from EXPERIENCE_TYPE_REGISTRY.dataHookName) to actual hooks
 *
 * When adding a new type:
 * 1. Create useYourTypeData.ts hook
 * 2. Import it here
 * 3. Add entry: useYourTypeData
 *
 * IMPORTANT: React hooks cannot be called conditionally/dynamically.
 * This registry is used by useUnifiedExperienceData to know which hooks exist.
 * The actual hook calls must be explicit in useUnifiedExperienceData.
 */
export const HOOK_REGISTRY: Record<string, () => CollectionDataResult<any>> = {
  useExperienceData,
  useFeatureFlagsData,
  useCopilotStyleData,
  useLifecycleConfigData, // Sprint: S5-SL-LifecycleEngine v1
  // Future types:
  // usePromptArchitectConfigData,
  // useWelcomeConfigData,
};

// =============================================================================
// Resolution Functions
// =============================================================================

/**
 * Resolve data hook by name
 * @param name Hook name from EXPERIENCE_TYPE_REGISTRY.dataHookName
 * @returns The React hook function
 * @throws Error if hook not found (fail-fast for missing registrations)
 *
 * NOTE: Due to React's Rules of Hooks, you cannot call the returned hook
 * dynamically. This function is primarily for validation and introspection.
 * For actual usage, see useUnifiedExperienceData which calls hooks explicitly.
 */
export function resolveDataHook(name: string): () => CollectionDataResult<any> {
  const hook = HOOK_REGISTRY[name];
  if (!hook) {
    throw new Error(
      `Data hook "${name}" not found in registry. ` +
      `Did you forget to add it to HOOK_REGISTRY in hook-registry.ts?`
    );
  }
  return hook;
}

/**
 * Check if a data hook is registered
 * @param name Hook name
 * @returns true if registered
 */
export function hasDataHook(name: string): boolean {
  return name in HOOK_REGISTRY;
}

/**
 * Get all registered hook names
 * @returns Array of hook names
 */
export function getRegisteredHooks(): string[] {
  return Object.keys(HOOK_REGISTRY);
}

/**
 * Validate that all experience types have registered hooks
 * @param typeRegistry The EXPERIENCE_TYPE_REGISTRY
 * @returns Array of missing hook names (empty if all valid)
 */
export function validateHookRegistrations(
  typeRegistry: Record<string, { dataHookName: string }>
): string[] {
  const missing: string[] = [];
  for (const [type, def] of Object.entries(typeRegistry)) {
    if (!hasDataHook(def.dataHookName)) {
      missing.push(`${type}: ${def.dataHookName}`);
    }
  }
  return missing;
}
