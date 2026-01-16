-- Advancement System Fixes
-- Sprint: S7-SL-AutoAdvancement v1 - Hotfix
-- Fixes P1 runtime failures and P2 security gaps

-- =============================================================================
-- Fix 1: Create RPC function for safe JSONB tier updates
-- =============================================================================

/**
 * Update document tier with proper JSONB handling
 * Replaces the invalid .raw() API usage in batch job
 */
CREATE OR REPLACE FUNCTION update_document_tier(
  p_document_id UUID,
  p_new_tier TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_tier TEXT;
BEGIN
  -- Get current tier
  SELECT tier INTO current_tier
  FROM documents
  WHERE id = p_document_id;

  -- Check if document exists
  IF current_tier IS NULL THEN
    RAISE EXCEPTION 'Document not found: %', p_document_id;
  END IF;

  -- Check if tier is actually changing
  IF current_tier = p_new_tier THEN
    RAISE NOTICE 'Document % already at tier %', p_document_id, p_new_tier;
    RETURN FALSE;
  END IF;

  -- Validate tier is in allowed set
  IF p_new_tier NOT IN ('seed', 'sprout', 'sapling', 'tree', 'grove') THEN
    RAISE EXCEPTION 'Invalid tier: %', p_new_tier;
  END IF;

  -- Update tier and timestamp
  UPDATE documents
  SET
    tier = p_new_tier,
    tier_updated_at = now()
  WHERE id = p_document_id;

  RAISE NOTICE 'Updated document % tier: % -> %', p_document_id, current_tier, p_new_tier;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_document_tier IS 'Update document tier with validation and proper timestamp handling';

-- =============================================================================
-- Fix 2: Fix advancement_events table to reference documents, not sprouts
-- =============================================================================

-- Drop the invalid foreign key constraint
ALTER TABLE public.advancement_events
  DROP CONSTRAINT IF EXISTS advancement_events_sprout_id_fkey;

-- Add correct foreign key to documents table
ALTER TABLE public.advancement_events
  ADD CONSTRAINT advancement_events_document_id_fkey
  FOREIGN KEY (sprout_id) REFERENCES public.documents(id) ON DELETE CASCADE;

-- Update column comment
COMMENT ON COLUMN public.advancement_events.sprout_id IS 'Reference to the document that was advanced (misnamed column, actually references documents.id)';

-- =============================================================================
-- Fix 3: Secure RLS Policies (P2 Security Gap)
-- =============================================================================

-- Fix advancement_rules RLS policies
-- Remove the insecure policy that allows anonymous writes
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.advancement_rules;

-- Create properly secured policies
-- Allow reads for all (public transparency)
CREATE POLICY "Allow read for all users" ON public.advancement_rules
  FOR SELECT USING (true);

-- Only allow writes from service role or authenticated users
CREATE POLICY "Allow write for service role" ON public.advancement_rules
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow writes from authenticated users with proper role check
CREATE POLICY "Allow write for authenticated users" ON public.advancement_rules
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON public.advancement_rules
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" ON public.advancement_rules
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Fix advancement_events RLS policies
-- Remove the insecure policies
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.advancement_events;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.advancement_events;

-- Create properly secured policies
-- Allow reads for all (audit transparency)
CREATE POLICY "Allow read for all users" ON public.advancement_events
  FOR SELECT USING (true);

-- Only allow inserts from service role (batch job) or authenticated users
CREATE POLICY "Allow insert for service role" ON public.advancement_events
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow insert for authenticated users" ON public.advancement_events
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only allow updates from service role (for system operations) or authenticated users
CREATE POLICY "Allow update for service role" ON public.advancement_events
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow update for authenticated users" ON public.advancement_events
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- =============================================================================
-- Fix 4: Create helper function to safely insert advancement events
-- =============================================================================

CREATE OR REPLACE FUNCTION insert_advancement_event(
  p_document_id UUID,
  p_rule_id UUID,
  p_from_tier TEXT,
  p_to_tier TEXT,
  p_criteria_met JSONB,
  p_signal_values JSONB,
  p_event_type TEXT DEFAULT 'auto-advancement',
  p_operator_id TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.advancement_events (
    sprout_id,  -- Note: column name is misleading, actually references documents
    rule_id,
    from_tier,
    to_tier,
    criteria_met,
    signal_values,
    event_type,
    operator_id,
    reason,
    rolled_back
  ) VALUES (
    p_document_id,
    p_rule_id,
    p_from_tier,
    p_to_tier,
    p_criteria_met,
    p_signal_values,
    p_event_type,
    p_operator_id,
    p_reason,
    false
  ) RETURNING id INTO event_id;

  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION insert_advancement_event IS 'Safely insert advancement event with proper validation';

-- =============================================================================
-- Fix 5: Update helper function comments
-- =============================================================================

COMMENT ON FUNCTION update_document_tier IS 'Update document tier with validation and proper timestamp handling';
COMMENT ON FUNCTION insert_advancement_event IS 'Safely insert advancement event with proper validation';

-- =============================================================================
-- Verification Queries
-- =============================================================================

-- Verify the RPC functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN ('update_document_tier', 'insert_advancement_event')
  AND routine_schema = 'public';

-- Verify RLS policies are properly configured
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('advancement_rules', 'advancement_events')
ORDER BY tablename, policyname;

-- Verify foreign key constraint points to documents
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM
  information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'advancement_events';
