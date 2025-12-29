// src/surface/components/MomentRenderer/component-registry.ts
// Lazy Component Registry for Moment Rendering
// Sprint: engagement-orchestrator-v1

import { lazy, ComponentType } from 'react';

// =============================================================================
// Component Map
// =============================================================================

// Lazy-load moment components to enable code splitting
const componentMap: Record<string, ComponentType<any>> = {
  // These will be connected when the UI integration sprint runs
  // For now, they're placeholders for the existing reveal components
  // SimulationReveal: lazy(() => import('../../../../components/Terminal/Reveals/SimulationReveal')),
  // CustomLensOffer: lazy(() => import('../../../../components/Terminal/Reveals/CustomLensOffer')),
  // TerminatorMode: lazy(() => import('../../../../components/Terminal/Reveals/TerminatorMode')),
  // FounderStory: lazy(() => import('../../../../components/Terminal/Reveals/FounderStory')),
};

// =============================================================================
// Registry Functions
// =============================================================================

/**
 * Get a registered moment component by key
 */
export function getMomentComponent(key: string): ComponentType<any> | null {
  return componentMap[key] ?? null;
}

/**
 * Register a moment component at runtime
 * Useful for dynamic component registration from plugins/extensions
 */
export function registerMomentComponent(key: string, component: ComponentType<any>): void {
  componentMap[key] = component;
}

/**
 * Check if a component is registered
 */
export function hasMomentComponent(key: string): boolean {
  return key in componentMap;
}

/**
 * Get all registered component keys
 */
export function getRegisteredComponents(): string[] {
  return Object.keys(componentMap);
}
