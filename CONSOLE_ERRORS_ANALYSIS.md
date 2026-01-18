# Console Errors Analysis and Fixes

## Summary
This document analyzes the console errors shown in the user interface and provides fixes for each issue.

---

## Error 1: Missing Table - sprout_signal_aggregations

### Error Message
```
Could not find the table 'public.sprout_signal_aggregations'
Hint: Perhaps you meant 'public.document_signal_aggregations'
```

### Root Cause
Schema migration mismatch. The code references `sprout_signal_aggregations` (from migration 016) but the actual table is `document_signal_aggregations` (from migration 021).

### Fix Applied
✅ **Fixed in `src/bedrock/consoles/NurseryConsole/useSproutAggregations.ts`:**
- Line 78: Changed `.from('sprout_signal_aggregations')` to `.from('document_signal_aggregations')`
- Line 80: Changed `.eq('sprout_id', sproutId)` to `.eq('document_id', sproutId)`
- Line 145: Changed RPC function from `refresh_signal_aggregations` to `refresh_document_aggregations`
- Line 146: Changed parameter from `sprout_id: sproutId` to `document_id: sproutId`

### Verification
The column names in `document_signal_aggregations` match `sprout_signal_aggregations` except for the foreign key:
- `sprout_id` → `document_id` (all other columns are identical)

---

## Error 2: Missing Table - sprout_usage_events

### Error Message
```
Could not find the table 'public.sprout_usage_events'
```

### Root Cause
The `sprout_usage_events` table was created in migration 016 but doesn't exist in the database. This could mean:
1. Migration 016 wasn't applied
2. The table was dropped
3. Schema evolved and events are now tracked differently

### Code Reference
**File:** `src/surface/hooks/useSproutSignals.ts`
- Lines 231, 268, 449: All write to `sprout_usage_events` table

### Fix Required
**Options:**

#### Option A: Apply Migration 016
```bash
# Run migration 016 to create the missing table
# Note: This requires access to Supabase project
```

#### Option B: Update Code to Use Different Table
If events are tracked elsewhere, update `useSproutSignals.ts` to use the correct table.

#### Option C: Check Migration Status
Verify which migrations have been applied:
```sql
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;
```

---

## Error 3: Performance Issue - useGenesisPrompts Called 50+ Times

### Error Message
```
[useGenesisPrompts] Loaded 5 genesis-welcome prompts
(repeated 50+ times)
```

### Root Cause
1. **Over-logging:** The hook logs every time it runs (line 47-49 in `useGenesisPrompts.ts`)
2. **Potential Re-renders:** If the parent component re-renders frequently, the hook is called repeatedly

### Code Reference
**File:** `src/surface/hooks/useGenesisPrompts.ts`
```typescript
if (process.env.NODE_ENV === 'development' && prompts.length > 0) {
  console.log('[useGenesisPrompts] Loaded', prompts.length, 'genesis-welcome prompts');
}
```

**File:** `src/surface/components/KineticStream/ExploreShell.tsx`
- Line 295: Calls `useGenesisPrompts(lens)`

### Impact
- Console spam (50+ identical log messages)
- Potential performance degradation if data is re-fetched on every render

### Fix Required
**Recommended:** Add throttling or useEffect to log only on actual changes:
```typescript
const loggedRef = useRef(false);
useEffect(() => {
  if (prompts.length > 0 && !loggedRef.current) {
    console.log('[useGenesisPrompts] Loaded', prompts.length, 'genesis-welcome prompts');
    loggedRef.current = true;
  }
}, [prompts.length]);
```

---

## Error 4: Multiple GoTrueClient Instances Warning

### Warning Message
```
It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key
```

### Analysis
The warning indicates multiple Supabase clients are being created. However, investigation shows:

✅ **Properly Implemented Singletons:**
1. `src/surface/hooks/useSproutSignals.ts` (line 35-49) - Module-level singleton
2. `src/router/RootLayout.tsx` (line 21-35) - Module-level singleton
3. `src/explore/context/ResearchSproutContext.tsx` (line 41-55) - Module-level singleton

⚠️ **Potential Multiple Instances:**
4. `src/router/RootLayout.tsx` (line 332) - Creates client in `useMemo` - singleton per component instance

### Root Cause
The warning might be:
- A non-critical Supabase library warning
- Coming from a different part of the codebase
- Related to hot reloading in development mode

### Fix Required
**Assessment:** This appears to be a non-critical warning. All major client creations are properly implemented as singletons. The warning can likely be ignored unless it causes actual issues.

---

## Summary of Actions Taken

### ✅ Completed Fixes
1. **Fixed `useSproutAggregations.ts`** - Updated to use `document_signal_aggregations` table with correct column names and RPC function

### ⚠️ Pending Fixes
2. **Create `sprout_usage_events` table** - Apply migration 016 or update code to use correct table
3. **Optimize `useGenesisPrompts` logging** - Add throttling to prevent console spam
4. **Investigate GoTrueClient warning** - Verify if this is a real issue or benign warning

---

## Next Steps

1. **Database Schema Verification**
   ```bash
   # Check which tables exist
   # Check which migrations have been applied
   ```

2. **Apply Missing Migration**
   ```bash
   # If migration 016 wasn't applied, run it
   psql -f supabase/migrations/016_sprout_signals.sql
   ```

3. **Update Code (Alternative)**
   ```typescript
   // If events are tracked elsewhere, update useSproutSignals.ts
   // to use the correct table name
   ```

4. **Performance Optimization**
   ```bash
   # Add logging throttling to useGenesisPrompts.ts
   ```

---

## Files Modified

### Modified
- `src/bedrock/consoles/NurseryConsole/useSproutAggregations.ts`
  - Changed table reference from `sprout_signal_aggregations` to `document_signal_aggregations`
  - Updated column name from `sprout_id` to `document_id`
  - Updated RPC function name and parameters

### Not Modified (Issues Identified)
- `src/surface/hooks/useSproutSignals.ts` - References non-existent `sprout_usage_events` table
- `src/surface/hooks/useGenesisPrompts.ts` - Excessive logging in development mode
- Multiple Supabase client creations (assessment: properly implemented as singletons)

---

## Impact Assessment

### High Priority
- **Missing `sprout_usage_events` table** - Prevents signal tracking functionality
- **Incorrect table references** - May cause data fetch failures

### Medium Priority
- **Performance logging** - Console spam but doesn't break functionality

### Low Priority
- **GoTrueClient warning** - Likely benign, all clients properly singletons

---

*Generated: 2026-01-16*
*Status: Partial fix applied, pending database schema verification*
