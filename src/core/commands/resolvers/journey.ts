// src/core/commands/resolvers/journey.ts
// Journey Resolver - Fuzzy matches journey names/IDs
// Sprint: terminal-kinetic-commands-v1

import { Resolver, ResolverContext, ResolveResult, Suggestion } from './types';

export const journeyResolver: Resolver<string> = {
  type: 'journey',

  resolve(value: string, context: ResolverContext): ResolveResult<string> {
    const journeys = Object.values(context.schema?.journeys ?? {});

    if (journeys.length === 0) {
      return { success: false, error: 'No journeys available' };
    }

    const v = value.toLowerCase();

    // Exact ID match
    const exactId = journeys.find(j => j.id.toLowerCase() === v);
    if (exactId) return { success: true, value: exactId.id };

    // Exact title match
    const exactTitle = journeys.find(j => j.title.toLowerCase() === v);
    if (exactTitle) return { success: true, value: exactTitle.id };

    // Fuzzy match
    const fuzzy = journeys.filter(j =>
      j.title.toLowerCase().includes(v) ||
      j.id.toLowerCase().includes(v)
    );

    if (fuzzy.length === 1) {
      return { success: true, value: fuzzy[0].id };
    }

    if (fuzzy.length > 1) {
      return {
        success: false,
        error: `Multiple journeys match "${value}"`,
        suggestions: fuzzy.slice(0, 5).map(j => j.title)
      };
    }

    return {
      success: false,
      error: `Journey "${value}" not found`,
      suggestions: journeys.slice(0, 3).map(j => j.title)
    };
  },

  getSuggestions(partial: string, context: ResolverContext): Suggestion[] {
    const journeys = Object.values(context.schema?.journeys ?? {});
    const p = partial.toLowerCase();

    return journeys
      .filter(j =>
        j.status === 'active' && (
          !partial ||
          j.title.toLowerCase().includes(p) ||
          j.id.toLowerCase().includes(p)
        )
      )
      .slice(0, 10)
      .map(j => ({
        value: j.id,
        label: j.title,
        icon: 'map'
      }));
  }
};
