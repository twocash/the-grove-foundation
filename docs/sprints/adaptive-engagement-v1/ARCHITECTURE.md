# Adaptive Engagement System — ARCHITECTURE v1.0

**Sprint:** `adaptive-engagement-v1`
**Date:** 2025-12-26

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ADAPTIVE ENGAGEMENT SYSTEM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │   User Action   │────▶│   Telemetry     │────▶│  Stage Compute  │       │
│  │ (exchange, nav) │     │   Collector     │     │                 │       │
│  └─────────────────┘     └─────────────────┘     └────────┬────────┘       │
│                                                           │                 │
│                                                           ▼                 │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │   Terminal      │◀────│   Suggested     │◀────│  Stage + Lens   │       │
│  │   Welcome       │     │   Prompts Hook  │     │  Filter         │       │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│                                                           ▲                 │
│                                                           │                 │
│  ┌─────────────────┐     ┌─────────────────┐     ┌───────┴─────────┐       │
│  │  Journey        │────▶│   Journey       │────▶│  Prompt Config  │       │
│  │  Progress       │     │   Waypoints     │     │  (YAML)         │       │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                           PERSISTENCE LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────┐     ┌──────────────────────────────┐      │
│  │       localStorage           │     │         Supabase             │      │
│  │  (session telemetry cache)   │◀───▶│  (cross-device persistence)  │      │
│  └──────────────────────────────┘     └──────────────────────────────┘      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
src/
├── core/
│   └── schema/
│       ├── session-telemetry.ts    # NEW: Telemetry types
│       ├── suggested-prompts.ts    # NEW: Prompt types
│       └── journey.ts              # NEW: Journey types
│
├── lib/
│   └── telemetry/
│       ├── index.ts                # NEW: Exports
│       ├── collector.ts            # NEW: Event collection
│       ├── stage-computation.ts    # NEW: Stage algorithm
│       └── storage.ts              # NEW: Persistence layer
│
├── hooks/
│   ├── useSessionTelemetry.ts      # NEW: Main telemetry hook
│   ├── useSuggestedPrompts.ts      # NEW: Prompt computation
│   └── useJourneyProgress.ts       # NEW: Journey tracking
│
└── data/
    ├── prompts/
    │   └── stage-prompts.yaml      # NEW: Stage prompt config
    └── journeys/
        └── grove-fundamentals.yaml # NEW: Journey definitions

components/Terminal/
├── TerminalWelcome.tsx             # MODIFY: Use adaptive prompts
├── JourneyProgressIndicator.tsx    # NEW: Journey progress UI
└── JourneyCompletionCard.tsx       # NEW: Completion celebration

content/
├── prompts/
│   └── stage-prompts.yaml          # NEW: Canonical prompt config
└── journeys/
    ├── grove-fundamentals.yaml     # NEW: Intro journey
    └── index.ts                    # NEW: Journey loader
```

---

## Core Components

### 1. Session Telemetry Collector

```typescript
// src/lib/telemetry/collector.ts

import { SessionTelemetry, SessionStage } from '@/core/schema/session-telemetry';
import { getSessionId } from '@/lib/session';
import { computeSessionStage } from './stage-computation';

const STORAGE_KEY = 'grove-telemetry';

interface TelemetryUpdate {
  type: 'exchange' | 'topic' | 'sprout' | 'journey_start' | 'journey_progress';
  payload: Record<string, unknown>;
}

export class TelemetryCollector {
  private telemetry: SessionTelemetry;
  private listeners: Set<(t: SessionTelemetry) => void> = new Set();
  
  constructor() {
    this.telemetry = this.loadOrCreate();
  }
  
  private loadOrCreate(): SessionTelemetry {
    const stored = localStorage.getItem(STORAGE_KEY);
    const sessionId = getSessionId();
    
    if (stored) {
      const parsed = JSON.parse(stored);
      // Check if this is a new session
      const isNewSession = parsed.sessionId !== sessionId;
      
      if (isNewSession) {
        // Returning user - increment visit count, preserve totals
        return {
          ...parsed,
          sessionId,
          visitCount: parsed.visitCount + 1,
          currentVisitStart: new Date().toISOString(),
          lastVisit: parsed.currentVisitStart,
          exchangeCount: 0,  // Reset session counter
          topicsExplored: [], // Reset session topics
          stage: computeSessionStage({
            ...parsed,
            visitCount: parsed.visitCount + 1,
          }),
        };
      }
      return parsed;
    }
    
    // New user
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
  
  update(update: TelemetryUpdate): SessionTelemetry {
    switch (update.type) {
      case 'exchange':
        this.telemetry.exchangeCount++;
        this.telemetry.totalExchangeCount++;
        break;
        
      case 'topic':
        const topicId = update.payload.topicId as string;
        if (!this.telemetry.topicsExplored.includes(topicId)) {
          this.telemetry.topicsExplored.push(topicId);
        }
        if (!this.telemetry.allTopicsExplored.includes(topicId)) {
          this.telemetry.allTopicsExplored.push(topicId);
        }
        break;
        
      case 'sprout':
        this.telemetry.sproutsCaptured++;
        break;
        
      case 'journey_start':
        this.telemetry.activeJourney = {
          journeyId: update.payload.journeyId as string,
          currentWaypoint: 0,
          startedAt: new Date().toISOString(),
          explicit: update.payload.explicit as boolean,
        };
        break;
        
      case 'journey_progress':
        if (this.telemetry.activeJourney) {
          this.telemetry.activeJourney.currentWaypoint = 
            update.payload.waypoint as number;
        }
        break;
    }
    
    // Recompute stage
    this.telemetry.stage = computeSessionStage(this.telemetry);
    
    // Persist
    this.save();
    
    // Notify listeners
    this.listeners.forEach(fn => fn(this.telemetry));
    
    return this.get();
  }
  
  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.telemetry));
  }
  
  subscribe(fn: (t: SessionTelemetry) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

// Singleton instance
export const telemetryCollector = new TelemetryCollector();
```

### 2. Stage Computation

```typescript
// src/lib/telemetry/stage-computation.ts

import { SessionTelemetry, SessionStage, StageThresholds } from '@/core/schema/session-telemetry';

const DEFAULT_THRESHOLDS: StageThresholds = {
  oriented: {
    minExchanges: 3,
    minVisits: 2,
  },
  exploring: {
    minExchanges: 5,
    minTopics: 2,
  },
  engaged: {
    minSprouts: 1,
    minVisits: 3,
    minTotalExchanges: 15,
  },
};

export function computeSessionStage(
  telemetry: SessionTelemetry,
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

### 3. Suggested Prompts Hook

```typescript
// hooks/useSuggestedPrompts.ts

import { useMemo, useCallback } from 'react';
import { useSessionTelemetry } from './useSessionTelemetry';
import { SuggestedPrompt, StagePromptConfig } from '@/core/schema/suggested-prompts';
import { SessionStage } from '@/core/schema/session-telemetry';
import stagePromptsConfig from '@/data/prompts/stage-prompts.yaml';

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

export function useSuggestedPrompts(
  options: UseSuggestedPromptsOptions = {}
): UseSuggestedPromptsResult {
  const { lensId, lensName, maxPrompts = 3 } = options;
  const { telemetry, refresh } = useSessionTelemetry();
  
  const prompts = useMemo(() => {
    const stageConfig = stagePromptsConfig.stages[telemetry.stage] as StagePromptConfig;
    if (!stageConfig) return [];
    
    // Filter by lens
    let filtered = stageConfig.prompts.filter(prompt => {
      // Exclude if lens is in exclude list
      if (prompt.lensExclude?.includes(lensId ?? '')) return false;
      // If has affinity, only show if lens matches
      if (prompt.lensAffinity && lensId) {
        return prompt.lensAffinity.includes(lensId);
      }
      return true;
    });
    
    // Sort by weight (higher first)
    filtered.sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1));
    
    // Substitute dynamic variables
    filtered = filtered.map(prompt => {
      if (!prompt.dynamic) return prompt;
      
      let text = prompt.text;
      
      // Variable substitutions
      const vars: Record<string, string> = {
        lastTopic: telemetry.topicsExplored.slice(-1)[0] ?? 'distributed AI',
        lensName: lensName ?? 'curious explorer',
        topicA: telemetry.topicsExplored[0] ?? 'agents',
        topicB: telemetry.topicsExplored[1] ?? 'economics',
        underexploredArea: findUnderexploredArea(telemetry),
      };
      
      for (const [key, value] of Object.entries(vars)) {
        text = text.replace(`{${key}}`, value);
      }
      
      return { ...prompt, text };
    });
    
    return filtered.slice(0, maxPrompts);
  }, [telemetry, lensId, lensName, maxPrompts]);
  
  const refreshPrompts = useCallback(() => {
    refresh();
  }, [refresh]);
  
  return {
    prompts,
    stage: telemetry.stage,
    refreshPrompts,
  };
}

function findUnderexploredArea(telemetry: SessionTelemetry): string {
  // TODO: Compare explored topics against available hubs
  // For now, return a default
  const explored = new Set(telemetry.allTopicsExplored);
  const allAreas = ['agents', 'economics', 'simulation', 'infrastructure', 'governance'];
  const underexplored = allAreas.find(a => !explored.has(a));
  return underexplored ?? 'edge cases';
}
```

### 4. Journey Progress Hook

```typescript
// hooks/useJourneyProgress.ts

import { useState, useCallback, useEffect } from 'react';
import { Journey, JourneyWaypoint } from '@/core/schema/journey';
import { useSessionTelemetry } from './useSessionTelemetry';

interface UseJourneyProgressResult {
  activeJourney: Journey | null;
  currentWaypoint: JourneyWaypoint | null;
  progress: number; // 0-1
  isComplete: boolean;
  
  startJourney: (journeyId: string, explicit?: boolean) => void;
  completeWaypoint: () => void;
  checkImplicitEntry: (query: string) => Journey | null;
}

export function useJourneyProgress(
  journeys: Journey[]
): UseJourneyProgressResult {
  const { telemetry, update } = useSessionTelemetry();
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  
  // Load active journey from telemetry
  useEffect(() => {
    if (telemetry.activeJourney) {
      const journey = journeys.find(j => j.id === telemetry.activeJourney?.journeyId);
      setActiveJourney(journey ?? null);
    }
  }, [telemetry.activeJourney, journeys]);
  
  const currentWaypoint = activeJourney?.waypoints[
    telemetry.activeJourney?.currentWaypoint ?? 0
  ] ?? null;
  
  const progress = activeJourney 
    ? (telemetry.activeJourney?.currentWaypoint ?? 0) / activeJourney.waypoints.length
    : 0;
  
  const isComplete = activeJourney 
    ? (telemetry.activeJourney?.currentWaypoint ?? 0) >= activeJourney.waypoints.length
    : false;
  
  const startJourney = useCallback((journeyId: string, explicit = true) => {
    update({
      type: 'journey_start',
      payload: { journeyId, explicit },
    });
  }, [update]);
  
  const completeWaypoint = useCallback(() => {
    if (!telemetry.activeJourney) return;
    
    const nextWaypoint = (telemetry.activeJourney.currentWaypoint ?? 0) + 1;
    update({
      type: 'journey_progress',
      payload: { waypoint: nextWaypoint },
    });
  }, [telemetry.activeJourney, update]);
  
  const checkImplicitEntry = useCallback((query: string): Journey | null => {
    // Check if query matches any journey waypoint entry patterns
    for (const journey of journeys) {
      if (!journey.allowImplicitEntry) continue;
      if (telemetry.completedJourneys.includes(journey.id)) continue;
      
      for (let i = 0; i < journey.waypoints.length; i++) {
        const waypoint = journey.waypoints[i];
        if (!waypoint.entryPatterns) continue;
        
        for (const pattern of waypoint.entryPatterns) {
          if (new RegExp(pattern, 'i').test(query)) {
            // Found a match - start journey at this waypoint
            return journey;
          }
        }
      }
    }
    return null;
  }, [journeys, telemetry.completedJourneys]);
  
  return {
    activeJourney,
    currentWaypoint,
    progress,
    isComplete,
    startJourney,
    completeWaypoint,
    checkImplicitEntry,
  };
}
```

---

## Integration Points

### Terminal Integration

```typescript
// In components/Terminal/TerminalWelcome.tsx

import { useSuggestedPrompts } from '@/hooks/useSuggestedPrompts';
import { useQuantumInterface } from '@/surface/hooks/useQuantumInterface';

const TerminalWelcome: React.FC<TerminalWelcomeProps> = ({ onPromptClick }) => {
  const { reality, currentLensId } = useQuantumInterface();
  const { prompts, stage } = useSuggestedPrompts({
    lensId: currentLensId,
    lensName: reality?.hero?.headline,
  });
  
  // Use adaptive prompts instead of static reality.terminal.prompts
  const displayPrompts = prompts.length > 0 
    ? prompts 
    : reality?.terminal?.prompts?.map(text => ({ id: text, text, intent: 'discovery' as const })) ?? [];
  
  return (
    <div className="glass-welcome-card">
      {/* Stage indicator (subtle) */}
      <div className="text-xs text-[var(--glass-text-subtle)] mb-2">
        {stage === 'ARRIVAL' && '👋 Welcome'}
        {stage === 'ORIENTED' && '🧭 Exploring'}
        {stage === 'EXPLORING' && '🔍 Discovering'}
        {stage === 'ENGAGED' && '🌱 Growing'}
      </div>
      
      <h2 className="text-xl font-medium text-[var(--glass-text-primary)] mb-3">
        {reality?.terminal?.heading ?? 'The Terminal.'}
      </h2>
      
      <div className="space-y-2 mb-4">
        {displayPrompts.map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => onPromptClick(prompt.text)}
            className="glass-welcome-prompt"
          >
            <span className="text-[var(--neon-cyan)] mr-2">→</span>
            {prompt.text}
          </button>
        ))}
      </div>
    </div>
  );
};
```

### Chat Exchange Tracking

```typescript
// In useChat or chat handler

import { telemetryCollector } from '@/lib/telemetry';

// After each exchange
telemetryCollector.update({ type: 'exchange', payload: {} });

// When a topic/hub is referenced
telemetryCollector.update({ type: 'topic', payload: { topicId: hubId } });
```

### Sprout Capture Tracking

```typescript
// In useSproutStorage.ts (extends existing)

import { telemetryCollector } from '@/lib/telemetry';

// In addSprout function
const addSprout = useCallback(async (sproutData) => {
  // ... existing logic ...
  
  // Track sprout capture
  telemetryCollector.update({ type: 'sprout', payload: {} });
  
  return newSprout;
}, [...]);
```

---

## Server Sync (Phase 4)

```typescript
// src/lib/telemetry/storage.ts

import { supabase } from '@/lib/supabase/client';
import { SessionTelemetry } from '@/core/schema/session-telemetry';

const SYNC_INTERVAL = 30_000; // 30 seconds
const STORAGE_MODE = process.env.NEXT_PUBLIC_SPROUT_STORAGE || 'local';

export async function syncTelemetryToServer(telemetry: SessionTelemetry): Promise<void> {
  if (STORAGE_MODE !== 'server') return;
  
  try {
    const { error } = await supabase
      .from('session_telemetry')
      .upsert({
        session_id: telemetry.sessionId,
        visit_count: telemetry.visitCount,
        total_exchange_count: telemetry.totalExchangeCount,
        all_topics_explored: telemetry.allTopicsExplored,
        completed_journeys: telemetry.completedJourneys,
        current_stage: telemetry.stage,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'session_id',
      });
    
    if (error) {
      console.warn('Telemetry sync failed:', error);
    }
  } catch (err) {
    console.warn('Telemetry sync error:', err);
  }
}

export async function loadTelemetryFromServer(sessionId: string): Promise<Partial<SessionTelemetry> | null> {
  if (STORAGE_MODE !== 'server') return null;
  
  try {
    const { data, error } = await supabase
      .from('session_telemetry')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    if (error || !data) return null;
    
    return {
      visitCount: data.visit_count,
      totalExchangeCount: data.total_exchange_count,
      allTopicsExplored: data.all_topics_explored,
      completedJourneys: data.completed_journeys,
      stage: data.current_stage as SessionStage,
    };
  } catch {
    return null;
  }
}
```

---

## YAML Loading

```typescript
// src/data/prompts/loader.ts

import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

// For build-time loading
export function loadStagePrompts() {
  const filePath = path.join(process.cwd(), 'content/prompts/stage-prompts.yaml');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return yaml.load(fileContents);
}

// For client-side, pre-compile to JSON at build time
// Or use dynamic import with webpack yaml-loader
```

---

## DEX Compliance Verification

| Pillar | Implementation |
|--------|----------------|
| **Declarative Sovereignty** | Stage thresholds, prompts, and journeys are YAML config files editable without code changes |
| **Capability Agnosticism** | Telemetry is observation-based (counts, timestamps), not model-dependent |
| **Provenance** | Telemetry tracks timestamps, session IDs; journey progress records entry method |
| **Organic Scalability** | Works with defaults; improves with lens-specific config, custom journeys |

---

## Migration Path

### From Current State

1. `TerminalWelcome` currently receives static `welcome.prompts` from `LensReality.terminal`
2. New system provides dynamic prompts via `useSuggestedPrompts()`
3. Fallback: If no adaptive prompts, use static `reality.terminal.prompts`
4. No breaking changes to existing config

### Backward Compatibility

- Existing `SUPERPOSITION_MAP` and `LensReality.terminal` remain valid
- Adaptive prompts augment, don't replace
- Gradual rollout via feature flag if needed

---

## Test Architecture

### Test Categories

| Category | Location | Purpose |
|----------|----------|---------|
| Unit | `tests/unit/` | Stage computation, prompt filtering, variable substitution |
| Integration | `tests/integration/` | Hook behavior, telemetry flow, server sync |
| E2E | `tests/e2e/` | User stage progression, journey entry |

### Behavior Tests Needed

| User Action | Expected Outcome | Test File |
|-------------|------------------|-----------|
| New user visits Terminal | ARRIVAL prompts visible | `adaptive-prompts.spec.ts` |
| User sends 3 messages | Stage advances to ORIENTED | `adaptive-prompts.spec.ts` |
| User captures sprout | Stage advances to ENGAGED | `adaptive-prompts.spec.ts` |
| Returning user visits | Starts at ORIENTED (not ARRIVAL) | `adaptive-prompts.spec.ts` |
| User switches lens | Prompts update immediately | `adaptive-prompts.spec.ts` |
| User asks "Why Grove?" | Journey implicit entry triggers | `journey-implicit-entry.spec.ts` |

### Health Integration

Tests do not report to Health system in this sprint (future enhancement).

---

## Testing Strategy

### Unit Tests

```typescript
// tests/unit/stage-computation.test.ts

describe('computeSessionStage', () => {
  it('returns ARRIVAL for new user', () => {
    const telemetry = createMockTelemetry({ visitCount: 1, exchangeCount: 0 });
    expect(computeSessionStage(telemetry)).toBe('ARRIVAL');
  });
  
  it('returns ORIENTED after 3 exchanges', () => {
    const telemetry = createMockTelemetry({ exchangeCount: 3 });
    expect(computeSessionStage(telemetry)).toBe('ORIENTED');
  });
  
  it('returns ENGAGED after capturing sprout', () => {
    const telemetry = createMockTelemetry({ sproutsCaptured: 1 });
    expect(computeSessionStage(telemetry)).toBe('ENGAGED');
  });
});
```

### E2E Tests

```typescript
// tests/e2e/adaptive-prompts.spec.ts

test('new user sees ARRIVAL stage prompts', async ({ page }) => {
  // Clear localStorage
  await page.evaluate(() => localStorage.clear());
  
  await page.goto('/terminal');
  
  // Should see orientation prompts
  await expect(page.getByText('What is The Grove?')).toBeVisible();
});

test('returning user sees ORIENTED stage prompts', async ({ page }) => {
  // Set up returning user telemetry
  await page.evaluate(() => {
    localStorage.setItem('grove-telemetry', JSON.stringify({
      visitCount: 2,
      totalExchangeCount: 5,
      // ...
    }));
  });
  
  await page.goto('/terminal');
  
  // Should see discovery prompts
  await expect(page.getByText(/explore/i)).toBeVisible();
});
```

---

## Performance Considerations

1. **Telemetry writes:** Debounced, localStorage is fast
2. **Stage computation:** Pure function, memoized
3. **Prompt filtering:** Small array, negligible
4. **Server sync:** Background, non-blocking, throttled

---

## Security Considerations

1. **No PII:** Telemetry contains counts and topic IDs, not personal data
2. **Session ID:** Anonymous UUID, not linked to identity
3. **Server storage:** RLS enabled, session-scoped access
4. **Client storage:** localStorage, same-origin policy

---

## Future Enhancements

1. **A/B testing prompts:** Weight randomization for testing effectiveness
2. **ML-based stage prediction:** Train on engagement patterns
3. **Personalized journey recommendations:** Based on engagement profile
4. **Hub generation from engagement clusters:** Detect frequently-asked topics
5. **Authenticated users:** Link telemetry to accounts for cross-device sync
