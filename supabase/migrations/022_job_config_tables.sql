-- Job Configuration System Tables
-- Sprint: S7.5-SL-JobConfigSystem v1
-- Creates tables for job configuration and execution tracking

-- =============================================================================
-- Job Configs Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.job_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta JSONB NOT NULL DEFAULT '{}',
  payload JSONB NOT NULL DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow read for all (transparency)
CREATE POLICY "Allow read for all users" ON public.job_configs
  FOR SELECT USING (true);

-- Allow write for service role (system operations)
CREATE POLICY "Allow write for service role" ON public.job_configs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow writes for authenticated users
CREATE POLICY "Allow write for authenticated users" ON public.job_configs
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON public.job_configs
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" ON public.job_configs
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- =============================================================================
-- Job Executions Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.job_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_config_id UUID NOT NULL REFERENCES public.job_configs(id) ON DELETE CASCADE,

  -- Execution tracking
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'success', 'failure', 'timeout', 'cancelled')),

  -- Results
  result JSONB,
  error TEXT,

  -- Metadata
  attempt_number INTEGER NOT NULL DEFAULT 1,
  duration_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow read for all (transparency)
CREATE POLICY "Allow read for all users" ON public.job_executions
  FOR SELECT USING (true);

-- Allow write for service role (system operations)
CREATE POLICY "Allow write for service role" ON public.job_executions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow inserts for authenticated users (for manual job execution)
CREATE POLICY "Allow insert for authenticated users" ON public.job_executions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =============================================================================
-- Indexes
-- =============================================================================

-- Job configs indexes
CREATE INDEX IF NOT EXISTS idx_job_configs_meta ON public.job_configs USING GIN (meta);
CREATE INDEX IF NOT EXISTS idx_job_configs_payload ON public.job_configs USING GIN (payload);
CREATE INDEX IF NOT EXISTS idx_job_configs_created ON public.job_configs (created_at DESC);

-- Job executions indexes
CREATE INDEX IF NOT EXISTS idx_job_executions_config ON public.job_executions (job_config_id);
CREATE INDEX IF NOT EXISTS idx_job_executions_started ON public.job_executions (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_executions_status ON public.job_executions (status);
CREATE INDEX IF NOT EXISTS idx_job_executions_config_status ON public.job_executions (job_config_id, status);

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Get enabled jobs (for cron scheduler)
CREATE OR REPLACE FUNCTION get_enabled_jobs()
RETURNS TABLE (
  id UUID,
  meta JSONB,
  payload JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    jc.id,
    jc.meta,
    jc.payload,
    jc.created_at,
    jc.updated_at
  FROM public.job_configs jc
  WHERE (jc.payload->>'enabled')::boolean = true
  ORDER BY (jc.payload->>'priority')::integer DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_enabled_jobs IS 'Get all enabled job configs ordered by priority';

-- Record job execution
CREATE OR REPLACE FUNCTION record_job_execution(
  p_job_config_id UUID,
  p_status TEXT,
  p_result JSONB DEFAULT NULL,
  p_error TEXT DEFAULT NULL,
  p_attempt_number INTEGER DEFAULT 1
)
RETURNS UUID AS $$
DECLARE
  v_execution_id UUID;
  v_duration_ms INTEGER;
BEGIN
  -- Calculate duration if completed
  IF p_status IN ('success', 'failure', 'timeout', 'cancelled') THEN
    v_duration_ms := EXTRACT(EPOCH FROM (now() - started_at))::INTEGER * 1000;
  END IF;

  -- Insert execution record
  INSERT INTO public.job_executions (
    job_config_id,
    status,
    result,
    error,
    attempt_number,
    duration_ms,
    completed_at
  ) VALUES (
    p_job_config_id,
    p_status,
    p_result,
    p_error,
    p_attempt_number,
    v_duration_ms,
    CASE WHEN p_status IN ('success', 'failure', 'timeout', 'cancelled') THEN now() ELSE NULL END
  ) RETURNING id INTO v_execution_id;

  RETURN v_execution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_job_execution IS 'Record a job execution attempt';

-- Get job execution history
CREATE OR REPLACE FUNCTION get_job_execution_history(
  p_job_config_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  job_config_id UUID,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT,
  result JSONB,
  error TEXT,
  attempt_number INTEGER,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    je.id,
    je.job_config_id,
    je.started_at,
    je.completed_at,
    je.status,
    je.result,
    je.error,
    je.attempt_number,
    je.duration_ms,
    je.created_at
  FROM public.job_executions je
  WHERE je.job_config_id = p_job_config_id
  ORDER BY je.started_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_job_execution_history IS 'Get execution history for a specific job config';

-- Get latest execution for each job
CREATE OR REPLACE FUNCTION get_latest_job_executions()
RETURNS TABLE (
  job_config_id UUID,
  execution_id UUID,
  status TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (je.job_config_id)
    je.job_config_id,
    je.id as execution_id,
    je.status,
    je.started_at,
    je.completed_at,
    je.duration_ms
  FROM public.job_executions je
  ORDER BY je.job_config_id, je.started_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_latest_job_executions IS 'Get latest execution for each enabled job';

-- =============================================================================
-- Verification Queries
-- =============================================================================

-- Verify tables exist
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('job_configs', 'job_executions')
ORDER BY table_name;

-- Verify RLS policies
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('job_configs', 'job_executions')
ORDER BY tablename, policyname;

-- Verify functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_enabled_jobs', 'record_job_execution', 'get_job_execution_history', 'get_latest_job_executions')
ORDER BY routine_name;
