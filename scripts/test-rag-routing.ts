#!/usr/bin/env npx ts-node
/**
 * test-rag-routing.ts
 *
 * Tests the RAG routing logic from server.js against the V2.1 unified registry.
 * Simulates both Deterministic Mode (journey-based) and Discovery Mode (tag-based).
 *
 * Usage:
 *   npx ts-node scripts/test-rag-routing.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const REGISTRY_PATH = path.join(__dirname, '../data/narratives.json');

// ============================================================================
// ROUTING LOGIC (Copied from server.js for testing)
// ============================================================================

interface TopicHub {
  id: string;
  title: string;
  path: string;
  primaryFile: string;
  supportingFiles?: string[];
  status: 'active' | 'draft' | 'archived';
  tags: string[];
  maxBytes?: number;
}

interface Journey {
  id: string;
  title: string;
  linkedHubId?: string;
  status: 'active' | 'draft';
}

/**
 * Route query to a hub based on tag matching (Discovery Mode)
 * Mirrors server.js routeQueryToHub()
 */
function routeQueryToHub(
  query: string,
  hubs: Record<string, TopicHub>
): { hubId: string; hub: TopicHub; matchedTags: string[] } | null {
  if (!hubs || Object.keys(hubs).length === 0) return null;

  const queryLower = query.toLowerCase();
  let bestMatch: { hubId: string; hub: TopicHub; matchedTags: string[]; score: number } | null = null;

  for (const [hubId, hub] of Object.entries(hubs)) {
    // Skip disabled or non-active hubs
    if (hub.status && hub.status !== 'active') continue;

    let score = 0;
    const matchedTags: string[] = [];

    for (const tag of hub.tags || []) {
      if (queryLower.includes(tag.toLowerCase())) {
        matchedTags.push(tag);
        const wordCount = tag.split(' ').length;
        score += wordCount * 2;
      }
    }

    if (matchedTags.length > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { hubId, hub, matchedTags, score };
    }
  }

  if (bestMatch) {
    return { hubId: bestMatch.hubId, hub: bestMatch.hub, matchedTags: bestMatch.matchedTags };
  }
  return null;
}

/**
 * Simulate fetchRagContext logic
 * Mirrors server.js fetchRagContext()
 */
function simulateFetchRagContext(
  message: string,
  registry: any,
  activeJourneyId: string | null
): {
  mode: 'deterministic' | 'discovery' | 'none';
  targetHubId: string | null;
  targetHub: TopicHub | null;
  reason: string;
} {
  const { hubs, journeys } = registry;

  let targetHubId: string | null = null;
  let targetHub: TopicHub | null = null;
  let mode: 'deterministic' | 'discovery' | 'none' = 'none';
  let reason = '';

  // Mode 1: DETERMINISTIC - Journey specifies linkedHubId
  if (activeJourneyId && journeys?.[activeJourneyId]) {
    const journey = journeys[activeJourneyId] as Journey;
    if (journey.linkedHubId && hubs[journey.linkedHubId]) {
      targetHubId = journey.linkedHubId;
      targetHub = hubs[targetHubId];
      mode = 'deterministic';
      reason = `Journey "${activeJourneyId}" → Hub "${targetHubId}"`;
    } else if (journey.linkedHubId) {
      reason = `Journey "${activeJourneyId}" links to missing hub "${journey.linkedHubId}"`;
    }
  }

  // Mode 2: DISCOVERY - Route query to best matching hub
  if (!targetHub && message && Object.keys(hubs).length > 0) {
    const match = routeQueryToHub(message, hubs);
    if (match) {
      targetHubId = match.hubId;
      targetHub = match.hub;
      mode = 'discovery';
      reason = `Query matched hub "${targetHubId}" (tags: ${match.matchedTags.join(', ')})`;
    } else {
      reason = 'No hub matched query tags';
    }
  }

  return { mode, targetHubId, targetHub, reason };
}

// ============================================================================
// TEST CASES
// ============================================================================

interface TestCase {
  name: string;
  message: string;
  journeyId: string | null;
  expected: {
    mode: 'deterministic' | 'discovery' | 'none';
    hubId: string | null;
  };
}

const testCases: TestCase[] = [
  // Deterministic Mode Tests
  {
    name: 'Deterministic: Simulation Journey → meta-philosophy',
    message: 'Tell me anything',
    journeyId: 'simulation',
    expected: { mode: 'deterministic', hubId: 'meta-philosophy' }
  },
  {
    name: 'Deterministic: Stakes Journey → infrastructure-bet',
    message: 'Random message',
    journeyId: 'stakes',
    expected: { mode: 'deterministic', hubId: 'infrastructure-bet' }
  },
  {
    name: 'Deterministic: Ratchet Journey → ratchet-effect (draft hub)',
    message: 'Anything',
    journeyId: 'ratchet',
    expected: { mode: 'deterministic', hubId: 'ratchet-effect' }
  },

  // Discovery Mode Tests
  {
    name: 'Discovery: "simulation" tag → meta-philosophy',
    message: 'What is this simulation?',
    journeyId: null,
    expected: { mode: 'discovery', hubId: 'meta-philosophy' }
  },
  {
    name: 'Discovery: "$380 billion" tag → infrastructure-bet',
    message: 'Tell me about the $380 billion bet',
    journeyId: null,
    expected: { mode: 'discovery', hubId: 'infrastructure-bet' }
  },
  {
    name: 'Discovery: "ownership" tag → infrastructure-bet',
    message: 'Why is ownership important?',
    journeyId: null,
    expected: { mode: 'discovery', hubId: 'infrastructure-bet' }
  },
  {
    name: 'Discovery: "ratchet" tag → none (hub is draft)',
    message: 'Explain the ratchet effect',
    journeyId: null,
    expected: { mode: 'none', hubId: null } // ratchet-effect is draft, shouldn't match
  },
  {
    name: 'Discovery: No matching tags → none',
    message: 'What is the weather today?',
    journeyId: null,
    expected: { mode: 'none', hubId: null }
  },

  // Edge Cases
  {
    name: 'Edge: Empty message with journey → deterministic',
    message: '',
    journeyId: 'simulation',
    expected: { mode: 'deterministic', hubId: 'meta-philosophy' }
  },
  {
    name: 'Edge: Non-existent journey → none',
    message: 'Hello',
    journeyId: 'non-existent-journey',
    expected: { mode: 'none', hubId: null }
  },
];

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== RAG Routing Logic Tests ===\n');
  console.log(`Registry: ${REGISTRY_PATH}\n`);

  // Load registry
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error(`ERROR: Registry not found at ${REGISTRY_PATH}`);
    process.exit(1);
  }

  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));

  // Show registry summary
  console.log('--- Registry Summary ---');
  console.log(`Hubs: ${Object.keys(registry.hubs || {}).length}`);
  console.log(`  Active: ${Object.values(registry.hubs || {}).filter((h: any) => h.status === 'active').length}`);
  console.log(`  Draft: ${Object.values(registry.hubs || {}).filter((h: any) => h.status === 'draft').length}`);
  console.log(`Journeys: ${Object.keys(registry.journeys || {}).length}`);
  console.log(`  Active: ${Object.values(registry.journeys || {}).filter((j: any) => j.status === 'active').length}`);
  console.log(`  Draft: ${Object.values(registry.journeys || {}).filter((j: any) => j.status === 'draft').length}`);
  console.log('');

  // Run tests
  let passed = 0;
  let failed = 0;

  console.log('--- Test Results ---\n');

  for (const testCase of testCases) {
    const result = simulateFetchRagContext(
      testCase.message,
      registry,
      testCase.journeyId
    );

    const modeMatch = result.mode === testCase.expected.mode;
    const hubMatch = result.targetHubId === testCase.expected.hubId;
    const success = modeMatch && hubMatch;

    const icon = success ? '✓' : '✗';
    console.log(`${icon} ${testCase.name}`);
    console.log(`      Input: message="${testCase.message.slice(0, 40)}...", journeyId=${testCase.journeyId}`);
    console.log(`      Expected: mode=${testCase.expected.mode}, hub=${testCase.expected.hubId}`);
    console.log(`      Actual:   mode=${result.mode}, hub=${result.targetHubId}`);
    console.log(`      Reason: ${result.reason}`);
    console.log('');

    if (success) passed++;
    else failed++;
  }

  // Summary
  console.log('=== Summary ===');
  console.log(`Passed: ${passed}/${testCases.length}`);
  console.log(`Failed: ${failed}/${testCases.length}`);

  if (failed > 0) {
    console.log('\n⚠️  Some routing tests failed.');
    process.exit(1);
  } else {
    console.log('\n✅ All routing tests passed!');
  }
}

main().catch(console.error);
