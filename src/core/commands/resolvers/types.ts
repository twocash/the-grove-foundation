// src/core/commands/resolvers/types.ts
// Resolver Type Definitions
// Sprint: terminal-kinetic-commands-v1

import type { NarrativeSchemaV2 } from '@core/schema';
import type { ArgType } from '../schema';

export interface ResolverContext {
  schema: NarrativeSchemaV2 | null;
  customLenses: Array<{ id: string; publicLabel: string }>;
}

export type ResolveResult<T> =
  | { success: true; value: T }
  | { success: false; error: string; suggestions?: string[] };

export interface Suggestion {
  value: string;
  label: string;
  icon?: string;
}

export interface Resolver<T = unknown> {
  type: ArgType;
  resolve(value: string, context: ResolverContext): ResolveResult<T>;
  getSuggestions(partial: string, context: ResolverContext): Suggestion[];
}
