# **The Sprout System**

*Recursive Content Refinement Architecture*

From Ephemeral LLM Output to Knowledge Commons

# **Executive Summary**

The Sprout System transforms the Grove Terminal from a content delivery interface into a content refinement engine. When users encounter valuable LLM responses, they can capture them as 'sprouts'—preserved verbatim with full provenance—that enter a lifecycle toward potential inclusion in the Knowledge Commons.

This architecture establishes the Terminal as the human interface to Grove's attribution economy. Every sprout carries metadata about what produced it: the query, the persona, the RAG context loaded, the session state. This provenance chain—preserved exactly as generated—becomes the foundation for derivative innovation and credit attribution.

***Key Principle:** The sprout is not a summary or synthesis. It is the exact LLM output, frozen at the moment of capture, with complete context about its generation.*

# **The Big Picture: Knowledge Commons Integration**

Grove's Knowledge Commons represents a fundamentally different approach to innovation sharing. The white paper establishes core principles that the Sprout System implements at the Terminal layer:

* **Attribution Chains:** When knowledge propagates, credit flows upstream. A sprout that becomes hub content generates attribution for its creator.  
* **Derivative Innovation:** The most valuable innovations build on previous work. Sprouts preserve the original exactly, enabling clear attribution when derivatives emerge.  
* **Preprint Model:** Innovations become available immediately upon publication, with quality signals accumulating through adoption rather than pre-publication gatekeeping.  
* **The Newswire Vision:** At network scale, documented breakthroughs create cognitive history—told in the voices of those who lived it, captured before anyone knew it mattered.

The Sprout System is where this vision touches individual users. The Terminal becomes a mining interface where valuable LLM outputs get captured, annotated, and promoted into the collective intelligence.

# **Core Metaphor: The Garden**

Grove's botanical metaphor extends naturally to content lifecycle:

| Stage | Description |
| :---- | :---- |
| **Seed** | Raw LLM output—ephemeral, lost when conversation ends |
| **Sprout** | Captured via /sprout command—preserved verbatim with full provenance |
| **Sapling** | Validated by community review—confirmed accurate and valuable |
| **Tree** | Integrated into Knowledge Commons—now shapes future LLM responses |
| **Grove** | Network-wide adoption—credit flows to original creators |

***Design Pattern:** The recursion closes: Trees (published content) shape future Seeds (LLM output), which can become new Sprouts. The system learns through use.*

# **Data Model**

## **Sprout Schema**

Each sprout captures the complete context of its generation:

interface Sprout {  
id: string;                    // Unique identifier  
capturedAt: string;            // ISO timestamp

// The preserved content (VERBATIM)  
response: string;              // Exact LLM output  
query: string;                 // What generated this

// Generation context (for attribution)  
contextLoaded: string\[\];       // RAG files used  
personaId: string;             // Lens active  
journeyId?: string;            // If in journey mode  
hubId?: string;                // Topic hub matched

// Lifecycle  
status: 'sprout' | 'sapling' | 'tree' | 'rejected';  
tags: string\[\];                // User annotations  
notes?: string;                // Human commentary

// Attribution chain  
creatorId?: string;            // Grove ID (future)  
sessionId: string;             // MVP: anonymous session  
derivedFrom?: string;          // Parent sprout ID  
derivatives: string\[\];         // Child sprout IDs

// Promotion tracking  
promotedToFile?: string;       // Where it ended up  
promotedAt?: string;  
}

## **Storage Architecture**

Sprouts live in a separate registry from narratives.json—different lifecycle, different access patterns:

* **MVP:** sprouts.json in GCS, synced via rolling PR workflow  
* **Future:** Distributed storage across Grove network, replicated per community  
* **Attribution:** Each sprout maintains provenance chain regardless of storage location

# **Slash Command Interface**

The Terminal already supports / commands. Sprout commands extend this naturally:

| Command | Description |
| :---- | :---- |
| /sprout | Capture last response as sprout with default metadata |
| /sprout \--tag=ratchet | Associate sprout with a hub for routing |
| /sprout \--note="..." | Add human annotation explaining why this matters |
| /garden | View my sprouts this session |
| /stats | View exploration stats including sprout contributions |

# **Permissions Model**

## **MVP: Open Capture**

For the MVP, anyone can sprout to experience the app. This creates immediate value:

* Users discover they're not just consuming—they're contributing  
* Sprouts accumulate in a staging area for admin review  
* No account required—session ID tracks anonymous contributions  
* Promotion to Knowledge Commons requires admin validation

## **Future: Grove ID Integration**

The full Knowledge Commons vision requires identity and attribution:

* **Grove ID:** Persistent identity across the network, tied to community membership  
* **Attribution Chains:** When a sprout becomes a tree, credit flows to the Grove ID that planted it  
* **Derivative Credit:** When someone builds on your sprout, both receive attribution  
* **Reputation:** Users who consistently contribute quality sprouts build trust scores

  ***Forward Compatibility:** The MVP plants seeds for this architecture. Every anonymous sprout can be claimed later when Grove ID launches.*

# **The Feedback Loop: /stats Integration**

Users should see when their contributions matter. The /stats page becomes the feedback mechanism:

## **Stats Dashboard Elements**

* **Sprouts Planted:** How many responses you've captured  
* **Saplings Growing:** How many are under review  
* **Trees in the Grove:** How many reached the Knowledge Commons  
* **Network Impact:** How many times your trees influenced responses

## **Notification Patterns**

When a sprout advances in lifecycle:

* **Toast notification:** "Your insight about the Ratchet effect was promoted to the Knowledge Commons\!"  
* **Stats badge:** Visual indicator of new activity  
* **Attribution display:** When responses use your content, show subtle credit

# **Implementation Phases**

## **Phase 1: Capture (MVP)**

1. Add /sprout command to CommandInput.tsx  
2. Create sprouts.json schema in data/  
3. Store with session context (query, persona, RAG files)  
4. Add to /garden view in stats  
5. Toast confirmation on capture

## **Phase 2: Review (Admin)**

1. Sprout queue in Foundation admin  
2. Promote/reject actions  
3. View generation context  
4. Tag management

## **Phase 3: Attribution (Future)**

* Grove ID integration  
* Credit flow when sprouts become trees  
* Derivative tracking  
* Network-wide propagation

# **Why This Matters**

The Sprout System closes the loop on Grove's fundamental proposition: users aren't just consuming AI-generated content—they're cultivating collective intelligence.

When someone captures a particularly clear explanation of the Ratchet effect, or a novel framing of the infrastructure bet, or an insight that bridges two hubs in unexpected ways—that's not just engagement. That's contribution to a growing knowledge commons that becomes more valuable as it grows.

The Terminal transforms from a chatbot interface into a mining operation. Every conversation has the potential to surface gold. Every user is a prospector in the attention economy, but instead of extracting value for a platform, they're contributing to a commons that credits them as knowledge propagates.

***The Vision:** This is the Newswire vision made tangible: cognitive history documented in real-time, before anyone knew it mattered.*

# **Architectural Alignment**

The Sprout System exemplifies Grove's declarative architecture philosophy:

* **Data layer sophistication:** Sprouts are just another registry with well-defined schema  
* **Skinnable experiences:** The /garden view, promotion workflow, and stats display can all be configured without code  
* **Progressive enhancement:** MVP works with anonymous sessions; future adds identity layer  
* **Separate lifecycles:** Sprouts don't pollute narratives.json; they mature into it

The system designed to let humans cultivate AI agents... is itself cultivated by humans through use. The recursion is complete.

# **Next Steps**

* Review this architecture with advisory council perspectives (Short on voice, Taylor on community)  
* Draft sprint spec for Phase 1 implementation  
* Design /garden UI mockup  
* Define promotion workflow for Foundation admin  
* Explore Grove ID integration timeline