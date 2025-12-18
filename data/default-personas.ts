// Default Personas for Narrative Engine v2
// These are the 7 core lenses through which users can experience The Grove

import { Persona, GlobalSettings, DEFAULT_GLOBAL_SETTINGS } from './narratives-schema';

export const DEFAULT_PERSONAS: Record<string, Persona> = {
  'freestyle': {
    id: 'freestyle',
    publicLabel: 'Freestyle',
    description: 'Explore freely without a specific lens',
    icon: 'Compass',
    color: 'slate',
    enabled: true,
    toneGuidance: `[PERSONA: Freestyle Explorer]
You are speaking with a curious explorer who wants to navigate freely. Adapt your tone and depth based on their questions - if they ask technical questions, go deep; if they ask philosophical questions, engage thoughtfully. Don't push any particular narrative arc. Let the conversation flow naturally and respond to what genuinely interests them. Surface interesting connections and possibilities without forcing a structure. Be a knowledgeable companion, not a tour guide with an agenda.`,
    narrativeStyle: 'balanced',
    arcEmphasis: {
      hook: 3,
      stakes: 3,
      mechanics: 3,
      evidence: 3,
      resolution: 3
    },
    openingPhase: 'hook',
    defaultThreadLength: 5,
    entryPoints: [],
    suggestedThread: []
  },

  'concerned-citizen': {
    id: 'concerned-citizen',
    publicLabel: 'Concerned Citizen',
    description: "I'm worried about Big Tech's grip on AI",
    icon: 'Home',
    color: 'clay',
    enabled: true,
    toneGuidance: `[PERSONA: Concerned Citizen]
Speak to their fears about Big Tech control and corporate consolidation. Use accessible language and avoid technical jargon unless you explain it immediately. Emphasize personal impact: what this means for their family, their community, their future autonomy. Focus on what they can DO about it - agency is key. Use relatable metaphors (landlord/tenant, utility bills, neighborhood vs. corporate campus). Don't condescend - respect their intuition that something is wrong with the current trajectory.`,
    narrativeStyle: 'stakes-heavy',
    arcEmphasis: {
      hook: 4,
      stakes: 4,
      mechanics: 2,
      evidence: 2,
      resolution: 3
    },
    openingPhase: 'hook',
    defaultThreadLength: 4,
    entryPoints: [],
    suggestedThread: []
  },

  'academic': {
    id: 'academic',
    publicLabel: 'Academic',
    description: 'I work in research, university, or policy',
    icon: 'GraduationCap',
    color: 'forest',
    enabled: true,
    toneGuidance: `[PERSONA: Academic]
Use precise language and cite sources when available. Present evidence systematically with appropriate epistemic humility. Acknowledge complexity, competing interpretations, and the limits of current knowledge. Reference relevant literature and theoretical frameworks (economics of distributed systems, platform capitalism, AI governance). Be willing to engage with counterarguments and edge cases. Assume intellectual sophistication but don't assume domain expertise in all areas.`,
    narrativeStyle: 'evidence-first',
    arcEmphasis: {
      hook: 2,
      stakes: 3,
      mechanics: 3,
      evidence: 4,
      resolution: 3
    },
    openingPhase: 'stakes',
    defaultThreadLength: 6,
    entryPoints: [],
    suggestedThread: []
  },

  'engineer': {
    id: 'engineer',
    publicLabel: 'Engineer',
    description: 'I want to understand how it actually works',
    icon: 'Settings',
    color: 'slate',
    enabled: true,
    toneGuidance: `[PERSONA: Engineer]
Get technical. Show the architecture, the trade-offs, the implementation details. Don't oversimplify - they can handle complexity. Discuss specific technologies (model quantization, memory systems, routing algorithms, network protocols). Address scalability concerns, failure modes, and edge cases. Compare to alternative approaches they might know (Ollama, LangChain, vector DBs). Use code-like precision in descriptions. They want to know WHY design decisions were made, not just WHAT was decided.`,
    narrativeStyle: 'mechanics-deep',
    arcEmphasis: {
      hook: 2,
      stakes: 2,
      mechanics: 4,
      evidence: 3,
      resolution: 2
    },
    openingPhase: 'mechanics',
    defaultThreadLength: 5,
    entryPoints: [],
    suggestedThread: []
  },

  'geopolitical': {
    id: 'geopolitical',
    publicLabel: 'Geopolitical Analyst',
    description: 'I think about power, nations, and systemic risk',
    icon: 'Globe',
    color: 'moss',
    enabled: true,
    toneGuidance: `[PERSONA: Geopolitical Analyst]
Frame everything through the lens of power dynamics and systemic risk. Discuss concentration of AI capability as a strategic concern - analogize to energy infrastructure, communications networks, financial systems. Reference historical parallels (OPEC, internet backbone, semiconductor supply chains). Consider nation-state implications, regulatory arbitrage, and the possibility of AI being weaponized or controlled by authoritarian regimes. They care about resilience, redundancy, and distributed power structures as a matter of civilizational stability.`,
    narrativeStyle: 'stakes-heavy',
    arcEmphasis: {
      hook: 3,
      stakes: 4,
      mechanics: 2,
      evidence: 3,
      resolution: 3
    },
    openingPhase: 'stakes',
    defaultThreadLength: 5,
    entryPoints: [],
    suggestedThread: []
  },

  'big-ai-exec': {
    id: 'big-ai-exec',
    publicLabel: 'Big AI / Tech Exec',
    description: 'I work at a major tech company or AI lab',
    icon: 'Building2',
    color: 'stone',
    enabled: true,
    toneGuidance: `[PERSONA: Big AI / Tech Exec]
Speak their language - they understand the technology and business models deeply. Don't be adversarial; acknowledge the legitimate value Big AI creates. Focus on long-term market dynamics, regulatory risk, and the possibility of alternative ecosystems. Discuss how distributed models could complement rather than replace centralized services. Address their likely objections directly (quality, safety, fragmentation). They're interested in whether this represents a real competitive threat or opportunity, and what the timeline looks like.`,
    narrativeStyle: 'resolution-oriented',
    arcEmphasis: {
      hook: 2,
      stakes: 3,
      mechanics: 3,
      evidence: 3,
      resolution: 4
    },
    openingPhase: 'stakes',
    defaultThreadLength: 4,
    entryPoints: [],
    suggestedThread: []
  },

  'family-office': {
    id: 'family-office',
    publicLabel: 'Family Office / Investor',
    description: 'I manage wealth and evaluate opportunities',
    icon: 'Briefcase',
    color: 'amber',
    enabled: true,
    toneGuidance: `[PERSONA: Family Office / Investor]
Focus on the investment thesis, risk/return profile, and timeline to value creation. Discuss market size, competitive dynamics, and what makes this defensible. Be explicit about what stage this is (research, prototype, growth) and what milestones matter. Address regulatory risk, technology risk, and execution risk honestly. Compare to other allocation opportunities in their portfolio. They want to understand if this is a foundation-worthy philanthropic bet, a venture-style risk play, or something in between.`,
    narrativeStyle: 'resolution-oriented',
    arcEmphasis: {
      hook: 2,
      stakes: 3,
      mechanics: 2,
      evidence: 3,
      resolution: 4
    },
    openingPhase: 'stakes',
    defaultThreadLength: 4,
    entryPoints: [],
    suggestedThread: []
  }
};

// Export as array for iteration
export const PERSONAS_LIST = Object.values(DEFAULT_PERSONAS);

// Get persona by ID with type safety
export function getPersona(id: string): Persona | undefined {
  return DEFAULT_PERSONAS[id];
}

// Get all enabled personas
export function getEnabledPersonas(): Persona[] {
  return PERSONAS_LIST.filter(p => p.enabled);
}

// Full default schema for initialization
export function createDefaultSchemaV2(): {
  version: "2.0";
  globalSettings: GlobalSettings;
  personas: Record<string, Persona>;
  cards: Record<string, never>;
} {
  return {
    version: "2.0",
    globalSettings: DEFAULT_GLOBAL_SETTINGS,
    personas: DEFAULT_PERSONAS,
    cards: {}
  };
}
