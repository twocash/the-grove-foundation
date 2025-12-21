# Headline Configuration Guide

> Configuring lens-specific headlines for the Quantum Interface

## Overview

The Grove's landing page adapts its content based on the active lens/persona. Each lens can have a unique "reality" with customized headlines, subtext, quotes, and tension framing.

**Architecture:**
```
Priority 1: schema.lensRealities (GCS-backed narratives.json)
Priority 2: SUPERPOSITION_MAP (hardcoded fallback in quantum-content.ts)
Priority 3: DEFAULT_REALITY (when no lens is selected)
```

---

## Available Lenses (7 total)

| Lens ID | Label | Headline | Status |
|---------|-------|----------|--------|
| `freestyle` | Freestyle | `OWN YOUR AI.` | ✅ |
| `concerned-citizen` | Concerned Citizen | `ADAPT? ADAPT AND OWN.` | ✅ |
| `academic` | Academic | `THE EPISTEMIC COMMONS.` | ✅ |
| `engineer` | Engineer | `LOCAL HUMS. CLOUD BREAKS THROUGH.` | ✅ |
| `geopolitical` | Geopolitical Analyst | `SOVEREIGN INTELLIGENCE.` | ✅ |
| `big-ai-exec` | Big AI / Tech Exec | `THE EDGE HEDGE.` | ✅ |
| `family-office` | Family Office / Investor | `THE EDGE HEDGE.` | ✅ |

---

## LensReality Schema

```typescript
interface LensReality {
  hero: {
    headline: string;    // "OWN YOUR AI."
    subtext: string[];   // ["Don't rent it.", "Grow your own."]
  };
  problem: {
    quotes: Array<{
      text: string;      // Quote content
      author: string;    // "SUNDAR PICHAI" (ALL CAPS)
      title: string;     // "GOOGLE CEO"
    }>;
    tension: string[];   // ["What THEY do.", "What WE do."]
  };
}
```

---

## Rhetorical Guidelines

**The goal: hit the right note, fit the space, make it land.**

These are guidelines, not formulas. The best headlines break patterns when breaking them works.

### Hero Headline
- **Constraint:** ≤40 characters, ALL CAPS, ends with period
- **Goal:** Visceral. Memorable. Says something THIS persona cares about.
- **Anti-pattern:** Formulas like "[NOUN] IS THE [NOUN]." get stale fast.

**Good examples:**
```
OWN YOUR AI.                        // Direct, personal
ADAPT? ADAPT AND OWN.               // Counters their framing
LOCAL HUMS. CLOUD BREAKS THROUGH.   // Describes the architecture poetically
THE EDGE HEDGE.                     // Rhymes, memorable, business-coded
SOVEREIGN INTELLIGENCE.             // One phrase does all the work
```

### Hero Subtext
- **Constraint:** 2 lines, complete the thought
- **Goal:** Line 1 sets up tension or context. Line 2 lands the point.
- **Anti-pattern:** "Not X. Not Y. Not Z." formula—use sparingly.

**Good examples:**
```
Don't rent it.
Grow your own.

They say learn to use AI.
We say learn to own it.

Three companies will control intelligence.
What's your hedge?
```

### Tension
- **Format:** THEY do X / WE do Y (one line each)
- **Goal:** Sharp contrast. Make the alternative clear.

**Good examples:**
```
They tell you to 'adapt.'
We say: own it instead.

They build moats around data centers.
We build protocols for edge clusters.
```

### Quotes
- 3 quotes from authorities THIS PERSONA respects
- Author names in ALL CAPS
- Short, punchy titles
- Can be real quotes or representative framings (label appropriately)

---

## Current Configuration

All lens realities are stored in `data/narratives.json` under the `lensRealities` key.

### Example: Engineer Lens

```json
{
  "engineer": {
    "hero": {
      "headline": "LOCAL HUMS. CLOUD BREAKS THROUGH.",
      "subtext": ["7B for routine. Frontier for insight.", "Both owned."]
    },
    "problem": {
      "quotes": [
        {"text": "We are constrained by thermal density and power distribution.", "author": "MARK ZUCKERBERG", "title": "META"},
        {"text": "The cost of compute is the primary bottleneck.", "author": "JENSEN HUANG", "title": "NVIDIA"},
        {"text": "Centralized models are hitting a data wall.", "author": "YANN LECUN", "title": "META AI"}
      ],
      "tension": ["They build moats around data centers.", "We build protocols for edge clusters."]
    }
  }
}
```

### Default Reality (no lens selected)

```json
{
  "defaultReality": {
    "hero": {
      "headline": "YOUR AI.",
      "subtext": ["Not rented. Not surveilled. Not theirs.", "Yours."]
    },
    "problem": {
      "quotes": [
        {"text": "AI is the most profound technology humanity has ever worked on... People will need to adapt.", "author": "SUNDAR PICHAI", "title": "GOOGLE CEO"},
        {"text": "This is the new version of learning to code...", "author": "SAM ALTMAN", "title": "OPENAI CEO"},
        {"text": "I advise ordinary citizens to learn to use AI.", "author": "DARIO AMODEI", "title": "ANTHROPIC CEO"}
      ],
      "tension": ["They're building the future of intelligence.", "And they're telling you to get comfortable being a guest in it."]
    }
  }
}
```

---

## Generation Script

Use this script to generate headline OPTIONS for human review. The script produces multiple variants per persona—you pick the winners.

### `scripts/generate-lens-realities.js`

```javascript
#!/usr/bin/env node
/**
 * Generate LensReality OPTIONS for all personas using Gemini
 * 
 * This generates 3 variants per persona for human review.
 * The human picks the winners, then updates narratives.json.
 *
 * Usage:
 *   GEMINI_API_KEY=your_key node scripts/generate-lens-realities.js > lens-options.json
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable required');
  process.exit(1);
}

const PERSONAS = [
  {
    id: 'freestyle',
    label: 'Freestyle',
    description: 'Explore freely without a specific lens',
    seed: 'Curious, no agenda, just wants to understand'
  },
  {
    id: 'concerned-citizen',
    label: 'Concerned Citizen',
    description: "I'm worried about Big Tech's grip on AI",
    seed: 'Fears corporate control, wants agency, accessible language'
  },
  {
    id: 'academic',
    label: 'Academic',
    description: 'I work in research, university, or policy',
    seed: 'Epistemic independence, knowledge commons, enclosure concerns'
  },
  {
    id: 'engineer',
    label: 'Engineer',
    description: 'I want to understand how it actually works',
    seed: 'Architecture, trade-offs, hybrid local/cloud, protocols'
  },
  {
    id: 'geopolitical',
    label: 'Geopolitical Analyst',
    description: 'I think about power, nations, and systemic risk',
    seed: 'Sovereignty, concentration risk, power dynamics'
  },
  {
    id: 'big-ai-exec',
    label: 'Big AI / Tech Exec',
    description: 'I work at a major tech company or AI lab',
    seed: 'Business opportunity, edge economics, infrastructure layer'
  },
  {
    id: 'family-office',
    label: 'Family Office / Investor',
    description: 'I manage wealth and evaluate opportunities',
    seed: 'Investment thesis, platform risk hedge, long-term compounding'
  }
];

const SYSTEM_PROMPT = `You are writing landing page headlines for The Grove, a distributed AI infrastructure project.

The Grove's thesis: You should own your AI, not rent it. Distributed beats centralized. The edge is the hedge.

CONSTRAINTS:
- Headline: ≤40 characters, ALL CAPS, ends with period
- Subtext: 2 lines that complete the thought (not a formula—just make it land)
- Tension: THEY do X / WE do Y

QUALITY BAR:
- Visceral over clever
- Memorable over comprehensive  
- This persona's language, not generic tech-speak
- Break patterns when breaking them works

ANTI-PATTERNS TO AVOID:
- "Not X. Not Y. Not Z." on every subtext (use sparingly)
- "[NOUN] IS THE [NOUN]." headline formula (stale)
- Generic tech buzzwords the persona wouldn't use

Generate 3 DIFFERENT options. Vary the angle, not just the words.

OUTPUT FORMAT (JSON only, no markdown):
{
  "options": [
    {
      "tag": "A - [brief angle description]",
      "headline": "HEADLINE.",
      "subtext": ["Line 1", "Line 2"],
      "tension": ["They do X.", "We do Y."]
    },
    // ... options B and C
  ]
}`;

async function generateForPersona(persona) {
  const userPrompt = `PERSONA: ${persona.label}
DESCRIPTION: ${persona.description}
SEED IDEAS: ${persona.seed}

Generate 3 headline options for this persona. Each should hit a different angle.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
          { role: 'model', parts: [{ text: 'Understood. I will generate 3 distinct headline options per persona, varying the angle and avoiding formulaic patterns. Ready for persona details.' }] },
          { role: 'user', parts: [{ text: userPrompt }] }
        ],
        generationConfig: {
          temperature: 0.9,  // Higher for more variety
          maxOutputTokens: 1024
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No content in response');
  }

  // Parse JSON from response
  let jsonStr = text;
  if (text.includes('```json')) {
    jsonStr = text.split('```json')[1].split('```')[0].trim();
  } else if (text.includes('```')) {
    jsonStr = text.split('```')[1].split('```')[0].trim();
  }

  return JSON.parse(jsonStr);
}

async function main() {
  console.error('Generating lens reality OPTIONS for review...\n');

  const results = {};

  for (const persona of PERSONAS) {
    console.error(`  → ${persona.label}...`);
    try {
      const generated = await generateForPersona(persona);
      results[persona.id] = {
        persona: persona.label,
        description: persona.description,
        options: generated.options
      };
      console.error(`    ✓ Generated ${generated.options.length} options`);
    } catch (error) {
      console.error(`    ✗ Error: ${error.message}`);
      results[persona.id] = { error: error.message };
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 1200));
  }

  const output = {
    _generated: new Date().toISOString(),
    _instructions: [
      '1. Review each persona\'s options',
      '2. Pick one winner per persona (or write your own)',
      '3. Add quotes for each winner',
      '4. Update narratives.json with final selections',
      '5. Upload: gcloud storage cp data/narratives.json gs://grove-assets/narratives.json'
    ],
    personas: results
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch(console.error);
```

### Usage

```bash
# Generate options for review
GEMINI_API_KEY=your_key node scripts/generate-lens-realities.js > lens-options.json

# Review in editor
code lens-options.json

# Pick winners, add quotes, update narratives.json
# Then upload to GCS
gcloud storage cp data/narratives.json gs://grove-assets/narratives.json
```

---

## Verification

After updating `narratives.json` in GCS, verify in browser console:

```javascript
// Look for: [Quantum] Using predefined reality for: engineer (from schema)
// vs:       [Quantum] Using predefined reality for: engineer (from fallback)
```

---

## Hardcoded Fallbacks

These exist in `src/data/quantum-content.ts` as backup when schema loading fails:

| Lens | Headline |
|------|----------|
| `engineer` | "LATENCY IS THE MIND KILLER." |
| `academic` | "THE EPISTEMIC COMMONS." |
| `family-office` | "COMPOUNDING INTELLIGENCE." |
| (default) | "YOUR AI." |

**Note:** The fallbacks may drift from narratives.json. The schema is authoritative.

---

## Editorial Process

1. **Generate options** — Run the script to get 3 variants per persona
2. **Human review** — Pick winners based on what lands, not what follows the formula
3. **Add quotes** — Find 3 quotes from authorities each persona respects
4. **Test locally** — Verify JSON is valid, headlines render correctly
5. **Deploy** — Upload to GCS, verify `(from schema)` in console logs

**The human is the editor. The LLM is the writer's room.**

---

## Roadmap

- [ ] Add Foundation UI for editing lensRealities (RealityTuner console)
- [ ] Add A/B testing for headline variants
- [ ] Add analytics for headline engagement by lens
- [ ] Support for seasonal/campaign headline overrides
