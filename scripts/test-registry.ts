#!/usr/bin/env npx ts-node
/**
 * test-registry.ts
 *
 * Local validation tests for the V2.1 Unified Registry Model.
 * Tests schema integrity, journey-hub linkage, and RAG routing logic.
 *
 * Usage:
 *   npx ts-node scripts/test-registry.ts
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
// TYPES
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

function test_schemaVersion(registry: any): TestResult {
  const passed = registry.version === '2.1';
  return {
    name: 'Schema Version',
    passed,
    message: passed
      ? `Version is 2.1`
      : `Expected version 2.1, got ${registry.version}`
  };
}

function test_hubsExist(registry: any): TestResult {
  const hubCount = Object.keys(registry.hubs || {}).length;
  const passed = hubCount > 0;
  return {
    name: 'Hubs Exist',
    passed,
    message: passed
      ? `Found ${hubCount} hubs`
      : `No hubs found in registry`
  };
}

function test_journeysExist(registry: any): TestResult {
  const journeyCount = Object.keys(registry.journeys || {}).length;
  const passed = journeyCount > 0;
  return {
    name: 'Journeys Exist',
    passed,
    message: passed
      ? `Found ${journeyCount} journeys`
      : `No journeys found in registry`
  };
}

function test_hubStatusField(registry: any): TestResult {
  const hubs = Object.values(registry.hubs || {}) as any[];
  const withStatus = hubs.filter(h => h.status);
  const validStatuses = hubs.filter(h =>
    ['active', 'draft', 'archived'].includes(h.status)
  );

  const passed = withStatus.length === hubs.length && validStatuses.length === hubs.length;
  return {
    name: 'Hub Status Fields',
    passed,
    message: passed
      ? `All ${hubs.length} hubs have valid status fields`
      : `${hubs.length - withStatus.length} hubs missing status, ${withStatus.length - validStatuses.length} have invalid status`
  };
}

function test_journeyStatusField(registry: any): TestResult {
  const journeys = Object.values(registry.journeys || {}) as any[];
  const withStatus = journeys.filter(j => j.status);
  const validStatuses = journeys.filter(j =>
    ['active', 'draft'].includes(j.status)
  );

  const passed = withStatus.length === journeys.length && validStatuses.length === journeys.length;
  return {
    name: 'Journey Status Fields',
    passed,
    message: passed
      ? `All ${journeys.length} journeys have valid status fields`
      : `${journeys.length - withStatus.length} journeys missing status`
  };
}

function test_journeyHubLinkage(registry: any): TestResult {
  const journeys = Object.entries(registry.journeys || {}) as [string, any][];
  const hubs = registry.hubs || {};
  const errors: string[] = [];

  for (const [journeyId, journey] of journeys) {
    if (journey.linkedHubId) {
      if (!hubs[journey.linkedHubId]) {
        errors.push(`Journey "${journeyId}" links to missing hub "${journey.linkedHubId}"`);
      }
    }
  }

  const passed = errors.length === 0;
  return {
    name: 'Journey-Hub Linkage',
    passed,
    message: passed
      ? `All journey linkedHubId references are valid`
      : errors.join('; ')
  };
}

function test_activeHubsOnly(registry: any): TestResult {
  const hubs = Object.entries(registry.hubs || {}) as [string, any][];
  const activeHubs = hubs.filter(([_, h]) => h.status === 'active');
  const draftHubs = hubs.filter(([_, h]) => h.status === 'draft');

  return {
    name: 'Hub Status Distribution',
    passed: true, // Informational
    message: `Active: ${activeHubs.length}, Draft: ${draftHubs.length} (${activeHubs.map(([id]) => id).join(', ')})`
  };
}

function test_activeJourneysOnly(registry: any): TestResult {
  const journeys = Object.entries(registry.journeys || {}) as [string, any][];
  const activeJourneys = journeys.filter(([_, j]) => j.status === 'active');
  const draftJourneys = journeys.filter(([_, j]) => j.status === 'draft');

  return {
    name: 'Journey Status Distribution',
    passed: true, // Informational
    message: `Active: ${activeJourneys.length}, Draft: ${draftJourneys.length} (${activeJourneys.map(([id]) => id).join(', ')})`
  };
}

function test_deterministicModeLogic(registry: any): TestResult {
  // Simulate: If I select journey "simulation", what hub should load?
  const journeys = registry.journeys || {};
  const hubs = registry.hubs || {};

  const testCases = [
    { journeyId: 'simulation', expectedHubId: 'meta-philosophy' },
    { journeyId: 'stakes', expectedHubId: 'infrastructure-bet' },
    { journeyId: 'ratchet', expectedHubId: 'ratchet-effect' },
  ];

  const results: string[] = [];

  for (const { journeyId, expectedHubId } of testCases) {
    const journey = journeys[journeyId];
    if (!journey) {
      results.push(`✗ Journey "${journeyId}" not found`);
      continue;
    }

    const actualHubId = journey.linkedHubId;
    if (actualHubId === expectedHubId) {
      results.push(`✓ "${journeyId}" → "${actualHubId}"`);
    } else {
      results.push(`✗ "${journeyId}" → "${actualHubId}" (expected "${expectedHubId}")`);
    }
  }

  const passed = !results.some(r => r.startsWith('✗'));
  return {
    name: 'Deterministic Mode Logic',
    passed,
    message: results.join(', ')
  };
}

function test_discoveryModeLogic(registry: any): TestResult {
  // Simulate: routeQueryToHub with tag matching
  const hubs = Object.entries(registry.hubs || {}) as [string, any][];

  const testCases = [
    { query: 'Tell me about the simulation', expectedHub: 'meta-philosophy' },
    { query: '$380 billion infrastructure bet', expectedHub: 'infrastructure-bet' },
    { query: 'How does the ratchet effect work?', expectedHub: 'ratchet-effect' },
    { query: 'What is the diary system?', expectedHub: 'diary-system' },
  ];

  const results: string[] = [];

  for (const { query, expectedHub } of testCases) {
    const queryLower = query.toLowerCase();
    let bestMatch: { hubId: string; score: number } | null = null;

    for (const [hubId, hub] of hubs) {
      if (hub.status !== 'active') continue; // Skip draft hubs in discovery mode

      let score = 0;
      for (const tag of hub.tags || []) {
        if (queryLower.includes(tag.toLowerCase())) {
          score += tag.split(' ').length * 2;
        }
      }

      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { hubId, score };
      }
    }

    const actualHub = bestMatch?.hubId || '(none)';
    const isExpectedActive = hubs.find(([id]) => id === expectedHub)?.[1]?.status === 'active';

    if (actualHub === expectedHub) {
      results.push(`✓ "${query.slice(0, 30)}..." → "${actualHub}"`);
    } else if (!isExpectedActive) {
      results.push(`○ "${query.slice(0, 30)}..." → "${actualHub}" (expected "${expectedHub}" is draft)`);
    } else {
      results.push(`✗ "${query.slice(0, 30)}..." → "${actualHub}" (expected "${expectedHub}")`);
    }
  }

  const failed = results.filter(r => r.startsWith('✗')).length;
  return {
    name: 'Discovery Mode Logic',
    passed: failed === 0,
    message: results.join('\n      ')
  };
}

function test_nodeJourneyReferences(registry: any): TestResult {
  const nodes = Object.entries(registry.nodes || {}) as [string, any][];
  const journeys = registry.journeys || {};
  const errors: string[] = [];

  for (const [nodeId, node] of nodes) {
    if (node.journeyId && !journeys[node.journeyId]) {
      errors.push(`Node "${nodeId}" references missing journey "${node.journeyId}"`);
    }
  }

  const passed = errors.length === 0;
  return {
    name: 'Node-Journey References',
    passed,
    message: passed
      ? `All ${nodes.length} nodes have valid journey references`
      : errors.join('; ')
  };
}

function test_entryNodeExists(registry: any): TestResult {
  const journeys = Object.entries(registry.journeys || {}) as [string, any][];
  const nodes = registry.nodes || {};
  const errors: string[] = [];

  for (const [journeyId, journey] of journeys) {
    if (journey.entryNode && !nodes[journey.entryNode]) {
      errors.push(`Journey "${journeyId}" entry node "${journey.entryNode}" not found`);
    }
  }

  const passed = errors.length === 0;
  return {
    name: 'Entry Nodes Exist',
    passed,
    message: passed
      ? `All journey entry nodes exist in nodes registry`
      : errors.join('; ')
  };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== V2.1 Registry Validation Tests ===\n');
  console.log(`Registry: ${REGISTRY_PATH}\n`);

  // Load registry
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error(`ERROR: Registry not found at ${REGISTRY_PATH}`);
    process.exit(1);
  }

  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));

  // Run tests
  const tests: TestResult[] = [
    test_schemaVersion(registry),
    test_hubsExist(registry),
    test_journeysExist(registry),
    test_hubStatusField(registry),
    test_journeyStatusField(registry),
    test_activeHubsOnly(registry),
    test_activeJourneysOnly(registry),
    test_journeyHubLinkage(registry),
    test_deterministicModeLogic(registry),
    test_discoveryModeLogic(registry),
    test_nodeJourneyReferences(registry),
    test_entryNodeExists(registry),
  ];

  // Output results
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const icon = test.passed ? '✓' : '✗';
    console.log(`${icon} ${test.name}`);
    console.log(`      ${test.message}\n`);

    if (test.passed) passed++;
    else failed++;
  }

  // Summary
  console.log('=== Summary ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Please fix before Sprint 2.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Ready for Sprint 2.');
  }
}

main().catch(console.error);
