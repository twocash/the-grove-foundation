# Migration Map — Knowledge Architecture Rationalization

## Overview
Split `narratives.json` (773 lines) into domain-specific files while maintaining backward compatibility and enabling schema validation.

## Files to Create

### `data/schema/grove-knowledge-ontology.md`
**Purpose:** Human-readable architecture documentation + RAG content
**Exports:** None (documentation)
**Template:** See ARCHITECTURE.md for full content
**Depends on:** None

---

### `data/exploration/journeys.json`
**Purpose:** Journey definitions (topology only)
**Exports:** `{ journeys: Record<string, Journey> }`
**Content:** Extract from `narratives.json:414-480`
**Depends on:** Schema definition

---

### `data/exploration/nodes.json`
**Purpose:** Node definitions (content + topology)
**Exports:** `{ nodes: Record<string, Node> }`
**Content:** Extract from `narratives.json:481-773`
**Depends on:** journeys.json (for validation)

---

### `data/knowledge/hubs.json`
**Purpose:** Hub definitions (semantic geography)
**Exports:** `{ hubs: Record<string, Hub> }`
**Content:** 
- Extract from `narratives.json:345-412`
- Add new `technical-architecture` hub
- Migrate useful fields from `topicHubs`
**Depends on:** Schema definition

**New Hub to Add:**
```json
"technical-architecture": {
  "id": "technical-architecture",
  "title": "Under the Hood",
  "thesis": "Grove's distributed architecture runs on commodity hardware today.",
  "path": "hubs/technical-architecture/",
  "primaryFile": "technical-architecture.md",
  "status": "active",
  "tags": [
    "architecture",
    "technical",
    "local",
    "cloud",
    "hybrid",
    "7B",
    "ollama",
    "coordination",
    "village"
  ]
}
```

---

### `data/knowledge/default-context.json`
**Purpose:** Tier 1 RAG configuration
**Exports:** `{ path: string, maxBytes: number, files: string[] }`
**Content:** Extract from `narratives.json:320-328`
**Depends on:** None

---

### `data/presentation/lenses.json`
**Purpose:** Persona-specific messaging
**Exports:** `{ lensRealities: Record<string, LensReality>, defaultReality: LensReality }`
**Content:** Extract from `narratives.json:6-146`
**Depends on:** None

---

### `data/infrastructure/gcs-mapping.json`
**Purpose:** Notion export filename translations
**Exports:** `{ gcsFileMapping: Record<string, string> }`
**Content:** Extract from `narratives.json:329-343`
**Depends on:** None

---

### `data/infrastructure/feature-flags.json`
**Purpose:** Runtime toggles
**Exports:** `{ featureFlags: FeatureFlag[] }`
**Content:** Extract from `narratives.json:147-179`
**Depends on:** None

---

### `scripts/validate-knowledge-schema.js`
**Purpose:** Validate all schema files and cross-references
**Exports:** CLI tool
**Template:** 
```javascript
// Validates:
// 1. All JSON files parse correctly
// 2. All journey.hubId references exist in hubs.json
// 3. All journey.entryNode references exist in nodes.json
// 4. All node.journeyId references exist in journeys.json
// 5. All node.primaryNext and alternateNext references exist
// 6. All hub paths follow hubs/{id}/ pattern
```
**Depends on:** All data files

---

## Files to Modify

### `server.js`
**Lines:** 1098-1230 (fetchRagContext area)
**Change Type:** Refactor
**Description:** Update to load from new file structure with fallback

**Before:**
```javascript
async function fetchRagContext(message = '', narratives = null, activeJourneyId = null) {
    if (!narratives || !narratives.hubs) {
        console.log('[RAG] No unified registry, falling back to legacy loader');
        return await fetchRagContextLegacy();
    }
    const { hubs, journeys, defaultContext, gcsFileMapping } = narratives;
    // ... rest of function
}
```

**After:**
```javascript
async function fetchRagContext(message = '', activeJourneyId = null) {
    const config = await loadKnowledgeConfig();
    if (!config) {
        console.log('[RAG] Config load failed, falling back to legacy loader');
        return await fetchRagContextLegacy();
    }
    const { hubs, journeys, defaultContext, gcsMapping } = config;
    // ... rest of function (logic unchanged)
}

async function loadKnowledgeConfig() {
    try {
        // Attempt new structure
        const [hubs, journeys, defaultContext, gcsMapping] = await Promise.all([
            loadJsonFile('knowledge/hubs.json'),
            loadJsonFile('exploration/journeys.json'),
            loadJsonFile('knowledge/default-context.json'),
            loadJsonFile('infrastructure/gcs-mapping.json')
        ]);
        return { hubs: hubs.hubs, journeys: journeys.journeys, defaultContext, gcsMapping: gcsMapping.gcsFileMapping };
    } catch (err) {
        console.log('[RAG] New structure not found, trying unified narratives.json');
        const narratives = await loadJsonFile('narratives.json');
        if (narratives?.hubs) {
            return {
                hubs: narratives.hubs,
                journeys: narratives.journeys,
                defaultContext: narratives.defaultContext,
                gcsMapping: narratives.gcsFileMapping
            };
        }
        return null;
    }
}
```

**Depends on:** New file structure created

---

### `data/narratives.json`
**Lines:** All
**Change Type:** Deprecation marker
**Description:** Add deprecation notice, keep for backward compat

**Add at top:**
```json
{
  "version": "2.2",
  "meta": {
    "labelStyle": "lewis",
    "lastUpdated": "2025-12-21",
    "description": "DEPRECATED: Use split files in data/{exploration,knowledge,presentation,infrastructure}/. This file maintained for backward compatibility only.",
    "deprecated": true,
    "replacedBy": [
      "exploration/journeys.json",
      "exploration/nodes.json",
      "knowledge/hubs.json",
      "knowledge/default-context.json",
      "presentation/lenses.json",
      "infrastructure/gcs-mapping.json",
      "infrastructure/feature-flags.json"
    ]
  },
  // ... rest unchanged for now
}
```

---

### `data/knowledge/hubs.json` (after creation)
**Change:** Update `translation-emergence` path
**Before:**
```json
"translation-emergence": {
  "path": "knowledge/",
```
**After:**
```json
"translation-emergence": {
  "path": "hubs/translation-emergence/",
```

---

### `data/exploration/journeys.json` (after creation)
**Change:** Update `architecture` journey hubId
**Before:**
```json
"architecture": {
  "linkedHubId": null,
```
**After:**
```json
"architecture": {
  "hubId": "technical-architecture",
```

---

## Files to Delete
**None** — `narratives.json` remains as backward-compat shim

---

## GCS Operations Required

### Move Translation Emergence Content
```bash
# In GCS bucket grove-knowledge-v2:
gsutil mv gs://grove-knowledge-v2/knowledge/LLM_Translation_Emergence*.md \
         gs://grove-knowledge-v2/hubs/translation-emergence/
```

### Create Technical Architecture Hub Directory
```bash
gsutil cp gs://grove-knowledge-v2/knowledge/Grove\ Technical\ Architecture*.md \
         gs://grove-knowledge-v2/hubs/technical-architecture/technical-architecture.md
```

**Note:** Verify file mapping in gcs-mapping.json after moves.

---

## Dependency Graph

```
grove-knowledge-ontology.md (documentation)
           │
           ▼
    ┌──────┴───────┐
    │              │
    ▼              ▼
hubs.json    default-context.json
    │              │
    │              │
    ▼              │
journeys.json ─────┘
    │
    ▼
nodes.json
    │
    ▼
server.js (loader)
    │
    ▼
validate-knowledge-schema.js
```

## Execution Order

1. **Create directory structure**
   ```bash
   mkdir -p data/schema data/exploration data/knowledge data/presentation data/infrastructure
   ```

2. **Create schema documentation** (`grove-knowledge-ontology.md`)

3. **Extract hubs** → `knowledge/hubs.json`
   - Include new `technical-architecture` hub
   - Fix `translation-emergence` path

4. **Extract default context** → `knowledge/default-context.json`

5. **Extract journeys** → `exploration/journeys.json`
   - Change `linkedHubId` to `hubId`
   - Fix `architecture` to point to `technical-architecture`

6. **Extract nodes** → `exploration/nodes.json`

7. **Extract lenses** → `presentation/lenses.json`

8. **Extract infrastructure** → `infrastructure/gcs-mapping.json`, `feature-flags.json`

9. **Update server.js** with new loader + fallback

10. **Create validation script**

11. **Run validation** — must pass before deploy

12. **GCS file moves** — translation-emergence, technical-architecture

13. **Mark narratives.json deprecated**

14. **Deploy and verify**

## Rollback Plan

### If new files cause errors:
1. Server.js fallback to `narratives.json` should activate automatically
2. Verify Terminal functions normally
3. Debug new file structure offline

### Full rollback:
```bash
git checkout -- server.js
rm -rf data/schema data/exploration data/knowledge data/presentation data/infrastructure
```
Server will use existing `narratives.json` unchanged.

### Critical files (extra caution):
- `server.js` — RAG loading logic
- `data/knowledge/hubs.json` — Journey routing depends on this
- GCS files — Moving content could break file resolution
