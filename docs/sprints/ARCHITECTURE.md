# ARCHITECTURE.md — Grove Main Page Voice Revision
**Generated:** 2025-12-19

---

## 1. SYSTEM CONTEXT

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      App.tsx                              │  │
│  │  (Landing Page Controller)                                │  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │  │
│  │  │ Hero        │  │ Ratchet     │  │ Carousel    │       │  │
│  │  │ Section     │  │ Section     │  │ (6 slides)  │       │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │  │
│  │         └────────────────┴────────────────┘               │  │
│  │                          │                                │  │
│  │                    PromptHooks                            │  │
│  │                          │                                │  │
│  │                 handlePromptHook()                        │  │
│  │                    │         │                            │  │
│  │         ┌──────────┘         └──────────┐                 │  │
│  │         ▼                               ▼                 │  │
│  │  ┌──────────────┐              ┌─────────────────┐       │  │
│  │  │ Terminal     │              │ funnelAnalytics │       │  │
│  │  │ (Chat UI)    │              │ (Telemetry)     │       │  │
│  │  └──────────────┘              └─────────────────┘       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. DATA FLOW

### 2.1 Content Flow (Static)

```
constants.ts                 App.tsx / Components
┌─────────────────────┐     ┌────────────────────┐
│ SECTION_CONFIG      │────▶│ Section titles     │
│ SECTION_HOOKS       │────▶│ PromptHooks        │
│ INITIAL_TERMINAL_   │────▶│ Terminal welcome   │
│   MESSAGE           │     │                    │
└─────────────────────┘     └────────────────────┘
```

### 2.2 Interaction Flow (Runtime)

```
User clicks hook
       │
       ▼
┌──────────────────┐
│ PromptHooks.tsx  │ onHookClick({ nodeId, display, query })
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│ App.tsx: handlePromptHook(data, sectionId)               │
│                                                          │
│   1. trackPromptHookClicked(sectionId, display, nodeId)  │  ◄── NEW
│   2. setTerminalState({ isOpen: true })                  │
│   3. setExternalQuery(data)                              │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────┐     ┌─────────────────────┐
│ Terminal.tsx     │     │ funnelAnalytics.ts  │
│ (receives query) │     │ (logs event)        │
└──────────────────┘     └─────────────────────┘
```

---

## 3. FILE DEPENDENCY GRAPH

```
                   constants.ts
                   (SECTION_HOOKS)
                        │
         ┌──────────────┴──────────────┐
         │                             │
         ▼                             ▼
   PromptHooks.tsx                  App.tsx
   (consumes hooks)              (handlePromptHook)
         │                             │
         └─────────────┬───────────────┘
                       │
                       ▼
              funnelAnalytics.ts
              (trackPromptHookClicked)
```

---

## 4. COMPONENT BOUNDARIES

### 4.1 App.tsx (Controller)
- Render all landing page sections
- Manage Terminal state
- Handle prompt hook clicks
- Route to admin dashboard when `?admin=true`

### 4.2 PromptHooks.tsx (View)
- Display clickable hooks for each section
- Support dual-source pattern (narrative nodes OR static fallback)

### 4.3 WhatIsGroveCarousel.tsx (Self-contained)
- Render 6-slide carousel
- Handle navigation (arrows, dots, keyboard)
- Content: Hardcoded JSX within component

### 4.4 funnelAnalytics.ts (Service)
- Queue and flush analytics events
- Store events locally for debugging

---

## 5. TELEMETRY SCHEMA

### Event: `prompt_hook_clicked`

```typescript
{
  event: 'prompt_hook_clicked',
  timestamp: ISO8601,
  sessionId: string,
  properties: {
    sectionId: string,       // e.g., 'stakes', 'ratchet'
    hookText: string,        // Display text of clicked hook
    nodeId: string | null,   // If from narrative graph
    source: 'landing_page'
  }
}
```

---

## 6. STYLING TOKENS

| Token | CSS Variable | Usage |
|-------|--------------|-------|
| Background | `bg-paper` | `--color-paper` |
| Text | `text-ink` | `--color-ink` |
| Muted text | `text-ink-muted` | `--color-ink-muted` |
| Accent green | `text-grove-forest` | `--color-grove-forest` |
| Accent orange | `text-grove-clay` | `--color-grove-clay` |

---

## ARCHITECTURE STATUS: COMPLETE ✓
