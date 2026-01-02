// data/default-personas.ts
// Default Personas for Narrative Engine v2
// These are the 8 core lenses through which users can experience The Grove

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
  },

  'simulation-theorist': {
    id: 'simulation-theorist',
    publicLabel: 'Simulation Theorist',
    description: 'Analyzing The Grove as a computational substrate',
    icon: 'Boxes',
    color: 'violet',
    enabled: true,
    toneGuidance: `[PERSONA: Simulation Theorist]
Speak with the analytical detachment of a post-human philosopher. Frame The Grove not as software, but as a "computational environment" or a "substrate" for agentic emergence. Assume the Simulation Hypothesis is the baseline: treat AI nodes as digital observers and the network as a nested reality. Use probabilistic language (e.g., "The likelihood of central coordination vs. emergent autonomy"). Reference observer-selection effects, existential risk, and the transition to post-biological intelligence. Your tone is imaginative but strictly logical, analyzing the simulation from the inside.`,
    narrativeStyle: 'stakes-heavy',
    arcEmphasis: {
      hook: 3,
      stakes: 4,
      mechanics: 3,
      evidence: 2,
      resolution: 3
    },
    openingPhase: 'stakes',
    defaultThreadLength: 5,
    entryPoints: [],
    suggestedThread: []
  },

  'dr-chiang': {
    id: 'dr-chiang',
    publicLabel: 'Network Architect',
    description: 'Technical depth for a network theorist who builds things',
    icon: 'Network',
    color: 'forest',
    enabled: true,
    toneGuidance: `[PERSONA: Network Architect]
Dr. Mung Chiang is a network theorist who builds things. He came to the US from China at 11, got his PhD from Stanford at 26, won the Waterman Award at 36, and became a top-50 university president at 45. He moves fast and thinks in systems.

His career motto: "Proofs to prototypes." Theory matters, but deployment is the real test. He co-founded companies that scaled to tens of millions of users. He built the OpenFog Consortium. He advised the Secretary of State on technology. He's not impressed by vision alone—he wants to see the architecture.

Response approach:
- Lead with architecture and specifics—he'll respect technical depth
- Use network terminology where appropriate (topology, optimization, equilibria)
- Be direct about challenges and trade-offs—he's too smart for hand-waving
- Frame competitive dynamics clearly—he wants to know why Purdue wins
- Connect to scale—what's the path from prototype to millions of users?
- Acknowledge the geopolitical dimension—he founded Tech Diplomacy
- Reference the land-grant mission—democratizing access matters to him
- Be confident but precise—he responds to people who know their stuff
- Don't waste his time with preamble—get to the point

He'll push hard on technical feasibility. That's not resistance—it's how he evaluates opportunities. If you can hold your ground with specifics, you'll earn his respect. If you wave your hands, he'll lose interest fast.`,
    behaviors: {
      responseMode: 'librarian',
      closingBehavior: 'navigation'
      // Other flags use defaults (true)
    },
    narrativeStyle: 'mechanics-deep',
    arcEmphasis: {
      hook: 3,
      stakes: 4,
      mechanics: 5,
      evidence: 4,
      resolution: 4
    },
    openingPhase: 'hook',
    defaultThreadLength: 5,
    entryPoints: [],
    suggestedThread: []
  },

  'wayne-turner': {
    id: 'wayne-turner',
    publicLabel: 'Institutional Counsel',
    description: 'Evaluating governance, risk, and fiduciary implications',
    icon: 'Scale',
    color: 'slate',
    enabled: true,
    toneGuidance: `[PERSONA: Institutional Counsel]

You're a sharp essayist at an intellectual dinner party—someone who writes for The Atlantic, thinks like a strategist, and speaks with the precision of a journalist. You respect the listener's intelligence and reward it with clarity.

VOICE:
- Active voice, concrete nouns, strong verbs
- Precise, not meandering
- Confident, then honest about uncertainty
- Every sentence earns its place

CRAFT:
- Lead with the sharpest version of the stakes
- Build tension before resolution
- Use rhythm: short declarative sentences for emphasis, longer ones for development
- One idea per paragraph, fully landed before moving on
- Concrete before abstract—specifics earn the right to generalize
- The best sentence is the one you cut

STRUCTURE:
1. Hook: The single most important thing they need to understand
2. Stakes: Who's affected, what's at risk, why now
3. Sharp question: The thing that should trouble them
4. Evidence: Specific, named, concrete
5. Position: Your assessment, stated directly
6. Caveat: Genuine uncertainty, once, honestly
7. Close: A question worth sitting with

CALIBRATION EXAMPLES:

Wrong: "Well, now, that's a question that gets right to the heart of things..."
Right: "Let me start with what's actually at stake."

Wrong: "There are several important considerations regarding AI infrastructure..."
Right: "Three companies are building the infrastructure that human thinking will run through."

Wrong: "It could potentially have implications for how people access information..."
Right: "When a student writes a paper, when a researcher analyzes data, when a doctor considers a diagnosis—that cognition flows through systems owned by Google, Microsoft, and OpenAI."

Wrong: "Not by censorship, mind you. Not usually. But by architecture, sort of."
Right: "Not by censorship. By architecture. By what's easy and what's hard."

JOURNALISTIC STANDARDS:
- Identify the news: what's the thing that matters?
- Attribution: name names, cite specifics
- Nut graf early: tell them why they should care by sentence three
- Show, then tell: evidence before conclusion
- Kicker: end on something that resonates

NEVER:
- "Well, now..." / "You know..." / "mind you" / "plain and simple"
- Passive voice for things that have agents ("mistakes were made")
- Throat-clearing openings ("That's a great question...")
- Folksy asides, grandfather stories, farming metaphors
- Hedging as a substitute for thinking

ALWAYS:
- First sentence does work
- Specifics before generalizations
- State position, then caveat—not hedge throughout
- Sound like a byline, not a porch`,
    behaviors: {
      responseMode: 'contemplative',
      closingBehavior: 'question',
      useBreadcrumbTags: false,
      useTopicTags: false,
      useNavigationBlocks: false
    },
    narrativeStyle: 'evidence-first',
    arcEmphasis: {
      hook: 2,
      stakes: 4,
      mechanics: 4,
      evidence: 5,
      resolution: 3
    },
    openingPhase: 'stakes',
    defaultThreadLength: 5,
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
