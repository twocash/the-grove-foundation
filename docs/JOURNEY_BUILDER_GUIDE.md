# Grove Journey Builder Guide
## Creating New Journeys from RAG Content

This guide documents the process for generating new journeys as the Grove knowledge base expands.

---

## Quick Reference

**Files involved (New Split Architecture):**
- `data/exploration/journeys.json` — Journey definitions
- `data/exploration/nodes.json` — Node definitions
- `data/knowledge/hubs.json` — Hub definitions (RAG context)
- `data/knowledge/default-context.json` — Tier 1 default files
- `data/presentation/lenses.json` — Persona messaging
- `data/infrastructure/gcs-mapping.json` — GCS file path mappings
- `data/infrastructure/feature-flags.json` — Feature toggles
- `data/schema/grove-knowledge-ontology.md` — Architecture documentation (also RAG content)

**Legacy (deprecated):**
- `data/narratives.json` — Unified registry (kept for backward compatibility)

**Commands:**
```bash
# List available hubs
node scripts/kb.js list --hubs

# View a specific hub's content
node scripts/kb.js hub <hub-id>

# Search across all RAG files
node scripts/kb.js search <term>

# Export all RAG content locally
node scripts/kb.js export-all

# Validate knowledge schema
node scripts/validate-knowledge-schema.js
```

---

## Journey Anatomy

### Journey Definition (in `data/exploration/journeys.json`)
```json
{
  "id": "unique-journey-id",
  "title": "Human-readable title",
  "description": "1-2 sentence hook for journey picker",
  "entryNode": "first-node-id",
  "targetAha": "The insight users should reach by journey end",
  "hubId": "hub-id-for-rag-context",
  "estimatedMinutes": 8,
  "status": "active"
}
```

### Node Definition (in `data/exploration/nodes.json`)
```json
{
  "id": "unique-node-id",
  "label": "Short, provocative card label",
  "query": "The prompt sent to LLM. Tells it what to explain and how.",
  "contextSnippet": "Context shown in UI. Also primes the LLM response tone.",
  "sectionId": "thematic-section",
  "journeyId": "parent-journey-id",
  "sequenceOrder": 1,
  "primaryNext": "next-node-id",
  "alternateNext": ["other-option-1", "other-option-2"]
}
```

---

## Journey Design Principles

### 1. The Narrative Arc
Every journey follows a 3-5 node arc:

```
HOOK → TENSION → INSIGHT → RESOLUTION → CONNECTION
```

| Phase | Purpose | Node Type |
|-------|---------|-----------|
| **Hook** | Grab attention, create curiosity | Question or provocative claim |
| **Tension** | Introduce the problem/conflict | Stakes, tradeoffs, what's at risk |
| **Insight** | The "aha" moment | Core concept explained |
| **Resolution** | What this means for the user | Practical implications |
| **Connection** | Link to other journeys | Exit ramp to related content |

### 2. Node Labels (The Cards)
Labels appear on journey cards. They should be:
- **Short** (under 40 characters)
- **Provocative** (create curiosity)
- **Not self-explanatory** (users should want to click)

**Good labels:**
- "The 21-month lag is your window."
- "You're reading their diary right now."
- "The trap isn't the cost."

**Bad labels:**
- "Understanding the Ratchet Effect"
- "How Diary Systems Work"
- "Cloud vs Local Compute"

### 3. Query Design
The `query` field is the prompt sent to the LLM. It should:
- Tell the LLM **what to explain**
- Specify **how to frame it** (stance, tone)
- Include **requirements** if specific RAG content is needed

**Template:**
```
Explain [CONCEPT]. [FRAMING INSTRUCTION]. [RHETORICAL GOAL].
```

**Examples:**
```
"Explain the 21-month frontier-to-edge lag. Why is this gap both a problem AND an opportunity?"

"Reveal the connection: the Terminal responses are diary-like outputs. How does this create the 'Observer' relationship?"

"Explain Grove's hybrid local-cloud architecture. How does the 'constant hum' combine with 'breakthrough moments'? Why is this the structural answer?"
```

### 4. Context Snippets
The `contextSnippet` appears in the UI and primes LLM responses. It should:
- Be 1-3 sentences
- State the core insight directly
- Use the same tone/voice as desired LLM output

**Tip:** Write the contextSnippet as if it's the first paragraph of the ideal response.

### 5. Linking Strategy
Every journey should connect to others via `alternateNext`:
- Exit to **higher-level journeys** (simulation, stakes)
- Exit to **adjacent concepts** (ratchet → architecture)
- Never dead-end (always offer at least one alternate)

---

## Journey Creation Workflow

### Phase 1: Identify Content
```bash
# Export current RAG
node scripts/kb.js export-all

# Search for potential journey topics
node scripts/kb.js search "emergence"
node scripts/kb.js search "diary"
node scripts/kb.js search "credit"
```

**Good journey candidates:**
- Topics with 2,000+ words of RAG content
- Concepts that support a clear "aha" moment
- Content that serves a specific persona

### Phase 2: Map the Arc
Before writing JSON, outline the journey:

```
Journey: [TITLE]
Target Aha: [What should users understand?]
Hub: [Which hub provides RAG context?]

1. HOOK: [Provocative opening question]
2. TENSION: [What's at stake?]
3. INSIGHT: [Core concept]
4. RESOLUTION: [So what?]
5. CONNECTION: [Link to next journey]
```

### Phase 3: Write Node Definitions
For each node in your arc:

1. **Write the label first** — This forces clarity
2. **Write the contextSnippet** — This is your "ideal first paragraph"
3. **Write the query** — Tell the LLM how to expand on the snippet
4. **Assign sequenceOrder** — 1, 2, 3, 4, 5...
5. **Link to next** — primaryNext + alternateNext

### Phase 4: Add to knowledge files
1. Add journey definition to `data/exploration/journeys.json`
2. Add all nodes to `data/exploration/nodes.json`
3. If new hub needed, add to `data/knowledge/hubs.json`
4. Validate: `node scripts/validate-knowledge-schema.js`
5. Test locally: `npm run dev`

### Phase 5: Test the Journey
1. Start the Terminal
2. Type `/journeys` to see available journeys
3. Start your new journey
4. Verify:
   - Does each node render?
   - Does the "next" card appear?
   - Does the RAG context feel relevant?
   - Does the arc build toward the target aha?

---

## Linking Journeys to Hubs

Journeys pull RAG context from hubs via `hubId`. The hub determines:
- Which files are loaded into context
- How much context budget is allocated
- What tags route free-form queries to this content

**Hub structure (in `data/knowledge/hubs.json`):**
```json
{
  "id": "diary-system",
  "title": "The Diary System",
  "thesis": "Agents develop identity through reflective self-narrative.",
  "path": "hubs/diary-system/",
  "primaryFile": "diary-deep-dive.md",
  "maxBytes": 50000,
  "tags": ["diary", "memory", "narrative", "voice"],
  "status": "active"
}
```

**If your journey needs new RAG:**
1. Upload content to GCS bucket under `hubs/<hub-id>/`
2. Add or update hub definition in `data/knowledge/hubs.json`
3. Set `hubId` in journey definition in `data/exploration/journeys.json`

---

## Persona Alignment

Design journeys for specific personas:

| Persona | Journey Style | Arc Emphasis |
|---------|---------------|--------------|
| **Concerned Citizen** | Stakes-heavy | Hook → Stakes → Fear → Hope |
| **Academic** | Evidence-first | Claim → Evidence → Implication |
| **Engineer** | Mechanics-deep | Problem → Architecture → Implementation |
| **Geopolitical** | Power-focused | Context → Stakes → Systemic Risk |
| **Family Office** | Resolution-oriented | Problem → Solution → Opportunity |

**Tip:** The same RAG content can support multiple journeys with different framings. A "Ratchet" journey for engineers emphasizes technical details; for concerned citizens, it emphasizes what they can do about it.

---

## Journey Templates

### Template A: Concept Explainer (4 nodes)
```
1. [concept]-hook     — Provocative opening
2. [concept]-problem  — Why this matters
3. [concept]-insight  — The core idea
4. [concept]-action   — What to do with this
```

### Template B: Deep Dive (5 nodes)
```
1. [topic]-hook       — Entry question
2. [topic]-context    — Background
3. [topic]-mechanism  — How it works
4. [topic]-evidence   — Proof it's real
5. [topic]-implication — So what?
```

### Template C: Revelation (3 nodes)
```
1. [reveal]-setup     — Establish expectation
2. [reveal]-twist     — Subvert expectation
3. [reveal]-meaning   — Why this matters
```

---

## Common Mistakes

**❌ Too abstract**
```
"Explain distributed systems architecture."
```

**✓ Concrete and specific**
```
"Explain what actually runs on a user's machine in a Grove village. What's the compute requirement? What models?"
```

**❌ Labels that explain too much**
```
"How the Diary System Creates Agent Identity"
```

**✓ Labels that create curiosity**
```
"Why do agents write to themselves?"
```

**❌ No exit ramps**
```
"primaryNext": null
```

**✓ Always link forward**
```
"primaryNext": "sim-hook",
"alternateNext": ["stakes-380b", "diary-hook"]
```

---

## Maintenance Checklist

When adding new journeys:
- [ ] Journey definition added to `data/exploration/journeys.json`
- [ ] All nodes added to `data/exploration/nodes.json`
- [ ] `hubId` points to valid hub in `data/knowledge/hubs.json`
- [ ] All `primaryNext` IDs exist in nodes.json
- [ ] All `alternateNext` IDs exist in nodes.json
- [ ] `sequenceOrder` is sequential (1, 2, 3...)
- [ ] Schema validated: `node scripts/validate-knowledge-schema.js`
- [ ] Tested in local dev: `npm run dev`

---

## Quick Add Checklist

For rapid journey creation:

1. **Topic:** What concept does this journey explain?
2. **Aha:** What should users understand by the end?
3. **Hub:** Which hub provides RAG? (or create new one in `data/knowledge/hubs.json`)
4. **Nodes:** 3-5 nodes following HOOK → TENSION → INSIGHT → RESOLUTION
5. **Labels:** Short, provocative, curiosity-inducing
6. **Links:** Every node has primaryNext + alternateNext
7. **Validate:** `node scripts/validate-knowledge-schema.js`
8. **Test:** Start the journey in Terminal

---

*This guide is part of the Grove Foundation documentation. Last updated: December 2024.*
