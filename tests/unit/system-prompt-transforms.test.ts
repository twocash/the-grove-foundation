import { describe, it, expect } from 'vitest';
import {
  createSystemPromptFromWizard,
  validateSystemPromptWizardOutput,
} from '../../src/bedrock/consoles/ExperiencesConsole/transforms';

describe('createSystemPromptFromWizard', () => {
  it('transforms complete wizard output', () => {
    const wizardOutput = {
      identity: 'You are Grove, a research companion.',
      voiceGuidelines: 'Speak with intellectual warmth.',
      structureRules: 'Use clear sections.',
      knowledgeInstructions: 'Draw from the knowledge base.',
      boundaries: 'Stay on topic.',
      responseMode: 'architect',
      closingBehavior: 'navigation',
      useBreadcrumbTags: true,
      useTopicTags: false,
      useNavigationBlocks: true,
    };

    const result = createSystemPromptFromWizard(wizardOutput);

    expect(result.identity).toBe('You are Grove, a research companion.');
    expect(result.responseMode).toBe('architect');
    expect(result.useTopicTags).toBe(false);
    expect(result.version).toBe(1);
    expect(result.changelog).toBe('Created via wizard');
  });

  it('applies defaults for missing optional fields', () => {
    const wizardOutput = {
      identity: 'Test identity',
      voiceGuidelines: 'Test voice',
    };

    const result = createSystemPromptFromWizard(wizardOutput);

    expect(result.responseMode).toBe('architect');
    expect(result.closingBehavior).toBe('navigation');
    expect(result.useBreadcrumbTags).toBe(true);
  });

  it('validates and defaults invalid response mode', () => {
    const wizardOutput = {
      identity: 'Test',
      voiceGuidelines: 'Test',
      responseMode: 'invalid-mode',
    };

    const result = createSystemPromptFromWizard(wizardOutput as any);

    expect(result.responseMode).toBe('architect'); // Falls back to default
  });

  it('validates and defaults invalid closing behavior', () => {
    const wizardOutput = {
      identity: 'Test',
      voiceGuidelines: 'Test',
      closingBehavior: 'invalid-behavior',
    };

    const result = createSystemPromptFromWizard(wizardOutput as any);

    expect(result.closingBehavior).toBe('navigation'); // Falls back to default
  });

  it('trims whitespace from content fields', () => {
    const wizardOutput = {
      identity: '  Test identity  ',
      voiceGuidelines: '\n\nTest voice\n\n',
    };

    const result = createSystemPromptFromWizard(wizardOutput);

    expect(result.identity).toBe('Test identity');
    expect(result.voiceGuidelines).toBe('Test voice');
  });

  it('sets provenance fields to null', () => {
    const wizardOutput = {
      identity: 'Test',
      voiceGuidelines: 'Test',
    };

    const result = createSystemPromptFromWizard(wizardOutput);

    expect(result.createdByUserId).toBeNull();
    expect(result.updatedByUserId).toBeNull();
  });

  it('defaults empty strings for missing content fields', () => {
    const wizardOutput = {};

    const result = createSystemPromptFromWizard(wizardOutput);

    expect(result.identity).toBe('');
    expect(result.voiceGuidelines).toBe('');
    expect(result.structureRules).toBe('');
    expect(result.knowledgeInstructions).toBe('');
    expect(result.boundaries).toBe('');
  });
});

describe('validateSystemPromptWizardOutput', () => {
  it('returns errors for missing required fields', () => {
    const errors = validateSystemPromptWizardOutput({});

    expect(errors).toContain('Identity section is required');
    expect(errors).toContain('Voice Guidelines section is required');
  });

  it('returns error for sparse content', () => {
    const errors = validateSystemPromptWizardOutput({
      identity: 'Short',
      voiceGuidelines: 'Also short',
    });

    expect(errors).toContain('System prompt content is too sparse. Add more detail to sections.');
  });

  it('returns empty array for valid output', () => {
    const errors = validateSystemPromptWizardOutput({
      identity: 'You are Grove, a thoughtful research companion helping users explore distributed AI concepts.',
      voiceGuidelines: 'Speak with intellectual warmth. Balance precision with accessibility. Avoid jargon.',
      structureRules: 'Keep responses focused.',
      knowledgeInstructions: 'Cite sources.',
      boundaries: 'Stay on topic.',
    });

    expect(errors).toHaveLength(0);
  });

  it('returns identity error when identity is whitespace only', () => {
    const errors = validateSystemPromptWizardOutput({
      identity: '   ',
      voiceGuidelines: 'Valid voice guidelines that are long enough to pass the check with sufficient content.',
    });

    expect(errors).toContain('Identity section is required');
  });

  it('returns voice error when voiceGuidelines is whitespace only', () => {
    const errors = validateSystemPromptWizardOutput({
      identity: 'Valid identity that is long enough to pass the check with sufficient content.',
      voiceGuidelines: '   ',
    });

    expect(errors).toContain('Voice Guidelines section is required');
  });

  it('passes when content is spread across multiple sections', () => {
    const errors = validateSystemPromptWizardOutput({
      identity: 'Short identity',
      voiceGuidelines: 'Short voice',
      structureRules: 'This section has more content to meet the minimum threshold requirement.',
      knowledgeInstructions: 'More content here to ensure we meet the minimum.',
      boundaries: 'Additional content to pass validation.',
    });

    expect(errors).toHaveLength(0);
  });
});
