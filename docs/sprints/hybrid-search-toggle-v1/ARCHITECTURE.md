# Architecture — hybrid-search-toggle-v1

## Overview

A simple feature flag toggle that propagates through the chat service layer to enable/disable hybrid search at the RAG pipeline level.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  /explore Header (KineticHeader.tsx)                                         │
│  ┌──────────────────┐  ┌─────────────┐  ┌───────────────┐  ┌──────────────┐ │
│  │ Explore The Grove│  │ Stage Badge │  │ [RAG] Toggle  │  │ Lens Pill ▾  │ │
│  └──────────────────┘  └─────────────┘  └───────┬───────┘  └──────────────┘ │
└─────────────────────────────────────────────────┼───────────────────────────┘
                                                  │
                                                  │ onHybridSearchToggle(boolean)
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  ExploreShell.tsx                                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ const [useHybridSearch, setUseHybridSearch] = useState(() =>            ││
│  │   localStorage.getItem('grove-hybrid-search') === 'true'                ││
│  │ );                                                                       ││
│  └──────────────────────────────────┬──────────────────────────────────────┘│
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                                      │ Pass to useKineticStream options
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  useKineticStream.ts                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ sendMessageStream(query, onChunk, {                                     ││
│  │   personaTone: lensId,                                                  ││
│  │   useHybridSearch: options.useHybridSearch  // NEW                      ││
│  │ })                                                                       ││
│  └──────────────────────────────────┬──────────────────────────────────────┘│
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                                      │ Include in request body
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  chatService.ts                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ interface ChatOptions {                                                  ││
│  │   sessionId?: string;                                                   ││
│  │   personaTone?: string;                                                 ││
│  │   useHybridSearch?: boolean;  // NEW                                    ││
│  │ }                                                                        ││
│  │                                                                          ││
│  │ fetch('/api/chat', {                                                    ││
│  │   body: JSON.stringify({                                                ││
│  │     ...requestBody,                                                     ││
│  │     useHybridSearch: options.useHybridSearch ?? false                   ││
│  │   })                                                                     ││
│  │ })                                                                       ││
│  └──────────────────────────────────┬──────────────────────────────────────┘│
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                                      │ HTTP POST /api/chat
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  server.js /api/chat (ALREADY WIRED)                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ const { useHybridSearch = false } = req.body;                           ││
│  │ fetchRagContextKinetic(message, { useHybrid: useHybridSearch })         ││
│  └──────────────────────────────────┬──────────────────────────────────────┘│
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                                      │ (Already complete from previous sprint)
                                      ▼
                            searchDocumentsHybrid()
```

## DEX Stack Design

### Configuration Layer
This feature does NOT use configuration—it's a user preference toggle, not domain config. This is acceptable per Pattern 2 notes: "Simple feature flags don't require XState."

### Engine Layer
N/A—direct prop drilling from UI → service → backend.

### Behavior Layer
Users see a small toggle in the header. ON = hybrid search. OFF = basic vector search.

## Data Structures

### ChatOptions Extension
```typescript
// services/chatService.ts
interface ChatOptions {
  sessionId?: string;
  sectionContext?: string;
  personaTone?: string;
  personaBehaviors?: PersonaBehaviors;
  verboseMode?: boolean;
  terminatorMode?: boolean;
  journeyId?: string;
  useHybridSearch?: boolean;  // NEW: Enable hybrid RAG search
}
```

### KineticHeader Props Extension
```typescript
// KineticHeader.tsx
interface KineticHeaderProps {
  // ... existing props
  useHybridSearch?: boolean;           // NEW: Current toggle state
  onHybridSearchToggle?: () => void;   // NEW: Toggle callback
}
```

## File Organization
```
src/
├── surface/components/KineticStream/
│   ├── KineticHeader.tsx       ← MODIFY: Add toggle UI
│   ├── ExploreShell.tsx        ← MODIFY: Add state, pass to header + stream
│   └── hooks/
│       └── useKineticStream.ts ← MODIFY: Accept + pass hybrid flag
│
services/
└── chatService.ts              ← MODIFY: Add useHybridSearch to interface + body
```

## Test Architecture

### Test Categories
| Category | Location | Purpose |
|----------|----------|---------|
| E2E | `tests/e2e/explore-hybrid-toggle.spec.ts` | Verify toggle renders, persists |

### Behavior Tests Needed
| User Action | Expected Outcome | Test File |
|-------------|------------------|-----------|
| Load /explore | Toggle visible in header | explore-hybrid-toggle.spec.ts |
| Click toggle | State changes, localStorage updated | explore-hybrid-toggle.spec.ts |
| Refresh page | Toggle retains previous state | explore-hybrid-toggle.spec.ts |

## API Contracts

### /api/chat (Extended)
- **Method:** POST
- **Path:** /api/chat
- **Request:** 
```json
{
  "message": "string",
  "sessionId": "string?",
  "useHybridSearch": "boolean?"  // NEW
}
```
- **Response:** Unchanged (SSE stream)

## Integration Points

1. **KineticHeader** receives toggle state and callback from ExploreShell
2. **ExploreShell** owns state, syncs to localStorage, passes to useKineticStream
3. **useKineticStream** passes flag in ChatOptions to sendMessageStream
4. **chatService** includes flag in POST body
5. **server.js** already reads flag and passes to fetchRagContextKinetic
