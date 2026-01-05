// src/core/extraction/types.ts
// Sprint: exploration-node-unification-v1

import type { Stage } from '../context-fields/types';

export interface RawExtractedPrompt {
  label: string;
  executionPrompt: string;
  systemContext: string;
  stages: string[];
  lenses: string[];
  topics: string[];
  confidence: number;
}

export interface ExtractionContext {
  documentId: string;
  title: string;
  content: string;
  tier: string;
  namedEntities: {
    people: string[];
    organizations: string[];
    concepts: string[];
    technologies: string[];
  };
}

export interface ExtractionResult {
  documentId: string;
  documentTitle: string;
  prompts: import('../context-fields/types').PromptObject[];
  raw: RawExtractedPrompt[];
  metadata: {
    extractedAt: number;
    model: string;
    documentTier: string;
    promptCount: number;
  };
}

export const TIER_TO_STAGES: Record<string, Stage[]> = {
  seed: ['genesis'],
  sprout: ['genesis', 'exploration'],
  sapling: ['exploration', 'synthesis'],
  tree: ['synthesis', 'advocacy'],
  grove: ['advocacy'],
};
