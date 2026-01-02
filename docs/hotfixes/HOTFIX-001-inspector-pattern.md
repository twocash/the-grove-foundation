# Hotfix: Inspector Pattern Enforcement

**ID:** HOTFIX-001-inspector-pattern  
**Priority:** High  
**Branch:** `hotfix/inspector-pattern`  
**Date:** December 30, 2024  

---

## Problem Statement

The Bedrock console architecture has a structural flaw:

1. `BedrockWorkspace` renders `BedrockLayout` with `inspectorOpen={false}` and passes `<Outlet />` as content
2. Consoles (LensWorkshop) render inside the Outlet but manually build their own inspector div
3. This bypasses `BedrockLayout`'s `inspector` and `copilot` props entirely
4. Pattern is unenforceable—future consoles will diverge

**Current (broken) flow:**
```
BedrockWorkspace
  └── BedrockLayout (inspectorOpen=false, inspector=undefined)
        └── content={<Outlet />}
              └── LensWorkshop
                    └── <div class="flex">
                          └── Main content
                          └── Manual inspector div (bypasses BedrockLayout)
                                └── <BedrockCopilot /> (manual placement)
```

**Target (correct) flow:**
```
BedrockWorkspace
  └── BedrockLayout (inspector={from context}, copilot={from context})
        └── content={<Outlet />}
              └── LensWorkshop
                    └── Main content only (sets inspector via context)
```

---

## Solution: Lift Inspector State to Context

Extend `BedrockUIContext` to hold inspector content. Consoles register their inspector/copilot via hooks. `BedrockWorkspace` reads from context and passes to `BedrockLayout`.

### Benefits

1. **Single source of truth** — Inspector state lives in context
2. **Enforceable** — Consoles must use the hook, can't manually build inspector
3. **Consistent** — All consoles get same inspector/copilot placement
4. **DEX compliant** — Declarative pattern, consoles just say "here's my inspector content"

---

## Files to Modify

| File | Change |
|------|--------|
| `src/bedrock/context/BedrockUIContext.tsx` | Add inspector/copilot state |
| `src/bedrock/BedrockWorkspace.tsx` | Read inspector from context, pass to layout |
| `src/bedrock/consoles/LensWorkshop/LensWorkshop.tsx` | Remove manual inspector, use context |
| `src/bedrock/primitives/BedrockLayout.tsx` | Minor cleanup (already supports props) |

---

## Implementation

### Step 1: Extend BedrockUIContext

**File:** `src/bedrock/context/BedrockUIContext.tsx`

Add these to the context interface:

```typescript
interface BedrockUIState {
  // Existing
  activeConsole: string;
  selectedObjectId: string | null;
  
  // NEW: Inspector state
  inspectorOpen: boolean;
  inspectorTitle: string;
  inspectorSubtitle?: React.ReactNode;
  inspectorIcon?: string;
  inspectorContent: React.ReactNode | null;
  copilotContent: React.ReactNode | null;
}

interface BedrockUIActions {
  // Existing
  setActiveConsole: (id: string) => void;
  setSelectedObjectId: (id: string | null) => void;
  
  // NEW: Inspector actions
  openInspector: (config: {
    title: string;
    subtitle?: React.ReactNode;
    icon?: string;
    content: React.ReactNode;
    copilot?: React.ReactNode;
  }) => void;
  closeInspector: () => void;
  updateInspectorContent: (content: React.ReactNode) => void;
}
```

### Step 2: Implement Inspector State in Provider

**File:** `src/bedrock/context/BedrockUIContext.tsx`

```typescript
export function BedrockUIProvider({ children }: { children: ReactNode }) {
  // Existing state...
  const [activeConsole, setActiveConsole] = useState('dashboard');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  
  // NEW: Inspector state
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorTitle, setInspectorTitle] = useState('');
  const [inspectorSubtitle, setInspectorSubtitle] = useState<ReactNode>(null);
  const [inspectorIcon, setInspectorIcon] = useState<string | undefined>();
  const [inspectorContent, setInspectorContent] = useState<ReactNode>(null);
  const [copilotContent, setCopilotContent] = useState<ReactNode>(null);

  const openInspector = useCallback((config: {
    title: string;
    subtitle?: ReactNode;
    icon?: string;
    content: ReactNode;
    copilot?: ReactNode;
  }) => {
    setInspectorTitle(config.title);
    setInspectorSubtitle(config.subtitle);
    setInspectorIcon(config.icon);
    setInspectorContent(config.content);
    setCopilotContent(config.copilot ?? null);
    setInspectorOpen(true);
  }, []);

  const closeInspector = useCallback(() => {
    setInspectorOpen(false);
    setInspectorContent(null);
    setCopilotContent(null);
  }, []);

  const updateInspectorContent = useCallback((content: ReactNode) => {
    setInspectorContent(content);
  }, []);

  // ... rest of provider
}
```

### Step 3: Update BedrockWorkspace

**File:** `src/bedrock/BedrockWorkspace.tsx`

```typescript
function BedrockWorkspaceInner() {
  const location = useLocation();
  const {
    inspectorOpen,
    inspectorTitle,
    inspectorSubtitle,
    inspectorIcon,
    inspectorContent,
    copilotContent,
    closeInspector,
    setActiveConsole,
  } = useBedrockUI();
  const { setContext, setAvailableActions } = useBedrockCopilot();

  const currentConsoleId = getConsoleIdFromPath(location.pathname);
  const consoleMetadata = CONSOLE_METADATA[currentConsoleId] ?? CONSOLE_METADATA.dashboard;

  useEffect(() => {
    setActiveConsole(currentConsoleId);
    setContext({ consoleId: currentConsoleId });
    setAvailableActions(getCopilotActionsForConsole(currentConsoleId));
  }, [currentConsoleId, setActiveConsole, setContext, setAvailableActions]);

  return (
    <BedrockLayout
      consoleId={currentConsoleId}
      title={consoleMetadata.title}
      description={consoleMetadata.description}
      navigation={
        <BedrockNav
          items={BEDROCK_NAV_ITEMS}
          consoleId={currentConsoleId}
          header={...}
        />
      }
      content={<Outlet />}
      // NEW: Inspector from context
      inspector={
        inspectorOpen && inspectorContent ? (
          <BedrockInspector
            title={inspectorTitle}
            subtitle={inspectorSubtitle}
            icon={inspectorIcon}
            onClose={closeInspector}
          >
            {inspectorContent}
          </BedrockInspector>
        ) : undefined
      }
      // NEW: Copilot from context
      copilot={inspectorOpen && copilotContent ? copilotContent : undefined}
      inspectorOpen={inspectorOpen}
    />
  );
}
```

### Step 4: Refactor LensWorkshop

**File:** `src/bedrock/consoles/LensWorkshop/LensWorkshop.tsx`

Remove the manual inspector div. Use context instead.

```typescript
export function LensWorkshop({
  lenses = [],
  collectionState,
  onCreate,
  onUpdate,
  onDelete,
  onDuplicate,
  loading = false,
}: LensWorkshopProps) {
  const config = lensWorkshopConfig;
  const { openInspector, closeInspector, inspectorOpen } = useBedrockUI();

  // Local state
  const [selectedLensId, setSelectedLensId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(config.collectionView.defaultViewMode);
  const [hasChanges, setHasChanges] = useState(false);

  // Patch history
  const patchHistory = usePatchHistory({ objectId: selectedLensId || undefined });

  // Selected lens
  const selectedLens = useMemo(() => {
    if (!selectedLensId) return null;
    return lenses.find((l) => l.meta.id === selectedLensId) || null;
  }, [lenses, selectedLensId]);

  // Metrics
  const metricsData = useMemo(() => computeMetrics(lenses), [lenses]);

  // Handle selection - opens inspector via context
  const handleSelect = useCallback((lens: Lens) => {
    setSelectedLensId(lens.meta.id);
    setHasChanges(false);
  }, []);

  // Handle edit
  const handleEdit = useCallback(
    (operations: PatchOperation[]) => {
      if (!selectedLens) return;
      patchHistory.applyPatch(operations, selectedLens, 'user');
      onUpdate?.(selectedLens.meta.id, operations);
      setHasChanges(true);
    },
    [selectedLens, patchHistory, onUpdate]
  );

  // Handle delete
  const handleDelete = useCallback(() => {
    if (!selectedLens) return;
    onDelete?.(selectedLens.meta.id);
    setSelectedLensId(null);
    closeInspector();
  }, [selectedLens, onDelete, closeInspector]);

  // Handle duplicate
  const handleDuplicate = useCallback(() => {
    if (!selectedLens) return;
    onDuplicate?.(selectedLens);
  }, [selectedLens, onDuplicate]);

  // Open inspector when lens is selected
  useEffect(() => {
    if (selectedLens) {
      openInspector({
        title: selectedLens.payload.name || 'Untitled Lens',
        subtitle: (
          <span className="flex items-center gap-1 text-xs text-[var(--glass-text-muted)]">
            <span className="material-symbols-outlined text-sm">
              {LENS_CATEGORY_CONFIG[selectedLens.payload.category]?.icon}
            </span>
            {LENS_CATEGORY_CONFIG[selectedLens.payload.category]?.label}
          </span>
        ),
        icon: 'filter_alt',
        content: (
          <LensEditor
            lens={selectedLens}
            onEdit={handleEdit}
            onSave={() => setHasChanges(false)}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            loading={loading}
            hasChanges={hasChanges}
          />
        ),
        copilot: config.copilot.enabled ? (
          <BedrockCopilot
            title="Lens Copilot"
            placeholder="Edit this lens with AI..."
            defaultCollapsed={true}
            maxHeight={280}
          />
        ) : undefined,
      });
    } else {
      closeInspector();
    }
  }, [selectedLens, handleEdit, handleDelete, handleDuplicate, hasChanges, loading, config.copilot.enabled, openInspector, closeInspector]);

  // Close inspector when unmounting
  useEffect(() => {
    return () => closeInspector();
  }, [closeInspector]);

  // SIMPLIFIED: Only render content, no manual inspector
  return (
    <div className="flex flex-col h-full">
      {/* Header with action button */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
        <div />
        {config.primaryAction && (
          <GlassButton
            onClick={onCreate}
            variant="primary"
            size="sm"
            disabled={loading}
          >
            {config.primaryAction.icon && (
              <span className="material-symbols-outlined text-lg">
                {config.primaryAction.icon}
              </span>
            )}
            {config.primaryAction.label}
          </GlassButton>
        )}
      </div>

      {/* Metrics Row */}
      <div className="px-6 py-4 border-b border-[var(--glass-border)]">
        <MetricsRow
          configs={config.metrics}
          data={metricsData}
          loading={loading}
        />
      </div>

      {/* Grid/List Content */}
      <div className="flex-1 overflow-hidden">
        <LensGrid
          collectionState={collectionState}
          selectedId={selectedLensId}
          onSelect={handleSelect}
          onCreate={onCreate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          loading={loading}
        />
      </div>
    </div>
  );
}
```

### Step 5: Update BedrockLayout (Minor)

**File:** `src/bedrock/primitives/BedrockLayout.tsx`

Ensure the inspector/copilot composition is correct:

```typescript
{/* Three Column Layout */}
<ThreeColumnLayout
  navigation={navigation}
  content={content}
  inspector={
    inspectorOpen && (inspector || copilot) ? (
      <div className="flex flex-col h-full">
        {/* Inspector content (scrollable) */}
        {inspector && (
          <div className="flex-1 overflow-y-auto">
            {inspector}
          </div>
        )}
        {/* Copilot panel (fixed at bottom) */}
        {copilot && (
          <div className="flex-shrink-0">
            {copilot}
          </div>
        )}
      </div>
    ) : undefined
  }
  inspectorOpen={inspectorOpen && Boolean(inspector || copilot)}
  navWidth={navWidth}
  inspectorWidth={inspectorWidth}
/>
```

---

## Testing

### Manual Verification

1. Navigate to `/bedrock/lenses`
2. Click a lens card
3. Verify inspector opens in the right column (not inline)
4. Verify Copilot appears at bottom of inspector
5. Verify collapsing Copilot works
6. Click a different lens, verify inspector updates
7. Close inspector, verify it closes cleanly

### Automated Tests

```typescript
// tests/e2e/bedrock-inspector-pattern.spec.ts

test('inspector opens via context, not inline', async ({ page }) => {
  await page.goto('/bedrock/lenses');
  
  // Inspector should be closed initially
  await expect(page.locator('[data-testid="bedrock-inspector"]')).not.toBeVisible();
  
  // Click a lens
  await page.locator('[data-testid="lens-card"]').first().click();
  
  // Inspector should open in right column
  await expect(page.locator('[data-testid="bedrock-inspector"]')).toBeVisible();
  
  // Copilot should be at bottom
  const inspector = page.locator('[data-testid="bedrock-inspector"]');
  const copilot = inspector.locator('[data-testid="bedrock-copilot"]');
  await expect(copilot).toBeVisible();
  
  // Verify Copilot is at bottom (check CSS position)
  const inspectorBox = await inspector.boundingBox();
  const copilotBox = await copilot.boundingBox();
  expect(copilotBox.y + copilotBox.height).toBeCloseTo(inspectorBox.y + inspectorBox.height, 10);
});

test('only one inspector pattern exists', async ({ page }) => {
  await page.goto('/bedrock/lenses');
  await page.locator('[data-testid="lens-card"]').first().click();
  
  // Should be exactly one inspector element
  const inspectors = await page.locator('[data-testid="bedrock-inspector"]').count();
  expect(inspectors).toBe(1);
});
```

---

## ESLint Rule (Optional)

Add a custom ESLint rule to prevent manual inspector patterns:

```javascript
// .eslintrc.js
{
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: "JSXElement[openingElement.name.name='BedrockCopilot'][parent.type!='CallExpression']",
        message: 'BedrockCopilot must be passed via openInspector(), not rendered directly in JSX'
      }
    ]
  }
}
```

---

## Rollback

If issues arise:

```bash
git checkout main -- src/bedrock/context/BedrockUIContext.tsx
git checkout main -- src/bedrock/BedrockWorkspace.tsx
git checkout main -- src/bedrock/consoles/LensWorkshop/LensWorkshop.tsx
```

---

## Definition of Done

- [ ] Inspector opens via context hook, not manual JSX
- [ ] Copilot renders at bottom of inspector panel
- [ ] LensWorkshop has no `<BedrockInspector>` or `<BedrockCopilot>` in its JSX
- [ ] All Bedrock consoles use the same pattern
- [ ] Tests pass
- [ ] Pattern documented in PROJECT_PATTERNS.md

---

## Pattern Documentation Update

Add to `PROJECT_PATTERNS.md`:

```markdown
## Pattern 11: Bedrock Inspector Registration

**Problem:** Consoles need to display object editors in a shared inspector panel.

**Solution:** Consoles register inspector content via `useBedrockUI().openInspector()`.

**Usage:**
```tsx
const { openInspector, closeInspector } = useBedrockUI();

useEffect(() => {
  if (selectedObject) {
    openInspector({
      title: selectedObject.name,
      content: <ObjectEditor object={selectedObject} />,
      copilot: <BedrockCopilot title="Object Copilot" />,
    });
  } else {
    closeInspector();
  }
}, [selectedObject]);
```

**Anti-pattern:** Do NOT render `<BedrockInspector>` or `<BedrockCopilot>` directly in console JSX.
```

---

## Execution

```bash
# Create branch
git checkout -b hotfix/inspector-pattern

# Make changes
# (follow steps above)

# Test
npm test
npx playwright test tests/e2e/bedrock-inspector-pattern.spec.ts

# Commit
git add .
git commit -m "fix(bedrock): enforce inspector pattern via context"

# Merge
git checkout main
git merge hotfix/inspector-pattern
```
