// src/data/quantum-content.ts
// Superposition Map: Maps lens IDs to content realities
// v0.13: The Quantum Interface
// v0.14+: Fallback content - schema.lensRealities takes precedence if available
// v0.15: Updated fallbacks to match narratives.json (2025-12-20)

import { ArchetypeId } from '../../types/lens';
// Re-export types from core schema for backward compatibility
import type { LensReality, HeroContent, TensionContent, LensQuote, TerminalWelcome } from '../core/schema/narrative';
export type { LensReality, HeroContent, TensionContent, LensQuote, TerminalWelcome };

// Legacy Quote type alias for backward compatibility with genesis components
export type Quote = LensQuote;

// ============================================================================
// DEFAULT TERMINAL WELCOME (Sprint: Terminal Architecture Refactor v1.0)
// ============================================================================

/**
 * Default terminal welcome message shown when no lens is selected
 * or as fallback when a lens doesn't define custom terminal content.
 */
export const DEFAULT_TERMINAL_WELCOME: TerminalWelcome = {
  heading: "The Terminal.",
  thesis: "Everything documented about Grove—the white paper, technical architecture, economic model, advisory council analysis—is indexed here.",
  prompts: [
    "What does \"distributed AI infrastructure\" actually mean?",
    "How does capability propagate from frontier to local?",
    "Why would agents work to improve themselves?"
  ],
  footer: "Or explore freely. The questions lead to each other."
};

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
    },
    terminal: {
      heading: "The Terminal.",
      thesis: "Explore the Grove thesis freely. Ask anything about distributed AI, ownership, and the infrastructure question.",
      prompts: [
        "What is Grove, really?",
        "Why does AI ownership matter?",
        "How is this different from just using ChatGPT?"
      ],
      footer: "No guided path. Just curiosity."
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
    },
    terminal: {
      heading: "The Terminal.",
      thesis: "Plain-language explanations of how distributed AI works and why it matters for ordinary people.",
      prompts: [
        "Why should I care about who owns AI?",
        "How is this different from ChatGPT?",
        "What can I actually do with this?"
      ],
      footer: "No jargon. Just answers."
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
    },
    terminal: {
      heading: "Research Interface.",
      thesis: "Peer-reviewed sources, technical documentation, and advisory council analysis. Academic rigor applied to distributed AI.",
      prompts: [
        "What peer-reviewed research supports the hybrid architecture?",
        "How does Grove address the enclosure of AI research?",
        "What are the methodological limitations?"
      ],
      footer: "Citations available. Ask for sources."
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
    },
    terminal: {
      heading: "Technical Documentation.",
      thesis: "Architecture specs, API design, and performance analysis. The hybrid local-cloud system explained.",
      prompts: [
        "How does the cognitive router decide local vs. cloud?",
        "What are the memory system's retrieval mechanics?",
        "Show me the agent cognition loop."
      ],
      footer: "Implementation details available on request."
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
    },
    terminal: {
      heading: "Strategic Analysis.",
      thesis: "Geopolitical implications of AI infrastructure concentration. Power dynamics, sovereignty, and distributed alternatives.",
      prompts: [
        "How does AI concentration affect national sovereignty?",
        "What is the strategic case for distributed infrastructure?",
        "Who benefits from the current centralized model?"
      ],
      footer: "Policy implications and strategic options."
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
    },
    terminal: {
      heading: "Competitive Analysis.",
      thesis: "Edge economics, hybrid architectures, and the threat/opportunity matrix for established AI providers.",
      prompts: [
        "How does the edge-cloud split affect unit economics?",
        "What capabilities remain cloud-exclusive?",
        "Where does Grove complement vs. compete with APIs?"
      ],
      footer: "Strategic implications for established players."
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
    },
    terminal: {
      heading: "Investment Thesis.",
      thesis: "Economic analysis, market dynamics, and infrastructure value capture. The case for distributed AI as an asset class.",
      prompts: [
        "What is the efficiency tax model?",
        "How does Grove capture value from capability propagation?",
        "What are the comparable infrastructure investments?"
      ],
      footer: "Due diligence materials available."
    }
  }
};

// ============================================================================
// RESOLUTION FUNCTIONS
// ============================================================================

/**
 * Get the reality projection for a given lens.
 * Falls back to DEFAULT_REALITY for null, custom lenses, or unmapped archetypes.
 */
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

/**
 * Get the terminal welcome content for a given lens.
 * Priority: 1) Lens-specific terminal content, 2) DEFAULT_TERMINAL_WELCOME
 *
 * Sprint: Terminal Architecture Refactor v1.0
 *
 * @param lensId - The lens/persona ID (null for no lens selected)
 * @param schemaRealities - Optional lens realities from the schema (takes precedence)
 * @returns TerminalWelcome content for the terminal greeting
 */
export const getTerminalWelcome = (
  lensId: string | null,
  schemaRealities?: Record<string, LensReality>
): TerminalWelcome => {
  // No lens = default welcome
  if (!lensId) return DEFAULT_TERMINAL_WELCOME;

  // Custom lenses fall back to default (per ADR-005)
  if (lensId.startsWith('custom-')) return DEFAULT_TERMINAL_WELCOME;

  // Priority 1: Check schema-defined lens realities (from narratives.json)
  if (schemaRealities?.[lensId]?.terminal) {
    return schemaRealities[lensId].terminal!;
  }

  // Priority 2: Check client-side SUPERPOSITION_MAP
  const reality = SUPERPOSITION_MAP[lensId as ArchetypeId];
  if (reality?.terminal) {
    return reality.terminal;
  }

  // Fall back to default
  return DEFAULT_TERMINAL_WELCOME;
};

/**
 * Format a TerminalWelcome object into a chat message string.
 * Uses arrow prompts (→) to format suggested questions.
 *
 * Sprint: Terminal Architecture Refactor v1.0 - Epic 5
 *
 * @param welcome - TerminalWelcome object
 * @returns Formatted string for display in terminal
 */
export const formatTerminalWelcome = (welcome: TerminalWelcome): string => {
  const parts: string[] = [];

  // Heading
  parts.push(welcome.heading);
  parts.push('');

  // Thesis
  parts.push(welcome.thesis);
  parts.push('');

  // Prompts with arrow formatting
  if (welcome.prompts.length > 0) {
    parts.push('You might start with:');
    welcome.prompts.forEach(prompt => {
      parts.push(`→ ${prompt}`);
    });
  }

  // Footer
  if (welcome.footer) {
    parts.push('');
    parts.push(welcome.footer);
  }

  return parts.join('\n');
};

/**
 * Get the formatted terminal welcome message for a given lens.
 * Convenience function that combines getTerminalWelcome + formatTerminalWelcome.
 *
 * Sprint: Terminal Architecture Refactor v1.0 - Epic 5
 *
 * @param lensId - The lens/persona ID (null for no lens selected)
 * @param schemaRealities - Optional lens realities from the schema
 * @returns Formatted welcome message string
 */
export const getFormattedTerminalWelcome = (
  lensId: string | null,
  schemaRealities?: Record<string, LensReality>
): string => {
  const welcome = getTerminalWelcome(lensId, schemaRealities);
  return formatTerminalWelcome(welcome);
};
