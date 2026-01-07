import { describe, it, expect } from 'vitest';

// ============================================================================
// prompt-wiring-v1 Test Suite
// Tests for sprint wiring: prepend command, /make-compelling, /suggest-targeting
// ============================================================================

describe('prompt-wiring-v1', () => {
  // --------------------------------------------------------------------------
  // Epic 1: Prepend Command
  // --------------------------------------------------------------------------
  describe('prepend command', () => {
    it('parses "prepend execution with: prefix text"', async () => {
      const { parsePrependCommand } = await import(
        '../../../src/bedrock/patterns/copilot-commands'
      );

      // parsePrependCommand(input, consoleId, object) returns CommandResult
      const result = parsePrependCommand('prepend execution with: Given the context,', 'prompts');

      expect(result.success).toBe(true);
      expect(result.operations).toBeDefined();
      expect(result.operations?.[0].path).toBe('/payload/executionPrompt');
      expect(result.operations?.[0].value).toBe('Given the context,');
    });

    it('parses "prepend title with: prefix"', async () => {
      const { parsePrependCommand } = await import(
        '../../../src/bedrock/patterns/copilot-commands'
      );

      const result = parsePrependCommand('prepend title with: [Draft]', 'prompts');

      expect(result.success).toBe(true);
      expect(result.operations?.[0].path).toBe('/meta/title');
      expect(result.operations?.[0].value).toBe('[Draft]');
    });

    it('handles colon separator correctly', async () => {
      const { parsePrependCommand } = await import(
        '../../../src/bedrock/patterns/copilot-commands'
      );

      // Value contains colons - should capture everything after "with:"
      const result = parsePrependCommand('prepend execution with: Note: this is important', 'prompts');

      expect(result.success).toBe(true);
      expect(result.operations?.[0].value).toBe('Note: this is important');
    });

    it('returns unsuccessful for non-prepend commands', async () => {
      const { parsePrependCommand } = await import(
        '../../../src/bedrock/patterns/copilot-commands'
      );

      // Returns CommandResult with success: false for non-matching commands
      expect(parsePrependCommand('set title to something', 'prompts').success).toBe(false);
      expect(parsePrependCommand('hello world', 'prompts').success).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Epic 2: TitleTransforms Integration
  // --------------------------------------------------------------------------
  describe('TitleTransforms', () => {
    it('generateVariants returns 3 variants', async () => {
      const { generateVariants } = await import(
        '../../../src/core/utils/TitleTransforms'
      );
      
      const variants = generateVariants('Observer Dynamic', 3);
      
      expect(variants).toHaveLength(3);
      expect(variants.every(v => v.title && v.format)).toBe(true);
    });

    it('toConceptName strips prefixes', async () => {
      const { toConceptName } = await import(
        '../../../src/core/utils/TitleTransforms'
      );
      
      expect(toConceptName('What is the Observer Dynamic?')).toBe('Observer Dynamic');
      expect(toConceptName('Explore the Ratchet Effect')).toBe('Ratchet Effect');
    });

    it('transformTitle creates question format', async () => {
      const { transformTitle } = await import(
        '../../../src/core/utils/TitleTransforms'
      );
      
      const result = transformTitle('Observer Dynamic', { format: 'question' });
      
      expect(result).toContain('?');
      expect(result.toLowerCase()).toContain('observer dynamic');
    });

    it('transformTitle creates exploration format', async () => {
      const { transformTitle } = await import(
        '../../../src/core/utils/TitleTransforms'
      );

      const result = transformTitle('Observer Dynamic', { format: 'exploration' });

      expect(result).not.toContain('?');
      // Valid prefixes: Explore, Discover, Learn about, Understand, Investigate, Examine
      expect(result.toLowerCase()).toMatch(/explore|discover|learn|understand|investigate|examine/);
    });
  });

  // --------------------------------------------------------------------------
  // Epic 3: TargetingInference Integration  
  // --------------------------------------------------------------------------
  describe('TargetingInference', () => {
    it('infers stages from technical salience', async () => {
      const { inferTargetingFromSalience } = await import(
        '../../../src/bedrock/consoles/PromptWorkshop/utils/TargetingInference'
      );
      
      const result = inferTargetingFromSalience(
        ['technical'],
        'Implementation details of distributed architecture'
      );
      
      expect(result.suggestedStages).toContain('genesis');
      expect(result.suggestedStages).toContain('exploration');
      expect(result.reasoning).toBeTruthy();
    });

    it('infers stages from philosophical salience', async () => {
      const { inferTargetingFromSalience } = await import(
        '../../../src/bedrock/consoles/PromptWorkshop/utils/TargetingInference'
      );
      
      const result = inferTargetingFromSalience(
        ['philosophical'],
        'Ethical implications of AI observation'
      );
      
      expect(result.suggestedStages).toContain('synthesis');
      expect(result.lensAffinities.some(l => l.lensId === 'academic')).toBe(true);
    });

    it('returns lens affinities with weights', async () => {
      const { inferTargetingFromSalience } = await import(
        '../../../src/bedrock/consoles/PromptWorkshop/utils/TargetingInference'
      );
      
      const result = inferTargetingFromSalience(
        ['technical', 'economic'],
        'Cost-benefit analysis of hybrid architecture'
      );
      
      expect(result.lensAffinities.length).toBeGreaterThan(0);
      expect(result.lensAffinities.every(l => 
        l.weight >= 0 && l.weight <= 1
      )).toBe(true);
    });

    it('always includes genesis stage', async () => {
      const { inferTargetingFromSalience } = await import(
        '../../../src/bedrock/consoles/PromptWorkshop/utils/TargetingInference'
      );
      
      // Even with empty salience
      const result = inferTargetingFromSalience([], '');
      
      expect(result.suggestedStages).toContain('genesis');
    });
  });

  // --------------------------------------------------------------------------
  // Epic 4: Server-side Targeting Inference (lib/targeting-inference.js)
  // --------------------------------------------------------------------------
  describe('lib/targeting-inference.js', () => {
    it('exports inferTargetingFromSalience function', async () => {
      // This tests the server-side JS module
      const module = await import('../../../lib/targeting-inference.js');
      
      expect(typeof module.inferTargetingFromSalience).toBe('function');
    });

    it('produces consistent results with TypeScript version', async () => {
      const tsModule = await import(
        '../../../src/bedrock/consoles/PromptWorkshop/utils/TargetingInference'
      );
      const jsModule = await import('../../../lib/targeting-inference.js');
      
      const salience = ['technical', 'economic'];
      const interesting = 'Test case';
      
      const tsResult = tsModule.inferTargetingFromSalience(salience, interesting);
      const jsResult = jsModule.inferTargetingFromSalience(salience, interesting);
      
      // Stages should match
      expect(jsResult.suggestedStages).toEqual(tsResult.suggestedStages);
    });
  });

  // --------------------------------------------------------------------------
  // Integration: QA Starter Prompts
  // --------------------------------------------------------------------------
  describe('QA starter prompts', () => {
    it('generates prepend format for too_broad', async () => {
      const { generateCopilotStarterPrompt } = await import(
        '../../../src/core/copilot/PromptQAActions'
      );
      
      const issue = {
        type: 'too_broad' as const,
        description: 'Prompt is too broad',
        severity: 'warning' as const,
        autoFixAvailable: true,
      };
      
      const result = generateCopilotStarterPrompt(issue, 'Original prompt');
      
      expect(result).toMatch(/^prepend/i);
      expect(result).toContain('Specifically');
    });

    it('generates prepend format for missing_context', async () => {
      const { generateCopilotStarterPrompt } = await import(
        '../../../src/core/copilot/PromptQAActions'
      );
      
      const issue = {
        type: 'missing_context' as const,
        description: 'Missing context',
        severity: 'warning' as const,
        autoFixAvailable: true,
      };
      
      const result = generateCopilotStarterPrompt(issue, 'Original prompt');
      
      expect(result).toMatch(/^prepend/i);
      expect(result).toContain('Grove');
    });
  });
});
