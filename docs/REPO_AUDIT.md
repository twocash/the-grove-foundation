# Repository Audit Report

> Phase 0 Audit for Surface vs. Substrate / Foundation Console Migration
> Conducted: 2025-12-16 | Branch: `goofy-lumiere`

---

## 1. Build & Framework Tooling

### Primary Build Tool: Vite 6.2.0

| Aspect | Finding | Citation |
|--------|---------|----------|
| Builder | Vite 6.2.0 with `@vitejs/plugin-react` 5.0.0 | `package.json:27`, `vite.config.ts:3` |
| Dev Server | Port 3000, proxies `/api` to localhost:8080 | `vite.config.ts:21-29` |
| API Key Handling | `GEMINI_API_KEY` from env, exposed via `import.meta.env` | `vite.config.ts:18,32-38` |
| Path Aliases | `@/` resolves to repo root | `vite.config.ts:40-43`, `tsconfig.json:21-24` |
| Output | Builds to `dist/` | Implied by Vite defaults |

### TypeScript Configuration

| Setting | Value | Citation |
|---------|-------|----------|
| Target | ES2022 | `tsconfig.json:3` |
| Module | ESNext | `tsconfig.json:6` |
| JSX | react-jsx | `tsconfig.json:20` |
| Module Resolution | Bundler | `tsconfig.json:16` |
| Isolated Modules | true | `tsconfig.json:17` |
| No Emit | true (Vite handles) | `tsconfig.json:27` |

### Package Manager

- **npm** (no yarn.lock or pnpm-lock detected)
- `package-lock.json` present
- Node.js target: 20 (per `Dockerfile:1,23`)

---

## 2. Routing Approach

### Current State: NO ROUTER

**Finding**: There is no routing library installed. Navigation is handled entirely through:

1. **Query Parameter Detection** for admin mode:
   ```tsx
   // App.tsx:24-29
   useEffect(() => {
     const params = new URLSearchParams(window.location.search);
     if (params.get('admin') === 'true') {
       setIsAdmin(true);
     }
   }, []);
   ```

2. **Conditional Rendering** based on `isAdmin` state:
   ```tsx
   // App.tsx:336-338
   if (isAdmin) {
     return <AdminDashboard />;
   }
   ```

3. **Section-based Scrolling** via Intersection Observer:
   ```tsx
   // App.tsx:43-62
   const observer = new IntersectionObserver(
     (entries) => {
       entries.forEach((entry) => {
         if (entry.isIntersecting) {
           setActiveSection(entry.target.id as SectionId);
         }
       });
     },
     { threshold: 0.2 }
   );
   ```

4. **Internal Navigation** via `scrollIntoView`:
   ```tsx
   // App.tsx:379
   onClick={() => document.getElementById(SectionId.RATCHET)?.scrollIntoView({ behavior: 'smooth' })}
   ```

### Authorization Decision

Per project instructions:
> "You are explicitly authorized to install and use `react-router-dom` to replace the query-param routing and implement real routes (including `/foundation`)."

---

## 3. Styling Approach

### Current State: Tailwind via CDN

**Finding**: Tailwind CSS is loaded via CDN, NOT npm package.

| Aspect | Finding | Citation |
|--------|---------|----------|
| CDN Script | `https://cdn.tailwindcss.com` | `index.html:7` |
| Config Location | Inline `<script>` tag | `index.html:11-48` |
| Custom Colors | `paper`, `ink`, `grove`, `terminal` | `index.html:16-38` |
| Custom Fonts | Lora, Playfair Display, Inter, JetBrains Mono | `index.html:40-44` |
| No PostCSS | No `postcss.config.js` | Confirmed absent |
| No Tailwind npm | Not in `package.json` dependencies | `package.json:12-28` |

### Custom CSS Definitions

```html
<!-- index.html:50-89 -->
<style>
  /* Scrollbar styling */
  ::-webkit-scrollbar { ... }

  /* Cursor blink animation */
  .cursor-blink { animation: blink 1s step-end infinite; }

  /* Grain texture overlay */
  .bg-grain { ... }
  .content-z { position: relative; z-index: 1; }
</style>
```

### Design System Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `paper` | #FBFBF9 | Background (cream) |
| `paper-dark` | #F2F0E9 | Secondary bg |
| `ink` | #1C1C1C | Primary text |
| `ink-muted` | #575757 | Secondary text |
| `ink-border` | #E5E5E0 | Borders |
| `grove-forest` | #2F5C3B | Primary accent (green) |
| `grove-clay` | #D95D39 | Secondary accent (orange) |

### Authorization Decision

Per project instructions:
> "Part of Sprint 2 is migrating from CDN Tailwind to a proper npm/PostCSS build (`tailwindcss`, `postcss`, `autoprefixer`) with a real `tailwind.config.*`"

---

## 4. Component Organization

### Directory Structure

```
goofy-lumiere/
├── App.tsx                      # Root component (651 lines)
├── index.tsx                    # React entry point (15 lines)
├── types.ts                     # Core types (55 lines)
├── constants.ts                 # Static config
├── components/
│   ├── Admin/                   # v2 Admin consoles (7 files)
│   │   ├── index.ts             # Barrel export
│   │   ├── NarrativeConsole.tsx # Main v2 editor
│   │   ├── CardEditor.tsx
│   │   ├── PersonaSettings.tsx
│   │   ├── GlobalSettingsModal.tsx
│   │   ├── FeatureFlagPanel.tsx
│   │   ├── TopicHubPanel.tsx
│   │   └── EngagementConsole.tsx
│   ├── Terminal/                # Chat interface (15 files)
│   │   ├── index.ts             # Barrel export
│   │   ├── LensPicker.tsx
│   │   ├── LensBadge.tsx
│   │   ├── JourneyCard.tsx
│   │   ├── JourneyNav.tsx
│   │   ├── ThreadProgress.tsx
│   │   ├── JourneyEnd.tsx
│   │   ├── JourneyCompletion.tsx
│   │   ├── LoadingIndicator.tsx
│   │   ├── CustomLensWizard/    # 5-step wizard
│   │   ├── Reveals/             # Dramatic overlays (4 + index)
│   │   └── ConversionCTA/       # Archetype CTAs (6 + config + index)
│   ├── Terminal.tsx             # Main Terminal component (separate from folder)
│   ├── AdminNarrativeConsole.tsx # Legacy v1 admin
│   ├── AdminAudioConsole.tsx
│   ├── AdminRAGConsole.tsx
│   ├── DiaryEntry.tsx           # "Journal" component
│   ├── ArchitectureDiagram.tsx
│   ├── EconomicsSlider.tsx
│   ├── NetworkMap.tsx
│   ├── ThesisGraph.tsx
│   ├── WhatIsGroveCarousel.tsx
│   ├── AudioPlayer.tsx
│   ├── PromptHooks.tsx
│   ├── NarrativeGraphView.tsx
│   └── NarrativeNodeCard.tsx
├── hooks/                       # React hooks (8 files)
├── services/                    # API clients (3 files)
├── types/                       # Extended types (2 files)
├── utils/                       # Utility functions (6 files)
├── data/                        # Static data & schemas
└── server.js                    # Express backend (1025 lines)
```

### File Count Summary

| Category | Count | Citation |
|----------|-------|----------|
| TSX Components | 47 | Glob `**/*.tsx` |
| TS Modules | 32 | Glob `**/*.ts` |
| JS Modules | 4 | `server.js`, `scripts/*.js`, `data/prompts.js` |
| Total Source | 83 | — |

---

## 5. State Management

### Architecture: Custom Hooks + Singleton Pattern

No external state library (Redux, Zustand, Jotai, etc.) is installed.

### Primary State Hooks

| Hook | Purpose | Storage | Citation |
|------|---------|---------|----------|
| `useEngagementBus` | Event-driven engagement tracking | localStorage | `hooks/useEngagementBus.ts:1-497` |
| `useNarrativeEngine` | Lens/card/journey state | localStorage | `hooks/useNarrativeEngine.ts` |
| `useCustomLens` | Custom lens CRUD + encryption | localStorage | `hooks/useCustomLens.ts` |
| `useFeatureFlags` | Feature flag access | From schema | `hooks/useFeatureFlags.ts` |
| `useStreakTracking` | Streak persistence | localStorage | `hooks/useStreakTracking.ts` |
| `useRevealState` | DEPRECATED | — | `hooks/useRevealState.ts` |
| `useEngagementBridge` | Backward-compatible bridge | Via bus | `hooks/useEngagementBridge.ts` |
| `useNarrative` | Legacy v1 narrative access | — | `hooks/useNarrative.ts` |

### Engagement Bus Singleton

**Pattern**: Module-level singleton with React hook wrappers

```typescript
// hooks/useEngagementBus.ts:375-383
let busInstance: EngagementBusSingleton | null = null;

function getBus(): EngagementBusSingleton {
  if (!busInstance) {
    busInstance = new EngagementBusSingleton();
  }
  return busInstance;
}
```

**7 React Hooks Exposed**:
- `useEngagementBus()` - Full API
- `useEngagementState()` - Read-only state
- `useRevealQueue()` - Reveal queue
- `useNextReveal()` - Next pending reveal
- `useEngagementEmit()` - Event emitters
- `useRevealCheck(type)` - Condition check

Citation: `hooks/useEngagementBus.ts:389-493`

---

## 6. Backend Architecture

### Express Server

| Aspect | Finding | Citation |
|--------|---------|----------|
| Framework | Express 4.21.2 | `package.json:15` |
| Port | 8080 (production) | `server.js` bottom |
| Static Serving | `dist/` folder | `server.js:41` |
| SPA Fallback | Yes, serves `index.html` for all routes | `server.js:1019` |

### API Endpoints (15 total)

| Method | Path | Purpose | Citation |
|--------|------|---------|----------|
| GET | `/api/admin/files` | List GCS bucket files | `server.js:46` |
| POST | `/api/admin/upload` | Stream upload to GCS | `server.js:63` |
| GET | `/api/manifest` | Audio manifest | `server.js:101` |
| POST | `/api/admin/manifest` | Save audio manifest | `server.js:119` |
| GET | `/api/context` | Combined RAG context | `server.js:146` |
| GET | `/api/admin/knowledge` | List knowledge files | `server.js:171` |
| DELETE | `/api/admin/knowledge/:filename` | Delete knowledge file | `server.js:187` |
| GET | `/api/narrative` | Fetch narrative schema | `server.js:425` |
| POST | `/api/admin/narrative` | Save narrative schema | `server.js:459` |
| POST | `/api/admin/generate-narrative` | AI extract from file | `server.js:499` |
| POST | `/api/chat/init` | Init chat session | `server.js:828` |
| POST | `/api/chat` | Send message (SSE) | `server.js:692` |
| DELETE | `/api/chat/:sessionId` | Cleanup session | `server.js:886` |
| GET | `/api/chat/health` | Health check | `server.js:899` |
| POST | `/api/generate-lens` | AI lens generation | `server.js:952` |

### Cloud Services

| Service | Purpose | Citation |
|---------|---------|----------|
| Google Cloud Storage | Asset storage (manifest, narratives, knowledge, audio) | `server.js:26` |
| Google Gemini API | Chat completions, TTS | `server.js:32` |
| Bucket: `grove-assets` | Primary storage | Referenced throughout |

---

## 7. Type System Architecture

### Type Definition Locations

| File | Purpose | Citation |
|------|---------|----------|
| `types.ts` | Core types: `SectionId`, `ChatMessage`, `NarrativeNode` | `types.ts:1-55` |
| `src/types.ts` | Duplicate (legacy?) | Same content |
| `types/engagement.ts` | Engagement bus types | `types/engagement.ts:1-196` |
| `types/lens.ts` | Custom lens & archetype types | `types/lens.ts` |
| `data/narratives-schema.ts` | v2 schema: `Persona`, `Card`, `GlobalSettings` | `data/narratives-schema.ts:1-454` |

### Key Type Definitions

**SectionId Enum** (`types.ts:1-10`):
```typescript
export enum SectionId {
  STAKES = 'stakes',
  RATCHET = 'ratchet',
  WHAT_IS_GROVE = 'what_is_grove',
  ARCHITECTURE = 'architecture',
  ECONOMICS = 'economics',
  DIFFERENTIATION = 'differentiation',
  NETWORK = 'network',
  GET_INVOLVED = 'get_involved'
}
```

**RevealType** (`types/engagement.ts:48-54`):
```typescript
export type RevealType =
  | 'simulation'
  | 'customLensOffer'
  | 'terminatorPrompt'
  | 'founderStory'
  | 'conversionCTA'
  | 'journeyCompletion';
```

**NarrativeSchemaV2** (`data/narratives-schema.ts:244-249`):
```typescript
export interface NarrativeSchemaV2 {
  version: "2.0";
  globalSettings: GlobalSettings;
  personas: Record<string, Persona>;
  cards: Record<string, Card>;
}
```

---

## 8. Admin Dashboard Analysis

### Current Admin Architecture

**Access Pattern**: `?admin=true` query parameter

**Tab Structure** (`App.tsx:91`):
```typescript
const [tab, setTab] = useState<'audio' | 'rag' | 'narrative' | 'flags' | 'hubs' | 'engagement'>('narrative');
```

**Components per Tab**:

| Tab | Component | Citation |
|-----|-----------|----------|
| `narrative` | `AdminNarrativeConsole` (v2) | `components/Admin/NarrativeConsole.tsx` |
| `flags` | `FeatureFlagPanel` | `components/Admin/FeatureFlagPanel.tsx` |
| `hubs` | `TopicHubPanel` | `components/Admin/TopicHubPanel.tsx` |
| `audio` | `AdminAudioConsole` | `components/AdminAudioConsole.tsx` |
| `rag` | `AdminRAGConsole` | `components/AdminRAGConsole.tsx` |
| `engagement` | `EngagementConsole` | `components/Admin/EngagementConsole.tsx` |

### Admin Dashboard Styling (Current)

```tsx
// App.tsx:206
<div className="min-h-screen bg-gray-50 p-12 font-sans text-gray-900">
```

Current style: Light mode, gray-50 background, standard sans-serif.

**Target**: Dark mode "holodeck/HUD" aesthetic for Foundation.

---

## 9. Existing Documentation

| File | Purpose | Citation |
|------|---------|----------|
| `CLAUDE.md` | Primary project context | Root |
| `ARCHITECTURE_NOTES.md` | Technical architecture | Root |
| `docs/LOCAL_DEVELOPMENT.md` | Dev setup guide | `docs/LOCAL_DEVELOPMENT.md` |
| `docs/ENGAGEMENT_BUS_INTEGRATION.md` | Engagement bus migration | `docs/ENGAGEMENT_BUS_INTEGRATION.md` |
| `docs/specs/conversion-paths.md` | CTA flow spec | `docs/specs/` |
| `docs/specs/reveal-sequences.md` | Reveal timing spec | `docs/specs/` |

---

## 10. DiaryEntry Component (Journal)

Per instructions:
> "The 'Journal' concept in the brainstorm maps to the existing Diary System. The key component is `components/DiaryEntry.tsx`."

**Current Implementation** (`components/DiaryEntry.tsx:1-29`):

- Static component displaying fictional agent diary entry
- Paper texture styling with cream background
- Uses serif font (`font-serif`)
- Slight rotation effect for "handwritten" feel
- Content: Elena's diary from "Thornwood Village"

**Purpose**: Demonstrates agent community narrative/documentation concept.

---

## 11. Known Technical Debt

| Issue | Location | Impact |
|-------|----------|--------|
| Duplicate `types.ts` | `types.ts` vs `src/types.ts` | Confusion, potential mismatch |
| Deprecated hook | `useRevealState.ts` | Should be removed after migration |
| Client-side API key | `vite.config.ts:35` | Security concern for TTS |
| CDN Tailwind | `index.html:7` | No tree-shaking, limited customization |
| Large monolithic files | `App.tsx:651`, `Terminal.tsx:670+` | Maintenance burden |
| TypeScript errors (39) | Multiple files | Build works but types incorrect |

### Pre-existing TypeScript Errors

The codebase has 39 TypeScript errors that predate this audit. Vite builds successfully because it doesn't enforce strict type checking. Key error categories:

1. **Missing type exports** (`types.ts`):
   - `AudioManifest`, `AudioTrack` not exported
   - Used in `AdminAudioConsole.tsx`, `AudioPlayer.tsx`

2. **Type narrowing issues** (`NarrativeGraphView.tsx`, `NarrativeNodeCard.tsx`):
   - Properties accessed on `unknown` types

3. **String literal type mismatches** (`funnelAnalytics.ts`, `engagementTriggers.ts`):
   - Event type strings not matching defined union types

4. **Module resolution** (`docs/specs/funnel-analytics.ts`):
   - Cannot find module `'../types/lens'`

**Recommendation**: Fix these as part of Sprint 4 cleanup or as a separate tech debt sprint before migration.

---

## 12. Summary: Ready for Migration

### Green Lights (No Blockers)

1. **Clean Git State**: Branch is clean, no uncommitted changes
2. **TypeScript**: Fully typed, ES2022 target
3. **Component Structure**: Reasonable separation exists
4. **Hooks Architecture**: Modern React patterns, singleton for global state
5. **Backend API**: REST endpoints stable and documented

### Required Work

1. **Install `react-router-dom`**: Replace query-param routing
2. **Migrate Tailwind to npm**: Enable proper theming for Foundation
3. **Create Foundation route**: `/foundation` with new layout
4. **Refactor Admin into Foundation**: Port existing consoles to new UI
5. **Extract Core modules**: Share schema/engine between Surface and Foundation
6. **Create design tokens**: Define Foundation's dark-mode palette

### Risk Areas

1. **Terminal.tsx complexity**: 670+ line monolith needs careful handling
2. **CDN→npm Tailwind**: Must preserve all existing styles
3. **localStorage dependencies**: Engagement state persists; migration must not break

---

## Appendix: File-by-File Reference

### Source Files (Key)

| File | Lines | Purpose |
|------|-------|---------|
| `App.tsx` | 651 | Root component, admin dashboard |
| `server.js` | 1025 | Express backend |
| `components/Terminal.tsx` | 670+ | Chat interface |
| `hooks/useEngagementBus.ts` | 497 | Engagement state singleton |
| `data/narratives-schema.ts` | 454 | v2 schema types |
| `types/engagement.ts` | 196 | Engagement types |
| `types.ts` | 55 | Core types |
| `vite.config.ts` | 46 | Build configuration |
| `index.html` | 96 | HTML template + Tailwind CDN |
| `tsconfig.json` | 29 | TypeScript config |
| `package.json` | 29 | Dependencies |

---

*Audit Complete. Proceed to SPEC.md for requirements and architecture.*
