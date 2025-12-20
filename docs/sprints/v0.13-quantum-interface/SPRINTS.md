# Sprint Stories — v0.13 Quantum Interface

## Epic 1: Data Layer (Superposition Map)

### Story 1.1: Create Quantum Content File
**File:** `src/data/quantum-content.ts` (NEW)

**Create file with:**
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
  // No lens = default reality
  if (!lensId) return DEFAULT_REALITY;
  
  // Custom lenses fall back to default (per ADR-005)
  if (lensId.startsWith('custom-')) return DEFAULT_REALITY;
  
  // Try to find archetype-specific reality
  const reality = SUPERPOSITION_MAP[lensId as ArchetypeId];
  
  // Fall back to default if archetype not mapped
  return reality || DEFAULT_REALITY;
};
```

**Acceptance:** File compiles, types are correct

---

## Epic 2: State Layer (Hook)

### Story 2.1: Create useQuantumInterface Hook
**File:** `src/surface/hooks/useQuantumInterface.ts` (NEW)

**Create file with:**
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
  quantumTrigger: string | null;  // Pass to components to trigger animation
}

export const useQuantumInterface = (): UseQuantumInterfaceReturn => {
  const { session } = useNarrativeEngine();
  
  // Resolve reality based on active lens
  const reality = useMemo(() => {
    return getReality(session.activeLens);
  }, [session.activeLens]);
  
  return {
    reality,
    activeLens: session.activeLens,
    quantumTrigger: session.activeLens  // Lens ID serves as trigger
  };
};

export default useQuantumInterface;
```

**Acceptance:** Hook compiles, returns correct reality for test lens

---

## Epic 3: Visual Layer (Animation)

### Story 3.1: Create Effects Directory
**File:** `src/surface/components/effects/index.ts` (NEW)

**Create file with:**
```typescript
// src/surface/components/effects/index.ts
// Barrel export for effect components

export { WaveformCollapse } from './WaveformCollapse';
```

**Acceptance:** Directory exists, barrel export compiles

---

### Story 3.2: Create WaveformCollapse Component
**File:** `src/surface/components/effects/WaveformCollapse.tsx` (NEW)

**Create file with:**
```typescript
// src/surface/components/effects/WaveformCollapse.tsx
// Typewriter animation: un-type → pause → re-type
// v0.13: The Quantum Interface

import React, { useState, useEffect, useRef } from 'react';

interface WaveformCollapseProps {
  text: string;
  trigger: any;          // Value change triggers animation
  className?: string;
  delay?: number;        // Start delay in ms
  backspaceSpeed?: number;  // ms per character removal
  typeSpeed?: number;       // ms per character addition (base, randomized)
  pauseDuration?: number;   // ms pause between phases
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

  // Detect trigger change
  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplay(text);
      setTargetText(text);
      return;
    }

    // Only animate if trigger actually changed
    if (trigger !== previousTrigger.current) {
      previousTrigger.current = trigger;
      setTargetText(text);
      
      // Start collapse after optional delay
      const timer = setTimeout(() => {
        setPhase('collapsing');
      }, delay);
      
      return () => clearTimeout(timer);
    } else if (text !== display && phase === 'idle') {
      // Text changed without trigger change - just update
      setDisplay(text);
      setTargetText(text);
    }
  }, [trigger, text, delay]);

  // Animation state machine
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
        // Variable speed for natural feel
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

**Acceptance:** Component animates text on trigger change, cursor blinks during animation

---

## Epic 4: Component Updates

### Story 4.1: Update HeroHook with Trigger Prop
**File:** `src/surface/components/genesis/HeroHook.tsx`
**Lines:** 23-27, 33-43

**Update interface (line ~23):**
```typescript
interface HeroHookProps {
  onScrollNext?: () => void;
  content?: HeroContent;
  trigger?: any;  // NEW: Triggers animation restart on lens change
}
```

**Update component signature (line ~28):**
```typescript
export const HeroHook: React.FC<HeroHookProps> = ({
  onScrollNext,
  content = DEFAULT_CONTENT,
  trigger  // NEW
}) => {
```

**Update useEffect to reset on trigger (line ~33):**
```typescript
// Reset animation on content/trigger change
useEffect(() => {
  setVisibleSubtext([]);  // Reset visibility
  
  const timers: NodeJS.Timeout[] = [];
  content.subtext.forEach((_, index) => {
    const timer = setTimeout(() => {
      setVisibleSubtext(prev => [...prev, index]);
    }, 600 + (index * 800));
    timers.push(timer);
  });
  return () => timers.forEach(clearTimeout);
}, [content.subtext, trigger]);  // ADD trigger to dependencies
```

**Acceptance:** Component re-animates subtext when trigger changes

---

### Story 4.2: Update ProblemStatement with Trigger and Tension Props
**File:** `src/surface/components/genesis/ProblemStatement.tsx`
**Lines:** 36-42, 48-55, 122-134

**Export tension type (add after Quote interface, line ~14):**
```typescript
// Tension content type (export for reuse)
export interface TensionContent {
  text: string[];
}
```

**Update interface (line ~36):**
```typescript
interface ProblemStatementProps {
  className?: string;
  quotes?: Quote[];
  tension?: string[];  // NEW: Dynamic tension text
  trigger?: any;       // NEW: Triggers animation restart
}

// Default tension text
const DEFAULT_TENSION = [
  "They're building the future of intelligence.",
  "And they're telling you to get comfortable being a guest in it."
];
```

**Update component signature (line ~42):**
```typescript
export const ProblemStatement: React.FC<ProblemStatementProps> = ({
  className = '',
  quotes = DEFAULT_QUOTES,
  tension = DEFAULT_TENSION,  // NEW
  trigger  // NEW
}) => {
```

**Update useEffect to reset on trigger (line ~48):**
```typescript
// Reset animations on content/trigger change
useEffect(() => {
  setVisibleCards(new Set());  // Reset card visibility
  setShowTension(false);       // Reset tension visibility
  
  // ... rest of observer setup
}, [quotes, trigger]);  // ADD trigger to dependencies
```

**Update tension rendering (line ~122):**
```typescript
{/* Tension Statement - NOW DYNAMIC */}
<div ref={tensionRef} className={`...`}>
  {tension.map((line, index) => (
    <p 
      key={index}
      className="font-serif text-xl md:text-2xl text-ink leading-relaxed mb-4"
    >
      {line}
    </p>
  ))}
  
  {/* The hook question - stays static */}
  <p className="font-serif text-2xl md:text-3xl text-grove-clay font-semibold">
    What if there was another way?
  </p>
  {/* ... scroll indicator */}
</div>
```

**Acceptance:** Component re-animates on trigger change, displays custom tension text

---

### Story 4.3: Update Genesis Index Exports
**File:** `src/surface/components/genesis/index.ts`
**Line:** 15

**Add export:**
```typescript
// Content interfaces for Chameleon/Quantum (v0.13)
export type { HeroContent } from './HeroHook';
export type { Quote, TensionContent } from './ProblemStatement';  // ADD TensionContent
```

**Acceptance:** TensionContent type is importable from genesis barrel

---

## Epic 5: Integration Layer

### Story 5.1: Wire GenesisPage to Quantum Interface
**File:** `src/surface/pages/GenesisPage.tsx`
**Lines:** 1-30, 120-130

**Add import (after line 11):**
```typescript
import { useQuantumInterface } from '../hooks/useQuantumInterface';
```

**Add hook call (after line 33, inside component):**
```typescript
const GenesisPage: React.FC = () => {
  // Quantum Interface - lens-reactive content
  const { reality, quantumTrigger } = useQuantumInterface();
  
  const [activeSection] = useState<SectionId>(SectionId.STAKES);
  // ... rest of existing state
```

**Update HeroHook rendering (line ~120):**
```typescript
{/* SCREEN 1: The Hook (Quantum-Reactive) */}
<div ref={el => { screenRefs.current[0] = el; }}>
  <HeroHook 
    content={reality.hero}
    trigger={quantumTrigger}
  />
</div>
```

**Update ProblemStatement rendering (line ~126):**
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

**Acceptance:** Genesis page displays lens-specific content, animates on lens change

---

## Epic 6: Build Verification

### Story 6.1: Build and Test
**Commands:**
```bash
npm run build
npm run dev
```

**Manual Tests:**
1. Visit `http://localhost:5173/` → Shows DEFAULT_REALITY ("YOUR AI.")
2. Open Terminal → Select "Engineer" lens → Headline becomes "LATENCY IS THE MIND KILLER."
3. Text visually backspaces and re-types (not instant swap)
4. Select "Academic" lens → Headline becomes "THE EPISTEMIC COMMONS."
5. Deselect lens (Freestyle) → Returns to "YOUR AI."
6. Refresh page with lens persisted → Correct reality loads immediately
7. Visit `?experience=classic` → Classic page unchanged
8. Check console → No errors

**Acceptance:** All tests pass, build succeeds

---

## Commit Sequence

```
1. feat(quantum): create quantum-content.ts with superposition map
2. feat(quantum): create useQuantumInterface hook
3. feat(effects): create WaveformCollapse animation component
4. refactor(genesis): add trigger prop to HeroHook
5. refactor(genesis): add trigger and tension props to ProblemStatement
6. feat(genesis): wire GenesisPage to quantum interface
7. docs: add v0.13 sprint documentation
```
