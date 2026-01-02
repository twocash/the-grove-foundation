// src/core/context-fields/generator.ts
// Rule-based prompt generator (no LLM for Genesis)
// Sprint: genesis-context-fields-v1 (Epic 5)
// Per ADR-007: Simple rule-based generator proves the architecture

import type { PromptObject, ContextState, GenerationContext } from './types';
import type { SessionTelemetry } from './telemetry';
import { captureSessionTelemetry } from './telemetry';

/**
 * Generation rules for different scenarios
 */
interface GenerationRule {
  id: string;
  name: string;
  condition: (telemetry: SessionTelemetry, context: ContextState) => boolean;
  generate: (telemetry: SessionTelemetry, context: ContextState) => PromptObject | null;
}

/**
 * Topic label mapping for human-readable prompts
 */
const TOPIC_LABELS: Record<string, string> = {
  'ratchet-effect': 'the Ratchet Effect',
  'infrastructure-bet': 'the $380 billion infrastructure bet',
  'distributed-systems': 'distributed AI systems',
  'governance': 'community governance',
  'technical-arch': 'Grove\'s technical architecture',
  'cognitive-split': 'the cognitive split between local and cloud AI',
  'observer-dynamic': 'the observer dynamic',
  'meta-philosophy': 'Grove\'s meta-philosophy',
};

/**
 * Rule-based prompt generator
 * Generates prompts from session telemetry using heuristics
 */
export class PromptGenerator {
  private cache: Map<string, PromptObject[]> = new Map();
  private rules: GenerationRule[] = [];

  constructor() {
    this.initializeRules();
  }

  private initializeRules(): void {
    // Rule 1: Suggest unexplored topics
    this.rules.push({
      id: 'unexplored-topic',
      name: 'Suggest Unexplored Topic',
      condition: (telemetry) => telemetry.unexploredTopics.length > 0,
      generate: (telemetry, context) => {
        const topicId = telemetry.unexploredTopics[0];
        const topicLabel = TOPIC_LABELS[topicId] || topicId;

        return this.createPrompt({
          id: `gen-explore-${topicId}-${Date.now()}`,
          label: `What about ${topicLabel}?`,
          description: `You haven't explored ${topicLabel} yet`,
          executionPrompt: `Explain ${topicLabel} and how it connects to what we've discussed so far about Grove.`,
          tags: ['generated', 'exploration', topicId],
          topicAffinities: [{ topicId, weight: 0.9 }],
          targeting: {
            stages: [context.stage],
            minInteractions: 2,
          },
          baseWeight: 70,
          generatedFrom: this.createGenerationContext(telemetry, 'unexplored-topic'),
        });
      },
    });

    // Rule 2: Deepen last topic
    this.rules.push({
      id: 'deepen-topic',
      name: 'Deepen Last Topic',
      condition: (telemetry) => telemetry.lastTopicId !== null && telemetry.exchangeCount >= 3,
      generate: (telemetry, context) => {
        const topicId = telemetry.lastTopicId!;
        const topicLabel = TOPIC_LABELS[topicId] || topicId;

        return this.createPrompt({
          id: `gen-deepen-${topicId}-${Date.now()}`,
          label: `Go deeper on ${topicLabel}`,
          description: `Explore the nuances and implications`,
          executionPrompt: `Take me deeper into ${topicLabel}. What are the subtle implications and edge cases I should understand?`,
          tags: ['generated', 'depth', topicId],
          topicAffinities: [{ topicId, weight: 1.0 }],
          targeting: {
            stages: ['exploration', 'synthesis'],
            minInteractions: 3,
          },
          baseWeight: 65,
          generatedFrom: this.createGenerationContext(telemetry, 'deepen-topic'),
        });
      },
    });

    // Rule 3: Connect topics (when 2+ explored)
    this.rules.push({
      id: 'connect-topics',
      name: 'Connect Explored Topics',
      condition: (telemetry) => telemetry.topicsExplored.length >= 2,
      generate: (telemetry, context) => {
        const [topicA, topicB] = telemetry.topicsExplored.slice(-2);
        const labelA = TOPIC_LABELS[topicA] || topicA;
        const labelB = TOPIC_LABELS[topicB] || topicB;

        return this.createPrompt({
          id: `gen-connect-${topicA}-${topicB}-${Date.now()}`,
          label: `How do ${labelA} and ${labelB} connect?`,
          description: `Synthesize the relationship between topics`,
          executionPrompt: `Explain how ${labelA} connects to ${labelB} in Grove's architecture. What's the deeper relationship?`,
          tags: ['generated', 'synthesis', topicA, topicB],
          topicAffinities: [
            { topicId: topicA, weight: 0.8 },
            { topicId: topicB, weight: 0.8 },
          ],
          targeting: {
            stages: ['exploration', 'synthesis'],
            minInteractions: 4,
          },
          baseWeight: 75,
          generatedFrom: this.createGenerationContext(telemetry, 'connect-topics'),
        });
      },
    });

    // Rule 4: High entropy stabilization
    this.rules.push({
      id: 'stabilize-entropy',
      name: 'Stabilize High Entropy',
      condition: (telemetry, context) => context.entropy > 0.6,
      generate: (telemetry, context) => {
        return this.createPrompt({
          id: `gen-stabilize-${Date.now()}`,
          label: 'What\'s the key insight so far?',
          description: 'Synthesize the conversation',
          executionPrompt: 'Help me synthesize what we\'ve discussed. What\'s the most important insight I should take away?',
          variant: 'subtle',
          tags: ['generated', 'stabilization'],
          topicAffinities: [],
          targeting: {
            stages: ['exploration', 'synthesis'],
            entropyWindow: { min: 0.6 },
          },
          baseWeight: 80,
          generatedFrom: this.createGenerationContext(telemetry, 'stabilize-entropy'),
        });
      },
    });
  }

  /**
   * Generate prompts for a target context
   */
  async generateAhead(targetContext: ContextState): Promise<PromptObject[]> {
    const telemetry = captureSessionTelemetry(
      'current-session',
      targetContext.stage,
      targetContext.topicsExplored,
      targetContext.entropy,
      targetContext.interactionCount
    );

    const generated: PromptObject[] = [];

    for (const rule of this.rules) {
      if (rule.condition(telemetry, targetContext)) {
        const prompt = rule.generate(telemetry, targetContext);
        if (prompt) {
          generated.push(prompt);
        }
      }
    }

    // Cache for later retrieval
    const cacheKey = this.getCacheKey(targetContext);
    this.cache.set(cacheKey, generated);

    return generated;
  }

  /**
   * Get cached prompts for current context
   */
  getCached(context: ContextState): PromptObject[] {
    const cacheKey = this.getCacheKey(context);
    return this.cache.get(cacheKey) || [];
  }

  /**
   * Clear all cached prompts
   */
  invalidateCache(): void {
    this.cache.clear();
  }

  private getCacheKey(context: ContextState): string {
    return `${context.stage}-${context.activeLensId || 'none'}-${context.interactionCount}`;
  }

  private createPrompt(partial: Partial<PromptObject> & { id: string; label: string; executionPrompt: string }): PromptObject {
    const now = Date.now();
    return {
      objectType: 'prompt',
      created: now,
      modified: now,
      author: 'generated',
      description: '',
      tags: [],
      topicAffinities: [],
      lensAffinities: [],
      targeting: {},
      stats: {
        impressions: 0,
        selections: 0,
        completions: 0,
        avgEntropyDelta: 0,
        avgDwellAfter: 0,
      },
      status: 'active',
      source: 'generated',
      ...partial,
    };
  }

  private createGenerationContext(telemetry: SessionTelemetry, ruleId: string): GenerationContext {
    return {
      sessionId: telemetry.sessionId,
      telemetrySnapshot: {
        stage: telemetry.currentStage,
        topicsExplored: telemetry.topicsExplored,
        unexploredTopics: telemetry.unexploredTopics,
        entropy: telemetry.averageEntropy,
        exchangeCount: telemetry.exchangeCount,
      },
      generatedAt: Date.now(),
      reasoning: `Generated by rule: ${ruleId}`,
    };
  }
}

// Singleton instance
let generatorInstance: PromptGenerator | null = null;

export function getPromptGenerator(): PromptGenerator {
  if (!generatorInstance) {
    generatorInstance = new PromptGenerator();
  }
  return generatorInstance;
}
