# Migration Map: Copilot Configurator v1

**Sprint:** copilot-configurator-v1

---

## Overview

| Category | Count |
|----------|-------|
| New files | ~12 |
| Modified files | ~4 |
| New lines (est.) | ~800 |
| Modified lines (est.) | ~60 |
| New dependencies | 1 |

---

## New Files

### Core Infrastructure

| File | Purpose | Lines (est.) |
|------|---------|--------------|
| `src/core/copilot/schema.ts` | Type definitions | ~80 |
| `src/core/copilot/parser.ts` | Intent parsing from natural language | ~100 |
| `src/core/copilot/patch-generator.ts` | JSON patch generation | ~80 |
| `src/core/copilot/validator.ts` | Schema validation | ~60 |
| `src/core/copilot/simulator.ts` | Simulated model responses | ~70 |
| `src/core/copilot/suggestions.ts` | Type-specific suggestions | ~50 |
| `src/core/copilot/index.ts` | Exports | ~15 |

### UI Components

| File | Purpose | Lines (est.) |
|------|---------|--------------|
| `src/shared/inspector/CopilotPanel.tsx` | Main copilot container | ~120 |
| `src/shared/inspector/CopilotMessage.tsx` | Message bubble component | ~60 |
| `src/shared/inspector/DiffPreview.tsx` | Diff visualization | ~50 |
| `src/shared/inspector/SuggestedActions.tsx` | Quick action chips | ~40 |
| `src/shared/inspector/hooks/useCopilot.ts` | State management hook | ~120 |

---

## Modified Files

### src/shared/inspector/ObjectInspector.tsx

**Current:** Read-only JSON viewer with collapsible sections
**Change:** Add CopilotPanel slot at bottom

```diff
+ import { CopilotPanel } from './CopilotPanel';
+ import { useState } from 'react';

  export function ObjectInspector({ object, title, onClose }: ObjectInspectorProps) {
    const [metaExpanded, setMetaExpanded] = useState(true);
    const [payloadExpanded, setPayloadExpanded] = useState(true);
+   const [localObject, setLocalObject] = useState(object);
+
+   const handleApplyPatch = (patch: JsonPatch) => {
+     const updated = applyPatch(localObject, patch);
+     setLocalObject(updated);
+   };

    return (
      <InspectorPanel ...>
        {/* Existing META/PAYLOAD sections */}
        <CollapsibleSection title="META" ...>
-         <JsonBlock data={object.meta} />
+         <JsonBlock data={localObject.meta} />
        </CollapsibleSection>
        
+       {/* Copilot Panel - Fixed Bottom */}
+       <CopilotPanel 
+         object={localObject}
+         onApplyPatch={handleApplyPatch}
+       />
      </InspectorPanel>
    );
  }
```

**Lines changed:** ~20

### src/shared/layout/InspectorPanel.tsx

**Current:** Simple wrapper with header, content, actions
**Change:** Add slot for fixed-bottom panel

```diff
  interface InspectorPanelProps {
    title: string;
    subtitle?: string;
    // ...existing props
    actions?: ReactNode;
+   bottomPanel?: ReactNode;
  }

  export function InspectorPanel({
    // ...existing props
    actions,
+   bottomPanel,
  }: InspectorPanelProps) {
    return (
      <div className="flex flex-col h-full glass-panel-solid">
        {/* Header */}
        {/* ... */}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

+       {/* Bottom Panel (Copilot) */}
+       {bottomPanel && (
+         <div className="flex-shrink-0 border-t border-[var(--glass-border)]">
+           {bottomPanel}
+         </div>
+       )}

        {/* Actions footer */}
        {/* ... */}
      </div>
    );
  }
```

**Lines changed:** ~15

### src/app/globals.css

**Current:** Existing token namespaces
**Change:** Add `--copilot-*` tokens

```diff
+ /* Copilot Configurator tokens */
+ :root {
+   --copilot-bg: rgba(15, 23, 42, 0.95);
+   --copilot-border: rgba(99, 102, 241, 0.3);
+   --copilot-header-bg: linear-gradient(to right, rgba(67, 56, 202, 0.4), rgba(15, 23, 42, 1));
+   --copilot-msg-assistant-bg: rgba(67, 56, 202, 0.2);
+   --copilot-msg-assistant-border: rgba(99, 102, 241, 0.2);
+   --copilot-msg-user-bg: rgba(51, 65, 85, 1);
+   --copilot-msg-user-border: rgba(71, 85, 105, 1);
+   --copilot-btn-primary: rgb(79, 70, 229);
+   --copilot-btn-primary-hover: rgb(99, 102, 241);
+   --copilot-btn-secondary: rgba(51, 65, 85, 1);
+   --copilot-diff-add: rgb(74, 222, 128);
+   --copilot-diff-remove: rgb(248, 113, 113);
+   --copilot-model-ready: rgb(34, 197, 94);
+   --copilot-model-processing: rgb(251, 191, 36);
+ }
```

**Lines changed:** ~20

### package.json

**Current:** Existing dependencies
**Change:** Add fast-json-patch

```diff
  "dependencies": {
    // ...existing
+   "fast-json-patch": "^3.1.1"
  }
```

**Lines changed:** ~1

---

## Migration Sequence

### Phase 1: Core Infrastructure (No UI Changes)

```
1. Create src/core/copilot/ directory
2. Add schema.ts with all types
3. Add parser.ts with intent patterns
4. Add patch-generator.ts
5. Add validator.ts
6. Add simulator.ts
7. Add suggestions.ts
8. Add index.ts exports
9. Run: npm test (ensure no regressions)
```

**Build Gate:**
```bash
npm run build
npm test
# All existing tests pass; new files compile
```

### Phase 2: UI Components (New Files Only)

```
1. Add globals.css tokens
2. Create CopilotMessage.tsx
3. Create DiffPreview.tsx
4. Create SuggestedActions.tsx
5. Create useCopilot.ts hook
6. Create CopilotPanel.tsx (imports above)
7. Run: npm run build
```

**Build Gate:**
```bash
npm run build
# New components compile; no imports into existing code yet
```

### Phase 3: Integration

```
1. Modify InspectorPanel.tsx (add bottomPanel slot)
2. Modify ObjectInspector.tsx (wire CopilotPanel)
3. Install fast-json-patch: npm install fast-json-patch
4. Run full test suite
```

**Build Gate:**
```bash
npm install
npm run build
npm test
npx playwright test
```

### Phase 4: Polish

```
1. Add unit tests for parser, validator
2. Add E2E test for copilot flow
3. Manual QA checklist
4. Documentation update
```

---

## Dependency Graph

```
schema.ts
    ↓
parser.ts ←─── suggestions.ts
    ↓
patch-generator.ts
    ↓
validator.ts
    ↓
simulator.ts
    ↓
    └──────────────────────────┐
                               ↓
    CopilotMessage.tsx    DiffPreview.tsx    SuggestedActions.tsx
         ↓                     ↓                    ↓
         └─────────────────────┴────────────────────┘
                               ↓
                        useCopilot.ts
                               ↓
                        CopilotPanel.tsx
                               ↓
                     ObjectInspector.tsx (modified)
```

---

## Rollback Strategy

If issues arise, rollback is straightforward:

1. **Full rollback:** Remove CopilotPanel import from ObjectInspector.tsx
2. **Core rollback:** Delete `src/core/copilot/` directory
3. **Dependency rollback:** Remove `fast-json-patch` from package.json

The feature is entirely additive—no existing functionality is modified in a breaking way.

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| InspectorPanel layout breaks | Test bottomPanel slot in isolation first |
| JSON display shifts | Visual regression test before/after |
| Fast-json-patch bundle size | Check size impact (~8KB gzipped) |
| Collapse state persistence | Use sessionStorage, not localStorage |
