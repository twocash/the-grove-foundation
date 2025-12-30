// src/lib/prompt-generator.ts
// Sprint: sprout-declarative-v1-epic4
// Generates research prompts from sprout manifests

import Handlebars from 'handlebars';
import type { Sprout, ResearchManifest } from '@/core/schema/sprout';

// Import template as raw string
import promptTemplate from '@/data/research-prompt-template.md?raw';

// Import purposes for prompt framing lookup
import researchPurposesConfig from '@/data/research-purposes.json';

interface PurposeConfig {
  id: string;
  label: string;
  promptFraming: string;
}

// Register helpers
Handlebars.registerHelper('inc', (value: number) => value + 1);

// Compile template once
const compiledTemplate = Handlebars.compile(promptTemplate);

/**
 * Generate a research prompt from a sprout with research manifest
 */
export function generateResearchPrompt(sprout: Sprout): string {
  if (!sprout.researchManifest) {
    throw new Error('Sprout has no research manifest');
  }

  const manifest = sprout.researchManifest;

  // Look up purpose config for label and framing
  const purposeConfig = (researchPurposesConfig.purposes as PurposeConfig[])
    .find(p => p.id === manifest.purpose);

  if (!purposeConfig) {
    throw new Error(`Unknown research purpose: ${manifest.purpose}`);
  }

  const context = {
    seed: sprout.response,
    capturedAt: new Date(sprout.capturedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    provenance: sprout.provenance,
    purpose: {
      id: manifest.purpose,
      label: purposeConfig.label,
      promptFraming: purposeConfig.promptFraming
    },
    clues: manifest.clues,
    directions: manifest.directions
  };

  return compiledTemplate(context);
}

/**
 * Generate prompt and update sprout with generation metadata
 */
export function generateAndRecordPrompt(sprout: Sprout): {
  prompt: string;
  updatedManifest: ResearchManifest;
} {
  const prompt = generateResearchPrompt(sprout);

  const updatedManifest: ResearchManifest = {
    ...sprout.researchManifest!,
    promptGenerated: {
      templateId: 'research-prompt-template-v1',
      generatedAt: new Date().toISOString(),
      rawPrompt: prompt
    }
  };

  return { prompt, updatedManifest };
}
