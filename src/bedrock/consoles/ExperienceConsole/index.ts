// src/bedrock/consoles/ExperienceConsole/index.ts
// Experience Console - Polymorphic Object Management
// Sprint: unified-experience-console-v1
//
// DEX: Organic Scalability - console discovers types from registry
// DEX: Declarative Sovereignty - component resolution from config

import React from 'react';
import { createBedrockConsole } from '../../patterns/console-factory';
import { experienceConsoleConfig } from './ExperienceConsole.config';
import { useUnifiedExperienceData, type UnifiedExperiencePayload } from './useUnifiedExperienceData';
import { resolveCardComponent, resolveEditorComponent } from './component-registry';
import { getExperienceTypeDefinition, isExperienceObjectType, getAllExperienceTypes } from '../../types/experience.types';
import type { ObjectCardProps, ObjectEditorProps, CreateOption } from '../../patterns/console-factory.types';

// =============================================================================
// Polymorphic Card Component
// =============================================================================

/**
 * Polymorphic Card Component
 * Resolves actual card component based on object type from registry
 */
const PolymorphicCard: React.FC<ObjectCardProps<UnifiedExperiencePayload>> = (props) => {
  const { object } = props;
  const objectType = object.meta.type;

  // Resolve component from registry
  const typeDef = isExperienceObjectType(objectType)
    ? getExperienceTypeDefinition(objectType)
    : null;

  if (!typeDef) {
    console.error(`[PolymorphicCard] Unknown experience type: ${objectType}`);
    return React.createElement('div', {
      className: 'p-4 border rounded',
      style: { borderColor: 'var(--semantic-error-border)', backgroundColor: 'var(--semantic-error-bg)' },
    }, React.createElement('p', {
      className: 'text-sm',
      style: { color: 'var(--semantic-error)' },
    }, `Unknown type: ${objectType}`));
  }

  const CardComponent = resolveCardComponent(typeDef.cardComponent);
  return React.createElement(CardComponent, props);
};

// =============================================================================
// Polymorphic Editor Component
// =============================================================================

/**
 * Polymorphic Editor Component
 * Resolves actual editor component based on object type from registry
 */
const PolymorphicEditor: React.FC<ObjectEditorProps<UnifiedExperiencePayload>> = (props) => {
  const { object } = props;
  const objectType = object.meta.type;

  // Resolve component from registry
  const typeDef = isExperienceObjectType(objectType)
    ? getExperienceTypeDefinition(objectType)
    : null;

  if (!typeDef) {
    console.error(`[PolymorphicEditor] Unknown experience type: ${objectType}`);
    return React.createElement('div', {
      className: 'p-4',
    }, React.createElement('p', {
      style: { color: 'var(--semantic-error)' },
    }, `Cannot edit unknown type: ${objectType}`));
  }

  const EditorComponent = resolveEditorComponent(typeDef.editorComponent);
  return React.createElement(EditorComponent, props);
};

// =============================================================================
// Create Options for Polymorphic Console
// Sprint: experience-console-cleanup-v1
// =============================================================================

/**
 * Generate create options from type registry
 * Only includes types that belong to the Experience Console
 */
function getCreateOptions(): CreateOption[] {
  return getAllExperienceTypes()
    .filter((t) => t.routePath === '/bedrock/experience')
    .map((t) => ({
      type: t.type,
      label: t.label,
      icon: t.icon,
      color: t.color,
      description: t.description,
    }));
}

// =============================================================================
// Experience Console Factory
// =============================================================================

/**
 * Experience Console
 *
 * Polymorphic console managing all registered experience object types.
 * Types are discovered from EXPERIENCE_TYPE_REGISTRY at runtime.
 *
 * Supported types (auto-discovered):
 * - system-prompt: AI personality and behavior configuration
 * - feature-flag: Feature toggles across the application
 * - research-agent-config: Research execution configuration (SINGLETON)
 * - writer-agent-config: Document writing configuration (SINGLETON)
 * - (future types added to registry will appear automatically)
 *
 * DEX Compliance:
 * - Declarative Sovereignty: Components resolved from registry config
 * - Organic Scalability: New types appear without console modification
 * - Provenance: Type registry documents all type metadata
 *
 * @see EXPERIENCE_TYPE_REGISTRY for type definitions
 * @see component-registry.ts for component mapping
 * @see hook-registry.ts for data hook mapping
 */
export const ExperienceConsole = createBedrockConsole<UnifiedExperiencePayload>({
  config: experienceConsoleConfig,
  useData: useUnifiedExperienceData,
  CardComponent: PolymorphicCard,
  EditorComponent: PolymorphicEditor,
  copilotTitle: 'Experience Copilot',
  copilotPlaceholder: 'Edit this experience object with AI assistance...',
  createOptions: getCreateOptions(),
});

// =============================================================================
// Re-exports for external use
// =============================================================================

// Configuration
export { experienceConsoleConfig } from './ExperienceConsole.config';
export { RESPONSE_MODE_CONFIG, CLOSING_BEHAVIOR_CONFIG } from './ExperienceConsole.config';

// Unified data hook
export { useUnifiedExperienceData } from './useUnifiedExperienceData';
export type { UnifiedExperiencePayload } from './useUnifiedExperienceData';

// Component registries
export { resolveCardComponent, resolveEditorComponent } from './component-registry';
export { resolveDataHook } from './hook-registry';

// Type-specific components (for direct access if needed)
export { SystemPromptCard } from './SystemPromptCard';
export { SystemPromptEditor } from './SystemPromptEditor';
export { FeatureFlagCard } from './FeatureFlagCard';
export { FeatureFlagEditor } from './FeatureFlagEditor';
// Sprint: experience-console-cleanup-v1 - Agent config components
export { ResearchAgentConfigCard } from './ResearchAgentConfigCard';
export { ResearchAgentConfigEditor } from './ResearchAgentConfigEditor';
export { WriterAgentConfigCard } from './WriterAgentConfigCard';
export { WriterAgentConfigEditor } from './WriterAgentConfigEditor';
// Sprint: inspector-copilot-v1 - Copilot style components
export { CopilotStyleCard } from './CopilotStyleCard';
export { CopilotStyleEditor } from './CopilotStyleEditor';

// Type-specific data hooks
export { useExperienceData, createDefaultSystemPrompt } from './useExperienceData';
export type { ExperienceDataResult } from './useExperienceData';
export { useFeatureFlagsData, createDefaultFeatureFlag } from './useFeatureFlagsData';
export type { FeatureFlagsDataResult } from './useFeatureFlagsData';
// Sprint: experience-console-cleanup-v1 - New agent config data hooks
export { useResearchAgentConfigData, createDefaultResearchAgentConfig } from './useResearchAgentConfigData';
export type { ResearchAgentConfigDataResult } from './useResearchAgentConfigData';
export { useWriterAgentConfigData, createDefaultWriterAgentConfig } from './useWriterAgentConfigData';
export type { WriterAgentConfigDataResult } from './useWriterAgentConfigData';
// Sprint: inspector-copilot-v1 - Copilot style data hook
export { useCopilotStyleData, createDefaultCopilotStyle } from './useCopilotStyleData';
export type { CopilotStyleDataResult } from './useCopilotStyleData';

// Category config for feature flags (preserved for component use)
export { CATEGORY_CONFIG } from './FeatureFlagConsole.config';

// Default export
export default ExperienceConsole;
