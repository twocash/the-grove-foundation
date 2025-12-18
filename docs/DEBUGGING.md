# Debugging Guide

> Surface vs. Substrate / Foundation Console
> Troubleshooting common issues and data flow analysis

---

## Quick Reference: localStorage Keys

All user state persists in `localStorage`. Clear these to reset:

| Key | Purpose | Module |
|-----|---------|--------|
| `grove-engagement-state` | Engagement metrics (exchanges, journeys, reveals) | `hooks/useEngagementBus.ts:25` |
| `grove-event-history` | Last 100 engagement events | `hooks/useEngagementBus.ts:26` |
| `grove-terminal-lens` | Active lens/persona ID | `hooks/useNarrativeEngine.ts:15` |
| `grove-terminal-session` | Terminal session state | `hooks/useNarrativeEngine.ts:16` |
| `grove-terminal-welcomed` | Has seen welcome message | `components/Terminal.tsx:261` |
| `grove-custom-lenses` | Encrypted custom lens data | `hooks/useCustomLens.ts:13` |
| `grove-lens-key` | AES-256 encryption key | `utils/encryption.ts:10` |
| `grove-streak-data` | Streak tracking data | `hooks/useStreakTracking.ts:10` |
| `grove-reveal-state` | Legacy reveal state | `hooks/useRevealState.ts:13` |
| `grove-session-state` | Legacy session state | `hooks/useRevealState.ts:14` |
| `grove-analytics-events` | Funnel analytics events | `utils/funnelAnalytics.ts:69` |

### Full Reset Command (Browser Console)

```javascript
// Clear all Grove data
Object.keys(localStorage).filter(k => k.startsWith('grove-')).forEach(k => localStorage.removeItem(k));
location.reload();
```

---

## 1. Cards Not Appearing in Chat Flow

### Symptom
User asks questions but suggested follow-up cards don't appear after responses.

### Diagnosis Flow

```
1. Check if schema loaded
   └── Foundation: /foundation/narrative → Cards count should be > 0
   └── Console: window.__NARRATIVE_SCHEMA__ (if exposed)

2. Check if journey active
   └── DevTools → localStorage → grove-terminal-session
   └── Should have: currentThread[], currentPosition

3. Check card connections
   └── Foundation: NarrativeArchitect → Check card's "next" array
   └── Orphaned cards have empty next[]

4. Check persona filtering
   └── Each card has personas[] array
   └── ['all'] = visible to everyone
   └── Otherwise only visible if activeLens matches
```

### Common Causes

| Cause | Fix |
|-------|-----|
| Schema not loaded | Check `/api/narrative` endpoint returns data |
| No active journey | User needs to select a lens first |
| Card has no `next[]` | Edit card in NarrativeArchitect to add connections |
| Persona mismatch | Card's `personas` doesn't include active lens |
| Session state stale | Clear `grove-terminal-session` |

### Key Code Paths

```
Terminal.tsx:handleSendMessage()
  → useNarrativeEngine.ts:handleCardClick()
    → Checks card.personas includes activeLens
    → Updates session.currentThread
    → Returns next cards from card.next[]
```

**Files to check:**
- `components/Terminal.tsx:handleSendMessage` (around line 200-250)
- `hooks/useNarrativeEngine.ts:handleCardClick` (around line 200-250)
- `data/narratives-schema.ts` - Card definitions

---

## 2. Events Not Triggering Reveals

### Symptom
User engages but reveals (simulation, custom lens offer, etc.) never show.

### Diagnosis Flow

```
1. Check engagement state
   └── Foundation: /foundation/engagement → Monitor tab
   └── DevTools: localStorage.getItem('grove-engagement-state')

2. Check reveal triggers
   └── Foundation: /foundation/engagement → Triggers tab
   └── src/core/config/defaults.ts → DEFAULT_TRIGGERS

3. Check reveal queue
   └── Foundation: /foundation/engagement → Reveal Queue panel
   └── Empty queue = no triggers matched

4. Check if already shown
   └── engagement state → revealsShown[]
   └── engagement state → revealsAcknowledged[]
```

### Trigger Conditions Reference

| Reveal | Primary Trigger | Alternative Triggers |
|--------|-----------------|---------------------|
| `simulation` | `journeysCompleted >= 1` | `exchangeCount >= 5` OR `minutesActive >= 3` |
| `customLensOffer` | After simulation acknowledged | `hasCustomLens == false` |
| `terminatorPrompt` | `hasCustomLens == true` | `minutesActive >= 10` |
| `founderStory` | `terminatorModeActive` | `minutesActive >= 15` OR `journeysCompleted >= 2` |
| `journeyCompletion` | `journeysCompleted > 0` | On JOURNEY_COMPLETED event |
| `conversionCTA` | `minutesActive >= 20` | Requires simulation + founderStory acknowledged |

### Debugging Reveal State

```javascript
// In browser console
const state = JSON.parse(localStorage.getItem('grove-engagement-state'));
console.log('Exchange Count:', state.exchangeCount);
console.log('Journeys Completed:', state.journeysCompleted);
console.log('Minutes Active:', state.minutesActive);
console.log('Reveals Shown:', state.revealsShown);
console.log('Reveals Acknowledged:', state.revealsAcknowledged);
```

### Common Causes

| Cause | Fix |
|-------|-----|
| Trigger disabled | Check trigger.enabled in DEFAULT_TRIGGERS |
| Already shown | Clear `revealsShown` array |
| Prerequisite missing | Acknowledge required reveals first |
| State not updating | Check event emission in Terminal |
| Time not tracking | Verify `startTimeTracking()` running |

### Key Code Paths

```
Terminal.tsx
  → useEngagementEmit().exchangeSent()
    → EngagementBusSingleton.emit('EXCHANGE_SENT')
      → processEvent() → updateState()
        → evaluateAndNotify()
          → evaluateTriggers() → revealQueue updated
            → useRevealQueue() re-renders
              → Terminal shows reveal
```

**Files to check:**
- `hooks/useEngagementBus.ts:processEvent` (line 213-310)
- `src/core/engine/triggerEvaluator.ts:evaluateTriggers`
- `src/core/config/defaults.ts:DEFAULT_TRIGGERS`

---

## 3. Streak Information Not Showing

### Symptom
User expects to see streak counter but it's missing.

### Diagnosis Flow

```
1. Check feature flag
   └── Foundation: /foundation/tuner → Feature Flags tab
   └── Look for "streaks-display" flag

2. Check streak data
   └── DevTools: localStorage.getItem('grove-streak-data')
   └── Should have: currentStreak, longestStreak, lastVisitDate

3. Check component render
   └── Streak displays in Terminal header
   └── Component: StreakCounter (if exists)
```

### Streak Logic

```typescript
// hooks/useStreakTracking.ts
- Streak increments on daily return
- Resets if > 24 hours between visits
- Stored as: { currentStreak, longestStreak, lastVisitDate }
```

### Common Causes

| Cause | Fix |
|-------|-----|
| Feature flag off | Enable `streaks-display` in RealityTuner |
| No streak data | Visit and return next day to start streak |
| Component not rendered | Check Terminal.tsx renders StreakCounter |
| Date parsing issue | Ensure `lastVisitDate` is valid ISO string |

**Files to check:**
- `hooks/useStreakTracking.ts`
- `hooks/useFeatureFlags.ts`
- `components/Terminal.tsx` (streak display location)

---

## 4. Custom Lens Not Saving

### Symptom
User creates custom lens but it doesn't persist.

### Diagnosis Flow

```
1. Check encryption key
   └── DevTools: localStorage.getItem('grove-lens-key')
   └── Must exist for encryption to work

2. Check lens data
   └── DevTools: localStorage.getItem('grove-custom-lenses')
   └── Should be encrypted JSON

3. Check wizard completion
   └── Did wizard complete all steps?
   └── Check for errors in console

4. Check API call
   └── Network tab: POST /api/generate-lens
   └── Should return 3 lens options
```

### Custom Lens Flow

```
PrivacyStep → InputSteps (5) → GeneratingStep → SelectStep → ConfirmStep
                                    │
                                    ▼
                            POST /api/generate-lens
                                    │
                                    ▼
                            Returns LensCandidate[3]
                                    │
                                    ▼
                            User selects one
                                    │
                                    ▼
                            useCustomLens.saveLens()
                                    │
                                    ▼
                            Encrypted to localStorage
```

### Common Causes

| Cause | Fix |
|-------|-----|
| No encryption key | Clear `grove-lens-key`, will regenerate |
| API key missing | Check GEMINI_API_KEY in environment |
| Wizard error | Check browser console for exceptions |
| Storage full | Clear other localStorage data |

**Files to check:**
- `hooks/useCustomLens.ts:saveLens` (line 120-160)
- `utils/encryption.ts`
- `components/Terminal/CustomLensWizard/`
- `server.js` - `/api/generate-lens` endpoint

---

## 5. Foundation Console Not Loading

### Symptom
Navigate to `/foundation` but see loading state or blank screen.

### Diagnosis Flow

```
1. Check route
   └── URL should be /foundation or /foundation/*
   └── Not ?admin=true (legacy, should redirect)

2. Check lazy loading
   └── Network tab: Foundation chunks loading?
   └── Should see: FoundationLayout-*.js

3. Check for errors
   └── Browser console for JS errors
   └── Common: import resolution failures

4. Check API connectivity
   └── Network tab: /api/* calls succeeding?
```

### Common Causes

| Cause | Fix |
|-------|-----|
| Build error | Run `npm run build` and check for errors |
| Import path wrong | Check imports use correct aliases |
| Route not matched | Verify routes.tsx configuration |
| Server not running | Start server on port 8080 |

**Files to check:**
- `src/router/routes.tsx`
- `src/foundation/layout/FoundationLayout.tsx`
- `vite.config.ts` - alias configuration
- `tsconfig.json` - path configuration

---

## 6. Topic Routing Not Working

### Symptom
User asks about specific topic but doesn't get curated response.

### Diagnosis Flow

```
1. Test query in Foundation
   └── /foundation/tuner → Topic Routing tab
   └── Use "Test Query Matching" input

2. Check hub configuration
   └── Hub must be enabled
   └── Tags must match query keywords

3. Check priority
   └── Higher priority hubs match first
   └── Multi-word tags score higher

4. Check server-side
   └── server.js uses routeToHub()
   └── Enhanced prompt should appear in logs
```

### Query Matching Algorithm

```
score = 0
for each tag in hub.tags:
  if query.includes(tag):
    score += (word_count * 2)
    if exact_match: score += 5
score *= (hub.priority / 5)
```

### Common Causes

| Cause | Fix |
|-------|-----|
| Hub disabled | Enable in RealityTuner |
| No matching tags | Add relevant keywords to hub.tags |
| Low priority | Increase hub.priority (1-10) |
| Tags too generic | Use multi-word phrases for specificity |

**Files to check:**
- `src/core/engine/topicRouter.ts`
- `src/core/config/defaults.ts:DEFAULT_TOPIC_HUBS`
- `server.js` - chat endpoint

---

## 7. Audio Not Playing

### Symptom
Audio player shows but content doesn't play.

### Diagnosis Flow

```
1. Check manifest
   └── Foundation: /foundation/audio → Library panel
   └── Network: GET /api/manifest

2. Check placement
   └── Placements panel should map slot to track
   └── e.g., deep-dive-main → track_123

3. Check GCS URL
   └── Track should have bucketUrl
   └── URL should be accessible (CORS)

4. Check browser
   └── Autoplay policies may block
   └── Check for audio element errors
```

### Common Causes

| Cause | Fix |
|-------|-----|
| No manifest | Check GCS bucket connectivity |
| No placement | Assign track to placement slot |
| CORS blocked | Configure GCS bucket CORS |
| Invalid WAV | Regenerate audio with correct headers |

**Files to check:**
- `components/AudioPlayer.tsx`
- `src/foundation/consoles/AudioStudio.tsx`
- `services/audioService.ts`
- `server.js` - `/api/manifest` endpoint

---

## 8. Testing the Full Pipeline

### Manual Test Checklist

```
□ 1. Fresh State Test
  - Clear all localStorage
  - Refresh page
  - Verify welcome message shows

□ 2. Lens Selection Test
  - Click lens picker
  - Select a persona
  - Verify journey cards appear

□ 3. Exchange Test
  - Send a message
  - Verify response streams
  - Verify follow-up cards appear
  - Check engagement state updated

□ 4. Journey Completion Test
  - Complete a thread (3-5 cards)
  - Verify JOURNEY_COMPLETED fires
  - Check journeysCompleted increments

□ 5. Reveal Trigger Test
  - After journey: simulation reveal should appear
  - Accept/dismiss and verify state updates
  - Check revealsShown includes type

□ 6. Topic Routing Test
  - Ask about "ratchet effect"
  - Verify response includes key points
  - Check expert framing in response

□ 7. Streak Test
  - Note current streak
  - Return next day
  - Verify streak incremented

□ 8. Foundation Access Test
  - Navigate to /foundation
  - Verify all 5 consoles load
  - Check metrics display correctly
```

### Automated Checks (Browser Console)

```javascript
// Check engagement health
const state = JSON.parse(localStorage.getItem('grove-engagement-state') || '{}');
console.log('Session ID:', state.sessionId);
console.log('Minutes Active:', state.minutesActive);
console.log('Exchange Count:', state.exchangeCount);
console.log('Journeys:', state.journeysStarted, '/', state.journeysCompleted);
console.log('Reveals Shown:', state.revealsShown);
console.log('Active Lens:', state.activeLensId);

// Check event history
const history = JSON.parse(localStorage.getItem('grove-event-history') || '[]');
console.log('Event Count:', history.length);
console.log('Recent Events:', history.slice(-5).map(e => e.type));

// Check session
const session = JSON.parse(localStorage.getItem('grove-terminal-session') || '{}');
console.log('Current Thread:', session.currentThread);
console.log('Position:', session.currentPosition);
console.log('Visited Cards:', session.visitedCards?.length || 0);
```

---

## 9. Production Debugging

### Cloud Run Logs

```bash
# View recent logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=the-grove" --limit=100

# Stream logs
gcloud alpha run services logs tail the-grove --project=YOUR_PROJECT
```

### Common Production Issues

| Issue | Check |
|-------|-------|
| 500 errors | Server logs for exceptions |
| Slow responses | Gemini API latency |
| Missing data | GCS bucket access |
| CORS errors | Cloud Run headers |

### Health Checks

```bash
# API health
curl https://YOUR_URL/api/manifest
curl https://YOUR_URL/api/narrative
curl https://YOUR_URL/api/context
```

---

## 10. Architecture Quick Reference

### Data Flow: User Message → Response

```
User types message
       │
       ▼
Terminal.tsx:handleSendMessage()
       │
       ▼
chatService.ts:streamChat()
       │
       ▼
POST /api/chat (server.js)
       │
       ├─► routeToHub() → Match topic
       │
       ├─► buildHubEnhancedPrompt() → Add expert framing
       │
       ├─► Gemini API → Generate response
       │
       ▼
Stream response to client
       │
       ▼
Terminal updates messages
       │
       ▼
useEngagementEmit().exchangeSent()
       │
       ▼
EngagementBus.emit('EXCHANGE_SENT')
       │
       ▼
State updates → Trigger evaluation → Reveal queue
```

### State Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     localStorage                             │
├─────────────────────────────────────────────────────────────┤
│  grove-engagement-state  ←─┬─→  useEngagementBus            │
│  grove-event-history     ←─┘                                │
│                                                             │
│  grove-terminal-lens     ←─┬─→  useNarrativeEngine          │
│  grove-terminal-session  ←─┘                                │
│                                                             │
│  grove-custom-lenses     ←───→  useCustomLens               │
│  grove-lens-key          ←───→  utils/encryption            │
│                                                             │
│  grove-streak-data       ←───→  useStreakTracking           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        GCS Bucket                           │
├─────────────────────────────────────────────────────────────┤
│  manifest.json     ←───→  /api/manifest                     │
│  narratives.json   ←───→  /api/narrative                    │
│  knowledge/*.md    ←───→  /api/context                      │
│  audio/*.wav       ←───→  (direct URLs)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Appendix: Event Types Reference

| Event | Payload | State Update |
|-------|---------|--------------|
| `EXCHANGE_SENT` | `{ query, responseLength, cardId? }` | `exchangeCount++` |
| `JOURNEY_STARTED` | `{ lensId, threadLength }` | `journeysStarted++, activeJourney set` |
| `JOURNEY_COMPLETED` | `{ lensId, durationMinutes, cardsVisited }` | `journeysCompleted++, activeJourney null` |
| `TOPIC_EXPLORED` | `{ topicId, topicLabel }` | `topicsExplored.push()` |
| `CARD_VISITED` | `{ cardId, cardLabel, fromCard? }` | `cardsVisited.push()` |
| `LENS_SELECTED` | `{ lensId, isCustom, archetypeId? }` | `activeLensId, hasCustomLens` |
| `REVEAL_SHOWN` | `{ revealType }` | `revealsShown.push()` |
| `REVEAL_DISMISSED` | `{ revealType, action }` | `revealsAcknowledged.push()` |
| `TIME_MILESTONE` | `{ minutes }` | (no state change, triggers evaluation) |

---

## 11. V2.1 Schema Migration Issues

> **Case Study (2025-12-18):** CognitiveBridge "Start Journey" button clicked but nothing happened.

### The Problem Chain

When migrating from V2.0 to V2.1 schema format, we encountered a cascading failure:

```
1. Schema validation silently failed (isV2Schema returned false)
   └── V2.1 has journeys/nodes, not personas/cards
   └── Old isV2Schema only checked for personas/cards

2. Hook received null schema
   └── useNarrativeEngine saw !isV2Schema → returned null
   └── CognitiveBridge.onAccept got schema?.journeys = undefined

3. First fix applied to WRONG FILE
   └── Fixed src/core/schema/narrative.ts
   └── But hooks import from data/narratives-schema.ts!
   └── Production unchanged despite "successful" deploy

4. Second fix caused production crash
   └── isV2Schema now returned true for V2.1
   └── BUT hook methods still did Object.values(schema.cards)
   └── V2.1 has cards=undefined → "Cannot convert undefined to object"
```

### V2.0 vs V2.1 Schema Structure

| Field | V2.0 | V2.1 |
|-------|------|------|
| `version` | "2.0" | "2.1" |
| `personas` | Required | Optional/undefined |
| `cards` | Required | Optional/undefined |
| `journeys` | N/A | Required |
| `nodes` | N/A | Required |
| `hubs` | N/A | Required |

### The Two Schema Files Problem

**CRITICAL:** There are TWO copies of schema definitions:

| File | Used By | Purpose |
|------|---------|---------|
| `src/core/schema/narrative.ts` | Foundation consoles | Core types (NOT used by Terminal) |
| `data/narratives-schema.ts` | `useNarrativeEngine.ts` | Runtime validation (USED by Terminal) |

The `useNarrativeEngine` hook imports from `data/narratives-schema.ts`:
```typescript
import { isV2Schema, ... } from '../data/narratives-schema';
```

**Any schema fixes MUST update `data/narratives-schema.ts` to affect Terminal behavior.**

### Required Null Checks for V2.1

When schema is V2.1, these fields are `undefined`:
- `schema.personas`
- `schema.cards`

All hook methods must guard against this:

```typescript
// BAD - crashes on V2.1
const getCard = (cardId: string) => {
  return schema.cards[cardId];  // TypeError!
};

// GOOD - handles V2.1
const getCard = (cardId: string) => {
  if (!schema?.cards) return undefined;
  return schema.cards[cardId];
};
```

### Affected Methods in useNarrativeEngine.ts

| Method | V2.0 Assumption | V2.1 Fix |
|--------|-----------------|----------|
| `getPersona()` | `schema.personas[id]` | `schema.personas?.[id] ?? DEFAULT_PERSONAS[id]` |
| `getCard()` | `schema.cards[id]` | `if (!schema?.cards) return undefined` |
| `getPersonaCards()` | `Object.values(schema.cards)` | `if (!schema?.cards) return []` |
| `getEntryPoints()` | `schema.personas[id]` | `if (schema.personas)` check |
| `getNextCards()` | `schema.cards[id]` | `if (!schema?.cards) return []` |
| `getSectionCards()` | `Object.values(schema.cards)` | `if (!schema?.cards) return []` |
| `getSuggestedThread()` | `schema.personas[id]` | `schema.personas?.[id]` |

### Console Debug Output

When investigating V2.1 issues, check console for:

```javascript
// Schema validation logging (added in fix)
[Schema] isV2Schema checking: {
  version: "2.1",
  hasJourneys: true,
  hasNodes: true,
  hasPersonas: false,
  hasCards: false
}

// CognitiveBridge journey lookup
[CognitiveBridge] onAccept clicked {
  journeyId: "ratchet-journey",
  schemaHasJourneys: true,  // Should be true for V2.1
  schemaHasNodes: true,     // Should be true for V2.1
  journeyKeys: ["ratchet-journey", ...],
  nodeKeys: ["ratchet-entry", ...]
}
```

### Quick Fix Checklist

When V2.1 schema issues occur:

```
□ 1. Verify schema version from API
   curl https://grove-foundation-....run.app/api/narrative | jq '.version'

□ 2. Check CORRECT schema file has fix
   data/narratives-schema.ts (NOT src/core/schema/narrative.ts)

□ 3. Check isV2Schema handles both versions
   Look for: if (obj.version === "2.1") { ... }

□ 4. Check all Object.values() calls have null guards
   grep -n "Object.values(schema" hooks/useNarrativeEngine.ts

□ 5. Verify build hash changed
   curl -s https://... | grep -o 'index-[A-Za-z0-9_-]*\.js'
```

### Prevention: Type Safety

The ideal fix is to make TypeScript enforce null checks:

```typescript
// In NarrativeSchemaV2 type definition:
interface NarrativeSchemaV2 {
  version: "2.0" | "2.1";
  globalSettings: GlobalSettings;
  // V2.0 fields - optional in V2.1
  personas?: Record<string, Persona>;
  cards?: Record<string, Card>;
  // V2.1 fields - optional in V2.0
  journeys?: Record<string, Journey>;
  nodes?: Record<string, JourneyNode>;
  hubs?: Record<string, TopicHub>;
}
```

This makes all field access require `?.` operator, catching issues at compile time.

---

*Last Updated: 2025-12-18 | V2.1 Schema Migration*
