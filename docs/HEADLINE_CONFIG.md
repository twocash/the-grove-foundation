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

| Lens ID | Label | Current Status |
|---------|-------|----------------|
| `freestyle` | Freestyle | No custom reality (uses default) |
| `concerned-citizen` | Concerned Citizen | No custom reality (uses default) |
| `academic` | Academic | ✅ Has custom reality |
| `engineer` | Engineer | ✅ Has custom reality |
| `geopolitical` | Geopolitical Analyst | No custom reality (uses default) |
| `big-ai-exec` | Big AI / Tech Exec | No custom reality (uses default) |
| `family-office` | Family Office / Investor | ✅ Has custom reality |

---

## LensReality Schema

```typescript
interface LensReality {
  hero: {
    headline: string;    // "LATENCY IS THE MIND KILLER."
    subtext: string[];   // ["Not rented. Not surveilled.", "Yours."]
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

## Rhetorical Constraints

All headlines must follow the Grove's design language:

### Hero Headline
- **Format:** `[2-4 WORDS]. [ABSTRACT NOUN]. [PERIOD].`
- **Style:** ALL CAPS, ends with period
- **Max Length:** 40 characters
- **Examples:**
  - `LATENCY IS THE MIND KILLER.`
  - `THE EPISTEMIC COMMONS.`
  - `COMPOUNDING INTELLIGENCE.`

### Hero Subtext
- **Line 1:** "Not [X]. Not [Y]. Not [Z]." (what it ISN'T)
- **Line 2:** Single word/phrase of what it IS (e.g., "Yours." / "Open.")

### Tension
- **Line 1:** What THEY (Big Tech) do
- **Line 2:** What WE do instead

### Quotes
- 3 quotes from authorities the persona respects
- Author names in ALL CAPS
- Short, punchy titles

---

## Manual Configuration

Add to your `narratives.json` in GCS:

```json
{
  "version": "2.1",
  "lensRealities": {
    "engineer": {
      "hero": {
        "headline": "LATENCY IS THE MIND KILLER.",
        "subtext": [
          "Distributed inference isn't a pipe dream.",
          "It's a routing problem."
        ]
      },
      "problem": {
        "quotes": [
          {
            "text": "We are constrained by thermal density...",
            "author": "MARK ZUCKERBERG",
            "title": "META"
          },
          {
            "text": "The cost of compute is the primary bottleneck.",
            "author": "JENSEN HUANG",
            "title": "NVIDIA"
          },
          {
            "text": "Centralized models are hitting a data wall.",
            "author": "YANN LECUN",
            "title": "META AI"
          }
        ],
        "tension": [
          "They build moats around data centers.",
          "We build protocols for edge clusters."
        ]
      }
    }
  },
  "defaultReality": {
    "hero": {
      "headline": "YOUR AI.",
      "subtext": [
        "Not rented. Not surveilled. Not theirs.",
        "Yours."
      ]
    },
    "problem": {
      "quotes": [...],
      "tension": [...]
    }
  }
}
```

---

## Generation Script

Use this Node.js script to generate headlines for all lenses using Gemini:

### `scripts/generate-lens-realities.js`

```javascript
#!/usr/bin/env node
/**
 * Generate LensReality content for all personas using Gemini
 *
 * Usage:
 *   GEMINI_API_KEY=your_key node scripts/generate-lens-realities.js
 *
 * Output:
 *   Writes lens-realities.json to stdout (pipe to file)
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable required');
  process.exit(1);
}

// All personas from default-personas.ts
const PERSONAS = [
  {
    id: 'freestyle',
    label: 'Freestyle',
    description: 'Explore freely without a specific lens',
    guidance: 'Curious explorer, adaptable tone, no agenda'
  },
  {
    id: 'concerned-citizen',
    label: 'Concerned Citizen',
    description: "I'm worried about Big Tech's grip on AI",
    guidance: 'Fears about corporate control, accessible language, personal impact, agency'
  },
  {
    id: 'academic',
    label: 'Academic',
    description: 'I work in research, university, or policy',
    guidance: 'Precise language, cite sources, epistemic humility, theoretical frameworks'
  },
  {
    id: 'engineer',
    label: 'Engineer',
    description: 'I want to understand how it actually works',
    guidance: 'Technical depth, architecture trade-offs, implementation details, WHY decisions'
  },
  {
    id: 'geopolitical',
    label: 'Geopolitical Analyst',
    description: 'I think about power, nations, and systemic risk',
    guidance: 'Power dynamics, strategic concerns, historical parallels, civilizational stability'
  },
  {
    id: 'big-ai-exec',
    label: 'Big AI / Tech Exec',
    description: 'I work at a major tech company or AI lab',
    guidance: 'Business language, market dynamics, regulatory risk, competitive analysis'
  },
  {
    id: 'family-office',
    label: 'Family Office / Investor',
    description: 'I manage wealth and evaluate opportunities',
    guidance: 'Investment thesis, risk/return, timeline, market size, defensibility'
  }
];

const COLLAPSE_PROMPT = `You are the Grove's Reality Collapser. Generate landing page content for a specific persona.

The Grove is distributed AI infrastructure. Core thesis: "Intelligence is a fluid resource shaped by the user, not the provider."

RHETORICAL CONSTRAINTS (follow EXACTLY):

HERO HEADLINE:
- Format: [2-4 WORDS]. [ABSTRACT NOUN]. [PERIOD].
- ALL CAPS, ends with period
- Examples: "LATENCY IS THE MIND KILLER." / "THE EPISTEMIC COMMONS."

HERO SUBTEXT:
- Line 1: "Not [X]. Not [Y]. Not [Z]." (what it ISN'T)
- Line 2: Single word/phrase of what it IS (e.g., "Yours." / "Open.")

TENSION:
- Line 1: What THEY (Big Tech) do
- Line 2: What WE do instead

QUOTES:
- 3 quotes from authorities THIS PERSONA would respect
- Author names ALL CAPS, short titles
- Can be real or representative of the viewpoint

OUTPUT (JSON only, no markdown):
{
  "hero": {
    "headline": "HEADLINE.",
    "subtext": ["Not X. Not Y. Not Z.", "Word."]
  },
  "problem": {
    "quotes": [
      { "text": "...", "author": "NAME", "title": "TITLE" },
      { "text": "...", "author": "NAME", "title": "TITLE" },
      { "text": "...", "author": "NAME", "title": "TITLE" }
    ],
    "tension": ["What they do.", "What we do."]
  }
}`;

async function generateForPersona(persona) {
  const userPrompt = `PERSONA: ${persona.label}
DESCRIPTION: ${persona.description}
TONE GUIDANCE: ${persona.guidance}

Generate the landing page reality for this persona. Remember: this persona will see the Grove's homepage THROUGH THEIR EYES. The headline should resonate with their worldview and concerns.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: COLLAPSE_PROMPT }] },
          { role: 'model', parts: [{ text: 'I understand. I will generate persona-specific content following the rhetorical constraints exactly. Please provide the persona details.' }] },
          { role: 'user', parts: [{ text: userPrompt }] }
        ],
        generationConfig: {
          temperature: 0.7,
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

  // Parse JSON from response (handle markdown wrapping)
  let jsonStr = text;
  if (text.includes('```json')) {
    jsonStr = text.split('```json')[1].split('```')[0].trim();
  } else if (text.includes('```')) {
    jsonStr = text.split('```')[1].split('```')[0].trim();
  }

  return JSON.parse(jsonStr);
}

async function main() {
  console.error('Generating lens realities for all personas...\n');

  const lensRealities = {};

  for (const persona of PERSONAS) {
    console.error(`  → ${persona.label}...`);
    try {
      const reality = await generateForPersona(persona);
      lensRealities[persona.id] = reality;
      console.error(`    ✓ "${reality.hero.headline}"`);
    } catch (error) {
      console.error(`    ✗ Error: ${error.message}`);
    }

    // Rate limit: 1 request per second
    await new Promise(r => setTimeout(r, 1000));
  }

  // Output final JSON to stdout
  const output = {
    _generated: new Date().toISOString(),
    _note: 'Copy lensRealities into narratives.json',
    lensRealities
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch(console.error);
```

### Usage

```bash
# Generate all headlines
GEMINI_API_KEY=your_key node scripts/generate-lens-realities.js > lens-output.json

# Review the output
cat lens-output.json | jq '.lensRealities'

# Then manually add to narratives.json or upload to GCS:
# 1. Copy the lensRealities object
# 2. Add to your narratives.json
# 3. Upload: gcloud storage cp narratives.json gs://grove-assets/narratives.json
```

---

## Verification

After updating `narratives.json` in GCS, verify in browser console:

```javascript
// Check which source is being used
// Look for: [Quantum] Using predefined reality for: engineer (from schema)
// vs:       [Quantum] Using predefined reality for: engineer (from fallback)
```

The console log indicates whether the headline is coming from:
- `(from schema)` - GCS-backed narratives.json
- `(from fallback)` - Hardcoded SUPERPOSITION_MAP

---

## Current Hardcoded Fallbacks

These exist in `src/data/quantum-content.ts` as backup:

| Lens | Headline |
|------|----------|
| `engineer` | "LATENCY IS THE MIND KILLER." |
| `academic` | "THE EPISTEMIC COMMONS." |
| `family-office` | "COMPOUNDING INTELLIGENCE." |
| (default) | "YOUR AI." |

---

## Roadmap

- [ ] Add Foundation UI for editing lensRealities (RealityTuner console)
- [ ] Add A/B testing for headline variants
- [ ] Add analytics for headline engagement by lens
- [ ] Support for seasonal/campaign headline overrides
