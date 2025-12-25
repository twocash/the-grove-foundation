# HOTFIX: First Project Should Start Expanded

## Status: 🔴 OPEN
**Priority:** Medium
**Date:** 2025-12-25
**Related:** d637447 (previous nav hotfix)

---

## Issue

The first project (Grove Project) should start **expanded** on fresh load. Currently it starts collapsed, requiring users to click the chevron before they can see Terminal, Lenses, Journeys, etc.

## Expected Behavior

**Fresh session load:**
```
▼ Explore                    ← expanded (correct)
  ▼ Grove Project            ← expanded (FIRST project)
    • Terminal               ← visible immediately
    • Lenses
    • Journeys
    • Nodes
    • Diary
    • Sprouts
  ► Second Project           ← collapsed (2nd-nth projects)
► Do
► Cultivate
► Village
```

**User lands on:** Grove Project level (placeholder/dashboard view)
**Tree state:** First project expanded, children visible

## Current Behavior

```
▼ Explore                    ← expanded
  ► Grove Project            ← collapsed ❌
► Do
► Cultivate  
► Village
```

User must click chevron to see Terminal, Lenses, etc.

## Root Cause

Commit d637447 changed default expanded groups to `['explore']` only:

```typescript
// WorkspaceUIContext.tsx
let expandedGroups = new Set<string>(['explore']);
```

This was intended to keep projects collapsed, but didn't distinguish between first project vs subsequent projects.

## Fix

**Option A: Hardcode first project expanded**
```typescript
let expandedGroups = new Set<string>(['explore', 'explore.groveProject']);
```

**Option B: Dynamic first-project detection**
```typescript
// Expand first project under each top-level section
const firstProject = getFirstProject('explore'); // returns 'groveProject'
let expandedGroups = new Set<string>([
  'explore',
  `explore.${firstProject}`
]);
```

Option A is simpler and sufficient for now (single project).

## Files to Modify
- `src/workspace/WorkspaceUIContext.tsx` — default `expandedGroups` initialization

## Default Navigation Path

Also verify the default navigation path lands on Grove Project level:
```typescript
// Should be:
activePath: ['explore', 'groveProject']

// NOT:
activePath: ['explore', 'groveProject', 'terminal']
```

User should land on the project dashboard (placeholder), not directly in Terminal.

## Verification
1. Clear localStorage
2. Fresh load → Explore expanded, Grove Project expanded
3. Terminal, Lenses, Journeys visible in tree
4. Main content shows Grove Project placeholder (not Terminal)
5. User clicks Terminal → navigates to Terminal view
6. Future: Add second project → should start collapsed
