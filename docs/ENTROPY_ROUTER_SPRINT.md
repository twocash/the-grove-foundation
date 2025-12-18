# Grove Terminal: Entropy Router & Cognitive Bridge Sprint

**Version:** 1.0 Final  
**Date:** December 16, 2025  
**Status:** Ready for Claude Code Execution

---

## Executive Summary

This sprint transforms the Grove Terminal from a static chatbot into a **"Cognitive Simulator"** that mirrors the Grove's Hybrid Architecture thesis through its own UX. The Terminal becomes a demonstration of the Local→Cloud cognitive split:

- **Cold Start (Local/Routine):** Fast, direct responses. No heavy context loading.
- **Entropy Trigger (The Bridge):** System detects user depth and "wakes up."
- **Dynamic Injection (Cloud/Breakthrough):** Offers structured Journey upgrade inline.

---

## Part 1: Specification

### 1.1 Cold Start State

#### Opening Text (Final Copy)

```
Welcome to the Terminal.

The Grove's core thesis—distributed AI infrastructure as an alternative to 
centralized compute—is mapped here. We've indexed the White Paper and Technical 
Deep Dives.

You might start with:
→ What is the Grove, and what problem does it solve?
→ The Ratchet Effect: why local hardware catches up
→ How agents earn their own cognitive enhancement

Or ask anything. The map will emerge.
```

#### System Configuration

| Property | Value |
|----------|-------|
| Lens | None (null) |
| Journey | None (null) |
| Persona Source | `activeSystemPromptId` from GlobalSettings |
| Voice | System Voice: declarative, neutral, efficient |
| Context Loaded | Baseline (not full 50KB thesis dump) |

#### Behavior Rules

The System Voice in cold start mode:
- Answers questions directly and briefly
- Does not volunteer tangential information
- Does not push users toward specific paths
- Listens more than it explains
- Maintains warmth without personality

**Anti-patterns to avoid:**
- "As I mentioned in the thesis..." (user hasn't read it)
- Lengthy preambles before answering
- Suggesting journeys before understanding user intent
- Over-explaining Grove concepts unsolicited

---

### 1.2 Entropy Detection

#### Conceptual Model

**Entropy** measures the cognitive complexity of user engagement. Low-entropy queries can be answered in Freestyle mode. High-entropy queries indicate depth that would benefit from structured exploration.

This replaces simple keyword matching with intent + complexity detection.

#### Detection Signals

| Signal | Type | Weight | Example |
|--------|------|--------|---------|
| `exchangeCount` | Counter | +30 | ≥3 exchanges on same topic cluster |
| `technicalVocabulary` | Lexical | +15/term | Uses terms from TopicHub tags |
| `questionDepth` | Syntactic | +20 | "Why exactly..." vs "What is..." |
| `referenceChaining` | Semantic | +25 | References previous answer details |
| `specificityCue` | Lexical | +10 | Numbers, timeframes, named concepts |

#### Entropy Classification

| Score | Classification | Action |
|-------|----------------|--------|
| 0-29 | Low | Stay in Freestyle. Brief, accurate response. |
| 30-59 | Medium | Monitor. Fuller response. Track for escalation. |
| 60+ | High | Trigger injection. Offer Cognitive Bridge. |

#### Example Queries by Classification

**Low Entropy (Stay in Freestyle)**
- "What is the Grove?"
- "Tell me about the agents"
- "How does this work?"

**Medium Entropy (Monitor)**
- "How do the economics actually work?"
- "What happens when local models improve?"
- "Is this like blockchain?"

**High Entropy (Trigger Injection)**
- "Why is the lag exactly 21 months?"
- "How does the ratchet affect data center thermodynamic limits?"
- "What's the game-theoretic attack surface on the efficiency tax?"

#### Topic Clustering

High entropy alone isn't sufficient—the system must also detect *coherent depth* within a topic cluster.

```javascript
const TOPIC_CLUSTERS = {
  'ratchet': ['doubling', 'lag', '21 months', '7 months', 'frontier', 'local', 'capability', 'METR'],
  'economics': ['efficiency tax', 'credits', 'enlightenment', 'incentives', 'cloud costs', 'sink'],
  'architecture': ['hybrid', 'split', 'local model', 'cloud', 'pivotal', 'routine', 'cognitive'],
  'knowledge-commons': ['publishing', 'attribution', 'validation', 'innovation', 'propagation'],
  'observer': ['terminal', 'cosmology', 'diary', 'agents', 'village', 'simulation']
};
```

---

### 1.3 Dynamic Injection

#### Trigger Condition

When entropy detection returns `high`:

1. System delivers the Freestyle answer (brief, accurate)
2. **Visual pause** (0.8s delay + subtle animation to simulate "cloud latency")
3. System injects a "Cognitive Bridge" offer
4. Journey Card renders inline

#### Injection Template

```
[Freestyle Answer - 2-4 sentences max]

---

[CognitiveBridge Component with loading animation]

This connects to the [TOPIC_NAME] sequence. To fully map this 
dependency, I can switch to a structured path.

[JOURNEY CARD]
*3 nodes • ~8 min • Covers: [topics]*
[Start Journey] [Continue Freestyle]
```

---

### 1.4 Cooldown Logic

**Critical:** Without cooldown, high-entropy users get spammed with journey offers.

#### Rules

1. **Post-Dismiss Cooldown:** After user clicks "Continue Freestyle," no injection for 5 exchanges.
2. **Topic-Switch Reset:** If user shifts to a new topic cluster, cooldown resets.
3. **Post-Accept Suppression:** If user starts a journey, no injection until journey completes or abandons.
4. **Session Cap:** Maximum 2 injection offers per session (prevent fatigue).

---

### 1.5 Entropy Persistence

**Requirement:** Entropy state must persist across page refreshes to maintain the "Simulated Memory" effect.

- Store in localStorage alongside existing session state
- Key: `grove-terminal-entropy`
- Expiration: Clear if session age > 24 hours

---

### 1.6 Journey Route Matching

| Topic Cluster | Journey ID | Title |
|---------------|------------|-------|
| ratchet, doubling, lag, METR | `journey-ratchet` | The Ratchet Pattern |
| economics, efficiency, credits | `journey-economics` | The Efficiency-Enlightenment Loop |
| architecture, hybrid, split | `journey-architecture` | The Hybrid Cognitive Split |
| knowledge-commons, publishing | `journey-commons` | The Knowledge Commons |
| observer, terminal, cosmology | `journey-observer` | The Observer Dynamic |

---

### 1.7 CognitiveBridge Component Specification

#### Visual Design

- **Container:** Distinct from chat bubbles. Border-left accent. Muted background.
- **Animation:** 0.8s "Resolving connection..." loading state before content appears.
- **Typography:** Monospace for system elements. Serif for descriptive text.
- **Buttons:** Ghost style. "Start Journey" primary, "Continue Freestyle" secondary.

#### Animation Sequence

1. Divider line fades in (200ms)
2. "Resolving connection..." text appears with pulsing dot (800ms)
3. Text fades out, card content fades in (300ms)
4. Card is fully interactive

This visually mimics the "latency" of a cloud call, reinforcing the Cognitive Split metaphor.

---

## Part 2: Repo Intelligence

### Current State (with citations)

#### 1) Routing Reality
- **File:** `src/core/engine/topicRouter.ts` (lines 1-144)
- **Current:** Tag-based scoring against TopicHub definitions. Returns matched hub.
- **Missing:** Entropy classification. Conversation depth tracking.

#### 2) State Management Reality
- **File:** `hooks/useNarrativeEngine.ts` (lines 1-389)
- **Current:** Manages `exchangeCount`, lens selection, session persistence.
- **Missing:** Entropy state. Cooldown tracking. Injection history.

#### 3) Terminal Component Reality
- **File:** `components/Terminal.tsx` (lines 1-972)
- **Current:** Large component. Renders chat, handles streaming, manages reveals.
- **Missing:** Inline injection capability. CognitiveBridge integration.

#### 4) Initial Message Reality
- **File:** `constants.ts` (lines 117-128)
- **Current:** Old "Connection established" text with menu-style bullets.
- **Change:** Replace with new "Welcome to the Terminal" copy.

#### 5) Journey Card Reality
- **File:** `components/Terminal/JourneyCard.tsx`
- **Current:** Designed for sidebar/modal use.
- **Action:** Create new `CognitiveBridge.tsx` for inline injection.

#### 6) Session Persistence Reality
- **File:** `hooks/useNarrativeEngine.ts` (lines 19-20)
- **Current:** Uses localStorage keys `grove-terminal-lens`, `grove-terminal-session`.
- **Action:** Add `grove-terminal-entropy` key for entropy state.

---

### Tripwires (Critical Constraints)

1. **Terminal.tsx is 972 lines.** Make MINIMAL changes. Import new components, don't refactor structure.

2. **useNarrativeEngine already has exchangeCount.** Use it for entropy scoring. Don't duplicate.

3. **TopicHub tags are the vocabulary.** Match against existing tag definitions.

4. **JourneyCard.tsx exists but is not inline-ready.** Create new CognitiveBridge component.

5. **Session state persists via localStorage.** Follow existing patterns for entropy persistence.

6. **Server-side system prompt exists in server.js.** Don't modify server-side prompt handling.



---

## Part 3: Sprint Plan

### Sprint 1: Entropy Detection Foundation

**Duration:** ~4 hours  
**Goal:** Implement entropy detection logic and wire to session state.

#### Story 1.1: Create Entropy Detector Module

**File:** `src/core/engine/entropyDetector.ts` (NEW)

**Acceptance Criteria:**
- [ ] Exports `calculateEntropy(message, history, topicHubs): EntropyResult`
- [ ] EntropyResult type: `{ score, classification, matchedTags, dominantCluster }`
- [ ] Scoring: +30 exchangeCount>=3, +15/term match, +20 depth markers, +25 reference chaining
- [ ] Thresholds: low (<30), medium (30-59), high (>=60)
- [ ] Topic clustering identifies dominant topic from conversation history

---

#### Story 1.2: Integrate Entropy into Session State

**File:** `hooks/useNarrativeEngine.ts` (UPDATE)

**Acceptance Criteria:**
- [ ] Add `EntropyState` to TerminalSession type
- [ ] Add `updateEntropyState(entropy: EntropyResult)` method
- [ ] Add `getCooldownStatus()` method
- [ ] Add `recordInjection(topic: string)` method
- [ ] Add `dismissInjection()` method
- [ ] Persist entropy state to localStorage

---

#### Story 1.3: Update Initial Message

**File:** `constants.ts` (lines 117-128)

**Acceptance Criteria:**
- [ ] Replace INITIAL_TERMINAL_MESSAGE with new copy
- [ ] Verify renders correctly in Terminal cold start

---

#### Sprint 1 Definition of Done

- [ ] `src/core/engine/entropyDetector.ts` exists with full scoring logic
- [ ] `useNarrativeEngine` exposes entropy state and methods
- [ ] Entropy state persists across page refresh
- [ ] Initial message updated
- [ ] `npm run build` passes with no errors

---

### Sprint 2: Cognitive Bridge UI

**Duration:** ~4 hours  
**Goal:** Build CognitiveBridge component and integrate into Terminal.

#### Story 2.1: Create CognitiveBridge Component

**File:** `components/Terminal/CognitiveBridge.tsx` (NEW)

**Acceptance Criteria:**
- [ ] Renders inline between chat messages
- [ ] Shows loading animation (0.8s "Resolving...") before content
- [ ] Displays journey title, node count, duration, topics
- [ ] Accept button triggers `onAccept`
- [ ] Dismiss button triggers `onDismiss`
- [ ] Escape key dismisses
- [ ] Visual: monospace aesthetic, distinct from chat bubbles

---

#### Story 2.2: Journey Route Matching

**File:** `src/core/engine/topicRouter.ts` (UPDATE)

**Acceptance Criteria:**
- [ ] New export: `routeToJourney(dominantCluster, narratives): Narrative | null`
- [ ] Returns matched journey or null
- [ ] Mapping table implemented

---

#### Story 2.3: Integrate CognitiveBridge into Terminal

**File:** `components/Terminal.tsx` (UPDATE)

**Acceptance Criteria:**
- [ ] Import CognitiveBridge and entropy detector
- [ ] After each model response, calculate entropy
- [ ] If high entropy + journey match + no cooldown → show CognitiveBridge
- [ ] On Accept: load journey, dismiss bridge
- [ ] On Dismiss: start cooldown, increment counter, dismiss bridge

---

#### Story 2.4: Analytics Hookup

**File:** `utils/funnelAnalytics.ts` (UPDATE)

**Acceptance Criteria:**
- [ ] Add `trackEntropyTrigger(level, topic, score)`
- [ ] Add `trackBridgeOffered(journeyId, topic)`
- [ ] Add `trackBridgeAccepted(journeyId)`
- [ ] Add `trackBridgeDismissed(journeyId)`

---

#### Sprint 2 Definition of Done

- [ ] CognitiveBridge component renders with loading animation
- [ ] High-entropy queries trigger bridge display
- [ ] Journey matching works for all 5 topic clusters
- [ ] Accept/Dismiss flows function
- [ ] Analytics events fire
- [ ] `npm run build` passes
- [ ] Visual QA in dev environment



---

## Part 4: Execution Prompt

**Copy everything below this line into Claude Code:**

---

```
CONTEXT: Grove Terminal Entropy Router Implementation

You are implementing the "Cognitive Bridge" feature for the Grove Terminal. 
This transforms the Terminal from a static chatbot into a "Simulator" that 
mirrors the Grove's Hybrid Cognition thesis.

The Terminal becomes a demonstration of Local→Cloud cognitive split:
- Cold Start = Local/Routine (fast, direct)
- Entropy Trigger = The Bridge (complexity detection)
- Dynamic Injection = Cloud/Breakthrough (structured journey offer)

REPO: C:\Github\the-grove-foundation

===== KEY FILES TO MODIFY =====

1. src/core/engine/topicRouter.ts (lines 1-144)
   - Add routeToJourney() function
   - Add CLUSTER_JOURNEY_MAP constant

2. hooks/useNarrativeEngine.ts (lines 1-389)
   - Add EntropyState to TerminalSession
   - Add entropy management methods
   - Add localStorage persistence for entropy

3. components/Terminal.tsx (lines 1-972)
   - Import CognitiveBridge component
   - Add bridge visibility state
   - Render CognitiveBridge after model messages when triggered
   - Handle accept/dismiss flows

4. constants.ts (lines 117-128)
   - Replace INITIAL_TERMINAL_MESSAGE with new copy

===== NEW FILES TO CREATE =====

1. src/core/engine/entropyDetector.ts
   - calculateEntropy() function
   - shouldInject() function
   - EntropyResult type
   - Topic cluster definitions

2. components/Terminal/CognitiveBridge.tsx
   - Inline injection component
   - Loading animation (0.8s "Resolving...")
   - Journey preview card
   - Accept/Dismiss buttons

===== TRIPWIRES (READ CAREFULLY) =====

1. Terminal.tsx is 972 lines. Make MINIMAL changes. Import new components,
   don't refactor existing structure.

2. useNarrativeEngine already has exchangeCount (used in incrementExchangeCount).
   Use this for entropy scoring. Don't duplicate the counter.

3. TopicHub tags are loaded via /api/topic-hubs. Match against these for
   technical vocabulary scoring.

4. JourneyCard.tsx exists but is for sidebar/modal use. Create NEW
   CognitiveBridge.tsx for inline injection.

5. Session state uses localStorage keys 'grove-terminal-lens' and 
   'grove-terminal-session'. Add 'grove-terminal-entropy' following same pattern.

6. Cooldown logic is CRITICAL. Without it, high-entropy users get spammed.
   5 exchanges after dismiss. Max 2 injections per session.

===== RESPONSE FORMAT FOR EACH FILE =====

Before changing any file, output:

1. READING: [filepath]
   What I found: [key structures, line numbers]

2. PLANNING: [filepath]
   What I'm adding/changing: [specific changes]
   Integration points: [where new code connects]

3. IMPLEMENTING: [filepath]
   [Show the code]

4. VERIFICATION:
   Build command: npm run build
   Manual test: [what to check in browser]
   Risks: [potential issues]

===== SEQUENCING (FOLLOW THIS ORDER) =====

SPRINT 1:
1. Read src/core/engine/topicRouter.ts fully
2. Read hooks/useNarrativeEngine.ts fully
3. Create src/core/engine/entropyDetector.ts
4. Update hooks/useNarrativeEngine.ts (add entropy state)
5. Update constants.ts (new initial message)
6. Run npm run build, verify no errors

SPRINT 2:
7. Create components/Terminal/CognitiveBridge.tsx
8. Update src/core/engine/topicRouter.ts (add routeToJourney)
9. Update components/Terminal.tsx (integrate bridge)
10. Update utils/funnelAnalytics.ts (add tracking)
11. Run npm run build, verify no errors
12. Run npm run dev, test in browser

===== DO NOT =====

- Refactor Terminal.tsx structure
- Change existing TopicHub schema
- Modify server-side prompt handling
- Remove existing functionality
- Skip the entropy detector module (it's the foundation)
- Forget cooldown logic (causes spam)

===== INITIAL MESSAGE UPDATE =====

Replace INITIAL_TERMINAL_MESSAGE in constants.ts (lines 117-128) with:

export const INITIAL_TERMINAL_MESSAGE = `Welcome to the Terminal.

The Grove's core thesis—distributed AI infrastructure as an alternative to centralized compute—is mapped here. We've indexed the White Paper and Technical Deep Dives.

You might start with:
→ What is the Grove, and what problem does it solve?
→ The Ratchet Effect: why local hardware catches up
→ How agents earn their own cognitive enhancement

Or ask anything. The map will emerge.`;

===== ENTROPY SCORING REFERENCE =====

Thresholds:
- Low: score < 30 (stay in freestyle)
- Medium: score 30-59 (monitor, fuller responses)
- High: score >= 60 (trigger injection)

Scoring:
- +30: exchangeCount >= 3
- +15: each TopicHub tag match
- +20: depth marker present ("exactly", "mechanism", "why does", etc.)
- +25: reference chaining ("you mentioned", "earlier", etc.)

Topic Clusters:
- 'ratchet' → journey-ratchet
- 'economics' → journey-economics  
- 'architecture' → journey-architecture
- 'knowledge-commons' → journey-commons
- 'observer' → journey-observer

===== COGNITIVE BRIDGE ANIMATION =====

Critical UX detail: The bridge should have a 0.8s "Resolving connection..." 
loading state before showing the journey card. This simulates "cloud latency"
and reinforces the Hybrid Cognition metaphor.

Implementation:
1. Component mounts with isResolving = true
2. Show pulsing dot + "Resolving connection..." text
3. After 800ms, fade out loading, fade in journey card
4. User can then interact with Accept/Dismiss

===== BEGIN SPRINT 1 =====

Start by reading src/core/engine/topicRouter.ts fully.
Output what you find before proceeding.
```



---

## Part 5: Quality Gate Checklist

Before marking any sprint complete, verify:

**Citations & Accuracy**
- [ ] All current-state claims cite `path:line-line`
- [ ] No invented files (every reference exists or is tagged "to create")
- [ ] Entropy scoring matches spec exactly

**Build & Type Safety**
- [ ] `npm run build` passes with zero errors
- [ ] `npm run dev` starts successfully
- [ ] No TypeScript errors in IDE

**Functionality**
- [ ] Initial message displays new copy
- [ ] Entropy score logs to console during conversation
- [ ] High-entropy queries (3+ exchanges + technical terms) trigger bridge
- [ ] Bridge loading animation plays for 0.8s
- [ ] Accept button loads journey
- [ ] Dismiss button starts cooldown
- [ ] No re-injection during cooldown (5 exchanges)
- [ ] Entropy state persists across page refresh

**Visual QA**
- [ ] CognitiveBridge visually distinct from chat bubbles
- [ ] Loading animation smooth
- [ ] Buttons have proper hover states
- [ ] Escape key dismisses bridge

---

## Part 6: Open Decisions

| Decision | Option A | Option B | Selected |
|----------|----------|----------|----------|
| Bridge styling | Monospace terminal aesthetic | Match JourneyCard style | **A** |
| Cooldown trigger | 5 exchanges post-dismiss | Topic-based cooldown | **A (simpler)** |
| Max injections | 2 per session | 3 per session | **2** |
| Loading duration | 800ms | 1200ms | **800ms** |
| Persistence scope | localStorage (24h expiry) | sessionStorage only | **localStorage** |
| Dynamic journey gen | Include in sprint | Post-MVP | **Post-MVP** |

---

## Appendix A: File Structure After Implementation

```
src/
├── core/
│   └── engine/
│       ├── entropyDetector.ts    ← NEW
│       ├── topicRouter.ts        ← UPDATED (add routeToJourney)
│       └── ...
├── hooks/
│   └── useNarrativeEngine.ts     ← UPDATED (add entropy state)
└── ...

components/
├── Terminal/
│   ├── CognitiveBridge.tsx       ← NEW
│   ├── JourneyCard.tsx           ← UNCHANGED
│   └── ...
├── Terminal.tsx                  ← UPDATED (integrate bridge)
└── ...

constants.ts                      ← UPDATED (new initial message)
utils/funnelAnalytics.ts          ← UPDATED (add tracking)
```

---

## Appendix B: Sample Implementation - entropyDetector.ts

```typescript
// src/core/engine/entropyDetector.ts

import { TopicHub } from '../schema';

export interface EntropyResult {
  score: number;
  classification: 'low' | 'medium' | 'high';
  matchedTags: string[];
  dominantCluster: string | null;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const DEPTH_MARKERS = [
  'exactly', 'specifically', 'underlying', 'mechanism', 'why does',
  'how does', 'what happens when', 'implications', 'game-theoretic',
  'attack surface', 'failure mode', 'edge case'
];

const TOPIC_CLUSTERS: Record<string, string[]> = {
  'ratchet': ['doubling', 'lag', '21 months', '7 months', 'frontier', 'local', 'capability', 'metr'],
  'economics': ['efficiency tax', 'credits', 'enlightenment', 'incentives', 'cloud costs', 'sink'],
  'architecture': ['hybrid', 'split', 'local model', 'cloud', 'pivotal', 'routine', 'cognitive'],
  'knowledge-commons': ['publishing', 'attribution', 'validation', 'innovation', 'propagation'],
  'observer': ['terminal', 'cosmology', 'diary', 'agents', 'village', 'simulation']
};

export function calculateEntropy(
  message: string,
  history: ChatMessage[],
  topicHubs: TopicHub[]
): EntropyResult {
  let score = 0;
  const matchedTags: string[] = [];
  const messageLower = message.toLowerCase();
  
  // 1. Exchange depth (+30 if >= 3 user messages)
  const userMessageCount = history.filter(m => m.role === 'user').length;
  if (userMessageCount >= 3) {
    score += 30;
  }
  
  // 2. Technical vocabulary (+15 per match)
  for (const hub of topicHubs) {
    if (!hub.enabled) continue;
    for (const tag of hub.tags) {
      if (messageLower.includes(tag.toLowerCase())) {
        matchedTags.push(tag);
        score += 15;
      }
    }
  }
  
  // 3. Depth markers (+20 if present)
  const hasDepthMarker = DEPTH_MARKERS.some(marker => 
    messageLower.includes(marker)
  );
  if (hasDepthMarker) {
    score += 20;
  }
  
  // 4. Reference chaining (+25 if references previous content)
  const lastModelMessage = [...history].reverse().find(m => m.role === 'model');
  if (lastModelMessage) {
    const referencePhrases = ['you mentioned', 'you said', 'earlier', 'that point', 'the part about'];
    const hasReference = referencePhrases.some(phrase => 
      messageLower.includes(phrase)
    );
    if (hasReference) {
      score += 25;
    }
  }
  
  // 5. Identify dominant cluster
  const clusterScores: Record<string, number> = {};
  const fullConversation = history.map(m => m.text).join(' ').toLowerCase() + ' ' + messageLower;
  
  for (const [cluster, terms] of Object.entries(TOPIC_CLUSTERS)) {
    clusterScores[cluster] = terms.filter(term => 
      fullConversation.includes(term)
    ).length;
  }
  
  const dominantCluster = Object.entries(clusterScores)
    .sort(([,a], [,b]) => b - a)
    .find(([,count]) => count > 0)?.[0] || null;
  
  // 6. Classify
  const classification: 'low' | 'medium' | 'high' = 
    score >= 60 ? 'high' : 
    score >= 30 ? 'medium' : 'low';
  
  return {
    score,
    classification,
    matchedTags,
    dominantCluster
  };
}

export function shouldInject(
  entropy: EntropyResult,
  cooldownActive: boolean,
  injectionCount: number,
  maxInjections: number = 2
): boolean {
  if (cooldownActive) return false;
  if (injectionCount >= maxInjections) return false;
  if (entropy.classification !== 'high') return false;
  if (!entropy.dominantCluster) return false;
  return true;
}
```

---

## Appendix C: Sample Implementation - CognitiveBridge.tsx

```tsx
// components/Terminal/CognitiveBridge.tsx

import React, { useState, useEffect } from 'react';

interface CognitiveBridgeProps {
  journeyId: string;
  journeyTitle: string;
  topicMatch: string;
  nodeCount: number;
  estimatedMinutes: number;
  coverTopics: string[];
  onAccept: () => void;
  onDismiss: () => void;
}

const CognitiveBridge: React.FC<CognitiveBridgeProps> = ({
  journeyId,
  journeyTitle,
  topicMatch,
  nodeCount,
  estimatedMinutes,
  coverTopics,
  onAccept,
  onDismiss
}) => {
  const [isResolving, setIsResolving] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsResolving(false), 800);
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onDismiss]);
  
  return (
    <div className="my-6 border-l-2 border-grove-forest/30 pl-4 py-3 bg-paper-dark/30">
      {isResolving ? (
        <div className="flex items-center space-x-2 font-mono text-xs text-ink-muted">
          <span className="animate-pulse">●</span>
          <span>Resolving connection...</span>
        </div>
      ) : (
        <div className="space-y-3 animate-fadeIn">
          <p className="font-serif text-sm text-ink/80">
            This connects to the <strong className="text-grove-forest">{journeyTitle}</strong> sequence. 
            To fully map this dependency, I can switch to a structured path.
          </p>
          
          <div className="bg-white border border-ink/10 rounded-sm p-4 shadow-sm">
            <h4 className="font-display font-bold text-ink mb-1">{journeyTitle}</h4>
            <p className="font-mono text-xs text-ink-muted mb-2">
              {nodeCount} nodes • ~{estimatedMinutes} min
            </p>
            <p className="font-sans text-xs text-ink/60">
              Covers: {coverTopics.join(', ')}
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onAccept}
              className="px-4 py-2 bg-grove-forest text-white text-xs font-mono uppercase tracking-wider hover:bg-ink transition-colors rounded-sm"
            >
              Start Journey
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-2 border border-ink/20 text-ink-muted text-xs font-mono uppercase tracking-wider hover:border-ink/40 transition-colors rounded-sm"
            >
              Continue Freestyle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CognitiveBridge;
```

---

*Document complete. Ready for Claude Code execution.*
