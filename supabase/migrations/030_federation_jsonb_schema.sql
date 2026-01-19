-- 030_federation_jsonb_schema.sql
-- Sprint: S15-BD-FederationEditors-v1
-- Fixes federation tables to use JSONB meta+payload pattern
-- Required for SupabaseAdapter compatibility with JSONB_META_TYPES
--
-- This migration drops and recreates federation tables with the correct schema.
-- Data loss: Yes (development-only, no production data expected)

-- ============================================================================
-- DROP EXISTING TABLES (cascade dependencies)
-- ============================================================================

DROP VIEW IF EXISTS federation_stats;
DROP TABLE IF EXISTS trust_relationships CASCADE;
DROP TABLE IF EXISTS federation_exchanges CASCADE;
DROP TABLE IF EXISTS tier_mappings CASCADE;
DROP TABLE IF EXISTS federated_groves CASCADE;

-- ============================================================================
-- TABLE: federated_groves
-- GroveObject<FederatedGrovePayload> pattern
-- ============================================================================
CREATE TABLE IF NOT EXISTS federated_groves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta JSONB NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for federated_groves
CREATE INDEX IF NOT EXISTS idx_federated_groves_meta_type ON federated_groves ((meta->>'type'));
CREATE INDEX IF NOT EXISTS idx_federated_groves_meta_status ON federated_groves ((meta->>'status'));
CREATE INDEX IF NOT EXISTS idx_federated_groves_grove_id ON federated_groves ((payload->>'groveId'));
CREATE INDEX IF NOT EXISTS idx_federated_groves_connection ON federated_groves ((payload->>'connectionStatus'));
CREATE INDEX IF NOT EXISTS idx_federated_groves_updated ON federated_groves(updated_at DESC);

-- Unique constraint on groveId (within payload)
CREATE UNIQUE INDEX IF NOT EXISTS idx_federated_groves_grove_id_unique ON federated_groves ((payload->>'groveId'));

-- ============================================================================
-- TABLE: tier_mappings
-- GroveObject<TierMappingPayload> pattern
-- ============================================================================
CREATE TABLE IF NOT EXISTS tier_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta JSONB NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for tier_mappings
CREATE INDEX IF NOT EXISTS idx_tier_mappings_meta_type ON tier_mappings ((meta->>'type'));
CREATE INDEX IF NOT EXISTS idx_tier_mappings_meta_status ON tier_mappings ((meta->>'status'));
CREATE INDEX IF NOT EXISTS idx_tier_mappings_source ON tier_mappings ((payload->>'sourceGroveId'));
CREATE INDEX IF NOT EXISTS idx_tier_mappings_target ON tier_mappings ((payload->>'targetGroveId'));
CREATE INDEX IF NOT EXISTS idx_tier_mappings_status ON tier_mappings ((payload->>'status'));
CREATE INDEX IF NOT EXISTS idx_tier_mappings_updated ON tier_mappings(updated_at DESC);

-- ============================================================================
-- TABLE: federation_exchanges
-- GroveObject<FederationExchangePayload> pattern
-- ============================================================================
CREATE TABLE IF NOT EXISTS federation_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta JSONB NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for federation_exchanges
CREATE INDEX IF NOT EXISTS idx_exchanges_meta_type ON federation_exchanges ((meta->>'type'));
CREATE INDEX IF NOT EXISTS idx_exchanges_meta_status ON federation_exchanges ((meta->>'status'));
CREATE INDEX IF NOT EXISTS idx_exchanges_requesting ON federation_exchanges ((payload->>'requestingGroveId'));
CREATE INDEX IF NOT EXISTS idx_exchanges_providing ON federation_exchanges ((payload->>'providingGroveId'));
CREATE INDEX IF NOT EXISTS idx_exchanges_type ON federation_exchanges ((payload->>'type'));
CREATE INDEX IF NOT EXISTS idx_exchanges_status ON federation_exchanges ((payload->>'status'));
CREATE INDEX IF NOT EXISTS idx_exchanges_updated ON federation_exchanges(updated_at DESC);

-- ============================================================================
-- TABLE: trust_relationships
-- GroveObject<TrustRelationshipPayload> pattern
-- ============================================================================
CREATE TABLE IF NOT EXISTS trust_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta JSONB NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for trust_relationships
CREATE INDEX IF NOT EXISTS idx_trust_meta_type ON trust_relationships ((meta->>'type'));
CREATE INDEX IF NOT EXISTS idx_trust_meta_status ON trust_relationships ((meta->>'status'));
CREATE INDEX IF NOT EXISTS idx_trust_level ON trust_relationships ((payload->>'level'));
CREATE INDEX IF NOT EXISTS idx_trust_score ON trust_relationships (((payload->>'overallScore')::int) DESC);
CREATE INDEX IF NOT EXISTS idx_trust_updated ON trust_relationships(updated_at DESC);

-- Grove pair lookup (groveIds is an array in payload)
CREATE INDEX IF NOT EXISTS idx_trust_grove_ids ON trust_relationships USING GIN ((payload->'groveIds'));

-- ============================================================================
-- FUNCTIONS: Auto-update timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_federation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  -- Also update meta.updatedAt for GroveObject consistency
  NEW.meta = jsonb_set(NEW.meta, '{updatedAt}', to_jsonb(NOW()::text));
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

DROP TRIGGER IF EXISTS federation_exchanges_updated_at ON federation_exchanges;
CREATE TRIGGER federation_exchanges_updated_at
  BEFORE UPDATE ON federation_exchanges
  FOR EACH ROW
  EXECUTE FUNCTION update_federation_updated_at();

DROP TRIGGER IF EXISTS trust_relationships_updated_at ON trust_relationships;
CREATE TRIGGER trust_relationships_updated_at
  BEFORE UPDATE ON trust_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_federation_updated_at();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE federated_groves ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE federation_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_relationships ENABLE ROW LEVEL SECURITY;

-- For development/local: Allow all operations
CREATE POLICY "Allow all federated_groves operations" ON federated_groves
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all tier_mappings operations" ON tier_mappings
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all federation_exchanges operations" ON federation_exchanges
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all trust_relationships operations" ON trust_relationships
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- VIEWS: Useful aggregations (recreate)
-- ============================================================================
CREATE OR REPLACE VIEW federation_stats AS
SELECT
  (SELECT COUNT(*) FROM federated_groves WHERE meta->>'status' = 'active') AS active_groves,
  (SELECT COUNT(*) FROM federated_groves WHERE payload->>'connectionStatus' = 'connected') AS connected_groves,
  (SELECT COUNT(*) FROM federation_exchanges WHERE payload->>'status' = 'pending') AS pending_exchanges,
  (SELECT COUNT(*) FROM federation_exchanges WHERE payload->>'status' = 'completed') AS completed_exchanges,
  (SELECT COALESCE(SUM((payload->>'tokenValue')::numeric), 0) FROM federation_exchanges WHERE payload->>'status' = 'completed') AS total_tokens_exchanged,
  (SELECT AVG((payload->>'overallScore')::int) FROM trust_relationships)::INTEGER AS average_trust_score;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE federated_groves IS 'GroveObject<FederatedGrovePayload> - External grove registrations';
COMMENT ON TABLE tier_mappings IS 'GroveObject<TierMappingPayload> - Semantic tier equivalence mappings';
COMMENT ON TABLE federation_exchanges IS 'GroveObject<FederationExchangePayload> - Knowledge exchanges';
COMMENT ON TABLE trust_relationships IS 'GroveObject<TrustRelationshipPayload> - Bidirectional trust scores';

COMMENT ON COLUMN federated_groves.meta IS 'GroveObjectMeta: id, type, title, description, status, tags, timestamps';
COMMENT ON COLUMN federated_groves.payload IS 'FederatedGrovePayload: groveId, endpoint, capabilities, trustScore, etc.';
COMMENT ON COLUMN tier_mappings.meta IS 'GroveObjectMeta: id, type, title, description, status, tags, timestamps';
COMMENT ON COLUMN tier_mappings.payload IS 'TierMappingPayload: sourceGroveId, targetGroveId, equivalences, etc.';
COMMENT ON COLUMN federation_exchanges.meta IS 'GroveObjectMeta: id, type, title, description, status, tags, timestamps';
COMMENT ON COLUMN federation_exchanges.payload IS 'FederationExchangePayload: parties, type, contentType, tokenValue, etc.';
COMMENT ON COLUMN trust_relationships.meta IS 'GroveObjectMeta: id, type, title, description, status, tags, timestamps';
COMMENT ON COLUMN trust_relationships.payload IS 'TrustRelationshipPayload: groveIds, level, components, scores, etc.';
