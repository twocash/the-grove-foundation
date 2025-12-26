/**
 * Wizard Output Transforms
 * Sprint: wizard-engine-v1
 *
 * Transform wizard state into output format.
 */

import { WizardEngineState, OutputConfig } from './schema';
import { LensCandidate, CustomLens } from '../schema/lens';

/**
 * Transform wizard state into final output
 */
export function transformOutput<T>(
  state: WizardEngineState,
  _config: OutputConfig
): T {
  // For now, return the selected option directly
  // Transform functions can be registered for specific output types
  return state.selectedOption as T;
}

/**
 * Map input keys according to generation config
 */
export function mapInputs(
  inputs: Record<string, unknown>,
  mapping: Record<string, string>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [targetKey, sourceKey] of Object.entries(mapping)) {
    // If sourceKey is 'inputs', pass the whole inputs object
    if (sourceKey === 'inputs') {
      result[targetKey] = inputs;
    } else {
      result[targetKey] = inputs[sourceKey];
    }
  }
  return result;
}

/**
 * Create a CustomLens from wizard result
 */
export function createCustomLensFromWizard(
  candidate: LensCandidate,
  inputs: Record<string, unknown>
): Omit<CustomLens, 'userInputs'> & { rawInputs: Record<string, unknown> } {
  return {
    id: `custom-${Date.now()}`,
    publicLabel: candidate.publicLabel,
    description: candidate.description,
    icon: 'sparkles',
    color: 'purple',
    enabled: true,
    toneGuidance: candidate.toneGuidance,
    narrativeStyle: candidate.narrativeStyle,
    arcEmphasis: candidate.arcEmphasis,
    openingPhase: candidate.openingPhase,
    defaultThreadLength: 5,
    entryPoints: [],
    suggestedThread: [],
    isCustom: true,
    archetypeMapping: candidate.archetypeMapping,
    createdAt: new Date().toISOString(),
    journeysCompleted: 0,
    // Raw inputs to be encrypted by the caller
    rawInputs: inputs
  };
}
