// src/core/commands/resolvers/index.ts
// Resolver Registry
// Sprint: terminal-kinetic-commands-v1

import { ArgType } from '../schema';
import { Resolver, ResolverContext, ResolveResult, Suggestion } from './types';
import { journeyResolver } from './journey';
import { lensResolver } from './lens';

// Simple string resolver (pass-through)
const stringResolver: Resolver<string> = {
  type: 'string',
  resolve(value: string): ResolveResult<string> {
    return { success: true, value };
  },
  getSuggestions(): Suggestion[] {
    return [];
  }
};

// Number resolver
const numberResolver: Resolver<number> = {
  type: 'number',
  resolve(value: string): ResolveResult<number> {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { success: false, error: `"${value}" is not a valid number` };
    }
    return { success: true, value: num };
  },
  getSuggestions(): Suggestion[] {
    return [];
  }
};

// Boolean resolver
const booleanResolver: Resolver<boolean> = {
  type: 'boolean',
  resolve(value: string): ResolveResult<boolean> {
    const v = value.toLowerCase();
    if (['true', 'yes', '1', 'on'].includes(v)) {
      return { success: true, value: true };
    }
    if (['false', 'no', '0', 'off'].includes(v)) {
      return { success: true, value: false };
    }
    return { success: false, error: `"${value}" is not a valid boolean` };
  },
  getSuggestions(): Suggestion[] {
    return [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ];
  }
};

export const RESOLVERS: Record<ArgType, Resolver> = {
  string: stringResolver,
  journey: journeyResolver,
  lens: lensResolver,
  number: numberResolver,
  boolean: booleanResolver,
};

export type { ResolverContext, ResolveResult, Suggestion } from './types';
