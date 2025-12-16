# Topic Hub RAG Architecture

> Version: 1.0
> Status: Design Complete
> Sprint: Topic Hub RAG Architecture

---

## Overview

The Topic Hub RAG Architecture replaces monolithic context loading with **intelligent, tiered context selection** based on query-to-hub routing.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TIERED RAG FLOW                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User Query ──► topicRouter.routeToHub() ──► ragLoader.buildTieredContext│
│                         │                              │                 │
│                         ▼                              ▼                 │
│                  Match hub tags              Load Tier 1 (_default/)     │
│                  Return TopicHub             Load Tier 2 (hubs/{id}/)    │
│                         │                              │                 │
│                         ▼                              ▼                 │
│                  Build enhanced prompt       Combine context (~35-55KB)  │
│                  (expert framing)                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Layers

### Layer 1: Schema (`src/core/schema/rag.ts`)

Pure TypeScript types with no runtime dependencies.

```typescript
// Manifest stored in GCS at knowledge/hubs.json
export interface HubsManifest {
  version: "1.0";
  generatedAt: string;

  defaultContext: {
    path: string;           // "_default/"
    maxBytes: number;       // 15000
    files: string[];        // ["grove-overview.md", "key-concepts.md", "visionary-narrative.md"]
  };

  hubs: Record<string, HubConfig>;
}

export interface HubConfig {
  title: string;
  path: string;             // "hubs/ratchet-effect/"
  maxBytes: number;         // 40000
  primaryFile: string;      // "ratchet-deep-dive.md"
  supportingFiles: string[];
  tags: string[];           // Validation against TopicHub definitions
}

// Result from tiered loading
export interface TieredContextResult {
  context: string;
  tier1Bytes: number;
  tier2Bytes: number;
  totalBytes: number;
  matchedHub: string | null;
  filesLoaded: string[];
}
```

### Layer 2: Engine (`src/core/engine/ragLoader.ts`)

Pure functions for context loading. No React, no GCS dependencies (injected).

```typescript
// Core loading function
export async function buildTieredContext(
  message: string,
  topicHubs: TopicHub[],
  manifest: HubsManifest,
  fileLoader: (path: string) => Promise<string>
): Promise<TieredContextResult>;

// Manifest validation
export function validateManifest(manifest: unknown): manifest is HubsManifest;

// Hub matching integration
export function selectHubFiles(
  hubId: string | null,
  manifest: HubsManifest
): string[];
```

### Layer 3: Server Integration (`server.js`)

Express handlers with GCS integration.

```javascript
// Module-level cache
let hubsManifestCache = null;
let manifestCacheTime = 0;
const MANIFEST_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Enhanced fetchRagContext with hub awareness
async function fetchRagContext(message, topicHubs) {
  const manifest = await loadHubsManifest();
  const matchedHub = routeToHub(message, topicHubs);
  return buildTieredContext(message, topicHubs, manifest, loadGCSFile);
}

// Event-driven cache invalidation
app.post('/api/admin/narrative', async (req, res) => {
  // ... save logic ...
  hubsManifestCache = null; // Invalidate on admin save
  console.log('[EVENT] narrative-updated → RAG cache invalidated');
});
```

---

## GCS File Structure

```
gs://grove-assets/knowledge/
├── hubs.json                    # Manifest (declarative source of truth)
├── _default/                    # Tier 1: Always loaded (~15KB)
│   ├── grove-overview.md        # TL;DR of entire thesis
│   ├── key-concepts.md          # Core vocabulary glossary
│   └── visionary-narrative.md   # The "why" emotional framing
└── hubs/                        # Tier 2: Loaded on match
    ├── ratchet-effect/
    │   ├── ratchet-deep-dive.md
    │   ├── ratchet-quantitative.md
    │   └── chinese-open-source.md
    ├── infrastructure-bet/
    │   ├── economics-deep-dive.md
    │   └── distributed-edge.md
    ├── cognitive-split/
    │   └── everyday-ai.md
    ├── observer-dynamic/
    │   └── simulation-deep-dive.md
    ├── meta-philosophy/
    │   └── terminal-deep-dive.md
    ├── diary-system/
    │   └── diary-deep-dive.md
    ├── university-path/
    │   ├── purdue-proposal.md
    │   └── engagement-research.md
    └── technical-arch/
        ├── technical-architecture.md
        └── distributed-systems.md
```

---

## Manifest Schema (hubs.json)

```json
{
  "version": "1.0",
  "generatedAt": "2025-12-16T00:00:00Z",
  "defaultContext": {
    "path": "_default/",
    "maxBytes": 15000,
    "files": [
      "grove-overview.md",
      "key-concepts.md",
      "visionary-narrative.md"
    ]
  },
  "hubs": {
    "ratchet-effect": {
      "title": "The Ratchet Effect",
      "path": "hubs/ratchet-effect/",
      "maxBytes": 40000,
      "primaryFile": "ratchet-deep-dive.md",
      "supportingFiles": ["ratchet-quantitative.md", "chinese-open-source.md"],
      "tags": ["ratchet", "capability propagation", "frontier to edge"]
    },
    "infrastructure-bet": {
      "title": "The $380B Infrastructure Bet",
      "path": "hubs/infrastructure-bet/",
      "maxBytes": 40000,
      "primaryFile": "economics-deep-dive.md",
      "supportingFiles": ["distributed-edge.md"],
      "tags": ["$380 billion", "hyperscaler", "datacenter"]
    },
    "cognitive-split": {
      "title": "The Cognitive Split",
      "path": "hubs/cognitive-split/",
      "maxBytes": 30000,
      "primaryFile": "everyday-ai.md",
      "supportingFiles": [],
      "tags": ["cognitive split", "hierarchical reasoning", "constant hum"]
    },
    "observer-dynamic": {
      "title": "The Observer Dynamic",
      "path": "hubs/observer-dynamic/",
      "maxBytes": 30000,
      "primaryFile": "simulation-deep-dive.md",
      "supportingFiles": [],
      "tags": ["observer", "simulation", "emergence", "consciousness"]
    },
    "meta-philosophy": {
      "title": "Meta Philosophy",
      "path": "hubs/meta-philosophy/",
      "maxBytes": 20000,
      "primaryFile": "terminal-deep-dive.md",
      "supportingFiles": [],
      "tags": ["terminal", "experience", "you are already here", "identity"]
    },
    "diary-system": {
      "title": "The Diary System",
      "path": "hubs/diary-system/",
      "maxBytes": 20000,
      "primaryFile": "diary-deep-dive.md",
      "supportingFiles": [],
      "tags": ["diary", "memory", "knowledge commons", "newswire"]
    },
    "university-path": {
      "title": "University Partnership Path",
      "path": "hubs/university-path/",
      "maxBytes": 45000,
      "primaryFile": "purdue-proposal.md",
      "supportingFiles": ["engagement-research.md"],
      "tags": ["purdue", "university", "academic", "research"]
    },
    "technical-arch": {
      "title": "Technical Architecture",
      "path": "hubs/technical-arch/",
      "maxBytes": 50000,
      "primaryFile": "technical-architecture.md",
      "supportingFiles": ["distributed-systems.md"],
      "tags": ["architecture", "distributed", "technical", "systems"]
    }
  }
}
```

---

## Loading Algorithm

```
buildTieredContext(message, topicHubs, manifest, fileLoader):

  1. ALWAYS load Tier 1 (_default/)
     - Load all files in manifest.defaultContext.files
     - Track bytes loaded (tier1Bytes)
     - Cap at manifest.defaultContext.maxBytes

  2. Route query to hub
     - Call routeToHub(message, topicHubs)
     - If no match → return Tier 1 only

  3. Load Tier 2 (matched hub)
     - Get hub config from manifest.hubs[hubId]
     - Load primaryFile first
     - Load supportingFiles in order
     - Cap at hub.maxBytes
     - Track bytes loaded (tier2Bytes)

  4. Combine and return
     - Concatenate Tier 1 + Tier 2 contexts
     - Return TieredContextResult with metadata
```

---

## Integration Points

### 1. /api/chat Endpoint (server.js:744-800)

```javascript
// Before (current)
const ragContext = await fetchRagContext();

// After (tiered)
const { topicHubs } = await fetchActiveNarrative(); // Get hubs from narrative
const result = await fetchRagContext(message, topicHubs);
console.log(`RAG: ${result.tier1Bytes}B default + ${result.tier2Bytes}B hub (${result.matchedHub || 'none'})`);
```

### 2. buildSystemPrompt (server.js:672-706)

```javascript
// Before (current)
function buildSystemPrompt({ ragContext, ... }) {
  parts.push(`\n\n**KNOWLEDGE BASE:**\n${ragContext}`);
}

// After (enhanced)
function buildSystemPrompt({ ragContext, matchedHub, ... }) {
  parts.push(`\n\n**KNOWLEDGE BASE:**\n${ragContext}`);
  if (matchedHub) {
    const hubPrompt = buildHubEnhancedPrompt('', matchedHub);
    parts.push(hubPrompt);
  }
}
```

### 3. Cache Invalidation (server.js:459-494)

```javascript
app.post('/api/admin/narrative', async (req, res) => {
  // ... existing save logic ...

  // Event-driven cache invalidation
  hubsManifestCache = null;
  console.log('[EVENT] narrative-updated → RAG cache invalidated');

  res.json({ success: true });
});
```

---

## API Changes

### POST /api/chat Request Enhancement

```typescript
interface ChatRequest {
  message: string;
  sessionId?: string;
  sectionContext?: string;
  personaTone?: string;
  verboseMode?: boolean;
  terminatorMode?: boolean;

  // NEW: Context hints
  contextHubs?: string[];     // Explicit hub IDs to load
  autoDetectHubs?: boolean;   // Let server match query to hubs (default: true)
}
```

### Response Enhancement (Optional)

```typescript
interface ChatResponse {
  // ... existing fields ...

  // NEW: Context metadata
  contextMetadata?: {
    matchedHub: string | null;
    tier1Bytes: number;
    tier2Bytes: number;
    filesLoaded: string[];
  };
}
```

---

## Test Matrix

| Query | Expected Hub | Expected Files | Total ~Bytes |
|-------|--------------|----------------|--------------|
| "Tell me about the Ratchet" | ratchet-effect | default + ratchet/* | 15K + 40K |
| "What's the $380B bet?" | infrastructure-bet | default + infrastructure/* | 15K + 40K |
| "How does Grove work?" | (none) | default only | 15K |
| "What is the Observer?" | observer-dynamic | default + observer/* | 15K + 30K |
| "Am I inside Grove right now?" | meta-philosophy | default + meta/* | 15K + 20K |
| "Tell me about the diary system" | diary-system | default + diary/* | 15K + 20K |
| "Purdue partnership details" | university-path | default + university/* | 15K + 45K |
| "Technical architecture deep dive" | technical-arch | default + technical/* | 15K + 50K |

---

## Success Metrics

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Default context | 50KB (truncated) | 15KB | 70% reduction |
| Relevant context | ~10% | ~100% | 10x improvement |
| Max total context | 50KB fixed | 55-65KB | 10-30% increase |
| Token efficiency | ~12,500 | ~6,000-15,000 | Variable, optimized |
| Cache hits | 0% | ~95% | New capability |

---

## Migration Strategy (ADR-008 Compliant)

### Phase 1: Additive (No Breaking Changes)
1. Create new schema at `src/core/schema/rag.ts`
2. Create new engine at `src/core/engine/ragLoader.ts`
3. Upload manifest and reorganized files to GCS
4. Keep existing `fetchRagContext()` as fallback

### Phase 2: Integration
1. Add `fetchRagContextTiered()` alongside existing function
2. Feature flag: `useT tieredRag` in globalSettings
3. Test in production with flag off

### Phase 3: Cutover
1. Enable flag for all users
2. Monitor metrics
3. Remove old `fetchRagContext()` after validation

---

## File Deliverables

| File | Purpose | Status |
|------|---------|--------|
| `docs/REPO_AUDIT_RAG.md` | Current system audit | Complete |
| `docs/ARCHITECTURE_RAG.md` | This document | Complete |
| `docs/DEVLOG_RAG.md` | Running log | Active |
| `src/core/schema/rag.ts` | Type definitions | Phase 1 |
| `src/core/engine/ragLoader.ts` | Loading logic | Phase 3 |
| `scripts/generate-tier1.ts` | AI content generation | Phase 2 |
| `scripts/cluster-knowledge.ts` | File clustering | Phase 2 |
| `knowledge/hubs.json` (GCS) | Manifest | Phase 1 |
| `knowledge/_default/*.md` (GCS) | Tier 1 content | Phase 2 |
| `knowledge/hubs/**/*.md` (GCS) | Tier 2 content | Phase 2 |
