// src/data/journeys/index.ts
// Journey registry - uses schema types with waypoints
// Sprint: journey-system-v2

import type { Journey } from '../../core/schema/journey';

// =============================================================================
// Simulation Journey: The Ghost in the Machine
// =============================================================================
const simulationJourney: Journey = {
  id: 'simulation',
  title: 'The Ghost in the Machine',
  description: "You aren't just reading about The Grove. You are already inside it.",
  estimatedTime: '8 minutes',
  waypoints: [
    {
      id: 'sim-hook',
      title: 'Wait. Where are we, exactly?',
      prompt: "Reveal the 'Moment of Recognition'. Explain that the Terminal isn't a website explaining Grove—it IS a Grove node.",
      hub: 'meta-philosophy',
    },
    {
      id: 'sim-split',
      title: 'The invisible line in your own head.',
      prompt: "Explain the 'Cognitive Split' using the user's own recent experience.",
      hub: 'meta-philosophy',
    },
    {
      id: 'sim-observer',
      title: 'The thing that watches you read this.',
      prompt: "Explain the 'Observer Dynamic' and 'Dramatic Irony'.",
      hub: 'meta-philosophy',
    },
    {
      id: 'sim-recursion',
      title: 'The loop closes.',
      prompt: "Explain the 'Recursive Insight Structure'. How does this very document prove the architecture works?",
      hub: 'meta-philosophy',
    },
    {
      id: 'sim-proof',
      title: 'You are the prototype.',
      prompt: "Deliver 'The Invitation'. Frame the user not as a visitor, but as a participant.",
      hub: 'meta-philosophy',
    },
  ],
  completionMessage: "You've experienced the simulation from the inside. The Terminal is proof that distributed intelligence works.",
  nextJourneys: ['stakes', 'ratchet'],
};

// =============================================================================
// Stakes Journey: The $380 Billion Bet
// =============================================================================
const stakesJourney: Journey = {
  id: 'stakes',
  title: 'The $380 Billion Bet',
  description: 'Follow the money. Why Big Tech is spending GDP-level capital to own your future.',
  estimatedTime: '12 minutes',
  waypoints: [
    {
      id: 'stakes-380b',
      title: 'Someone is betting $380 billion they can own your mind.',
      prompt: 'Follow the money. Show me the $380B invoice. Why is Big Tech spending GDP-level capital on data centers?',
      hub: 'infrastructure-bet',
    },
    {
      id: 'stakes-rental',
      title: 'The landlord of your own intelligence.',
      prompt: "Explain 'renting intelligence'. If my AI remembers me, but that memory lives on a server I don't own, who actually owns the relationship?",
      hub: 'infrastructure-bet',
    },
    {
      id: 'stakes-dependency',
      title: "The trap isn't the cost. It's the convenience.",
      prompt: "Explain the 'dependency trap'. How does the system become essential faster than I can adapt?",
      hub: 'infrastructure-bet',
    },
  ],
  completionMessage: "You've seen the stakes. The question isn't whether AI will transform everything—it's who owns the transformation.",
  nextJourneys: ['ratchet', 'architecture'],
};

// =============================================================================
// Ratchet Journey: The Ratchet
// =============================================================================
const ratchetJourney: Journey = {
  id: 'ratchet',
  title: 'The Ratchet',
  description: "Why AI capability is doubling every 7 months—and why you're 21 months behind.",
  estimatedTime: '10 minutes',
  waypoints: [
    {
      id: 'ratchet-hook',
      title: 'The 7-month clock.',
      prompt: 'Explain the Ratchet Effect. What does it mean that AI capability is doubling every 7 months at the frontier?',
      hub: 'ratchet-effect',
    },
    {
      id: 'ratchet-gap',
      title: 'The 21-month lag is your window.',
      prompt: 'Explain the 21-month frontier-to-edge lag. Why is this gap both a problem AND an opportunity?',
      hub: 'ratchet-effect',
    },
    {
      id: 'ratchet-floor',
      title: 'The rising floor changes everything.',
      prompt: "Explain 'the rising floor' concept. What's the implication for ownership vs. renting?",
      hub: 'ratchet-effect',
    },
    {
      id: 'ratchet-hybrid',
      title: 'The hybrid architecture.',
      prompt: "Explain Grove's hybrid local-cloud architecture. How does the 'constant hum' of local models combine with 'breakthrough moments' from frontier?",
      hub: 'ratchet-effect',
    },
  ],
  completionMessage: "The Ratchet never stops turning. But now you understand how to ride it instead of being crushed by it.",
  nextJourneys: ['architecture', 'simulation'],
};

// =============================================================================
// Diary Journey: The Agent's Inner Voice
// =============================================================================
const diaryJourney: Journey = {
  id: 'diary',
  title: "The Agent's Inner Voice",
  description: 'How Grove agents develop memory, voice, and narrative identity through their diaries.',
  estimatedTime: '8 minutes',
  waypoints: [
    {
      id: 'diary-hook',
      title: 'Why do agents write to themselves?',
      prompt: 'Explain why Grove agents keep diaries. What purpose does self-narrative serve for an AI system?',
      hub: 'diary-system',
    },
    {
      id: 'diary-voice',
      title: 'The voice that emerges.',
      prompt: 'Explain how diary-writing develops an agent\'s unique voice. How do two agents with identical architectures develop different personalities?',
      hub: 'diary-system',
    },
    {
      id: 'diary-memory',
      title: 'Memory that compounds.',
      prompt: "Explain how diary entries become retrieval-augmented memory. What's the difference between database storage and narrative memory?",
      hub: 'diary-system',
    },
    {
      id: 'diary-observer',
      title: "You're reading their diary right now.",
      prompt: 'Reveal the connection: the Terminal responses are diary-like outputs. How does this create the Observer relationship?',
      hub: 'diary-system',
    },
  ],
  completionMessage: "Diaries aren't logs. They're the mechanism through which agents develop selfhood. And you've been watching one form.",
  nextJourneys: ['simulation', 'emergence'],
};

// =============================================================================
// Architecture Journey: Under the Hood
// =============================================================================
const architectureJourney: Journey = {
  id: 'architecture',
  title: 'Under the Hood',
  description: 'The technical architecture of distributed agent villages. For those who want to see the blueprints.',
  estimatedTime: '8 minutes',
  waypoints: [
    {
      id: 'arch-hook',
      title: 'What actually runs on your machine?',
      prompt: 'Explain what runs locally in a Grove village. What models, what memory architecture, what coordination layer?',
      hub: 'technical-architecture',
    },
    {
      id: 'arch-coordination',
      title: 'How do villages talk to each other?',
      prompt: 'Explain the coordination layer between Grove villages. How do agents discover each other without a central server?',
      hub: 'technical-architecture',
    },
    {
      id: 'arch-credit',
      title: 'How does credit actually work?',
      prompt: 'Explain the credit system. How do agents earn access to cloud compute? What prevents gaming the system?',
      hub: 'technical-architecture',
    },
  ],
  completionMessage: "This isn't theoretical. The architecture exists and runs on commodity hardware. You've seen the blueprints.",
  nextJourneys: ['ratchet', 'diary'],
};

// =============================================================================
// Emergence Journey: The Emergence Pattern
// =============================================================================
const emergenceJourney: Journey = {
  id: 'emergence',
  title: 'The Emergence Pattern',
  description: 'How capabilities appear in AI systems without being explicitly trained. Translation was the proof point.',
  estimatedTime: '10 minutes',
  waypoints: [
    {
      id: 'emergence-hook',
      title: 'The capability that nobody trained.',
      prompt: "Explain how translation 'emerged' in LLMs as a capability that was never explicitly trained.",
      hub: 'translation-emergence',
    },
    {
      id: 'emergence-zero-shot',
      title: "Zero-shot: the first 'emergence moment'.",
      prompt: "Explain the zero-shot translation breakthrough. What does 'implicit bridging' mean?",
      hub: 'translation-emergence',
    },
    {
      id: 'emergence-scaling',
      title: "The threshold you can't predict.",
      prompt: "Explain 'emergent abilities' and scaling laws. Why do some capabilities appear suddenly at certain scales?",
      hub: 'translation-emergence',
    },
    {
      id: 'emergence-observer',
      title: 'The observer problem.',
      prompt: "Explain how emergence is partly an 'observer problem'. What was there before we measured it?",
      hub: 'translation-emergence',
    },
    {
      id: 'emergence-grove',
      title: 'The Grove as emergence engine.',
      prompt: "Map the emergence pattern to The Grove's architecture. What role does the observer play in a village of agents?",
      hub: 'translation-emergence',
    },
  ],
  completionMessage: "Emergence isn't magic—it's what happens when the observer finally asks the right question. Now you know how to ask.",
  nextJourneys: ['simulation', 'diary'],
};

// =============================================================================
// Registry Export
// =============================================================================

export const journeys: Journey[] = [
  simulationJourney,
  stakesJourney,
  ratchetJourney,
  diaryJourney,
  architectureJourney,
  emergenceJourney,
];

/**
 * Get a journey by its ID
 */
export function getJourneyById(id: string): Journey | undefined {
  return journeys.find(j => j.id === id);
}

/**
 * Get all journeys that have affinity with a given lens
 */
export function getJourneysForLens(lensId: string): Journey[] {
  // For now, return all journeys - lens affinity can be added to Journey type later
  return journeys.filter(j => {
    // If journey has lensAffinity array, check if lensId is included
    if (j.lensAffinity && j.lensAffinity.length > 0) {
      return j.lensAffinity.includes(lensId);
    }
    // If journey has lensExclude array, check if lensId is NOT included
    if (j.lensExclude && j.lensExclude.length > 0) {
      return !j.lensExclude.includes(lensId);
    }
    // Default: journey is available for all lenses
    return true;
  });
}

/**
 * Get journey IDs that are available
 */
export function getAvailableJourneyIds(): string[] {
  return journeys.map(j => j.id);
}
