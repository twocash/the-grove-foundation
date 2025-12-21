# Repository Audit — Knowledge Architecture Rationalization

## Stack
- **Framework:** React 18 + Express.js
- **Language:** TypeScript (frontend), JavaScript (server)
- **Build:** Vite (frontend), Node.js (server)
- **Storage:** Google Cloud Storage (GCS)
- **Package Manager:** npm

## Build Commands
```bash
npm run dev      # Development server (both frontend + backend)
npm run build    # Production build
npm start        # Production server
```

## Key Locations

| Concern | File | Lines | Notes |
|---------|------|-------|-------|
| **Unified Registry** | `data/narratives.json` | 1-773 | Single file conflating 8+ concerns |
| **RAG Context Loading** | `server.js` | 1098-1230 | `fetchRagContext()` implementation |
| **Hub Tag Routing** | `server.js` | 1060-1096 | `routeQueryToHub()` function |
| **File Path Resolution** | `server.js` | 1040-1058 | `resolveFilePath()` w/ gcsFileMapping |
| **Legacy Topic Hubs** | `server.js` | 525-578 | `DEFAULT_TOPIC_HUBS` array |
| **Default Settings** | `server.js` | 572-580 | `DEFAULT_GLOBAL_SETTINGS_V2` |
| **KB CLI Utility** | `scripts/kb.js` | 1-459 | Local export/inspection tool |
| **Journey Builder Guide** | `docs/JOURNEY_BUILDER_GUIDE.md` | 1-334 | Content creation documentation |

## The Core Problem: Conflated Abstractions

`narratives.json` currently mixes **8 distinct concerns** in one 773-line file:

### 1. Presentation Layer (lines 6-146)
- `lensRealities` — Persona-specific messaging
- `defaultReality` — Fallback messaging
- **Concern:** Marketing/copy that changes frequently

### 2. Feature Configuration (lines 147-179)
- `globalSettings.featureFlags` — Runtime toggles
- **Concern:** Deployment configuration

### 3. Legacy Topic Hubs (lines 180-275)
- `globalSettings.topicHubs` — Old hub format with `expertFraming`, `keyPoints`
- **Concern:** Prompt engineering (now superseded but still loaded)

### 4. Default Context (lines 320-328)
- `defaultContext` — Tier 1 RAG files
- **Concern:** Infrastructure configuration

### 5. File Mapping (lines 329-343)
- `gcsFileMapping` — Notion export filename translation
- **Concern:** Infrastructure abstraction

### 6. Knowledge Hubs (lines 345-412)
- `hubs` — Tier 2 RAG gravitational centers
- **Concern:** Semantic topology

### 7. Journey Definitions (lines 414-480)
- `journeys` — Narrative path metadata
- **Concern:** Exploration graph topology

### 8. Node Definitions (lines 481-773)
- `nodes` — Individual waypoints with queries/context
- **Concern:** Content + topology (should be separated)

## Discovered Inconsistencies

### Issue 1: Duplicate Hub Concepts
```
globalSettings.topicHubs[n]  ←→  hubs[id]
```
- `topicHubs` is an array with `priority`, `expertFraming`, `keyPoints`
- `hubs` is an object keyed by ID with `path`, `primaryFile`, `tags`
- **Both claim to define the same hubs** (ratchet-effect, infrastructure-bet, etc.)
- `topicHubs` appears unused in RAG loading but still in schema

### Issue 2: Inconsistent Hub Path Patterns
```json
"meta-philosophy": { "path": "hubs/meta-philosophy/" }
"infrastructure-bet": { "path": "hubs/infrastructure-bet/" }
"translation-emergence": { "path": "knowledge/" }  // ← Different!
```
- Most hubs use `hubs/{hub-id}/` pattern
- `translation-emergence` uses generic `knowledge/` path

### Issue 3: Orphan Journey (No Hub)
```json
"architecture": { "linkedHubId": null }
```
- `architecture` journey has no linked hub
- Falls back to Discovery Mode which may not find relevant content

### Issue 4: Missing Hub for Technical Architecture
- `technical-architecture.md` exists in `gcsFileMapping`
- No `technical-architecture` hub defined in `hubs`
- Content exists but has no gravitational field

### Issue 5: Tag Sparse Hubs
```json
"diary-system": { "tags": ["diary", "memory", "narrative"] }  // Only 3
"ratchet-effect": { "tags": [...9 tags...] }  // Rich
```
- Some hubs have 3 tags, others have 9+
- Discovery Mode accuracy depends on tag richness

## RAG Loading Architecture (Current State)

```
User Query
    │
    ├─── Journey Active? ──┐
    │         │            │
    │    [Deterministic]   │
    │         │            │
    │    linkedHubId       │
    │         │            │
    │         ▼            │
    │    Load Hub Content  │
    │                      │
    └─── No Journey ───────┘
              │
         [Discovery]
              │
         Tag Match Query
              │
              ▼
         Load Best Hub
```

### Tier 1: Default Context (Always Loaded)
- Budget: 15KB
- Files: `grove-overview.md`, `key-concepts.md`, `visionary-narrative.md`
- Path: `_default/`

### Tier 2: Hub Context (Conditionally Loaded)
- Budget: 50KB per hub
- Loaded via: `linkedHubId` (deterministic) or tag match (discovery)
- Primary + supporting files per hub

## File Dependencies

```
narratives.json
    │
    ├── gcsFileMapping ──────────► GCS Bucket Files
    │
    ├── defaultContext.files ───► _default/*.md
    │
    ├── hubs[].primaryFile ─────► hubs/{id}/*.md
    │                             knowledge/*.md (inconsistent)
    │
    ├── journeys[].linkedHubId ─► hubs[id]
    │
    └── nodes[].journeyId ──────► journeys[id]
```

## Technical Debt Summary

| Debt Item | Severity | Location |
|-----------|----------|----------|
| Dual hub definitions (`topicHubs` vs `hubs`) | High | narratives.json:180-275, 345-412 |
| Inconsistent hub paths | Medium | narratives.json:400-410 |
| Orphan `architecture` journey | Medium | narratives.json:462-468 |
| Missing `technical-architecture` hub | Medium | narratives.json |
| Sparse tags on some hubs | Low | narratives.json:389-394 |
| No schema validation | Medium | server.js |
| 8 concerns in 1 file | High | narratives.json |

## Key Insight: The Meta-Problem

The current architecture violates Grove's own thesis:

> "Exploration architecture is to the age of AI what information architecture was to the internet."

The knowledge system that powers the Terminal's exploration architecture is itself:
- **Poorly structured** — 8 concerns conflated
- **Undocumented** — No schema definition
- **Self-contradicting** — Dual hub concepts
- **Not declarative** — Relationships implicit

**The fix should make the architecture self-documenting** — the schema should explain itself, the relationships should be explicit, and the separation of concerns should mirror the conceptual separation in the domain.
