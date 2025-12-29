// src/core/transformers/JourneyOfferParser.ts
// Extract <journey_offer> tags from LLM output
// Sprint: journey-offer-v1

import type { JourneyOfferStreamItem, JourneyOfferStatus } from '../schema/stream';

export interface ParsedJourneyOffer {
  offer: JourneyOfferStreamItem | null;
  cleanContent: string;
}

const JOURNEY_OFFER_REGEX = /<journey_offer\s+([^>]+)\/>/i;

export function parseJourneyOffer(
  rawContent: string,
  sourceResponseId: string
): ParsedJourneyOffer {
  if (!rawContent) {
    return { offer: null, cleanContent: '' };
  }

  const match = rawContent.match(JOURNEY_OFFER_REGEX);

  if (!match) {
    return { offer: null, cleanContent: rawContent };
  }

  const attributeString = match[1];
  const cleanContent = rawContent.replace(JOURNEY_OFFER_REGEX, '').trim();

  const offer = parseAttributes(attributeString, sourceResponseId);

  return { offer, cleanContent };
}

function parseAttributes(
  attrString: string,
  sourceResponseId: string
): JourneyOfferStreamItem | null {
  const attrs: Record<string, string> = {};

  const attrRegex = /(\w+)="([^"]+)"/g;
  let attrMatch;
  while ((attrMatch = attrRegex.exec(attrString)) !== null) {
    attrs[attrMatch[1]] = attrMatch[2];
  }

  const journeyId = attrs.id || attrs.journey;
  if (!journeyId) {
    console.warn('[JourneyOfferParser] Missing journey id');
    return null;
  }

  return {
    id: `journey_offer_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type: 'journey_offer',
    timestamp: Date.now(),
    journeyId,
    journeyName: attrs.name || formatJourneyName(journeyId),
    reason: attrs.reason || '',
    previewText: attrs.preview || '',
    estimatedMinutes: attrs.minutes ? parseInt(attrs.minutes, 10) : undefined,
    status: 'pending' as JourneyOfferStatus,
    sourceResponseId
  };
}

function formatJourneyName(journeyId: string): string {
  return journeyId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
