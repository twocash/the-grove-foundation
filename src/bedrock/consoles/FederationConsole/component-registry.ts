// src/bedrock/consoles/FederationConsole/component-registry.ts
// Component Registry for Federation Console
// Maps string names to actual components for runtime resolution
// Sprint: S9-SL-Federation v1
//
// DEX: Declarative Sovereignty - components defined in config, resolved at runtime

import type { ComponentType } from 'react';
import type { ObjectCardProps, ObjectEditorProps } from '../../patterns/console-factory.types';

// Card components
import { GroveCard } from './GroveCard';
import { TierMappingCard } from './TierMappingCard';
import { ExchangeCard } from './ExchangeCard';
import { TrustCard } from './TrustCard';

// Editor components
import { GroveEditor } from './GroveEditor';
import { TierMappingEditor } from './TierMappingEditor';
import { ExchangeEditor } from './ExchangeEditor';
import { TrustEditor } from './TrustEditor';

// =============================================================================
// Card Component Registry
// =============================================================================

/**
 * Card component registry
 * Maps component names (from FEDERATION_TYPE_REGISTRY.cardComponent) to actual components
 *
 * When adding a new type:
 * 1. Create YourTypeCard.tsx component
 * 2. Import it here
 * 3. Add entry: YourTypeCard
 */
export const FEDERATION_CARD_REGISTRY: Record<string, ComponentType<ObjectCardProps<any>>> = {
  GroveCard,
  TierMappingCard,
  ExchangeCard,
  TrustCard,
};

// =============================================================================
// Editor Component Registry
// =============================================================================

/**
 * Editor component registry
 * Maps component names (from FEDERATION_TYPE_REGISTRY.editorComponent) to actual components
 *
 * When adding a new type:
 * 1. Create YourTypeEditor.tsx component
 * 2. Import it here
 * 3. Add entry: YourTypeEditor
 */
export const FEDERATION_EDITOR_REGISTRY: Record<string, ComponentType<ObjectEditorProps<any>>> = {
  GroveEditor,
  TierMappingEditor,
  ExchangeEditor,
  TrustEditor,
};

// =============================================================================
// Resolution Functions
// =============================================================================

/**
 * Resolve card component by name
 * @param name Component name from FEDERATION_TYPE_REGISTRY.cardComponent
 * @returns The React component
 * @throws Error if component not found (fail-fast for missing registrations)
 */
export function resolveFederationCardComponent(name: string): ComponentType<ObjectCardProps<any>> {
  const component = FEDERATION_CARD_REGISTRY[name];
  if (!component) {
    throw new Error(
      `Federation card component "${name}" not found in registry. ` +
      `Did you forget to add it to FEDERATION_CARD_REGISTRY in component-registry.ts?`
    );
  }
  return component;
}

/**
 * Resolve editor component by name
 * @param name Component name from FEDERATION_TYPE_REGISTRY.editorComponent
 * @returns The React component
 * @throws Error if component not found (fail-fast for missing registrations)
 */
export function resolveFederationEditorComponent(name: string): ComponentType<ObjectEditorProps<any>> {
  const component = FEDERATION_EDITOR_REGISTRY[name];
  if (!component) {
    throw new Error(
      `Federation editor component "${name}" not found in registry. ` +
      `Did you forget to add it to FEDERATION_EDITOR_REGISTRY in component-registry.ts?`
    );
  }
  return component;
}

/**
 * Check if a card component is registered
 * @param name Component name
 * @returns true if registered
 */
export function hasFederationCardComponent(name: string): boolean {
  return name in FEDERATION_CARD_REGISTRY;
}

/**
 * Check if an editor component is registered
 * @param name Component name
 * @returns true if registered
 */
export function hasFederationEditorComponent(name: string): boolean {
  return name in FEDERATION_EDITOR_REGISTRY;
}

/**
 * Get all registered card component names
 * @returns Array of component names
 */
export function getRegisteredFederationCardComponents(): string[] {
  return Object.keys(FEDERATION_CARD_REGISTRY);
}

/**
 * Get all registered editor component names
 * @returns Array of component names
 */
export function getRegisteredFederationEditorComponents(): string[] {
  return Object.keys(FEDERATION_EDITOR_REGISTRY);
}
