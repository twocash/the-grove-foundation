// src/bedrock/consoles/ExperienceConsole/component-registry.ts
// Component Registry for Experience Console
// Maps string names to actual components for runtime resolution
// Sprint: unified-experience-console-v1
//
// DEX: Declarative Sovereignty - components defined in config, resolved at runtime

import type { ComponentType } from 'react';
import type { ObjectCardProps, ObjectEditorProps } from '../../patterns/console-factory.types';

// Card components
import { SystemPromptCard } from './SystemPromptCard';
import { FeatureFlagCard } from './FeatureFlagCard';
import { ResearchAgentConfigCard } from './ResearchAgentConfigCard';
import { WriterAgentConfigCard } from './WriterAgentConfigCard';
import { CopilotStyleCard } from './CopilotStyleCard';
import { LifecycleConfigCard } from './LifecycleConfigCard';
import { AdvancementRuleCard } from './AdvancementRuleCard';
import { JobConfigCard } from './JobConfigCard';
import { ModelCard } from './ModelCard';
import { OutputTemplateCard } from './OutputTemplateCard'; // Sprint: prompt-template-architecture-v1

// Editor components
import { SystemPromptEditor } from './SystemPromptEditor';
import { FeatureFlagEditor } from './FeatureFlagEditor';
import { ResearchAgentConfigEditor } from './ResearchAgentConfigEditor';
import { WriterAgentConfigEditor } from './WriterAgentConfigEditor';
import { CopilotStyleEditor } from './CopilotStyleEditor';
import { LifecycleConfigEditor } from './LifecycleConfigEditor';
import { AdvancementRuleEditor } from './AdvancementRuleEditor';
import { JobConfigEditor } from './JobConfigEditor';
import { ModelEditor } from './ModelEditor';
import { OutputTemplateEditor } from './OutputTemplateEditor'; // Sprint: prompt-template-architecture-v1

// =============================================================================
// Card Component Registry
// =============================================================================

/**
 * Card component registry
 * Maps component names (from EXPERIENCE_TYPE_REGISTRY.cardComponent) to actual components
 *
 * When adding a new type:
 * 1. Create YourTypeCard.tsx component
 * 2. Import it here
 * 3. Add entry: YourTypeCard
 */
export const CARD_COMPONENT_REGISTRY: Record<string, ComponentType<ObjectCardProps<any>>> = {
  SystemPromptCard,
  FeatureFlagCard,
  ResearchAgentConfigCard,
  WriterAgentConfigCard,
  CopilotStyleCard,
  LifecycleConfigCard, // Sprint: S5-SL-LifecycleEngine v1
  AdvancementRuleCard, // Sprint: S7-SL-AutoAdvancement v1
  JobConfigCard, // Sprint: S7.5-SL-JobConfigSystem v1
  ModelCard, // Sprint: EPIC4-SL-MultiModel v1
  OutputTemplateCard, // Sprint: prompt-template-architecture-v1
  // Future types:
  // PromptArchitectConfigCard,
  // WelcomeConfigCard,
};

// =============================================================================
// Editor Component Registry
// =============================================================================

/**
 * Editor component registry
 * Maps component names (from EXPERIENCE_TYPE_REGISTRY.editorComponent) to actual components
 *
 * When adding a new type:
 * 1. Create YourTypeEditor.tsx component
 * 2. Import it here
 * 3. Add entry: YourTypeEditor
 */
export const EDITOR_COMPONENT_REGISTRY: Record<string, ComponentType<ObjectEditorProps<any>>> = {
  SystemPromptEditor,
  FeatureFlagEditor,
  ResearchAgentConfigEditor,
  WriterAgentConfigEditor,
  CopilotStyleEditor,
  LifecycleConfigEditor, // Sprint: S5-SL-LifecycleEngine v1
  AdvancementRuleEditor, // Sprint: S7-SL-AutoAdvancement v1
  JobConfigEditor, // Sprint: S7.5-SL-JobConfigSystem v1
  ModelEditor, // Sprint: EPIC4-SL-MultiModel v1
  OutputTemplateEditor, // Sprint: prompt-template-architecture-v1
  // Future types:
  // PromptArchitectConfigEditor,
  // WelcomeConfigEditor,
};

// =============================================================================
// Resolution Functions
// =============================================================================

/**
 * Resolve card component by name
 * @param name Component name from EXPERIENCE_TYPE_REGISTRY.cardComponent
 * @returns The React component
 * @throws Error if component not found (fail-fast for missing registrations)
 */
export function resolveCardComponent(name: string): ComponentType<ObjectCardProps<any>> {
  const component = CARD_COMPONENT_REGISTRY[name];
  if (!component) {
    throw new Error(
      `Card component "${name}" not found in registry. ` +
      `Did you forget to add it to CARD_COMPONENT_REGISTRY in component-registry.ts?`
    );
  }
  return component;
}

/**
 * Resolve editor component by name
 * @param name Component name from EXPERIENCE_TYPE_REGISTRY.editorComponent
 * @returns The React component
 * @throws Error if component not found (fail-fast for missing registrations)
 */
export function resolveEditorComponent(name: string): ComponentType<ObjectEditorProps<any>> {
  const component = EDITOR_COMPONENT_REGISTRY[name];
  if (!component) {
    throw new Error(
      `Editor component "${name}" not found in registry. ` +
      `Did you forget to add it to EDITOR_COMPONENT_REGISTRY in component-registry.ts?`
    );
  }
  return component;
}

/**
 * Check if a card component is registered
 * @param name Component name
 * @returns true if registered
 */
export function hasCardComponent(name: string): boolean {
  return name in CARD_COMPONENT_REGISTRY;
}

/**
 * Check if an editor component is registered
 * @param name Component name
 * @returns true if registered
 */
export function hasEditorComponent(name: string): boolean {
  return name in EDITOR_COMPONENT_REGISTRY;
}

/**
 * Get all registered card component names
 * @returns Array of component names
 */
export function getRegisteredCardComponents(): string[] {
  return Object.keys(CARD_COMPONENT_REGISTRY);
}

/**
 * Get all registered editor component names
 * @returns Array of component names
 */
export function getRegisteredEditorComponents(): string[] {
  return Object.keys(EDITOR_COMPONENT_REGISTRY);
}
