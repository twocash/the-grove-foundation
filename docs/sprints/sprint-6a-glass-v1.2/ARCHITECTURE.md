# Sprint 6A + Quantum Glass v1.2
## ARCHITECTURE.md

**Date:** 2025-12-25

---

## System Context

```
┌──────────────────────────────────────────────────────────────────┐
│                       Grove Workspace                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐    ┌─────────────────────────────────────────┐  │
│  │  Navigation │    │           Content Router                │  │
│  │   Sidebar   │    │  ┌─────────────────────────────────┐   │  │
│  │   (glass)   │    │  │         Terminal Chat           │   │  │
│  │             │    │  │    (v1.2: glass styling)        │   │  │
│  │  • Terminal │    │  └─────────────────────────────────┘   │  │
│  │  • Lenses   │    │  ┌─────────────────────────────────┐   │  │
│  │  • Journeys │    │  │     Collection Views             │   │  │
│  │  • Nodes    │    │  │  (v1.1: already glass)          │   │  │
│  │  • Diary    │    │  └─────────────────────────────────┘   │  │
│  │  • Sprouts  │    │  ┌─────────────────────────────────┐   │  │
│  │             │    │  │   Diary / Sprout Views          │   │  │
│  └─────────────┘    │  │    (v1.2: glass styling)        │   │  │
│                     │  └─────────────────────────────────┘   │  │
│                     └─────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Inspector Panel                          │ │
│  │  (frame: glass ✓)  (content: v1.2 glass styling)           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                 Analytics Layer (Sprint 6A)                 │ │
│  │  funnelAnalytics.ts → localStorage → (future: backend)      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## Analytics Flow (Sprint 6A)

```
User Action          Component              Analytics Function
─────────────────────────────────────────────────────────────────
Bridge appears   →   CognitiveBridge.tsx  → trackCognitiveBridgeShown()
User accepts     →   CognitiveBridge.tsx  → trackCognitiveBridgeAccepted()
User dismisses   →   CognitiveBridge.tsx  → trackCognitiveBridgeDismissed()
                           ↓
                    funnelAnalytics.ts
                           ↓
                    eventQueue (batched)
                           ↓
                    localStorage (grove-analytics-events)
                           ↓
                    (future: POST /api/analytics)
```

### Event Data Structure

```typescript
interface AnalyticsEvent {
  event: FunnelEventType;
  timestamp: string;        // ISO 8601
  sessionId: string;        // session-{timestamp}-{random}
  properties: {
    journeyId?: string;
    entropyScore?: number;
    cluster?: string;
    exchangeCount?: number;
    timeToDecisionMs?: number;
    url: string;
    userAgent: string;
  };
}
```

---

## Glass Token Architecture (v1.2)

### Token Hierarchy

```
:root
├── Backgrounds
│   ├── --glass-void        #030712   (deepest)
│   ├── --glass-panel       rgba(17,24,39,0.6)
│   ├── --glass-solid       #111827
│   └── --glass-elevated    rgba(30,41,59,0.4)
│
├── Borders
│   ├── --glass-border      #1e293b   (default)
│   ├── --glass-border-hover #334155
│   ├── --glass-border-active rgba(16,185,129,0.5)
│   └── --glass-border-selected rgba(6,182,212,0.5)
│
├── Text (gray scale)
│   ├── --glass-text-primary   #ffffff
│   ├── --glass-text-secondary #e2e8f0
│   ├── --glass-text-body      #cbd5e1
│   ├── --glass-text-muted     #94a3b8
│   ├── --glass-text-subtle    #64748b
│   └── --glass-text-faint     #475569
│
└── Neon Accents
    ├── --neon-green        #10b981
    ├── --neon-cyan         #06b6d4
    ├── --neon-amber        #f59e0b
    └── --neon-violet       #8b5cf6
```

### Component Mapping

| Component | Background | Border | Text |
|-----------|------------|--------|------|
| Page | --glass-void | — | — |
| Nav Panel | --glass-solid | --glass-border | --glass-text-secondary |
| Card | --glass-panel | --glass-border | --glass-text-body |
| Inspector | --glass-panel | --glass-border | --glass-text-body |
| Input | --glass-solid | --glass-border | --glass-text-primary |
| Button (primary) | --neon-green | — | white |
| Button (secondary) | --glass-elevated | --glass-border | --glass-text-secondary |
| Badge | varies | varies | varies |

---

## Message Bubble Architecture (v1.2.1)

```
┌──────────────────────────────────────────────────────────────┐
│ Chat Container (.glass-chat-container)                        │
│ background: --glass-void                                      │
│                                                               │
│   ┌────────────────────────────────────────────────────────┐ │
│   │ Welcome Card (.glass-card)                              │ │
│   │ • Title: glass-text-primary                            │ │
│   │ • Body: glass-text-body                                │ │
│   │ • Suggestions: glass-btn-secondary                     │ │
│   └────────────────────────────────────────────────────────┘ │
│                                                               │
│                          ┌───────────────────────────────┐   │
│                          │ User Message                  │   │
│                          │ .glass-message-user           │   │
│                          │ bg: --glass-elevated          │   │
│                          │ align: right                  │   │
│                          └───────────────────────────────┘   │
│                                                               │
│   ┌───────────────────────────────────────┐                  │
│   │ Assistant Message                      │                  │
│   │ .glass-message-assistant               │                  │
│   │ bg: --glass-panel                      │                  │
│   │ align: left                            │                  │
│   └───────────────────────────────────────┘                  │
│                                                               │
│   ┌──────────────────────────────────────────────────────┐   │
│   │ Input (.glass-input-field)                            │   │
│   │ bg: --glass-solid, border: --glass-border             │   │
│   │ [Send] bg: --neon-green                               │   │
│   └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## Config Consolidation (Sprint 6A)

### Before (Duplication)

```
constants.ts                    src/core/engagement/config.ts
├── ENTROPY_CONFIG              ├── ENTROPY_CONFIG (different!)
│   ├── THRESHOLDS              │   ├── defaultThreshold
│   ├── LIMITS                  │   ├── minValue
│   └── SCORING                 │   ├── maxValue
                                │   └── resetValue
```

### After (Single Source)

```
constants.ts                    src/core/engagement/config.ts
├── ENTROPY_CONFIG (canonical)  ├── import { ENTROPY_CONFIG } from '../../../constants'
│   ├── THRESHOLDS              │   // Re-export only
│   ├── LIMITS                  │   export { ENTROPY_CONFIG };
│   └── SCORING
│   ├── defaultThreshold: 0.7   // Merged from engagement/config
│   ├── minValue: 0
│   ├── maxValue: 1
│   └── resetValue: 0
```

---

## File Change Summary

| File | Changes |
|------|---------|
| `styles/globals.css` | Add chat-specific glass classes |
| `components/Terminal.tsx` | Apply glass classes to chat UI |
| `components/Terminal/CommandInput.tsx` | Glass input styling |
| `src/workspace/Inspector.tsx` | Update content panel tokens |
| `src/explore/DiaryList.tsx` | Glass card pattern |
| `src/explore/DiaryInspector.tsx` | Glass content styling |
| `src/cultivate/SproutGrid.tsx` | Glass card pattern |
| `src/cultivate/SproutInspector.tsx` | Glass content styling |
| `constants.ts` | Merge entropy configs |
| `src/core/engagement/config.ts` | Remove duplicate, re-export |
