// src/data/quantum-content.ts
// Superposition Map: Maps lens IDs to content realities
// v0.13: The Quantum Interface
// v0.14+: Fallback content - schema.lensRealities takes precedence if available
// v0.15: Updated fallbacks to match narratives.json (2025-12-20)

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
        text: "This is the new version of learning to code... adaptability and continuous learning would be the most valuable skills.",
        author: "SAM ALTMAN",
        title: "OPENAI CEO"
      },
      {
        text: "I advise ordinary citizens to learn to use AI.",
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
// COLLAPSED REALITIES (Lens-specific fallback content)
// NOTE: schema.lensRealities in narratives.json takes precedence over these
// ============================================================================

export const SUPERPOSITION_MAP: Partial<Record<ArchetypeId, LensReality>> = {

  // FREESTYLE REALITY
  'freestyle': {
    hero: {
      headline: "OWN YOUR AI.",
      subtext: [
        "Don't rent it.",
        "Grow your own."
      ]
    },
    problem: {
      quotes: [
        {
          text: "The most profound technologies disappear. They weave themselves into the fabric of everyday life.",
          author: "MARK WEISER",
          title: "XEROX PARC"
        },
        {
          text: "We shape our tools, and thereafter our tools shape us.",
          author: "MARSHALL MCLUHAN",
          title: "MEDIA THEORIST"
        },
        {
          text: "The question isn't whether AI will change everything. It's who gets to decide how.",
          author: "GROVE THESIS",
          title: "2025"
        }
      ],
      tension: [
        "They're building the future of intelligence.",
        "We're building who gets to own it."
      ]
    }
  },

  // CONCERNED CITIZEN REALITY
  'concerned-citizen': {
    hero: {
      headline: "ADAPT? ADAPT AND OWN.",
      subtext: [
        "They say learn to use AI.",
        "We say learn to own it."
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
          text: "This is the new version of learning to code... adaptability and continuous learning would be the most valuable skills.",
          author: "SAM ALTMAN",
          title: "OPENAI CEO"
        },
        {
          text: "I advise ordinary citizens to learn to use AI.",
          author: "DARIO AMODEI",
          title: "ANTHROPIC CEO"
        }
      ],
      tension: [
        "They tell you to 'adapt.'",
        "We say: own it instead."
      ]
    }
  },

  // ACADEMIC REALITY
  'academic': {
    hero: {
      headline: "THE EPISTEMIC COMMONS.",
      subtext: [
        "Knowledge shouldn't be enclosed.",
        "Neither should intelligence."
      ]
    },
    problem: {
      quotes: [
        {
          text: "The enclosure of AI research threatens scientific progress and public accountability.",
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
          title: "ALGORITHMIC JUSTICE LEAGUE"
        }
      ],
      tension: [
        "The enclosure of the digital commons is accelerating.",
        "We are building the library, not the bookstore."
      ]
    }
  },

  // ENGINEER REALITY
  'engineer': {
    hero: {
      headline: "LOCAL HUMS. CLOUD BREAKS THROUGH.",
      subtext: [
        "7B for routine. Frontier for insight.",
        "Both owned."
      ]
    },
    problem: {
      quotes: [
        {
          text: "We are constrained by thermal density and power distribution.",
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

  // GEOPOLITICAL REALITY
  'geopolitical': {
    hero: {
      headline: "SOVEREIGN INTELLIGENCE.",
      subtext: [
        "Not American. Not Chinese. Not corporate.",
        "Distributed."
      ]
    },
    problem: {
      quotes: [
        {
          text: "AI will be the most transformative and potentially dangerous technology in human history.",
          author: "HENRY KISSINGER",
          title: "FORMER SECRETARY OF STATE"
        },
        {
          text: "The nation that leads in AI will rule the world.",
          author: "VLADIMIR PUTIN",
          title: "RUSSIAN PRESIDENT"
        },
        {
          text: "We are in a period of geopolitical competition defined by who controls critical technologies.",
          author: "JAKE SULLIVAN",
          title: "NSC ADVISOR"
        }
      ],
      tension: [
        "They concentrate power in data centers with flags.",
        "We distribute it across borders."
      ]
    }
  },

  // BIG AI EXEC REALITY
  'big-ai-exec': {
    hero: {
      headline: "THE EDGE HEDGE.",
      subtext: [
        "Frontier capability. Edge economics.",
        "The margin is in the middle."
      ]
    },
    problem: {
      quotes: [
        {
          text: "The economics of AI will fundamentally reshape enterprise software.",
          author: "SATYA NADELLA",
          title: "MICROSOFT CEO"
        },
        {
          text: "Infrastructure companies capture value at every layer of the stack.",
          author: "MARC ANDREESSEN",
          title: "A16Z"
        },
        {
          text: "The real competition isn't models—it's distribution.",
          author: "TECH STRATEGY MEMO",
          title: "Q4 2024"
        }
      ],
      tension: [
        "You're in a capex arms race for data center capacity.",
        "We're building the network that doesn't need one."
      ]
    }
  },

  // FAMILY OFFICE / INVESTOR REALITY
  'family-office': {
    hero: {
      headline: "THE EDGE HEDGE.",
      subtext: [
        "Three companies will control intelligence.",
        "What's your hedge?"
      ]
    },
    problem: {
      quotes: [
        {
          text: "The infrastructure layer always captures disproportionate value over time.",
          author: "TECH INVESTMENT THESIS",
          title: "FAMILY OFFICE MEMO"
        },
        {
          text: "Sovereign AI is the only hedge against platform risk.",
          author: "MACRO STRATEGY",
          title: "GLOBAL FUND"
        },
        {
          text: "Ownership of the weights is ownership of the future.",
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
