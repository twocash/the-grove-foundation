# HOTFIX: Grove Project Navigation Behavior

## Issue
When user clicks "Grove Project" in the navigation sidebar, the tree collapses. This is confusing UX because:
1. The click navigates to the Grove Project placeholder view
2. But it ALSO collapses the tree, hiding the child items (Nodes, Journeys, Lenses)

## Expected Behavior

### Click Interactions
- **Click chevron (►/▼)** → Toggle expand/collapse only, no navigation
- **Click label ("Grove Project")** → Navigate to view only, tree state unchanged

### Default Expansion State
- **Top level (Explore, Do, Cultivate, Village)** → Expanded by default
- **Project level (Grove Project, future projects)** → Collapsed by default

### User Flow Example
1. User loads app → Explore is expanded, Grove Project is collapsed
2. User clicks Grove Project chevron → Grove Project expands (shows Nodes, Journeys, Lenses)
3. User clicks "Grove Project" label → Navigates to placeholder, tree stays expanded
4. User clicks Grove Project chevron → Collapses, view doesn't change

## Current Behavior
- Click anywhere on the row → Both navigates AND toggles expand/collapse

## Fix Location
`src/workspace/NavigationSidebar.tsx`

## Fix Description
Separate the click handlers:

```tsx
// Chevron - toggle only
<button 
  onClick={(e) => { 
    e.stopPropagation(); 
    toggleGroup(groupPath); 
  }}
  className="..."
>
  <span className="material-symbols-outlined">
    {isExpanded ? 'expand_more' : 'chevron_right'}
  </span>
</button>

// Label - navigate only
<span 
  onClick={() => navigateTo(navPath)}
  className="... cursor-pointer"
>
  {item.label}
</span>
```

## Default State Update
In `WorkspaceUIContext.tsx`, verify default expanded groups:

```tsx
// Top-level sections expanded, projects collapsed
let expandedGroups = new Set<string>(['explore', 'do', 'cultivate', 'village']);
```

Remove `'explore.groveProject'` from defaults if present.

## Placeholder Content
Already exists — no changes needed:
- Title: "The Grove Project"
- Subtitle: "Knowledgebase/Rag Level stats, newsload, and links to settings and configuration panels"
- Badge: "Coming in Grove 1.0"

## Scope
- ~20 lines changed in NavigationSidebar.tsx
- ~2 lines changed in WorkspaceUIContext.tsx (default expanded state)

## Verification
1. Fresh load → Explore expanded, Grove Project collapsed
2. Click Grove Project chevron → Expands to show children
3. Click "Grove Project" label → Placeholder view shows, tree stays expanded
4. Click chevron again → Collapses, placeholder view still showing
5. Click "Journeys" → Navigates to Journeys, Grove Project stays expanded
6. Refresh → Returns to default state (Explore expanded, Grove Project collapsed)

## Priority
Low — UX polish, not blocking

## Execute After
Quantum Glass v1.1 sprint completion
