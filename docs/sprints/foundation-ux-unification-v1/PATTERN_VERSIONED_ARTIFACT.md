# Versioned Artifact Pattern

## Overview

Everything in Grove has provenance. This document defines the **Versioned Artifact** pattern — a consistent schema for tracking the history, lineage, and modifications of any entity in the system.

## Why This Matters

1. **Transparency** — Users see where things come from (system default? community? personal fork?)
2. **Experimentation** — Tweak settings, save as new, compare results
3. **Recovery** — Roll back if changes break something
4. **Provenance chain** — Every insight traces back to its context (lens + journey + node + timestamp)
5. **Trust** — In a distributed system, knowing the source matters

## Core Schema

```typescript
// src/core/schema/versioned-artifact.ts

/**
 * Base interface for any versioned entity in Grove
 */
interface VersionedArtifact {
  // Identity
  id: string;                        // Stable UUID
  slug: string;                       // Human-readable identifier
  
  // Versioning
  version: string;                    // Semantic version (e.g., "2.3.0")
  versionLabel?: string;              // Optional human label ("Added opinion filter")
  
  // Timestamps
  createdAt: string;                  // ISO timestamp
  modifiedAt: string;                 // ISO timestamp
  
  // Provenance
  provenance: ArtifactProvenance;
  
  // History (most recent first)
  history: VersionHistoryEntry[];
}

/**
 * Where did this artifact come from?
 */
interface ArtifactProvenance {
  source: ProvenanceSource;
  forkedFrom?: {
    artifactId: string;
    version: string;
    artifactType: ArtifactType;
  };
  author?: {
    type: 'system' | 'user' | 'community' | 'agent';
    id?: string;
    name?: string;
  };
}

type ProvenanceSource = 
  | 'system'      // Shipped with Grove
  | 'user'        // Created/modified by this user
  | 'community'   // From the Commons
  | 'imported'    // External source
  | 'generated';  // AI-generated

/**
 * A single entry in version history
 */
interface VersionHistoryEntry {
  version: string;
  label?: string;
  timestamp: string;
  changes: ChangeRecord[];
  snapshot?: string;  // JSON snapshot for full restoration
}

/**
 * What changed in this version?
 */
interface ChangeRecord {
  field: string;
  action: 'created' | 'modified' | 'deleted';
  previousValue?: any;
  newValue?: any;
}

/**
 * Types of artifacts that use this pattern
 */
type ArtifactType = 
  | 'lens'
  | 'journey'
  | 'node'
  | 'sprout'
  | 'agent'
  | 'voice'       // Future: agent voice/personality
  | 'template';   // Future: reusable patterns
```

## Entity-Specific Extensions

### Lens (Versioned)

```typescript
interface VersionedLens extends VersionedArtifact {
  type: 'lens';
  
  // Lens-specific
  name: string;
  description: string;
  icon: string;
  accentColor: string;
  systemPrompt: string;
  
  // Configuration (user-adjustable)
  config: {
    toneIntensity: number;        // 0-100
    primarySource: string;
    includeOpinionPieces: boolean;
    // ... other lens settings
  };
}
```

### Journey (Versioned)

```typescript
interface VersionedJourney extends VersionedArtifact {
  type: 'journey';
  
  // Journey-specific
  title: string;
  description: string;
  estimatedMinutes: number;
  nodes: JourneyNode[];
  
  // Completion tracking (per-user, not versioned)
  // Stored separately in user state
}
```

### Sprout (Versioned)

```typescript
interface VersionedSprout extends VersionedArtifact {
  type: 'sprout';
  
  // Sprout-specific
  content: string;
  stage: GrowthStage;
  
  // Rich provenance for sprouts
  captureContext: {
    lensId: string;
    lensVersion: string;
    journeyId?: string;
    journeyVersion?: string;
    journeyStep?: number;
    nodeId?: string;
    nodeVersion?: string;
    sessionId: string;
    timestamp: string;
  };
  
  // Refinement history
  refinements: {
    timestamp: string;
    action: 'edit' | 'promote' | 'merge' | 'split';
    details: any;
  }[];
}
```

## Inspector UI Pattern

Every Inspector panel should include a **Provenance Section**:

```
┌─────────────────────────────────────────────────────────────┐
│ [Icon] Concerned Citizen                                    │
│        Societal Impact Focus                                │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ v2.3 · System default · Modified 3 days ago             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Active toggle, config controls, etc.]                      │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│ PROVENANCE                                                  │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ Source: System default                                      │
│ You modified: Tone intensity, Primary source                │
│                                                             │
│ HISTORY                                          [View All] │
│ ├─ v2.3 · "Increased tone intensity"        · 3 days ago   │
│ ├─ v2.2 · "Added opinion filter"            · 1 week ago   │
│ └─ v2.0 · Original system version           · —            │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│ [View JSON]  [Fork as New]  [Reset to Default]              │
└─────────────────────────────────────────────────────────────┘
```

**For Sprouts, show capture context:**

```
┌─────────────────────────────────────────────────────────────┐
│ 🌱 Sprout · Rooting                                         │
│                                                             │
│ "The 7-month capability doubling window feels shorter       │
│  each cycle as infrastructure matures..."                   │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│ CAPTURED                                                    │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ 📅 December 22, 2025 at 10:34 AM                           │
│ 🔍 Lens: Engineer v1.2                                      │
│ 🗺️ Journey: The Ratchet (Step 3 of 5)                      │
│ 📍 Node: Capability Propagation                             │
│                                                             │
│ REFINEMENTS                                      [View All] │
│ ├─ Promoted to Rooting                      · 2 days ago   │
│ └─ Captured as Tender                       · 5 days ago   │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│ [Edit]  [Promote]  [View Source Context]  [Delete]          │
└─────────────────────────────────────────────────────────────┘
```

## Actions

### Fork as New
Creates a copy with new ID, provenance pointing to original:
```typescript
const forked: VersionedLens = {
  ...original,
  id: generateUUID(),
  slug: `${original.slug}-fork`,
  version: '1.0.0',
  provenance: {
    source: 'user',
    forkedFrom: {
      artifactId: original.id,
      version: original.version,
      artifactType: 'lens',
    },
    author: { type: 'user' },
  },
  history: [{
    version: '1.0.0',
    label: `Forked from ${original.name} v${original.version}`,
    timestamp: new Date().toISOString(),
    changes: [{ field: '*', action: 'created' }],
  }],
};
```

### Reset to Default
Restores system version, preserves history:
```typescript
const reset: VersionedLens = {
  ...systemDefault,
  id: current.id,  // Keep same ID
  history: [
    {
      version: bumpVersion(current.version),
      label: 'Reset to system default',
      timestamp: new Date().toISOString(),
      changes: [{ field: '*', action: 'modified', previousValue: current, newValue: systemDefault }],
    },
    ...current.history,
  ],
};
```

### View JSON
Opens modal with pretty-printed JSON, allows direct editing for power users:
```typescript
// Modal content
<pre className="font-mono text-xs">
  {JSON.stringify(artifact, null, 2)}
</pre>

// With "Save Changes" that parses and validates
```

## Implementation Notes

### Storage Strategy

**System artifacts:** Shipped in `src/data/` as JSON, immutable
**User modifications:** Stored in localStorage with full history
**Merge strategy:** User version overlays system version

```typescript
function getArtifact(id: string, type: ArtifactType): VersionedArtifact {
  const systemVersion = getSystemArtifact(id, type);
  const userVersion = getUserArtifact(id, type);
  
  if (!userVersion) return systemVersion;
  
  // User version takes precedence, but we track the relationship
  return {
    ...userVersion,
    provenance: {
      ...userVersion.provenance,
      forkedFrom: userVersion.provenance.forkedFrom || {
        artifactId: systemVersion.id,
        version: systemVersion.version,
        artifactType: type,
      },
    },
  };
}
```

### Version Bumping

```typescript
function bumpVersion(current: string, type: 'major' | 'minor' | 'patch' = 'patch'): string {
  const [major, minor, patch] = current.split('.').map(Number);
  switch (type) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'patch': return `${major}.${minor}.${patch + 1}`;
  }
}
```

### History Pruning

To prevent unbounded growth:
- Keep last 20 versions in detail
- Older versions: keep snapshot only (no granular changes)
- System defaults: never pruned

## Integration with Sprint 4

Add to each Inspector:

1. **Version badge** below title: `v2.3 · Modified 3 days ago`
2. **Provenance section** (collapsible): Source, fork info, history
3. **Action buttons**: View JSON, Fork as New, Reset (where applicable)

This is a **stub** in Sprint 4 — full history tracking comes later, but the UI pattern and schema are established now.

## Future: Commons Integration

When artifacts flow to/from the Commons:
- Provenance tracks community source
- Version history shows adoption/modification chain
- "View Source Context" links to original conversation (if public)

This enables the trust layer for distributed knowledge.
