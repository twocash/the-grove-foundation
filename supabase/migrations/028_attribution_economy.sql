-- Attribution Economy Schema
-- Sprint: S11-SL-Attribution v1.0
-- Creates tables for Knowledge Economy & Rewards system
--
-- PATTERN: Economic tracking infrastructure
-- Tracks token rewards, reputation scores, and attribution chains
-- Implements DEX Pillar III: Provenance as Infrastructure

-- =============================================================================
-- Table 1: attribution_events
-- Records every economic event in the system
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.attribution_events (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source and Target
  source_grove_id TEXT NOT NULL,           -- Grove that contributed
  target_grove_id TEXT NOT NULL,           -- Grove that received contribution
  content_id UUID,                          -- Optional: specific sprout/content ID

  -- Tier & Quality (from S10-SL-AICuration)
  tier_level INTEGER NOT NULL CHECK (tier_level BETWEEN 1 AND 3),
  quality_score DECIMAL(5,2) CHECK (quality_score BETWEEN 0 AND 100),
  attribution_strength DECIMAL(3,2) NOT NULL CHECK (attribution_strength BETWEEN 0 AND 1) DEFAULT 0.75,

  -- Token Calculation Components
  base_tokens DECIMAL(10,2) NOT NULL,              -- Tier-based: sprout=10, sapling=50, tree=250
  quality_multiplier DECIMAL(3,2) NOT NULL,        -- From quality_score: 0.5x to 2.0x
  network_bonus DECIMAL(3,2) NOT NULL DEFAULT 0.2, -- Cross-grove influence
  reputation_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0, -- From reputation tier

  -- Final Calculated Tokens
  final_tokens DECIMAL(10,2) NOT NULL,
  -- Formula: final_tokens = base_tokens × quality_multiplier × (1 + network_bonus) × reputation_multiplier

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attribution_events_source ON public.attribution_events(source_grove_id);
CREATE INDEX IF NOT EXISTS idx_attribution_events_target ON public.attribution_events(target_grove_id);
CREATE INDEX IF NOT EXISTS idx_attribution_events_content ON public.attribution_events(content_id);
CREATE INDEX IF NOT EXISTS idx_attribution_events_created ON public.attribution_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attribution_events_tier ON public.attribution_events(tier_level);

-- RLS
ALTER TABLE public.attribution_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all users" ON public.attribution_events FOR SELECT USING (true);
CREATE POLICY "Allow insert for all users" ON public.attribution_events FOR INSERT WITH CHECK (true);

COMMENT ON TABLE public.attribution_events IS 'Records every economic attribution event with token calculations';
COMMENT ON COLUMN public.attribution_events.final_tokens IS 'Calculated: base_tokens × quality_multiplier × (1 + network_bonus) × reputation_multiplier';

-- =============================================================================
-- Table 2: token_balances
-- Grove token holdings with history tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.token_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  grove_id TEXT NOT NULL UNIQUE,
  current_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  lifetime_earned DECIMAL(12,2) NOT NULL DEFAULT 0,
  lifetime_spent DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Statistics
  last_activity_at TIMESTAMPTZ,
  total_attributions INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_token_balances_grove ON public.token_balances(grove_id);
CREATE INDEX IF NOT EXISTS idx_token_balances_balance ON public.token_balances(current_balance DESC);
CREATE INDEX IF NOT EXISTS idx_token_balances_lifetime ON public.token_balances(lifetime_earned DESC);

-- RLS
ALTER TABLE public.token_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all users" ON public.token_balances FOR SELECT USING (true);
CREATE POLICY "Allow all operations" ON public.token_balances FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE public.token_balances IS 'Token holdings per grove with lifetime statistics';

-- =============================================================================
-- Table 3: reputation_scores
-- Tier-based reputation with 5 levels
-- =============================================================================

CREATE TYPE reputation_tier AS ENUM ('novice', 'developing', 'competent', 'expert', 'legendary');

CREATE TABLE IF NOT EXISTS public.reputation_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  grove_id TEXT NOT NULL UNIQUE,

  -- Current Score & Tier
  reputation_score DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (reputation_score BETWEEN 0 AND 100),
  current_tier reputation_tier NOT NULL DEFAULT 'novice',
  tier_multiplier DECIMAL(3,2) NOT NULL DEFAULT 0.9,
  -- Tier multipliers: novice=0.9, developing=1.0, competent=1.1, expert=1.3, legendary=1.5

  -- Statistics for score calculation
  total_contributions INTEGER NOT NULL DEFAULT 0,
  quality_weighted_score DECIMAL(10,2) NOT NULL DEFAULT 0,  -- Sum of (quality × attribution_strength)
  average_quality DECIMAL(5,2) DEFAULT 0,
  consistency_score DECIMAL(5,2) DEFAULT 0,   -- How consistent is contribution quality

  -- Badges (stored as array of badge IDs)
  badges TEXT[] DEFAULT '{}',

  -- Timestamps
  tier_achieved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_reputation_scores_grove ON public.reputation_scores(grove_id);
CREATE INDEX IF NOT EXISTS idx_reputation_scores_tier ON public.reputation_scores(current_tier);
CREATE INDEX IF NOT EXISTS idx_reputation_scores_score ON public.reputation_scores(reputation_score DESC);

-- RLS
ALTER TABLE public.reputation_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all users" ON public.reputation_scores FOR SELECT USING (true);
CREATE POLICY "Allow all operations" ON public.reputation_scores FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE public.reputation_scores IS 'Reputation tiers: Novice (<30), Developing (30-49), Competent (50-69), Expert (70-89), Legendary (90+)';
COMMENT ON COLUMN public.reputation_scores.tier_multiplier IS 'Multiplier for token calculation: novice=0.9, developing=1.0, competent=1.1, expert=1.3, legendary=1.5';

-- =============================================================================
-- Table 4: network_influence
-- Cross-grove relationships and influence scores
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.network_influence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  source_grove_id TEXT NOT NULL,
  target_grove_id TEXT NOT NULL,

  -- Influence Metrics
  influence_score DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (influence_score BETWEEN 0 AND 100),
  interaction_count INTEGER NOT NULL DEFAULT 0,
  total_tokens_exchanged DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Network Bonus (1.0 to 2.0 multiplier based on influence)
  network_bonus DECIMAL(3,2) NOT NULL DEFAULT 1.0 CHECK (network_bonus BETWEEN 1.0 AND 2.0),

  -- Direction tracking
  is_bidirectional BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  first_interaction_at TIMESTAMPTZ,
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate relationships
  UNIQUE(source_grove_id, target_grove_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_network_influence_source ON public.network_influence(source_grove_id);
CREATE INDEX IF NOT EXISTS idx_network_influence_target ON public.network_influence(target_grove_id);
CREATE INDEX IF NOT EXISTS idx_network_influence_score ON public.network_influence(influence_score DESC);

-- RLS
ALTER TABLE public.network_influence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all users" ON public.network_influence FOR SELECT USING (true);
CREATE POLICY "Allow all operations" ON public.network_influence FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE public.network_influence IS 'Cross-grove influence relationships for network bonus calculation';
COMMENT ON COLUMN public.network_influence.network_bonus IS 'Calculated bonus multiplier from influence_score: 1.0 (min) to 2.0 (max)';

-- =============================================================================
-- Table 5: economic_settings
-- Configurable parameters (DEX: Declarative Sovereignty)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.economic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Setting Identity
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,

  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  previous_value JSONB,

  -- Audit
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.economic_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all users" ON public.economic_settings FOR SELECT USING (true);
CREATE POLICY "Allow all operations" ON public.economic_settings FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE public.economic_settings IS 'Configurable economic parameters (DEX: Declarative Sovereignty)';

-- Insert default settings
INSERT INTO public.economic_settings (setting_key, setting_value, description) VALUES
  ('base_tokens', '{"sprout": 10, "sapling": 50, "tree": 250}', 'Base token rewards per tier'),
  ('quality_multipliers', '{"90": 2.0, "80": 1.8, "70": 1.6, "60": 1.4, "50": 1.2, "40": 1.0, "30": 0.9, "20": 0.8, "0": 0.5}', 'Quality score to multiplier mapping'),
  ('reputation_multipliers', '{"legendary": 1.5, "expert": 1.3, "competent": 1.1, "developing": 1.0, "novice": 0.9}', 'Reputation tier multipliers'),
  ('tier_thresholds', '{"legendary": 90, "expert": 70, "competent": 50, "developing": 30, "novice": 0}', 'Score thresholds for reputation tiers'),
  ('network_bonus_range', '{"min": 1.0, "max": 2.0}', 'Range for network influence bonus'),
  ('default_attribution_strength', '0.75', 'Default attribution strength if not calculated')
ON CONFLICT (setting_key) DO NOTHING;

-- =============================================================================
-- Table 6: attribution_chains
-- Provenance trails for attribution tracking (DEX Pillar III)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.attribution_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Chain Identity
  root_content_id UUID NOT NULL,           -- Original contribution that started the chain
  chain_depth INTEGER NOT NULL DEFAULT 1,   -- How deep is this chain

  -- Chain Structure (JSONB array of attribution events)
  chain_events JSONB NOT NULL DEFAULT '[]',
  -- Each event: { event_id, source_grove_id, target_grove_id, tokens, timestamp }

  -- Aggregates
  total_tokens DECIMAL(12,2) NOT NULL DEFAULT 0,
  participant_count INTEGER NOT NULL DEFAULT 1,
  average_quality DECIMAL(5,2) DEFAULT 0,

  -- Timestamps
  chain_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attribution_chains_root ON public.attribution_chains(root_content_id);
CREATE INDEX IF NOT EXISTS idx_attribution_chains_depth ON public.attribution_chains(chain_depth DESC);
CREATE INDEX IF NOT EXISTS idx_attribution_chains_tokens ON public.attribution_chains(total_tokens DESC);

-- RLS
ALTER TABLE public.attribution_chains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all users" ON public.attribution_chains FOR SELECT USING (true);
CREATE POLICY "Allow all operations" ON public.attribution_chains FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE public.attribution_chains IS 'Provenance trails tracking attribution through the knowledge graph (DEX Pillar III)';
COMMENT ON COLUMN public.attribution_chains.chain_events IS 'Array of events: [{event_id, source_grove_id, target_grove_id, tokens, timestamp}]';

-- =============================================================================
-- Updated At Triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION update_attribution_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_attribution_events_updated ON public.attribution_events;
CREATE TRIGGER trigger_attribution_events_updated
  BEFORE UPDATE ON public.attribution_events
  FOR EACH ROW EXECUTE FUNCTION update_attribution_timestamp();

DROP TRIGGER IF EXISTS trigger_token_balances_updated ON public.token_balances;
CREATE TRIGGER trigger_token_balances_updated
  BEFORE UPDATE ON public.token_balances
  FOR EACH ROW EXECUTE FUNCTION update_attribution_timestamp();

DROP TRIGGER IF EXISTS trigger_reputation_scores_updated ON public.reputation_scores;
CREATE TRIGGER trigger_reputation_scores_updated
  BEFORE UPDATE ON public.reputation_scores
  FOR EACH ROW EXECUTE FUNCTION update_attribution_timestamp();

DROP TRIGGER IF EXISTS trigger_network_influence_updated ON public.network_influence;
CREATE TRIGGER trigger_network_influence_updated
  BEFORE UPDATE ON public.network_influence
  FOR EACH ROW EXECUTE FUNCTION update_attribution_timestamp();

DROP TRIGGER IF EXISTS trigger_economic_settings_updated ON public.economic_settings;
CREATE TRIGGER trigger_economic_settings_updated
  BEFORE UPDATE ON public.economic_settings
  FOR EACH ROW EXECUTE FUNCTION update_attribution_timestamp();

DROP TRIGGER IF EXISTS trigger_attribution_chains_updated ON public.attribution_chains;
CREATE TRIGGER trigger_attribution_chains_updated
  BEFORE UPDATE ON public.attribution_chains
  FOR EACH ROW EXECUTE FUNCTION update_attribution_timestamp();

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Get quality multiplier from score
CREATE OR REPLACE FUNCTION get_quality_multiplier(p_score DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  IF p_score >= 90 THEN RETURN 2.0;
  ELSIF p_score >= 80 THEN RETURN 1.8;
  ELSIF p_score >= 70 THEN RETURN 1.6;
  ELSIF p_score >= 60 THEN RETURN 1.4;
  ELSIF p_score >= 50 THEN RETURN 1.2;
  ELSIF p_score >= 40 THEN RETURN 1.0;
  ELSIF p_score >= 30 THEN RETURN 0.9;
  ELSIF p_score >= 20 THEN RETURN 0.8;
  ELSE RETURN 0.5;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get reputation tier from score
CREATE OR REPLACE FUNCTION get_reputation_tier(p_score DECIMAL)
RETURNS reputation_tier AS $$
BEGIN
  IF p_score >= 90 THEN RETURN 'legendary';
  ELSIF p_score >= 70 THEN RETURN 'expert';
  ELSIF p_score >= 50 THEN RETURN 'competent';
  ELSIF p_score >= 30 THEN RETURN 'developing';
  ELSE RETURN 'novice';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get tier multiplier from tier
CREATE OR REPLACE FUNCTION get_tier_multiplier(p_tier reputation_tier)
RETURNS DECIMAL AS $$
BEGIN
  CASE p_tier
    WHEN 'legendary' THEN RETURN 1.5;
    WHEN 'expert' THEN RETURN 1.3;
    WHEN 'competent' THEN RETURN 1.1;
    WHEN 'developing' THEN RETURN 1.0;
    ELSE RETURN 0.9;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate final tokens
CREATE OR REPLACE FUNCTION calculate_final_tokens(
  p_base_tokens DECIMAL,
  p_quality_multiplier DECIMAL,
  p_network_bonus DECIMAL,
  p_reputation_multiplier DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND(p_base_tokens * p_quality_multiplier * (1 + p_network_bonus) * p_reputation_multiplier, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_quality_multiplier IS 'Returns quality multiplier (0.5-2.0) based on score (0-100)';
COMMENT ON FUNCTION get_reputation_tier IS 'Returns reputation tier enum based on score thresholds';
COMMENT ON FUNCTION get_tier_multiplier IS 'Returns token multiplier for a reputation tier';
COMMENT ON FUNCTION calculate_final_tokens IS 'Calculates final tokens: base × quality × (1 + network) × reputation';

-- =============================================================================
-- Aggregation View: Grove Economic Summary
-- =============================================================================

CREATE OR REPLACE VIEW public.grove_economic_summary AS
SELECT
  tb.grove_id,
  tb.current_balance,
  tb.lifetime_earned,
  tb.total_attributions,
  rs.reputation_score,
  rs.current_tier,
  rs.tier_multiplier,
  rs.badges,
  (SELECT COUNT(*) FROM public.network_influence ni WHERE ni.source_grove_id = tb.grove_id) AS outgoing_influence_count,
  (SELECT COALESCE(AVG(influence_score), 0) FROM public.network_influence ni WHERE ni.source_grove_id = tb.grove_id) AS avg_outgoing_influence,
  tb.last_activity_at,
  tb.updated_at
FROM public.token_balances tb
LEFT JOIN public.reputation_scores rs ON rs.grove_id = tb.grove_id;

COMMENT ON VIEW public.grove_economic_summary IS 'Aggregated economic view per grove: balance, reputation, influence';
