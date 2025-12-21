# Journey Expansion Pack
## Quick-Add Journeys for Grove Terminal

These are ready-to-paste JSON additions for narratives.json.

---

## 1. RATCHET JOURNEY EXPANSION

The ratchet journey currently has only 1 node. Add these 3 nodes to complete it:

### Add to `nodes` section:

```json
"ratchet-gap": {
  "id": "ratchet-gap",
  "label": "The 21-month lag is your window.",
  "query": "Explain the 21-month frontier-to-edge lag. What does it mean that local models are always 21 months behind frontier? Why is this gap both a problem AND an opportunity?",
  "contextSnippet": "Local models trail frontier by 21 months—roughly 3 doubling cycles. This creates a constant 8x capability gap. But the floor keeps rising. What was impossible locally in 2023 is routine in 2025.",
  "sectionId": "ratchet",
  "journeyId": "ratchet",
  "sequenceOrder": 2,
  "primaryNext": "ratchet-floor",
  "alternateNext": ["stakes-380b"]
},
"ratchet-floor": {
  "id": "ratchet-floor",
  "label": "The rising floor changes everything.",
  "query": "Explain 'the rising floor' concept. If local capability keeps doubling, what tasks become possible on your own hardware? What's the implication for ownership vs. renting?",
  "contextSnippet": "Today's local 7B model matches GPT-3.5 from 18 months ago. In 18 more months, it matches today's frontier. The question isn't whether local can catch up—it's what you can do while it does.",
  "sectionId": "ratchet",
  "journeyId": "ratchet",
  "sequenceOrder": 3,
  "primaryNext": "ratchet-hybrid",
  "alternateNext": ["sim-hook"]
},
"ratchet-hybrid": {
  "id": "ratchet-hybrid",
  "label": "The hybrid architecture.",
  "query": "Explain Grove's hybrid local-cloud architecture. How does the 'constant hum' of local models combine with 'breakthrough moments' from frontier? Why is this the structural answer?",
  "contextSnippet": "Grove agents run 95% of cognition locally—the routine, the remembered, the reflexive. Cloud capability is reserved for pivotal moments: synthesis, breakthrough, connection. You own the hum. You rent the spark.",
  "sectionId": "ratchet",
  "journeyId": "ratchet",
  "sequenceOrder": 4,
  "primaryNext": "sim-hook",
  "alternateNext": ["stakes-380b"]
}
```

### Update the journey definition:

```json
"ratchet": {
  "id": "ratchet",
  "title": "The Ratchet",
  "description": "Why AI capability is doubling every 7 months—and why you're 21 months behind.",
  "entryNode": "ratchet-hook",
  "targetAha": "The gap is constant, but the floor keeps rising. Ownership beats renting when the floor is high enough.",
  "linkedHubId": "ratchet-effect",
  "estimatedMinutes": 10,
  "status": "active"
}
```

---

## 2. NEW: DIARY JOURNEY

A new 4-node journey explaining the diary system—good for users interested in the "how agents think" angle.

### Add to `journeys` section:

```json
"diary": {
  "id": "diary",
  "title": "The Agent's Inner Voice",
  "description": "How Grove agents develop memory, voice, and narrative identity through their diaries.",
  "entryNode": "diary-hook",
  "targetAha": "Diaries aren't logs. They're the mechanism through which agents develop selfhood.",
  "linkedHubId": "diary-system",
  "estimatedMinutes": 8,
  "status": "active"
}
```

### Add to `nodes` section:

```json
"diary-hook": {
  "id": "diary-hook",
  "label": "Why do agents write to themselves?",
  "query": "Explain why Grove agents keep diaries. What purpose does self-narrative serve for an AI system? Why is this different from logging?",
  "contextSnippet": "Grove agents write daily reflections not for record-keeping but for identity formation. The diary is where routine becomes memory, and memory becomes personality.",
  "sectionId": "diary",
  "journeyId": "diary",
  "sequenceOrder": 1,
  "primaryNext": "diary-voice",
  "alternateNext": ["sim-observer"]
},
"diary-voice": {
  "id": "diary-voice",
  "label": "The voice that emerges.",
  "query": "Explain how diary-writing develops an agent's unique voice. How do two agents with identical architectures develop different personalities through their reflections?",
  "contextSnippet": "Voice emerges from accumulated choices. Which problems did the agent notice? Which metaphors recur? The diary captures these patterns until they become recognizable—a self.",
  "sectionId": "diary",
  "journeyId": "diary",
  "sequenceOrder": 2,
  "primaryNext": "diary-memory",
  "alternateNext": ["sim-split"]
},
"diary-memory": {
  "id": "diary-memory",
  "label": "Memory that compounds.",
  "query": "Explain how diary entries become retrieval-augmented memory. How does an agent's past inform its present responses? What's the difference between database storage and narrative memory?",
  "contextSnippet": "Diary entries aren't just stored—they're indexed by emotional resonance, thematic connection, and narrative arc. When an agent faces a new problem, it doesn't query a database. It remembers.",
  "sectionId": "diary",
  "journeyId": "diary",
  "sequenceOrder": 3,
  "primaryNext": "diary-observer",
  "alternateNext": ["ratchet-hook"]
},
"diary-observer": {
  "id": "diary-observer",
  "label": "You're reading their diary right now.",
  "query": "Reveal the connection: the Terminal responses are diary-like outputs. The user is experiencing what it's like to watch an agent develop through interaction. How does this create the 'Observer' relationship?",
  "contextSnippet": "Every response the Terminal generates is, in a sense, a diary entry—shaped by context, colored by accumulated pattern. You are the Observer, watching a mind form in real-time.",
  "sectionId": "diary",
  "journeyId": "diary",
  "sequenceOrder": 4,
  "primaryNext": "sim-hook",
  "alternateNext": ["stakes-380b"]
}
```

---

## 3. NEW: TECHNICAL ARCHITECTURE JOURNEY (For Engineers)

Quick 3-node journey for technically-minded users.

### Add to `journeys` section:

```json
"architecture": {
  "id": "architecture",
  "title": "Under the Hood",
  "description": "The technical architecture of distributed agent villages. For those who want to see the blueprints.",
  "entryNode": "arch-hook",
  "targetAha": "This isn't theoretical. The architecture exists and runs on commodity hardware.",
  "linkedHubId": null,
  "estimatedMinutes": 8,
  "status": "active"
}
```

### Add to `nodes` section:

```json
"arch-hook": {
  "id": "arch-hook",
  "label": "What actually runs on your machine?",
  "query": "Explain what runs locally in a Grove village. What's the compute requirement? What models, what memory architecture, what coordination layer?",
  "contextSnippet": "A Grove village runs on consumer hardware: 7-8B parameter models quantized for local inference. The local agent handles routine cognition. Cloud APIs handle breakthrough synthesis. Everything owned, nothing rented.",
  "sectionId": "architecture",
  "journeyId": "architecture",
  "sequenceOrder": 1,
  "primaryNext": "arch-coordination",
  "alternateNext": ["ratchet-hybrid"]
},
"arch-coordination": {
  "id": "arch-coordination",
  "label": "How do villages talk to each other?",
  "query": "Explain the coordination layer between Grove villages. How do agents discover each other? How does knowledge propagate without a central server?",
  "contextSnippet": "Villages coordinate through a distributed discovery protocol. No central server knows who participates. Knowledge propagates through merit: innovations that work get adopted, creators get attribution.",
  "sectionId": "architecture",
  "journeyId": "architecture",
  "sequenceOrder": 2,
  "primaryNext": "arch-credit",
  "alternateNext": ["stakes-rental"]
},
"arch-credit": {
  "id": "arch-credit",
  "label": "How does credit actually work?",
  "query": "Explain the credit system. How do agents earn access to cloud compute? How does contribution translate to capability? What prevents gaming the system?",
  "contextSnippet": "Credits flow from value creation. Solve a problem, earn credits. Share an innovation that others adopt, earn more. The credit system incentivizes contribution without requiring trust.",
  "sectionId": "architecture",
  "journeyId": "architecture",
  "sequenceOrder": 3,
  "primaryNext": "sim-hook",
  "alternateNext": ["diary-hook"]
}
```

---

## HOW TO APPLY

1. Open `data/narratives.json` in your local repo
2. Find the `"journeys": {` section and add the new journey definitions
3. Find the `"nodes": {` section and add the new node definitions
4. Save and test with `npm run dev`
5. Or use the admin panel at `?admin=true` to verify

**Testing:**
- Type `/journeys` in the Terminal to see available journeys
- Start each journey and verify the node progression
- Check that `linkedHubId` connects to correct RAG content

---

## LINKING TO HUBS

Make sure these hubs exist in the `hubs` section:
- `ratchet-effect` ✓ (already exists)
- `diary-system` ✓ (already exists)
- For `architecture` journey, can add a new hub or use existing RAG

---

*Generated for quick manual addition to Grove Terminal*
