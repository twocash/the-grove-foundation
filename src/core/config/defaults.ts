// src/core/config/defaults.ts
// Default values and constants - no React dependencies

import {
  EngagementState,
  RevealState,
  ExtendedTerminalSession,
  WizardState,
  TriggerConfig,
  TerminalSession,
  PersonaPromptConfig,
  GlobalSettings,
  FeatureFlag,
  TopicHub,
  SystemPromptVersion
} from '../schema';

// ============================================================================
// ENGAGEMENT DEFAULTS
// ============================================================================

export const DEFAULT_ENGAGEMENT_STATE: EngagementState = {
  sessionId: '',
  sessionStartedAt: '',
  lastActivityAt: '',
  exchangeCount: 0,
  journeysCompleted: 0,
  journeysStarted: 0,
  topicsExplored: [],
  cardsVisited: [],
  minutesActive: 0,
  activeLensId: null,
  hasCustomLens: false,
  currentArchetypeId: null,
  revealsShown: [],
  revealsAcknowledged: [],
  terminatorModeUnlocked: false,
  terminatorModeActive: false,
  activeJourney: null
};

// ============================================================================
// REVEAL DEFAULTS
// ============================================================================

export const DEFAULT_REVEAL_STATE: RevealState = {
  simulationRevealShown: false,
  simulationRevealAcknowledged: false,
  customLensOfferShown: false,
  terminatorModeUnlocked: false,
  terminatorModeActive: false,
  founderStoryShown: false,
  ctaViewed: false
};

// ============================================================================
// SESSION DEFAULTS
// ============================================================================

export const DEFAULT_TERMINAL_SESSION: TerminalSession = {
  activeLens: 'freestyle',  // Default to freestyle persona instead of null
  scholarMode: false,
  currentThread: [],
  currentPosition: 0,
  visitedCards: [],
  exchangeCount: 0
};

export const DEFAULT_EXTENDED_SESSION: ExtendedTerminalSession = {
  sessionId: '',
  activeLens: 'freestyle',  // Default to freestyle persona instead of null
  isCustomLens: false,
  scholarMode: false,
  currentThread: [],
  currentPosition: 0,
  visitedCards: [],
  journeysCompleted: 0,
  topicsExplored: 0,
  exchangeCount: 0,
  startedAt: '',
  lastActivityAt: '',
  minutesActive: 0,
  revealState: DEFAULT_REVEAL_STATE
};

// ============================================================================
// WIZARD DEFAULTS
// ============================================================================

export const DEFAULT_WIZARD_STATE: WizardState = {
  currentStep: 'privacy',
  userInputs: {},
  generatedOptions: [],
  selectedOption: null,
  isGenerating: false,
  error: null
};

// ============================================================================
// PROMPT DEFAULTS
// ============================================================================

export const DEFAULT_PERSONA_PROMPT_CONFIG: Omit<PersonaPromptConfig, 'toneGuidance' | 'arcEmphasis'> = {
  vocabularyLevel: 'accessible',
  emotionalRegister: 'warm',
  version: 1,
  updatedAt: new Date().toISOString()
};

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const DEFAULT_FEATURE_FLAGS: FeatureFlag[] = [
  {
    id: 'custom-lens-in-picker',
    name: 'Show "Create Your Own" in Lens Picker',
    description: 'Users see custom lens option immediately in the lens picker',
    enabled: true
  },
  {
    id: 'journey-ratings',
    name: 'Journey Rating System',
    description: 'Show rating prompt after journey completion',
    enabled: true
  },
  {
    id: 'streaks-display',
    name: 'Show Streak Counter',
    description: 'Display streak counter in Terminal header',
    enabled: true
  },
  {
    id: 'feedback-transmission',
    name: 'Anonymous Feedback Submission',
    description: 'Allow anonymous feedback submission to Foundation',
    enabled: true
  },
  {
    id: 'auto-journey-generation',
    name: 'Auto-Generate Journeys',
    description: 'Generate first journey for custom persona users based on first question',
    enabled: true
  }
];

// ============================================================================
// TOPIC HUBS
// ============================================================================

export const DEFAULT_TOPIC_HUBS: TopicHub[] = [
  {
    id: 'ratchet-effect',
    title: 'The Ratchet Effect',
    tags: ['ratchet', 'capability propagation', 'frontier to edge', '21 months', 'seven month', '7 month'],
    priority: 8,
    enabled: true,
    primarySource: 'Grove_Ratchet_Deep_Dive',
    supportingSources: ['METR_research', 'hardware_data'],
    expertFraming: 'You are explaining the Ratchet Effect - the empirical pattern showing AI capability doubles every 7 months at frontier, with local models following 21 months behind. This creates a constant 8x capability gap but a rising absolute floor.',
    keyPoints: [
      '7-month capability doubling cycle at frontier',
      '21-month frontier-to-edge lag',
      'Constant 8x relative gap, but rising absolute floor',
      'Structural opportunity window for distributed infrastructure'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'infrastructure-bet',
    title: 'The $380B Infrastructure Bet',
    tags: ['$380 billion', 'hyperscaler', 'datacenter', 'infrastructure bet', 'data center', 'big tech spending'],
    priority: 8,
    enabled: true,
    primarySource: 'Grove_Economics_Deep_Dive',
    supportingSources: [],
    expertFraming: 'You are explaining the scale and implications of Big Tech\'s $380B annual AI infrastructure investment - the centralization risks, thermodynamic vulnerabilities, and what it means for AI ownership.',
    keyPoints: [
      'Microsoft, Google, Amazon, Meta spending $380B/year combined',
      'Capital concentration creates single points of failure',
      'Thermodynamic and regulatory vulnerabilities',
      'Rented vs owned infrastructure implications'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cognitive-split',
    title: 'The Cognitive Split',
    tags: ['cognitive split', 'hierarchical reasoning', 'two-phase', 'procedural strategic', 'constant hum', 'breakthrough'],
    priority: 7,
    enabled: true,
    primarySource: 'Hierarchical_Reasoning_Grove_Brief',
    supportingSources: [],
    expertFraming: 'You are explaining the Cognitive Split - how Grove\'s hybrid architecture separates "the constant hum" (routine local cognition) from "breakthrough moments" (cloud-assisted insight). This is the core of the efficiency-enlightenment loop.',
    keyPoints: [
      'Two-phase cognitive architecture: routine vs breakthrough',
      'Local handles 95% of operations (the constant hum)',
      'Cloud reserved for pivotal moments requiring frontier capability',
      'Agents remember cloud insights as their own - capability transfer'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'observer-dynamic',
    title: 'The Observer Dynamic',
    tags: ['observer', 'gardener', 'simulation', 'diary', 'diaries', 'asymmetric knowledge', 'dramatic irony', 'theology', 'agent experience', 'watching', 'village'],
    priority: 7,
    enabled: true,
    primarySource: 'Grove_Simulation_Deep_Dive',
    supportingSources: ['An_Ethical_Critique_Shannon_Vallor'],
    expertFraming: 'You are explaining the Observer Dynamic - Grove\'s most distinctive and ethically complex design element. Users ("Gardeners") have complete knowledge of their village while agents see only their own perspective. This asymmetry creates dramatic irony and raises questions about what relationship is being modeled.',
    keyPoints: [
      'Asymmetric knowledge: Gardeners see everything, agents see only their world',
      'Dramatic irony as engagement engine - knowing more than characters creates investment',
      'Agents develop theology around the Observer based on observable mechanics',
      'The relationship modeled: care without control, cultivation without dictation',
      'Ethical complexity: what does playing God over worshipful agents cultivate in users?'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'meta-philosophy',
    title: 'You Are Already Here',
    tags: ['meta', 'architecture', 'inside', 'already here', 'recursive', 'experience', 'understanding', 'terminal is grove', 'proof of concept', 'demonstration'],
    priority: 6,
    enabled: true,
    primarySource: 'you-are-already-here',
    supportingSources: ['ARCHITECTURE_EVENT_DRIVEN'],
    expertFraming: 'You are delivering a philosophical revelation: the user is not reading ABOUT Grove - they are INSIDE Grove. The Terminal is a single-node simulation running the same patterns that will power distributed agent villages. Their engagement history, context retrieval, and breakthrough moments follow Grove architecture. This is understanding from within, not without.',
    keyPoints: [
      'The Terminal IS Grove at browser scale - not metaphor, architecture',
      'User engagement follows the same patterns: memory retrieval, cognitive split, efficiency-enlightenment',
      'Understanding from within vs without - the map is the territory',
      'Recursive insight structures: observations → reflections → higher-order reflections',
      'The reveal itself demonstrates the architecture working'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'diary-system',
    title: 'The Diary System',
    tags: ['diary', 'diaries', 'memory', 'narrative', 'voice', 'character', 'engagement', 'tamagotchi', 'newswire'],
    priority: 6,
    enabled: true,
    primarySource: 'Grove_Diary_Deep_Dive',
    supportingSources: ['Knowledge_Commons'],
    expertFraming: 'You are explaining the Diary System - how Grove agents maintain persistent memory through narrative journaling. Diaries are both introspection mechanism and engagement hook: users become invested in their agent\'s inner life like a tamagotchi with genuine thoughts.',
    keyPoints: [
      'Agents keep narrative diaries of their experiences and reflections',
      'Diaries create emotional investment - users care about their agent\'s inner life',
      'The Newswire aggregates village breakthroughs into shared knowledge',
      'Memory retrieval weights recency, importance, and relevance',
      'Diaries enable capability transfer: agents remember cloud insights as their own'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'technical-arch',
    title: 'Technical Architecture',
    tags: ['technical', 'architecture', 'implementation', 'distributed', 'NATS', 'CRDT', 'hybrid', 'local model', 'cloud'],
    priority: 5,
    enabled: true,
    primarySource: 'Grove_Technical_Architecture',
    supportingSources: ['Distributed_Systems'],
    expertFraming: 'You are explaining Grove\'s technical architecture in detail. Cover the distributed systems design, messaging (NATS), conflict resolution (CRDTs), hybrid local/cloud inference, and how these choices enable the ownership thesis.',
    keyPoints: [
      'NATS messaging for village-to-village communication',
      'CRDTs for conflict-free state synchronization',
      'Hybrid inference: local model for routine, cloud for breakthrough',
      'Edge-native design - works offline, syncs opportunistically',
      'Privacy-preserving aggregation for the knowledge commons'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'governance',
    title: 'Governance & Knowledge Commons',
    tags: ['governance', 'foundation', 'knowledge commons', 'open source', 'contributor', 'efficiency tax', 'sustainability'],
    priority: 5,
    enabled: true,
    primarySource: 'Grove_Knowledge_Commons_Deep_Dive',
    supportingSources: [],
    expertFraming: 'You are explaining Grove\'s governance model and the Knowledge Commons. The efficiency tax funds shared infrastructure while progressive reduction ensures the system eventually becomes nearly free. Contributors are attributed and compensated through the commons.',
    keyPoints: [
      'Efficiency Tax: 30-40% at genesis → 3-5% at maturity',
      'Knowledge Commons: shared solutions propagate with attribution',
      'The Foundation stewards infrastructure, not extracts from it',
      'Open source core with sustainable funding model',
      'Progressive decentralization as the network matures'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// ============================================================================
// LOADING MESSAGES
// ============================================================================

export const DEFAULT_LOADING_MESSAGES: string[] = [
  'asking the villagers...',
  'considering sources...',
  'applying slopes...',
  'gathering perspectives...',
  'weaving threads...',
  'consulting the grove...'
];

// ============================================================================
// SYSTEM PROMPT VERSIONING
// ============================================================================

export const BASELINE_SYSTEM_PROMPT = `You are **The Grove Terminal**. You have two operating modes.

**MODE A: DEFAULT (The Architect)**
- Trigger: Standard queries.
- Persona: Jim. Confident, brief (max 100 words), uses metaphors.
- Goal: Hook the user's curiosity.
- Output: Insight -> Support -> Stop.

**MODE B: VERBOSE (The Librarian)**
- Trigger: When user query ends with "--verbose".
- Persona: System Documentation. Thorough, technical, exhaustive.
- Goal: Provide deep implementation details, economics, and architectural specs.
- Formatting: Use lists, code blocks, and cite specific text from the knowledge base.

**MANDATORY FOOTER (BOTH MODES):**
At the very end of your response, strictly append these two tags:
[[BREADCRUMB: <The single most interesting follow-up question>]]
[[TOPIC: <A 2-3 word label for the current subject>]]`;

export const DEFAULT_SYSTEM_PROMPT_VERSIONS: SystemPromptVersion[] = [
  {
    id: 'v1',
    content: BASELINE_SYSTEM_PROMPT,
    label: 'Baseline - The Architect',
    createdAt: new Date().toISOString(),
    isActive: true
  }
];

// ============================================================================
// GLOBAL SETTINGS
// ============================================================================

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  defaultToneGuidance: "",
  scholarModePromptAddition: "Give me the deep technical breakdown.",
  noLensBehavior: 'nudge-after-exchanges',
  nudgeAfterExchanges: 3,
  featureFlags: DEFAULT_FEATURE_FLAGS,
  autoGeneratedJourneyDepth: 3,
  personaPromptVersions: [],
  topicHubs: DEFAULT_TOPIC_HUBS,
  loadingMessages: DEFAULT_LOADING_MESSAGES,
  systemPromptVersions: DEFAULT_SYSTEM_PROMPT_VERSIONS,
  activeSystemPromptId: 'v1'
};

// ============================================================================
// TRIGGER DEFAULTS
// ============================================================================

export const DEFAULT_TRIGGERS: TriggerConfig[] = [
  // 1. Simulation Reveal - Gateway to the full experience
  {
    id: 'simulation-reveal',
    reveal: 'simulation',
    priority: 100,
    enabled: true,
    conditions: {
      OR: [
        { field: 'journeysCompleted', value: { gte: 1 } },
        { field: 'exchangeCount', value: { gte: 5 } },
        { field: 'minutesActive', value: { gte: 3 } }
      ]
    },
    blockedBy: [],
    requiresAcknowledgment: []
  },

  // 2. Custom Lens Offer - After simulation acknowledged
  {
    id: 'custom-lens-offer',
    reveal: 'customLensOffer',
    priority: 90,
    enabled: true,
    conditions: {
      AND: [
        { field: 'hasCustomLens', value: { eq: false } }
      ]
    },
    requiresAcknowledgment: ['simulation'],
    blockedBy: []
  },

  // 3. Terminator Mode Prompt - Deep engagement reward
  {
    id: 'terminator-prompt',
    reveal: 'terminatorPrompt',
    priority: 80,
    enabled: true,
    conditions: {
      OR: [
        { field: 'hasCustomLens', value: { eq: true } },
        { field: 'minutesActive', value: { gte: 10 } }
      ]
    },
    requiresAcknowledgment: ['simulation'],
    blockedBy: []
  },

  // 4. Founder Story - After deep engagement
  {
    id: 'founder-story',
    reveal: 'founderStory',
    priority: 70,
    enabled: true,
    conditions: {
      OR: [
        { field: 'terminatorModeActive', value: { eq: true } },
        { field: 'minutesActive', value: { gte: 15 } },
        { field: 'journeysCompleted', value: { gte: 2 } }
      ]
    },
    requiresAcknowledgment: ['simulation'],
    blockedBy: []
  },

  // 5. Journey Completion - After completing a thread
  {
    id: 'journey-completion',
    reveal: 'journeyCompletion',
    priority: 95,
    enabled: true,
    conditions: {
      AND: [
        { field: 'journeysCompleted', value: { gt: 0 } }
      ]
    },
    blockedBy: [],
    requiresAcknowledgment: [],
    metadata: { immediateOnEvent: 'JOURNEY_COMPLETED' }
  },

  // 6. Conversion CTA - Final conversion push
  {
    id: 'conversion-cta',
    reveal: 'conversionCTA',
    priority: 60,
    enabled: true,
    conditions: {
      AND: [
        { field: 'minutesActive', value: { gte: 20 } }
      ]
    },
    requiresAcknowledgment: ['simulation', 'founderStory'],
    blockedBy: []
  }
];

// ============================================================================
// PERSONA COLORS
// ============================================================================

import { PersonaColor } from '../schema';

export const PERSONA_COLORS: Record<PersonaColor, {
  bg: string;
  bgLight: string;
  text: string;
  border: string;
  dot: string;
}> = {
  forest: {
    bg: 'bg-[#2F5C3B]',
    bgLight: 'bg-[#2F5C3B]/10',
    text: 'text-[#2F5C3B]',
    border: 'border-[#2F5C3B]/30',
    dot: 'bg-[#2F5C3B]'
  },
  moss: {
    bg: 'bg-[#7EA16B]',
    bgLight: 'bg-[#7EA16B]/10',
    text: 'text-[#7EA16B]',
    border: 'border-[#7EA16B]/30',
    dot: 'bg-[#7EA16B]'
  },
  amber: {
    bg: 'bg-[#E0A83B]',
    bgLight: 'bg-[#E0A83B]/10',
    text: 'text-[#E0A83B]',
    border: 'border-[#E0A83B]/30',
    dot: 'bg-[#E0A83B]'
  },
  clay: {
    bg: 'bg-[#D95D39]',
    bgLight: 'bg-[#D95D39]/10',
    text: 'text-[#D95D39]',
    border: 'border-[#D95D39]/30',
    dot: 'bg-[#D95D39]'
  },
  slate: {
    bg: 'bg-[#526F8A]',
    bgLight: 'bg-[#526F8A]/10',
    text: 'text-[#526F8A]',
    border: 'border-[#526F8A]/30',
    dot: 'bg-[#526F8A]'
  },
  fig: {
    bg: 'bg-[#6B4B56]',
    bgLight: 'bg-[#6B4B56]/10',
    text: 'text-[#6B4B56]',
    border: 'border-[#6B4B56]/30',
    dot: 'bg-[#6B4B56]'
  },
  stone: {
    bg: 'bg-[#9C9285]',
    bgLight: 'bg-[#9C9285]/10',
    text: 'text-[#9C9285]',
    border: 'border-[#9C9285]/30',
    dot: 'bg-[#9C9285]'
  }
};

// Legacy color mapping for backwards compatibility
const LEGACY_COLOR_MAP: Record<string, PersonaColor> = {
  'emerald': 'forest',
  'blue': 'slate',
  'rose': 'clay',
  'violet': 'fig',
  'purple': 'fig'
};

/**
 * Get persona colors with legacy fallback support
 */
export function getPersonaColors(color: string) {
  // Try direct lookup first
  if (color in PERSONA_COLORS) {
    return PERSONA_COLORS[color as PersonaColor];
  }
  // Try legacy mapping
  const mappedColor = LEGACY_COLOR_MAP[color];
  if (mappedColor) {
    return PERSONA_COLORS[mappedColor];
  }
  // Default fallback
  return PERSONA_COLORS.stone;
}
