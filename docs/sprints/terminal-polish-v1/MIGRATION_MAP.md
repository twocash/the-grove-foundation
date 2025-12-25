# Terminal Polish v1 — Migration Map

**Sprint:** terminal-polish-v1  
**This document:** Exact file changes for CLI execution

---

## Change 1: Card Tokens

### File: `styles/globals.css`

**Location:** Find the `:root { }` block containing `--chat-*` tokens. Add AFTER it:

```css
/* ============================================================
   CARD TOKENS (Sprint 6 implementation)
   Visual states for card components (CardShell, LensCard, etc.)
   ============================================================ */
:root {
  /* Card borders */
  --card-border-default: #e7e5e4;
  --card-border-inspected: #22d3ee;  /* cyan-400 */
  --card-border-active: rgba(16, 185, 129, 0.5);  /* emerald with alpha */
  
  /* Card backgrounds */
  --card-bg-active: rgba(16, 185, 129, 0.05);
  
  /* Card rings (focus/selection states) */
  --card-ring-color: #22d3ee;  /* cyan-400 */
  --card-ring-active: rgba(16, 185, 129, 0.3);
  
  /* Violet variant (custom lenses) */
  --card-ring-violet: #a78bfa;  /* violet-400 */
  --card-border-violet: #a78bfa;
  --card-bg-violet-active: rgba(139, 92, 246, 0.05);
}

.dark {
  --card-border-default: #334155;  /* slate-700 */
  --card-bg-active: rgba(16, 185, 129, 0.1);
  --card-bg-violet-active: rgba(139, 92, 246, 0.1);
}

/* JSON syntax highlighting (for ObjectInspector) */
.json-key { color: #06b6d4; }      /* cyan-500 */
.json-string { color: #10b981; }   /* emerald-500 */
.json-number { color: #f59e0b; }   /* amber-500 */
.json-boolean { color: #8b5cf6; }  /* violet-500 */
.json-null { color: #64748b; }     /* slate-500 */
```

**Lines added:** ~35

---

## Change 2: ObjectInspector Component

### Create Directory: `src/shared/inspector/`

### Create File: `src/shared/inspector/ObjectInspector.tsx`

```tsx
// src/shared/inspector/ObjectInspector.tsx
// JSON inspector for GroveObjects

import { useState } from 'react';
import { GroveObject } from '@core/schema/grove-object';
import { InspectorPanel, InspectorDivider } from '../layout/InspectorPanel';

interface ObjectInspectorProps {
  object: GroveObject;
  title?: string;
  onClose: () => void;
}

export function ObjectInspector({ object, title, onClose }: ObjectInspectorProps) {
  const [metaExpanded, setMetaExpanded] = useState(true);
  const [payloadExpanded, setPayloadExpanded] = useState(true);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(object, null, 2));
  };

  const displayTitle = title || object.meta.title || 'Object';

  return (
    <InspectorPanel
      title="Object Inspector"
      subtitle={displayTitle}
      icon="data_object"
      iconColor="text-cyan-500"
      iconBg="bg-cyan-950"
      onClose={onClose}
      actions={
        <button
          onClick={copyToClipboard}
          className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 flex items-center justify-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-base">content_copy</span>
          Copy Full JSON
        </button>
      }
    >
      {/* Meta Section */}
      <CollapsibleSection
        title="META"
        expanded={metaExpanded}
        onToggle={() => setMetaExpanded(!metaExpanded)}
      >
        <JsonBlock data={object.meta} />
      </CollapsibleSection>

      <InspectorDivider />

      {/* Payload Section */}
      <CollapsibleSection
        title="PAYLOAD"
        expanded={payloadExpanded}
        onToggle={() => setPayloadExpanded(!payloadExpanded)}
      >
        <JsonBlock data={object.payload} />
      </CollapsibleSection>
    </InspectorPanel>
  );
}

// Collapsible section with chevron
interface CollapsibleSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, expanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="px-4 py-3">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full text-left group"
      >
        <span 
          className={`material-symbols-outlined text-sm text-slate-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
        >
          chevron_right
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-400">
          {title}
        </span>
      </button>
      {expanded && (
        <div className="mt-3 pl-5 font-mono text-xs leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

// Recursive JSON renderer with syntax highlighting
interface JsonBlockProps {
  data: unknown;
  depth?: number;
}

function JsonBlock({ data, depth = 0 }: JsonBlockProps) {
  if (data === null) {
    return <span className="json-null">null</span>;
  }

  if (typeof data === 'boolean') {
    return <span className="json-boolean">{String(data)}</span>;
  }

  if (typeof data === 'number') {
    return <span className="json-number">{data}</span>;
  }

  if (typeof data === 'string') {
    const display = data.length > 80 ? data.substring(0, 80) + '...' : data;
    return <span className="json-string">"{display}"</span>;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-slate-500">[]</span>;
    return (
      <div className="space-y-1">
        <span className="text-slate-500">[</span>
        <div className="pl-4 border-l border-slate-700/50">
          {data.map((item, i) => (
            <div key={i}>
              <JsonBlock data={item} depth={depth + 1} />
              {i < data.length - 1 && <span className="text-slate-500">,</span>}
            </div>
          ))}
        </div>
        <span className="text-slate-500">]</span>
      </div>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-slate-500">{'{}'}</span>;
    return (
      <div className="space-y-1">
        {entries.map(([key, value], i) => (
          <div key={key} className="flex flex-wrap">
            <span className="json-key">{key}</span>
            <span className="text-slate-500 mr-2">:</span>
            <JsonBlock data={value} depth={depth + 1} />
            {i < entries.length - 1 && <span className="text-slate-500">,</span>}
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-slate-500">{String(data)}</span>;
}

export default ObjectInspector;
```

### Create File: `src/shared/inspector/index.ts`

```ts
export { ObjectInspector } from './ObjectInspector';
```

---

## Change 3: LensInspector Replacement

### File: `src/explore/LensInspector.tsx`

**Replace entire file with:**

```tsx
// src/explore/LensInspector.tsx
// Lens object inspector — displays Persona as GroveObject JSON

import { useNarrativeEngine } from '../../hooks/useNarrativeEngine';
import { useWorkspaceUI } from '../workspace/WorkspaceUIContext';
import { ObjectInspector } from '../shared/inspector';
import { GroveObject } from '@core/schema/grove-object';
import { Persona } from '../../data/narratives-schema';

interface LensInspectorProps {
  personaId: string;
}

// Convert Persona to GroveObject format for display
function personaToGroveObject(persona: Persona, isActive: boolean): GroveObject {
  return {
    meta: {
      id: persona.id,
      type: 'lens',
      title: persona.publicLabel,
      description: persona.description,
      status: isActive ? 'active' : 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
    },
    payload: {
      systemPrompt: persona.systemPrompt,
      tone: persona.tone,
      contentFilters: persona.contentFilters,
      prioritizedThemes: persona.prioritizedThemes,
      journeyOrder: persona.journeyOrder,
    },
  };
}

export function LensInspector({ personaId }: LensInspectorProps) {
  const { getEnabledPersonas, session } = useNarrativeEngine();
  const { closeInspector } = useWorkspaceUI();

  const personas = getEnabledPersonas();
  const persona = personas.find(p => p.id === personaId);

  if (!persona) {
    return (
      <div className="p-5 text-center text-slate-500">
        <span className="material-symbols-outlined text-4xl mb-2">error</span>
        <p>Lens not found</p>
      </div>
    );
  }

  const isActive = session.activeLens === personaId;
  const groveObject = personaToGroveObject(persona, isActive);

  return (
    <ObjectInspector
      object={groveObject}
      title={persona.publicLabel}
      onClose={closeInspector}
    />
  );
}

export default LensInspector;
```

---

## Change 4: JourneyInspector Replacement

### File: `src/explore/JourneyInspector.tsx`

**Replace entire file with:**

```tsx
// src/explore/JourneyInspector.tsx
// Journey object inspector — displays Journey as GroveObject JSON

import { useNarrativeEngine } from '../../hooks/useNarrativeEngine';
import { useWorkspaceUI } from '../workspace/WorkspaceUIContext';
import { ObjectInspector } from '../shared/inspector';
import { GroveObject } from '@core/schema/grove-object';
import { Journey } from '../../data/narratives-schema';

interface JourneyInspectorProps {
  journeyId: string;
}

// Convert Journey to GroveObject format for display
function journeyToGroveObject(journey: Journey): GroveObject {
  return {
    meta: {
      id: journey.id,
      type: 'journey',
      title: journey.title,
      description: journey.subtitle,
      icon: journey.icon,
      status: journey.status || 'active',
      createdAt: journey.createdAt || new Date().toISOString(),
      updatedAt: journey.updatedAt || new Date().toISOString(),
      createdBy: journey.createdBy || 'system',
      tags: journey.tags,
    },
    payload: {
      estimatedMinutes: journey.estimatedMinutes,
      startingNodeId: journey.startingNodeId,
      nodeSequence: journey.nodeSequence,
      hook: journey.hook,
      completionMessage: journey.completionMessage,
      nextSuggestions: journey.nextSuggestions,
    },
  };
}

export function JourneyInspector({ journeyId }: JourneyInspectorProps) {
  const { session, getAllJourneys } = useNarrativeEngine();
  const { closeInspector } = useWorkspaceUI();

  const journeys = getAllJourneys();
  const journey = journeys.find(j => j.id === journeyId);

  if (!journey) {
    return (
      <div className="p-5 text-center text-slate-500">
        <span className="material-symbols-outlined text-4xl mb-2">error</span>
        <p>Journey not found</p>
      </div>
    );
  }

  const groveObject = journeyToGroveObject(journey);

  return (
    <ObjectInspector
      object={groveObject}
      title={journey.title}
      onClose={closeInspector}
    />
  );
}

export default JourneyInspector;
```

---

## Verification Checklist

After all changes:

1. **Build**
   ```bash
   npm run build
   ```
   Expected: No errors

2. **Tests**
   ```bash
   npm run test
   ```
   Expected: 161/161 passing

3. **Visual Verification**
   ```bash
   npm run dev
   ```
   
   - [ ] Load /terminal → Lenses
   - [ ] Card borders visible (not undefined gray)
   - [ ] Click a lens → Inspector shows JSON
   - [ ] META section shows id, type, status, createdBy
   - [ ] PAYLOAD section shows systemPrompt, tone, etc.
   - [ ] Copy JSON button works
   - [ ] Load /terminal → Journeys
   - [ ] Click a journey → Inspector shows JSON
   - [ ] Load marketing page → No changes

---

## Rollback Commands

If issues arise:

```bash
# Revert globals.css tokens
git checkout HEAD -- styles/globals.css

# Remove ObjectInspector
rm -rf src/shared/inspector/

# Revert inspectors
git checkout HEAD -- src/explore/LensInspector.tsx
git checkout HEAD -- src/explore/JourneyInspector.tsx
```
