# Notion ↔ Local Sync Analysis

**Date:** 2026-01-18
**Author:** UX Chief (Workflow Audit)
**Status:** Analysis Complete

---

## Executive Summary

Audit of Notion Feature Roadmap vs local `docs/sprints/` reveals **workflow gaps** in bidirectional sync. Notion is source of truth for status, but local artifacts don't reflect current state.

---

## Current State Audit

### Active Sprint Status (Notion → Local)

| Sprint | Notion Status | Notion Property | Local Artifacts | Issue |
|--------|--------------|-----------------|-----------------|-------|
| S8-SL-MultiModel | Content says "🎯 ready" | **✅ complete** | 11 files | Page content out of sync with property |
| S9-SL-Federation | 🎯 ready | 🎯 ready | 10 files | ✅ Consistent |
| S10-SL-AICuration | 🚀 in-progress | 🚀 in-progress | 9 files | ✅ Consistent |
| S11-SL-Attribution | 🚀 in-progress | 🚀 in-progress | 10 files | ✅ Consistent |
| bedrock-ui-compact-v1 | 🚀 in-progress | 🚀 in-progress | Unknown | Not in SL series |

### Key Findings

#### 1. S8-SL-MultiModel Content/Property Mismatch
- **Database Property:** `Status: ✅ complete`
- **Page Content:** Still says "Status: 🎯 ready"
- **Audit Notes:** Confirms complete with PR #48 merged
- **Action:** Page content needs update to reflect completion

#### 2. No Local Status Tracking
- Local sprint directories have NO `STATUS.md` or equivalent
- Developers cannot tell sprint state without querying Notion
- Risk: Starting work on completed/blocked sprints

#### 3. Legacy Sprint Accumulation
- **150+ sprint directories** in `docs/sprints/`
- Many are v0.x series (completed months ago)
- No mapping to current Notion entries
- Creates confusion about what's active

#### 4. One-Way Sync Only
- `NOTION_ENTRY.md` pushes local → Notion
- No mechanism pulls Notion status → local
- Creates drift over time

---

## Workflow Gaps

### Gap 1: No Status Reflection
**Problem:** When Notion status changes (e.g., complete), local artifacts don't update.

**Impact:**
- Developers may work on wrong sprints
- Stale DEVLOG.md entries
- No local audit trail of completion

**Current Workflow:**
```
Local artifacts → NOTION_ENTRY.md → Notion (one-way)
```

**Missing:**
```
Notion status change → ??? → Local STATUS.md (not implemented)
```

### Gap 2: No Sprint Directory Lifecycle
**Problem:** Old sprint directories never archived or cleaned up.

**Impact:**
- 150+ directories makes navigation difficult
- No clear distinction between active/complete/archived
- `docs/sprints/ROADMAP.md` and `MIGRATION_MAP.md` not maintained

### Gap 3: Page Content vs Property Drift
**Problem:** Notion page content can say one status while database property says another.

**Impact:**
- Developers read page, see wrong status
- Search results show property, creates confusion
- Manual updates required to keep in sync

---

## Proposed Solutions

### Solution 1: Local STATUS.md File (Recommended)

Add `STATUS.md` to each sprint directory:

```markdown
# Sprint Status: S8-SL-MultiModel

## Current Status
**Notion Status:** ✅ complete
**Last Synced:** 2026-01-18T10:30:00Z
**Notion Page:** https://www.notion.so/2ea780a78eef81be842fcc75fdfba641

## Timeline
- **Created:** 2026-01-10
- **Ready:** 2026-01-16
- **In Progress:** 2026-01-16
- **Complete:** 2026-01-17

## Completion Notes
- PR #48 merged to main (commit 1122b7c)
- All 6 epics complete
- Build verified green
```

**Benefits:**
- Local visibility of status
- Git history of state changes
- No Notion query needed for basic status

### Solution 2: Notion Page Content Auto-Update

When updating Notion database property, also update page content:

```python
# Pseudo-code for sync
if status_property_changed:
    update_page_content(
        "## Sprint Status\n**Status:** {new_status}"
    )
```

**Benefits:**
- Page content matches property
- Readers see consistent information

### Solution 3: Sprint Directory Archive Protocol

Move completed sprints to archive:

```
docs/sprints/
├── active/              # Current work
│   ├── s9-sl-federation-v1/
│   ├── s10-sl-aicuration-v1/
│   └── s11-sl-attribution-v1/
├── complete/            # Shipped
│   ├── s8-sl-multimodel-v1/
│   └── epic4-multimodel-v1/
└── archive/             # Old/superseded
    ├── v0.10/
    ├── v0.11/
    └── ...150+ legacy dirs
```

**Benefits:**
- Clear active sprint visibility
- Reduced navigation confusion
- Historical preservation

---

## Completed Actions (2026-01-18)

### Action 1: Fix S8 Page Content ✅
Updated Notion page to reflect completion:
- Changed "Status: 🎯 ready" → "Status: ✅ complete"
- Added completion date and PR reference

### Action 2: Add STATUS.md to SL Sprints ✅
Created STATUS.md for all active SL sprints:
- [x] s8-sl-multimodel-v1 (complete) - PR #48 merged
- [x] s9-sl-federation-v1 (ready) - awaiting developer
- [x] s10-sl-aicuration-v1 (in-progress) - EPIC 6 of 7
- [x] s11-sl-attribution-v1 (in-progress) - EPIC 7 of 7

### Action 3: Document Sync Protocol ✅
Added Stage 8: Status Sync to `docs/SPRINT_WORKFLOW.md`

### Action 4: Archive Legacy Sprints ✅
Created `scripts/archive_sprints.py`:
- Archived 36 legacy sprints (v0.x series, kinetic-*, etc.)
- Preserved 9 active sprints
- 114 sprints remain in "unknown" category for manual review

### Action 5: Create Sync Script ✅
Created `scripts/notion_sync.py`:
- Lists local sprint status
- Parses STATUS.md files
- Supports manual sync from Notion status
- ASCII-safe output for Windows

---

## Scripts Created

### `scripts/archive_sprints.py`
Archives legacy sprints to `docs/sprints/archive/`

```bash
python scripts/archive_sprints.py           # Dry run
python scripts/archive_sprints.py --execute # Move files
```

### `scripts/notion_sync.py`
Syncs Notion status to local STATUS.md

```bash
python scripts/notion_sync.py --list           # Show local status
python scripts/notion_sync.py --create-missing # Create missing STATUS.md
```

---

## Updated Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Sprints with STATUS.md | 0 | 4 | 100% of active |
| Page/property sync rate | ~75% | 100% | 100% |
| Legacy directories | 150+ | 36 archived | All archived |
| Active sprint visibility | Low | High | High |

---

## Workflow Addition: Stage 8 Status Sync ✅

Added to `docs/SPRINT_WORKFLOW.md`:

**Owner:** Sprintmaster / Developer
**Trigger:** Any Notion status change
**Deliverable:** Updated STATUS.md

**When to Sync:**
- Sprint moves to 🚀 in-progress
- Sprint moves to ✅ complete
- Sprint moves to 📦 archived
- Any blocking issue occurs

---

## Remaining Work

1. **Review 114 unknown sprints** - Many are recent, may need STATUS.md
2. **Add STATUS.md to epic4/epic5 directories** - Currently missing
3. **Automate Notion → local sync** - Currently manual via Claude Code
4. **Add CI check** - Verify STATUS.md exists for tracked sprints
