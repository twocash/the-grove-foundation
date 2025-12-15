// Thread Generation Utilities for Narrative Engine v2
// AI-powered journey building based on persona arc emphasis

import { Card, Persona, NarrativeSchemaV2 } from '../data/narratives-schema';

// Map section IDs to narrative phases
const SECTION_TO_PHASE: Record<string, keyof Persona['arcEmphasis']> = {
  'stakes': 'stakes',
  'ratchet': 'stakes',
  'what_is_grove': 'hook',
  'architecture': 'mechanics',
  'economics': 'evidence',
  'differentiation': 'evidence',
  'network': 'mechanics',
  'get_involved': 'resolution'
};

// Default phase for cards without a section
const DEFAULT_PHASE: keyof Persona['arcEmphasis'] = 'hook';

/**
 * Score a card based on how well it matches a persona's arc emphasis
 */
function scoreCardForPersona(card: Card, persona: Persona): number {
  // Get the narrative phase this card maps to
  const phase = card.sectionId
    ? SECTION_TO_PHASE[card.sectionId] || DEFAULT_PHASE
    : DEFAULT_PHASE;

  // Return the persona's emphasis for this phase (1-4)
  return persona.arcEmphasis[phase];
}

/**
 * Order a list of card IDs by narrative arc
 * Follows: hook -> stakes -> mechanics -> evidence -> resolution
 */
function orderByNarrativeArc(
  cardIds: string[],
  cards: Record<string, Card>,
  persona: Persona
): string[] {
  const phaseOrder: (keyof Persona['arcEmphasis'])[] = [
    'hook',
    'stakes',
    'mechanics',
    'evidence',
    'resolution'
  ];

  // Adjust order based on persona's opening phase
  const openingIndex = phaseOrder.indexOf(persona.openingPhase);
  const adjustedOrder = [
    ...phaseOrder.slice(openingIndex),
    ...phaseOrder.slice(0, openingIndex)
  ];

  // Sort cards by their phase in the adjusted order
  return cardIds.slice().sort((a, b) => {
    const cardA = cards[a];
    const cardB = cards[b];
    if (!cardA || !cardB) return 0;

    const phaseA = cardA.sectionId
      ? SECTION_TO_PHASE[cardA.sectionId] || DEFAULT_PHASE
      : DEFAULT_PHASE;
    const phaseB = cardB.sectionId
      ? SECTION_TO_PHASE[cardB.sectionId] || DEFAULT_PHASE
      : DEFAULT_PHASE;

    return adjustedOrder.indexOf(phaseA) - adjustedOrder.indexOf(phaseB);
  });
}

/**
 * Generate an optimal thread sequence for a persona
 */
export function generateThread(
  personaId: string,
  schema: NarrativeSchemaV2
): string[] {
  const persona = schema.personas[personaId];
  if (!persona) return [];

  const allCards = Object.values(schema.cards);

  // Filter cards visible to this persona
  const personaCards = allCards.filter(card =>
    card.personas.includes(personaId) || card.personas.includes('all')
  );

  if (personaCards.length === 0) return [];

  // 1. Start with persona's configured entry points or find suitable ones
  let entryCard: Card | undefined;
  if (persona.entryPoints?.length > 0) {
    entryCard = personaCards.find(c => persona.entryPoints.includes(c.id));
  }

  // Fallback: find a card with isEntry flag or high hook score
  if (!entryCard) {
    entryCard = personaCards.find(c => c.isEntry) ||
                personaCards.reduce((best, card) => {
                  const score = scoreCardForPersona(card, persona);
                  const bestScore = best ? scoreCardForPersona(best, persona) : 0;
                  return score > bestScore ? card : best;
                }, personaCards[0]);
  }

  if (!entryCard) return [];

  // 2. Score all remaining cards
  const remainingCards = personaCards.filter(c => c.id !== entryCard!.id);
  const scored = remainingCards.map(card => ({
    id: card.id,
    score: scoreCardForPersona(card, persona)
  }));

  // 3. Sort by score (descending), take top N-1
  const sorted = scored.sort((a, b) => b.score - a.score);
  const maxCards = persona.defaultThreadLength - 1;
  const topCards = sorted.slice(0, maxCards).map(s => s.id);

  // 4. Build thread starting with entry card
  const threadIds = [entryCard.id, ...topCards];

  // 5. Reorder by narrative arc
  return orderByNarrativeArc(threadIds, schema.cards, persona);
}

/**
 * Find personas that have the most overlap with visited cards
 * Used for "same topic, new lens" suggestions at journey end
 */
export function suggestLenses(
  visitedCardIds: string[],
  currentLensId: string | null,
  schema: NarrativeSchemaV2
): string[] {
  const personas = Object.values(schema.personas);

  // Calculate overlap score for each persona
  const scores = personas
    .filter(p => p.id !== currentLensId && p.enabled)
    .map(persona => {
      const overlap = visitedCardIds.filter(cardId => {
        const card = schema.cards[cardId];
        if (!card) return false;
        return card.personas.includes(persona.id) || card.personas.includes('all');
      }).length;

      return { id: persona.id, overlap };
    });

  // Sort by overlap (descending) and return top 3
  return scores
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 3)
    .map(s => s.id);
}

/**
 * Suggest new topics for the current lens (cards not yet visited)
 */
export function suggestNewTopics(
  visitedCardIds: string[],
  currentLensId: string,
  schema: NarrativeSchemaV2,
  maxSuggestions: number = 2
): Card[] {
  const persona = schema.personas[currentLensId];
  if (!persona) return [];

  const allCards = Object.values(schema.cards);

  // Filter to persona's cards that haven't been visited
  const unvisitedCards = allCards.filter(card =>
    !visitedCardIds.includes(card.id) &&
    (card.personas.includes(currentLensId) || card.personas.includes('all'))
  );

  // Prefer entry points and cards with high persona alignment
  const scored = unvisitedCards.map(card => ({
    card,
    score: (card.isEntry ? 10 : 0) +
           (persona.entryPoints?.includes(card.id) ? 20 : 0) +
           scoreCardForPersona(card, persona)
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions)
    .map(s => s.card);
}

/**
 * Detect which persona would be best for a given topic/card
 * Used for no-lens nudging
 */
export function detectBestLens(
  currentCardId: string | null,
  recentCardIds: string[],
  schema: NarrativeSchemaV2
): string | null {
  const personas = Object.values(schema.personas).filter(p => p.enabled);
  if (personas.length === 0) return null;

  const relevantCardIds = currentCardId
    ? [currentCardId, ...recentCardIds]
    : recentCardIds;

  if (relevantCardIds.length === 0) return null;

  // Find persona with highest relevance to recent cards
  const scores = personas.map(persona => {
    const relevance = relevantCardIds.filter(cardId => {
      const card = schema.cards[cardId];
      if (!card) return false;
      return card.personas.includes(persona.id);
    }).length;

    return { id: persona.id, relevance };
  });

  const best = scores.sort((a, b) => b.relevance - a.relevance)[0];
  return best && best.relevance > 0 ? best.id : personas[0]?.id || null;
}
