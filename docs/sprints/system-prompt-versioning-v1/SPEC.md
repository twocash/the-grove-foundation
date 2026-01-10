# SPEC: System Prompt Versioning v1

**Sprint:** system-prompt-versioning-v1  
**Type:** Feature Enhancement  
**Estimated Effort:** 2-3 hours  
**Risk Level:** Medium (modifies core data flow for active prompts)

---

## 1. Objective

Implement provenance-preserving versioning for SystemPrompt objects. When a user edits the active system prompt and clicks "Save & Activate," the system creates a NEW database record (with new UUID) while archiving the previous version. This maintains full history and attribution chain per DEX Pillar III: Provenance as Infrastructure.

---

## 2. Problem Statement

**Current Behavior:**
Editing the active prompt and saving MUTATES the existing record. The previous state is lost. There's no way to trace how the prompt evolved or roll back to a previous version.

**Desired Behavior:**
Every "Save & Activate" on an active prompt creates a NEW version. The old version is archived with its UUID preserved. Users can browse version history and potentially restore old versions.

---

## 3. Scope

### In Scope
- New `saveAndActivate()` function in `useExperienceData.ts`
- Modified "Save & Activate" flow in `SystemPromptEditor.tsx`
- Proper provenance chain (`previousVersionId` populated)
- Version number auto-increment
- UI updates to reflect new record after save
- Metrics counters update correctly (Total +1, Archived +1)

### Out of Scope (Future Sprints)
- Version history browser UI
- Diff view between versions
- Named version tagging
- Fork functionality (create draft from archived)
- Rollback with single click
- Multi-environment version management

---

## 4. User Stories

### US-1: Save Active Creates New Version
**As a** Grove administrator  
**I want to** save changes to the active prompt as a new version  
**So that** I preserve full history of prompt evolution

**Acceptance Criteria:**
- [ ] "Save & Activate" on active prompt creates NEW record in database
- [ ] New record has NEW UUID (not same as old)
- [ ] New record has `status: 'active'`
- [ ] New record has `version: old.version + 1`
- [ ] New record has `previousVersionId: old.id`
- [ ] Old record has `status: 'archived'`
- [ ] Only ONE record has `status: 'active'` after operation

### US-2: UI Reflects New Version
**As a** Grove administrator  
**I want to** see the UI update after saving  
**So that** I know the operation succeeded

**Acceptance Criteria:**
- [ ] Inspector shows same content (edits preserved)
- [ ] Version badge shows incremented number
- [ ] "Active System Prompt" banner persists
- [ ] List view shows new record
- [ ] Old record appears in archived filter

### US-3: Metrics Update Correctly
**As a** Grove administrator  
**I want to** see accurate metrics  
**So that** I understand my prompt inventory

**Acceptance Criteria:**
- [ ] Total count increases by 1
- [ ] Active count stays at 1
- [ ] Archived count increases by 1
- [ ] Draft count unchanged

---

## 5. Technical Requirements

### TR-1: New saveAndActivate Function
Location: `src/bedrock/consoles/ExperiencesConsole/useExperienceData.ts`

```typescript
/**
 * Save edits to active prompt as a new version.
 * Creates new record, archives old, invalidates cache.
 * 
 * @param currentPrompt - The currently active prompt object
 * @param pendingPatches - Patches that have been applied locally
 * @param userId - Optional user ID for provenance
 * @returns The newly created active prompt
 */
saveAndActivate: (
  currentPrompt: GroveObject<SystemPromptPayload>,
  pendingPatches: PatchOperation[],
  userId?: string | null
) => Promise<GroveObject<SystemPromptPayload>>;
```

### TR-2: State Model
```
┌─────────────────────────────────────────────────────────────┐
│ State Transitions for Active Prompt                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [active] ──edit──> [active + pending changes]             │
│       │                      │                              │
│       │                      ▼                              │
│       │               "Save & Activate"                     │
│       │                      │                              │
│       ▼                      ▼                              │
│   [archived]    ←────  [NEW active]                         │
│   (old UUID)            (new UUID)                          │
│                         version+1                           │
│                         previousVersionId=oldUUID           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### TR-3: Cache Invalidation
After creating new version, call existing endpoint:
```typescript
await fetch('/api/cache/invalidate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'system-prompt' }),
});
```

### TR-4: Draft/Archived Unchanged
- Drafts: Regular save (mutation) remains correct
- Archived: Duplicate creates draft (existing behavior preserved)
- Only ACTIVE prompt gets append-only treatment

---

## 6. Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Append-only versioning | Pattern 7 (Object Model) | Add `saveAndActivate()` for active prompts |
| Provenance chain | GroveObjectMeta | Populate `previousVersionId` field |
| Cache invalidation | server.js endpoint | Reuse existing endpoint |
| Status transitions | `activate()` function | Extend with create-then-archive flow |

---

## 7. DEX Compliance

### Pillar I: Declarative Sovereignty ✓
- No code changes needed to alter versioning behavior
- Version number and previousVersionId are data, not logic

### Pillar II: Capability Agnosticism ✓
- Versioning works regardless of which AI model uses the prompt
- No model-specific logic in version creation

### Pillar III: Provenance as Infrastructure ✓
- **This is the core improvement**
- Every version traces back to its origin
- Full attribution chain preserved in database
- "Cognitive archaeology" enabled - understand how prompts evolved

### Pillar IV: Organic Scalability ✓
- New versions don't require schema changes
- System handles arbitrary version depth
- No hardcoded limits on version count

---

## 8. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Operation latency | < 500ms for save-and-activate |
| Data integrity | Zero data loss on version creation |
| Backwards compatibility | Existing drafts/archives work unchanged |
| Error recovery | Failed create doesn't archive old version |

---

## 9. Dependencies

### Required (Exist)
- `groveData.create()` - Create new records
- `groveData.update()` - Archive old records
- `generateUUID()` - Generate new IDs
- `/api/cache/invalidate` - Server cache clearing

### None Required (New)
- No new dependencies needed

---

## 10. Verification Plan

### Automated Tests
None required for MVP (manual verification sufficient)

### Manual Test Script
1. Start dev server
2. Navigate to `/bedrock/experiences`
3. Note current Total/Active/Archived counts
4. Select the active prompt
5. Edit the Identity field (add test text)
6. Click "Save & Activate"
7. Verify: New UUID in inspector metadata
8. Verify: Version number incremented
9. Verify: Total +1, Archived +1, Active =1
10. Open Supabase, verify two records exist
11. Navigate to `/explore`, send test message
12. Verify: New prompt content active

---

*Spec complete. Proceed to ARCHITECTURE.md*
