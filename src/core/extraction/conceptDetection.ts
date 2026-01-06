/**
 * Concept detection for highlight extraction
 * @sprint highlight-extraction-v1
 */
import { EXTRACTION_CONFIG } from './config';
import type { HighlightTrigger } from '@core/context-fields/types';

// Type for core concepts from registry
export interface CoreConcept {
  term: string;
  category: string;
  priority: number;
  definition: string;
}

// Type for detected concept
export interface DetectedConcept {
  term: string;
  frequency: number;
  semanticWeight: number;
  groveSpecificity: number;
  suggestedTriggers: HighlightTrigger[];
  confidence: number;
  contextExcerpt: string;
  definition: string;
}

// Import core concepts
import coreConceptsData from '@data/concepts/groveCoreConcepts.json';

/**
 * Detect highlightable Grove concepts in a document
 */
export async function detectConcepts(
  documentText: string,
  options: {
    minConfidence?: number;
    maxConcepts?: number;
  } = {}
): Promise<DetectedConcept[]> {
  const config = EXTRACTION_CONFIG.highlight;
  const minConfidence = options.minConfidence ?? config.confidenceThreshold;
  const maxConcepts = options.maxConcepts ?? config.maxConceptsPerDoc;

  const coreConcepts: CoreConcept[] = coreConceptsData.concepts;
  const detectedConcepts: DetectedConcept[] = [];

  for (const concept of coreConcepts) {
    const termLower = concept.term.toLowerCase();

    // Count frequency with word boundary awareness
    const regex = new RegExp(
      `\\b${termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
      'gi'
    );
    const matches = documentText.match(regex) || [];
    const frequency = matches.length;

    if (frequency === 0) continue;

    // Calculate confidence score
    const groveSpecificity = 1.0; // In registry = Grove-specific
    const priorityBoost = concept.priority === 1 ? 0.1 : 0;
    const frequencyScore = Math.min(frequency / 5, 1.0) * 0.3;

    const confidence = Math.min(
      groveSpecificity * 0.5 + frequencyScore + priorityBoost + config.coreConceptBoost,
      1.0
    );

    if (confidence < minConfidence) continue;

    // Extract context excerpt around first occurrence
    const textLower = documentText.toLowerCase();
    const firstMatch = textLower.indexOf(termLower);
    const excerptStart = Math.max(0, firstMatch - 150);
    const excerptEnd = Math.min(documentText.length, firstMatch + concept.term.length + 150);
    let contextExcerpt = documentText.slice(excerptStart, excerptEnd);

    // Clean up excerpt
    if (excerptStart > 0) contextExcerpt = '...' + contextExcerpt;
    if (excerptEnd < documentText.length) contextExcerpt = contextExcerpt + '...';

    detectedConcepts.push({
      term: concept.term,
      frequency,
      semanticWeight: 0.8, // Placeholder for embedding-based scoring
      groveSpecificity,
      suggestedTriggers: [{ text: concept.term, matchMode: 'exact' as const }],
      confidence,
      contextExcerpt,
      definition: concept.definition,
    });
  }

  // Sort by confidence descending, limit results
  return detectedConcepts
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxConcepts);
}

/**
 * Get core concept by term
 */
export function getCoreConceptDefinition(term: string): string | undefined {
  const concept = coreConceptsData.concepts.find(
    (c: CoreConcept) => c.term.toLowerCase() === term.toLowerCase()
  );
  return concept?.definition;
}

/**
 * Get all core concepts
 */
export function getAllCoreConcepts(): CoreConcept[] {
  return coreConceptsData.concepts;
}
