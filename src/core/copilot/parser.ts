// src/core/copilot/parser.ts
// Natural language intent parsing

import type { ParsedIntent, IntentPattern, IntentType } from './schema';

const INTENT_PATTERNS: IntentPattern[] = [
  // UPDATE_FIELD patterns (with modifiers) - must be before SET_FIELD
  {
    regex: /^(?:make|set)\s+(?:the\s+)?(\w+)\s+(shorter|longer|more\s+\w+|less\s+\w+)$/i,
    intent: 'UPDATE_FIELD',
    extract: (match) => ({ field: match[1].toLowerCase(), modifier: match[2].toLowerCase() }),
  },
  // SET_FIELD patterns
  {
    regex: /^(?:set|change|update)\s+(?:the\s+)?(\w+)\s+to\s+['"]?(.+?)['"]?$/i,
    intent: 'SET_FIELD',
    extract: (match) => ({ field: match[1].toLowerCase(), value: match[2] }),
  },
  {
    regex: /^(?:make|set)\s+(?:the\s+)?(\w+)\s+['"]?(.+?)['"]?$/i,
    intent: 'SET_FIELD',
    extract: (match) => ({ field: match[1].toLowerCase(), value: match[2] }),
  },
  // ADD_TAG patterns
  {
    regex: /^add\s+(?:a\s+)?tag\s+['"]?(.+?)['"]?$/i,
    intent: 'ADD_TAG',
    extract: (match) => ({ value: match[1] }),
  },
  {
    regex: /^tag\s+(?:this\s+)?(?:as\s+)?['"]?(.+?)['"]?$/i,
    intent: 'ADD_TAG',
    extract: (match) => ({ value: match[1] }),
  },
  // REMOVE_TAG patterns
  {
    regex: /^remove\s+(?:the\s+)?tag\s+['"]?(.+?)['"]?$/i,
    intent: 'REMOVE_TAG',
    extract: (match) => ({ value: match[1] }),
  },
  {
    regex: /^untag\s+['"]?(.+?)['"]?$/i,
    intent: 'REMOVE_TAG',
    extract: (match) => ({ value: match[1] }),
  },
  // TOGGLE_FAVORITE patterns
  {
    regex: /^(?:mark|set)\s+(?:as\s+)?favorite$/i,
    intent: 'TOGGLE_FAVORITE',
    extract: () => ({ value: true }),
  },
  {
    regex: /^(?:add\s+to|make)\s+favorites?$/i,
    intent: 'TOGGLE_FAVORITE',
    extract: () => ({ value: true }),
  },
  {
    regex: /^(?:unmark|remove)\s+(?:from\s+)?favorites?$/i,
    intent: 'TOGGLE_FAVORITE',
    extract: () => ({ value: false }),
  },
  {
    regex: /^unfavorite$/i,
    intent: 'TOGGLE_FAVORITE',
    extract: () => ({ value: false }),
  },
];

/**
 * Parse natural language input into a structured intent
 */
export function parseIntent(input: string): ParsedIntent {
  const normalized = input.trim();

  for (const pattern of INTENT_PATTERNS) {
    const match = normalized.match(pattern.regex);
    if (match) {
      return {
        type: pattern.intent,
        ...pattern.extract(match),
        confidence: 0.9,
      };
    }
  }

  return { type: 'UNKNOWN', confidence: 0 };
}

/**
 * Check if an intent type is supported
 */
export function isSupportedIntent(type: IntentType): boolean {
  return type !== 'UNKNOWN';
}
