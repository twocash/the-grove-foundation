# Migration Map: Prompt Editor Standardization

**Sprint:** prompt-editor-standardization-v1  
**Date:** 2025-01-03

## File Change Matrix

| File | Action | Lines | Risk |
|------|--------|-------|------|
| `src/shared/layout/InspectorPanel.tsx` | MODIFY | +40 | LOW |
| `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx` | REWRITE | ~450 | MEDIUM |

## Execution Order

### Phase 1: Foundation (InspectorSection Enhancement)

**File:** `src/shared/layout/InspectorPanel.tsx`

**Current State (lines 85-103):**
```typescript
interface InspectorSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function InspectorSection({ title, children, className = '' }: InspectorSectionProps) {
  return (
    <div className={`p-5 space-y-4 ${className}`}>
      {title && (
        <h4 className="glass-section-header">
          {title}
        </h4>
      )}
      {children}
    </div>
  );
}
```

**Target State:**
```typescript
interface InspectorSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function InspectorSection({ 
  title, 
  children, 
  className = '',
  collapsible = false,
  defaultCollapsed = false
}: InspectorSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className={`p-5 space-y-4 ${className}`}>
      {title && (
        <button
          onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
          className={`w-full flex items-center justify-between ${collapsible ? 'cursor-pointer' : 'cursor-default'}`}
          disabled={!collapsible}
        >
          <h4 className="glass-section-header">{title}</h4>
          {collapsible && (
            <span className={`material-symbols-outlined text-[var(--glass-text-muted)] transition-transform ${isCollapsed ? '' : 'rotate-180'}`}>
              expand_more
            </span>
          )}
        </button>
      )}
      {(!collapsible || !isCollapsed) && children}
    </div>
  );
}
```

**Verification:**
- [ ] LensEditor collapsible sections now work
- [ ] Non-collapsible sections unchanged

---

### Phase 2: PromptEditor Refactor

**File:** `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx`

**Deletion Candidates:**
- Tab state management (`activeTab`, tab rendering logic)
- Local state buffer (`localPrompt`, `setLocalPrompt`)
- Duplicate dirty tracking (`isDirty`)
- Custom button components (replace with GlassButton)

**Preservation:**
- All field change handlers (adapt to `patchPayload`/`patchMeta` pattern)
- Stats display grid (move to Performance section)
- Sequence badges (move to Sequences section)
- Tag input component

**Section Implementation Order:**
1. Identity section (non-collapsible)
2. Execution section (non-collapsible)
3. Source & Weight section (non-collapsible)
4. Targeting section (collapsible, default open)
5. Sequences section (collapsible, default collapsed)
6. Performance section (collapsible, default collapsed)
7. Metadata section (non-collapsible)
8. Fixed footer with GlassButton

---

## Rollback Plan

### If InspectorSection breaks other consumers:
```bash
git checkout HEAD~1 -- src/shared/layout/InspectorPanel.tsx
```

### If PromptEditor refactor fails:
```bash
git checkout HEAD~1 -- src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx
```

---

## Commit Sequence

```
1. feat: add collapsible support to InspectorSection
   - src/shared/layout/InspectorPanel.tsx
   
2. refactor: convert PromptEditor to section-based layout
   - src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx
   
3. chore: remove unused tab-related code from PromptEditor
   - src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx
```

---

## Verification Checklist

### After Phase 1:
- [ ] `npm run build` passes
- [ ] LensEditor collapsible sections toggle correctly
- [ ] Non-collapsible InspectorSection unchanged

### After Phase 2:
- [ ] `npm run build` passes
- [ ] All prompt fields editable
- [ ] Save button state correct (Saved/Save Changes)
- [ ] Duplicate creates new object
- [ ] Delete removes object
- [ ] Genesis page unaffected
- [ ] Terminal prompts unaffected
