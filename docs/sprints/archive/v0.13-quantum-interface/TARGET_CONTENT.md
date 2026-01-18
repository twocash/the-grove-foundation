# Target Content — v0.13 Quantum Interface

This document contains exact code snippets for all new files and modifications.

---

## NEW FILE: `src/data/quantum-content.ts`

```typescript
// src/data/quantum-content.ts
// Superposition Map: Maps lens IDs to content realities
// v0.13: The Quantum Interface

import { HeroContent, Quote } from '../surface/components/genesis';
import { ArchetypeId } from '../types/lens';

// Extended interface for problem section
export interface TensionContent {
  quotes: Quote[];
  tension: string[];
}

export interface LensReality {
  hero: HeroContent;
  problem: TensionContent;
}

// ============================================================================
// DEFAULT REALITY (No lens selected)
// ============================================================================

export const DEFAULT_REALITY: LensReality = {
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
};

// ============================================================================
// COLLAPSED REALITIES (Lens-specific content)
// ============================================================================

export const SUPERPOSITION_MAP: Partial<Record<ArchetypeId, LensReality>> = {
  
  // ENGINEER REALITY
  'engineer': {
    hero: {
      headline: "LATENCY IS THE MIND KILLER.",
      subtext: [
        "Distributed inference isn't a pipe dream.",
        "It's a routing problem."
      ]
    },
    problem: {
      quotes: [
        {
          text: "We are constrained by thermal density in our data centers... the laws of physics are the bottleneck.",
          author: "MARK ZUCKERBERG",
          title: "META CEO"
        },
        {
          text: "The cost of compute is the primary bottleneck to AI progress.",
          author: "JENSEN HUANG",
          title: "NVIDIA CEO"
        },
        {
          text: "Centralized models are hitting a data wall. The frontier is moving to the edge.",
          author: "YANN LECUN",
          title: "META AI CHIEF"
        }
      ],
      tension: [
        "They build moats around data centers.",
        "We build protocols for edge clusters."
      ]
    }
  },

  // ACADEMIC REALITY
  'academic': {
    hero: {
      headline: "THE EPISTEMIC COMMONS.",
      subtext: [
        "Knowledge shouldn't be enclosed.",
        "Intelligence must be open."
      ]
    },
    problem: {
      quotes: [
        {
          text: "The greatest risk is that a small number of AI providers will control the future of knowledge itself.",
          author: "TIMNIT GEBRU",
          title: "AI ETHICS RESEARCHER"
        },
        {
          text: "We're witnessing the largest enclosure of the intellectual commons in human history.",
          author: "CORY DOCTOROW",
          title: "AUTHOR & ACTIVIST"
        },
        {
          text: "Academic freedom requires computational independence. We cannot research AI if we cannot run AI.",
          author: "ARVIND NARAYANAN",
          title: "PRINCETON CS"
        }
      ],
      tension: [
        "The enclosure of the digital commons is accelerating.",
        "We are building the library, not the bookstore."
      ]
    }
  },

  // INVESTOR (FAMILY OFFICE) REALITY
  'family-office': {
    hero: {
      headline: "THE NEXT INFRASTRUCTURE PLAY.",
      subtext: [
        "Cloud was the last wave.",
        "Distributed AI is the next."
      ]
    },
    problem: {
      quotes: [
        {
          text: "The hyperscalers will face the same disruption they brought to enterprise IT.",
          author: "MARC ANDREESSEN",
          title: "A16Z"
        },
        {
          text: "Infrastructure that can't be turned off is the ultimate moat.",
          author: "BALAJI SRINIVASAN",
          title: "ANGEL INVESTOR"
        },
        {
          text: "The next trillion-dollar company is the one that solves distributed inference.",
          author: "CHAMATH PALIHAPITIYA",
          title: "SOCIAL CAPITAL"
        }
      ],
      tension: [
        "They're betting on centralization.",
        "The market is about to disagree."
      ]
    }
  }
};

// ============================================================================
// RESOLUTION FUNCTION
// ============================================================================

export const getReality = (lensId: string | null): LensReality => {
  if (!lensId) return DEFAULT_REALITY;
  if (lensId.startsWith('custom-')) return DEFAULT_REALITY;
  
  const reality = SUPERPOSITION_MAP[lensId as ArchetypeId];
  return reality || DEFAULT_REALITY;
};
```

---

## NEW FILE: `src/surface/hooks/useQuantumInterface.ts`

```typescript
// src/surface/hooks/useQuantumInterface.ts
// The Observer: Listens to lens changes, returns collapsed reality
// v0.13: The Quantum Interface

import { useMemo } from 'react';
import { useNarrativeEngine } from '../../../hooks/useNarrativeEngine';
import { getReality, LensReality } from '../../data/quantum-content';

interface UseQuantumInterfaceReturn {
  reality: LensReality;
  activeLens: string | null;
  quantumTrigger: string | null;
}

export const useQuantumInterface = (): UseQuantumInterfaceReturn => {
  const { session } = useNarrativeEngine();
  
  const reality = useMemo(() => {
    return getReality(session.activeLens);
  }, [session.activeLens]);
  
  return {
    reality,
    activeLens: session.activeLens,
    quantumTrigger: session.activeLens
  };
};

export default useQuantumInterface;
```

---

## NEW FILE: `src/surface/components/effects/index.ts`

```typescript
// src/surface/components/effects/index.ts
// Barrel export for effect components

export { WaveformCollapse } from './WaveformCollapse';
```

---

## NEW FILE: `src/surface/components/effects/WaveformCollapse.tsx`

```typescript
// src/surface/components/effects/WaveformCollapse.tsx
// Typewriter animation: un-type → pause → re-type
// v0.13: The Quantum Interface

import React, { useState, useEffect, useRef } from 'react';

interface WaveformCollapseProps {
  text: string;
  trigger: any;
  className?: string;
  delay?: number;
  backspaceSpeed?: number;
  typeSpeed?: number;
  pauseDuration?: number;
}

type Phase = 'idle' | 'collapsing' | 'observing' | 'forming';

export const WaveformCollapse: React.FC<WaveformCollapseProps> = ({
  text,
  trigger,
  className = '',
  delay = 0,
  backspaceSpeed = 15,
  typeSpeed = 40,
  pauseDuration = 400
}) => {
  const [display, setDisplay] = useState(text);
  const [phase, setPhase] = useState<Phase>('idle');
  const [targetText, setTargetText] = useState(text);
  const previousTrigger = useRef(trigger);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplay(text);
      setTargetText(text);
      return;
    }

    if (trigger !== previousTrigger.current) {
      previousTrigger.current = trigger;
      setTargetText(text);
      
      const timer = setTimeout(() => {
        setPhase('collapsing');
      }, delay);
      
      return () => clearTimeout(timer);
    } else if (text !== display && phase === 'idle') {
      setDisplay(text);
      setTargetText(text);
    }
  }, [trigger, text, delay]);

  useEffect(() => {
    if (phase === 'collapsing') {
      if (display.length > 0) {
        const timer = setTimeout(() => {
          setDisplay(prev => prev.slice(0, -1));
        }, backspaceSpeed);
        return () => clearTimeout(timer);
      } else {
        setPhase('observing');
      }
    }

    if (phase === 'observing') {
      const timer = setTimeout(() => {
        setPhase('forming');
      }, pauseDuration);
      return () => clearTimeout(timer);
    }

    if (phase === 'forming') {
      if (display.length < targetText.length) {
        const speed = typeSpeed + (Math.random() * typeSpeed * 0.5);
        const timer = setTimeout(() => {
          setDisplay(targetText.slice(0, display.length + 1));
        }, speed);
        return () => clearTimeout(timer);
      } else {
        setPhase('idle');
      }
    }
  }, [phase, display, targetText, backspaceSpeed, typeSpeed, pauseDuration]);

  return (
    <span className={className}>
      {display}
      {phase !== 'idle' && (
        <span 
          className="inline-block w-[0.5em] h-[1em] bg-grove-forest ml-0.5 animate-pulse align-middle"
          aria-hidden="true"
        />
      )}
    </span>
  );
};

export default WaveformCollapse;
```

---

## MODIFIED: GenesisPage.tsx Import Section

**Add after line 11:**
```typescript
import { useQuantumInterface } from '../hooks/useQuantumInterface';
```

---

## MODIFIED: GenesisPage.tsx Hook Call

**Add after line 33 (inside component, before useState calls):**
```typescript
// Quantum Interface - lens-reactive content
const { reality, quantumTrigger } = useQuantumInterface();
```

---

## MODIFIED: GenesisPage.tsx HeroHook Rendering

**Replace HeroHook usage (~line 120):**
```typescript
{/* SCREEN 1: The Hook (Quantum-Reactive) */}
<div ref={el => { screenRefs.current[0] = el; }}>
  <HeroHook 
    content={reality.hero}
    trigger={quantumTrigger}
  />
</div>
```

---

## MODIFIED: GenesisPage.tsx ProblemStatement Rendering

**Replace ProblemStatement usage (~line 126):**
```typescript
{/* SCREEN 2: The Problem (Quantum-Reactive) */}
<div ref={el => { screenRefs.current[1] = el; }}>
  <ProblemStatement 
    quotes={reality.problem.quotes}
    tension={reality.problem.tension}
    trigger={quantumTrigger}
  />
</div>
```
