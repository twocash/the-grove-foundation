// src/core/transformers/RhetoricalSkeleton.ts
// Rhetorical constraints that enforce Grove's design language
// v0.14: Reality Projector

export const RHETORICAL_SKELETON = {
  hero: {
    headline: {
      pattern: '[2-4 WORDS]. [ABSTRACT NOUN]. [PERIOD].',
      examples: [
        'LATENCY IS THE MIND KILLER.',
        'THE EPISTEMIC COMMONS.',
        'COMPOUNDING INTELLIGENCE.'
      ],
      maxLength: 40
    },
    subtext: {
      pattern: '"Not [X]. Not [Y]. Not [Z]." / "[Possessive]."',
      maxLines: 2
    }
  },
  problem: {
    tension: {
      pattern: '[What THEY do] vs [What WE do]',
      maxLines: 2
    },
    quotes: { count: 3 }
  }
};

export const COLLAPSE_SYSTEM_PROMPT = `You are the Grove's Reality Collapser. Your task is to perceive the Grove's landing page through a specific persona's worldview.

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
- 3 quotes from authorities the persona respects
- Author names ALL CAPS, short titles

OUTPUT (JSON only):
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
