-- 029_federation_groves.sql
-- Sprint: S9-SL-Federation-v1
-- Grove-Level Federation Database Schema
-- Enables cross-grove federation with tier mapping and trust relationships

-- ============================================================================
-- TABLE: federated_groves
-- Stores registered federated groves (external communities)
-- ============================================================================
CREATE TABLE IF NOT EXISTS federated_groves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grove_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  endpoint TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'degraded', 'blocked')),
  connection_status TEXT DEFAULT 'none' CHECK (connection_status IN ('connected', 'pending', 'blocked', 'none')),
  tier_system JSONB NOT NULL,
  trust_score INTEGER DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
  trust_level TEXT DEFAULT 'new' CHECK (trust_level IN ('new', 'established', 'trusted', 'verified')),
  sprout_count INTEGER DEFAULT 0,
  exchange_count INTEGER DEFAULT 0,
  capabilities TEXT[] DEFAULT '{}',
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  last_health_check TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_federated_groves_status ON federated_groves(status);
CREATE INDEX IF NOT EXISTS idx_federated_groves_connection ON federated_groves(connection_status);
CREATE INDEX IF NOT EXISTS idx_federated_groves_trust_level ON federated_groves(trust_level);
CREATE INDEX IF NOT EXISTS idx_federated_groves_updated ON federated_groves(updated_at DESC);

-- ============================================================================
-- TABLE: tier_mappings
-- Defines semantic tier equivalence between grove tier systems
-- ============================================================================
CREATE TABLE IF NOT EXISTS tier_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_grove_id TEXT NOT NULL REFERENCES federated_groves(grove_id) ON DELETE CASCADE,
  target_grove_id TEXT NOT NULL REFERENCES federated_groves(grove_id) ON DELETE CASCADE,
  mappings JSONB NOT NULL, -- Array of TierEquivalence objects
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'proposed', 'accepted', 'rejected')),
  confidence_score NUMERIC(3,2) DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  validated_at TIMESTAMPTZ,
  validated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_grove_id, target_grove_id)
);

-- Indexes for tier mapping queries
CREATE INDEX IF NOT EXISTS idx_tier_mappings_source ON tier_mappings(source_grove_id);
CREATE INDEX IF NOT EXISTS idx_tier_mappings_target ON tier_mappings(target_grove_id);
CREATE INDEX IF NOT EXISTS idx_tier_mappings_status ON tier_mappings(status);

-- ============================================================================
-- TABLE: federation_exchanges
-- Records knowledge exchange requests and offers between groves
-- ============================================================================
CREATE TABLE IF NOT EXISTS federation_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requesting_grove_id TEXT NOT NULL REFERENCES federated_groves(grove_id) ON DELETE CASCADE,
  providing_grove_id TEXT NOT NULL REFERENCES federated_groves(grove_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('request', 'offer')),
  content_type TEXT NOT NULL CHECK (content_type IN ('sprout', 'concept', 'research', 'insight')),
  content_id TEXT,
  query TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'rejected', 'expired')),
  source_tier TEXT,
  mapped_tier TEXT,
  token_value NUMERIC(10,2),
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for exchange queries
CREATE INDEX IF NOT EXISTS idx_exchanges_requesting ON federation_exchanges(requesting_grove_id);
CREATE INDEX IF NOT EXISTS idx_exchanges_providing ON federation_exchanges(providing_grove_id);
CREATE INDEX IF NOT EXISTS idx_exchanges_status ON federation_exchanges(status);
CREATE INDEX IF NOT EXISTS idx_exchanges_type ON federation_exchanges(type);
CREATE INDEX IF NOT EXISTS idx_exchanges_initiated ON federation_exchanges(initiated_at DESC);

-- ============================================================================
-- TABLE: trust_relationships
-- Bidirectional trust relationships between grove pairs
-- ============================================================================
CREATE TABLE IF NOT EXISTS trust_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grove_id_1 TEXT NOT NULL,
  grove_id_2 TEXT NOT NULL,
  overall_score INTEGER DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  components JSONB DEFAULT '{"exchangeSuccess": 50, "tierAccuracy": 50, "responseTime": 50, "contentQuality": 50}',
  exchange_count INTEGER DEFAULT 0,
  successful_exchanges INTEGER DEFAULT 0,
  level TEXT DEFAULT 'new' CHECK (level IN ('new', 'established', 'trusted', 'verified')),
  verified_at TIMESTAMPTZ,
  verified_by TEXT CHECK (verified_by IN ('system', 'admin', 'community') OR verified_by IS NULL),
  last_exchange_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure alphabetical ordering of grove IDs for consistency
  UNIQUE(grove_id_1, grove_id_2),
  CHECK(grove_id_1 < grove_id_2)
);

-- Foreign keys (using separate constraint due to ordering requirement)
-- Note: grove_id_1 and grove_id_2 may reference external groves not in our table
-- For internal groves, these will be validated at application level

-- Indexes for trust queries
CREATE INDEX IF NOT EXISTS idx_trust_grove_1 ON trust_relationships(grove_id_1);
CREATE INDEX IF NOT EXISTS idx_trust_grove_2 ON trust_relationships(grove_id_2);
CREATE INDEX IF NOT EXISTS idx_trust_level ON trust_relationships(level);
CREATE INDEX IF NOT EXISTS idx_trust_score ON trust_relationships(overall_score DESC);

-- ============================================================================
-- FUNCTIONS: Auto-update timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_federation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS federated_groves_updated_at ON federated_groves;
CREATE TRIGGER federated_groves_updated_at
  BEFORE UPDATE ON federated_groves
  FOR EACH ROW
  EXECUTE FUNCTION update_federation_updated_at();

DROP TRIGGER IF EXISTS tier_mappings_updated_at ON tier_mappings;
CREATE TRIGGER tier_mappings_updated_at
  BEFORE UPDATE ON tier_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_federation_updated_at();

DROP TRIGGER IF EXISTS trust_relationships_updated_at ON trust_relationships;
CREATE TRIGGER trust_relationships_updated_at
  BEFORE UPDATE ON trust_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_federation_updated_at();

-- ============================================================================
-- FUNCTIONS: Trust score update helpers
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_trust_score(components JSONB)
RETURNS INTEGER AS $$
DECLARE
  exchange_success NUMERIC;
  tier_accuracy NUMERIC;
  response_time NUMERIC;
  content_quality NUMERIC;
BEGIN
  exchange_success := COALESCE((components->>'exchangeSuccess')::NUMERIC, 50);
  tier_accuracy := COALESCE((components->>'tierAccuracy')::NUMERIC, 50);
  response_time := COALESCE((components->>'responseTime')::NUMERIC, 50);
  content_quality := COALESCE((components->>'contentQuality')::NUMERIC, 50);

  RETURN ROUND(
    exchange_success * 0.35 +
    tier_accuracy * 0.25 +
    response_time * 0.15 +
    content_quality * 0.25
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_trust_level(score INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF score >= 75 THEN
    RETURN 'verified';
  ELSIF score >= 50 THEN
    RETURN 'trusted';
  ELSIF score >= 25 THEN
    RETURN 'established';
  ELSE
    RETURN 'new';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE federated_groves ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE federation_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_relationships ENABLE ROW LEVEL SECURITY;

-- For development/local: Allow all operations
-- In production, these should be replaced with proper authentication checks
CREATE POLICY "Allow all federated_groves operations" ON federated_groves
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all tier_mappings operations" ON tier_mappings
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all federation_exchanges operations" ON federation_exchanges
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all trust_relationships operations" ON trust_relationships
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- VIEWS: Useful aggregations
-- ============================================================================
CREATE OR REPLACE VIEW federation_stats AS
SELECT
  (SELECT COUNT(*) FROM federated_groves WHERE status = 'active') AS active_groves,
  (SELECT COUNT(*) FROM federated_groves WHERE connection_status = 'connected') AS connected_groves,
  (SELECT COUNT(*) FROM federation_exchanges WHERE status = 'pending') AS pending_exchanges,
  (SELECT COUNT(*) FROM federation_exchanges WHERE status = 'completed') AS completed_exchanges,
  (SELECT COALESCE(SUM(token_value), 0) FROM federation_exchanges WHERE status = 'completed') AS total_tokens_exchanged,
  (SELECT AVG(overall_score) FROM trust_relationships)::INTEGER AS average_trust_score;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE federated_groves IS 'External grove registrations for federation';
COMMENT ON TABLE tier_mappings IS 'Semantic tier equivalence mappings between groves';
COMMENT ON TABLE federation_exchanges IS 'Knowledge exchange requests and offers';
COMMENT ON TABLE trust_relationships IS 'Bidirectional trust scores between grove pairs';

COMMENT ON COLUMN federated_groves.tier_system IS 'JSON: TierSystemDefinition with name and tiers array';
COMMENT ON COLUMN tier_mappings.mappings IS 'JSON: Array of TierEquivalence objects';
COMMENT ON COLUMN trust_relationships.components IS 'JSON: TrustComponents with exchangeSuccess, tierAccuracy, responseTime, contentQuality';
