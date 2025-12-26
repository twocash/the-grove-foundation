// src/core/commands/resolvers/lens.ts
// Lens Resolver - Fuzzy matches lens names/IDs
// Sprint: terminal-kinetic-commands-v1

import { Resolver, ResolverContext, ResolveResult, Suggestion } from './types';

export const lensResolver: Resolver<string> = {
  type: 'lens',

  resolve(value: string, context: ResolverContext): ResolveResult<string> {
    // Get built-in personas from schema
    const builtIn = Object.values(context.schema?.personas ?? {}).filter(p => p.enabled);
    const custom = context.customLenses || [];
    const allLenses = [
      ...builtIn.map(p => ({ id: p.id, label: p.publicLabel })),
      ...custom.map(c => ({ id: c.id, label: c.publicLabel }))
    ];

    if (allLenses.length === 0) {
      return { success: false, error: 'No lenses available' };
    }

    const v = value.toLowerCase();

    // Exact ID match
    const exactId = allLenses.find(l => l.id.toLowerCase() === v);
    if (exactId) return { success: true, value: exactId.id };

    // Exact label match
    const exactLabel = allLenses.find(l => l.label.toLowerCase() === v);
    if (exactLabel) return { success: true, value: exactLabel.id };

    // Fuzzy match
    const fuzzy = allLenses.filter(l =>
      l.label.toLowerCase().includes(v) ||
      l.id.toLowerCase().includes(v)
    );

    if (fuzzy.length === 1) {
      return { success: true, value: fuzzy[0].id };
    }

    if (fuzzy.length > 1) {
      return {
        success: false,
        error: `Multiple lenses match "${value}"`,
        suggestions: fuzzy.slice(0, 5).map(l => l.label)
      };
    }

    return {
      success: false,
      error: `Lens "${value}" not found`,
      suggestions: allLenses.slice(0, 3).map(l => l.label)
    };
  },

  getSuggestions(partial: string, context: ResolverContext): Suggestion[] {
    // Get built-in personas from schema
    const builtIn = Object.values(context.schema?.personas ?? {})
      .filter(p => p.enabled)
      .map(p => ({ id: p.id, label: p.publicLabel, icon: p.icon }));
    const custom = context.customLenses || [];
    const allLenses = [
      ...builtIn,
      ...custom.map(c => ({ id: c.id, label: c.publicLabel, icon: 'Sparkles' }))
    ];

    const p = partial.toLowerCase();

    return allLenses
      .filter(l =>
        !partial ||
        l.label.toLowerCase().includes(p) ||
        l.id.toLowerCase().includes(p)
      )
      .slice(0, 10)
      .map(l => ({
        value: l.id,
        label: l.label,
        icon: l.icon
      }));
  }
};
