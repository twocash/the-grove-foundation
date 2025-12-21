#!/usr/bin/env node
/**
 * Generate LensReality content for all personas using Gemini
 *
 * Usage:
 *   GEMINI_API_KEY=your_key node scripts/generate-lens-realities.js
 *
 * Output:
 *   Writes lens-realities.json to stdout (pipe to file)
 *
 * Example:
 *   GEMINI_API_KEY=xxx node scripts/generate-lens-realities.js > lens-output.json
 *   cat lens-output.json | jq '.lensRealities'
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable required');
  console.error('Usage: GEMINI_API_KEY=your_key node scripts/generate-lens-realities.js');
  process.exit(1);
}

// All personas from data/default-personas.ts
const PERSONAS = [
  {
    id: 'freestyle',
    label: 'Freestyle',
    description: 'Explore freely without a specific lens',
    guidance: 'Curious explorer, adaptable tone, no agenda, knowledgeable companion'
  },
  {
    id: 'concerned-citizen',
    label: 'Concerned Citizen',
    description: "I'm worried about Big Tech's grip on AI",
    guidance: 'Fears about corporate control, accessible language, personal impact, agency, relatable metaphors'
  },
  {
    id: 'academic',
    label: 'Academic',
    description: 'I work in research, university, or policy',
    guidance: 'Precise language, cite sources, epistemic humility, theoretical frameworks, intellectual sophistication'
  },
  {
    id: 'engineer',
    label: 'Engineer',
    description: 'I want to understand how it actually works',
    guidance: 'Technical depth, architecture trade-offs, implementation details, WHY decisions were made, code-like precision'
  },
  {
    id: 'geopolitical',
    label: 'Geopolitical Analyst',
    description: 'I think about power, nations, and systemic risk',
    guidance: 'Power dynamics, strategic concerns, historical parallels, civilizational stability, resilience and redundancy'
  },
  {
    id: 'big-ai-exec',
    label: 'Big AI / Tech Exec',
    description: 'I work at a major tech company or AI lab',
    guidance: 'Business language, market dynamics, regulatory risk, competitive analysis, not adversarial'
  },
  {
    id: 'family-office',
    label: 'Family Office / Investor',
    description: 'I manage wealth and evaluate opportunities',
    guidance: 'Investment thesis, risk/return, timeline, market size, defensibility, milestone-focused'
  }
];

const COLLAPSE_PROMPT = `You are the Grove's Reality Collapser. Generate landing page content for a specific persona.

The Grove is distributed AI infrastructure. Core thesis: "Intelligence is a fluid resource shaped by the user, not the provider."

RHETORICAL CONSTRAINTS (follow EXACTLY):

HERO HEADLINE:
- Format: [2-4 WORDS]. [ABSTRACT NOUN]. [PERIOD].
- ALL CAPS, ends with period
- Must resonate with THIS persona's worldview
- Examples: "LATENCY IS THE MIND KILLER." / "THE EPISTEMIC COMMONS."

HERO SUBTEXT:
- Line 1: "Not [X]. Not [Y]. Not [Z]." (what it ISN'T - speak to persona's concerns)
- Line 2: Single word/phrase of what it IS (e.g., "Yours." / "Open.")

TENSION:
- Line 1: What THEY (Big Tech) do - frame it how THIS persona would see it
- Line 2: What WE do instead - frame it as what THIS persona values

QUOTES:
- 3 quotes from authorities THIS PERSONA would actually respect and listen to
- Author names ALL CAPS, short titles
- Can be real quotes or representative of the viewpoint
- Should feel credible to this persona

OUTPUT (JSON only, no markdown, no explanation):
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

Generate the landing page reality for this persona. Remember: this persona will see the Grove's homepage THROUGH THEIR EYES. The headline should resonate with their worldview, concerns, and values. The quotes should come from authorities they would actually trust and respect.`;

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
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No content in response');
  }

  // Parse JSON from response (handle markdown wrapping)
  let jsonStr = text.trim();
  if (jsonStr.includes('```json')) {
    jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
  } else if (jsonStr.includes('```')) {
    jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
  }

  const parsed = JSON.parse(jsonStr);

  // Validate structure
  if (!parsed.hero?.headline || !parsed.hero?.subtext || !parsed.problem?.quotes || !parsed.problem?.tension) {
    throw new Error('Invalid structure in response');
  }

  return parsed;
}

async function main() {
  console.error('='.repeat(60));
  console.error('Grove Lens Reality Generator');
  console.error('='.repeat(60));
  console.error(`\nGenerating for ${PERSONAS.length} personas...\n`);

  const lensRealities = {};
  const errors = [];

  for (const persona of PERSONAS) {
    console.error(`  [${persona.id}] ${persona.label}...`);
    try {
      const reality = await generateForPersona(persona);
      lensRealities[persona.id] = reality;
      console.error(`    ✓ "${reality.hero.headline}"`);
    } catch (error) {
      console.error(`    ✗ Error: ${error.message}`);
      errors.push({ persona: persona.id, error: error.message });
    }

    // Rate limit: 1.5 seconds between requests
    await new Promise(r => setTimeout(r, 1500));
  }

  console.error('\n' + '='.repeat(60));
  console.error(`Complete: ${Object.keys(lensRealities).length}/${PERSONAS.length} successful`);
  if (errors.length > 0) {
    console.error(`Errors: ${errors.map(e => e.persona).join(', ')}`);
  }
  console.error('='.repeat(60) + '\n');

  // Output final JSON to stdout
  const output = {
    _meta: {
      generated: new Date().toISOString(),
      personas: PERSONAS.length,
      successful: Object.keys(lensRealities).length,
      note: 'Copy lensRealities into narratives.json in GCS'
    },
    lensRealities,
    defaultReality: {
      hero: {
        headline: "YOUR AI.",
        subtext: [
          "Not rented. Not surveilled. Not theirs.",
          "Yours."
        ]
      },
      problem: {
        quotes: [
          {
            text: "AI is the most profound technology humanity has ever worked on... People will need to adapt.",
            author: "SUNDAR PICHAI",
            title: "GOOGLE CEO"
          },
          {
            text: "This is the new version of [learning to code]... adaptability and continuous learning would be the most valuable skills.",
            author: "SAM ALTMAN",
            title: "OPENAI CEO"
          },
          {
            text: "People have adapted to past technological changes... I advise ordinary citizens to learn to use AI.",
            author: "DARIO AMODEI",
            title: "ANTHROPIC CEO"
          }
        ],
        tension: [
          "They're building the future of intelligence.",
          "And they're telling you to get comfortable being a guest in it."
        ]
      }
    }
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
