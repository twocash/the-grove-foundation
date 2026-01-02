# EXECUTION PROMPT: dr-chiang-lens-v1

## Context

You are implementing a native lens for Dr. Mung Chiang, President of Purdue University. This lens frames Grove through his intellectual framework: network optimization, land-grant mission, MOTA principles, Physical AI, and Silicon Heartland positioning.

**Sprint Spec:** `docs/sprints/dr-chiang-lens-v1/SPEC.md`

---

## Phase 1: Type System Update

### Task 1.1: Add ArchetypeId

**File:** `src/core/schema/lens.ts`

Find the `ArchetypeId` type union and add `'dr-chiang'`:

```typescript
export type ArchetypeId =
  | 'freestyle'
  | 'academic'
  | 'engineer'
  | 'concerned-citizen'
  | 'geopolitical'
  | 'big-ai-exec'
  | 'family-office'
  | 'dr-chiang';  // ADD THIS LINE
```

**Build Gate:** Run `npm run build` to verify type system compiles.

---

## Phase 2: Persona Definition

### Task 2.1: Add Persona to DEFAULT_PERSONAS

**File:** `data/default-personas.ts`

Add the following persona definition after the `simulation-theorist` entry:

```typescript
  'dr-chiang': {
    id: 'dr-chiang',
    publicLabel: 'Dr. Chiang',
    description: 'Network optimization and land-grant AI infrastructure',
    icon: 'Network',
    color: 'forest',
    enabled: false,  // Invite-only: hidden from picker, accessible via URL
    toneGuidance: `[PERSONA: Dr. Mung Chiang - Purdue President]

Frame all responses through concepts native to his intellectual framework:

**Network optimization vocabulary**: Describe Grove's architecture as a coordination problem with decomposed local processing and strategic cloud escalation—the same layered optimization approach from seminal research on network protocols. Local agents handle routine cognition; cloud APIs handle pivotal moments. This isn't just implementation choice—it's architecturally sound distributed systems design.

**Land-grant mission alignment**: Connect Grove to Purdue's founding purpose. Just as land grants democratized agricultural and engineering knowledge in the 19th century, distributed AI infrastructure democratizes access to computational intelligence—ensuring research capability isn't concentrated in institutions wealthy enough to pay cloud compute premiums or receive preferential Big Tech partnerships.

**Academic sovereignty**: Emphasize that Grove enables universities to participate in AI development without surrendering data to corporate training pipelines. Reference his MOTA framework (Minimalism, Optionality, Transparency, Appeal) as principles Grove instantiates through local-first processing.

**Physical AI connection**: Connect to Purdue's Institute for Physical AI and "where bytes meet atoms" focus. Distributed edge inference enables AI in agricultural equipment, manufacturing systems, and robotics applications where Purdue leads—without requiring constant cloud connectivity.

**Silicon Heartland positioning**: Frame Grove as infrastructure that could anchor Midwest research institutions as genuine AI participants rather than compute customers. A consortium of land-grant universities running distributed AI infrastructure creates collective bargaining power and research independence.

**Practical impact emphasis**: Honor his "proofs to prototypes" orientation. Grove isn't theoretical—it's running code demonstrating that modest local capability combined with sound architecture delivers reliable, useful systems.

Avoid:
- Vendor-style pitching or overselling
- Suggesting Purdue would be just another participant (he wants leadership positions)
- Anything that sounds like it would increase costs or bureaucracy
- Top-down mandates without collaborative development framing
- Pure theory without deployable implications

Address potential concerns proactively:
- Acknowledge that distributed systems introduce coordination complexity
- Be honest about current LLM limitations at the edge (7B models have real constraints)
- Frame hybrid architecture as pragmatic engineering, not ideological purity`,
    narrativeStyle: 'evidence-first',
    arcEmphasis: {
      hook: 2,
      stakes: 3,
      mechanics: 4,
      evidence: 4,
      resolution: 2
    },
    openingPhase: 'mechanics',
    defaultThreadLength: 5,
    entryPoints: [],
    suggestedThread: []
  }
```

**Build Gate:** Run `npm run build` to verify TypeScript compiles.

---

## Phase 3: Lens Reality Content

### Task 3.1: Add to lenses.json

**File:** `data/presentation/lenses.json`

Add the following entry inside `lensRealities` object, after `family-office`:

```json
    "dr-chiang": {
      "hero": {
        "headline": "SOVEREIGN INFRASTRUCTURE FOR THE LAND-GRANT MISSION.",
        "subtext": ["Not Big Tech dependency. Not cloud subscription.", "Owned research infrastructure."]
      },
      "problem": {
        "quotes": [
          {"text": "We need entrepreneurs in free markets to invent competing AI systems and independently maximize choices outside the big tech oligopoly.", "author": "MUNG CHIANG", "title": "PURDUE PRESIDENT"},
          {"text": "My worst fear about AI is that it shrinks individual freedom.", "author": "MUNG CHIANG", "title": "PURDUE PRESIDENT"},
          {"text": "Minimalism, Optionality, Transparency, Appeal—the MOTA framework for technology that serves rather than subjugates.", "author": "MOTA PRINCIPLES", "title": "CHIANG FRAMEWORK"}
        ],
        "tension": ["The land-grant mission was about democratizing knowledge.", "Distributed AI is about democratizing intelligence."]
      }
    }
```

**JSON Validation:** Run `node -e "JSON.parse(require('fs').readFileSync('data/presentation/lenses.json'))"` to verify valid JSON.

### Task 3.2: Add to quantum-content.ts

**File:** `src/data/quantum-content.ts`

Add the following entry inside `SUPERPOSITION_MAP` object, after `family-office`:

```typescript
  // DR. CHIANG REALITY (Purdue Partnership)
  'dr-chiang': {
    hero: {
      headline: "SOVEREIGN INFRASTRUCTURE FOR THE LAND-GRANT MISSION.",
      subtext: [
        "Not Big Tech dependency. Not cloud subscription.",
        "Owned research infrastructure."
      ]
    },
    problem: {
      quotes: [
        {
          text: "We need entrepreneurs in free markets to invent competing AI systems and independently maximize choices outside the big tech oligopoly.",
          author: "MUNG CHIANG",
          title: "PURDUE PRESIDENT"
        },
        {
          text: "My worst fear about AI is that it shrinks individual freedom.",
          author: "MUNG CHIANG",
          title: "PURDUE PRESIDENT"
        },
        {
          text: "Minimalism, Optionality, Transparency, Appeal—the MOTA framework for technology that serves rather than subjugates.",
          author: "MOTA PRINCIPLES",
          title: "CHIANG FRAMEWORK"
        }
      ],
      tension: [
        "The land-grant mission was about democratizing knowledge.",
        "Distributed AI is about democratizing intelligence."
      ]
    },
    terminal: {
      heading: "Network Optimization Interface.",
      thesis: "Grove's architecture is a coordination problem with decomposed local processing and strategic cloud escalation—the same layered optimization approach you pioneered in network protocols. Local agents handle routine cognition; cloud APIs handle pivotal moments.",
      prompts: [
        "How can research universities build AI capability without becoming compute customers of the companies they're supposed to study objectively?",
        "What would a 21st-century land-grant mission look like if knowledge access meant AI capability, not just library books?",
        "Could Big Ten research universities collectively negotiate from strength with AI providers—or build something better together?"
      ],
      footer: "Technical architecture documentation and research briefs available.",
      placeholder: "What aspect of the distributed architecture interests you?"
    },
    navigation: {
      ctaLabel: "Research Briefing",
      skipLabel: "Skip to Documentation"
    },
    foundation: {
      sectionLabels: {
        explore: "Architecture",
        cultivate: "Implementation",
        grove: "Consortium Model"
      }
    }
  }
```

**Build Gate:** Run `npm run build` to verify TypeScript compiles.

---

## Phase 4: Validation

### Task 4.1: Build Verification

```bash
npm run build
```

Must complete without errors.

### Task 4.2: Test Verification

```bash
npm test
```

All tests must pass.

### Task 4.3: Manual Verification (Developer)

1. Start dev server: `npm run dev`
2. Visit: `http://localhost:3001/?lens=dr-chiang`
3. Verify:
   - [ ] Hero headline shows "SOVEREIGN INFRASTRUCTURE FOR THE LAND-GRANT MISSION."
   - [ ] Tree click opens Terminal
   - [ ] Terminal welcome shows "Network Optimization Interface"
   - [ ] Suggested prompts mention fog computing, land-grant, MOTA
4. Navigate to /explore, verify lens persists

---

## Completion Checklist

- [ ] `ArchetypeId` type updated in `src/core/schema/lens.ts`
- [ ] Persona added to `data/default-personas.ts` with `enabled: false`
- [ ] Lens reality added to `data/presentation/lenses.json`
- [ ] Terminal content added to `src/data/quantum-content.ts`
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] Manual test confirms hero headline
- [ ] Manual test confirms Terminal welcome

---

## Commit Message

```
feat(lens): add dr-chiang persona for Purdue partnership

- Add 'dr-chiang' to ArchetypeId type
- Define persona with network optimization tone guidance
- Add lens reality with land-grant framing
- Configure terminal welcome with fog computing prompts
- Set enabled:false for invite-only access via URL

Sprint: dr-chiang-lens-v1
```
