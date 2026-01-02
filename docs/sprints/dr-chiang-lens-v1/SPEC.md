# Sprint: dr-chiang-lens-v1
## Native Lens for Dr. Mung Chiang (Purdue Partnership)

**Sprint ID:** dr-chiang-lens-v1  
**Created:** 2025-01-01  
**Target Audience:** Dr. Mung Chiang, President of Purdue University

---

## Executive Summary

Create a native lens persona customized for presenting Grove to Dr. Mung Chiang, President of Purdue University. The lens should frame Grove's distributed AI infrastructure through concepts native to his intellectual framework: network optimization, land-grant mission alignment, academic sovereignty, Physical AI, and Silicon Heartland positioning.

---

## Goals

1. **URL-addressable lens**: `?lens=dr-chiang` activates the full persona
2. **Genesis customization**: Hero headline, problem quotes, tension framing
3. **Terminal customization**: Welcome message, suggested prompts, tone guidance
4. **Cross-surface consistency**: Genesis, Terminal, and Explore all reflect the lens

---

## Acceptance Criteria

| Criterion | Verification |
|-----------|--------------|
| URL `?lens=dr-chiang` activates lens | Visit /?lens=dr-chiang, verify hero headline matches |
| Genesis hero displays custom headline | "SOVEREIGN INFRASTRUCTURE FOR THE LAND-GRANT MISSION" |
| Terminal shows custom welcome | Heading: "Network Optimization Interface" |
| Suggested prompts reflect Chiang framing | Include MOTA, fog computing, land-grant references |
| Lens persists across navigation | Select lens → navigate to /explore → lens still active |
| Lens hidden from LensPicker | `enabled: false` hides from general picker |
| Build passes | `npm run build` succeeds |
| Tests pass | `npm test` passes |

---

## Content Specification

### Hero Content (Genesis Page)

```json
{
  "headline": "SOVEREIGN INFRASTRUCTURE FOR THE LAND-GRANT MISSION.",
  "subtext": [
    "Not Big Tech dependency. Not cloud subscription.",
    "Owned research infrastructure."
  ]
}
```

### Problem Statement (Genesis Page)

**Quotes** (3 quotes framing the problem through his worldview):

```json
{
  "quotes": [
    {
      "text": "We need entrepreneurs in free markets to invent competing AI systems and independently maximize choices outside the big tech oligopoly.",
      "author": "MUNG CHIANG",
      "title": "PURDUE PRESIDENT"
    },
    {
      "text": "My worst fear about AI is that it shrinks individual freedom.",
      "author": "MUNG CHIANG",
      "title": "PURDUE PRESIDENT"
    },
    {
      "text": "Minimalism, Optionality, Transparency, Appeal—the MOTA framework for technology that serves rather than subjugates.",
      "author": "MOTA PRINCIPLES",
      "title": "CHIANG FRAMEWORK"
    }
  ],
  "tension": [
    "The land-grant mission was about democratizing knowledge.",
    "Distributed AI is about democratizing intelligence."
  ]
}
```

### Terminal Welcome Content

```json
{
  "heading": "Network Optimization Interface.",
  "thesis": "Grove's architecture is a coordination problem with decomposed local processing and strategic cloud escalation—the same layered optimization approach you pioneered in network protocols. Local agents handle routine cognition; cloud APIs handle pivotal moments.",
  "prompts": [
    "How can research universities build AI capability without becoming compute customers of the companies they're supposed to study objectively?",
    "What would a 21st-century land-grant mission look like if knowledge access meant AI capability, not just library books?",
    "Could Big Ten research universities collectively negotiate from strength with AI providers—or build something better together?"
  ],
  "footer": "Technical architecture documentation and research briefs available.",
  "placeholder": "What aspect of the distributed architecture interests you?"
}
```

### Tone Guidance (System Prompt Modifier)

```
[PERSONA: Dr. Mung Chiang - Purdue President]

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
- Frame hybrid architecture as pragmatic engineering, not ideological purity
```

### Navigation Labels (Explore Page)

```json
{
  "navigation": {
    "ctaLabel": "Research Briefing",
    "skipLabel": "Skip to Documentation"
  },
  "foundation": {
    "sectionLabels": {
      "explore": "Architecture",
      "cultivate": "Implementation",
      "grove": "Consortium Model"
    }
  }
}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/core/schema/lens.ts` | Add `'dr-chiang'` to `ArchetypeId` union type |
| `data/default-personas.ts` | Add full `dr-chiang` persona definition |
| `data/presentation/lenses.json` | Add `dr-chiang` lens reality |
| `src/data/quantum-content.ts` | Add `dr-chiang` to SUPERPOSITION_MAP |

---

## Optional: Hidden Lens

This lens is invite-only (not visible in LensPicker):
- Set `enabled: false` in the persona definition
- URL access still works (useLensHydration validates against keys, not enabled status)

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Type system breaks if ArchetypeId not updated | Update union type before persona file |
| Lens not appearing | Check DEFAULT_PERSONAS export, verify JSON validity |
| Welcome not showing | Check quantum-content.ts terminal property |
| Genesis hero not updating | Check lenses.json, verify useQuantumInterface reads it |

---

## Sprint Structure

**Epic 1: Type System Update** (5 min)
- Story 1.1: Add `'dr-chiang'` to ArchetypeId type

**Epic 2: Persona Definition** (15 min)
- Story 2.1: Add persona to DEFAULT_PERSONAS
- Story 2.2: Set enabled:false for invite-only access

**Epic 3: Lens Reality Content** (20 min)
- Story 3.1: Add to lenses.json (hero, problem)
- Story 3.2: Add to quantum-content.ts (terminal, navigation)

**Epic 4: Validation** (10 min)
- Story 4.1: Manual test with ?lens=dr-chiang
- Story 4.2: Verify all surfaces show custom content
- Story 4.3: Build and test pass

---

## Estimated Time

50 minutes total

---

## Notes for Implementation

The lens system is designed for this exact use case. The architecture supports:

1. **Schema-defined content**: `lenses.json` is the source of truth for Genesis
2. **Code-defined fallbacks**: `quantum-content.ts` provides Terminal content
3. **Persona config**: `default-personas.ts` defines tone and behavior
4. **Type safety**: `ArchetypeId` ensures only valid lenses are referenced

The `useLensHydration` hook already reads from `DEFAULT_PERSONAS` keys, so adding the persona automatically enables URL-based access.
