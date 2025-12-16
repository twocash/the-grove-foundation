# Target Architecture

> Surface vs. Substrate / Foundation Console
> Version 1.0 | 2025-12-16

---

## 1. Architectural Philosophy

### The Three Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                          EXPERIENCES                                │
│                                                                     │
│    ┌─────────────────────┐         ┌─────────────────────┐         │
│    │      SURFACE        │         │     FOUNDATION      │         │
│    │   "The Village"     │         │ "The Control Plane" │         │
│    │                     │         │                     │         │
│    │  - Paper/Ink        │         │  - Obsidian/Glow    │         │
│    │  - Serif fonts      │         │  - Mono fonts       │         │
│    │  - Organic feel     │         │  - HUD aesthetic    │         │
│    │  - Narrative UX     │         │  - Data-dense UX    │         │
│    │                     │         │                     │         │
│    │  Users: Visitors    │         │  Users: Operators   │         │
│    └─────────────────────┘         └─────────────────────┘         │
│              │                               │                      │
└──────────────┼───────────────────────────────┼──────────────────────┘
               │                               │
               │     ┌─────────────────┐       │
               └────►│     HOOKS       │◄──────┘
                     │  (React glue)   │
                     └────────┬────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────────┐
│                             │                                       │
│                      ┌──────▼──────┐                                │
│                      │    CORE     │                                │
│                      │  "The OS"   │                                │
│                      │             │                                │
│                      │  - Schema   │   (Pure TypeScript)            │
│                      │  - Engines  │   (No React)                   │
│                      │  - Config   │   (No Side Effects)            │
│                      └──────┬──────┘                                │
│                             │                                       │
│                      ┌──────▼──────┐                                │
│                      │  SERVICES   │                                │
│                      │ (API calls) │                                │
│                      └─────────────┘                                │
│                                                                     │
│                          SUBSTRATE                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Core is Pure**: `src/core/` contains zero React dependencies. It defines types and pure functions only.

2. **Experiences are Independent**: Surface and Foundation never import from each other. They share only via Core.

3. **Hooks Bridge Core to React**: All React components access Core through hooks, which handle subscriptions and state.

4. **Services are Shared**: API clients live in `src/services/` and are used by both experiences.

5. **One Source of Truth**: Each type, constant, or configuration lives in exactly one place.

---

## 2. Directory Structure (Target State)

```
goofy-lumiere/
│
├── src/
│   ├── core/                           # THE OS (Pure TypeScript)
│   │   ├── schema/                     # Type Definitions
│   │   │   ├── index.ts                # Barrel export
│   │   │   ├── narrative.ts            # Persona, Card, GlobalSettings
│   │   │   ├── engagement.ts           # Events, State, Triggers, Reveals
│   │   │   ├── session.ts              # TerminalSession, ChatMessage
│   │   │   ├── lens.ts                 # CustomLens, Archetype
│   │   │   └── sections.ts             # SectionId enum
│   │   │
│   │   ├── engine/                     # Pure Logic (No Side Effects)
│   │   │   ├── index.ts
│   │   │   ├── engagementBus.ts        # Event bus (singleton pattern)
│   │   │   ├── triggerEvaluator.ts     # Condition evaluation
│   │   │   ├── narrativeProcessor.ts   # Schema transformations
│   │   │   └── threadGenerator.ts      # Journey thread logic
│   │   │
│   │   └── config/                     # Constants & Defaults
│   │       ├── index.ts
│   │       ├── constants.ts            # SECTION_CONFIG, etc.
│   │       ├── defaults.ts             # DEFAULT_* values
│   │       └── triggers.ts             # DEFAULT_TRIGGERS array
│   │
│   ├── surface/                        # THE VILLAGE (User Experience)
│   │   ├── layouts/
│   │   │   └── SurfaceLayout.tsx       # Paper/ink wrapper
│   │   │
│   │   ├── pages/
│   │   │   └── HomePage.tsx            # Main scrolling narrative
│   │   │
│   │   ├── components/
│   │   │   ├── Terminal/               # Chat interface (from components/Terminal/)
│   │   │   │   ├── index.tsx           # Main Terminal component
│   │   │   │   ├── LensPicker.tsx
│   │   │   │   ├── JourneyCard.tsx
│   │   │   │   ├── CustomLensWizard/
│   │   │   │   ├── Reveals/
│   │   │   │   └── ConversionCTA/
│   │   │   │
│   │   │   ├── sections/               # Page sections
│   │   │   │   ├── StakesSection.tsx
│   │   │   │   ├── RatchetSection.tsx
│   │   │   │   ├── WhatIsGroveCarousel.tsx
│   │   │   │   ├── ArchitectureDiagram.tsx
│   │   │   │   ├── EconomicsSlider.tsx
│   │   │   │   ├── DifferentiationSection.tsx
│   │   │   │   ├── NetworkSection.tsx
│   │   │   │   └── GetInvolvedSection.tsx
│   │   │   │
│   │   │   ├── DiaryEntry.tsx          # Journal component
│   │   │   ├── AudioPlayer.tsx
│   │   │   ├── PromptHooks.tsx
│   │   │   ├── ThesisGraph.tsx
│   │   │   └── NetworkMap.tsx
│   │   │
│   │   └── styles/
│   │       └── surface.css             # Surface-specific overrides
│   │
│   ├── foundation/                     # THE CONTROL PLANE (Admin Experience)
│   │   ├── layout/
│   │   │   ├── FoundationLayout.tsx    # HUD + nav + viewport
│   │   │   ├── HUDHeader.tsx           # Top bar with status
│   │   │   ├── NavSidebar.tsx          # Icon navigation
│   │   │   └── GridViewport.tsx        # Main content area
│   │   │
│   │   ├── components/
│   │   │   ├── DataGrid.tsx            # Dense table component
│   │   │   ├── LogicGraph.tsx          # Trigger/state visualization
│   │   │   ├── StateMonitor.tsx        # Live engagement state
│   │   │   ├── EventLog.tsx            # Scrolling event feed
│   │   │   ├── MetricCard.tsx          # Stats display
│   │   │   └── GlowButton.tsx          # Foundation-styled button
│   │   │
│   │   ├── consoles/                   # Admin Panels (Migrated)
│   │   │   ├── NarrativeArchitect.tsx  # from NarrativeConsole
│   │   │   ├── EngagementBridge.tsx    # from EngagementConsole
│   │   │   ├── KnowledgeVault.tsx      # from AdminRAGConsole
│   │   │   ├── RealityTuner.tsx        # FeatureFlags + TopicHubs merged
│   │   │   └── AudioStudio.tsx         # from AdminAudioConsole
│   │   │
│   │   └── styles/
│   │       └── foundation.css          # Foundation-specific overrides
│   │
│   ├── services/                       # API CLIENTS (Shared)
│   │   ├── chatService.ts              # /api/chat endpoints
│   │   ├── audioService.ts             # TTS generation
│   │   ├── narrativeService.ts         # /api/narrative endpoints
│   │   └── storageService.ts           # GCS operations
│   │
│   ├── hooks/                          # REACT HOOKS (Bridge Layer)
│   │   ├── useEngagementBus.ts         # Wraps core/engine/engagementBus
│   │   ├── useNarrativeEngine.ts       # Schema + session state
│   │   ├── useCustomLens.ts            # Custom lens CRUD
│   │   ├── useFeatureFlags.ts          # Flag access
│   │   └── useStreakTracking.ts        # Streak persistence
│   │
│   ├── router/
│   │   ├── index.tsx                   # Router configuration
│   │   └── routes.ts                   # Route definitions
│   │
│   └── App.tsx                         # Router provider only
│
├── public/                             # Static assets
│
├── styles/
│   ├── tailwind.css                    # Tailwind imports
│   └── base.css                        # Shared base styles
│
├── index.html                          # HTML template (no CDN)
├── tailwind.config.ts                  # Full theme config
├── postcss.config.js                   # PostCSS config
├── vite.config.ts                      # Build config
├── tsconfig.json                       # TypeScript config
└── package.json
```

---

## 3. Module Boundaries

### 3.1 Core Module (`src/core/`)

**Purpose**: Define the "operating system" shared by both experiences.

**Rules**:
- NO React imports (no `import React from 'react'`)
- NO DOM APIs (no `document`, `window`, `localStorage`)
- NO side effects (pure functions only, except singleton pattern in engines)
- CAN import from other `core/*` modules
- CANNOT import from `surface/`, `foundation/`, `hooks/`, or `services/`

**Contents**:

| Submodule | Purpose | Source (Current) |
|-----------|---------|------------------|
| `schema/narrative.ts` | Persona, Card, GlobalSettings | `data/narratives-schema.ts` |
| `schema/engagement.ts` | EngagementState, Events, Triggers | `types/engagement.ts` |
| `schema/lens.ts` | CustomLens, Archetype | `types/lens.ts` |
| `schema/session.ts` | TerminalSession, ChatMessage | `types.ts`, `data/narratives-schema.ts:255-262` |
| `schema/sections.ts` | SectionId enum | `types.ts:1-10` |
| `engine/engagementBus.ts` | Singleton event bus (pure logic) | `hooks/useEngagementBus.ts:48-373` |
| `engine/triggerEvaluator.ts` | Condition evaluation | `utils/engagementTriggers.ts` |
| `config/defaults.ts` | DEFAULT_* constants | `data/narratives-schema.ts`, `types/engagement.ts` |
| `config/triggers.ts` | DEFAULT_TRIGGERS | `utils/engagementTriggers.ts` |

### 3.2 Surface Module (`src/surface/`)

**Purpose**: The Village user experience.

**Rules**:
- CAN import from `core/*`, `hooks/`, `services/`
- CANNOT import from `foundation/*`
- Uses Surface design tokens (paper, ink, serif)
- Contains all user-facing narrative components

**Key Components**:

| Component | Purpose | Source (Current) |
|-----------|---------|------------------|
| `SurfaceLayout.tsx` | Paper/ink wrapper | New (extract from `App.tsx`) |
| `HomePage.tsx` | Main scrolling page | New (extract from `App.tsx:340-648`) |
| `Terminal/index.tsx` | Chat interface | `components/Terminal.tsx` |
| `DiaryEntry.tsx` | Journal component | `components/DiaryEntry.tsx` |
| `sections/*.tsx` | Page sections | Various in `components/` |

### 3.3 Foundation Module (`src/foundation/`)

**Purpose**: The Control Plane admin experience.

**Rules**:
- CAN import from `core/*`, `hooks/`, `services/`
- CANNOT import from `surface/*`
- Uses Foundation design tokens (obsidian, holo, mono)
- Contains all admin/operator components

**Key Components**:

| Component | Purpose | Source (Current) |
|-----------|---------|------------------|
| `FoundationLayout.tsx` | HUD + nav + viewport | New |
| `HUDHeader.tsx` | Status header | New |
| `NavSidebar.tsx` | Icon navigation | New |
| `NarrativeArchitect.tsx` | Persona/card editor | `components/Admin/NarrativeConsole.tsx` |
| `EngagementBridge.tsx` | Event/trigger monitor | `components/Admin/EngagementConsole.tsx` |
| `KnowledgeVault.tsx` | RAG management | `components/AdminRAGConsole.tsx` |
| `RealityTuner.tsx` | Flags + hubs | `components/Admin/FeatureFlagPanel.tsx`, `TopicHubPanel.tsx` |
| `AudioStudio.tsx` | TTS management | `components/AdminAudioConsole.tsx` |

### 3.4 Hooks Module (`src/hooks/`)

**Purpose**: Bridge Core engines to React components.

**Rules**:
- CAN import from `core/*`, `services/`
- CANNOT import from `surface/*` or `foundation/*`
- Handles React lifecycle, subscriptions, state

**Key Hooks**:

| Hook | Purpose | Core Dependency |
|------|---------|-----------------|
| `useEngagementBus` | Event emission, state access | `core/engine/engagementBus` |
| `useNarrativeEngine` | Schema, session, threads | `core/schema/narrative` |
| `useCustomLens` | Lens CRUD with encryption | `core/schema/lens` |
| `useFeatureFlags` | Flag access | `core/config/defaults` |

### 3.5 Services Module (`src/services/`)

**Purpose**: API clients for backend communication.

**Rules**:
- CAN import from `core/schema/*` (for types only)
- CANNOT import from React or any UI modules
- Handles HTTP, SSE, localStorage persistence

**Key Services**:

| Service | Purpose | Endpoints |
|---------|---------|-----------|
| `chatService.ts` | Chat API client | `/api/chat`, `/api/chat/init` |
| `narrativeService.ts` | Schema API client | `/api/narrative`, `/api/admin/narrative` |
| `storageService.ts` | GCS operations | `/api/admin/files`, `/api/admin/upload` |
| `audioService.ts` | TTS generation | Gemini API (client-side, to migrate) |

---

## 4. State Management Architecture

### 4.1 Engagement Bus (Singleton Pattern)

```typescript
// src/core/engine/engagementBus.ts

// Pure TypeScript singleton (no React)
class EngagementBus {
  private state: EngagementState;
  private subscribers: Set<(state: EngagementState) => void>;

  emit(event: EngagementEvent): void { ... }
  getState(): EngagementState { ... }
  subscribe(handler: StateHandler): Unsubscribe { ... }
}

// Module-level singleton
let instance: EngagementBus | null = null;
export function getBus(): EngagementBus { ... }
```

```typescript
// src/hooks/useEngagementBus.ts

// React hook wrapper
export function useEngagementBus() {
  const bus = useMemo(() => getBus(), []);
  const [state, setState] = useState(bus.getState());

  useEffect(() => {
    return bus.subscribe(setState);
  }, [bus]);

  return { state, emit: bus.emit.bind(bus), ... };
}
```

### 4.2 Narrative Engine State

```typescript
// src/hooks/useNarrativeEngine.ts

// Combines schema (from API) + session (from localStorage)
interface NarrativeEngineState {
  schema: NarrativeSchemaV2 | null;
  session: TerminalSession;
  loading: boolean;
  error: string | null;
}
```

### 4.3 localStorage Keys

| Key | Purpose | Module |
|-----|---------|--------|
| `grove-engagement-state` | Engagement metrics | `core/engine/engagementBus` |
| `grove-event-history` | Event log (last 100) | `core/engine/engagementBus` |
| `grove-terminal-lens` | Active lens ID | `hooks/useNarrativeEngine` |
| `grove-terminal-session` | Session state | `hooks/useNarrativeEngine` |
| `grove-custom-lenses` | Custom lenses (encrypted) | `hooks/useCustomLens` |
| `grove-lens-key` | Encryption key | `hooks/useCustomLens` |

---

## 5. Routing Architecture

### 5.1 Route Configuration

```typescript
// src/router/routes.ts
import { RouteObject } from 'react-router-dom';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <SurfaceLayout />,
    children: [
      { index: true, element: <HomePage /> }
    ]
  },
  {
    path: '/foundation',
    element: <FoundationLayout />,
    children: [
      { index: true, element: <Navigate to="/foundation/narrative" /> },
      { path: 'narrative', element: <NarrativeArchitect /> },
      { path: 'engagement', element: <EngagementBridge /> },
      { path: 'knowledge', element: <KnowledgeVault /> },
      { path: 'tuner', element: <RealityTuner /> },
      { path: 'audio', element: <AudioStudio /> }
    ]
  }
];
```

### 5.2 App.tsx (Target)

```typescript
// src/App.tsx
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { routes } from './router/routes';

const router = createBrowserRouter(routes);

export default function App() {
  return <RouterProvider router={router} />;
}
```

### 5.3 Legacy Redirect

```typescript
// Handle ?admin=true for backward compatibility
// In router configuration:
{
  path: '/',
  loader: () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      return redirect('/foundation');
    }
    return null;
  }
}
```

---

## 6. Styling Architecture

### 6.1 Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        // Surface tokens (preserved from index.html)
        paper: { DEFAULT: '#FBFBF9', dark: '#F2F0E9' },
        ink: { DEFAULT: '#1C1C1C', muted: '#575757', border: '#E5E5E0' },
        grove: {
          forest: '#2F5C3B',
          clay: '#D95D39',
          accent: '#2F5C3B',
          light: '#E5E5E0'
        },
        terminal: {
          bg: '#FFFFFF',
          phosphor: '#1C1C1C',
          border: '#E5E5E0',
          highlight: '#D95D39'
        },

        // Foundation tokens (new)
        obsidian: {
          DEFAULT: '#0D0D0D',
          raised: '#141414',
          elevated: '#1A1A1A',
          surface: '#242424'
        },
        holo: {
          cyan: '#00D4FF',
          magenta: '#FF00D4',
          lime: '#00FF88',
          amber: '#FFB800',
          red: '#FF4444'
        },
        grid: {
          line: 'rgba(0, 212, 255, 0.1)',
          glow: 'rgba(0, 212, 255, 0.3)'
        }
      },
      fontFamily: {
        serif: ['Lora', 'serif'],
        display: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  }
};

export default config;
```

### 6.2 CSS Organization

```
styles/
├── tailwind.css          # @tailwind directives
├── base.css              # Shared base (scrollbars, etc.)
├── surface.css           # .bg-grain, Surface overrides
└── foundation.css        # Grid overlay, Foundation overrides
```

---

## 7. Build Configuration

### 7.1 Vite Config (Target)

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@surface': path.resolve(__dirname, './src/surface'),
      '@foundation': path.resolve(__dirname, './src/foundation'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
});
```

### 7.2 TypeScript Paths

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@core/*": ["./src/core/*"],
      "@surface/*": ["./src/surface/*"],
      "@foundation/*": ["./src/foundation/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@services/*": ["./src/services/*"]
    }
  }
}
```

---

## 8. Migration Strategy

### Phase 1: Foundation Setup (Sprint 1)
1. Install routing and Tailwind packages
2. Create `tailwind.config.ts` with all tokens
3. Update build configuration
4. Create basic route structure
5. Verify Surface unchanged

### Phase 2: Core Extraction (Sprint 2)
1. Create `src/core/` structure
2. Move type definitions
3. Extract engine logic (without React deps)
4. Update imports throughout codebase
5. Add shims at old locations

### Phase 3: Foundation Experience (Sprint 3)
1. Create Foundation layout components
2. Port admin consoles one by one
3. Style with Foundation tokens
4. Test all functionality

### Phase 4: Cleanup (Sprint 4)
1. Remove shims
2. Delete old file locations
3. Final testing
4. Documentation update

---

## 9. Validation Checklist

- [ ] `src/core/` has no React imports
- [ ] `src/surface/` does not import from `foundation/`
- [ ] `src/foundation/` does not import from `surface/`
- [ ] All localStorage keys unchanged
- [ ] All API endpoints unchanged
- [ ] TypeScript compiles with no errors
- [ ] Build produces valid output
- [ ] Surface visual parity confirmed
- [ ] Foundation fully functional

---

*Architecture Document Complete. See MIGRATION_MAP.md for detailed file moves.*
