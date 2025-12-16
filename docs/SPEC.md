# Surface vs. Substrate / Foundation Console Specification

> Requirements, Architecture, and Acceptance Criteria
> Version 1.0 | 2025-12-16

---

## 1. Executive Summary

### Vision Statement

Transform The Grove platform into a dual-experience architecture:

1. **Surface ("The Village")**: The existing immersive, narrative-driven user experience with organic paper/ink aesthetics, serif typography, and warm editorial design.

2. **Foundation ("The Control Plane")**: A new administrative experience with dark-mode holodeck/HUD aesthetics, dense data visualization, and omniscient system monitoring.

3. **Core ("The OS")**: Shared schema, pure engines, and configuration that powers both experiences without duplication.

### North Star Principles

| Principle | Surface | Foundation |
|-----------|---------|------------|
| Visual Identity | Organic, paper, grain | Digital, obsidian, glow |
| Typography | Serif (Lora, Playfair) | Mono (JetBrains), Sans (Inter) |
| Density | Editorial, spacious | Dense, information-rich |
| Interaction | Immersive, narrative | Analytical, omniscient |
| Users | Researchers, visitors | Operators, admins |

---

## 2. Requirements

### 2.1 Functional Requirements

#### FR-1: Route-Based Navigation

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-1.1 | Install `react-router-dom` | Package in `package.json`, routes functional |
| FR-1.2 | Surface routes at `/` | All existing sections accessible |
| FR-1.3 | Foundation route at `/foundation` | Admin dashboard at new route |
| FR-1.4 | Remove `?admin=true` pattern | No query-param based routing |
| FR-1.5 | Preserve deep linking | Section anchors still work (e.g., `/#economics`) |

**Current State**: No router; admin via `?admin=true` (`App.tsx:24-29`)

#### FR-2: Tailwind Migration

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-2.1 | Install `tailwindcss`, `postcss`, `autoprefixer` | Packages in devDependencies |
| FR-2.2 | Create `tailwind.config.ts` | Full theme with both Surface and Foundation tokens |
| FR-2.3 | Remove CDN script | No `cdn.tailwindcss.com` in index.html |
| FR-2.4 | Preserve existing styles | All Surface components unchanged visually |
| FR-2.5 | Add Foundation theme | Dark mode colors, HUD tokens defined |

**Current State**: CDN Tailwind (`index.html:7-48`)

#### FR-3: Foundation Layout

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-3.1 | Dark mode default | Obsidian backgrounds (#0D0D0D - #1A1A1A) |
| FR-3.2 | HUD header | Heartbeat indicator, active sessions, version |
| FR-3.3 | Vertical icon nav | Collapsible sidebar with console icons |
| FR-3.4 | Grid viewport | Subtle grid overlay on main content |
| FR-3.5 | Holographic borders | 1px borders with subtle glow accents |

**Current State**: Light gray admin (`App.tsx:206`: `bg-gray-50`)

#### FR-4: Console Migration

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-4.1 | Port NarrativeConsole | Functional in Foundation UI |
| FR-4.2 | Port FeatureFlagPanel | Functional in Foundation UI |
| FR-4.3 | Port TopicHubPanel | Functional in Foundation UI |
| FR-4.4 | Port AdminAudioConsole | Functional in Foundation UI |
| FR-4.5 | Port AdminRAGConsole | Functional in Foundation UI |
| FR-4.6 | Port EngagementConsole | Functional in Foundation UI |

**Current State**: All consoles exist in `components/Admin/` and `components/Admin*.tsx`

#### FR-5: Core Extraction

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-5.1 | Extract schema types | `src/core/schema/` with Rosetta Stone types |
| FR-5.2 | Extract engines | `src/core/engine/` with pure logic |
| FR-5.3 | Extract config | `src/core/config/` with constants/flags |
| FR-5.4 | Surface uses core | Imports from `@/core/*` |
| FR-5.5 | Foundation uses core | Imports from `@/core/*` |

**Current State**: Types scattered (`types.ts`, `types/`, `data/narratives-schema.ts`)

### 2.2 Non-Functional Requirements

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR-1 | Build time | < 30 seconds |
| NFR-2 | Bundle size | < 500KB gzipped (initial) |
| NFR-3 | TypeScript coverage | 100% (no `any` unless justified) |
| NFR-4 | Zero regressions | All existing functionality preserved |
| NFR-5 | Mobile responsive | Surface works on mobile |

---

## 3. Architecture Overview

### 3.1 Target Directory Structure

```
src/
├── core/                           # Shared OS layer
│   ├── schema/                     # Type definitions (Rosetta Stone)
│   │   ├── narrative.ts            # Persona, Card, GlobalSettings
│   │   ├── engagement.ts           # Events, State, Triggers
│   │   ├── session.ts              # Terminal session types
│   │   └── index.ts                # Barrel export
│   ├── engine/                     # Pure logic (no React)
│   │   ├── narrativeEngine.ts      # Schema processing
│   │   ├── engagementBus.ts        # Event bus singleton
│   │   ├── triggerEvaluator.ts     # Trigger condition logic
│   │   └── index.ts
│   └── config/                     # Constants and feature flags
│       ├── constants.ts
│       ├── defaults.ts             # DEFAULT_* values
│       └── index.ts
│
├── surface/                        # The Village (user-facing)
│   ├── components/                 # Surface-specific components
│   │   ├── Terminal/               # Chat interface
│   │   ├── DiaryEntry.tsx          # Journal component
│   │   ├── PromptHooks.tsx
│   │   └── ...sections
│   ├── layouts/
│   │   └── SurfaceLayout.tsx       # Paper/ink wrapper
│   └── pages/
│       └── HomePage.tsx            # Main scrolling page
│
├── foundation/                     # The Control Plane (admin)
│   ├── layout/
│   │   └── FoundationLayout.tsx    # HUD + nav + viewport
│   ├── components/                 # Foundation-specific components
│   │   ├── DataGrid.tsx            # Dense table component
│   │   ├── LogicGraph.tsx          # Causal graph viz
│   │   ├── StateMonitor.tsx        # Live state display
│   │   └── HUD/                    # Header primitives
│   └── consoles/                   # Ported admin panels
│       ├── NarrativeArchitect.tsx  # Renamed from NarrativeConsole
│       ├── EngagementBridge.tsx    # Renamed from EngagementConsole
│       ├── KnowledgeVault.tsx      # Renamed from AdminRAGConsole
│       ├── RealityTuner.tsx        # Feature flags + settings
│       └── AudioStudio.tsx         # Renamed from AdminAudioConsole
│
├── services/                       # API clients (shared)
│   ├── chatService.ts
│   ├── audioService.ts
│   └── storageService.ts           # New: unified GCS client
│
├── hooks/                          # Shared React hooks
│   ├── useEngagementBus.ts         # Wrapper around core engine
│   ├── useNarrativeEngine.ts
│   └── ...
│
└── App.tsx                         # Router setup only
```

### 3.2 Dependency Rules

```
┌─────────────────────────────────────────────────────────────┐
│                           App.tsx                           │
│                    (React Router only)                      │
└─────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
┌───────────────────────┐           ┌───────────────────────┐
│       Surface         │           │      Foundation       │
│   (Organic/Editorial) │           │    (HUD/Holodeck)     │
└───────────────────────┘           └───────────────────────┘
            │                                   │
            │         ┌───────────────┐         │
            └────────►│    Hooks      │◄────────┘
                      │ (React glue)  │
                      └───────────────┘
                              │
                              ▼
                      ┌───────────────┐
                      │     Core      │
                      │   (Pure TS)   │
                      │ schema/engine │
                      └───────────────┘
                              │
                              ▼
                      ┌───────────────┐
                      │   Services    │
                      │  (API calls)  │
                      └───────────────┘
```

**Dependency Rules**:
1. `core/` has ZERO React dependencies
2. `surface/` and `foundation/` NEVER import from each other
3. `hooks/` wraps `core/` for React consumption
4. `services/` is used by both experiences via hooks

### 3.3 Route Structure

| Route | Component | Layout |
|-------|-----------|--------|
| `/` | `HomePage` | `SurfaceLayout` |
| `/#section-id` | Section anchor | `SurfaceLayout` |
| `/foundation` | Console dashboard | `FoundationLayout` |
| `/foundation/narrative` | NarrativeArchitect | `FoundationLayout` |
| `/foundation/engagement` | EngagementBridge | `FoundationLayout` |
| `/foundation/knowledge` | KnowledgeVault | `FoundationLayout` |
| `/foundation/tuner` | RealityTuner | `FoundationLayout` |
| `/foundation/audio` | AudioStudio | `FoundationLayout` |

---

## 4. Design Specifications

### 4.1 Surface Design Tokens (Preserve)

```typescript
// From index.html:16-45 - MUST PRESERVE
const surfaceTokens = {
  colors: {
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
    }
  },
  fonts: {
    serif: ['Lora', 'serif'],
    display: ['Playfair Display', 'serif'],
    sans: ['Inter', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace']
  }
};
```

### 4.2 Foundation Design Tokens (New)

```typescript
const foundationTokens = {
  colors: {
    // Obsidian backgrounds
    obsidian: {
      DEFAULT: '#0D0D0D',      // Deepest black
      raised: '#141414',       // Card/panel bg
      elevated: '#1A1A1A',     // Modal bg
      surface: '#242424'       // Interactive surface
    },
    // Holographic accents
    holo: {
      cyan: '#00D4FF',         // Primary accent
      magenta: '#FF00D4',      // Secondary accent
      lime: '#00FF88',         // Success
      amber: '#FFB800',        // Warning
      red: '#FF4444'           // Error
    },
    // Grid/border
    grid: {
      line: 'rgba(0, 212, 255, 0.1)',
      glow: 'rgba(0, 212, 255, 0.3)'
    },
    // Text
    text: {
      primary: '#FFFFFF',
      secondary: '#A0A0A0',
      muted: '#666666'
    }
  },
  fonts: {
    mono: ['JetBrains Mono', 'monospace'],  // Primary for Foundation
    sans: ['Inter', 'sans-serif']            // Secondary
  },
  effects: {
    glow: '0 0 10px rgba(0, 212, 255, 0.3)',
    border: '1px solid rgba(0, 212, 255, 0.2)'
  }
};
```

### 4.3 Foundation Layout Specification

```
┌─────────────────────────────────────────────────────────────────────────┐
│ HUD HEADER                                                    [48px]    │
│ ┌──────┐ ┌─────────────────────────────┐ ┌──────────────────────────┐   │
│ │ LOGO │ │ Foundation / Narrative Arch  │ │ ● 3 sessions  v2.4.1    │   │
│ └──────┘ └─────────────────────────────┘ └──────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│┌────┐ ┌─────────────────────────────────────────────────────────────────┤
││ N  │ │                                                                 │
││ E  │ │    MAIN VIEWPORT                                                │
││ B  │ │    (Console content with grid overlay)                          │
││ A  │ │                                                                 │
││ K  │ │    ┌─────────────────┐  ┌─────────────────┐                     │
││ T  │ │    │  Data Panel 1   │  │  Data Panel 2   │                     │
││ A  │ │    │                 │  │                 │                     │
││    │ │    └─────────────────┘  └─────────────────┘                     │
│└────┘ │                                                                 │
│[56px] │                                                                 │
│       └─────────────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────────────────┘
```

**Layout Specs**:
- Header: 48px fixed, obsidian-raised bg
- Sidebar: 56px collapsed, 200px expanded
- Viewport: Remaining space, obsidian-DEFAULT bg
- Grid overlay: 40px squares, 0.1 opacity cyan

---

## 5. Acceptance Criteria

### 5.1 Sprint 1: Foundation (Routing + Tailwind)

- [ ] `react-router-dom` installed and configured
- [ ] Routes work: `/`, `/foundation`
- [ ] `?admin=true` redirects to `/foundation`
- [ ] Tailwind migrated from CDN to npm
- [ ] `tailwind.config.ts` contains both Surface and Foundation tokens
- [ ] All existing Surface styles preserved (visual regression test)
- [ ] Build succeeds: `npm run build`
- [ ] TypeScript passes: `npx tsc --noEmit`

### 5.2 Sprint 2: Foundation Layout

- [ ] `FoundationLayout.tsx` implemented
- [ ] HUD header with logo, breadcrumb, status
- [ ] Vertical nav sidebar with icons
- [ ] Grid overlay on viewport
- [ ] Dark mode by default (no toggle yet)
- [ ] Placeholder content renders at `/foundation`

### 5.3 Sprint 3: Console Migration

- [ ] NarrativeArchitect functional
- [ ] EngagementBridge functional
- [ ] KnowledgeVault functional
- [ ] RealityTuner functional (flags + hubs merged)
- [ ] AudioStudio functional
- [ ] All API calls work (no regressions)
- [ ] State persists correctly (localStorage)

### 5.4 Sprint 4: Core Extraction

- [ ] `src/core/schema/` contains all shared types
- [ ] `src/core/engine/` contains pure logic
- [ ] Surface imports from `@/core/*`
- [ ] Foundation imports from `@/core/*`
- [ ] No duplicate type definitions
- [ ] All tests pass (if any exist)

---

## 6. Out of Scope (Future Work)

1. **Authentication/Authorization**: No login system for Foundation
2. **Real-time Collaboration**: No multi-admin features
3. **Mobile Foundation**: Foundation is desktop-only for now
4. **Theme Toggle**: No light/dark switch (each experience has fixed theme)
5. **New Consoles**: Only migrating existing admin panels

---

## 7. Dependencies

### New Packages Required

```json
{
  "dependencies": {
    "react-router-dom": "^7.x"
  },
  "devDependencies": {
    "tailwindcss": "^4.x",
    "postcss": "^8.x",
    "autoprefixer": "^10.x"
  }
}
```

### Existing Packages (Unchanged)

See `package.json:12-28` for current dependencies.

---

## 8. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tailwind migration breaks styles | High | Create visual regression screenshots before/after |
| Router breaks section anchors | Medium | Test all internal links |
| Console state loss | High | Verify localStorage keys preserved |
| Large Terminal.tsx refactor | Medium | Extract incrementally, maintain shims |
| Build performance | Low | Monitor with Vite's timing output |

---

## 9. Success Metrics

1. **Zero Visual Regressions**: Surface looks identical post-migration
2. **Route Integrity**: All navigation paths functional
3. **Admin Functionality**: All console features work in Foundation
4. **Type Safety**: No new `any` types introduced
5. **Build Health**: No new warnings/errors

---

*Specification Complete. See ARCHITECTURE.md for detailed target state.*
