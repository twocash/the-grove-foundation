# Execution Prompt — Knowledge Architecture Rationalization

## Context
Refactor Grove Terminal's knowledge system from a monolithic 773-line `narratives.json` into separated domain-specific files. This enables schema validation, clearer maintenance, and self-documenting architecture. The refactoring must maintain backward compatibility—if new files are missing, the system falls back to the existing unified file.

## Documentation
All sprint documentation is in `docs/sprints/knowledge-architecture-v1/`:
- `REPO_AUDIT.md` — Current state analysis
- `SPEC.md` — Goals and acceptance criteria
- `ARCHITECTURE.md` — Target ontology definition (also becomes RAG content)
- `MIGRATION_MAP.md` — File-by-file change plan
- `DECISIONS.md` — Architectural decision records
- `SPRINTS.md` — Story breakdown

## Repository Intelligence
Key locations:
- Source data: `data/narratives.json` (773 lines)
- RAG loading: `server.js:1098-1230`
- Hub routing: `server.js:1060-1096`
- Existing CLI: `scripts/kb.js`
- Journey guide: `docs/JOURNEY_BUILDER_GUIDE.md`

## Execution Order

### Phase 1: Directory Structure
1. Create directories:
   ```bash
   mkdir -p data/schema data/exploration data/knowledge data/presentation data/infrastructure
   ```
2. Verify directories exist
3. **No build needed** — structure only

### Phase 2: Schema Documentation
1. Copy `ARCHITECTURE.md` content to `data/schema/grove-knowledge-ontology.md`
2. This file becomes both documentation AND RAG content
3. **No build needed** — documentation only

### Phase 3: Knowledge Layer
1. Read `data/narratives.json:345-412` (hubs section)
2. Create `data/knowledge/hubs.json` with:
   - Wrapper: `{ "version": "1.0", "hubs": { ... } }`
   - All existing hubs
   - NEW: `technical-architecture` hub:
     ```json
     "technical-architecture": {
       "id": "technical-architecture",
       "title": "Under the Hood",
       "thesis": "Grove's distributed architecture runs on commodity hardware today.",
       "path": "hubs/technical-architecture/",
       "primaryFile": "technical-architecture.md",
       "status": "active",
       "tags": ["architecture", "technical", "local", "cloud", "hybrid", "7B", "ollama", "village", "coordination"]
     }
     ```
   - FIX: `translation-emergence.path` → `"hubs/translation-emergence/"`

3. Read `data/narratives.json:320-328` (defaultContext)
4. Create `data/knowledge/default-context.json`:
   ```json
   {
     "version": "1.0",
     "path": "_default/",
     "maxBytes": 15000,
     "files": ["grove-overview.md", "key-concepts.md", "visionary-narrative.md"]
   }
   ```

5. Run `npm run build` — verify no errors

### Phase 4: Exploration Layer
1. Read `data/narratives.json:414-480` (journeys section)
2. Create `data/exploration/journeys.json` with:
   - Wrapper: `{ "version": "1.0", "journeys": { ... } }`
   - Rename all `linkedHubId` → `hubId`
   - FIX: `architecture.hubId` → `"technical-architecture"` (was null)

3. Read `data/narratives.json:481-773` (nodes section)
4. Create `data/exploration/nodes.json` with:
   - Wrapper: `{ "version": "1.0", "nodes": { ... } }`
   - All existing nodes unchanged

5. Run `npm run build` — verify no errors

### Phase 5: Presentation Layer
1. Read `data/narratives.json:6-146` (lensRealities + defaultReality)
2. Create `data/presentation/lenses.json` with:
   - Wrapper: `{ "version": "1.0", "lensRealities": { ... }, "defaultReality": { ... } }`

3. Run `npm run build` — verify no errors

### Phase 6: Infrastructure Layer
1. Read `data/narratives.json:329-343` (gcsFileMapping)
2. Create `data/infrastructure/gcs-mapping.json`:
   ```json
   { "version": "1.0", "gcsFileMapping": { ... } }
   ```

3. Read `data/narratives.json:147-179` (featureFlags)
4. Create `data/infrastructure/feature-flags.json`:
   ```json
   { "version": "1.0", "featureFlags": [ ... ] }
   ```

5. Run `npm run build` — verify no errors

### Phase 7: Server Integration
1. Open `server.js`
2. Add new function `loadKnowledgeConfig()` around line 1040:
   ```javascript
   async function loadKnowledgeConfig() {
       try {
           // Try new file structure
           const [hubsData, journeysData, defaultContextData, gcsMappingData] = await Promise.all([
               loadJsonFromGCS('knowledge/hubs.json'),
               loadJsonFromGCS('exploration/journeys.json'),
               loadJsonFromGCS('knowledge/default-context.json'),
               loadJsonFromGCS('infrastructure/gcs-mapping.json')
           ]);
           
           console.log('[RAG] Loaded from new file structure');
           return {
               hubs: hubsData.hubs,
               journeys: journeysData.journeys,
               defaultContext: defaultContextData,
               gcsFileMapping: gcsMappingData.gcsFileMapping
           };
       } catch (err) {
           console.log('[RAG] New structure not found, falling back to narratives.json');
           const narratives = await fetchNarratives();
           if (narratives?.hubs) {
               return {
                   hubs: narratives.hubs,
                   journeys: narratives.journeys,
                   defaultContext: narratives.defaultContext,
                   gcsFileMapping: narratives.gcsFileMapping
               };
           }
           return null;
       }
   }
   
   async function loadJsonFromGCS(path) {
       const file = storage.bucket(BUCKET_NAME).file(path);
       const [content] = await file.download();
       return JSON.parse(content.toString());
   }
   ```

3. Update `fetchRagContext()` to use new loader:
   - Change signature to remove `narratives` parameter
   - Call `loadKnowledgeConfig()` at start
   - Rest of function logic unchanged

4. Run `npm run build` — verify no errors
5. Run `npm run dev` — verify server starts
6. Test RAG loading manually

### Phase 8: Validation Script
1. Create `scripts/validate-knowledge-schema.js`:
   ```javascript
   #!/usr/bin/env node
   const fs = require('fs');
   const path = require('path');
   
   const DATA_DIR = path.join(__dirname, '..', 'data');
   let errors = [];
   
   function loadJson(filePath) {
       try {
           return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filePath), 'utf8'));
       } catch (e) {
           errors.push(`Failed to parse ${filePath}: ${e.message}`);
           return null;
       }
   }
   
   // Load all files
   const hubs = loadJson('knowledge/hubs.json');
   const journeys = loadJson('exploration/journeys.json');
   const nodes = loadJson('exploration/nodes.json');
   
   if (!hubs || !journeys || !nodes) {
       console.error('❌ Failed to load required files');
       process.exit(1);
   }
   
   // Validate journey → hub references
   for (const [id, journey] of Object.entries(journeys.journeys)) {
       if (!journey.hubId) {
           errors.push(`Journey "${id}" has no hubId`);
       } else if (!hubs.hubs[journey.hubId]) {
           errors.push(`Journey "${id}" references non-existent hub "${journey.hubId}"`);
       }
       if (!nodes.nodes[journey.entryNode]) {
           errors.push(`Journey "${id}" has invalid entryNode "${journey.entryNode}"`);
       }
   }
   
   // Validate node → journey references
   for (const [id, node] of Object.entries(nodes.nodes)) {
       if (!journeys.journeys[node.journeyId]) {
           errors.push(`Node "${id}" references non-existent journey "${node.journeyId}"`);
       }
       if (node.primaryNext && !nodes.nodes[node.primaryNext]) {
           errors.push(`Node "${id}" has invalid primaryNext "${node.primaryNext}"`);
       }
   }
   
   // Validate hub paths
   for (const [id, hub] of Object.entries(hubs.hubs)) {
       if (!hub.path.startsWith('hubs/')) {
           errors.push(`Hub "${id}" has non-standard path "${hub.path}"`);
       }
   }
   
   // Report
   if (errors.length > 0) {
       console.error('❌ Schema validation failed:');
       errors.forEach(e => console.error(`  - ${e}`));
       process.exit(1);
   } else {
       console.log('✅ Schema validation passed');
       console.log(`   - ${Object.keys(hubs.hubs).length} hubs`);
       console.log(`   - ${Object.keys(journeys.journeys).length} journeys`);
       console.log(`   - ${Object.keys(nodes.nodes).length} nodes`);
       process.exit(0);
   }
   ```

2. Run: `node scripts/validate-knowledge-schema.js`
3. Must exit with code 0

### Phase 9: Documentation Updates
1. Update `data/narratives.json` meta section:
   ```json
   "meta": {
     "deprecated": true,
     "deprecationNote": "Use split files in data/{exploration,knowledge,presentation,infrastructure}/",
     "replacedBy": ["exploration/journeys.json", "exploration/nodes.json", "knowledge/hubs.json", "knowledge/default-context.json"]
   }
   ```

2. Update `docs/JOURNEY_BUILDER_GUIDE.md` to reference new file locations

## Build Verification
Run after each phase:
```bash
npm run build
```
Build must pass before proceeding.

After Phase 7, also run:
```bash
npm run dev
# Test in browser: http://localhost:3000
```

After Phase 8, run:
```bash
node scripts/validate-knowledge-schema.js
```

## Citation Format
When reporting changes: `path:lineStart-lineEnd`

Example:
- Created `data/knowledge/hubs.json` — 6 hubs extracted + 1 new
- Modified `server.js:1040-1080` — Added loadKnowledgeConfig function

## Response Format

After each phase:
1. List files created/modified
2. Report build status
3. Note any deviations or issues

After all phases:
1. Summary of all changes
2. Final validation results
3. Smoke test confirmation

## Forbidden Actions
- Do NOT delete narratives.json (keep for backward compat)
- Do NOT modify RAG loading algorithm (tiered loading stays same)
- Do NOT add new journeys or content (separate sprint)
- Do NOT change UI components
- Do NOT modify GCS bucket structure without explicit GCS commands
- Do NOT skip build verification between phases

## GCS Note
The GCS file moves (translation-emergence, technical-architecture) should be done separately via gsutil commands. The new file structure will work once GCS is updated. For now, the fallback to narratives.json handles this.
