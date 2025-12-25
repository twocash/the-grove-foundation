# HOTFIX: Grove Project Navigation Behavior

## Status: ✅ COMPLETE
**Commit:** d637447
**Date:** 2025-12-25

---

## Issue
When user clicks "Grove Project" in the navigation sidebar, the tree collapses. This is confusing UX because:
1. The click navigates to the Grove Project placeholder view
2. But it ALSO collapses the tree, hiding the child items (Nodes, Journeys, Lenses)

## Solution Implemented

### Click Interactions
- **Click chevron (►/▼)** → Toggle expand/collapse only, no navigation
- **Click label ("Grove Project")** → Navigate to view only, tree state unchanged

### Default Expansion State
- **Top level (Explore)** → Expanded by default
- **Project level (Grove Project, future projects)** → Collapsed by default

## Files Changed
- `src/workspace/NavigationSidebar.tsx` — Separated chevron and label click handlers
- `src/workspace/WorkspaceUIContext.tsx` — Default expanded groups now `['explore']` only

## Verification
✅ Fresh load → Explore expanded, Grove Project collapsed
✅ Click Grove Project chevron → Expands to show children
✅ Click "Grove Project" label → Navigates to Terminal view, tree stays expanded
✅ Click chevron again → Collapses, view unchanged
