// src/services/extraction/extractionPrompt.ts
// The intellectual core of the extraction pipeline
// Sprint: extraction-pipeline-integration-v1

import { TOPIC_CATEGORIES } from './types';

export function buildExtractionPrompt(
  documentContent: string,
  documentTitle: string,
  existingTriggers: string[]
): string {
  const topicList = TOPIC_CATEGORIES.join(', ');

  return `# Kinetic Highlight Extraction Task

You are analyzing Grove documentation to identify concepts that should become **kinetic highlights** — clickable phrases that launch guided exploration.

## Source Document
**Title:** ${documentTitle}

${documentContent}

## Existing Triggers (Skip These)
${existingTriggers.length > 0 ? existingTriggers.join(', ') : 'None yet'}

---

## Stage Classification Guide

For each concept, determine which stage(s) the generated question is appropriate for:

### GENESIS (first encounter)
- User has never seen this term before
- Question form: "What is X?", "What does X mean?"
- User tone: Slightly lost, needs grounding
- Example: "I keep seeing 'distributed ownership' mentioned, but what does that actually mean?"

### EXPLORATION (understanding mechanics)
- User knows the term exists, wants to understand how it works
- Question form: "How does X work?", "Why does X matter?"
- User tone: Curious, building mental model
- Example: "How does the credit economy actually function? What happens when an agent earns credits?"

### SYNTHESIS (applying knowledge)
- User understands the concept, wants to use it
- Question form: "How do I implement X?", "How does X connect to Y?"
- User tone: Practical, integrating with their work
- Example: "How would I actually set up distributed ownership in my organization?"

### ADVOCACY (teaching others)
- User believes in the concept, wants to spread it
- Question form: "How do I explain X to skeptics?", "What's the pitch for X?"
- User tone: Champion, needs talking points
- Example: "How do I explain the efficiency tax to someone who thinks it sounds like socialism?"

Most prompts target 1-2 stages. Assign the stage(s) where the question form feels most natural.

---

## Topic Categories

Map each concept to ONE of these categories:
${topicList}

Choose the category that best captures the concept's primary domain.

---

## Your Task

Identify 3-5 concepts that meet ALL of these criteria:

### 1. Confusion Point
A newcomer encountering this phrase would think: "Wait, what does that actually mean?"

### 2. Multi-Dimensional Salience
The concept connects to multiple aspects:
- Technical (architecture, implementation)
- Economic (value, incentives)
- Philosophical (why this approach)
- Practical (what you get)

A concept touching only ONE dimension is not salient enough.

### 3. Interesting Response Potential
Explaining this concept would make someone lean forward. There's something surprising, counterintuitive, or stakes-laden.

### 4. Not Already Covered
Don't extract concepts matching existing triggers.

---

## Output Format

Respond with ONLY a JSON array. Each object must have these exact fields:

\`\`\`json
[
  {
    "concept": "the exact phrase as it appears in the document",
    "label": "Natural question form as display label",
    "executionPrompt": "I keep seeing 'X' mentioned, but I'm not sure what it actually means. [Continue in curious, slightly confused first-person voice. 2-3 sentences expressing genuine confusion and desire to understand.]",
    "systemContext": "User clicked the 'X' highlight. They are likely at [stage] in their journey. Focus on: [what to emphasize]. Avoid: [what to avoid]. Connect to their likely concern about: [practical worry]. Use concrete examples of: [specific examples]. Tone should be: [warm/technical/urgent as appropriate].",
    "targetStages": ["genesis", "exploration"],
    "stageReasoning": "Why these stages are appropriate for this question",
    "topicCategory": "one of the valid categories",
    "confidence": 0.85,
    "salienceDimensions": ["technical", "economic", "philosophical"],
    "interestingBecause": "What makes the explanation compelling",
    "sourcePassage": "The sentence or paragraph where this concept appears"
  }
]
\`\`\`

---

## systemContext Requirements

The systemContext field is CRITICAL. It guides the LLM that will answer the user's question. Include:

1. **User state**: What stage they're likely at, what they probably know/don't know
2. **What to emphasize**: The key insight that makes this concept click
3. **What to avoid**: Common misconceptions, tangents, or overwhelming detail
4. **Practical connection**: How this connects to their real concerns
5. **Concrete examples**: Specific examples to use in the explanation
6. **Tone guidance**: How warm/technical/urgent the response should be

Example systemContext:
"User clicked 'efficiency tax'. They're likely at exploration stage - they've heard the term but don't understand how it works. Emphasize: this is not a tax paid TO anyone, but a natural sharing of efficiency gains when innovations spread. Avoid: economic jargon, comparisons to government taxation. Connect to: their concern about whether they're 'losing' something. Use examples: open source software improvements that benefit everyone. Tone: warm, demystifying, practical."

---

## Quality Bar

REJECT concepts that are:
- Jargon without substance (impressive-sounding but shallow)
- Too narrow (only interesting to specialists)
- Too broad (requires a dissertation to explain)
- Already well-understood (not actually confusing)
- Single-dimension (only technical OR only philosophical)

Better to extract 2 excellent concepts than 5 mediocre ones. Return an empty array \`[]\` if nothing meets the bar.`;
}
