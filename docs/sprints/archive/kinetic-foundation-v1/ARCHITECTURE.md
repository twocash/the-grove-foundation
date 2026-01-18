# Kinetic Foundation v1.0 — Architecture

**Sprint:** `kinetic-foundation-v1`  
**Date:** December 24, 2024

---

## Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Kinetic Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Presentation Layer                     │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │   │
│  │  │ ObjectList  │ │ ObjectGrid  │ │ SegmentedControl    │ │   │
│  │  │ <T extends  │ │ <T extends  │ │ <T extends string>  │ │   │
│  │  │  DEXObject> │ │  DEXObject> │ │                     │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     Domain Hooks                          │   │
│  │  ┌─────────────────┐  ┌─────────────────────────────────┐│   │
│  │  │useDEXJourneys() │  │useNarrativeSchema() [facade]    ││   │
│  │  │useDEXNodes()    │  │  - Backward compatible API      ││   │
│  │  │useDEXHubs()     │  │  - Delegates to DEXRegistry     ││   │
│  │  │useDEXLenses()   │  │  - Handles V1→V2 migration      ││   │
│  │  └─────────────────┘  └─────────────────────────────────┘│   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     DEX Registry                          │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  store: Map<DEXObjectType, Map<string, DEXObject>> │  │   │
│  │  │  subscribers: Map<DEXObjectType, Set<Callback>>    │  │   │
│  │  ├────────────────────────────────────────────────────┤  │   │
│  │  │  get<T>(type, id): T | null                        │  │   │
│  │  │  getAll<T>(type): T[]                              │  │   │
│  │  │  filter<T>(type, predicate): T[]                   │  │   │
│  │  │  update<T>(type, id, updates): void                │  │   │
│  │  │  delete(type, id): void                            │  │   │
│  │  │  create<T>(type, partial): string                  │  │   │
│  │  │  subscribe(type, callback): unsubscribe            │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Persistence Layer                      │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  hydrate(schema: NarrativeSchemaV2): void          │  │   │
│  │  │  dehydrate(): NarrativeSchemaV2                    │  │   │
│  │  │  ↕ /api/narrative (GET)                            │  │   │
│  │  │  ↕ /api/admin/narrative (POST → GCS + GitHub)      │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## DEX Object Model

### Base Interface

```typescript
// src/core/schema/dex.ts

/**
 * DEX Object Types
 * All objects in the Kinetic system derive from this enum
 */
export type DEXObjectType = 'lens' | 'journey' | 'node' | 'hub' | 'card' | 'sprout';

/**
 * Version entry for evolution tracking
 */
export interface DEXVersionEntry {
  version: number;
  timestamp: string;
  changedBy: 'human' | 'agent';
  agentId?: string;
  changeDescription: string;
  diff?: Record<string, { old: unknown; new: unknown }>;
}

/**
 * Base interface for all DEX-compliant objects
 * 
 * Implements Kinetic Architecture principles:
 * - Declarative Sovereignty: Objects are data, not code
 * - Provenance as Infrastructure: Full attribution chain
 * - Organic Scalability: Kinetic fields are optional
 */
export interface DEXObject {
  // === Identity ===
  id: string;
  type: DEXObjectType;
  
  // === Display ===
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  
  // === Lifecycle ===
  status: 'draft' | 'active' | 'archived';
  version: number;
  createdAt: string;
  updatedAt: string;
  
  // === Kinetic Metadata (Future Agent Support) ===
  proposedBy?: 'human' | 'agent';
  approvedBy?: string;
  telemetryScore?: number;
  evolutionHistory?: DEXVersionEntry[];
  
  // === Capture Provenance (Entropy Integration) ===
  captureContext?: DEXCaptureContext;
}

/**
 * Capture context for provenance tracking
 * Records the conditions under which an object was created/captured
 * Enables "cognitive archaeology" per Entropy Infrastructure Vision
 */
export interface DEXCaptureContext {
  entropyScore?: number;                    // Complexity score at capture time (0-1)
  entropyLevel?: 'low' | 'medium' | 'high'; // Discretized complexity
  sessionId?: string;                       // Conversation session
  journeyId?: string;                       // If captured during journey
  nodeId?: string;                          // Specific journey step
  lensId?: string;                          // Active persona/lens
}

/**
 * Journey - A structured narrative path
 */
export interface DEXJourney extends DEXObject {
  type: 'journey';
  
  // Navigation
  entryNodeId?: string;
  
  // Metadata
  estimatedMinutes?: number;
  linkedHubId?: string;
  
  // Display (from Journey type)
  title: string;  // Alias for label
}

/**
 * Node - A step within a journey
 */
export interface DEXNode extends DEXObject {
  type: 'node';
  
  // Content
  query: string;
  contextSnippet?: string;
  
  // Navigation
  journeyId: string;
  sequenceOrder?: number;
  primaryNext?: string;
  alternateNext?: string[];
  
  // Routing
  hubId?: string;
  sectionId?: string;
}

/**
 * Hub - Topic routing configuration
 */
export interface DEXHub extends DEXObject {
  type: 'hub';
  
  // Routing
  tags: string[];
  priority: number;
  enabled: boolean;
  
  // Content
  primarySource: string;
  supportingSources: string[];
  expertFraming: string;
  keyPoints: string[];
}

/**
 * Lens - Persona/perspective configuration
 */
export interface DEXLens extends DEXObject {
  type: 'lens';
  
  // State
  enabled: boolean;
  
  // Behavior
  toneGuidance: string;
  narrativeStyle: string;
  arcEmphasis: Record<string, number>;
  openingPhase: string;
  defaultThreadLength: number;
  
  // Navigation
  entryPoints: string[];
  suggestedThread: string[];
  
  // Display
  publicLabel: string;  // User-facing name
}

/**
 * Card - Legacy V2.0 navigation unit (backward compat)
 */
export interface DEXCard extends DEXObject {
  type: 'card';
  
  query: string;
  contextSnippet?: string;
  personas: string[];
  next: string[];
  sectionId?: string;
  hubId?: string;
}
```

---

## Component Specifications

### SegmentedControl

```typescript
// src/shared/SegmentedControl.tsx

interface SegmentedControlOption<T extends string> {
  id: T;
  label: string;
  icon?: string;  // Material Symbols name
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';  // Default: 'md'
  fullWidth?: boolean;
  className?: string;
}

// Usage:
<SegmentedControl
  options={[
    { id: 'journeys', label: 'Journeys', icon: 'map' },
    { id: 'nodes', label: 'Nodes', icon: 'hub' },
  ]}
  value={viewMode}
  onChange={setViewMode}
/>
```

### ObjectList

```typescript
// src/shared/ObjectList.tsx

interface ObjectListItem {
  id: string;
  label: string;
  count?: number;
  status?: 'active' | 'inactive' | 'draft';
}

interface ObjectListProps<T> {
  items: T[];
  selectedId: string | null;
  activeInspectorId: string | null;
  onSelect: (id: string) => void;
  getItemProps: (item: T) => ObjectListItem;
  emptyMessage?: string;
  className?: string;
}

// Usage:
<ObjectList
  items={journeys}
  selectedId={selectedJourneyId}
  activeInspectorId={inspector.mode.type === 'journey' ? inspector.mode.journeyId : null}
  onSelect={handleJourneyClick}
  getItemProps={(j) => ({
    id: j.id,
    label: j.title,
    count: nodes.filter(n => n.journeyId === j.id).length,
    status: j.status === 'active' ? 'active' : 'inactive',
  })}
  emptyMessage="No journeys yet"
/>
```

### ObjectGrid

```typescript
// src/shared/ObjectGrid.tsx

interface ObjectCardBadge {
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

interface ObjectCardProps {
  id: string;
  title: string;
  subtitle: string;
  badges?: ObjectCardBadge[];
}

interface ObjectGridProps<T> {
  items: T[];
  activeInspectorId: string | null;
  searchQuery: string;
  onSelect: (id: string) => void;
  getCardProps: (item: T) => ObjectCardProps;
  emptyMessage?: string;
  emptySearchMessage?: string;
  columns?: 2 | 3 | 4;  // Default: 2
  maxHeight?: string;   // Default: '50vh'
  className?: string;
}

// Usage:
<ObjectGrid
  items={filteredNodes}
  activeInspectorId={inspector.mode.type === 'node' ? inspector.mode.nodeId : null}
  searchQuery={searchQuery}
  onSelect={handleNodeClick}
  getCardProps={(node) => ({
    id: node.id,
    title: node.label,
    subtitle: node.id,
    badges: [
      node.sequenceOrder !== undefined && { label: `#${node.sequenceOrder}`, variant: 'success' },
      { label: node.primaryNext ? '→' : '∅', variant: 'default' },
    ].filter(Boolean),
  })}
  emptyMessage="No nodes yet"
  emptySearchMessage="No nodes match your search"
/>
```

---

## DEX Registry Implementation

```typescript
// src/core/registry/DEXRegistry.ts

import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type { DEXObject, DEXObjectType, DEXJourney, DEXNode, DEXHub, DEXLens } from '../schema/dex';

interface DEXRegistryState {
  objects: {
    journey: Record<string, DEXJourney>;
    node: Record<string, DEXNode>;
    hub: Record<string, DEXHub>;
    lens: Record<string, DEXLens>;
    card: Record<string, DEXCard>;
    sprout: Record<string, DEXObject>;
  };
  loading: boolean;
  saving: boolean;
  status: string | null;
}

type DEXRegistryAction =
  | { type: 'HYDRATE'; payload: NarrativeSchemaV2 }
  | { type: 'SET_OBJECTS'; objectType: DEXObjectType; objects: Record<string, DEXObject> }
  | { type: 'UPDATE_OBJECT'; objectType: DEXObjectType; id: string; updates: Partial<DEXObject> }
  | { type: 'DELETE_OBJECT'; objectType: DEXObjectType; id: string }
  | { type: 'SET_STATUS'; status: string | null }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SAVING'; saving: boolean };

interface DEXRegistryContext {
  state: DEXRegistryState;
  
  // Read operations
  get: <T extends DEXObject>(type: DEXObjectType, id: string) => T | null;
  getAll: <T extends DEXObject>(type: DEXObjectType) => T[];
  filter: <T extends DEXObject>(type: DEXObjectType, predicate: (item: T) => boolean) => T[];
  
  // Write operations
  update: <T extends DEXObject>(type: DEXObjectType, id: string, updates: Partial<T>) => void;
  delete: (type: DEXObjectType, id: string) => void;
  create: <T extends DEXObject>(type: DEXObjectType, partial: Omit<T, 'id' | 'version' | 'createdAt' | 'updatedAt'>) => string;
  
  // Persistence
  hydrate: (schema: NarrativeSchemaV2) => void;
  dehydrate: () => NarrativeSchemaV2;
  save: () => Promise<void>;
  refresh: () => Promise<void>;
}
```

---

## File Structure

```
src/
├── core/
│   └── schema/
│       ├── dex.ts              # NEW: DEX type system
│       ├── foundation.ts       # Existing: Inspector modes
│       └── sprout-queue.ts     # Existing: Sprout types
├── core/
│   └── registry/
│       ├── DEXRegistry.tsx     # NEW: Registry provider
│       ├── useDEXRegistry.ts   # NEW: Registry hook
│       └── index.ts            # NEW: Exports
├── shared/
│   ├── SegmentedControl.tsx    # NEW: View toggle
│   ├── ObjectList.tsx          # NEW: Generic list
│   ├── ObjectGrid.tsx          # NEW: Generic grid
│   └── index.ts                # UPDATE: Add exports
├── foundation/
│   ├── hooks/
│   │   └── useNarrativeSchema.ts  # UPDATE: Delegate to registry
│   └── consoles/
│       └── NarrativeArchitect.tsx # UPDATE: Use new components
```

---

## Data Flow

### Load Flow
```
App Mount
    │
    ▼
DEXRegistryProvider
    │
    ├── fetch('/api/narrative')
    │       │
    │       ▼
    │   NarrativeSchemaV2
    │       │
    │       ▼
    │   registry.hydrate(schema)
    │       │
    │       ▼
    │   Convert to DEX objects
    │       │
    │       ▼
    │   state.objects populated
    │
    ▼
NarrativeArchitect
    │
    ├── useDEXRegistry().getAll('journey')
    └── useDEXRegistry().getAll('node')
```

### Save Flow
```
User clicks "Save to Production"
    │
    ▼
useNarrativeSchema().save()
    │
    ├── registry.dehydrate() → NarrativeSchemaV2
    │
    ├── POST /api/admin/narrative
    │       │
    │       ▼
    │   GCS save (immediate)
    │   GitHub sync (best-effort)
    │
    ▼
Update status message
```

---

## DEX Compliance Verification

| Principle | Implementation |
|-----------|----------------|
| **Declarative Sovereignty** | All object behavior defined in JSON schema, not code |
| **Capability Agnosticism** | Registry works regardless of object type; new types add trivially |
| **Provenance as Infrastructure** | `proposedBy`, `approvedBy`, `evolutionHistory` fields on every object |
| **Organic Scalability** | Kinetic fields optional; system works without them |
