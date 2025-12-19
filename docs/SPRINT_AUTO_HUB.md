# Sprint: Auto-Hub Generation

> From Brittle Curation to Organic Discovery

**Status:** Planning
**Target:** Next Sprint
**Dependencies:** Concept Capture & Typography (completed)

---

## Vision: Heat-Driven Topic Emergence

The current Topic Hub system is powerful but brittle:
- **Today:** Admins manually define hubs with static tag lists
- **Problem:** Tags miss emergent concepts; curation can't keep up with user interest
- **Tomorrow:** Hubs emerge organically from user exploration patterns ("heat")

### The Shift

```
BEFORE (Brittle)                    AFTER (Organic)
─────────────────                   ────────────────
Admin defines tags ──────────────►  User queries generate concepts
Static hub routing ──────────────►  Heat-based hub emergence
Manual curation ─────────────────►  AI-assisted discovery
Stale over time ─────────────────►  Self-healing via decay
```

---

## Foundation: What We Have Today

### 1. Concept Stream (`data/concept-stream.jsonl`)

Every Terminal response now logs its "High Value" concepts (bold terms):

```jsonl
{"ts":"2025-12-19T14:32:01Z","concepts":["Ratchet Effect","capability doubling","frontier models"],"node":"ratchet-intro","ctx":"The **Ratchet Effect** describes how **capability doubling** occurs..."}
{"ts":"2025-12-19T14:33:15Z","concepts":["cognitive split","local inference","cloud escalation"],"node":"arch-overview","ctx":"The **cognitive split** architecture separates **local inference** from..."}
{"ts":"2025-12-19T14:35:42Z","concepts":["Ratchet Effect","7-month cycle"],"node":null,"ctx":"Let me explain the **Ratchet Effect** and its **7-month cycle**..."}
```

**Schema:**
| Field | Type | Description |
|-------|------|-------------|
| `ts` | ISO8601 | Timestamp of extraction |
| `concepts` | string[] | Unique bold terms from response |
| `node` | string\|null | Source node ID (narrative context) |
| `ctx` | string | First 300 chars of response (context window) |

### 2. Telemetry Endpoint

```
POST /api/telemetry/concepts
```

**Request:**
```json
{
  "concepts": ["Ratchet Effect", "capability doubling"],
  "context": "The **Ratchet Effect** describes how...",
  "source_node": "ratchet-intro",
  "timestamp": "2025-12-19T14:32:01.000Z"
}
```

**Response:**
```json
{ "success": true, "count": 2 }
```

### 3. Frontend Extraction (`Terminal.tsx`)

After each message stream completes:

```typescript
// === Concept Mining Telemetry ===
const conceptMatches = accumulatedRawText.match(/\*\*(.*?)\*\*/g);
if (conceptMatches) {
  const uniqueConcepts = Array.from(new Set(
    conceptMatches.map(m => m.slice(2, -2).trim())
  )).filter(c => c.length > 0);

  if (uniqueConcepts.length > 0) {
    fetch('/api/telemetry/concepts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        concepts: uniqueConcepts,
        context: accumulatedRawText.substring(0, 300) + '...',
        source_node: nodeId || currentNodeId,
        timestamp: new Date().toISOString()
      })
    }).catch(err => console.warn('[Telemetry] Concept log failed', err));
  }
}
```

---

## Auto-Hub Architecture

### Phase 1: Frequency Analysis (Offline Script)

Build a CLI tool to analyze `concept-stream.jsonl`:

```
scripts/analyze-concepts.js
```

**Capabilities:**
1. Stream JSONL line-by-line (memory efficient)
2. Normalize terms (lowercase, trim, collapse whitespace)
3. Count frequency with time decay
4. Cluster related concepts
5. Output ranked concept report

**Example Output:**
```json
{
  "analyzed_at": "2025-12-20T10:00:00Z",
  "total_events": 1247,
  "time_range": { "start": "2025-12-15", "end": "2025-12-20" },
  "top_concepts": [
    { "term": "ratchet effect", "count": 89, "heat": 0.92, "co_occurs_with": ["capability", "7-month", "frontier"] },
    { "term": "cognitive split", "count": 67, "heat": 0.78, "co_occurs_with": ["local", "cloud", "escalation"] },
    { "term": "knowledge commons", "count": 45, "heat": 0.65, "co_occurs_with": ["attribution", "propagation"] }
  ],
  "emerging_clusters": [
    { "id": "cluster-1", "anchor": "ratchet effect", "terms": ["capability doubling", "7-month cycle", "frontier gap"] },
    { "id": "cluster-2", "anchor": "cognitive split", "terms": ["local inference", "cloud escalation", "hierarchical"] }
  ],
  "cold_concepts": [
    { "term": "some legacy term", "last_seen": "2025-12-10", "decay_factor": 0.12 }
  ]
}
```

### Phase 2: Heat Score Algorithm

**Heat = Frequency × Recency × Velocity**

```typescript
interface ConceptHeat {
  term: string;
  frequency: number;      // Raw count
  recency: number;        // Days since last seen (inverted)
  velocity: number;       // Rate of change (trending up/down)
  heat: number;           // Composite score (0-1)
  confidence: number;     // Statistical confidence
}

function calculateHeat(events: ConceptEvent[], now: Date): ConceptHeat[] {
  const DECAY_HALF_LIFE_DAYS = 7;  // Concepts lose half their heat every 7 days

  // Group by normalized term
  const byTerm = groupBy(events, e => normalize(e.concept));

  return Object.entries(byTerm).map(([term, occurrences]) => {
    const frequency = occurrences.length;

    // Recency: exponential decay based on most recent occurrence
    const mostRecent = Math.max(...occurrences.map(o => o.ts.getTime()));
    const daysSinceLastSeen = (now.getTime() - mostRecent) / (1000 * 60 * 60 * 24);
    const recency = Math.exp(-daysSinceLastSeen / DECAY_HALF_LIFE_DAYS);

    // Velocity: compare last 7 days to previous 7 days
    const last7Days = occurrences.filter(o => daysSince(o.ts) <= 7).length;
    const prev7Days = occurrences.filter(o => daysSince(o.ts) > 7 && daysSince(o.ts) <= 14).length;
    const velocity = prev7Days > 0 ? (last7Days - prev7Days) / prev7Days : 0;

    // Composite heat score
    const heat = (frequency * 0.4 + recency * 0.4 + Math.max(0, velocity) * 0.2);

    return { term, frequency, recency, velocity, heat, confidence: Math.min(1, frequency / 10) };
  });
}
```

### Phase 3: Co-occurrence Clustering

Concepts that appear together should cluster together:

```typescript
interface CoOccurrenceMatrix {
  [termA: string]: {
    [termB: string]: number;  // Count of co-occurrences
  };
}

function buildCoOccurrenceMatrix(events: ConceptEvent[]): CoOccurrenceMatrix {
  const matrix: CoOccurrenceMatrix = {};

  for (const event of events) {
    const concepts = event.concepts;
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        const a = normalize(concepts[i]);
        const b = normalize(concepts[j]);
        matrix[a] = matrix[a] || {};
        matrix[a][b] = (matrix[a][b] || 0) + 1;
        matrix[b] = matrix[b] || {};
        matrix[b][a] = (matrix[b][a] || 0) + 1;
      }
    }
  }

  return matrix;
}

function clusterConcepts(matrix: CoOccurrenceMatrix, threshold: number = 3): Cluster[] {
  // Simple greedy clustering: start with highest heat concept, absorb related
  const clusters: Cluster[] = [];
  const assigned = new Set<string>();

  const sortedTerms = Object.keys(matrix).sort((a, b) =>
    sumValues(matrix[b]) - sumValues(matrix[a])
  );

  for (const anchor of sortedTerms) {
    if (assigned.has(anchor)) continue;

    const cluster: Cluster = { anchor, terms: [anchor] };
    assigned.add(anchor);

    for (const [related, count] of Object.entries(matrix[anchor] || {})) {
      if (!assigned.has(related) && count >= threshold) {
        cluster.terms.push(related);
        assigned.add(related);
      }
    }

    if (cluster.terms.length > 1) {
      clusters.push(cluster);
    }
  }

  return clusters;
}
```

### Phase 4: Hub Proposal Generation

When clusters reach critical mass, propose new hubs:

```typescript
interface HubProposal {
  id: string;                    // e.g., "auto-hub-ratchet-effect"
  title: string;                 // Human-readable title
  anchor_concept: string;        // Primary concept
  related_concepts: string[];    // Co-occurring concepts
  suggested_tags: string[];      // For query routing
  heat_score: number;            // Composite heat
  confidence: number;            // Statistical confidence
  evidence: {
    total_mentions: number;
    unique_sessions: number;
    time_span_days: number;
    sample_contexts: string[];   // 3-5 example contexts
  };
  status: 'proposed' | 'approved' | 'rejected' | 'merged';
}

async function generateHubProposal(cluster: Cluster, events: ConceptEvent[]): Promise<HubProposal> {
  // Use Gemini to generate human-readable title and tags
  const prompt = `Given this cluster of related concepts from user conversations:

Anchor concept: "${cluster.anchor}"
Related concepts: ${cluster.terms.join(', ')}

Sample contexts where these appear:
${getSampleContexts(cluster, events, 5).join('\n---\n')}

Generate a TopicHub proposal with:
1. A clear, concise title (2-5 words)
2. 5-10 query tags that would route users to this hub
3. A one-sentence expert framing instruction

Return as JSON:
{
  "title": "...",
  "tags": ["...", "..."],
  "expertFraming": "You are explaining..."
}`;

  const response = await gemini.generateContent(prompt);
  const { title, tags, expertFraming } = JSON.parse(response.text);

  return {
    id: `auto-hub-${slugify(cluster.anchor)}`,
    title,
    anchor_concept: cluster.anchor,
    related_concepts: cluster.terms.filter(t => t !== cluster.anchor),
    suggested_tags: tags,
    heat_score: calculateClusterHeat(cluster, events),
    confidence: cluster.terms.length / 10,
    evidence: {
      total_mentions: countMentions(cluster, events),
      unique_sessions: countUniqueSessions(cluster, events),
      time_span_days: getTimeSpan(cluster, events),
      sample_contexts: getSampleContexts(cluster, events, 5)
    },
    status: 'proposed'
  };
}
```

### Phase 5: Admin Review UI

New Foundation console: **Hub Discovery**

```
/foundation/discovery
```

**Features:**
- View proposed hubs ranked by heat
- See evidence (contexts, frequency, co-occurrences)
- Approve → auto-creates hub in `narratives.hubs`
- Reject → marks as rejected, won't re-propose
- Merge → combine with existing hub, expand tags
- Tune → edit tags/title before approval

**Wireframe:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Hub Discovery                                      [Refresh]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔥 Hot Proposals (3)                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ★★★★☆  The Diary System                    Heat: 0.87     │  │
│  │        Anchor: "diary memory"                              │  │
│  │        Related: agent memory, narrative log, tamagotchi    │  │
│  │        Mentions: 142 across 67 sessions                    │  │
│  │        [Approve] [Reject] [Merge with: ▼] [Edit]          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  📊 Emerging Clusters (7)                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ☆☆☆☆  "governance model" cluster                          │  │
│  │        Heat: 0.45 (needs more data)                        │  │
│  │        Terms: governance, foundation structure, commons    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  🧊 Cooling (2)                                                │
│  │ "proof of work" - last seen 14 days ago, decay: 0.23      │  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Sprint Tasks

| # | Task | Estimate | Dependencies |
|---|------|----------|--------------|
| 1 | Create `scripts/analyze-concepts.js` CLI | 2h | - |
| 2 | Implement heat score algorithm | 2h | #1 |
| 3 | Implement co-occurrence clustering | 2h | #1 |
| 4 | Add proposal generation with Gemini | 2h | #2, #3 |
| 5 | Create `/api/admin/hub-proposals` endpoints | 2h | #4 |
| 6 | Build Hub Discovery console UI | 4h | #5 |
| 7 | Integrate approved hubs into `narratives.hubs` | 2h | #6 |
| 8 | Add decay/cleanup for cold concepts | 1h | #1 |

### API Endpoints

```
GET  /api/admin/hub-proposals          # List all proposals
POST /api/admin/hub-proposals/generate # Trigger analysis & generation
POST /api/admin/hub-proposals/:id/approve
POST /api/admin/hub-proposals/:id/reject
POST /api/admin/hub-proposals/:id/merge
GET  /api/admin/concept-analytics      # Heat map, trending, etc.
```

### Data Files

```
data/
├── concept-stream.jsonl       # Raw telemetry (append-only)
├── concept-analysis.json      # Latest analysis results
├── hub-proposals.json         # Proposed hubs (admin review)
└── concept-archive/           # Rotated old JSONL files
    └── 2025-12-01.jsonl
```

---

## Configuration

Add to `globalSettings` in narratives schema:

```typescript
interface AutoHubSettings {
  enabled: boolean;                    // Feature flag
  minHeatThreshold: number;            // 0.6 = propose at 60% heat
  minMentionsToPropose: number;        // 20 = need 20+ mentions
  minCoOccurrenceThreshold: number;    // 3 = concepts must co-occur 3+ times
  decayHalfLifeDays: number;           // 7 = heat halves every 7 days
  analysisIntervalHours: number;       // 24 = run analysis daily
  maxProposalsPerRun: number;          // 5 = don't overwhelm admin
  archiveAfterDays: number;            // 30 = rotate old JSONL
}

const DEFAULT_AUTO_HUB_SETTINGS: AutoHubSettings = {
  enabled: true,
  minHeatThreshold: 0.6,
  minMentionsToPropose: 20,
  minCoOccurrenceThreshold: 3,
  decayHalfLifeDays: 7,
  analysisIntervalHours: 24,
  maxProposalsPerRun: 5,
  archiveAfterDays: 30
};
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to new hub | < 7 days from emergence | First mention → approved hub |
| Hub relevance | > 80% approval rate | Approved / (Approved + Rejected) |
| Coverage | > 70% queries hit a hub | Tier 2 loads / Total queries |
| False positives | < 20% rejection rate | Rejected / Proposed |
| Admin effort | < 5 min/day | Time spent in Hub Discovery |

---

## Future Enhancements

### v2: Real-Time Heat Dashboard
- Live concept stream visualization
- Trending concepts ticker
- Alert when concept hits threshold

### v3: Automated Hub Lifecycle
- Auto-approve high-confidence proposals (heat > 0.9)
- Auto-deprecate hubs with sustained low heat
- Merge similar hubs automatically

### v4: Cross-Session Patterns
- Track concept journeys across sessions
- Identify common exploration paths
- Suggest "related hubs" based on co-exploration

---

## Technical Notes

### JSONL Streaming (Memory Efficient)

```javascript
const readline = require('readline');
const fs = require('fs');

async function* streamConcepts(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.trim()) {
      yield JSON.parse(line);
    }
  }
}

// Usage
for await (const event of streamConcepts('data/concept-stream.jsonl')) {
  processConcept(event);
}
```

### File Rotation

```javascript
async function rotateIfNeeded(logPath, archiveDir, maxSizeMB = 10) {
  const stats = await fs.promises.stat(logPath);
  const sizeMB = stats.size / (1024 * 1024);

  if (sizeMB > maxSizeMB) {
    const date = new Date().toISOString().split('T')[0];
    const archivePath = path.join(archiveDir, `${date}-${Date.now()}.jsonl`);

    await fs.promises.mkdir(archiveDir, { recursive: true });
    await fs.promises.rename(logPath, archivePath);

    console.log(`[Rotate] Archived ${logPath} → ${archivePath}`);
  }
}
```

### Normalization

```javascript
function normalize(concept) {
  return concept
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')           // Collapse whitespace
    .replace(/['']/g, "'")          // Normalize quotes
    .replace(/[""]/g, '"')
    .replace(/[^\w\s'-]/g, '');     // Remove special chars
}
```

---

## References

- Current Hub System: `src/core/schema/rag.ts`
- Topic Router: `src/core/engine/topicRouter.ts`
- Telemetry Endpoint: `server.js` line 1665
- Concept Extraction: `components/Terminal.tsx` line 654
