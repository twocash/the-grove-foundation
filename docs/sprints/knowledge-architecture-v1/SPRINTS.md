# Sprint Stories — Knowledge Architecture Rationalization

## Epic 1: Schema Foundation (Priority: Critical)

### Story 1.1: Create Directory Structure
**Task:** Create new data subdirectories
**Commands:**
```bash
mkdir -p data/schema data/exploration data/knowledge data/presentation data/infrastructure
```
**Acceptance:** Directories exist
**Commit:** `chore: create knowledge architecture directory structure`

### Story 1.2: Create Schema Ontology Document
**File:** Create `data/schema/grove-knowledge-ontology.md`
**Task:** Write human-readable architecture documentation with TypeScript definitions
**Content:** See ARCHITECTURE.md (to be created in this sprint)
**Acceptance:** File explains Hub, Journey, Node concepts with examples
**Commit:** `docs: add grove knowledge ontology definition`

---

## Epic 2: Knowledge Layer Extraction (Priority: Critical)

### Story 2.1: Extract Hubs to Separate File
**File:** Create `data/knowledge/hubs.json`
**Source:** `data/narratives.json:345-412`
**Task:** 
1. Extract `hubs` object
2. Add new `technical-architecture` hub
3. Fix `translation-emergence` path to `hubs/translation-emergence/`
4. Add `thesis` field to each hub
**Acceptance:** Valid JSON, all 6 hubs defined, paths consistent
**Commit:** `refactor: extract hubs to knowledge/hubs.json`

### Story 2.2: Extract Default Context
**File:** Create `data/knowledge/default-context.json`
**Source:** `data/narratives.json:320-328`
**Task:** Extract `defaultContext` object as standalone file
**Acceptance:** Valid JSON, contains path, maxBytes, files array
**Commit:** `refactor: extract default context configuration`

---

## Epic 3: Exploration Layer Extraction (Priority: Critical)

### Story 3.1: Extract Journeys to Separate File
**File:** Create `data/exploration/journeys.json`
**Source:** `data/narratives.json:414-480`
**Task:**
1. Extract `journeys` object
2. Rename `linkedHubId` → `hubId` (schema consistency)
3. Update `architecture.hubId` from `null` to `"technical-architecture"`
**Acceptance:** Valid JSON, all 6 journeys have non-null hubId
**Commit:** `refactor: extract journeys to exploration/journeys.json`

### Story 3.2: Extract Nodes to Separate File
**File:** Create `data/exploration/nodes.json`
**Source:** `data/narratives.json:481-773`
**Task:** Extract `nodes` object as standalone file
**Acceptance:** Valid JSON, 24 nodes defined
**Commit:** `refactor: extract nodes to exploration/nodes.json`

---

## Epic 4: Presentation Layer Extraction (Priority: Medium)

### Story 4.1: Extract Lenses to Separate File
**File:** Create `data/presentation/lenses.json`
**Source:** `data/narratives.json:6-146`
**Task:** Extract `lensRealities` and `defaultReality` objects
**Acceptance:** Valid JSON, 7 lens realities + 1 default
**Commit:** `refactor: extract lens definitions to presentation/lenses.json`

---

## Epic 5: Infrastructure Layer Extraction (Priority: Medium)

### Story 5.1: Extract GCS Mapping
**File:** Create `data/infrastructure/gcs-mapping.json`
**Source:** `data/narratives.json:329-343`
**Task:** Extract `gcsFileMapping` object
**Acceptance:** Valid JSON, all filename mappings preserved
**Commit:** `refactor: extract GCS file mapping to infrastructure/`

### Story 5.2: Extract Feature Flags
**File:** Create `data/infrastructure/feature-flags.json`
**Source:** `data/narratives.json:147-179`
**Task:** Extract `globalSettings.featureFlags` array
**Acceptance:** Valid JSON, all feature flags preserved
**Commit:** `refactor: extract feature flags to infrastructure/`

---

## Epic 6: Server Integration (Priority: Critical)

### Story 6.1: Create Knowledge Config Loader
**File:** `server.js`
**Lines:** Add new function ~line 1040
**Task:** Create `loadKnowledgeConfig()` that:
1. Tries to load from new file structure
2. Falls back to unified narratives.json
3. Normalizes output format
**Acceptance:** Function returns consistent config object
**Commit:** `feat: add multi-file knowledge config loader with fallback`

### Story 6.2: Update fetchRagContext
**File:** `server.js`
**Lines:** 1098-1130
**Task:** Update to use new loader, remove `narratives` parameter
**Acceptance:** RAG loading works with new structure
**Commit:** `refactor: update fetchRagContext to use new loader`

---

## Epic 7: Validation & Documentation (Priority: High)

### Story 7.1: Create Schema Validator
**File:** Create `scripts/validate-knowledge-schema.js`
**Task:** Validate:
- All JSON files parse
- All journey.hubId references resolve
- All journey.entryNode references resolve  
- All node.journeyId references resolve
- All hub paths follow pattern
**Acceptance:** Script runs, reports errors, exits 0 on success
**Commit:** `feat: add knowledge schema validation script`

### Story 7.2: Add Deprecation Notice to narratives.json
**File:** `data/narratives.json`
**Lines:** 1-10 (meta section)
**Task:** Add `deprecated: true` and `replacedBy` array
**Acceptance:** Clear deprecation notice in file
**Commit:** `docs: mark narratives.json as deprecated`

### Story 7.3: Update JOURNEY_BUILDER_GUIDE.md
**File:** `docs/JOURNEY_BUILDER_GUIDE.md`
**Task:** Update to reference new file structure
**Acceptance:** Guide points to correct files
**Commit:** `docs: update journey builder guide for new structure`

---

## Epic 8: GCS Content Migration (Priority: High)

### Story 8.1: Move Translation Emergence Content
**Task:** Move files in GCS from `knowledge/` to `hubs/translation-emergence/`
**Commands:**
```bash
gsutil mv gs://grove-knowledge-v2/knowledge/LLM_Translation_Emergence*.md \
         gs://grove-knowledge-v2/hubs/translation-emergence/
```
**Acceptance:** Files accessible at new path
**Commit:** N/A (GCS operation)

### Story 8.2: Create Technical Architecture Hub Content
**Task:** Copy/symlink technical architecture content to new hub directory
**Commands:**
```bash
gsutil cp gs://grove-knowledge-v2/knowledge/Grove\ Technical\ Architecture*.md \
         gs://grove-knowledge-v2/hubs/technical-architecture/technical-architecture.md
```
**Acceptance:** Hub has accessible primary file
**Commit:** N/A (GCS operation)

### Story 8.3: Update GCS Mapping for Moved Files
**File:** `data/infrastructure/gcs-mapping.json`
**Task:** Update any file paths affected by GCS moves
**Acceptance:** All hub files resolve correctly
**Commit:** `fix: update GCS mapping for moved hub content`

---

## Commit Sequence

```
1. chore: create knowledge architecture directory structure
2. docs: add grove knowledge ontology definition
3. refactor: extract hubs to knowledge/hubs.json
4. refactor: extract default context configuration
5. refactor: extract journeys to exploration/journeys.json
6. refactor: extract nodes to exploration/nodes.json
7. refactor: extract lens definitions to presentation/lenses.json
8. refactor: extract GCS file mapping to infrastructure/
9. refactor: extract feature flags to infrastructure/
10. feat: add multi-file knowledge config loader with fallback
11. refactor: update fetchRagContext to use new loader
12. feat: add knowledge schema validation script
13. docs: mark narratives.json as deprecated
14. docs: update journey builder guide for new structure
15. fix: update GCS mapping for moved hub content (if needed)
```

## Build Gates
- After Epic 2: `npm run build` ✓
- After Epic 3: `npm run build` ✓
- After Epic 5: `npm run build` ✓
- After Epic 6: `npm run build` ✓ + manual RAG test
- After Epic 7: `node scripts/validate-knowledge-schema.js` ✓

## Smoke Test Checklist
- [ ] Server starts without errors
- [ ] Terminal loads landing page
- [ ] Journey selection works
- [ ] Deterministic Mode: Start `simulation` journey → verify `meta-philosophy` hub loads
- [ ] Discovery Mode: Type "ratchet" → verify `ratchet-effect` hub loads
- [ ] New `architecture` journey loads `technical-architecture` hub
- [ ] Schema validator passes with exit code 0
