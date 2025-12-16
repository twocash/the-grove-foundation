# Architecture Notes for Sprint 7

## Storage Layer

### System Settings Storage
- **Location**: Google Cloud Storage (GCS) bucket `grove-assets`
- **Files stored**:
  - `manifest.json` - Audio CMS data
  - `narratives.json` - Narrative graph (v2 schema with personas, cards, globalSettings)
  - `knowledge/*.md` - RAG knowledge base documents
  - `audio/*.wav` - Generated audio files

### API Endpoints for Reading/Writing Settings
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/narrative` | Fetch narratives.json (includes personas, cards, globalSettings) |
| POST | `/api/admin/narrative` | Save narrative graph to GCS |
| GET | `/api/context` | Fetch combined RAG context |
| GET | `/api/admin/knowledge` | List knowledge files |
| GET | `/api/manifest` | Fetch audio manifest |
| POST | `/api/admin/manifest` | Save audio manifest |

### User-Local Storage (NOT system settings)
- `grove-terminal-lens` - Active lens ID
- `grove-terminal-session` - Session state (thread, position, visitedCards)
- `grove-terminal-welcomed` - First-time welcome flag
- `grove-reveal-state` - Reveal progression state
- `grove-extended-session` - Extended session with time tracking
- Custom lens data via `useCustomLens` hook (encrypted in localStorage)

---

## Admin Access

### Admin Check Location
- `App.tsx:20-27` - Checks `?admin=true` query parameter
- Sets `isAdmin` state which conditionally renders `AdminDashboard`

### Existing Admin UI
- **AdminDashboard** component in `App.tsx:88-127`
- Three existing tabs:
  1. **Narrative Engine** (`AdminNarrativeConsole`)
  2. **Audio Studio** (`AdminAudioConsole`)
  3. **Knowledge Base** (`AdminRAGConsole`)

### Admin Components
- `components/Admin/NarrativeConsole.tsx` - Three-column layout: Navigation | Card Grid | Editor
- `components/Admin/CardEditor.tsx` - Edit individual cards
- `components/Admin/PersonaSettings.tsx` - Edit persona configuration
- `components/Admin/GlobalSettingsModal.tsx` - Global settings editor

---

## Persona System

### Persona Definitions
- **Default personas**: `data/default-personas.ts` - 6 core personas
- **Schema types**: `data/narratives-schema.ts` - Persona, Card, GlobalSettings interfaces
- **Server-side defaults**: `server.js:201-299` - DEFAULT_PERSONAS_V2, DEFAULT_GLOBAL_SETTINGS_V2

### Persona Data Structure (from narratives-schema.ts)
```typescript
interface Persona {
  id: string;
  publicLabel: string;
  description: string;
  icon: string;                   // Lucide icon name
  color: PersonaColor;            // emerald|amber|blue|rose|slate|violet
  enabled: boolean;

  // Narrative configuration
  toneGuidance: string;           // Injected into LLM prompt
  narrativeStyle: NarrativeStyle; // evidence-first|stakes-heavy|mechanics-deep|resolution-oriented
  arcEmphasis: ArcEmphasis;       // hook|stakes|mechanics|evidence|resolution (1-4 each)
  openingPhase: OpeningPhase;     // hook|stakes|mechanics
  defaultThreadLength: number;    // 3-10 cards per journey

  // Journey configuration
  entryPoints: string[];          // Card IDs shown at journey start
  suggestedThread: string[];      // Manual or AI-generated sequence
}
```

### Prompt Configuration
- **toneGuidance** is injected into the LLM prompt via `Terminal.tsx:471-478`
- Format: `[Apply this persona guidance: ${activeLensData.toneGuidance}]`
- Used in: `geminiService.ts` via `sendMessageStream`

---

## Journey/Card System

### Journey Data Structure
- Cards defined in `narratives.json` under `cards` key
- Schema in `data/narratives-schema.ts`:
```typescript
interface Card {
  id: string;
  label: string;           // User-facing question/prompt button text
  query: string;           // LLM prompt instruction
  contextSnippet?: string; // RAG context injected
  sectionId?: SectionId;   // Grouping (stakes, architecture, etc.)
  next: string[];          // Connected card IDs for journey flow
  personas: string[];      // Which lenses see this card (or ['all'])
  sourceDoc?: string;      // RAG source reference
  isEntry?: boolean;       // Is this a starting point?
}
```

### Thread Generation
- `utils/threadGenerator.ts` - Generates optimal thread sequence based on persona
- `generateThread(personaId, schema)` - Creates ordered card sequence
- Cards scored by `scoreCardForPersona()` based on arcEmphasis alignment
- Ordered by narrative arc (hook -> stakes -> mechanics -> evidence -> resolution)

### SUGGESTED INQUIRY Component
- In `Terminal.tsx:723-743` - Fallback suggestion when no narrative nodes
- Shows `dynamicSuggestion` from breadcrumb extraction
- TO BE REPLACED with JourneyCard showing progress

### Journey Progress Tracking
- `useNarrativeEngine.ts` handles:
  - `currentThread: string[]` - Card IDs in current journey
  - `currentPosition: number` - Index in thread
  - `visitedCards: string[]` - For "don't repeat" logic
- Stored in localStorage via session persistence

---

## Hooks Directory Structure

| Hook | Purpose |
|------|---------|
| `useNarrative.ts` | Legacy v1 hook for backwards compatibility |
| `useNarrativeEngine.ts` | Primary v2 hook - lens selection, card filtering, session persistence |
| `useCustomLens.ts` | Custom lens CRUD with encrypted localStorage |
| `useRevealState.ts` | Reveal progression state management |

---

## Patterns to Follow

### Adding New System Settings
1. Add field to appropriate interface in `data/narratives-schema.ts`
2. Add to DEFAULT_GLOBAL_SETTINGS or DEFAULT_PERSONAS
3. Server returns it via `/api/narrative`
4. Admin UI edits via `NarrativeConsole.tsx` or `GlobalSettingsModal.tsx`
5. Save via POST `/api/admin/narrative`

### Adding New Admin Tab
1. Create component in `components/Admin/`
2. Export from `components/Admin/index.ts`
3. Add tab button in `AdminDashboard` (App.tsx:99-119)
4. Add conditional render (App.tsx:122-124)

### Creating New Hooks
1. Create file in `hooks/`
2. Use localStorage for user-local data
3. Use fetch('/api/narrative') for system settings
4. Follow existing patterns (useState, useEffect, useCallback)

---

## Sprint 7 Implementation Summary (COMPLETED)

### Feature Flags (7A) - DONE
- Added `FeatureFlag` interface to `data/narratives-schema.ts`
- Added `featureFlags` array to GlobalSettings
- Created `hooks/useFeatureFlags.ts` hook with `useFeatureFlag()` helper
- Created `components/Admin/FeatureFlagPanel.tsx`
- Added "Flags" tab to AdminDashboard
- Wired `custom-lens-in-picker` flag to LensPicker

Default flags:
- `custom-lens-in-picker` - Show "Create Your Own" in Lens Picker (default: false)
- `journey-ratings` - Show rating prompt after journey completion (default: true)
- `streaks-display` - Show streak counter in header (default: true)
- `feedback-transmission` - Allow anonymous feedback submission (default: true)
- `auto-journey-generation` - Auto-generate journeys for custom personas (default: true)

### Persona Prompt Management (7B) - DONE
- Added `VocabularyLevel`, `EmotionalRegister` types
- Added `PersonaPromptVersion`, `PersonaPromptConfig` interfaces
- Extended `Persona` interface with `systemPrompt`, `openingTemplate`, `vocabularyLevel`, `emotionalRegister`, `promptVersion`
- Added `personaPromptVersions` to GlobalSettings for rollback
- Updated `PersonaSettings.tsx` with:
  - System Prompt Override field
  - Opening Template field
  - Vocabulary Level selector (accessible/technical/academic/executive)
  - Emotional Register selector (warm/neutral/urgent/measured)
  - Version History section with save/rollback functionality
- Added `savePersonaVersion()` and `rollbackPersonaVersion()` in NarrativeConsole

### Topic Hubs (7C) - DONE
- Added `TopicHub` interface to schema
- Added `topicHubs` array to GlobalSettings
- Created `DEFAULT_TOPIC_HUBS` with 3 seed hubs:
  - The Ratchet Effect
  - The $380B Infrastructure Bet
  - The Cognitive Split
- Created `utils/topicRouter.ts` with:
  - `routeToHub()` - Find matching hub for query
  - `getMatchDetails()` - Get all matches with scores
  - `buildHubEnhancedPrompt()` - Inject expert framing
  - `testQueryMatch()` - For admin testing
- Created `components/Admin/TopicHubPanel.tsx` with:
  - Hub list with enable/disable
  - Full hub editor (title, tags, priority, sources, framing, key points)
  - Query test tool
- Added "Topic Hubs" tab to AdminDashboard

### Journey Integration (7D) - DONE
- Created `components/Terminal/JourneyCard.tsx` - Shows journey progress
- Created `components/Terminal/JourneyCompletion.tsx` - Rating flow with consent
- Created `hooks/useStreakTracking.ts` - User-local streak data
- Updated Terminal.tsx:
  - Replaced "SUGGESTED INQUIRY" with JourneyCard
  - Added streak display in header (controlled by feature flag)
  - Integrated streak tracking hooks
- Added feature flag controls for journey features

User-local storage added:
- `grove-streak-data` - Streak tracking (currentStreak, longestStreak, journeysCompleted, totalMinutesActive)

---

## New Admin Tabs (Sprint 7)

The admin dashboard (`?admin=true`) now has 5 tabs:
1. **Narrative Engine** - Personas and cards management
2. **Flags** - Feature flag toggles
3. **Topic Hubs** - Query routing configuration
4. **Audio Studio** - TTS generation
5. **Knowledge Base** - RAG document management

---

## Server-Side Chat Architecture (NEW - Dec 2025)

### Problem Solved
- 413 "Payload Too Large" errors from production API proxy
- API key exposed in client-side bundle (security concern)
- RAG context + system prompt causing oversized payloads

### Architecture Change
**BEFORE**: Frontend → Direct Gemini API (API key in browser)
**AFTER**: Frontend → Server `/api/chat` → Gemini API (API key server-only)

### Chat API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/chat` | Main chat with SSE streaming |
| POST | `/api/chat/init` | Initialize new session (optional) |
| DELETE | `/api/chat/:sessionId` | End session |
| GET | `/api/chat/health` | Health check |

### Chat Request Body
```typescript
{
  message: string;           // User's message
  sessionId?: string;        // Optional - auto-generated if not provided
  sectionContext?: string;   // Current section (e.g., "The Stakes")
  personaTone?: string;      // Active lens toneGuidance
  verboseMode?: boolean;     // Scholar Mode flag
  terminatorMode?: boolean;  // Advanced mode flag
}
```

### SSE Stream Events
```typescript
// Chunk event (during streaming)
{ type: 'chunk', text: string }

// Done event (after completion)
{ type: 'done', sessionId: string, breadcrumb: string | null, topic: string | null }

// Error event
{ type: 'error', error: string, code?: number }
```

### Session Management
- Sessions stored in-memory (Map) on server
- Auto-cleanup after 1 hour of inactivity
- Session includes: chat instance, persona context, last activity timestamp
- New session auto-created on first message if none exists

### Key Files
- `server.js:560-905` - Chat API endpoints and session management
- `services/chatService.ts` - Frontend client for chat API
- `components/Terminal.tsx` - Updated to use chatService

### Security Improvements
- API key no longer embedded in client bundle for chat
- API key still needed client-side for admin TTS (audioService.ts)
- TODO: Move TTS to server-side to eliminate all client-side API key exposure

### Deprecated Files
- `services/geminiService.ts` - Now deprecated for chat (kept for generateArtifact)

---

## Key Files Reference

### Frontend Core
- `App.tsx` - Main app, admin dashboard
- `Terminal.tsx` - Chat interface, lens/journey integration
- `constants.ts` - Static knowledge base, section config

### Services
- `services/chatService.ts` - Server-side chat client (NEW - preferred)
- `services/geminiService.ts` - Direct Gemini (DEPRECATED for chat)
- `services/audioService.ts` - TTS generation (still uses direct Gemini)

### Data Schema
- `types.ts` - Legacy v1 types (SectionId, ChatMessage, NarrativeNode)
- `data/narratives-schema.ts` - v2 schema (Persona, Card, GlobalSettings)
- `data/default-personas.ts` - Default persona configurations
- `types/lens.ts` - Custom lens types

### Backend
- `server.js` - Express API, GCS integration, Chat API

### Admin
- `components/Admin/NarrativeConsole.tsx` - Main admin interface
- `components/Admin/PersonaSettings.tsx` - Persona editor
- `components/Admin/CardEditor.tsx` - Card editor
- `components/Admin/GlobalSettingsModal.tsx` - Global settings

### Hooks
- `hooks/useNarrativeEngine.ts` - Primary narrative state
- `hooks/useCustomLens.ts` - Custom lens management
- `hooks/useRevealState.ts` - Reveal progression

### Test Scripts
- `scripts/test-api-payload.js` - Test Gemini API with various payload sizes
- `scripts/test-proxy-limits.js` - Test server body parser limits

---

## Future Sprint: Server-Side TTS Migration

### Problem
- API key is still exposed client-side for admin TTS generation
- `audioService.ts` directly calls Gemini TTS API from browser
- Security concern: Any user inspecting bundle can see API key

### Proposed Solution

**Move TTS generation to server-side endpoint:**

```
POST /api/admin/generate-audio
Body: { script: string, voiceName?: string }
Response: SSE stream with audio chunks OR direct audio blob
```

### Implementation Plan

#### Phase 1: Server Endpoint
1. Add `/api/admin/generate-audio` endpoint to `server.js`
2. Handle Gemini TTS API call server-side
3. Return audio as base64 or stream chunks
4. Add WAV header construction server-side

#### Phase 2: Update audioService.ts
1. Replace direct Gemini calls with fetch to `/api/admin/generate-audio`
2. Handle streaming audio response
3. Construct Blob from server response

#### Phase 3: Remove Client-Side Key
1. Remove `VITE_GEMINI_API_KEY` from `vite.config.ts`
2. Update `audioService.ts` to not require client-side key
3. Remove legacy `process.env.API_KEY` definitions
4. Update documentation

### API Design

```typescript
// Request
POST /api/admin/generate-audio
{
  script: string;          // Text to convert to speech
  voiceName?: string;      // Gemini voice name (default: 'Aoede')
  sampleRate?: number;     // Default: 24000
}

// Response (non-streaming)
{
  success: true,
  audio: string,           // Base64-encoded WAV
  duration: number,        // Estimated duration in seconds
}

// Response (streaming - alternative)
Content-Type: audio/wav
[Binary WAV data streamed directly]
```

### Files to Modify
- `server.js` - Add TTS endpoint
- `services/audioService.ts` - Replace direct API calls
- `vite.config.ts` - Remove API key exposure
- `components/Admin/AdminAudioConsole.tsx` - May need minor updates

### Success Criteria
- [ ] TTS generation works via server endpoint
- [ ] No API key in client bundle (verify with bundle inspection)
- [ ] Admin audio generation still functional
- [ ] Audio quality unchanged
- [ ] Error handling for TTS failures
