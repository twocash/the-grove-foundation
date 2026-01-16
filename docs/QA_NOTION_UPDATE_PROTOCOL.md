# QA Documentation - Notion Update Protocol

**Purpose:** Keep Notion pages synchronized with local QA documentation

---

## Published Notion Pages

### 1. Sprint Management System - User Guide
- **Notion URL:** https://www.notion.so/2ea780a78eef8101b9bfe7c0adb5e1d9
- **Local File:** `docs/SYSTEM_OVERVIEW.md` + related files
- **Update Trigger:** Changes to sprint workflow system

### 2. QA Checklist - Developer Quick Reference
- **Notion URL:** https://www.notion.so/2ea780a78eef81d597f6d25be9203e89
- **Local File:** `docs/QA_CHECKLIST.md`
- **Update Trigger:** Changes to QA standards or checklist

---

## Update Protocol

### When to Update Notion

**Update when ANY of these files change:**
- `docs/QA_STANDARDS.md`
- `docs/QA_CHECKLIST.md`
- `docs/SPRINT_WORKFLOW.md`
- `docs/SPRINT_NAMING_CONVENTION.md`
- `docs/SPRINT_PIPELINE.md`
- `docs/WORKFLOW_QUICKSTART.md`
- `docs/SYSTEM_OVERVIEW.md`
- `docs/KICKOFF_MESSAGE.md`

### How to Update

#### Option 1: Full Page Replacement
**For significant changes:**

1. Read the updated local file
2. Copy the markdown content
3. Use Notion API to update the page:

```javascript
// Example: Update QA Checklist page
mcp__plugin_Notion_notion__notion-update-page({
  page_id: "2ea780a7-8eef-81d5-97f6-d25be9203e89",
  command: "replace_content",
  new_str: "{updated markdown content}"
})
```

#### Option 2: Incremental Updates
**For small changes:**

1. Identify the specific section to update
2. Use `replace_content_range` with unique snippets
3. Preserve the rest of the page

### Update Checklist

- [ ] Read updated local file
- [ ] Verify content is complete
- [ ] Check formatting (markdown works in Notion)
- [ ] Update page in Notion
- [ ] Verify changes applied correctly
- [ ] Test Notion page rendering
- [ ] Notify team of update

---

## Notion Page IDs

### Quick Reference

| Page | Notion Page ID | URL |
|------|----------------|-----|
| Sprint Management System | `2ea780a7-8eef-8101-b9bf-e7c0adb5e1d9` | https://www.notion.so/2ea780a78eef8101b9bfe7c0adb5e1d9 |
| QA Checklist | `2ea780a7-8eef-81d5-97f6-d25be9203e89` | https://www.notion.so/2ea780a78eef81d597f6d25be9203e89 |

---

## Automation Opportunities

### Future: GitHub Action (Optional)
**Could create a GitHub Action to:**
1. Monitor changes to `docs/QA_*.md` and `docs/SPRINT_*.md`
2. Auto-update Notion pages via API
3. Post notification to team channel

### Current: Manual Process
**For now, update manually when:**
- Making significant QA workflow changes
- During sprint planning sessions
- After receiving developer feedback
- Quarterly review of documentation

---

## Update Commands

### Update Sprint Management System Page
```javascript
// Update SYSTEM_OVERVIEW.md content
mcp__plugin_Notion_notion__notion-update-page({
  page_id: "2ea780a7-8eef-8101-b9bf-e7c0adb5e1d9",
  command: "replace_content",
  new_str: "{new content from SYSTEM_OVERVIEW.md + related docs}"
})
```

### Update QA Checklist Page
```javascript
// Update QA_CHECKLIST.md content
mcp__plugin_Notion_notion__notion-update-page({
  page_id: "2ea780a7-8eef-81d5-97f6-d25be9203e89",
  command: "replace_content",
  new_str: "{new content from QA_CHECKLIST.md}"
})
```

---

## Update Frequency

### High Priority (Update immediately)
- Changes to QA checklist items
- Changes to build gates
- Changes to console error policy
- Changes to sprint workflow stages

### Medium Priority (Update within 1 week)
- New documentation sections
- Updated examples
- Modified templates
- New tools or commands

### Low Priority (Update during next review)
- Formatting improvements
- Typos and minor edits
- Link updates
- Version bumps

---

## Change Log

### 2026-01-16 - Initial Publication
- Published Sprint Management System User Guide to Notion
- Published QA Checklist to Notion
- Created update protocol

### Future Updates
- Log date, file changed, and reason
- Note any breaking changes
- Notify affected team members

---

## Verification

### After Each Update
1. **Open Notion page** - Verify content loads
2. **Check formatting** - Headers, lists, code blocks render correctly
3. **Test links** - All internal links work
4. **Verify completeness** - All sections present
5. **Check mobile view** - Readable on mobile devices

### Monthly Verification
- [ ] All Notion pages accessible
- [ ] Content matches local files
- [ ] No broken links
- [ ] Formatting consistent
- [ ] Team knows where to find docs

---

## Team Communication

### When Updating QA Documentation

**Notify in team channel:**
```
📝 QA Documentation Updated

Pages updated:
- QA Checklist (Notion)

Changes:
- Updated daily QA section
- Added new console error examples

Local files updated:
- docs/QA_CHECKLIST.md

Notion pages synchronized ✅

Review: [Notion link]
```

**Tag relevant team members:**
- @developers (QA changes)
- @product-managers (sprint workflow changes)
- @designers (sprint workflow changes)

---

## Troubleshooting

### Notion Page Won't Update
**Check:**
1. Page ID is correct
2. Markdown syntax is valid
3. No special characters causing issues
4. Page hasn't been deleted or moved

### Content Doesn't Match
**Solution:**
1. Re-read local file
2. Copy fresh content
3. Try full replacement (Option 1)
4. Check Notion revision history

### Formatting Broken
**Solution:**
1. Notion uses markdown-like formatting
2. Code blocks need triple backticks
3. Headers use #, ##, ###
4. Lists need proper indentation

---

## Success Metrics

### Documentation Health
- **Local-Notion Sync:** < 1 week lag
- **Update Frequency:** At least monthly
- **Team Usage:** Referenced in sprint planning
- **QA Compliance:** Checklist used by developers

### Team Adoption
- [ ] Developers bookmark QA Checklist Notion page
- [ ] Product Managers reference Sprint System page
- [ ] QA gates completed before merges
- [ ] Zero console errors in production

---

## Summary

**This protocol ensures:**
- ✅ Notion pages stay synchronized with local docs
- ✅ Team has latest QA standards
- ✅ Sprint workflow is documented and accessible
- ✅ Updates are tracked and communicated

**Result:** Single source of truth for QA and sprint management accessible in both GitHub and Notion!

---

**Document Owner:** Product Manager
**Review Frequency:** Monthly
**Last Updated:** 2026-01-16
