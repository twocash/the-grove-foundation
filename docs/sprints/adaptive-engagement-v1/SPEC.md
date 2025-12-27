# Adaptive Engagement System — SPEC v1.0

**Sprint:** `adaptive-engagement-v1`
**Status:** Draft
**Author:** Claude (Foundation Loop)
**Date:** 2025-12-26

---

## Overview

Transform Grove's static welcome experience into an adaptive system that responds to user engagement. New users see orientation prompts; returning engaged users see depth prompts and contribution invitations.

### The Problem

Current state: User lands → picks lens → sees "interesting but random" prompts → expected to know what Grove is and care about distributed AI infrastructure.

Desired state: User lands → brief orientation → guided discovery that adapts to engagement → progressively deeper content → natural invitation to contribute.

### The Solution

1. **Session Telemetry** — Track engagement signals (visit count, exchange count, topics explored, sprouts captured)
2. **Session Stages** — Compute stage from telemetry (ARRIVAL → ORIENTED → EXPLORING → ENGAGED)
3. **Adaptive Prompts** — Stage-aware prompts that evolve with user engagement
4. **Journey Framework** — Declarative structured paths with implicit entry and ambient tracking
5. **Server Persistence** — Telemetry persists to Supabase for cross-device continuity

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Stage-aware prompts | Quantum Interface (Pattern 1) | Add `stagePrompts` to `TerminalWelcome` type |
| Session telemetry | Schema System (Pattern 3) | New schema file: `session-telemetry.ts` |
| Journey config | Schema System (Pattern 3) | New schema file: `journey.ts` with declarative waypoints |
| Prompt computation | Quantum Interface (Pattern 1) | New hook: `useSuggestedPrompts()` |

## Canonical Source Audit

| Capability Needed | Canonical Home | Current Approach | Recommendation |
|-------------------|----------------|------------------|----------------|
| Terminal prompts | `TerminalWelcome.tsx` | Static prompts from reality | **EXTEND** with stage-awareness |
| Session ID | `src/lib/session.ts` | ✅ Canonical exists | **USE** existing |
| Lens context | `useQuantumInterface()` | ✅ Canonical exists | **USE** existing |
| Sprout storage | `useSproutStorage.ts` | ✅ Canonical exists | **EXTEND** to emit telemetry |
| Server sync | `lib/supabase.js` | ✅ Canonical exists | **USE** existing |

### No Duplication Certification

I confirm this sprint does not create parallel implementations of existing capabilities. All new code:
- Uses existing session ID infrastructure
- Uses existing Supabase client
- Extends existing hooks rather than creating parallel state
- Integrates with existing Quantum Interface pattern

---

## New Patterns Proposed

### Proposed: Session Engagement Telemetry (Pattern 11)

**Why existing patterns are insufficient:**

The Quantum Interface handles *content variation by lens* but not *content variation by engagement depth*. Session telemetry is a new dimension: the same lens should show different prompts to a first-time visitor vs. a returning power user.

**DEX compliance:**

- **Declarative Sovereignty:** Stage thresholds and prompt configs are JSON/YAML, not hardcoded. Domain experts can tune without code changes.
- **Capability Agnosticism:** Works regardless of model capability — telemetry is observation-based, not model-dependent.
- **Provenance:** Telemetry records how engagement accumulated (timestamp, source, context).
- **Organic Scalability:** Works with minimal config (defaults), improves with more (per-lens stage tuning).

**Approval required:** This is a new pattern. Human approval needed before Phase 1.

---

## User Stories

### Epic 1: Session Telemetry

**Story 1.1:** As a user, my engagement is tracked locally so the system can adapt to me.
- Visits, exchanges, topics explored, sprouts captured

**Story 1.2:** As a returning user, my telemetry persists across sessions.
- Server-side storage via Supabase (extends server-side-capture-v1)

**Story 1.3:** As a user who switches devices, my engagement history follows me.
- Anonymous session ID linking (future: authenticated users)

### Epic 2: Session Stages

**Story 2.1:** As a new user, I'm recognized as being in ARRIVAL stage.
- First visit, < 3 exchanges

**Story 2.2:** As a user who has explored a bit, I'm in ORIENTED stage.
- 1-3 exchanges OR returning visit

**Story 2.3:** As a user exploring multiple topics, I'm in EXPLORING stage.
- Multiple topics touched, > 5 exchanges

**Story 2.4:** As an engaged user who captures sprouts, I'm in ENGAGED stage.
- Sprouts captured, multiple return visits

### Epic 3: Adaptive Prompts

**Story 3.1:** As a new user, I see orientation prompts explaining what Grove is.
- "What is The Grove?" / "Why does distributed AI matter?" / "Show me how this works"

**Story 3.2:** As an oriented user, I see discovery prompts.
- "What topics can I explore?" / "Take me deeper on {last_topic}" / "What's most relevant to my lens?"

**Story 3.3:** As an exploring user, I see depth and synthesis prompts.
- "How does X connect to Y?" / "I want to save an insight" / "Show me something unexpected"

**Story 3.4:** As an engaged user, I see contribution and reflection prompts.
- "Review my captured insights" / "Explore {underexplored_area}" / "How can I contribute?"

**Story 3.5:** As a user who clicks a prompt, new prompts appear based on my updated telemetry.
- Intelligent refresh, not random rotation

### Epic 4: Journey Framework

**Story 4.1:** As a user, I can explicitly start a guided journey.
- "Understanding The Grove" journey with structured waypoints

**Story 4.2:** As a user asking relevant questions, I implicitly enter a journey.
- Question close enough to waypoint → ambient tracking begins

**Story 4.3:** As a user on a journey, my progress tracks even without explicit start.
- Ambient progress: if I've covered waypoint topics naturally, show progress

**Story 4.4:** As a user completing a journey, I see completion celebration and next suggestions.
- "You've completed the fundamentals! Ready to explore on your own?"

### Epic 5: Lens Integration

**Story 5.1:** When I switch lenses, prompts immediately update.
- Stage stays same, but prompt text/framing changes per lens

**Story 5.2:** Different lenses can have different stage thresholds.
- Academic lens might advance to EXPLORING faster (higher intent)

---

## Technical Architecture

### Session Telemetry Schema

```typescript
// src/core/schema/session-telemetry.ts

/**
 * SessionTelemetry — Engagement signals for adaptive content
 * 
 * Computed locally, optionally synced to server.
 * Privacy-respecting: no PII, just engagement patterns.
 */
export interface SessionTelemetry {
  // Identity (anonymous)
  sessionId: string;           // From src/lib/session.ts
  
  // Visit patterns
  visitCount: number;          // Total visits (persisted)
  currentVisitStart: string;   // ISO timestamp
  lastVisit: string | null;    // ISO timestamp of previous visit
  
  // Engagement depth
  exchangeCount: number;       // Messages sent this session
  totalExchangeCount: number;  // All-time messages (persisted)
  topicsExplored: string[];    // Hub IDs touched this session
  allTopicsExplored: string[]; // All-time topics (persisted)
  
  // Contribution
  sproutsCaptured: number;     // Total sprouts (from useSproutStats)
  
  // Journey
  activeJourney: {
    journeyId: string;
    currentWaypoint: number;
    startedAt: string;
    explicit: boolean;         // User started explicitly vs. implicit entry
  } | null;
  completedJourneys: string[]; // Journey IDs
  
  // Computed
  stage: SessionStage;
}

export type SessionStage = 'ARRIVAL' | 'ORIENTED' | 'EXPLORING' | 'ENGAGED';

/**
 * Stage computation thresholds (declarative, can be overridden per lens)
 */
export interface StageThresholds {
  oriented: {
    minExchanges?: number;     // Default: 3
    minVisits?: number;        // Default: 2 (returning user)
  };
  exploring: {
    minExchanges?: number;     // Default: 5
    minTopics?: number;        // Default: 2
  };
  engaged: {
    minSprouts?: number;       // Default: 1
    minVisits?: number;        // Default: 3
    minTotalExchanges?: number; // Default: 15
  };
}
```

### Adaptive Prompts Schema

```typescript
// src/core/schema/suggested-prompts.ts

/**
 * SuggestedPrompt — A clickable prompt with intent and routing
 */
export interface SuggestedPrompt {
  id: string;
  text: string;                // Display text (can include {variables})
  intent: PromptIntent;        // What this prompt is trying to do
  
  // Routing
  leadsTo?: string;            // Hub ID or content route
  command?: string;            // Terminal command to execute (e.g., "/sprout")
  
  // Dynamic templating
  dynamic?: boolean;           // If true, text includes variables
  variables?: string[];        // Variable names used (for validation)
  
  // Filtering
  lensAffinity?: string[];     // Lenses where this prompt is preferred
  lensExclude?: string[];      // Lenses where this prompt is hidden
  weight?: number;             // Priority (higher = more likely to show)
}

export type PromptIntent = 
  | 'orientation'      // Explain what Grove is
  | 'motivation'       // Why should user care
  | 'demonstration'    // Show me how it works
  | 'discovery'        // What can I explore
  | 'depth'            // Go deeper on topic
  | 'personalization'  // Tailor to my lens
  | 'synthesis'        // Connect topics
  | 'contribution'     // Capture/share
  | 'reflection'       // Review my insights
  | 'serendipity';     // Surprise me

/**
 * StagePromptConfig — Prompts available at each stage
 */
export interface StagePromptConfig {
  stage: SessionStage;
  prompts: SuggestedPrompt[];
  maxDisplay?: number;         // Max prompts to show (default: 3)
  refreshStrategy?: 'static' | 'engagement' | 'random';
}
```

### Journey Schema

```typescript
// src/core/schema/journey.ts

/**
 * JourneyWaypoint — A step in a guided journey
 */
export interface JourneyWaypoint {
  id: string;
  title: string;               // "The Why"
  prompt: string;              // Suggested question for this waypoint
  hub?: string;                // Related hub ID
  
  // Completion criteria
  successCriteria?: {
    minExchanges?: number;     // Min exchanges on this topic
    topicsMentioned?: string[]; // Topics that indicate completion
  };
  
  // Implicit entry matching
  entryPatterns?: string[];    // Regex patterns that trigger implicit entry
}

/**
 * Journey — A structured exploration path
 */
export interface Journey {
  id: string;
  title: string;               // "Understanding The Grove"
  description: string;
  estimatedTime?: string;      // "15 minutes"
  
  // Lens targeting
  lensAffinity?: string[];     // Preferred lenses
  lensExclude?: string[];
  
  // Structure
  waypoints: JourneyWaypoint[];
  
  // Completion
  completionMessage: string;
  nextJourneys?: string[];     // Suggested follow-up journeys
  
  // Behavior
  allowImplicitEntry?: boolean;  // Can enter mid-journey via matching questions
  ambientTracking?: boolean;     // Track progress even without explicit start
}
```

### Database Schema (Supabase)

```sql
-- Extends server-side-capture-v1

-- Session telemetry table
CREATE TABLE session_telemetry (
  session_id TEXT PRIMARY KEY,
  visit_count INTEGER DEFAULT 1,
  first_visit TIMESTAMPTZ DEFAULT NOW(),
  last_visit TIMESTAMPTZ DEFAULT NOW(),
  total_exchange_count INTEGER DEFAULT 0,
  all_topics_explored TEXT[] DEFAULT '{}',
  completed_journeys TEXT[] DEFAULT '{}',
  current_stage TEXT DEFAULT 'ARRIVAL',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journey progress tracking
CREATE TABLE journey_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  journey_id TEXT NOT NULL,
  current_waypoint INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  explicit_start BOOLEAN DEFAULT false,
  UNIQUE(session_id, journey_id)
);

-- Indexes
CREATE INDEX idx_session_telemetry_last_visit ON session_telemetry(last_visit DESC);
CREATE INDEX idx_journey_progress_session ON journey_progress(session_id);

-- RLS
ALTER TABLE session_telemetry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON session_telemetry FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE journey_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON journey_progress FOR ALL TO anon USING (true) WITH CHECK (true);
```

### Hook Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         HOOK DEPENDENCY GRAPH                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  useSessionTelemetry()                                                   │
│       │                                                                  │
│       ├─── Reads: localStorage, server API                              │
│       ├─── Provides: telemetry, stage, trackExchange(), trackTopic()    │
│       │                                                                  │
│       ▼                                                                  │
│  useSessionStage()  ◄─────── Computed from telemetry                    │
│       │                                                                  │
│       ▼                                                                  │
│  useSuggestedPrompts(lensId, telemetry)                                 │
│       │                                                                  │
│       ├─── Reads: stage-prompts config, lens overrides                  │
│       ├─── Computes: filtered, weighted prompts                         │
│       ├─── Provides: prompts[], refreshPrompts()                        │
│       │                                                                  │
│       ▼                                                                  │
│  TerminalWelcome ◄─── Renders adaptive prompts                          │
│                                                                          │
│  useJourneyProgress(journeyId?)                                          │
│       │                                                                  │
│       ├─── Reads: journey config, progress state                        │
│       ├─── Provides: progress, completeWaypoint(), checkImplicitEntry() │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Content Configuration

### Stage Prompts (YAML)

```yaml
# content/prompts/stage-prompts.yaml

defaults:
  maxDisplay: 3
  refreshStrategy: engagement

stages:
  ARRIVAL:
    prompts:
      - id: what-is-grove
        text: "What is The Grove?"
        intent: orientation
        leadsTo: grove-overview
        weight: 1.5
        
      - id: why-distributed
        text: "Why does distributed AI matter?"
        intent: motivation
        leadsTo: distributed-ai-thesis
        
      - id: show-me
        text: "Show me how this works"
        intent: demonstration
        leadsTo: interactive-demo
        lensExclude: [academic-researcher]  # Too casual
        
      - id: research-basis
        text: "What's the research basis for distributed AI?"
        intent: motivation
        leadsTo: academic-foundation
        lensAffinity: [academic-researcher]
        weight: 1.5
        
  ORIENTED:
    prompts:
      - id: explore-topics
        text: "What topics can I explore?"
        intent: discovery
        leadsTo: hub-overview
        
      - id: deeper-last-topic
        text: "Take me deeper on {lastTopic}"
        intent: depth
        dynamic: true
        variables: [lastTopic]
        
      - id: relevant-to-lens
        text: "What's most relevant for a {lensName}?"
        intent: personalization
        dynamic: true
        variables: [lensName]
        
  EXPLORING:
    prompts:
      - id: connections
        text: "How does {topicA} connect to {topicB}?"
        intent: synthesis
        dynamic: true
        variables: [topicA, topicB]
        
      - id: capture-insight
        text: "I want to save an insight"
        intent: contribution
        command: "/sprout"
        
      - id: surprise-me
        text: "Show me something unexpected"
        intent: serendipity
        
  ENGAGED:
    prompts:
      - id: my-garden
        text: "Review my captured insights"
        intent: reflection
        command: "/garden"
        
      - id: underexplored
        text: "I want to explore {underexploredArea}"
        intent: depth
        dynamic: true
        variables: [underexploredArea]
        
      - id: contribute
        text: "How can I contribute to Grove?"
        intent: contribution
        leadsTo: contribution-guide
```

### Journey Configuration (YAML)

```yaml
# content/journeys/grove-fundamentals.yaml

id: grove-fundamentals
title: "Understanding The Grove"
description: "A guided introduction to distributed AI infrastructure"
estimatedTime: "15 minutes"
lensAffinity: [curious-citizen, tech-explorer]
allowImplicitEntry: true
ambientTracking: true

waypoints:
  - id: why
    title: "The Why"
    prompt: "Why are we building The Grove?"
    hub: grove-thesis
    successCriteria:
      minExchanges: 2
    entryPatterns:
      - "why.*grove"
      - "what.*problem.*solving"
      - "purpose.*distributed"
      
  - id: how
    title: "The How"
    prompt: "How does distributed AI actually work?"
    hub: technical-architecture
    successCriteria:
      minExchanges: 2
    entryPatterns:
      - "how.*work"
      - "technical.*architecture"
      - "distributed.*ai.*work"
      
  - id: what
    title: "The What"
    prompt: "What can I do with Grove today?"
    hub: current-capabilities
    successCriteria:
      minExchanges: 1
      
  - id: you
    title: "Your Turn"
    prompt: "What aspect interests you most?"
    successCriteria:
      minExchanges: 1

completionMessage: "You've completed the fundamentals! Ready to explore on your own, or continue with a deeper dive?"
nextJourneys: [deep-dive-agents, grove-economics]
```

---

## UI Changes

### TerminalWelcome Updates

The existing `TerminalWelcome` component will:
1. Receive prompts from `useSuggestedPrompts()` instead of static `welcome.prompts`
2. Handle dynamic variable substitution
3. Show journey progress indicator if active
4. Trigger `trackPromptClick()` on click

### New Components

1. **JourneyProgressIndicator** — Subtle progress bar/breadcrumb when journey active
2. **JourneyStartCard** — Optional explicit journey start UI
3. **JourneyCompletionCelebration** — Completion state with next suggestions

---

## DEX Compliance

- **Declarative Sovereignty:** Stage thresholds, prompts, and journeys are YAML config. Domain experts can tune engagement curves without code.
- **Capability Agnosticism:** Telemetry is observational (exchange counts, topic visits). Works regardless of model capability.
- **Provenance:** Telemetry records timestamps and sources. Journey progress tracks how user arrived at each waypoint.
- **Organic Scalability:** Works with zero config (defaults). Improves with lens-specific tuning, custom journeys, A/B testing.

---

## Success Criteria

- [ ] New user sees ARRIVAL stage prompts ("What is The Grove?")
- [ ] After 3 exchanges, user sees ORIENTED stage prompts
- [ ] Returning user starts at ORIENTED (not ARRIVAL)
- [ ] User who captures sprout advances to ENGAGED
- [ ] Lens switch immediately updates prompt text/filtering
- [ ] Journey progress tracks even without explicit start
- [ ] Server telemetry persists across sessions
- [ ] Build passes, no console errors

---

## Dependencies

- **server-side-capture-v1** — Supabase setup, session ID management
- **Existing:** Quantum Interface, sprout storage hooks

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Over-engineering telemetry | MVP: localStorage only, server sync Phase 2 |
| Privacy concerns | Anonymous session IDs, no PII, clear data policy |
| Stage computation complexity | Simple threshold model first, ML later |
| Journey implicit entry false positives | Conservative regex patterns, user can dismiss |

---

## Phasing

### Phase 1: Client-Side Telemetry + Stage Computation
- `useSessionTelemetry` hook
- `computeSessionStage()` function
- localStorage persistence

### Phase 2: Adaptive Prompts
- Stage prompt config (YAML)
- `useSuggestedPrompts` hook
- TerminalWelcome integration

### Phase 3: Journey Framework
- Journey schema + config
- `useJourneyProgress` hook
- Implicit entry detection
- Ambient tracking

### Phase 4: Server Persistence
- Supabase tables
- Sync telemetry to server
- Cross-device continuity

### Phase 5: Lens Integration
- Per-lens stage thresholds
- Per-lens prompt overrides
- Lens switch reactivity

---

## Approval Required

**New Pattern:** Session Engagement Telemetry (Pattern 11)

This sprint proposes a new pattern. Please confirm approval before proceeding to ARCHITECTURE.md.
