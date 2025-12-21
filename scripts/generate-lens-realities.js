#!/usr/bin/env node
/**
 * Generate LensReality OPTIONS for all personas using Gemini
 * 
 * This generates 3 variants per persona for human review.
 * The human picks the winners, then updates narratives.json.
 *
 * Usage:
 *   GEMINI_API_KEY=your_key node scripts/generate-lens-realities.js > lens-options.json
 * 
 * Philosophy:
 *   The goal is to hit the right rhetorical note, fit the character count, 
 *   and make it land. Formulas get stale. The human editor picks winners.
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
    seed: 'Fears corporate control, wants agency, accessible language. Counter the "adapt" narrative.'
  },
  {
    id: 'academic',
    label: 'Academic',
    description: 'I work in research, university, or policy',
    seed: 'Epistemic independence, knowledge commons, enclosure concerns, rate limits on research'
  },
  {
    id: 'engineer',
    label: 'Engineer',
    description: 'I want to understand how it actually works',
    seed: 'Architecture trade-offs, hybrid local/cloud (7B routine, frontier insight), protocols not platforms'
  },
  {
    id: 'geopolitical',
    label: 'Geopolitical Analyst',
    description: 'I think about power, nations, and systemic risk',
    seed: 'Sovereignty, concentration risk, power dynamics, not American/Chinese/corporate'
  },
  {
    id: 'big-ai-exec',
    label: 'Big AI / Tech Exec',
    description: 'I work at a major tech company or AI lab',
    seed: 'Business opportunity, edge economics, infrastructure layer play, margin in the middle'
  },
  {
    id: 'family-office',
    label: 'Family Office / Investor',
    description: 'I manage wealth and evaluate opportunities',
    seed: 'Platform risk hedge, owned vs rented infrastructure, long-term compounding'
  }
];

// Current winners for reference (what we're trying to beat or vary from)
const CURRENT_WINNERS = {
  'freestyle': 'OWN YOUR AI.',
  'concerned-citizen': 'ADAPT? ADAPT AND OWN.',
  'academic': 'THE EPISTEMIC COMMONS.',
  'engineer': 'LOCAL HUMS. CLOUD BREAKS THROUGH.',
  'geopolitical': 'SOVEREIGN INTELLIGENCE.',
  'big-ai-exec': 'THE EDGE HEDGE.',
  'family-office': 'THE EDGE HEDGE.'
};

const SYSTEM_PROMPT = `You are writing landing page headlines for The Grove, a distributed AI infrastructure project.

The Grove's thesis: You should own your AI, not rent it. Distributed beats centralized. The edge is the hedge.

CONSTRAINTS:
- Headline: ≤40 characters, ALL CAPS, ends with period
- Subtext: 2 lines that complete the thought (make it land, no formula required)
- Tension: THEY do X / WE do Y (one line each)

QUALITY BAR:
- Visceral over clever
- Memorable over comprehensive  
- This persona's language, not generic tech-speak
- Short sentences hit harder
- Rhymes and wordplay are good when they work (e.g., "THE EDGE HEDGE.")
- Questions can be powerful (e.g., "ADAPT? ADAPT AND OWN.")

ANTI-PATTERNS TO AVOID:
- "Not X. Not Y. Not Z." subtext formula (stale—use sparingly)
- "[NOUN] IS THE [NOUN]." headline formula (overused)
- Generic tech buzzwords the persona wouldn't use
- Being comprehensive when you should be punchy

EXAMPLES OF GOOD HEADLINES:
- "OWN YOUR AI." — Direct, personal, three words
- "ADAPT? ADAPT AND OWN." — Counters their framing with a question
- "LOCAL HUMS. CLOUD BREAKS THROUGH." — Poetic, describes architecture
- "THE EDGE HEDGE." — Rhymes, memorable, business-coded
- "SOVEREIGN INTELLIGENCE." — One phrase does all the work

Generate 3 DIFFERENT options. Vary the ANGLE, not just the words.

OUTPUT FORMAT (JSON only, no markdown):
{
  "options": [
    {
      "tag": "A - [brief angle description]",
      "headline": "HEADLINE.",
      "subtext": ["Line 1", "Line 2"],
      "tension": ["They do X.", "We do Y."]
    },
    {
      "tag": "B - [brief angle description]",
      "headline": "HEADLINE.",
      "subtext": ["Line 1", "Line 2"],
      "tension": ["They do X.", "We do Y."]
    },
    {
      "tag": "C - [brief angle description]",
      "headline": "HEADLINE.",
      "subtext": ["Line 1", "Line 2"],
      "tension": ["They do X.", "We do Y."]
    }
  ]
}`;

async function generateForPersona(persona) {
  const currentWinner = CURRENT_WINNERS[persona.id];
  
  const userPrompt = `PERSONA: ${persona.label}
DESCRIPTION: ${persona.description}
SEED IDEAS: ${persona.seed}
${currentWinner ? `CURRENT HEADLINE: "${currentWinner}" (for reference—try to beat it or vary from it)` : ''}

Generate 3 headline options for this persona. Each should hit a DIFFERENT angle.`;

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
  console.error('='.repeat(60));
  console.error('Generating lens reality OPTIONS for human review');
  console.error('='.repeat(60));
  console.error('');

  const results = {};

  for (const persona of PERSONAS) {
    console.error(`  → ${persona.label}...`);
    try {
      const generated = await generateForPersona(persona);
      results[persona.id] = {
        persona: persona.label,
        description: persona.description,
        currentWinner: CURRENT_WINNERS[persona.id] || null,
        options: generated.options
      };
      
      // Show headlines in stderr for quick review
      for (const opt of generated.options) {
        console.error(`      ${opt.tag}: "${opt.headline}"`);
      }
    } catch (error) {
      console.error(`    ✗ Error: ${error.message}`);
      results[persona.id] = { error: error.message };
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 1200));
  }

  console.error('');
  console.error('='.repeat(60));
  console.error('Done. Pipe stdout to a file for full JSON output.');
  console.error('='.repeat(60));

  const output = {
    _generated: new Date().toISOString(),
    _instructions: [
      '1. Review each persona\'s options below',
      '2. Pick one winner per persona (or write your own)',
      '3. Add 3 quotes for each winner (authorities the persona respects)',
      '4. Update data/narratives.json with final selections',
      '5. Upload: gcloud storage cp data/narratives.json gs://grove-assets/narratives.json'
    ],
    _currentWinners: CURRENT_WINNERS,
    personas: results
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch(console.error);
