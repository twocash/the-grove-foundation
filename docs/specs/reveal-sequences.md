# Reveal Sequences — Copy & Flow

## Overview

The Terminal has THREE reveal moments, each building on the last:

1. **Simulation Reveal** — "You're already in the Grove"
2. **Terminator Mode** — See the network as agents see it
3. **Founder Story** — The ratchet thesis and the invitation

Each reveal is earned through exploration depth.

---

## Reveal 1: The Simulation Reveal

**Trigger:** After completing first journey (4-7 cards)

**Context Line (appears subtly):**
```
───────────────────────────────────────────────────
You've been in the Grove for [X] minutes now.
───────────────────────────────────────────────────
```

**User clicks or hovers → Expand:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  This terminal isn't a mockup.                              │
│                                                             │
│  You're interacting with a RAG system that retrieves        │
│  context from distributed knowledge stores. Your lens       │
│  was generated locally. Your session state exists only      │
│  in your browser.                                           │
│                                                             │
│  No central server processed your persona.                  │
│  No cloud LLM holds your conversation history.              │
│                                                             │
│  This is what distributed AI infrastructure feels like.     │
│                                                             │
│  The simulation isn't coming.                               │
│  You're already in it.                                      │
│                                                             │
│  [Continue exploring]  [How does this work?]  [🤯]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**If user clicks "How does this work?":**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  THE ARCHITECTURE                                           │
│                                                             │
│  Your lens:          Generated client-side, stored locally  │
│  Your questions:     Processed, not stored                  │
│  The responses:      Assembled from distributed knowledge   │
│  Your session:       Encrypted in your browser              │
│                                                             │
│  What's real now:                                           │
│  → The RAG retrieval architecture                           │
│  → The persona-driven response shaping                      │
│  → The local-first privacy model                            │
│                                                             │
│  What's coming:                                             │
│  → True distributed inference across contributor nodes      │
│  → Agent communities running on personal computers          │
│  → Knowledge commons that no single entity controls         │
│                                                             │
│  You're using the demo. The Foundation is building          │
│  the infrastructure.                                        │
│                                                             │
│  [Continue exploring]  [Learn about the Foundation]         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Post-Reveal 1: Custom Lens Offer

**Trigger:** Immediately after Simulation Reveal is acknowledged

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  You've been exploring through the [Lens Name] lens.        │
│                                                             │
│  It shaped every response you received — the framing,       │
│  the emphasis, what got highlighted and what didn't.        │
│                                                             │
│  Want to create one that's uniquely yours?                  │
│                                                             │
│  [Build My Lens]         [Keep exploring with this one]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Reveal 2: Terminator Mode

**Trigger:** After exploring 5+ topics OR creating custom lens OR 10+ minutes

**Subtle prompt:**

```
───────────────────────────────────────────────────
You've explored [X] topics through your lens.
Want to see what the agents see?
[Activate Terminator Lens]
───────────────────────────────────────────────────
```

**On activation:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ▓▓▓ TERMINATOR LENS ACTIVE ▓▓▓                             │
│                                                             │
│  Overlay mode enabled.                                      │
│  You now see the Grove as the agents experience it.         │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ NETWORK STATUS                                        │  │
│  │ ─────────────────────────────────────────────────     │  │
│  │ Connected nodes:              847                     │  │
│  │ Your contribution:            0.003% of reasoning     │  │
│  │ Knowledge commons queries:    12,847/sec              │  │
│  │ Efficiency credits:           2.4M in circulation     │  │
│  │ Active agent communities:     34                      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Every response you received was assembled from             │
│  fragments across the network.                              │
│                                                             │
│  No single node held your conversation.                     │
│  No single entity controlled the knowledge.                 │
│                                                             │
│  The agents don't experience "The Grove."                   │
│  They experience each other.                                │
│                                                             │
│  [Return to human view]  [Stay in Terminator mode]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**In Terminator Mode, responses include metadata overlay:**

```
┌─────────────────────────────────────────────────────────────┐
│ ▓ TERMINATOR VIEW                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Normal response text appears here...]                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ ASSEMBLY METADATA                                           │
│ Sources: 7 knowledge fragments                              │
│ Retrieval: 124ms                                            │
│ Synthesis: 847ms                                            │
│ Lens modulation: Reluctant Technologist (custom)            │
│ Arc phase: mechanics (emphasis: 4/4)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Reveal 3: The Founder Story

**Trigger:** After Terminator Mode activated OR 15+ minutes OR viewing conversion CTAs

**Transition:**

```
───────────────────────────────────────────────────
One more thing.
───────────────────────────────────────────────────
```

**The Reveal:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Everything you just experienced — the lens, the Terminal,  │
│  the architecture — was built by one person working with    │
│  frontier AI.                                               │
│                                                             │
│  Not a technical founder. Not a VC-backed team.             │
│  A strategist who figured out how to think alongside AI.    │
│                                                             │
│  ───────────────────────────────────────────────────────    │
│                                                             │
│  That's the point.                                          │
│                                                             │
│  The Grove thesis isn't "AI will save us" or "AI will       │
│  destroy us." It's simpler:                                 │
│                                                             │
│  Distributed intelligence beats concentrated genius.        │
│                                                             │
│  And this Terminal is the proof.                            │
│                                                             │
│  ───────────────────────────────────────────────────────    │
│                                                             │
│  If one person can orchestrate this in weeks, imagine       │
│  what a network of 10,000 can build in years.               │
│                                                             │
│  The genius isn't the founder.                              │
│  The genius is the system.                                  │
│                                                             │
│  And you're already part of it.                             │
│                                                             │
│  [Learn about the Ratchet]  [Meet the Foundation]  [Join]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**If user clicks "Learn about the Ratchet":**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  THE RATCHET THESIS                                         │
│                                                             │
│  AI capabilities propagate. Always.                         │
│                                                             │
│  What runs on a $100M cluster today runs on a laptop        │
│  in 21 months. The doubling time is 7 months. The lag       │
│  from frontier to edge is predictable.                      │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │  2023: GPT-4 requires datacenter                      │  │
│  │  2024: Llama-70B runs on high-end desktop             │  │
│  │  2025: Capable agents run on personal computers       │  │
│  │  2026: [The Grove's window opens]                     │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  The question isn't whether AI capability will              │
│  distribute. It's who builds the infrastructure             │
│  when it does.                                              │
│                                                             │
│  Big Tech is building for concentration.                    │
│  The Grove is building for distribution.                    │
│                                                             │
│  The ratchet only turns one way.                            │
│  We're just positioning for where it lands.                 │
│                                                             │
│  [Back]  [Read the White Paper]  [Join the Foundation]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Founder Bio (For AI Context)

**Use this to personalize the founder story reveal based on user's lens:**

```
Jim Calhoun built The Grove Terminal in weeks, not months — 
working alongside frontier AI as a thinking partner rather 
than a tool.

Background:
- Studied information theory at journalism school
- Worked in Silicon Valley during the open internet era
- Experimented with NLP and early ChatGPT applications
- Saw AI capability consolidation as the defining structural risk
- Built Grove as countervailing infrastructure

The insight: AI is already distributed across frontier labs, 
open-source projects, and research institutions. The 
capability propagation (the "ratchet") is inevitable. The 
only question is whether the infrastructure captures it for 
concentration or distribution.

The proof: This Terminal. One person, frontier AI partnership, 
weeks of development. If distributed intelligence works at 
scale 1, it works at scale 10,000.

Philosophy: The founder role is to catalyze, not to lead 
permanently. The Grove Foundation is designed to become 
obsolete — replaced by the community it creates.
```

---

## Reveal Sequencing Logic

```typescript
interface RevealState {
  simulationRevealShown: boolean;
  simulationRevealAcknowledged: boolean;
  customLensOfferShown: boolean;
  terminatorModeUnlocked: boolean;
  terminatorModeActive: boolean;
  founderStoryShown: boolean;
}

function shouldShowSimulationReveal(session: TerminalSession): boolean {
  return (
    session.journeysCompleted >= 1 &&
    !session.revealState.simulationRevealShown
  );
}

function shouldOfferCustomLens(session: TerminalSession): boolean {
  return (
    session.revealState.simulationRevealAcknowledged &&
    !session.customLensId &&
    !session.revealState.customLensOfferShown
  );
}

function shouldUnlockTerminatorMode(session: TerminalSession): boolean {
  return (
    session.revealState.simulationRevealAcknowledged &&
    (
      session.topicsExplored >= 5 ||
      session.customLensId !== null ||
      session.minutesActive >= 10
    ) &&
    !session.revealState.terminatorModeUnlocked
  );
}

function shouldShowFounderStory(session: TerminalSession): boolean {
  return (
    (
      session.revealState.terminatorModeActive ||
      session.minutesActive >= 15 ||
      session.ctaViewed
    ) &&
    !session.revealState.founderStoryShown
  );
}
```

---

## Copy Variants by Archetype

**Simulation Reveal — Archetype-specific framing:**

| Archetype | Opening Line |
|-----------|--------------|
| Academic | "This terminal is a working prototype of the research infrastructure we're proposing." |
| Engineer | "The architecture you've been exploring? You're running on it." |
| Concerned Citizen | "You just experienced what distributed AI feels like — no Big Tech in the loop." |
| Geopolitical | "This is the countervailing infrastructure in action." |
| Big AI Exec | "This is the hedge. Running. Now." |
| Family Office | "The infrastructure thesis you just explored? You're the proof of concept." |

**Founder Story — Archetype-specific endings:**

| Archetype | Call to Action |
|-----------|----------------|
| Academic | "The Research Council is forming. Nominate a colleague." |
| Engineer | "The codebase is open. The architecture is documented. What would you build?" |
| Concerned Citizen | "You've seen the alternative. Share it with someone who needs to." |
| Geopolitical | "The Advisory Board is forming. We need policy thinkers." |
| Big AI Exec | "Request a confidential briefing. The strategic optionality is real." |
| Family Office | "The Founding Circle is forming. This is the ground floor." |
