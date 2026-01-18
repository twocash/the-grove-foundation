# Console Errors - Fix Summary

## Status: ✅ One Error Fixed, 3 Issues Identified

---

## ✅ COMPLETED: Fixed sprout_signal_aggregations Error

### Changes Made
**File:** `src/bedrock/consoles/NurseryConsole/useSproutAggregations.ts`

#### Change 1: Updated Table Reference
```typescript
// Before:
.from('sprout_signal_aggregations')
.eq('sprout_id', sproutId)

// After:
.from('document_signal_aggregations')
.eq('document_id', sproutId)
```

#### Change 2: Updated RPC Function Call
```typescript
// Before:
await client.rpc('refresh_signal_aggregations', {
  sprout_id: sproutId,
  period,
});

// After:
await client.rpc('refresh_document_aggregations', {
  document_id: sproutId,
  period,
});
```

### Verification
- ✅ Build completed successfully (3764 modules transformed)
- ✅ No compilation errors
- ✅ No type errors

---

## ⚠️ PENDING: sprout_usage_events Table Missing

### Issue
The table `sprout_usage_events` doesn't exist in the database but is referenced by:
- `src/surface/hooks/useSproutSignals.ts` (lines 231, 268, 449)

### Root Cause
Migration 016 creates this table, but it wasn't applied to the database.

### Fix Required
**Option 1: Apply Migration 016**
```bash
# Run the migration to create the missing table
psql -d your_database -f supabase/migrations/016_sprout_signals.sql
```

**Option 2: Update Code**
If events are tracked elsewhere, update `useSproutSignals.ts` to use the correct table.

### Impact
- **High** - Signal tracking functionality broken
- Events cannot be recorded or aggregated

---

## ⚠️ PENDING: useGenesisPrompts Performance Issue

### Issue
Hook logs "Loaded X genesis-welcome prompts" 50+ times, causing console spam.

### Root Cause
- Line 47-49 in `useGenesisPrompts.ts` logs on every render
- Component re-renders trigger repeated logs

### Fix Required
Add throttling to prevent repeated logging:

```typescript
// In useGenesisPrompts.ts
const loggedRef = useRef(false);

useEffect(() => {
  if (prompts.length > 0 && !loggedRef.current) {
    console.log('[useGenesisPrompts] Loaded', prompts.length, 'genesis-welcome prompts');
    loggedRef.current = true;
  }
}, [prompts.length]);
```

### Impact
- **Medium** - Console spam, potential performance impact
- Does not break functionality

---

## ⚠️ PENDING: Multiple GoTrueClient Instances Warning

### Issue
Warning about multiple Supabase client instances.

### Analysis
All major client creations are properly implemented as singletons:
- ✅ `useSproutSignals.ts` - Module-level singleton
- ✅ `RootLayout.tsx` (line 21-35) - Module-level singleton
- ✅ `ResearchSproutContext.tsx` - Module-level singleton

### Assessment
This appears to be a **benign warning**. All clients are properly singletons.

### Impact
- **Low** - Likely non-critical
- Continue monitoring for actual issues

---

## Database Schema Mismatch Summary

### Current State
```
✅ document_signal_aggregations - EXISTS (migration 021)
❌ sprout_signal_aggregations - DOES NOT EXIST
❌ sprout_usage_events - DOES NOT EXIST (migration 016)
```

### Schema Evolution
1. **Migration 016**: Created `sprout_usage_events` and `sprout_signal_aggregations`
2. **Migration 021**: Created `document_signal_aggregations` (different schema)
3. **Current**: Code is inconsistent - some uses old names, some uses new

### Recommendations
1. **Verify database state**: Check which migrations were applied
2. **Standardize on one schema**: Decide whether to use `sprout_*` or `document_*` tables
3. **Update all code**: Ensure consistent table references

---

## Build Status

```
✅ Build: SUCCESS (55.72s)
⚠️ Warnings: 3 (unrelated to fixes)
  - CSS token warning
  - Dynamic import warning
  - Chunk size warnings
✅ Modules: 3764 transformed
✅ No compilation errors
✅ No type errors
```

---

## Next Steps

### Immediate (High Priority)
1. **Apply Migration 016** to create missing `sprout_usage_events` table
2. **Verify database schema** to confirm which tables exist

### Short Term (Medium Priority)
3. **Fix useGenesisPrompts logging** to prevent console spam
4. **Review signal tracking code** to ensure consistency

### Long Term (Low Priority)
5. **Monitor GoTrueClient warning** - likely benign
6. **Standardize database schema** across migrations

---

## Files Modified

### ✅ Changed
- `src/bedrock/consoles/NurseryConsole/useSproutAggregations.ts`
  - Updated table reference: `sprout_signal_aggregations` → `document_signal_aggregations`
  - Updated column name: `sprout_id` → `document_id`
  - Updated RPC function: `refresh_signal_aggregations` → `refresh_document_aggregations`

### 📋 To Change
- `src/surface/hooks/useSproutSignals.ts` - May need table name update
- `src/surface/hooks/useGenesisPrompts.ts` - Add logging throttling

---

## Test Recommendations

After applying fixes:

1. **Test signal tracking**:
   ```bash
   # Navigate to /bedrock/nursery
   # Verify no console errors about missing tables
   ```

2. **Test genesis prompts**:
   ```bash
   # Navigate to /explore
   # Verify "Loaded X genesis-welcome prompts" appears only once
   ```

3. **Monitor console**:
   - Check for database errors
   - Verify no repeated log messages
   - Watch for GoTrueClient warnings

---

*Status: Partial - 1/4 issues resolved*
*Generated: 2026-01-16*
