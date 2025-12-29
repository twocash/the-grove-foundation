// src/core/transformers/LensOfferParser.ts
// Extract <lens_offer> tags from LLM output
// Sprint: lens-offer-v1

import type { LensOfferStreamItem, LensOfferStatus } from '../schema/stream';

export interface ParsedLensOffer {
  offer: LensOfferStreamItem | null;
  cleanContent: string;
}

const LENS_OFFER_REGEX = /<lens_offer\s+([^>]+)\/>/i;

export function parseLensOffer(
  rawContent: string,
  sourceResponseId: string
): ParsedLensOffer {
  if (!rawContent) {
    return { offer: null, cleanContent: '' };
  }

  const match = rawContent.match(LENS_OFFER_REGEX);

  if (!match) {
    return { offer: null, cleanContent: rawContent };
  }

  const attributeString = match[1];
  const cleanContent = rawContent.replace(LENS_OFFER_REGEX, '').trim();

  const offer = parseAttributes(attributeString, sourceResponseId);

  return { offer, cleanContent };
}

function parseAttributes(
  attrString: string,
  sourceResponseId: string
): LensOfferStreamItem | null {
  const attrs: Record<string, string> = {};

  const attrRegex = /(\w+)="([^"]+)"/g;
  let attrMatch;
  while ((attrMatch = attrRegex.exec(attrString)) !== null) {
    attrs[attrMatch[1]] = attrMatch[2];
  }

  const lensId = attrs.id || attrs.lens;
  if (!lensId) {
    console.warn('[LensOfferParser] Missing lens id');
    return null;
  }

  return {
    id: `lens_offer_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type: 'lens_offer',
    timestamp: Date.now(),
    lensId,
    lensName: attrs.name || formatLensName(lensId),
    reason: attrs.reason || '',
    previewText: attrs.preview || '',
    status: 'pending' as LensOfferStatus,
    sourceResponseId
  };
}

function formatLensName(lensId: string): string {
  return lensId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') + ' Lens';
}
