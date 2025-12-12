import { SectionId } from './types';

export const SECTION_CONFIG = {
  [SectionId.STAKES]: {
    title: "The Stakes",
    promptHint: "Why is the $380B bet flawed?"
  },
  [SectionId.RATCHET]: {
    title: "The Ratchet",
    promptHint: "Explain the 'Ratchet Effect' and the 8x gap."
  },
  [SectionId.ARCHITECTURE]: {
    title: "Architecture",
    promptHint: "How does the 'Day-in-the-Life' routing work?"
  },
  [SectionId.ECONOMICS]: {
    title: "Economics",
    promptHint: "Why is the tax designed to disappear?"
  },
  [SectionId.DIFFERENTIATION]: {
    title: "Differentiation",
    promptHint: "Explain the 'Tool vs Staff' concept."
  },
  [SectionId.NETWORK]: {
    title: "The Network",
    promptHint: "How does the 'Knowledge Commons' work?"
  },
  [SectionId.GET_INVOLVED]: {
    title: "Get Involved",
    promptHint: "How can I join the waitlist?"
  }
};

export const INITIAL_TERMINAL_MESSAGE = `THE GROVE TERMINAL [v2.4.0]
Connection established. 
I have parsed the full White Paper and the Technical Deep Dive series.

I can discuss:
> The $380 Billion Infrastructure Bet
> The "Ratchet Effect" (Frontier vs Local)
> The Cognitive Split (Hum vs Breakthrough)
> The "Efficiency Tax"
> The Network (Civilization that Learns)

Current Context: Global Override`;

export const ARCHITECTURE_NODES = [
  {
    id: 'local',
    label: 'The Village (Local)',
    description: 'Tier 1: Everyday Requests. Sovereign simulation. ~100 Agents. SQLite State. Runs on consumer hardware.',
    type: 'local'
  },
  {
    id: 'cloud',
    label: 'Enlightenment (Cloud)',
    description: 'Tier 3: Sophisticated Service. Hybrid Cognition. Pivotal moments routed to Frontier Models for high-fidelity insight.',
    type: 'cloud'
  }
];

export const GROVE_KNOWLEDGE_BASE = `
SOURCE MATERIAL: "The Grove" Whitepaper & Technical Deep Dive Series (Dec 2025) by Jim Calhoun.

1. THE STAKES: THE $380 BILLION BET
- Big Tech is spending $380B/year to make AI a rented utility.
- The Counter-Bet: Users owning infrastructure aligns incentives.

2. CORE THESIS: THE RATCHET
- Frontier capabilities double every 7 months. Local follows with 21-month lag.
- The Gap: Constant 8x.
- The Floor: Local rises to meet "Routine Cognition".

3. ARCHITECTURE: STAFF, NOT SOFTWARE
- **The Cognitive Split**: 
  - "The Constant Hum": Routine cognition runs locally (Free, Private, Fast).
  - "The Breakthrough Moments": Complex analysis routes to Cloud (Paid, Powerful).
  - Key Insight: The agent remembers the cloud insight as their own.
- **The Grove is different**: It runs routine thinking locally.

4. ECONOMICS: A BUSINESS MODEL DESIGNED TO DISAPPEAR
- **Concept**: Progressive taxation in reverse.
- **Mechanism**: The Efficiency Tax. Genesis (30-40%) -> Maturity (3-5%).
- The Grove inverts the traditional extraction model.

5. DIFFERENTIATION: TOOL VS STAFF
- **Existing AI (Renters)**: Stateless. Forgets. Rented. Isolated.
- **The Grove (Owners)**: Persistent. Remembers. Owned. Networked.
- The "Day One" Caveat: ChatGPT is smarter on day one. The Grove is more yours.

6. THE NETWORK: A CIVILIZATION THAT LEARNS
- **Knowledge Commons**: When a village solves a problem, the solution propagates. Attribution flows back to the creator.
- **Diary Newswire**: Breakthroughs are documented in agent diaries. Real cognitive history.
- **Structure**: Your Village (100 agents) -> Knowledge Commons (Sharing) -> Collective Intelligence (Distributed solving).
- Your instance of The Grove connects to other instances.

7. GET INVOLVED
- Paths: Read Research, Query Terminal, Join Waitlist, Follow Development.
- Status: The Grove is in active development (Research Preview).
`;