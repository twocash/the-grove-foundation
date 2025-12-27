# Execution Prompt — Adaptive Engagement System v1

## Context

You are implementing an adaptive engagement system for Grove Terminal. This sprint transforms static welcome prompts into stage-aware, lens-filtered prompts that evolve based on user engagement.

**Goal:** New users see orientation prompts; returning engaged users see depth and contribution prompts. Journeys provide optional structured paths with implicit entry and ambient tracking.

## Prerequisites

Before starting, verify:

```bash
# 1. Server-side capture sprint is complete
ls src/lib/supabase/
ls src/lib/session.ts

# 2. Build passes
npm run build

# 3. Terminal works
npm run dev
# Visit /terminal - should show welcome prompts
```

**STOP** if prerequisites are not met.

---

## Phase 1: Session Telemetry (4 hours)

### 1.1 Create Telemetry Schema

**Create `src/core/schema/session-telemetry.ts`:**

```typescript
// src/core/schema/session-telemetry.ts
// Session engagement telemetry for adaptive content
// Sprint: adaptive-engagement-v1

/**
 * SessionStage - Computed engagement level
 */
export type SessionStage = 'ARRIVAL' | 'ORIENTED' | 'EXPLORING' | 'ENGAGED';

/**
 * SessionTelemetry - Engagement signals for adaptive content
 */
export interface SessionTelemetry {
  // Identity
  sessionId: string;
  
  // Visit patterns
  visitCount: number;
  currentVisitStart: string;  // ISO timestamp
  lastVisit: string | null;
  
  // Engagement depth
  exchangeCount: number;       // This session
  totalExchangeCount: number;  // All time
  topicsExplored: string[];    // Hub IDs this session
  allTopicsExplored: string[]; // All time
  
  // Contribution
  sproutsCaptured: number;
  
  // Journey
  activeJourney: {
    journeyId: string;
    currentWaypoint: number;
    startedAt: string;
    explicit: boolean;
  } | null;
  completedJourneys: string[];
  
  // Computed
  stage: SessionStage;
}

/**
 * StageThresholds - Configurable progression thresholds
 */
export interface StageThresholds {
  oriented: {
    minExchanges?: number;  // Default: 3
    minVisits?: number;     // Default: 2
  };
  exploring: {
    minExchanges?: number;  // Default: 5
    minTopics?: number;     // Default: 2
  };
  engaged: {
    minSprouts?: number;        // Default: 1
    minVisits?: number;         // Default: 3
    minTotalExchanges?: number; // Default: 15
  };
}

export const DEFAULT_THRESHOLDS: StageThresholds = {
  oriented: { minExchanges: 3, minVisits: 2 },
  exploring: { minExchanges: 5, minTopics: 2 },
  engaged: { minSprouts: 1, minVisits: 3, minTotalExchanges: 15 },
};
```

**Build gate:** `npm run build`

---

### 1.2 Create Stage Computation

**Create `src/lib/telemetry/stage-computation.ts`:**

```typescript
// src/lib/telemetry/stage-computation.ts
// Computes session stage from telemetry
// Sprint: adaptive-engagement-v1

import { 
  SessionTelemetry, 
  SessionStage, 
  StageThresholds,
  DEFAULT_THRESHOLDS 
} from '@/core/schema/session-telemetry';

/**
 * Compute session stage from telemetry signals
 */
export function computeSessionStage(
  telemetry: Pick<SessionTelemetry, 
    'visitCount' | 'exchangeCount' | 'totalExchangeCount' | 
    'topicsExplored' | 'sproutsCaptured'
  >,
  thresholds: StageThresholds = DEFAULT_THRESHOLDS
): SessionStage {
  const { 
    visitCount, 
    exchangeCount, 
    totalExchangeCount,
    topicsExplored, 
    sproutsCaptured 
  } = telemetry;
  
  // ENGAGED: Has captured sprouts OR is a power user
  if (
    sproutsCaptured >= (thresholds.engaged.minSprouts ?? 1) ||
    (visitCount >= (thresholds.engaged.minVisits ?? 3) &&
     totalExchangeCount >= (thresholds.engaged.minTotalExchanges ?? 15))
  ) {
    return 'ENGAGED';
  }
  
  // EXPLORING: Multiple topics, deeper engagement
  if (
    exchangeCount >= (thresholds.exploring.minExchanges ?? 5) ||
    topicsExplored.length >= (thresholds.exploring.minTopics ?? 2)
  ) {
    return 'EXPLORING';
  }
  
  // ORIENTED: Has some engagement or is returning
  if (
    exchangeCount >= (thresholds.oriented.minExchanges ?? 3) ||
    visitCount >= (thresholds.oriented.minVisits ?? 2)
  ) {
    return 'ORIENTED';
  }
  
  // ARRIVAL: New user, minimal engagement
  return 'ARRIVAL';
}
```

---

### 1.3 Create Telemetry Collector

**Create `src/lib/telemetry/collector.ts`:**

```typescript
// src/lib/telemetry/collector.ts
// Collects and persists engagement telemetry
// Sprint: adaptive-engagement-v1

import { SessionTelemetry, SessionStage } from '@/core/schema/session-telemetry';
import { getSessionId } from '@/lib/session';
import { computeSessionStage } from './stage-computation';

const STORAGE_KEY = 'grove-telemetry';

type TelemetryUpdateType = 
  | 'exchange' 
  | 'topic' 
  | 'sprout' 
  | 'journey_start' 
  | 'journey_progress'
  | 'journey_complete';

interface TelemetryUpdate {
  type: TelemetryUpdateType;
  payload?: Record<string, unknown>;
}

type TelemetryListener = (telemetry: SessionTelemetry) => void;

class TelemetryCollector {
  private telemetry: SessionTelemetry;
  private listeners: Set<TelemetryListener> = new Set();
  
  constructor() {
    this.telemetry = this.loadOrCreate();
  }
  
  private loadOrCreate(): SessionTelemetry {
    if (typeof window === 'undefined') {
      return this.createNew('');
    }
    
    const stored = localStorage.getItem(STORAGE_KEY);
    const sessionId = getSessionId();
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SessionTelemetry;
        const isNewSession = parsed.sessionId !== sessionId;
        
        if (isNewSession) {
          // Returning user - increment visit, preserve totals
          const updated: SessionTelemetry = {
            ...parsed,
            sessionId,
            visitCount: parsed.visitCount + 1,
            currentVisitStart: new Date().toISOString(),
            lastVisit: parsed.currentVisitStart,
            exchangeCount: 0,
            topicsExplored: [],
            stage: 'ARRIVAL', // Will recompute below
          };
          updated.stage = computeSessionStage(updated);
          return updated;
        }
        return parsed;
      } catch {
        return this.createNew(sessionId);
      }
    }
    
    return this.createNew(sessionId);
  }
  
  private createNew(sessionId: string): SessionTelemetry {
    return {
      sessionId,
      visitCount: 1,
      currentVisitStart: new Date().toISOString(),
      lastVisit: null,
      exchangeCount: 0,
      totalExchangeCount: 0,
      topicsExplored: [],
      allTopicsExplored: [],
      sproutsCaptured: 0,
      activeJourney: null,
      completedJourneys: [],
      stage: 'ARRIVAL',
    };
  }
  
  get(): SessionTelemetry {
    return { ...this.telemetry };
  }
  
  getStage(): SessionStage {
    return this.telemetry.stage;
  }
  
  update(update: TelemetryUpdate): SessionTelemetry {
    switch (update.type) {
      case 'exchange':
        this.telemetry.exchangeCount++;
        this.telemetry.totalExchangeCount++;
        break;
        
      case 'topic': {
        const topicId = update.payload?.topicId as string;
        if (topicId && !this.telemetry.topicsExplored.includes(topicId)) {
          this.telemetry.topicsExplored.push(topicId);
        }
        if (topicId && !this.telemetry.allTopicsExplored.includes(topicId)) {
          this.telemetry.allTopicsExplored.push(topicId);
        }
        break;
      }
        
      case 'sprout':
        this.telemetry.sproutsCaptured++;
        break;
        
      case 'journey_start':
        this.telemetry.activeJourney = {
          journeyId: update.payload?.journeyId as string,
          currentWaypoint: 0,
          startedAt: new Date().toISOString(),
          explicit: (update.payload?.explicit as boolean) ?? false,
        };
        break;
        
      case 'journey_progress':
        if (this.telemetry.activeJourney) {
          this.telemetry.activeJourney.currentWaypoint = 
            update.payload?.waypoint as number;
        }
        break;
        
      case 'journey_complete':
        if (this.telemetry.activeJourney) {
          const journeyId = this.telemetry.activeJourney.journeyId;
          if (!this.telemetry.completedJourneys.includes(journeyId)) {
            this.telemetry.completedJourneys.push(journeyId);
          }
          this.telemetry.activeJourney = null;
        }
        break;
    }
    
    // Recompute stage
    this.telemetry.stage = computeSessionStage(this.telemetry);
    
    // Persist
    this.save();
    
    // Notify listeners
    this.notifyListeners();
    
    return this.get();
  }
  
  private save(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.telemetry));
    } catch (e) {
      console.warn('Failed to save telemetry:', e);
    }
  }
  
  private notifyListeners(): void {
    const snapshot = this.get();
    this.listeners.forEach(fn => fn(snapshot));
  }
  
  subscribe(fn: TelemetryListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  
  // For testing
  reset(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    this.telemetry = this.createNew(getSessionId());
    this.notifyListeners();
  }
}

// Singleton
export const telemetryCollector = new TelemetryCollector();
```

---

### 1.4 Create Index Export

**Create `src/lib/telemetry/index.ts`:**

```typescript
// src/lib/telemetry/index.ts
export { telemetryCollector } from './collector';
export { computeSessionStage } from './stage-computation';
export * from '@/core/schema/session-telemetry';
```

**Build gate:** `npm run build`

---

### 1.5 Create Telemetry Hook

**Create `hooks/useSessionTelemetry.ts`:**

```typescript
// hooks/useSessionTelemetry.ts
// React hook for session telemetry
// Sprint: adaptive-engagement-v1

import { useState, useEffect, useCallback } from 'react';
import { telemetryCollector } from '../src/lib/telemetry';
import type { SessionTelemetry, SessionStage } from '../src/core/schema/session-telemetry';

interface UseSessionTelemetryResult {
  telemetry: SessionTelemetry;
  stage: SessionStage;
  trackExchange: () => void;
  trackTopic: (topicId: string) => void;
  trackSprout: () => void;
  refresh: () => void;
}

export function useSessionTelemetry(): UseSessionTelemetryResult {
  const [telemetry, setTelemetry] = useState<SessionTelemetry>(
    telemetryCollector.get()
  );
  
  useEffect(() => {
    const unsubscribe = telemetryCollector.subscribe(setTelemetry);
    return unsubscribe;
  }, []);
  
  const trackExchange = useCallback(() => {
    telemetryCollector.update({ type: 'exchange' });
  }, []);
  
  const trackTopic = useCallback((topicId: string) => {
    telemetryCollector.update({ type: 'topic', payload: { topicId } });
  }, []);
  
  const trackSprout = useCallback(() => {
    telemetryCollector.update({ type: 'sprout' });
  }, []);
  
  const refresh = useCallback(() => {
    setTelemetry(telemetryCollector.get());
  }, []);
  
  return {
    telemetry,
    stage: telemetry.stage,
    trackExchange,
    trackTopic,
    trackSprout,
    refresh,
  };
}
```

**Build gate:** `npm run build`

---

## Phase 2: Adaptive Prompts (4 hours)

### 2.1 Create Prompt Schema

**Create `src/core/schema/suggested-prompts.ts`:**

```typescript
// src/core/schema/suggested-prompts.ts
// Suggested prompt types for adaptive engagement
// Sprint: adaptive-engagement-v1

import type { SessionStage } from './session-telemetry';

/**
 * PromptIntent - What the prompt is trying to accomplish
 */
export type PromptIntent = 
  | 'orientation'      // Explain what Grove is
  | 'motivation'       // Why should user care
  | 'demonstration'    // Show how it works
  | 'discovery'        // What can I explore
  | 'depth'            // Go deeper on topic
  | 'personalization'  // Tailor to my lens
  | 'synthesis'        // Connect topics
  | 'contribution'     // Capture/share
  | 'reflection'       // Review my insights
  | 'serendipity';     // Surprise me

/**
 * SuggestedPrompt - A clickable prompt with metadata
 */
export interface SuggestedPrompt {
  id: string;
  text: string;
  intent: PromptIntent;
  
  // Routing
  leadsTo?: string;    // Hub ID or route
  command?: string;    // Terminal command (e.g., "/sprout")
  
  // Dynamic
  dynamic?: boolean;
  variables?: string[];
  
  // Filtering
  lensAffinity?: string[];
  lensExclude?: string[];
  weight?: number;     // Higher = more likely
}

/**
 * StagePromptConfig - Prompts for a specific stage
 */
export interface StagePromptConfig {
  stage: SessionStage;
  prompts: SuggestedPrompt[];
  maxDisplay?: number;
  refreshStrategy?: 'static' | 'engagement' | 'random';
}

/**
 * StagePromptsConfig - Full configuration
 */
export interface StagePromptsConfig {
  defaults: {
    maxDisplay: number;
    refreshStrategy: string;
  };
  stages: Record<SessionStage, StagePromptConfig>;
}
```

---

### 2.2 Create Stage Prompts Data

**Create `src/data/prompts/stage-prompts.ts`:**

```typescript
// src/data/prompts/stage-prompts.ts
// Stage-based suggested prompts configuration
// Sprint: adaptive-engagement-v1

import type { StagePromptsConfig } from '@/core/schema/suggested-prompts';

export const stagePromptsConfig: StagePromptsConfig = {
  defaults: {
    maxDisplay: 3,
    refreshStrategy: 'engagement',
  },
  stages: {
    ARRIVAL: {
      stage: 'ARRIVAL',
      prompts: [
        {
          id: 'what-is-grove',
          text: 'What is The Grove?',
          intent: 'orientation',
          leadsTo: 'grove-overview',
          weight: 1.5,
        },
        {
          id: 'why-distributed',
          text: 'Why does distributed AI matter?',
          intent: 'motivation',
          leadsTo: 'distributed-ai-thesis',
        },
        {
          id: 'show-me',
          text: 'Show me how this works',
          intent: 'demonstration',
          leadsTo: 'interactive-demo',
          lensExclude: ['academic-researcher'],
        },
        {
          id: 'research-basis',
          text: "What's the research basis for distributed AI?",
          intent: 'motivation',
          leadsTo: 'academic-foundation',
          lensAffinity: ['academic-researcher'],
          weight: 1.5,
        },
      ],
    },
    ORIENTED: {
      stage: 'ORIENTED',
      prompts: [
        {
          id: 'explore-topics',
          text: 'What topics can I explore?',
          intent: 'discovery',
          leadsTo: 'hub-overview',
        },
        {
          id: 'deeper-last-topic',
          text: 'Take me deeper on {lastTopic}',
          intent: 'depth',
          dynamic: true,
          variables: ['lastTopic'],
        },
        {
          id: 'relevant-to-lens',
          text: "What's most relevant for a {lensName}?",
          intent: 'personalization',
          dynamic: true,
          variables: ['lensName'],
        },
        {
          id: 'key-concepts',
          text: 'What are the key concepts I should understand?',
          intent: 'discovery',
          leadsTo: 'core-concepts',
        },
      ],
    },
    EXPLORING: {
      stage: 'EXPLORING',
      prompts: [
        {
          id: 'connections',
          text: 'How does {topicA} connect to {topicB}?',
          intent: 'synthesis',
          dynamic: true,
          variables: ['topicA', 'topicB'],
        },
        {
          id: 'capture-insight',
          text: 'I want to save an insight',
          intent: 'contribution',
          command: '/sprout',
        },
        {
          id: 'surprise-me',
          text: 'Show me something unexpected',
          intent: 'serendipity',
        },
        {
          id: 'implications',
          text: 'What are the implications of this approach?',
          intent: 'depth',
        },
      ],
    },
    ENGAGED: {
      stage: 'ENGAGED',
      prompts: [
        {
          id: 'my-garden',
          text: 'Review my captured insights',
          intent: 'reflection',
          command: '/garden',
        },
        {
          id: 'underexplored',
          text: 'I want to explore {underexploredArea}',
          intent: 'depth',
          dynamic: true,
          variables: ['underexploredArea'],
        },
        {
          id: 'contribute',
          text: 'How can I contribute to Grove?',
          intent: 'contribution',
          leadsTo: 'contribution-guide',
        },
        {
          id: 'share-discovery',
          text: 'I found something interesting to share',
          intent: 'contribution',
        },
      ],
    },
  },
};
```

---

### 2.3 Create Suggested Prompts Hook

**Create `hooks/useSuggestedPrompts.ts`:**

```typescript
// hooks/useSuggestedPrompts.ts
// Computes stage-aware, lens-filtered prompts
// Sprint: adaptive-engagement-v1

import { useMemo, useCallback, useState } from 'react';
import { useSessionTelemetry } from './useSessionTelemetry';
import { stagePromptsConfig } from '../src/data/prompts/stage-prompts';
import type { SuggestedPrompt } from '../src/core/schema/suggested-prompts';
import type { SessionStage } from '../src/core/schema/session-telemetry';

interface UseSuggestedPromptsOptions {
  lensId?: string | null;
  lensName?: string;
  maxPrompts?: number;
}

interface UseSuggestedPromptsResult {
  prompts: SuggestedPrompt[];
  stage: SessionStage;
  refreshPrompts: () => void;
}

// Known topic areas for fallbacks
const TOPIC_AREAS = ['agents', 'economics', 'simulation', 'infrastructure', 'governance'];

export function useSuggestedPrompts(
  options: UseSuggestedPromptsOptions = {}
): UseSuggestedPromptsResult {
  const { lensId, lensName, maxPrompts = 3 } = options;
  const { telemetry } = useSessionTelemetry();
  const [refreshKey, setRefreshKey] = useState(0);
  
  const prompts = useMemo(() => {
    const stageConfig = stagePromptsConfig.stages[telemetry.stage];
    if (!stageConfig) return [];
    
    // Filter by lens
    let filtered = stageConfig.prompts.filter(prompt => {
      // Exclude if lens is in exclude list
      if (lensId && prompt.lensExclude?.includes(lensId)) return false;
      // If has affinity and lens selected, only show if lens matches
      if (prompt.lensAffinity && prompt.lensAffinity.length > 0) {
        if (!lensId) return false;
        return prompt.lensAffinity.includes(lensId);
      }
      return true;
    });
    
    // Sort by weight (higher first)
    filtered = [...filtered].sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1));
    
    // Substitute dynamic variables
    filtered = filtered.map(prompt => {
      if (!prompt.dynamic) return prompt;
      
      let text = prompt.text;
      
      // Build variables
      const lastTopic = telemetry.topicsExplored.slice(-1)[0] ?? 'distributed AI';
      const explored = new Set(telemetry.allTopicsExplored);
      const underexplored = TOPIC_AREAS.find(a => !explored.has(a)) ?? 'edge cases';
      
      const vars: Record<string, string> = {
        lastTopic,
        lensName: lensName ?? 'curious explorer',
        topicA: telemetry.topicsExplored[0] ?? 'agents',
        topicB: telemetry.topicsExplored[1] ?? 'economics',
        underexploredArea: underexplored,
      };
      
      for (const [key, value] of Object.entries(vars)) {
        text = text.replace(`{${key}}`, value);
      }
      
      return { ...prompt, text };
    });
    
    return filtered.slice(0, maxPrompts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telemetry.stage, telemetry.topicsExplored, lensId, lensName, maxPrompts, refreshKey]);
  
  const refreshPrompts = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);
  
  return {
    prompts,
    stage: telemetry.stage,
    refreshPrompts,
  };
}
```

**Build gate:** `npm run build`

---

### 2.4 Update TerminalWelcome

**Modify `components/Terminal/TerminalWelcome.tsx`:**

```typescript
// components/Terminal/TerminalWelcome.tsx
// Declarative welcome card with adaptive prompts
// Sprint: terminal-quantum-welcome-v1
// Sprint: adaptive-engagement-v1 - Added stage-aware prompts

import React from 'react';
import { TerminalWelcome as TerminalWelcomeType } from '../../src/core/schema/narrative';
import { useSuggestedPrompts } from '../../hooks/useSuggestedPrompts';
import type { SuggestedPrompt } from '../../src/core/schema/suggested-prompts';

interface TerminalWelcomeProps {
  welcome: TerminalWelcomeType;
  onPromptClick: (prompt: string, command?: string) => void;
  lensId?: string | null;
  lensName?: string;
  variant?: 'overlay' | 'embedded';
}

// Stage indicator labels
const STAGE_LABELS: Record<string, { emoji: string; label: string }> = {
  ARRIVAL: { emoji: '👋', label: 'Welcome' },
  ORIENTED: { emoji: '🧭', label: 'Exploring' },
  EXPLORING: { emoji: '🔍', label: 'Discovering' },
  ENGAGED: { emoji: '🌱', label: 'Growing' },
};

const TerminalWelcome: React.FC<TerminalWelcomeProps> = ({
  welcome,
  onPromptClick,
  lensId,
  lensName,
  variant = 'overlay'
}) => {
  const { prompts: adaptivePrompts, stage } = useSuggestedPrompts({
    lensId,
    lensName,
  });
  
  // Use adaptive prompts if available, fallback to static
  const displayPrompts: Array<{ id: string; text: string; command?: string }> = 
    adaptivePrompts.length > 0
      ? adaptivePrompts.map(p => ({ id: p.id, text: p.text, command: p.command }))
      : welcome.prompts.map((text, i) => ({ id: `static-${i}`, text }));
  
  const stageInfo = STAGE_LABELS[stage] ?? STAGE_LABELS.ARRIVAL;
  
  const handlePromptClick = (prompt: { text: string; command?: string }) => {
    onPromptClick(prompt.text, prompt.command);
  };
  
  return (
    <div className="glass-welcome-card">
      {/* Stage indicator */}
      <div className="text-xs text-[var(--glass-text-subtle)] mb-2 flex items-center gap-1">
        <span>{stageInfo.emoji}</span>
        <span>{stageInfo.label}</span>
      </div>
      
      <h2 className="text-xl font-medium text-[var(--glass-text-primary)] mb-3">
        {welcome.heading}
      </h2>
      <p className="text-[var(--glass-text-body)] mb-6 leading-relaxed">
        {welcome.thesis}
      </p>

      <div className="space-y-2 mb-4">
        {displayPrompts.map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => handlePromptClick(prompt)}
            className="glass-welcome-prompt"
          >
            <span className="text-[var(--neon-cyan)] mr-2">→</span>
            {prompt.text}
          </button>
        ))}
      </div>

      <p className="text-xs text-[var(--glass-text-subtle)]">
        {welcome.footer}
      </p>
    </div>
  );
};

export default TerminalWelcome;
```

**Build gate:** `npm run build`

---

### 2.5 Integrate Telemetry Tracking

**Find where chat exchanges are processed and add telemetry:**

Look for the chat handling code (likely in `useChat` or similar) and add:

```typescript
// After a message is sent successfully
import { telemetryCollector } from '@/lib/telemetry';

// In the send/submit handler:
telemetryCollector.update({ type: 'exchange' });

// If the response references a hub/topic:
telemetryCollector.update({ type: 'topic', payload: { topicId: hubId } });
```

**Also update sprout capture in `hooks/useSproutStorage.ts`:**

```typescript
// At the top
import { telemetryCollector } from '../src/lib/telemetry';

// In addSprout, after successful capture:
telemetryCollector.update({ type: 'sprout' });
```

**Build gate:** `npm run build`

---

## Phase 3: Journey Framework (6 hours)

### 3.1 Create Journey Schema

**Create `src/core/schema/journey.ts`:**

```typescript
// src/core/schema/journey.ts
// Journey type definitions for guided exploration
// Sprint: adaptive-engagement-v1

/**
 * JourneyWaypoint - A step in a guided journey
 */
export interface JourneyWaypoint {
  id: string;
  title: string;
  prompt: string;
  hub?: string;
  
  successCriteria?: {
    minExchanges?: number;
    topicsMentioned?: string[];
  };
  
  // Patterns that trigger implicit entry at this waypoint
  entryPatterns?: string[];
}

/**
 * Journey - A structured exploration path
 */
export interface Journey {
  id: string;
  title: string;
  description: string;
  estimatedTime?: string;
  
  lensAffinity?: string[];
  lensExclude?: string[];
  
  waypoints: JourneyWaypoint[];
  
  completionMessage: string;
  nextJourneys?: string[];
  
  allowImplicitEntry?: boolean;
  ambientTracking?: boolean;
}
```

---

### 3.2 Create Grove Fundamentals Journey

**Create `src/data/journeys/grove-fundamentals.ts`:**

```typescript
// src/data/journeys/grove-fundamentals.ts
// Introduction journey for new users
// Sprint: adaptive-engagement-v1

import type { Journey } from '@/core/schema/journey';

export const groveFundamentalsJourney: Journey = {
  id: 'grove-fundamentals',
  title: 'Understanding The Grove',
  description: 'A guided introduction to distributed AI infrastructure',
  estimatedTime: '15 minutes',
  lensAffinity: ['curious-citizen', 'tech-explorer', 'freestyle'],
  allowImplicitEntry: true,
  ambientTracking: true,
  
  waypoints: [
    {
      id: 'why',
      title: 'The Why',
      prompt: 'Why are we building The Grove?',
      hub: 'grove-thesis',
      successCriteria: {
        minExchanges: 2,
      },
      entryPatterns: [
        'why.*grove',
        'why.*building',
        'what.*problem.*solving',
        'purpose.*distributed',
      ],
    },
    {
      id: 'how',
      title: 'The How',
      prompt: 'How does distributed AI actually work?',
      hub: 'technical-architecture',
      successCriteria: {
        minExchanges: 2,
      },
      entryPatterns: [
        'how.*work',
        'technical.*architecture',
        'distributed.*ai.*work',
        'explain.*system',
      ],
    },
    {
      id: 'what',
      title: 'The What',
      prompt: 'What can I do with Grove today?',
      hub: 'current-capabilities',
      successCriteria: {
        minExchanges: 1,
      },
      entryPatterns: [
        'what.*can.*do',
        'capabilities',
        'features',
        'use.*grove',
      ],
    },
    {
      id: 'you',
      title: 'Your Turn',
      prompt: 'What aspect interests you most?',
      successCriteria: {
        minExchanges: 1,
      },
    },
  ],
  
  completionMessage: "You've completed the fundamentals! Ready to explore on your own, or continue with a deeper dive?",
  nextJourneys: ['deep-dive-agents', 'grove-economics'],
};
```

---

### 3.3 Create Journey Index

**Create `src/data/journeys/index.ts`:**

```typescript
// src/data/journeys/index.ts
// Journey registry
// Sprint: adaptive-engagement-v1

import type { Journey } from '@/core/schema/journey';
import { groveFundamentalsJourney } from './grove-fundamentals';

export const journeys: Journey[] = [
  groveFundamentalsJourney,
  // Add more journeys here
];

export function getJourneyById(id: string): Journey | undefined {
  return journeys.find(j => j.id === id);
}

export function getJourneysForLens(lensId: string | null): Journey[] {
  return journeys.filter(j => {
    if (j.lensExclude?.includes(lensId ?? '')) return false;
    if (j.lensAffinity && j.lensAffinity.length > 0) {
      if (!lensId) return true; // Show to users without lens
      return j.lensAffinity.includes(lensId);
    }
    return true;
  });
}
```

---

### 3.4 Create Journey Progress Hook

**Create `hooks/useJourneyProgress.ts`:**

```typescript
// hooks/useJourneyProgress.ts
// Journey progress tracking with implicit entry
// Sprint: adaptive-engagement-v1

import { useState, useCallback, useEffect, useMemo } from 'react';
import { telemetryCollector } from '../src/lib/telemetry';
import { useSessionTelemetry } from './useSessionTelemetry';
import { journeys, getJourneyById } from '../src/data/journeys';
import type { Journey, JourneyWaypoint } from '../src/core/schema/journey';

interface UseJourneyProgressResult {
  activeJourney: Journey | null;
  currentWaypoint: JourneyWaypoint | null;
  waypointIndex: number;
  progress: number;
  isComplete: boolean;
  
  startJourney: (journeyId: string, explicit?: boolean) => void;
  completeWaypoint: () => void;
  completeJourney: () => void;
  checkImplicitEntry: (query: string) => { journey: Journey; waypointIndex: number } | null;
  dismissJourney: () => void;
}

export function useJourneyProgress(): UseJourneyProgressResult {
  const { telemetry } = useSessionTelemetry();
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  
  // Sync with telemetry
  useEffect(() => {
    if (telemetry.activeJourney) {
      const journey = getJourneyById(telemetry.activeJourney.journeyId);
      setActiveJourney(journey ?? null);
    } else {
      setActiveJourney(null);
    }
  }, [telemetry.activeJourney?.journeyId]);
  
  const waypointIndex = telemetry.activeJourney?.currentWaypoint ?? 0;
  
  const currentWaypoint = useMemo(() => {
    if (!activeJourney) return null;
    return activeJourney.waypoints[waypointIndex] ?? null;
  }, [activeJourney, waypointIndex]);
  
  const progress = activeJourney 
    ? waypointIndex / activeJourney.waypoints.length
    : 0;
  
  const isComplete = activeJourney 
    ? waypointIndex >= activeJourney.waypoints.length
    : false;
  
  const startJourney = useCallback((journeyId: string, explicit = true) => {
    telemetryCollector.update({
      type: 'journey_start',
      payload: { journeyId, explicit },
    });
  }, []);
  
  const completeWaypoint = useCallback(() => {
    if (!telemetry.activeJourney) return;
    
    const nextWaypoint = waypointIndex + 1;
    telemetryCollector.update({
      type: 'journey_progress',
      payload: { waypoint: nextWaypoint },
    });
  }, [telemetry.activeJourney, waypointIndex]);
  
  const completeJourney = useCallback(() => {
    telemetryCollector.update({ type: 'journey_complete' });
  }, []);
  
  const dismissJourney = useCallback(() => {
    telemetryCollector.update({ type: 'journey_complete' });
  }, []);
  
  const checkImplicitEntry = useCallback((query: string): { journey: Journey; waypointIndex: number } | null => {
    // Don't check if already in a journey
    if (telemetry.activeJourney) return null;
    
    const normalizedQuery = query.toLowerCase();
    
    for (const journey of journeys) {
      // Skip if not allowing implicit entry
      if (!journey.allowImplicitEntry) continue;
      // Skip if already completed
      if (telemetry.completedJourneys.includes(journey.id)) continue;
      
      for (let i = 0; i < journey.waypoints.length; i++) {
        const waypoint = journey.waypoints[i];
        if (!waypoint.entryPatterns) continue;
        
        for (const pattern of waypoint.entryPatterns) {
          try {
            if (new RegExp(pattern, 'i').test(normalizedQuery)) {
              return { journey, waypointIndex: i };
            }
          } catch {
            // Invalid regex, skip
          }
        }
      }
    }
    
    return null;
  }, [telemetry.activeJourney, telemetry.completedJourneys]);
  
  return {
    activeJourney,
    currentWaypoint,
    waypointIndex,
    progress,
    isComplete,
    startJourney,
    completeWaypoint,
    completeJourney,
    checkImplicitEntry,
    dismissJourney,
  };
}
```

**Build gate:** `npm run build`

---

### 3.5 Create Journey Progress Indicator

**Create `components/Terminal/JourneyProgressIndicator.tsx`:**

```typescript
// components/Terminal/JourneyProgressIndicator.tsx
// Subtle journey progress display
// Sprint: adaptive-engagement-v1

import React from 'react';
import type { Journey } from '../../src/core/schema/journey';

interface JourneyProgressIndicatorProps {
  journey: Journey;
  currentWaypointIndex: number;
  onWaypointClick?: (index: number) => void;
}

export const JourneyProgressIndicator: React.FC<JourneyProgressIndicatorProps> = ({
  journey,
  currentWaypointIndex,
  onWaypointClick,
}) => {
  const progress = ((currentWaypointIndex) / journey.waypoints.length) * 100;
  
  return (
    <div className="journey-progress-indicator">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[var(--glass-text-subtle)]">
          {journey.title}
        </span>
        <span className="text-xs text-[var(--glass-text-subtle)]">
          {currentWaypointIndex}/{journey.waypoints.length}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="h-1 bg-[var(--glass-bg-secondary)] rounded-full overflow-hidden mb-2">
        <div 
          className="h-full bg-[var(--neon-cyan)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Waypoint dots */}
      <div className="flex items-center gap-2">
        {journey.waypoints.map((waypoint, index) => (
          <button
            key={waypoint.id}
            onClick={() => onWaypointClick?.(index)}
            className={`
              w-2 h-2 rounded-full transition-all
              ${index < currentWaypointIndex 
                ? 'bg-[var(--neon-cyan)]' 
                : index === currentWaypointIndex
                  ? 'bg-[var(--neon-cyan)] ring-2 ring-[var(--neon-cyan)] ring-opacity-50'
                  : 'bg-[var(--glass-bg-secondary)]'
              }
            `}
            title={waypoint.title}
          />
        ))}
      </div>
      
      {/* Current waypoint label */}
      {currentWaypointIndex < journey.waypoints.length && (
        <div className="mt-2 text-xs text-[var(--glass-text-body)]">
          <span className="text-[var(--neon-cyan)]">→</span>{' '}
          {journey.waypoints[currentWaypointIndex].title}
        </div>
      )}
    </div>
  );
};
```

---

### 3.6 Create Journey Completion Card

**Create `components/Terminal/JourneyCompletionCard.tsx`:**

```typescript
// components/Terminal/JourneyCompletionCard.tsx
// Celebration when journey completes
// Sprint: adaptive-engagement-v1

import React from 'react';
import type { Journey } from '../../src/core/schema/journey';
import { getJourneyById } from '../../src/data/journeys';

interface JourneyCompletionCardProps {
  journey: Journey;
  onDismiss: () => void;
  onStartNext?: (journeyId: string) => void;
}

export const JourneyCompletionCard: React.FC<JourneyCompletionCardProps> = ({
  journey,
  onDismiss,
  onStartNext,
}) => {
  const nextJourneys = journey.nextJourneys
    ?.map(id => getJourneyById(id))
    .filter(Boolean) as Journey[] | undefined;
  
  return (
    <div className="glass-welcome-card">
      <div className="text-center mb-4">
        <span className="text-4xl">🎉</span>
      </div>
      
      <h3 className="text-lg font-medium text-[var(--glass-text-primary)] text-center mb-2">
        Journey Complete!
      </h3>
      
      <p className="text-[var(--glass-text-body)] text-center mb-4">
        {journey.completionMessage}
      </p>
      
      {nextJourneys && nextJourneys.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-xs text-[var(--glass-text-subtle)] text-center">
            Continue your exploration:
          </p>
          {nextJourneys.map(next => (
            <button
              key={next.id}
              onClick={() => onStartNext?.(next.id)}
              className="glass-welcome-prompt w-full"
            >
              <span className="text-[var(--neon-cyan)] mr-2">→</span>
              {next.title}
            </button>
          ))}
        </div>
      )}
      
      <button
        onClick={onDismiss}
        className="w-full text-center text-xs text-[var(--glass-text-subtle)] hover:text-[var(--glass-text-body)]"
      >
        Explore freely
      </button>
    </div>
  );
};
```

**Build gate:** `npm run build`

---

## Phase 4: Server Persistence (3 hours)

### 4.1 Create Database Tables

**Run in Supabase SQL Editor:**

```sql
-- Session telemetry persistence
-- Sprint: adaptive-engagement-v1

-- Session telemetry table
CREATE TABLE IF NOT EXISTS session_telemetry (
  session_id TEXT PRIMARY KEY,
  visit_count INTEGER DEFAULT 1,
  first_visit TIMESTAMPTZ DEFAULT NOW(),
  last_visit TIMESTAMPTZ DEFAULT NOW(),
  total_exchange_count INTEGER DEFAULT 0,
  all_topics_explored TEXT[] DEFAULT '{}',
  sprouts_captured INTEGER DEFAULT 0,
  completed_journeys TEXT[] DEFAULT '{}',
  current_stage TEXT DEFAULT 'ARRIVAL',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journey progress tracking
CREATE TABLE IF NOT EXISTS journey_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  journey_id TEXT NOT NULL,
  current_waypoint INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  explicit_start BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, journey_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_telemetry_last_visit 
  ON session_telemetry(last_visit DESC);
CREATE INDEX IF NOT EXISTS idx_journey_progress_session 
  ON journey_progress(session_id);

-- RLS
ALTER TABLE session_telemetry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_telemetry" ON session_telemetry 
  FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE journey_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_journey" ON journey_progress 
  FOR ALL TO anon USING (true) WITH CHECK (true);
```

---

### 4.2 Create Server Sync Module

**Create `src/lib/telemetry/storage.ts`:**

```typescript
// src/lib/telemetry/storage.ts
// Server persistence for telemetry
// Sprint: adaptive-engagement-v1

import { supabaseAdmin } from '@/lib/supabase/server';
import type { SessionTelemetry, SessionStage } from '@/core/schema/session-telemetry';

const STORAGE_MODE = process.env.NEXT_PUBLIC_SPROUT_STORAGE || 'local';

export async function syncTelemetryToServer(
  telemetry: SessionTelemetry
): Promise<boolean> {
  if (STORAGE_MODE !== 'server') return false;
  
  try {
    const { error } = await supabaseAdmin
      .from('session_telemetry')
      .upsert({
        session_id: telemetry.sessionId,
        visit_count: telemetry.visitCount,
        total_exchange_count: telemetry.totalExchangeCount,
        all_topics_explored: telemetry.allTopicsExplored,
        sprouts_captured: telemetry.sproutsCaptured,
        completed_journeys: telemetry.completedJourneys,
        current_stage: telemetry.stage,
        last_visit: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'session_id',
      });
    
    if (error) {
      console.warn('Telemetry sync failed:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.warn('Telemetry sync error:', err);
    return false;
  }
}

export async function loadTelemetryFromServer(
  sessionId: string
): Promise<Partial<SessionTelemetry> | null> {
  if (STORAGE_MODE !== 'server') return null;
  
  try {
    const { data, error } = await supabaseAdmin
      .from('session_telemetry')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    if (error || !data) return null;
    
    return {
      visitCount: data.visit_count,
      totalExchangeCount: data.total_exchange_count,
      allTopicsExplored: data.all_topics_explored,
      sproutsCaptured: data.sprouts_captured,
      completedJourneys: data.completed_journeys,
      stage: data.current_stage as SessionStage,
    };
  } catch {
    return null;
  }
}
```

**Build gate:** `npm run build`

---

## Phase 5: Lens Integration (2 hours)

### 5.1 Wire Lens Context to Prompts

**Update Terminal component to pass lens info to TerminalWelcome:**

Find where `<TerminalWelcome>` is rendered and ensure it receives:
- `lensId={currentLensId}`
- `lensName={reality?.hero?.headline ?? undefined}`

---

### 5.2 Test Lens Switching

Verify that when lens changes:
1. Prompts update immediately
2. Stage remains the same
3. Variable substitutions use new lens name

**Build gate:** `npm run build`

---

## Final Verification

### Full Test Suite

```bash
npm run build
npm test
npx playwright test
```

### Manual Testing Checklist

- [ ] Clear localStorage, visit terminal → ARRIVAL prompts
- [ ] Send 3 messages → stage advances to ORIENTED
- [ ] Return visit → starts at ORIENTED
- [ ] Capture sprout → advances to ENGAGED
- [ ] Switch lens → prompts update immediately
- [ ] Ask "Why are we building Grove?" → journey entry
- [ ] Complete waypoints → progress tracks
- [ ] Complete journey → celebration shows

---

## Smoke Test

```javascript
// In browser console
localStorage.clear();
location.reload();
// Should see "What is The Grove?" prompt

// Send 3 messages, then check:
JSON.parse(localStorage.getItem('grove-telemetry')).stage
// Should be "ORIENTED"
```

---

## Forbidden Actions

- Do NOT hardcode lens-specific behavior in components
- Do NOT skip telemetry for exchange tracking
- Do NOT modify existing Terminal functionality without fallbacks
- Do NOT commit without build verification

---

## Success Criteria

- [ ] New user sees ARRIVAL stage prompts
- [ ] Stage advances based on engagement
- [ ] Returning user maintains progress
- [ ] Lens filtering works correctly
- [ ] Journey implicit entry works
- [ ] All tests pass
- [ ] No console errors
