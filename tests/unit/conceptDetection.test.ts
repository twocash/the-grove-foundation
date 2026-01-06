import { describe, it, expect } from 'vitest';
import { detectConcepts, getCoreConceptDefinition } from '@core/extraction/conceptDetection';

describe('detectConcepts', () => {
  const sampleText = `
    The Grove project implements distributed ownership of AI infrastructure.
    Using a hybrid architecture, agents can leverage local inference for routine
    tasks while accessing cloud APIs for pivotal moments. The credit economy
    ensures that distributed ownership benefits all participants.
  `;

  it('detects known Grove concepts', async () => {
    const concepts = await detectConcepts(sampleText);
    expect(concepts.length).toBeGreaterThan(0);

    const terms = concepts.map((c) => c.term);
    expect(terms).toContain('distributed ownership');
    expect(terms).toContain('hybrid architecture');
  });

  it('returns empty array for text without concepts', async () => {
    const concepts = await detectConcepts('The weather is nice today.');
    expect(concepts).toEqual([]);
  });

  it('respects confidence threshold', async () => {
    const concepts = await detectConcepts(sampleText, { minConfidence: 0.9 });
    for (const concept of concepts) {
      expect(concept.confidence).toBeGreaterThanOrEqual(0.9);
    }
  });

  it('limits to maxConcepts', async () => {
    const concepts = await detectConcepts(sampleText, { maxConcepts: 2 });
    expect(concepts.length).toBeLessThanOrEqual(2);
  });

  it('includes context excerpt', async () => {
    const concepts = await detectConcepts(sampleText);
    for (const concept of concepts) {
      expect(concept.contextExcerpt).toBeTruthy();
      expect(concept.contextExcerpt.toLowerCase()).toContain(concept.term.toLowerCase());
    }
  });

  it('includes trigger suggestions', async () => {
    const concepts = await detectConcepts(sampleText);
    for (const concept of concepts) {
      expect(concept.suggestedTriggers.length).toBeGreaterThan(0);
      expect(concept.suggestedTriggers[0].matchMode).toBe('exact');
    }
  });

  it('sorts by confidence descending', async () => {
    const concepts = await detectConcepts(sampleText);
    for (let i = 1; i < concepts.length; i++) {
      expect(concepts[i - 1].confidence).toBeGreaterThanOrEqual(concepts[i].confidence);
    }
  });

  it('counts frequency correctly', async () => {
    const concepts = await detectConcepts(sampleText);
    const distributed = concepts.find((c) => c.term === 'distributed ownership');
    // "distributed ownership" appears twice in sampleText
    expect(distributed?.frequency).toBe(2);
  });
});

describe('getCoreConceptDefinition', () => {
  it('returns definition for known concept', () => {
    const def = getCoreConceptDefinition('distributed ownership');
    expect(def).toBeTruthy();
    expect(def).toContain('distributed');
  });

  it('is case insensitive', () => {
    const def = getCoreConceptDefinition('DISTRIBUTED OWNERSHIP');
    expect(def).toBeTruthy();
  });

  it('returns undefined for unknown concept', () => {
    const def = getCoreConceptDefinition('unknown concept xyz');
    expect(def).toBeUndefined();
  });
});
