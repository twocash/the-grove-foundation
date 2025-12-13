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

export const DEEP_DIVE_SCRIPT = `
TTS the following conversation between Host and Expert:

Host: If you've been following the conversation coming out of Silicon Valley lately, you know the vibe is... well, it's less technological revolution and more existential reckoning.
Expert: Mmhmm.
Host: And the message from tech leaders about AI is almost unified now. It's pitched as this kind of tough love realism, right? AI is coming for jobs, and our only option is to "adapt, learn the tools".
Expert: Yeah.
Host: But the sources we dug into this week, they really poke a hole in that analogy. They point out the dark truth hidden inside of it.
Expert: Which is... horses didn't lead the automobile revolution? They didn't pivot to truck driving?
Host: No, they didn't. They lost agency, they lost capital. Their population just plummeted. By something like 88% in less than 50 years.
Expert: Exactly. And that's the core of it. If we just accept that we're supposed to rent the tools of automation from a very concentrated few, we are accepting the horse's path. So the real question is, can we design a different one?
Host: And that is where this radical, really structural alternative comes in. The material we deep dived into this week proposes a concept called "The Grove".
Expert: And it's not just another app or platform. It's framed explicitly as a "world changing play for distributed intelligence". It tries to completely flip that centralized ownership model on its head. The goal is to make participation itself create ownership.
Host: That's the tension. Right now, all the AI infrastructure, all the capital, it's concentrating in just a handful of companies. The Grove is this aggressive bet to distribute both the computing power and the capital that comes from it.
Expert: So our mission today is to really get into that plan. We're gaming it out. Just how wild, but also how plausible, is this idea of a distributed AI civilization?
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