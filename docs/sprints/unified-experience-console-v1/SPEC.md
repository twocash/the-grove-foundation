# Sprint Specification: Console Factory v2

**Sprint Name:** unified-experience-console-v1 (evolved to Console Factory v2)
**Domain:** Bedrock
**Type:** Architectural Foundation
**Priority:** P0 (blocks all future console types)
**Estimated Effort:** Large (multi-phase)
**Created:** 2025-01-12
**Updated:** 2026-01-12
**Author:** Jim Calhoun / Claude

---

## Executive Summary

Replace hard-coded console pages with a schema-driven **Console Factory**. This is the frontend implementation of the "Trellis" architecture—separating configuration (what a console does) from execution (how it renders).

> **SEQUENCING NOTE:** This sprint is **blocked by** `inspector-fixes-v1` (Universal Inspector Fixes A-D).
> Complete the tactical fixes first, then extract the proven patterns into this factory.
> See: [Universal Inspector Fixes](https://www.notion.so/2e6780a78eef8112a18be10afb9c1ebd)

**The Vision:**
```
ConsoleSchema (JSON) → ConsoleFactory (Engine) → Consistent UI
```

**After this sprint:**
- Adding a new console type = write a schema definition (no new components)
- All inspectors follow identical visual layout
- No duplicate filter dropdowns
- Future: Admin-defined console views via saved schemas

---

## The Problem

### Current State (Inconsistent)

```
ExperienceConsole.tsx  → Custom JSX for prompts
FeatureFlagConsole.tsx → Custom JSX for flags (divergent)
NurseryConsole.tsx     → Custom JSX for sprouts

Result:
- Feature Flag Inspector looks different than System Prompt Inspector
- Duplicate "State" dropdowns when switching types
- Every new type requires a new custom component
```

### Evidence of Inconsistency

| Feature | System Prompt (Goal) | Feature Flag (Current) |
|---------|---------------------|------------------------|
| **Header** | Icon + Name + Subtitle | Raw database ID as title |
| **Status** | Green dot indicator | Massive toggle in header |
| **Body** | Collapsible accordions | Flat form, no hierarchy |
| **Footer** | Primary action + secondary row | Mixed, inconsistent |

### Target State (Declarative)

```
config/consoles.ts:
  - FeatureFlagConsoleDef (schema)
  - SystemPromptConsoleDef (schema)
  - NurseryConsoleDef (schema)

components/factories/ConsoleFactory.tsx:
  - Single engine renders any schema

Result:
- One change to Factory = all consoles updated
- Visual consistency enforced by schema
- New type = new schema definition only
```

---

## Architecture: Three Layers

### Layer 1: ConsoleSchema (The Contract)

```typescript
// types/ConsoleSchema.ts
import { LucideIcon } from 'lucide-react';

export interface FilterDef {
  id: string;
  label: string;
  type: 'select' | 'text' | 'boolean';
  options?: string[];
}

export interface InspectorField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'toggle' | 'number';
  section: 'config' | 'metadata' | 'logic';
}

export interface InspectorSchema {
  titleField: string;      // Which data key is the "H1"?
  subtitleField?: string;  // Which data key is the UUID?
  statusField?: string;    // Which field determines active/inactive?
  fields: InspectorField[];
}

export interface ConsoleSchema {
  id: string;
  identity: {
    title: string;
    icon: LucideIcon;
    color: string;  // e.g., "text-emerald-500"
  };
  filters: FilterDef[];
  list: {
    cardVariant: 'standard' | 'compact' | 'detailed';
    sortOptions: string[];
  };
  inspector: InspectorSchema;
}
```

### Layer 2: Console Definitions (The DNA)

```typescript
// config/consoles.ts
import { Flag, Terminal, Seedling } from 'lucide-react';
import { ConsoleSchema } from '../types/ConsoleSchema';

export const FeatureFlagConsoleDef: ConsoleSchema = {
  id: 'feature-flags',
  identity: {
    title: 'Feature Flags',
    icon: Flag,
    color: 'text-orange-500'
  },
  filters: [
    { id: 'availability', label: 'Availability', type: 'select', options: ['Global', 'Beta'] }
    // No "Category" filter here - explicitly defined per type, solving the conflict
  ],
  list: {
    cardVariant: 'compact',
    sortOptions: ['updated', 'name']
  },
  inspector: {
    titleField: 'friendlyName',
    subtitleField: 'id',
    statusField: 'isEnabled',
    fields: [
      { id: 'description', label: 'Description', type: 'textarea', section: 'config' },
      { id: 'isImmutable', label: 'Immutable', type: 'toggle', section: 'config' },
      { id: 'order', label: 'Sort Order', type: 'number', section: 'metadata' }
    ]
  }
};

export const SystemPromptConsoleDef: ConsoleSchema = {
  id: 'system-prompts',
  identity: {
    title: 'System Prompts',
    icon: Terminal,
    color: 'text-emerald-500'
  },
  filters: [
    { id: 'state', label: 'State', type: 'select', options: ['Active', 'Draft'] },
    { id: 'persona', label: 'Persona', type: 'select', options: ['Architect', 'Guide'] }
  ],
  list: {
    cardVariant: 'standard',
    sortOptions: ['updated', 'usage']
  },
  inspector: {
    titleField: 'name',
    subtitleField: 'version',
    statusField: 'isActive',
    fields: [
      { id: 'voice', label: 'Voice Settings', type: 'textarea', section: 'logic' }
    ]
  }
};
```

### Layer 3: Data Service Contract (The Brain)

```typescript
// services/types.ts

// Standard response for any action
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Contract every "Manager" must fulfill
export interface IDataService<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  update(id: string, updates: Partial<T>): Promise<ServiceResponse<T>>;
  create(newItem: Omit<T, 'id'>): Promise<ServiceResponse<T>>;
  delete(id: string): Promise<ServiceResponse<void>>;
}
```

### Layer 4: MCP Client (The Transport)

```typescript
// services/mcp/MCPClient.ts

interface MCPResponse<T> {
  content: { type: string; text: string; data?: T }[];
  isError?: boolean;
}

export const MCPClient = {
  /**
   * Reads a dataset (Resource) from the MCP Server
   * URI Example: "grove://feature-flags/all"
   */
  async readResource<T>(uri: string): Promise<T | null> {
    try {
      const response = await fetch('/api/mcp/read-resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri })
      });

      const result = await response.json();
      if (result.contents?.[0]?.text) {
        return JSON.parse(result.contents[0].text) as T;
      }
      return null;
    } catch (error) {
      console.error(`MCP Read Error [${uri}]:`, error);
      return null;
    }
  },

  /**
   * Executes a command (Tool) on the MCP Server
   * Tool Example: "update_flag", Args: { id: "flag-1", isEnabled: true }
   */
  async callTool<T>(name: string, args: Record<string, any>): Promise<T> {
    const response = await fetch('/api/mcp/call-tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, arguments: args })
    });

    const result = await response.json();

    if (result.isError) {
      throw new Error(result.content?.[0]?.text || "MCP Tool Execution Failed");
    }

    const outputText = result.content?.[0]?.text;
    return outputText ? JSON.parse(outputText) : null;
  }
};
```

**MCP Pattern:**
- **Reading:** Request a Resource URI (e.g., `grove://flags/all`)
- **Writing:** Call a Tool with arguments (e.g., `update_flag { id, changes }`)

### Layer 4b: Service Implementations (MCP-Backed)

```typescript
// services/FeatureFlagService.ts
import { IDataService, ServiceResponse } from './types';
import { MCPClient } from './mcp/MCPClient';

interface FeatureFlag {
  id: string;
  friendlyName: string;
  isEnabled: boolean;
  description?: string;
}

export const FeatureFlagService: IDataService<FeatureFlag> = {

  async getAll() {
    const flags = await MCPClient.readResource<FeatureFlag[]>('grove://feature-flags/all');
    return flags || [];
  },

  async getById(id: string) {
    const flags = await this.getAll();
    return flags.find(f => f.id === id) || null;
  },

  async update(id: string, updates: Partial<FeatureFlag>) {
    try {
      const updatedFlag = await MCPClient.callTool<FeatureFlag>('update_feature_flag', {
        id,
        ...updates
      });
      return { success: true, data: updatedFlag };
    } catch (error) {
      console.error("Update Failed:", error);
      return { success: false, error: String(error) };
    }
  },

  async create(newItem) {
    try {
      const newFlag = await MCPClient.callTool<FeatureFlag>('create_feature_flag', newItem);
      return { success: true, data: newFlag };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  async delete(id) {
    await MCPClient.callTool('delete_feature_flag', { id });
    return { success: true };
  }
};
```

**Note:** For development/testing, services can use mock data. Swap to MCP when backend is ready.

---

## Storage Strategy Decision (PENDING)

> **IMPORTANT:** Before implementing MCP persistence, evaluate implications of moving away from Supabase.

### Option A: Supabase (Current)
- Data lives in hosted Postgres
- Real-time subscriptions available
- Multi-device sync built-in
- Auth integration existing

### Option B: Local MCP Server (Reference Implementation)
- Data lives in local JSON files (`corpus/flags.json`)
- Grove Node becomes self-contained "Trellis"
- Full data ownership ("data you own, not rent")
- MCP protocol standard

### Option C: Hybrid (Recommended)

The hybrid approach separates concerns by data ownership and sync requirements:

**Supabase Handles (Cloud-Native Data):**
- User authentication & sessions
- Multi-device sync (real-time subscriptions)
- Collaboration features (shared workspaces)
- Usage analytics & telemetry
- Data that benefits from server-side queries

**MCP Server Handles (Local-First Data):**
- Configuration files (flags, prompts, schemas)
- Corpus content (research, notes, local knowledge)
- Sensitive data user doesn't want in cloud
- Offline-capable operations
- Data that should survive provider changes

**Architecture Pattern:**
```
┌─────────────────────────────────────────────────────────┐
│                    Grove Console UI                      │
├─────────────────────────────────────────────────────────┤
│                   useConsoleData Hook                    │
├─────────────────┬───────────────────────────────────────┤
│  IDataService   │           IDataService                 │
│  (Supabase)     │           (MCP Local)                  │
├─────────────────┼───────────────────────────────────────┤
│ • Auth/Users    │ • Feature Flags                        │
│ • Sessions      │ • System Prompts                       │
│ • Sync State    │ • Console Schemas                      │
│ • Analytics     │ • Research Corpus                      │
└─────────────────┴───────────────────────────────────────┘
         │                        │
         ▼                        ▼
   [Supabase Cloud]        [Local corpus/*.json]
```

**Service Registry with Hybrid:**
```typescript
// services/registry.ts
import { SupabaseUserService } from './supabase/UserService';
import { MCPFeatureFlagService } from './mcp/FeatureFlagService';
import { MCPSystemPromptService } from './mcp/SystemPromptService';

export const SERVICES = {
  // Cloud-backed (Supabase)
  'users': SupabaseUserService,
  'sessions': SupabaseSessionService,

  // Local-backed (MCP)
  'feature-flags': MCPFeatureFlagService,
  'system-prompts': MCPSystemPromptService,
  'research-agents': MCPResearchAgentService,
};
```

**Sync Strategy:**
- Local MCP is source of truth for config
- Supabase stores "last synced" metadata for multi-device
- Conflict resolution: last-write-wins with version vectors
- Optional: push config snapshots to Supabase for backup

**Benefits:**
- ✅ Full offline capability for core features
- ✅ Real-time collaboration where needed
- ✅ Data portability (export corpus folder)
- ✅ No vendor lock-in for configuration
- ✅ Supabase auth without Supabase data dependency

**Decision Required:** Before Phase 10 (Persistence Layer)

### Reference: MCP Server Implementation

> **Architecture Note:** By implementing this server, your Grove Node becomes a self-contained "Trellis" that manages its own configuration file via standard MCP protocols. This is the realization of "data you own, not rent."

If Option B or C is chosen, the MCP server pattern:

```typescript
// server.ts - Grove Node Core
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({ name: "grove-node-core", version: "1.0.0" });
const FLAGS_FILE = path.join(process.cwd(), "corpus", "flags.json");

// Resource: grove://flags/all (READ)
server.resource("all-flags", "grove://flags/all", {}, async (uri) => {
  const data = await fs.readFile(FLAGS_FILE, "utf-8");
  return { contents: [{ uri: uri.href, mimeType: "application/json", text: data }] };
});

// Tool: update_flag (WRITE)
server.tool("update_flag", {
  id: z.string(),
  changes: z.object({ friendlyName: z.string().optional(), isEnabled: z.boolean().optional() })
}, async ({ id, changes }) => {
  const flags = JSON.parse(await fs.readFile(FLAGS_FILE, "utf-8"));
  const index = flags.findIndex(f => f.id === id);
  flags[index] = { ...flags[index], ...changes };
  await fs.writeFile(FLAGS_FILE, JSON.stringify(flags, null, 2));
  return { content: [{ type: "text", text: JSON.stringify(flags[index]) }] };
});
```

**Data Flow with MCP Server:**
```
UI Toggle → ConsoleFactory → useConsoleData → FeatureFlagService
    → MCPClient.callTool('update_flag', {...})
    → /api/mcp/call-tool → MCP Server
    → Read flags.json → Update → Write flags.json
    → Return updated object → UI re-renders
```

### Layer 5: Draft State Hook (Buffered Editing)

```typescript
// hooks/useDraftState.ts
import { useState, useEffect } from 'react';

export const useDraftState = <T extends { id: string }>(initialData: T | null) => {
  const [draft, setDraft] = useState<T | null>(initialData);
  const [isDirty, setIsDirty] = useState(false);

  // Reset draft when user selects different object
  useEffect(() => {
    setDraft(initialData);
    setIsDirty(false);
  }, [initialData?.id]);

  const updateField = (key: keyof T, value: any) => {
    if (!draft) return;
    setDraft(prev => prev ? ({ ...prev, [key]: value }) : null);
    setIsDirty(true);
  };

  return { draft, isDirty, updateField, reset: () => setDraft(initialData) };
};
```

**Why Buffered State:**
- Typing in textarea doesn't trigger 50 database writes
- User must explicitly click "Save" (Review step in DEX)
- `isDirty` flag enables/disables Save button
- Aligns with "declarative intent → explicit commit" pattern

### Layer 6: Universal Data Hook (The Bridge)

```typescript
// hooks/useConsoleData.ts
import { useState, useEffect } from 'react';
import { FeatureFlagService } from '../services/FeatureFlagService';
import { SystemPromptService } from '../services/SystemPromptService';

// Registry matching Console IDs to Services
const SERVICES = {
  'feature-flags': FeatureFlagService,
  'system-prompts': SystemPromptService
};

export const useConsoleData = (consoleId: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const service = SERVICES[consoleId];

  useEffect(() => {
    if (!service) return;
    load();
  }, [consoleId]);

  const load = async () => {
    setLoading(true);
    const items = await service.getAll();
    setData(items);
    setLoading(false);
  };

  const updateItem = async (id: string, updates: any) => {
    const res = await service.update(id, updates);
    if (res.success && res.data) {
      setData(current => current.map(item => item.id === id ? res.data : item));
    }
    return res;
  };

  const createItem = async (newItem: any) => {
    const res = await service.create(newItem);
    if (res.success && res.data) {
      setData(current => [...current, res.data]);
    }
    return res;
  };

  const deleteItem = async (id: string) => {
    const res = await service.delete(id);
    if (res.success) {
      setData(current => current.filter(item => item.id !== id));
    }
    return res;
  };

  return { data, loading, updateItem, createItem, deleteItem, refresh: load };
};
```

### Layer 6: ConsoleFactory (The Engine)

```typescript
// components/factories/ConsoleFactory.tsx
import React, { useState } from 'react';
import { ConsoleSchema } from '../../types/ConsoleSchema';
import { UniversalInspector } from '../inspectors/UniversalInspector';
import { FilterBar } from '../ui/FilterBar';
import { useConsoleData } from '../../hooks/useConsoleData';

export const ConsoleFactory: React.FC<{ definition: ConsoleSchema }> = ({ definition }) => {
  // Connect to the Brain
  const { data, loading, updateItem, deleteItem } = useConsoleData(definition.id);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState({});

  const activeItem = data.find(d => d.id === selectedId);

  // Handle card quick actions (e.g., toggle)
  const handleCardAction = (type: string, item: any) => {
    if (type === 'toggle') {
      const statusField = definition.inspector.statusField || 'isEnabled';
      updateItem(item.id, { [statusField]: !item[statusField] });
    }
  };

  // Handle inspector save
  const handleInspectorSave = (updates: any) => {
    if (selectedId) {
      updateItem(selectedId, updates);
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (selectedId) {
      deleteItem(selectedId);
      setSelectedId(null);
    }
  };

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>;

  return (
    <div className="flex h-full bg-slate-950">

      {/* LEFT: Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header & Filters */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4">
            <definition.identity.icon className={`w-6 h-6 ${definition.identity.color}`} />
            <h1 className="text-xl font-bold text-white">{definition.identity.title}</h1>
          </div>

          <FilterBar
            config={definition.filters}
            activeFilters={filters}
            onChange={setFilters}
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 grid gap-4">
          {data.map(item => (
            <ConsoleCard
              key={item.id}
              item={item}
              definition={definition}
              selected={selectedId === item.id}
              onClick={() => setSelectedId(item.id)}
              onAction={(type) => handleCardAction(type, item)}
            />
          ))}
        </div>
      </div>

      {/* RIGHT: Inspector */}
      {activeItem && (
        <UniversalInspector
          item={activeItem}
          schema={definition.inspector}
          icon={definition.identity.icon}
          onClose={() => setSelectedId(null)}
          onSave={handleInspectorSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};
```

---

### Layer 8: InspectorForm (Dynamic Form Generation)

```typescript
// components/inspectors/InspectorForm.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { InspectorSchema, InspectorField } from '../../types/ConsoleSchema';

interface Props {
  definition: InspectorSchema;
  data: any;  // The "Draft" object
  onChange: (key: string, value: any) => void;
}

// Reusable Accordion Section
const FormSection = ({ title, children, defaultOpen = false }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/40 mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200"
      >
        {title}
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {isOpen && <div className="p-4 border-t border-slate-800">{children}</div>}
    </div>
  );
};

export const InspectorForm: React.FC<Props> = ({ definition, data, onChange }) => {
  if (!data) return null;

  // Group fields by section
  const sections = definition.fields.reduce((acc, field) => {
    const sec = field.section || 'uncategorized';
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(field);
    return acc;
  }, {} as Record<string, InspectorField[]>);

  const SECTION_ORDER = ['config', 'logic', 'metadata'];
  const SECTION_LABELS = {
    config: 'Configuration',
    logic: 'Logic & State',
    metadata: 'Metadata'
  };

  return (
    <div className="space-y-1">
      {SECTION_ORDER.map(sectionKey => {
        const fields = sections[sectionKey];
        if (!fields) return null;

        return (
          <FormSection
            key={sectionKey}
            title={SECTION_LABELS[sectionKey] || sectionKey}
            defaultOpen={sectionKey === 'config'}
          >
            {fields.map(field => (
              <div key={field.id} className="mb-4 last:mb-0">
                {field.type === 'toggle' ? (
                  <ToggleField
                    label={field.label}
                    value={data[field.id]}
                    onChange={(v) => onChange(field.id, v)}
                  />
                ) : (
                  <BaseInput
                    label={field.label}
                    type={field.type === 'number' ? 'number' : 'text'}
                    multiline={field.type === 'textarea'}
                    value={data[field.id] || ''}
                    onChange={(e) => onChange(field.id, e.target.value)}
                  />
                )}
              </div>
            ))}
          </FormSection>
        );
      })}
    </div>
  );
};
```

**Key Features:**
- Fields auto-grouped into accordions by `section` property
- Section order: config (expanded) → logic → metadata
- Toggle, text, textarea, number types rendered correctly
- Never manually layout a form again

---

## Universal Inspector Layout

Every inspector follows this exact structure:

```
┌────────────────────────────────────────┐
│  IDENTITY HEADER                       │
│  [Icon] Friendly Name (H1)             │
│  uuid-in-monospace • 🟢 Status Badge   │
├────────────────────────────────────────┤
│  ▼ Configuration (expanded)            │
│    Description field                   │
│    Key field                           │
├────────────────────────────────────────┤
│  ▶ Logic & State (collapsed)           │
├────────────────────────────────────────┤
│  FOOTER                                │
│  [███ Primary Action ███]              │
│  [Duplicate] [Delete] [Save]           │
│  ▶ Experience Copilot                  │
└────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Schema & Types
- [ ] Create `types/ConsoleSchema.ts`
- [ ] Define `ConsoleSchema`, `FilterDef`, `InspectorSchema` interfaces
- [ ] Create `services/types.ts` with `IDataService`, `ServiceResponse`

**Gate:** TypeScript compiles with no errors

### Phase 2: Console Definitions
- [ ] Create `config/consoles.ts`
- [ ] Define `FeatureFlagConsoleDef`
- [ ] Define `SystemPromptConsoleDef`

**Gate:** All definitions satisfy ConsoleSchema type

### Phase 3: Service Layer
- [ ] Create `services/FeatureFlagService.ts` implementing `IDataService`
- [ ] Create `services/SystemPromptService.ts` implementing `IDataService`
- [ ] Mock data for immediate testing
- [ ] Console logging for debugging

**Gate:** Services return mock data correctly

### Phase 4: Universal Data Hook
- [ ] Create `hooks/useConsoleData.ts`
- [ ] Implement service registry (console ID → service)
- [ ] Implement CRUD operations with optimistic updates
- [ ] Handle loading states

**Gate:** Hook loads and updates mock data

### Phase 5: FilterBar Component
- [ ] Create `components/ui/FilterBar.tsx`
- [ ] Render filters from `FilterDef[]` config
- [ ] Support select, text, boolean types

**Gate:** FilterBar renders from schema

### Phase 6: UniversalInspector Component
- [ ] Create `components/inspectors/UniversalInspector.tsx`
- [ ] Implement Identity Header (icon + name + subtitle + status)
- [ ] Implement Accordion sections from schema
- [ ] Implement Standard Footer with Save/Delete wiring
- [ ] Apply fixes from Fix Queue (A, B, C, D)

**Gate:** Inspector layout matches wireframe, Save works

### Phase 7: ConsoleFactory Component
- [ ] Create `components/factories/ConsoleFactory.tsx`
- [ ] Wire useConsoleData hook
- [ ] Wire FilterBar rendering
- [ ] Wire list rendering with card actions
- [ ] Wire UniversalInspector with callbacks

**Gate:** Toggle on card updates state, Save in inspector persists

### Phase 8: Migration
- [ ] Update Experience.tsx to use ConsoleFactory
- [ ] Route switcher between console definitions
- [ ] Remove legacy console components

**Gate:** /bedrock/experience renders both types via factory

### Phase 9: Polish & Testing
- [ ] Visual regression screenshots
- [ ] E2E tests for both console types
- [ ] Accessibility verification (ARIA, keyboard nav)
- [ ] Code-simplifier pass

**Gate:** All tests pass, REVIEW.html complete

---

## DEX Compliance Matrix

| Principle | How Factory Supports |
|-----------|---------------------|
| **Declarative Sovereignty** | Console behavior defined in schema, not code |
| **Capability Agnosticism** | Factory renders any object type identically |
| **Provenance as Infrastructure** | Schema is traceable config |
| **Organic Scalability** | New console = new schema, not new component |

---

## Files Changed

### New Files
| File | Purpose |
|------|---------|
| `types/ConsoleSchema.ts` | UI schema contracts |
| `services/types.ts` | Service contracts (IDataService, ServiceResponse) |
| `config/consoles.ts` | Console definitions (DNA) |
| `services/FeatureFlagService.ts` | Flag data operations |
| `services/SystemPromptService.ts` | Prompt data operations |
| `hooks/useConsoleData.ts` | Universal data hook (bridge) |
| `hooks/useDraftState.ts` | Buffered editing with dirty tracking |
| `components/ui/FilterBar.tsx` | Schema-driven filter bar |
| `components/ui/BaseInput.tsx` | Standard input component |
| `components/ui/ToggleField.tsx` | Standard toggle component |
| `components/inspectors/UniversalInspector.tsx` | Standard inspector layout |
| `components/inspectors/InspectorForm.tsx` | Dynamic form from schema |
| `components/factories/ConsoleFactory.tsx` | Console rendering engine |

### Modified Files
- `pages/Experience.tsx` (use factory)

### Deleted Files
- `components/ExperienceConsole.tsx` (replaced by factory)
- `components/FeatureFlagConsole.tsx` (replaced by factory)

---

## Success Criteria

### Sprint Complete When:
- [ ] ConsoleSchema type defined and documented
- [ ] 2+ console definitions working (Flags, Prompts)
- [ ] ConsoleFactory renders both identically
- [ ] UniversalInspector enforces consistent layout
- [ ] No duplicate filter dropdowns
- [ ] Feature Flag inspector matches System Prompt visually
- [ ] Legacy console components removed
- [ ] All E2E tests pass
- [ ] REVIEW.html complete with screenshots

### Sprint Failed If:
- ❌ New console requires custom component (not schema)
- ❌ Inspector layouts differ between types
- ❌ Filter dropdowns duplicated
- ❌ Factory pattern not enforced

---

## Related Work

- **Sub-spec:** Universal Inspector Schema (Notion)
- **Fix Queue:** 4 Feature Flag Inspector fixes
- **Strategic Note:** Inspector UI Pattern: Standard Layout for Object Coherence
- **Blocks:** Evidence Collection Engine (ResearchAgentConfig is a singleton in Experience Console)
- **Protocol:** Grove Execution Protocol v1.4

---

## Future Vision

Once Console Factory is established:

1. **Admin-defined consoles** — Users save custom ConsoleSchema to database
2. **Plugin architecture** — Third parties define schemas for their object types
3. **A/B testing** — Swap card variants via config, not code deploys
4. **Recursive consoles** — Console definitions can reference other consoles

---

*This contract is binding. Deviation requires explicit human approval.*
