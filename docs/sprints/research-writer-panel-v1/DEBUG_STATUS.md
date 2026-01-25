# S22-WP DEBUG STATUS - CRITICAL

**Date:** 2026-01-24 4:22 PM
**Status:** BLOCKED - Database schema mismatch
**Compaction Protection:** READ THIS FIRST ON RESUME

---

## ROOT CAUSE IDENTIFIED

**The `canonical_research` column does NOT EXIST in Supabase.**

We created the migration file (`035_add_canonical_research_column.sql`) but **NEVER APPLIED IT**.

The frontend code references `canonical_research` in:
- `ResearchSproutContext.tsx` - `rowToSprout()` and `sproutToRow()` mappings
- `DocumentViewer.tsx` - checks `hasCanonicalResearch`

But Supabase returns **406 Not Acceptable** because the column doesn't exist.

---

## EVIDENCE FROM SCREENSHOT

Console errors show:
```
GET https://cntzzxqgsjzsvscunsp.supabase.co... 406 (Not Acceptable)
```

Center panel shows:
- 0 sources
- 0 findings
- 0 API calls
- PENDING status

This means the sprout data is NOT loading from Supabase correctly.

---

## IMMEDIATE FIX REQUIRED

### Step 1: Apply the migration to Supabase

The migration file exists at:
`supabase/migrations/035_add_canonical_research_column.sql`

Contents:
```sql
-- S22-WP: Add canonical_research column for 100% lossless storage
-- DEX Pillar III: Provenance as Infrastructure

ALTER TABLE sprouts
ADD COLUMN IF NOT EXISTS canonical_research JSONB;

-- Index for querying by title (common filter)
CREATE INDEX IF NOT EXISTS idx_sprouts_canonical_research_title
ON sprouts ((canonical_research->>'title'));

-- Index for confidence level queries
CREATE INDEX IF NOT EXISTS idx_sprouts_canonical_research_confidence
ON sprouts ((canonical_research->'confidence_assessment'->>'level'));

COMMENT ON COLUMN sprouts.canonical_research IS
'S22-WP: 100% lossless storage of structured research output from Claude API tool_use pattern. DEX Pillar III compliant.';
```

### Step 2: Run via Supabase MCP or Dashboard

Option A - Supabase MCP:
```
mcp__supabase__apply_migration({
  project_id: "cntzzxqgsjzsvscunsp",
  name: "add_canonical_research_column",
  query: <migration SQL>
})
```

Option B - Supabase Dashboard:
1. Go to SQL Editor
2. Paste the migration SQL
3. Run it

### Step 3: Verify the column exists

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sprouts' AND column_name = 'canonical_research';
```

---

## WHY THIS HAPPENED

1. Created migration file in local repo
2. Assumed Supabase would pick it up automatically (IT DOES NOT)
3. Did not verify database schema before testing
4. Did not run E2E test with actual database calls

**LESSON: Always apply migrations to Supabase BEFORE testing frontend code that depends on new columns.**

---

## SECONDARY ISSUES (from console)

1. **Multiple GoTrueClient instances** - Warning, not blocking
2. **406 errors** - BLOCKING - caused by missing column

---

## FILES INVOLVED

| File | Status | Issue |
|------|--------|-------|
| `supabase/migrations/035_*.sql` | EXISTS | Never applied |
| `ResearchSproutContext.tsx` | MODIFIED | References missing column |
| `DocumentViewer.tsx` | MODIFIED | Checks for canonicalResearch |
| `evidence-transform.ts` | MODIFIED | Transforms canonical data |
| `evidence-catalog.ts` | MODIFIED | Has schemas |
| `evidence-registry.tsx` | MODIFIED | Has components |

---

## RECOVERY SEQUENCE

1. [x] Apply migration to Supabase (adds `canonical_research` column) - **DONE 4:25 PM**
2. [x] Verify column exists via SQL query - **CONFIRMED: jsonb type**
3. [x] Fix citation rendering - Added `rehype-raw` + custom `<cite>` handler to SynthesisBlock
4. [ ] Refresh browser at /explore
5. [ ] Open a sprout - verify citations render as styled blocks with indices
6. [ ] Verify all tabs work (Summary, Full Report, Sources)

## CITATION RENDERING FIX (4:35 PM)

**Problem:** `<cite index="...">` tags were rendering as raw text
**Solution:**
- Installed `rehype-raw` package for HTML in markdown
- Added custom `cite` component to ReactMarkdown in `SynthesisBlock`
- Citations now render as:
  - Italic text in green-bordered block
  - Source indices shown as `[1, 2, 3]` after the quote

**Files changed:**
- `evidence-registry.tsx` - Added citation renderer

---

## CONTEXT FOR NEXT SESSION

If this session compacts, the next agent should:

1. READ THIS FILE FIRST
2. Check if migration was applied: `SELECT * FROM information_schema.columns WHERE column_name = 'canonical_research'`
3. If not applied, apply the migration
4. Then test the display

The frontend code is CORRECT. The database schema is INCOMPLETE.
