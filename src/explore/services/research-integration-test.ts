// src/explore/services/research-integration-test.ts
// Integration Test - Full sprout lifecycle test
// Sprint: sprout-research-v1, Phase 5f
//
// This module provides integration test utilities for the Research Sprout
// system. It tests the complete lifecycle:
//
//   sprout: command → prompt architect → create sprout → queue consumer
//   → research agent → results processor → completed sprout
//
// Usage:
//   import { runIntegrationTest } from './research-integration-test';
//   const result = await runIntegrationTest();
//   console.log(result.success ? 'PASSED' : 'FAILED', result);

import type {
  ResearchSprout,
  CreateResearchSproutInput,
  GroveConfigSnapshot,
} from '@core/schema/research-sprout';
import type { ResearchBranch, ResearchStrategy, Evidence } from '@core/schema/research-strategy';
import { createResearchSprout } from '@core/schema/research-sprout';
import { createResearchAgent, type ResearchProgressEvent } from './research-agent';
import { processResults, type ProcessedResults } from './research-results-processor';
import { createQueueConsumer, type QueueConsumer } from './research-queue-consumer';

// =============================================================================
// Types
// =============================================================================

/**
 * Test step result
 */
export interface TestStepResult {
  step: string;
  passed: boolean;
  message: string;
  duration: number;
  data?: unknown;
}

/**
 * Integration test result
 */
export interface IntegrationTestResult {
  /** Overall success */
  success: boolean;

  /** Individual step results */
  steps: TestStepResult[];

  /** Total duration in ms */
  totalDuration: number;

  /** Final sprout state (if created) */
  finalSprout?: ResearchSprout;

  /** Progress events captured */
  progressEvents: ResearchProgressEvent[];

  /** Error message if failed */
  error?: string;
}

/**
 * Test configuration
 */
export interface IntegrationTestConfig {
  /** Test spark (research question) */
  spark?: string;

  /** Simulated grove ID */
  groveId?: string;

  /** Simulated session ID */
  sessionId?: string;

  /** Whether to log progress to console */
  verbose?: boolean;
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_CONFIG: Required<IntegrationTestConfig> = {
  spark: 'What causes the ratchet effect in AI infrastructure spending?',
  groveId: 'test-grove-001',
  sessionId: 'test-session-001',
  verbose: true,
};

// =============================================================================
// Mock Storage
// =============================================================================

/**
 * In-memory storage for test sprouts
 */
class MockSproutStorage {
  private sprouts: Map<string, ResearchSprout> = new Map();
  private idCounter = 0;

  create(input: CreateResearchSproutInput): ResearchSprout {
    const sproutData = createResearchSprout(input);
    const id = `test-sprout-${++this.idCounter}`;
    const sprout: ResearchSprout = { ...sproutData, id };
    this.sprouts.set(id, sprout);
    return sprout;
  }

  get(id: string): ResearchSprout | undefined {
    return this.sprouts.get(id);
  }

  update(id: string, updates: Partial<ResearchSprout>): ResearchSprout {
    const sprout = this.sprouts.get(id);
    if (!sprout) throw new Error(`Sprout not found: ${id}`);
    const updated = { ...sprout, ...updates, updatedAt: new Date().toISOString() };
    this.sprouts.set(id, updated);
    return updated;
  }

  queryPending(): ResearchSprout[] {
    return Array.from(this.sprouts.values()).filter(s => s.status === 'pending');
  }

  transitionStatus(
    id: string,
    newStatus: ResearchSprout['status'],
    reason: string,
    _actor?: string
  ): ResearchSprout {
    const sprout = this.sprouts.get(id);
    if (!sprout) throw new Error(`Sprout not found: ${id}`);
    const updated: ResearchSprout = {
      ...sprout,
      status: newStatus,
      statusHistory: [
        ...sprout.statusHistory,
        {
          from: sprout.status,
          to: newStatus,
          reason,
          transitionedAt: new Date().toISOString(),
          actor: _actor || 'system',
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    this.sprouts.set(id, updated);
    return updated;
  }

  clear(): void {
    this.sprouts.clear();
    this.idCounter = 0;
  }
}

// =============================================================================
// Test Runner
// =============================================================================

/**
 * Run the full integration test
 */
export async function runIntegrationTest(
  config: IntegrationTestConfig = {}
): Promise<IntegrationTestResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const steps: TestStepResult[] = [];
  const progressEvents: ResearchProgressEvent[] = [];
  const startTime = Date.now();

  // Initialize mock storage
  const storage = new MockSproutStorage();
  let currentSprout: ResearchSprout | undefined;
  let processedResult: ProcessedResults | undefined;

  const log = (message: string) => {
    if (cfg.verbose) console.log(`[IntegrationTest] ${message}`);
  };

  const addStep = (step: string, passed: boolean, message: string, startMs: number, data?: unknown) => {
    const result: TestStepResult = {
      step,
      passed,
      message,
      duration: Date.now() - startMs,
      data,
    };
    steps.push(result);
    log(`${passed ? '✓' : '✗'} ${step}: ${message} (${result.duration}ms)`);
    return passed;
  };

  try {
    // ─────────────────────────────────────────────────────────────
    // Step 1: Create sprout from spark
    // ─────────────────────────────────────────────────────────────
    let stepStart = Date.now();

    const groveConfigSnapshot: GroveConfigSnapshot = {
      configVersionId: 'test-config-v1',
      hypothesisGoals: ['Understand AI infrastructure economics'],
      corpusBoundaries: ['The Grove white paper'],
      confirmationMode: 'on-ambiguity',
    };

    const strategy: ResearchStrategy = {
      depth: 'medium',
      sourceTypes: ['academic', 'practitioner'],
      balanceMode: 'balanced',
    };

    const branches: ResearchBranch[] = [
      {
        id: 'branch-1',
        label: 'Economic Drivers',
        queries: ['What economic factors drive the ratchet effect?'],
        priority: 'primary',
        status: 'pending',
      },
      {
        id: 'branch-2',
        label: 'Historical Precedent',
        queries: ['Are there historical parallels to AI infrastructure spending patterns?'],
        priority: 'secondary',
        status: 'pending',
      },
    ];

    const input: CreateResearchSproutInput = {
      spark: cfg.spark,
      groveId: cfg.groveId,
      strategy,
      branches,
      appliedRuleIds: ['test-rule-1'],
      inferenceConfidence: 0.85,
      groveConfigSnapshot,
      sessionId: cfg.sessionId,
      tags: ['test', 'integration'],
    };

    currentSprout = storage.create(input);

    if (!currentSprout || currentSprout.status !== 'pending') {
      addStep('1. Create Sprout', false, 'Failed to create sprout in pending status', stepStart);
      throw new Error('Sprout creation failed');
    }

    addStep(
      '1. Create Sprout',
      true,
      `Created sprout ${currentSprout.id} with ${branches.length} branches`,
      stepStart,
      { id: currentSprout.id, status: currentSprout.status }
    );

    // ─────────────────────────────────────────────────────────────
    // Step 2: Queue consumer claims sprout
    // ─────────────────────────────────────────────────────────────
    stepStart = Date.now();

    let claimedSprout: ResearchSprout | undefined;

    const consumer = createQueueConsumer(
      () => storage.queryPending(),
      async (id, status, reason, actor) => storage.transitionStatus(id, status, reason, actor),
      async (sprout) => {
        claimedSprout = sprout;
        return true; // Accept claim
      },
      { pollInterval: 100, maxConcurrent: 1 }
    );

    // Start consumer and wait for claim
    consumer.start();
    await new Promise(resolve => setTimeout(resolve, 200));
    consumer.stop();

    if (!claimedSprout) {
      addStep('2. Queue Consumer', false, 'Failed to claim pending sprout', stepStart);
      throw new Error('Queue consumer did not claim sprout');
    }

    const afterClaim = storage.get(currentSprout.id);
    if (afterClaim?.status !== 'active') {
      addStep('2. Queue Consumer', false, `Sprout not transitioned to active (status: ${afterClaim?.status})`, stepStart);
      throw new Error('Status transition failed');
    }

    addStep(
      '2. Queue Consumer',
      true,
      `Claimed sprout and transitioned to active`,
      stepStart,
      { claimedId: claimedSprout.id, newStatus: afterClaim.status }
    );

    // ─────────────────────────────────────────────────────────────
    // Step 3: Research Agent executes branches
    // ─────────────────────────────────────────────────────────────
    stepStart = Date.now();

    const agent = createResearchAgent({
      simulationMode: true,
      simulatedQueryDelay: 100,
      branchDelay: 50,
    });

    const executionResult = await agent.execute(afterClaim, (event) => {
      progressEvents.push(event);
    });

    if (!executionResult.success) {
      addStep('3. Research Agent', false, `Execution failed: ${executionResult.execution.errorMessage}`, stepStart);
      throw new Error('Research execution failed');
    }

    const completedBranches = executionResult.branches.filter(b => b.status === 'complete').length;
    const totalEvidence = executionResult.evidence.length;

    addStep(
      '3. Research Agent',
      true,
      `Completed ${completedBranches} branches, collected ${totalEvidence} evidence items`,
      stepStart,
      {
        branches: completedBranches,
        evidence: totalEvidence,
        apiCalls: executionResult.execution.apiCallCount,
        tokens: executionResult.execution.tokenCount,
      }
    );

    // ─────────────────────────────────────────────────────────────
    // Step 4: Results processor populates sprout
    // ─────────────────────────────────────────────────────────────
    stepStart = Date.now();

    processedResult = await processResults(
      afterClaim,
      executionResult,
      async (id, updates) => storage.update(id, updates),
      async (id, status, reason, actor) => storage.transitionStatus(id, status, reason, actor)
    );

    if (!processedResult.success) {
      addStep('4. Results Processor', false, 'Failed to process results', stepStart);
      throw new Error('Results processing failed');
    }

    const finalStatus = processedResult.status;
    const hasInsights = processedResult.synthesis.insights.length > 0;

    addStep(
      '4. Results Processor',
      true,
      `Status: ${finalStatus}, Confidence: ${(processedResult.synthesis.confidence * 100).toFixed(0)}%, Insights: ${processedResult.synthesis.insights.length}`,
      stepStart,
      {
        status: finalStatus,
        confidence: processedResult.synthesis.confidence,
        requiresReview: processedResult.synthesis.requiresReview,
        insights: processedResult.synthesis.insights.length,
      }
    );

    // ─────────────────────────────────────────────────────────────
    // Step 5: Verify final state
    // ─────────────────────────────────────────────────────────────
    stepStart = Date.now();

    const finalSprout = storage.get(currentSprout.id);

    const checks = [
      { name: 'Status is completed', passed: finalSprout?.status === 'completed' },
      { name: 'Has evidence', passed: (finalSprout?.evidence?.length ?? 0) > 0 },
      { name: 'Has synthesis', passed: !!finalSprout?.synthesis?.summary },
      { name: 'Has execution metadata', passed: !!finalSprout?.execution?.completedAt },
      { name: 'Branches are complete', passed: finalSprout?.branches?.every(b => b.status === 'complete') ?? false },
    ];

    const allChecks = checks.every(c => c.passed);
    const failedChecks = checks.filter(c => !c.passed).map(c => c.name);

    addStep(
      '5. Final State',
      allChecks,
      allChecks
        ? `All ${checks.length} verification checks passed`
        : `Failed: ${failedChecks.join(', ')}`,
      stepStart,
      { checks }
    );

    // ─────────────────────────────────────────────────────────────
    // Return results
    // ─────────────────────────────────────────────────────────────
    const allPassed = steps.every(s => s.passed);

    log(`\n${'='.repeat(50)}`);
    log(`Integration Test ${allPassed ? 'PASSED' : 'FAILED'}`);
    log(`Total duration: ${Date.now() - startTime}ms`);
    log(`Steps: ${steps.filter(s => s.passed).length}/${steps.length} passed`);
    log(`${'='.repeat(50)}\n`);

    return {
      success: allPassed,
      steps,
      totalDuration: Date.now() - startTime,
      finalSprout,
      progressEvents,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`\n✗ Test failed with error: ${errorMessage}\n`);

    return {
      success: false,
      steps,
      totalDuration: Date.now() - startTime,
      finalSprout: currentSprout,
      progressEvents,
      error: errorMessage,
    };
  }
}

// =============================================================================
// Console Runner (for manual testing)
// =============================================================================

/**
 * Run integration test from browser console
 *
 * Usage in browser console:
 *   import('/src/explore/services/research-integration-test.ts').then(m => m.runFromConsole())
 */
export async function runFromConsole(): Promise<void> {
  console.log('\n🧪 Starting Integration Test...\n');
  const result = await runIntegrationTest({ verbose: true });

  console.log('\n📊 Results:');
  console.table(result.steps.map(s => ({
    Step: s.step,
    Passed: s.passed ? '✓' : '✗',
    Message: s.message,
    Duration: `${s.duration}ms`,
  })));

  if (result.finalSprout) {
    console.log('\n📝 Final Sprout:');
    console.log(JSON.stringify(result.finalSprout, null, 2));
  }

  console.log(`\n${result.success ? '✅ ALL TESTS PASSED' : '❌ TESTS FAILED'}`);
}

// =============================================================================
// Exports
// =============================================================================

export type {
  TestStepResult,
  IntegrationTestResult,
  IntegrationTestConfig,
};
