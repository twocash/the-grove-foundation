// tests/e2e/s9-sl-federation/_test-data.ts
// Test data seeding utilities for S9-SL-Federation E2E tests
// Pattern: Match S11-SL-Attribution test-data.ts structure

import type { Page } from '@playwright/test';

// Storage keys for federation data
const STORAGE_KEYS = {
  FEDERATED_GROVES: 'grove-federated-groves',
  TIER_MAPPINGS: 'grove-tier-mappings',
  FEDERATION_EXCHANGES: 'grove-federation-exchanges',
  TRUST_RELATIONSHIPS: 'grove-trust-relationships',
  MY_GROVE_ID: 'grove-my-grove-id'
};

// Test grove IDs (consistent across tests)
const TEST_GROVE_IDS = {
  MY_GROVE: 'grove-local-001',
  STANFORD_AI: 'grove-stanford-ai-001',
  GROVE_NORDIC: 'grove-nordic-001',
  GROVE_TOKYO: 'grove-tokyo-001'
};

export type TrustLevel = 'new' | 'established' | 'trusted' | 'verified';
export type GroveStatus = 'active' | 'inactive' | 'degraded' | 'blocked';
export type ConnectionStatus = 'connected' | 'pending' | 'blocked' | 'none';
export type ExchangeStatus = 'pending' | 'approved' | 'completed' | 'rejected' | 'expired';

// Trust level thresholds
export const TRUST_THRESHOLDS = {
  new: { min: 0, max: 25 },
  established: { min: 25, max: 50 },
  trusted: { min: 50, max: 75 },
  verified: { min: 75, max: 100 }
};

export interface TierDefinition {
  id: string;
  name: string;
  level: number;
  icon?: string;
  color?: string;
}

export interface TierSystemDefinition {
  name: string;
  tiers: TierDefinition[];
}

export interface FederatedGroveData {
  groveId: string;
  name: string;
  description: string;
  endpoint: string;
  status: GroveStatus;
  connectionStatus: ConnectionStatus;
  tierSystem: TierSystemDefinition;
  trustScore: number;
  trustLevel: TrustLevel;
  sproutCount: number;
  exchangeCount: number;
  capabilities: string[];
}

export interface TierMappingData {
  sourceGroveId: string;
  targetGroveId: string;
  mappings: Array<{
    sourceTierId: string;
    targetTierId: string;
    equivalenceType: 'exact' | 'approximate' | 'subset' | 'superset';
  }>;
  status: 'draft' | 'proposed' | 'accepted' | 'rejected';
  confidenceScore: number;
}

export interface ExchangeData {
  requestingGroveId: string;
  providingGroveId: string;
  type: 'request' | 'offer';
  contentType: 'sprout' | 'concept' | 'research' | 'insight';
  status: ExchangeStatus;
  sourceTier: string;
  mappedTier?: string;
  tokenValue?: number;
}

export interface TrustRelationshipData {
  groveIds: [string, string];
  overallScore: number;
  components: {
    exchangeSuccess: number;
    tierAccuracy: number;
    responseTime: number;
    contentQuality: number;
  };
  exchangeCount: number;
  successfulExchanges: number;
  level: TrustLevel;
}

export interface SeedFederationOptions {
  myGrove?: Partial<FederatedGroveData>;
  connectedGroves?: FederatedGroveData[];
  tierMappings?: TierMappingData[];
  exchanges?: ExchangeData[];
  trustRelationships?: TrustRelationshipData[];
}

// Pre-defined tier systems
export const TIER_SYSTEMS = {
  botanical: {
    name: 'botanical',
    tiers: [
      { id: 'seed', name: 'Seed', level: 1, icon: '🌰' },
      { id: 'sapling', name: 'Sapling', level: 2, icon: '🌱' },
      { id: 'tree', name: 'Tree', level: 3, icon: '🌳' },
      { id: 'forest', name: 'Forest', level: 4, icon: '🌲' }
    ]
  },
  academic: {
    name: 'academic',
    tiers: [
      { id: 'tier-1', name: 'Undergraduate', level: 1, icon: '📚' },
      { id: 'tier-2', name: 'Graduate', level: 2, icon: '🎓' },
      { id: 'tier-3', name: 'Doctoral', level: 3, icon: '📖' },
      { id: 'tier-4', name: 'Professor', level: 4, icon: '👨‍🏫' },
      { id: 'tier-5', name: 'Distinguished', level: 5, icon: '🏆' }
    ]
  },
  nordic: {
    name: 'nordic',
    tiers: [
      { id: 'sprout', name: 'Sprout', level: 1, icon: '🌱' },
      { id: 'sapling', name: 'Sapling', level: 2, icon: '🌿' },
      { id: 'tree', name: 'Tree', level: 3, icon: '🌲' },
      { id: 'forest', name: 'Forest', level: 4, icon: '🌳' }
    ]
  }
};

// Default groves for testing
const DEFAULT_GROVES: FederatedGroveData[] = [
  {
    groveId: TEST_GROVE_IDS.STANFORD_AI,
    name: 'Stanford AI Research',
    description: 'Academic research focused on distributed inference',
    endpoint: 'https://api.stanford-ai.example.com',
    status: 'active',
    connectionStatus: 'connected',
    tierSystem: TIER_SYSTEMS.academic,
    trustScore: 95,
    trustLevel: 'verified',
    sproutCount: 1247,
    exchangeCount: 89,
    capabilities: ['knowledge-exchange', 'tier-mapping', 'model-sharing']
  },
  {
    groveId: TEST_GROVE_IDS.GROVE_NORDIC,
    name: 'Grove Nordic',
    description: 'Nordic AI cooperative focusing on sustainable models',
    endpoint: 'https://api.grove-nordic.example.com',
    status: 'active',
    connectionStatus: 'connected',
    tierSystem: TIER_SYSTEMS.nordic,
    trustScore: 87,
    trustLevel: 'trusted',
    sproutCount: 856,
    exchangeCount: 42,
    capabilities: ['knowledge-exchange', 'tier-mapping']
  },
  {
    groveId: TEST_GROVE_IDS.GROVE_TOKYO,
    name: 'Tokyo Tech Grove',
    description: 'Technical research on edge computing',
    endpoint: 'https://api.tokyo-grove.example.com',
    status: 'active',
    connectionStatus: 'pending',
    tierSystem: TIER_SYSTEMS.academic,
    trustScore: 35,
    trustLevel: 'established',
    sproutCount: 412,
    exchangeCount: 5,
    capabilities: ['knowledge-exchange']
  }
];

/**
 * Seed federation data into localStorage before test
 */
export async function seedFederationData(page: Page, options: SeedFederationOptions = {}): Promise<void> {
  const now = new Date().toISOString();

  await page.evaluate(({ keys, groveIds, options, defaultGroves, now }) => {
    const genId = () => crypto.randomUUID();

    // My grove (the local grove)
    const myGrove = {
      id: genId(),
      groveId: groveIds.MY_GROVE,
      name: options.myGrove?.name || 'My Local Grove',
      description: options.myGrove?.description || 'Local testing grove',
      endpoint: options.myGrove?.endpoint || 'https://localhost:3000',
      status: options.myGrove?.status || 'active',
      connectionStatus: 'none' as const,
      tierSystem: options.myGrove?.tierSystem || {
        name: 'botanical',
        tiers: [
          { id: 'seed', name: 'Seed', level: 1, icon: '🌰' },
          { id: 'sapling', name: 'Sapling', level: 2, icon: '🌱' },
          { id: 'tree', name: 'Tree', level: 3, icon: '🌳' },
          { id: 'forest', name: 'Forest', level: 4, icon: '🌲' }
        ]
      },
      trustScore: 100,
      trustLevel: 'verified' as const,
      sproutCount: options.myGrove?.sproutCount || 156,
      exchangeCount: options.myGrove?.exchangeCount || 23,
      capabilities: options.myGrove?.capabilities || ['knowledge-exchange', 'tier-mapping'],
      createdAt: now,
      updatedAt: now
    };

    // Connected groves
    const connectedGroves = (options.connectedGroves || defaultGroves).map(g => ({
      id: genId(),
      ...g,
      createdAt: now,
      updatedAt: now,
      lastHealthCheck: now,
      lastActivityAt: now
    }));

    // Tier mappings
    const tierMappings = (options.tierMappings || [
      {
        sourceGroveId: groveIds.MY_GROVE,
        targetGroveId: groveIds.GROVE_NORDIC,
        mappings: [
          { sourceTierId: 'seed', targetTierId: 'sprout', equivalenceType: 'exact' },
          { sourceTierId: 'sapling', targetTierId: 'sapling', equivalenceType: 'exact' },
          { sourceTierId: 'tree', targetTierId: 'tree', equivalenceType: 'exact' },
          { sourceTierId: 'forest', targetTierId: 'forest', equivalenceType: 'exact' }
        ],
        status: 'accepted',
        confidenceScore: 0.95
      }
    ]).map(m => ({
      id: genId(),
      ...m,
      createdAt: now,
      updatedAt: now,
      validatedAt: m.status === 'accepted' ? now : undefined
    }));

    // Federation exchanges
    const exchanges = (options.exchanges || [
      {
        requestingGroveId: groveIds.STANFORD_AI,
        providingGroveId: groveIds.MY_GROVE,
        type: 'request',
        contentType: 'sprout',
        status: 'pending',
        sourceTier: 'tier-2',
        mappedTier: 'sapling',
        tokenValue: 25
      },
      {
        requestingGroveId: groveIds.MY_GROVE,
        providingGroveId: groveIds.GROVE_NORDIC,
        type: 'request',
        contentType: 'research',
        status: 'completed',
        sourceTier: 'sapling',
        mappedTier: 'sapling',
        tokenValue: 50
      }
    ]).map(e => ({
      id: genId(),
      ...e,
      initiatedAt: now,
      completedAt: e.status === 'completed' ? now : undefined,
      createdAt: now
    }));

    // Trust relationships
    const trustRelationships = (options.trustRelationships || [
      {
        groveIds: [groveIds.MY_GROVE, groveIds.STANFORD_AI].sort() as [string, string],
        overallScore: 95,
        components: {
          exchangeSuccess: 98,
          tierAccuracy: 95,
          responseTime: 90,
          contentQuality: 97
        },
        exchangeCount: 89,
        successfulExchanges: 87,
        level: 'verified'
      },
      {
        groveIds: [groveIds.MY_GROVE, groveIds.GROVE_NORDIC].sort() as [string, string],
        overallScore: 87,
        components: {
          exchangeSuccess: 90,
          tierAccuracy: 92,
          responseTime: 85,
          contentQuality: 81
        },
        exchangeCount: 42,
        successfulExchanges: 38,
        level: 'trusted'
      }
    ]).map(t => ({
      id: genId(),
      ...t,
      lastExchangeAt: now,
      createdAt: now,
      updatedAt: now
    }));

    // Build full groves object (my grove + connected)
    const allGroves: Record<string, unknown> = {
      [myGrove.groveId]: myGrove
    };
    connectedGroves.forEach(g => {
      allGroves[g.groveId] = g;
    });

    // Set localStorage
    localStorage.setItem(keys.MY_GROVE_ID, groveIds.MY_GROVE);
    localStorage.setItem(keys.FEDERATED_GROVES, JSON.stringify(allGroves));
    localStorage.setItem(keys.TIER_MAPPINGS, JSON.stringify(tierMappings));
    localStorage.setItem(keys.FEDERATION_EXCHANGES, JSON.stringify(exchanges));
    localStorage.setItem(keys.TRUST_RELATIONSHIPS, JSON.stringify(trustRelationships));
  }, {
    keys: STORAGE_KEYS,
    groveIds: TEST_GROVE_IDS,
    options,
    defaultGroves: DEFAULT_GROVES,
    now
  });
}

/**
 * Clear all federation data from localStorage
 */
export async function clearFederationData(page: Page): Promise<void> {
  await page.evaluate((keys) => {
    Object.values(keys).forEach(key => localStorage.removeItem(key));
  }, STORAGE_KEYS);
}

// Preset configurations for different test scenarios
export const TEST_PRESETS = {
  // Just registered, no connections yet
  registeredGrove: {
    myGrove: {
      name: 'Fresh Grove',
      sproutCount: 0,
      exchangeCount: 0
    },
    connectedGroves: [],
    tierMappings: [],
    exchanges: [],
    trustRelationships: []
  },

  // Has connections but no exchanges yet
  connectedGroves: {
    connectedGroves: DEFAULT_GROVES.slice(0, 2),
    exchanges: [],
    trustRelationships: [
      {
        groveIds: [TEST_GROVE_IDS.MY_GROVE, TEST_GROVE_IDS.STANFORD_AI].sort() as [string, string],
        overallScore: 25,
        components: {
          exchangeSuccess: 0,
          tierAccuracy: 50,
          responseTime: 50,
          contentQuality: 0
        },
        exchangeCount: 0,
        successfulExchanges: 0,
        level: 'established' as TrustLevel
      }
    ]
  },

  // Has tier mappings configured
  tierMappings: {
    tierMappings: [
      {
        sourceGroveId: TEST_GROVE_IDS.MY_GROVE,
        targetGroveId: TEST_GROVE_IDS.GROVE_NORDIC,
        mappings: [
          { sourceTierId: 'seed', targetTierId: 'sprout', equivalenceType: 'exact' as const },
          { sourceTierId: 'sapling', targetTierId: 'sapling', equivalenceType: 'exact' as const },
          { sourceTierId: 'tree', targetTierId: 'tree', equivalenceType: 'exact' as const }
        ],
        status: 'accepted' as const,
        confidenceScore: 0.95
      },
      {
        sourceGroveId: TEST_GROVE_IDS.MY_GROVE,
        targetGroveId: TEST_GROVE_IDS.STANFORD_AI,
        mappings: [
          { sourceTierId: 'seed', targetTierId: 'tier-1', equivalenceType: 'approximate' as const },
          { sourceTierId: 'sapling', targetTierId: 'tier-2', equivalenceType: 'approximate' as const },
          { sourceTierId: 'tree', targetTierId: 'tier-3', equivalenceType: 'subset' as const }
        ],
        status: 'proposed' as const,
        confidenceScore: 0.72
      }
    ]
  },

  // Has pending exchange requests
  pendingRequests: {
    exchanges: [
      {
        requestingGroveId: TEST_GROVE_IDS.STANFORD_AI,
        providingGroveId: TEST_GROVE_IDS.MY_GROVE,
        type: 'request' as const,
        contentType: 'sprout' as const,
        status: 'pending' as const,
        sourceTier: 'tier-2',
        mappedTier: 'sapling',
        tokenValue: 25
      },
      {
        requestingGroveId: TEST_GROVE_IDS.GROVE_NORDIC,
        providingGroveId: TEST_GROVE_IDS.MY_GROVE,
        type: 'request' as const,
        contentType: 'research' as const,
        status: 'pending' as const,
        sourceTier: 'tree',
        tokenValue: 40
      }
    ]
  },

  // Full ecosystem with activity
  fullEcosystem: {
    connectedGroves: DEFAULT_GROVES,
    tierMappings: [
      {
        sourceGroveId: TEST_GROVE_IDS.MY_GROVE,
        targetGroveId: TEST_GROVE_IDS.GROVE_NORDIC,
        mappings: [
          { sourceTierId: 'seed', targetTierId: 'sprout', equivalenceType: 'exact' as const },
          { sourceTierId: 'sapling', targetTierId: 'sapling', equivalenceType: 'exact' as const },
          { sourceTierId: 'tree', targetTierId: 'tree', equivalenceType: 'exact' as const },
          { sourceTierId: 'forest', targetTierId: 'forest', equivalenceType: 'exact' as const }
        ],
        status: 'accepted' as const,
        confidenceScore: 0.95
      },
      {
        sourceGroveId: TEST_GROVE_IDS.MY_GROVE,
        targetGroveId: TEST_GROVE_IDS.STANFORD_AI,
        mappings: [
          { sourceTierId: 'seed', targetTierId: 'tier-1', equivalenceType: 'approximate' as const },
          { sourceTierId: 'sapling', targetTierId: 'tier-2', equivalenceType: 'approximate' as const },
          { sourceTierId: 'tree', targetTierId: 'tier-3', equivalenceType: 'subset' as const },
          { sourceTierId: 'forest', targetTierId: 'tier-4', equivalenceType: 'superset' as const }
        ],
        status: 'accepted' as const,
        confidenceScore: 0.82
      }
    ],
    exchanges: [
      {
        requestingGroveId: TEST_GROVE_IDS.STANFORD_AI,
        providingGroveId: TEST_GROVE_IDS.MY_GROVE,
        type: 'request' as const,
        contentType: 'sprout' as const,
        status: 'pending' as const,
        sourceTier: 'tier-2',
        mappedTier: 'sapling',
        tokenValue: 25
      },
      {
        requestingGroveId: TEST_GROVE_IDS.MY_GROVE,
        providingGroveId: TEST_GROVE_IDS.GROVE_NORDIC,
        type: 'request' as const,
        contentType: 'research' as const,
        status: 'completed' as const,
        sourceTier: 'sapling',
        mappedTier: 'sapling',
        tokenValue: 50
      },
      {
        requestingGroveId: TEST_GROVE_IDS.MY_GROVE,
        providingGroveId: TEST_GROVE_IDS.STANFORD_AI,
        type: 'offer' as const,
        contentType: 'insight' as const,
        status: 'approved' as const,
        sourceTier: 'tree',
        mappedTier: 'tier-3',
        tokenValue: 75
      }
    ],
    trustRelationships: [
      {
        groveIds: [TEST_GROVE_IDS.MY_GROVE, TEST_GROVE_IDS.STANFORD_AI].sort() as [string, string],
        overallScore: 95,
        components: {
          exchangeSuccess: 98,
          tierAccuracy: 95,
          responseTime: 90,
          contentQuality: 97
        },
        exchangeCount: 89,
        successfulExchanges: 87,
        level: 'verified' as TrustLevel
      },
      {
        groveIds: [TEST_GROVE_IDS.MY_GROVE, TEST_GROVE_IDS.GROVE_NORDIC].sort() as [string, string],
        overallScore: 87,
        components: {
          exchangeSuccess: 90,
          tierAccuracy: 92,
          responseTime: 85,
          contentQuality: 81
        },
        exchangeCount: 42,
        successfulExchanges: 38,
        level: 'trusted' as TrustLevel
      },
      {
        groveIds: [TEST_GROVE_IDS.MY_GROVE, TEST_GROVE_IDS.GROVE_TOKYO].sort() as [string, string],
        overallScore: 35,
        components: {
          exchangeSuccess: 60,
          tierAccuracy: 40,
          responseTime: 20,
          contentQuality: 20
        },
        exchangeCount: 5,
        successfulExchanges: 3,
        level: 'established' as TrustLevel
      }
    ]
  }
};

// Export grove IDs for test use
export { TEST_GROVE_IDS };
