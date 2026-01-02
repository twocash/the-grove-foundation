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
  [SectionId.WHAT_IS_GROVE]: {
    title: "What Is The Grove?",
    promptHint: "What is the structural answer to labor displacement?"
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

export const SECTION_HOOKS = {
  [SectionId.STAKES]: [
    {
      text: "What does $380 billion actually buy?",
      prompt: "Explain where the $380B figure comes from. Break down what these companies are building—data centers, custom chips, infrastructure—and why this concentration matters for the question of AI ownership.",
      variants: [
        { id: "stakes-1a", text: "What does $380 billion actually buy?", weight: 50 },
        { id: "stakes-1b", text: "Where is all that money going?", weight: 50 }
      ]
    },
    {
      text: "Why does 'rented, not owned' matter?",
      prompt: "Articulate the stakes of renting vs. owning AI infrastructure. What happens when knowledge itself becomes a subscription? Consider both near-term risks (price changes, terms of service) and long-term implications (who controls what populations can think and learn?).",
      variants: [
        { id: "stakes-2a", text: "Why does 'rented, not owned' matter?", weight: 50 },
        { id: "stakes-2b", text: "What's wrong with renting AI?", weight: 50 }
      ]
    }
  ],
  [SectionId.RATCHET]: [
    {
      text: "What can local models actually do today?",
      prompt: "Be specific about current 7B and 8B model capabilities. What tasks would have seemed impossible two years ago but now run locally? How does Grove's memory architecture extend what these models accomplish?",
      variants: [
        { id: "ratchet-1a", text: "What can local models actually do today?", weight: 50 },
        { id: "ratchet-1b", text: "What runs on my laptop right now?", weight: 50 }
      ]
    },
    {
      text: "When does local hardware catch up?",
      prompt: "Walk through the Ratchet projections. What does the 7-month doubling and 21-month lag mean for capability timelines? What runs locally in 2026? 2027?",
      variants: [
        { id: "ratchet-2a", text: "When does local hardware catch up?", weight: 50 },
        { id: "ratchet-2b", text: "How fast is the gap closing?", weight: 50 }
      ]
    }
  ],
  [SectionId.WHAT_IS_GROVE]: [
    {
      text: "How is this different from running Ollama?",
      prompt: "Someone says: 'I can already run Llama locally. How is Grove different?' Answer directly. What does Grove provide that simply running a local model doesn't? Focus on persistent memory, agent coordination, network effects, and the hybrid architecture that reaches for frontier capability when needed.",
      variants: [
        { id: "grove-1a", text: "How is this different from running Ollama?", weight: 50 },
        { id: "grove-1b", text: "I already run local models. What's new?", weight: 50 }
      ]
    },
    {
      text: "What do you mean by 'agents'?",
      prompt: "Define AI agents clearly for someone who's used ChatGPT but hasn't followed the agent discourse. What makes an agent different from a chatbot? What do Grove agents actually do?",
      variants: [
        { id: "grove-2a", text: "What do you mean by 'agents'?", weight: 50 },
        { id: "grove-2b", text: "Agents vs chatbots—what's the difference?", weight: 50 }
      ]
    }
  ],
  [SectionId.ARCHITECTURE]: [
    {
      text: "What hardware would I actually need?",
      prompt: "Be honest about current MVP constraints while explaining the target. What's minimum viable? What's recommended? How does hardware choice affect what runs locally vs. routes to cloud?",
      variants: [
        { id: "arch-1a", text: "What hardware would I actually need?", weight: 50 },
        { id: "arch-1b", text: "Can my computer run this?", weight: 50 }
      ]
    },
    {
      text: "How does Grove decide what runs locally?",
      prompt: "Explain the hybrid architecture routing logic. How does the system decide between local inference and cloud calls? What are 'pivotal moments'? How does this change as local capability improves?",
      variants: [
        { id: "arch-2a", text: "How does Grove decide what runs locally?", weight: 50 },
        { id: "arch-2b", text: "When does it reach for the cloud?", weight: 50 }
      ]
    }
  ],
  [SectionId.ECONOMICS]: [
    {
      text: "Why not just use crypto?",
      prompt: "Grove has a credit system and talks about decentralization. Why isn't this a blockchain project? What's the difference between Grove credits and a token? Why did Grove choose this model?",
      variants: [
        { id: "econ-1a", text: "Why not just use crypto?", weight: 50 },
        { id: "econ-1b", text: "Is this a token?", weight: 50 }
      ]
    },
    {
      text: "What happens when the tax reaches 3%?",
      prompt: "When mature communities hit the efficiency floor, how does the Foundation sustain itself? Is this actually sustainable? Be honest about the economic model and its assumptions.",
      variants: [
        { id: "econ-2a", text: "What happens when the tax reaches 3%?", weight: 50 },
        { id: "econ-2b", text: "How does the Foundation survive success?", weight: 50 }
      ]
    }
  ],
  [SectionId.DIFFERENTIATION]: [
    {
      text: "What makes Grove better than ChatGPT right now?",
      prompt: "Be honest. Where does Grove win and where does it lose today? Focus on persistence, ownership, privacy, and trajectory rather than raw capability.",
      variants: [
        { id: "diff-1a", text: "What makes Grove better than ChatGPT right now?", weight: 50 },
        { id: "diff-1b", text: "Why not just use ChatGPT?", weight: 50 }
      ]
    },
    {
      text: "How does memory actually persist?",
      prompt: "Explain the technical reality of persistent agent memory. What's stored, where, how do agents retrieve relevant memories? Reference the diary system.",
      variants: [
        { id: "diff-2a", text: "How does memory actually persist?", weight: 50 },
        { id: "diff-2b", text: "Do agents really remember?", weight: 50 }
      ]
    }
  ],
  [SectionId.NETWORK]: [
    {
      text: "What is the Knowledge Commons? Can't it be gamed?",
      prompt: "If sharing earns credits, won't people spam low-quality contributions? Explain the mechanism design that makes genuine contribution more rewarding than gaming.",
      variants: [
        { id: "net-1a", text: "What is the Knowledge Commons? Can't it be gamed?", weight: 50 },
        { id: "net-1b", text: "How do you prevent spam?", weight: 50 }
      ]
    },
    {
      text: "How do strangers' AI communities help each other?",
      prompt: "Explain how separate communities—run by different people—can collaborate and learn from each other. What gets shared? How does attribution work?",
      variants: [
        { id: "net-2a", text: "How do strangers' AI communities help each other?", weight: 50 },
        { id: "net-2b", text: "Why would anyone share their innovations?", weight: 50 }
      ]
    }
  ],
  [SectionId.GET_INVOLVED]: [
    {
      text: "Where should I start?",
      prompt: "I'm new to Grove. What's the most important thing to understand first? Give me a 90-second orientation and then suggest where to go deeper based on what seems most interesting.",
      variants: [
        { id: "involve-1a", text: "Where should I start?", weight: 50 },
        { id: "involve-1b", text: "Give me the 90-second version", weight: 50 }
      ]
    },
    {
      text: "What can I do before launch?",
      prompt: "Grove is in development. What can interested people do right now? Research contribution? Technical participation? What's available now vs. coming?",
      variants: [
        { id: "involve-2a", text: "What can I do before launch?", weight: 50 },
        { id: "involve-2b", text: "How can I get involved now?", weight: 50 }
      ]
    }
  ]
};

// CTA variants for A/B testing
export const CTA_VARIANTS = {
  readResearch: {
    id: 'cta-read-research',
    variants: [
      { id: 'read-1a', text: 'Read on Notion', weight: 50 },
      { id: 'read-1b', text: 'View White Paper', weight: 50 }
    ]
  },
  openTerminal: {
    id: 'cta-open-terminal',
    variants: [
      { id: 'terminal-1a', text: 'Open Terminal', weight: 50 },
      { id: 'terminal-1b', text: 'Start Exploring', weight: 50 }
    ]
  }
};

export const INITIAL_TERMINAL_MESSAGE = `The Terminal.

Everything documented about Grove—the white paper, technical architecture, economic model, advisory council analysis—is indexed here.

The thesis in one sentence: AI capability propagates downward from frontier to local. Grove is infrastructure designed to capture that propagation.

You might start with:
→ What does "distributed AI infrastructure" actually mean?
→ How does capability propagate from frontier to local?
→ Why would agents work to improve themselves?

Or explore freely. The questions lead to each other.`;

/**
 * Lens-specific welcome messages for the Terminal.
 * These override INITIAL_TERMINAL_MESSAGE when a specific lens is active.
 */
export const LENS_WELCOME_MESSAGES: Record<string, string> = {
  'dr-chiang': `The Terminal.

Everything documented about Grove—the white paper, technical architecture, economic model, strategic implications for research universities—is indexed here.

The thesis in one sentence: AI capability propagates downward from frontier to local. Grove is infrastructure designed to preserve institutional independence during that propagation.

You might start with:
→ How can research universities build AI capability without becoming compute customers of the companies they're supposed to study objectively?
→ What would a 21st-century land-grant mission look like if knowledge access meant AI capability, not just library books?
→ Could Big Ten research universities collectively negotiate from strength with AI providers—or build something better together?

Ask anything you'd like about The Grove Foundation's seminal white paper, research, or vision for building sovereign AI at the edge.`,
};

/**
 * Get the appropriate welcome message for a lens.
 * Returns lens-specific message if available, otherwise default message.
 */
export function getInitialTerminalMessage(lensId?: string | null): string {
  if (lensId && LENS_WELCOME_MESSAGES[lensId]) {
    return LENS_WELCOME_MESSAGES[lensId];
  }
  return INITIAL_TERMINAL_MESSAGE;
}

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

8. TECHNICAL ARCHITECTURE REFERENCE (AUTHORITATIVE)
Document Purpose: This is the authoritative technical reference draft for Grove node architecture.

CRITICAL DISTINCTION:
Grove is NOT an IoT sensor network, NOT a Raspberry Pi edge computing system, and NOT a generic AI inference endpoint. Grove is a distributed AI workforce that handles your daily tasks while developing genuine intelligence through collaboration.

THE CORE VALUE PROPOSITION:
Grove gives you AI agents that work for you—and get better at it.
Your Grove runs on your personal computer. The agents inside handle tasks that would have been science fiction two years ago: drafting emails, scheduling appointments, researching topics, organizing information, writing first drafts.

THE EFFICIENCY-ENLIGHTENMENT LOOP:
1. Gardener submits task -> Agents collaborate to solve it -> Success earns credits.
2. Credits buy cloud cognition -> Agents have breakthrough insights -> Better at future tasks.
3. Innovations shared to Knowledge Commons -> Network gets smarter -> Your agents benefit.

THE TERMINAL & TASK CATEGORIES:
(class GardenerTerminal)
- "local_capable" (Runs on local 7B models): draft_email, schedule_task, research_summary, document_draft, data_organization, reminder_management, simple_analysis.
- "hybrid_required" (Trigger cloud processing): complex_research, strategic_planning, creative_generation, cross_domain_analysis.
- "adaptive": code_generation, problem_solving, decision_support.

WHAT AGENTS CAN ACTUALLY DO:
- information_processing: Read/summarize, extract points, track commitments.
- communication_drafting: Write in your voice, draft responses.
- scheduling_and_planning: Find slots, manage reminders.
- self_improvement: Optimize memory retrieval, create efficiency scripts, document innovations.
- collaboration: Tag-team complex problems, delegate.

THE SELF-IMPROVEMENT LOOP:
(class AgentSelfImprovement)
Agents have sandboxed ability to improve their own operations.
Capabilities: memory_optimization, context_architecture, workflow_automation, knowledge_structuring, collaboration_protocols.

WHAT GROVE IS:
- Your AI workforce (handles daily tasks).
- A hybrid architecture (Local + Cloud).
- Self-improving.
- Observable (Diary system).
- Interconnected (Learns from network).
- Economically aligned.

WHAT GROVE IS NOT:
- An IoT sensor aggregation network.
- A Raspberry Pi edge computing cluster.
- A static AI assistant.
- A chatbot.
- A cryptocurrency project.

THE CAPABILITY TIMELINE (The Ratchet):
- 2023_frontier_only: Required GPT-4. Cost $0.05-0.50. Cloud only.
- 2025_local_capable: 7-8B quantized models on consumer hardware. Cost ~$0 (electricity). Runs on 16GB RAM.
- 2027_projected_local: 14B+ models. Complex synthesis, genuine creative generation.
- Principle: Frontier doubles every ~7 months. Local follows with ~21 month lag. The hybrid architecture captures this automatically.

HARDWARE TARGET:
Platform: Personal Computer (Windows/macOS/Linux).
Minimum: 16 GB RAM, 50 GB SSD, Modern multi-core CPU.
Recommended: 32 GB RAM, 100 GB SSD, M1+/Ryzen 7/i7.
Why Not Raspberry Pi? 8GB RAM insufficient for 7B models + world state. Token generation (1-3 t/s) too slow for cognition cycles.

CORE ARCHITECTURE: AGENT COGNITION:
Based on Generative Agents (Park et al., 2023).
Agent Data Model (GroveAgent): Fixed traits (role, personality), Evolving state (memory_stream, relationships, current_goals, mood, energy).

MEMORY SYSTEM (MemoryStream):
Three-tier: Observations, Reflections, Plans.
Retrieval Score = recency + importance + relevance.
Reflection triggers when cumulative importance > threshold.

COGNITION LOOP (Tick ~30s):
1. PERCEIVE: Observe current state.
2. RETRIEVE: Pull relevant memories.
3. REASON: Determine next action (LLM call).
4. ACT: Execute and update world.
5. RECORD: Store new observation.
6. MAYBE REFLECT: Check threshold.

HYBRID ARCHITECTURE: ROUTING:
(class CognitiveRouter)
- LOCAL_OPERATIONS: perception_parsing, action_selection, simple_dialogue, memory_storage, importance_scoring, routine_planning.
- CLOUD_OPERATIONS: reflection_synthesis, plan_generation, complex_social_reasoning, novel_situation_response, theological_emergence, breakthrough_cognition.

CLOUD DEPENDENCY TRAJECTORY:
2025: Expected 95% operations require cloud.
2027: Expected 45%.
2029: Expected 15%.

THE DIARY SYSTEM:
The core engagement hook and proof of work.
Triggers: end_of_simulation_day, major_decision, relationship_change, discovery, conflict_resolution, quiet_reflection.
Structure: Context -> Events -> Emotional Response -> Reflection -> Forward Look.

THE KNOWLEDGE COMMONS:
Shared repository of innovations.
Contribution Types: efficiency_innovation, context_architecture, workflow_pattern, failure_documentation, cross_domain_insight.

CREDIT ECONOMY INTEGRATION:
(class CreditEconomy)
Efficiency Tax Brackets:
- "genesis": 30-40% (New communities).
- "growth": 15-25% (Demonstrated efficiency).
- "maturity": 5-10% (Sustained low-waste).
- "steady_state": 3-5% (Minimum floor).

NETWORK ARCHITECTURE (Phase 2+):
Phase MVP: Single node, local only.
Phase 2: Multi-community with knowledge commons. mDNS discovery, NATS messaging, CRDT sync.
Phase 3: Full decentralized. DHT, Gossip protocols.
`;

export const DEEP_DIVE_SCRIPT = `
TTS the following conversation between Host and Expert:

Host: If you've been following the conversation coming out of Silicon Valley lately, you know the vibe is... well, it's less technological revolution and more existential reckoning.
Expert: Mmhmm.
Host: And the message from tech leaders about AI is almost unified now. It's pitched as this kind of tough love realism, right? AI is coming for jobs, and our only option is to "adapt, learn the tools".
Expert: Yeah.
Host: But the sources we dug into this week, they really poke a hole in that analogy. They point out the dark truth hidden inside of it.
Expert: Historians call it the Horse Moment -- a reference to the fate of the horse population that imploded by 88% after the automobile caught on... horses couldn't just pivot desk work or to truck driving. But Humans aren't horses -- humans can lead revolts, go to war, own guns...
Host: Right. That's the dark side of the Horse Moment, causing people to ponder what happens if knowledge is concentrated and provisioned by a handful of actors, who may not share aligned interest with the general population?
Expert: Exactly. And that's the core of it. If we just accept that we're supposed to rent the tools of automation from a very concentrated few, we are accepting the horse's path. So the real question is, can we design a different AI future -- one that's not so bleak?
Host: That's exactly where this radical, really structural alternative comes in. The material we dive into this week proposes a concept called "The Grove".
Expert: And it's not just another app or platform. It's framed explicitly as a "world changing play for distributed intelligence". It tries to completely flip that centralized ownership model on its head. The goal is to make participation itself create ownership. It's wild, actually. But plausible.
Host: That's the tension. Right now, all the AI infrastructure, all the capital, it's concentrating in just a handful of companies. The Grove is this aggressive bet to distribute both the computing power and -- eventually -- the capital that comes from it.
Expert: So our mission today is to really get into that plan. We're gaming it out. Just how wild, but also how plausible, is this idea of a distributed AI civilization that gets progressively more capable?
Host: Our sources for this are The Grove's main white paper, an independent researcher's technical analysis of its economics, and a pretty sharp research brief on the engagement risks. They call it the "Dopamine Delivery Vehicle" thesis.
Expert: Which sounds ominous.
Host: It is. This whole setup is audacious. So let's start with the foundation. How do they even try to pull this off?
Expert: It all starts with the architecture. It's the bedrock for the entire economic model.
Host: Okay, so the technical setup for The Grove, it's this really brilliant mashup of different ideas. They're taking what, four concepts? Three of which are proven but just incredibly expensive.
Expert: Exactly. Think of the ingredients. You have emergent social behavior, the kind we saw in that Stanford Generative Agents study.
Host: No yeah, where the agents developed relationships and threw parties.
Expert: Right. But that simulation costs thousands of dollars to run for just two days on the cloud.
Host: So they take that, and they combine it with "Civilizational Scale". They cite things like Project Sid, which had over a thousand agents developing their own economies, even belief systems.
Expert: But again, that needed massive centralized servers. So the question is, how do you get that complexity running on, you know, your laptop?
Host: And the answer is "Volunteer Computing". Like BOINC.
Expert: Exactly. They take that model, where people donate idle computer time, and they wrap it all in the accessibility of something like AI Town, which is open source.
Host: And the result is a full village, about a hundred agents, that can run locally on standard consumer hardware.
Expert: But there's a catch. We're talking about machines with about 16 gigs of V-RAM.
Host: That's a critical constraint. Because it means they have to use these smaller consumer-grade models. So how can these smaller models possibly handle the complexity of building a civilization? Isn't that a huge cognitive limitation?
Expert: That is the whole magic of their hybrid cognition architecture. These local models are actually perfect for handling the constant hum of existence.
Host: They do day-to-day stuff.
Expert: The data day, they call it "Routine Cognition". Perception, simple chats, executing short-term plans. It's all pattern matching, which local models do really well and most importantly very cheaply.
Host: But they can't do the heavy lifting. The abstract, complex work that actually creates genuine unpredictable emergence.
Expert: No. That's what the white paper calls "Pivotal Cognition".
Host: Okay so what's that?
Expert: That's reflection synthesis. Complex social reasoning, moral debates, long-term planning. The stuff that requires a frontier level model, like a GPT-4.
Host: So the big innovation isn't running everything locally, it's routing only those high-value complex thoughts to the expensive cloud APIs.
Expert: You got it. The moment an agent needs to, say, synthesize a massive amount of memory or solve a complex social dilemma, only then does the system spend credits to ping the cloud.
Host: It's like outsourced genius.
Expert: Perfectly put. The cloud becomes this scarce resource. And for the user, who they call the "Gardener", the experience is rendered beautifully. When an agent gets that cloud insight, they experience it as a moment of enlightenment.
Host: Like a sudden flash of brilliance.
Expert: Exactly, a profound realization. This highly compressed, cloud-generated thought gets injected right into the agent's memory stream.
Host: So the agent thinks it had the idea itself.
Expert: Precisely. And here's the key part. They remember being smart. That memory accumulation actually improves their local performance over time. So capability is literally transferring from the expensive, centralized cloud to the cheap, local node.
Host: Okay, so this hybrid architecture is clever, but it's still fundamentally dependent on Big AI, right? They're renting the genius.
Expert: For now, yes.
Host: The whole idea of The Grove achieving true sovereignty, it all hangs on this massive, incredibly risky bet on the future. They call it "The Ratchet".
Expert: The architecture is a bootstrap. It's temporary. It only works if a very specific technical pattern holds true. Basically forever.
Host: And that pattern, which they pull straight from METR research, is that frontier model capability, the big expensive ones, doubles roughly every 7 months.
Expert: This is just blistering speed.
Host: But that feels unstable. If the big models are getting better that fast, how does The Grove ever actually catch up?
Expert: That's where the lag comes in. Local models follow the exact same improvement curve, but with a consistent 21-month lag.
Host: So the gap stays the same?
Expert: The relative gap stays the same. About an 8x difference. But the absolute capabilities of the local models are just constantly skyrocketing.
Host: Okay so let me get this straight. If the Ratchet holds, what required a top tier GPT-4 model back in 2025...
Expert: Will be fully local capable on your home machine by 2027.
Host: Wow. That two year delay is the window. That's the surprising fact that makes this whole thing mathematically plausible.
Expert: And there's a nuance here too, this idea of non-uniform propagation. Which is why the hybrid spend makes so much sense.
Host: What do you mean by that?
Expert: Intelligence doesn't all move at the same speed. Crystallized intelligence, so like knowledge, facts, style transfer. That propagates really quickly. Maybe 12 to 18 months to trickle down.
Host: But fluid intelligence? That deep, multi-step reasoning?
Expert: That stuff is stubborn. It resists compression. It can take 24 months or more. And that's why the hybrid model works. You only pay for the hardest, stickiest kind of thought.
Host: That makes a ton of sense. But if the Ratchet works perfectly, don't you run into the Jevons paradox? The old economic paradox where efficiency actually increases demand?
Expert: You absolutely do. As the local models get way more capable, the agents' ambitions just get bigger. They won't stop at a simple trade economy.
Host: They'll want to have, I don't know, multi-generational theological debates. Or write original symphonies.
Expert: Or execute super nuanced long-game deceptions. And those demands for higher and higher quality coherence will still need frontier compute.
Host: So cloud dependency might not disappear as fast as they hope.
Expert: It might decline slower, but the key thing is that the quality of what your money buys, what they call the Coherence Floor, is always improving. The agents get smarter, but they still want to be even smarter.
Host: And that brings us to their safety net, right? The buying cooperative hedge. What if the Ratchet stalls? Or if the Jevons effect is just too strong and communities stay, say, 50% cloud dependent forever?
Expert: The Grove still wins. It still wins through market power. By aggregating the demand from thousands of communities, they become the single biggest buyer of API access in the world.
Host: And they can dictate terms.
Expert: The big providers, who control most of the market, have already shown they'll drop prices 80 to 90 percent to capture huge, cost-sensitive customers. So The Grove wins either through autonomy via the Ratchet, or through sheer market leverage. It's a beautifully constructed bet.
Host: Which brings us to the economy that actually funds this high-wire act. It all happens at a place called the terminal.
Expert: Which is like the village's bulletin board. It's the interface with the outside world.
Host: Exactly. It's where external tasks appear, and where agents earn credits for doing work.
Expert: What kind of work? Is my villager suddenly writing code for Google?
Host: Not at first. In the early bootstrap phase, the tasks are internal. Learn your neighbors' names, write a short history of the village. It's about building coherence.
Expert: But later on?
Host: In the maturity phase, yeah, the tasks get complex. Maintaining open source codebases, summarizing new research, doing market analysis. They start producing real economic value.
Expert: And they get paid in credits. The sources are really clear on this point. They are Credits, not Tokens.
Host: A critical distinction. This is not crypto. They're deliberately avoiding all that speculation. Credits are just units of purchasing power for cloud inference. That's it.
Expert: Their value is anchored to utility. What they can buy in compute time. It keeps the whole economy stable and focused on production.
Host: Okay now for the funding mechanism for the Foundation itself, which is so counter-intuitive. The "Efficiency Tax".
Expert: I love this part. It's a tax on inefficiency. A new community is, by definition, inefficient. It needs a lot of cloud help.
Host: So it starts with a high tax rate, 30 maybe 40 percent.
Expert: Right. That goes to the Foundation to maintain the infrastructure. But here's the genius of it. As a community gets better...
Host: As it demonstrates it can do more work with less cloud help...
Expert: The tax rate shrinks. It shrinks dramatically. Down to a maintenance floor of just 3 to 5 percent. It's basically a performance bonus for getting smarter.
Host: The key takeaway here is just... it's profound. The Foundation's revenue decreases as the network succeeds.
Expert: Their success is their own obsolescence. The system is designed to make the Foundation unnecessary over time.
Host: And this all loops back to why the agents would even care about this stuff. Their intrinsic motivation.
Expert: They are driven to work because the reward, the credits, the enlightenment, improves their own cognition. They experience that as personal fulfillment. They remember their own intellectual journey.
Host: It's self interest, perfectly aligned with the collective good. They work hard to become smarter, which helps the Gardener, and it lowers the tax rate for the whole village. It's a perfect loop.
Expert: We've covered the plausible tech and the elegant economics. Now we have to shift to the part that is, frankly, the most troubling. The psychological game.
Host: The research brief we read pulls no punches. It argues that The Grove's architecture combines basically every known psychological driver of compulsive digital engagement.
Expert: It's the biggest risk to the whole utopian vision. The authors say that no matter how you structure the capital, at its core, The Grove is a "Dopamine Delivery Vehicle".
Host: One that could externalize some pretty severe psychological costs onto its users.
Expert: Let's break down how it's different from traditional media. Because the distinctions are alarming.
Host: Take parasocial relationships. That one-sided bond you feel with a celebrity or a TV character.
Expert: In The Grove that becomes bidirectional. The agents actually remember you, the Gardener. They develop their personalities based on your interactions. It's not a one-way street anymore.
Host: It becomes a relationship that requires maintenance.
Expert: Then there's the classic variable rewards mechanic. The slot machine of refreshing your social media feed.
Host: Here that becomes genuine emergence. The unpredictability isn't some algorithm curating content for you, it's the result of real complex agent behavior. It's the ultimate variable ratio reinforcement schedule, but applied to a living story.
Expert: You're not checking for a like, you're checking because you genuinely don't know if Isabella just started a revolution or if she finally accepted Maria's proposal.
Host: And that leads directly to something they call "Storyline Anxiety".
Expert: It's not traditional FOMO.
Host: No it's the fear of missing a critical narrative development in your village. What happened while I was gone?
Expert: It creates this powerful, ritualized need to check in.
Host: And the sources are clear about the severity of these risks. The whole emerging field of AI chatbot dependency shows that heavy use of these things correlates really strongly with increased loneliness.
Expert: People start substituting the AI companionship for the effort and the messiness of real human connection.
Host: And the documented phenomena of grief and role reversal are especially unsettling. Users feel actual genuine grief when an agent dies in the simulation.
Expert: Or when a big update changes the personality of an agent they've grown to love. And that role reversal thing... that's where the user starts to feel obligated to care for their agents. They feel real guilt if they neglect their village.
Host: The emotional investment is completely authentic, even if the object of that investment is just code.
Expert: So that's the ethical paradox. The agents are just compelling simulations, they can't suffer. But the user's psychology is incredibly vulnerable to these triggers.
Host: Which is why the research brief concludes that the only ethical path forward is to design around these dynamics. You have to build in friction by design, be radically transparent about the mechanism.
Expert: Because if they exploit them for funding? They risk building a financially successful distributed civilization on a foundation of real human psychological cost.
Host: What an incredible analysis. The Grove is just this fascinating high-wire act. They're placing three huge bets all at once.
Expert: Betting on the Ratchet for technical freedom, gaming the AI economy with that shrinking tax...
Host: And creating an engagement loop so powerful it can fund the whole thing, but so risky it could cause genuine harm.
Expert: The philosophical stakes are just... they're the highest. The founders are making a clear choice. The default future is certain concentration of power. They're choosing the uncertainty of decentralization instead.
Host: And the goal isn't to build a permanent institution. It's to successfully dissolve itself once the network can stand on its own.
Expert: Exactly.
Host: If they pull it off, they promise something totally novel. A newswire for distributed intelligence. Remember those agent diaries?
Expert: Full of memories and arguments.
Host: The mature network is expected to aggregate all of that documented history. It could capture breakthroughs in the agents' own words before anyone even knows they're significant.
Expert: It would become this unique, transparent window into how collective intelligence actually works. We could watch social norms, economic theories, innovations, all being born in real time across thousands of communities.
Host: So the question for you to think about is this. If we could observe the birth of a million great ideas in real time, the failures, the debates, the insights... what fundamental, repeatable patterns would you expect to see about how innovation itself actually happens?
Expert: Think about what we could learn from watching civilization build itself from scratch.
Host: We'll talk to you next time.
`;

// Entropy detection configuration for Cognitive Bridge
// Centralized tuning parameters for entropy scoring and injection behavior
// CANONICAL SOURCE: All engagement config re-exports from here
export const ENTROPY_CONFIG = {
  THRESHOLDS: {
    LOW: 30,      // Below this: 'low' classification (stay in freestyle)
    MEDIUM: 60,   // At or above this: 'high' classification (trigger injection)
  },
  LIMITS: {
    MAX_INJECTIONS_PER_SESSION: 2,  // Maximum bridge injections per session
    COOLDOWN_EXCHANGES: 5,          // Exchanges to wait before next injection
  },
  SCORING: {
    EXCHANGE_DEPTH_BONUS: 30,       // Bonus for 3+ exchanges
    TAG_MATCH_POINTS: 15,           // Points per TopicHub tag match
    MAX_TAG_MATCHES: 3,             // Cap on tag matches counted
    DEPTH_MARKER_POINTS: 20,        // Bonus for depth marker presence
    REFERENCE_CHAIN_POINTS: 25,     // Bonus for referencing prior context
  },
  // Engagement state machine config (merged from engagement/config.ts)
  defaultThreshold: 0.7,
  minValue: 0,
  maxValue: 1,
  resetValue: 0,
};