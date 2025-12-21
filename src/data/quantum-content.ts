// src/data/quantum-content.ts
// Superposition Map: Maps lens IDs to content realities
// v0.13: The Quantum Interface
// v0.14+: Fallback content - schema.lensRealities takes precedence if available

import { ArchetypeId } from '../../types/lens';
// Re-export types from core schema for backward compatibility
import type { LensReality, HeroContent, TensionContent, LensQuote } from '../core/schema/narrative';
export type { LensReality, HeroContent, TensionContent, LensQuote };

// Legacy Quote type alias for backward compatibility with genesis components
export type Quote = LensQuote;

// ============================================================================
// DEFAULT REALITY (No lens selected)
// ============================================================================

export const DEFAULT_REALITY: LensReality = {
  hero: {
    headline: "YOUR AI.",
    subtext: [
      "Not rented. Not surveilled. Not theirs.",
      "Yours."
    ]
  },
  problem: {
    quotes: [
      {
        text: "AI is the most profound technology humanity has ever worked on... People will need to adapt.",
        author: "SUNDAR PICHAI",
        title: "GOOGLE CEO"
      },
      {
        text: "This is the new version of [learning to code]... adaptability and continuous learning would be the most valuable skills.",
        author: "SAM ALTMAN",
        title: "OPENAI CEO"
      },
      {
        text: "People have adapted to past technological changes... I advise ordinary citizens to learn to use AI.",
        author: "DARIO AMODEI",
        title: "ANTHROPIC CEO"
      }
    ],
    tension: [
      "They're building the future of intelligence.",
      "And they're telling you to get comfortable being a guest in it."
    ]
  }
};

// ============================================================================
// COLLAPSED REALITIES (Lens-specific content)
// ============================================================================

export const SUPERPOSITION_MAP: Partial<Record<ArchetypeId, LensReality>> = {

  // ENGINEER REALITY
  'engineer': {
    hero: {
      headline: "LATENCY IS THE MIND KILLER.",
      subtext: [
        "Distributed inference isn't a pipe dream.",
        "It's a routing problem."
      ]
    },
    problem: {
      quotes: [
        {
          text: "We are constrained by thermal density...",
          author: "MARK ZUCKERBERG",
          title: "META"
        },
        {
          text: "The cost of compute is the primary bottleneck.",
          author: "JENSEN HUANG",
          title: "NVIDIA"
        },
        {
          text: "Centralized models are hitting a data wall.",
          author: "YANN LECUN",
          title: "META AI"
        }
      ],
      tension: [
        "They build moats around data centers.",
        "We build protocols for edge clusters."
      ]
    }
  },

  // ACADEMIC REALITY
  'academic': {
    hero: {
      headline: "THE EPISTEMIC COMMONS.",
      subtext: [
        "Knowledge shouldn't be enclosed.",
        "Intelligence must be open."
      ]
    },
    problem: {
      quotes: [
        {
          text: "The enclosure of AI research threatens scientific progress.",
          author: "MEREDITH WHITTAKER",
          title: "SIGNAL FOUNDATION"
        },
        {
          text: "We need public options for public intelligence.",
          author: "BRUCE SCHNEIER",
          title: "HARVARD KENNEDY SCHOOL"
        },
        {
          text: "Opacity is the enemy of accountability.",
          author: "JOY BUOLAMWINI",
          title: "AJL"
        }
      ],
      tension: [
        "The enclosure of the digital commons is accelerating.",
        "We are building the library, not the bookstore."
      ]
    }
  },

  // INVESTOR (FAMILY OFFICE) REALITY
  'family-office': {
    hero: {
      headline: "COMPOUNDING INTELLIGENCE.",
      subtext: [
        "The most valuable asset of the next century",
        "won't be rented."
      ]
    },
    problem: {
      quotes: [
        {
          text: "Data is the new oil, but intelligence is the engine.",
          author: "TECH INVESTMENT MEMO",
          title: "Q1 2025"
        },
        {
          text: "Sovereign AI is the only hedge against platform risk.",
          author: "MACRO STRATEGY",
          title: "GLOBAL FUND"
        },
        {
          text: "Ownership of the model weights is ownership of the future.",
          author: "VENTURE PARTNER",
          title: "SILICON VALLEY"
        }
      ],
      tension: [
        "Rent-seeking models decay.",
        "Owned infrastructure compounds."
      ]
    }
  }
};

// ============================================================================
// RESOLUTION FUNCTION
// ============================================================================

export const getReality = (lensId: string | null): LensReality => {
  // No lens = default reality
  if (!lensId) return DEFAULT_REALITY;

  // Custom lenses fall back to default (per ADR-005)
  if (lensId.startsWith('custom-')) return DEFAULT_REALITY;

  // Try to find archetype-specific reality
  const reality = SUPERPOSITION_MAP[lensId as ArchetypeId];

  // Fall back to default if archetype not mapped
  return reality || DEFAULT_REALITY;
};
