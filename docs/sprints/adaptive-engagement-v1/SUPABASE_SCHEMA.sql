-- Session telemetry persistence
-- Sprint: adaptive-engagement-v1
-- Run in Supabase SQL Editor

-- Session telemetry table
CREATE TABLE IF NOT EXISTS session_telemetry (
  session_id TEXT PRIMARY KEY,
  visit_count INTEGER DEFAULT 1,
  first_visit TIMESTAMPTZ DEFAULT NOW(),
  last_visit TIMESTAMPTZ DEFAULT NOW(),
  total_exchange_count INTEGER DEFAULT 0,
  all_topics_explored TEXT[] DEFAULT '{}',
  sprouts_captured INTEGER DEFAULT 0,
  completed_journeys TEXT[] DEFAULT '{}',
  current_stage TEXT DEFAULT 'ARRIVAL',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journey progress tracking
CREATE TABLE IF NOT EXISTS journey_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  journey_id TEXT NOT NULL,
  current_waypoint INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  explicit_start BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, journey_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_telemetry_last_visit
  ON session_telemetry(last_visit DESC);
CREATE INDEX IF NOT EXISTS idx_journey_progress_session
  ON journey_progress(session_id);

-- RLS
ALTER TABLE session_telemetry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_telemetry" ON session_telemetry
  FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE journey_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_journey" ON journey_progress
  FOR ALL TO anon USING (true) WITH CHECK (true);
