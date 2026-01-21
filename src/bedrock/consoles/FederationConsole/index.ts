// src/bedrock/consoles/FederationConsole/index.ts
// Federation Console - Cross-Grove Federation Management
// Sprint: S9-SL-Federation v1
//
// DEX: Organic Scalability - console discovers types from registry
// DEX: Declarative Sovereignty - component resolution from config

import React from 'react';
import { createBedrockConsole } from '../../patterns/console-factory';
import { federationConsoleConfig } from './FederationConsole.config';
import { useFederationData, type UnifiedFederationPayload } from './useFederationData';
import { resolveFederationCardComponent, resolveFederationEditorComponent } from './component-registry';
import {
  getFederationTypeDefinition,
  isFederationEntityType,
  getAllFederationTypes,
} from '../../types/federation.types';
import type { ObjectCardProps, ObjectEditorProps, CreateOption } from '../../patterns/console-factory.types';

// =============================================================================
// Polymorphic Card Component
// =============================================================================

/**
 * Polymorphic Card Component
 * Resolves actual card component based on object type from registry
 */
const PolymorphicCard: React.FC<ObjectCardProps<UnifiedFederationPayload>> = (props) => {
  const { object } = props;
  const objectType = object.meta.type;

  // Resolve component from registry
  const typeDef = isFederationEntityType(objectType)
    ? getFederationTypeDefinition(objectType)
    : null;

  if (!typeDef) {
    console.error(`[PolymorphicCard] Unknown federation type: ${objectType}`);
    return React.createElement('div', {
      className: 'p-4 border rounded',
      style: { borderColor: 'var(--semantic-error-border)', backgroundColor: 'var(--semantic-error-bg)' },
    }, React.createElement('p', {
      className: 'text-sm',
      style: { color: 'var(--semantic-error)' },
    }, `Unknown type: ${objectType}`));
  }

  const CardComponent = resolveFederationCardComponent(typeDef.cardComponent);
  return React.createElement(CardComponent, props);
};

// =============================================================================
// Polymorphic Editor Component
// =============================================================================

/**
 * Polymorphic Editor Component
 * Resolves actual editor component based on object type from registry
 */
const PolymorphicEditor: React.FC<ObjectEditorProps<UnifiedFederationPayload>> = (props) => {
  const { object } = props;
  const objectType = object.meta.type;

  // Resolve component from registry
  const typeDef = isFederationEntityType(objectType)
    ? getFederationTypeDefinition(objectType)
    : null;

  if (!typeDef) {
    console.error(`[PolymorphicEditor] Unknown federation type: ${objectType}`);
    return React.createElement('div', {
      className: 'p-4',
    }, React.createElement('p', {
      style: { color: 'var(--semantic-error)' },
    }, `Cannot edit unknown type: ${objectType}`));
  }

  const EditorComponent = resolveFederationEditorComponent(typeDef.editorComponent);
  return React.createElement(EditorComponent, props);
};

// =============================================================================
// Create Options for Polymorphic Console
// =============================================================================

/**
 * Generate create options from type registry
 */
function getCreateOptions(): CreateOption[] {
  return getAllFederationTypes().map((t) => ({
    type: t.type,
    label: t.label,
    icon: t.icon,
    color: t.color,
    description: t.description,
  }));
}

// =============================================================================
// Federation Console Factory
// =============================================================================

/**
 * Federation Console
 *
 * Polymorphic console managing all registered federation entity types.
 * Types are discovered from FEDERATION_TYPE_REGISTRY at runtime.
 *
 * Supported types (auto-discovered):
 * - federated-grove: External grove communities registered for federation
 * - tier-mapping: Semantic tier equivalence mappings between groves
 * - federation-exchange: Knowledge exchange requests and offers
 * - trust-relationship: Bidirectional trust scores between grove pairs
 *
 * DEX Compliance:
 * - Declarative Sovereignty: Components resolved from registry config
 * - Organic Scalability: New types appear without console modification
 * - Provenance: Type registry documents all type metadata
 * - Capability Agnosticism: No AI dependencies for core operations
 *
 * @see FEDERATION_TYPE_REGISTRY for type definitions
 * @see component-registry.ts for component mapping
 * @see hook-registry.ts for data hook mapping
 */
export const FederationConsole = createBedrockConsole<UnifiedFederationPayload>({
  config: federationConsoleConfig,
  useData: useFederationData,
  CardComponent: PolymorphicCard,
  EditorComponent: PolymorphicEditor,
  copilotTitle: 'Federation Copilot',
  copilotPlaceholder: 'Configure this federation entity with AI assistance...',
  createOptions: getCreateOptions(),
});

// =============================================================================
// Re-exports for external use
// =============================================================================

// Configuration
export { federationConsoleConfig } from './FederationConsole.config';
export {
  CONNECTION_STATUS_CONFIG,
  TRUST_LEVEL_DISPLAY_CONFIG,
  EXCHANGE_STATUS_CONFIG,
  CONTENT_TYPE_CONFIG,
} from './FederationConsole.config';

// Unified data hook
export { useFederationData } from './useFederationData';
export type { UnifiedFederationPayload, UnifiedFederationDataResult } from './useFederationData';

// Component registries
export { resolveFederationCardComponent, resolveFederationEditorComponent } from './component-registry';
export { resolveFederationDataHook } from './hook-registry';

// Type-specific components (for direct access if needed)
export { GroveCard } from './GroveCard';
export { GroveEditor } from './GroveEditor';
export { TierMappingCard } from './TierMappingCard';
export { TierMappingEditor } from './TierMappingEditor';
export { ExchangeCard } from './ExchangeCard';
export { ExchangeEditor } from './ExchangeEditor';
export { TrustCard } from './TrustCard';
export { TrustEditor } from './TrustEditor';

// Type-specific data hooks
export { useFederatedGrovesData, createDefaultFederatedGrove } from './useFederatedGrovesData';
export type { FederatedGrovesDataResult } from './useFederatedGrovesData';
export { useTierMappingsData, createDefaultTierMapping } from './useTierMappingsData';
export type { TierMappingsDataResult } from './useTierMappingsData';
export { useFederationExchangesData, createDefaultFederationExchange } from './useFederationExchangesData';
export type { FederationExchangesDataResult } from './useFederationExchangesData';
export {
  useTrustRelationshipsData,
  createDefaultTrustRelationship,
  calculateTrustScore,
  determineTrustLevel,
} from './useTrustRelationshipsData';
export type { TrustRelationshipsDataResult } from './useTrustRelationshipsData';

// Registries
export {
  FEDERATION_CARD_REGISTRY,
  FEDERATION_EDITOR_REGISTRY,
  resolveFederationCardComponent as resolveCardComponent,
  resolveFederationEditorComponent as resolveEditorComponent,
  hasFederationCardComponent,
  hasFederationEditorComponent,
  getRegisteredFederationCardComponents,
  getRegisteredFederationEditorComponents,
} from './component-registry';

export {
  FEDERATION_HOOK_REGISTRY,
  resolveFederationDataHook as resolveDataHook,
  hasFederationDataHook,
  getRegisteredFederationHooks,
  validateFederationHookRegistrations,
} from './hook-registry';

// Default export
export default FederationConsole;
