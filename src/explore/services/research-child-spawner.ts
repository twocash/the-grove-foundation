// src/explore/services/research-child-spawner.ts
// Child Spawner - Creates child sprouts from research discoveries
// Sprint: sprout-research-v1, Phase 5d
//
// During research execution, the agent may discover new questions
// worth investigating. This service spawns child sprouts to pursue
// those investigations while maintaining the parent-child tree.
//
// Key constraints:
// - Maximum spawn depth (default: 2)
// - Maximum children per parent (default: 5)
// - Children inherit grove config snapshot from parent

import type {
  ResearchSprout,
  CreateResearchSproutInput,
  GroveConfigSnapshot,
} from '@core/schema/research-sprout';
import type { ResearchBranch, ResearchStrategy } from '@core/schema/research-strategy';
import { DEFAULT_MAX_SPAWN_DEPTH, DEFAULT_MAX_BRANCHES } from '@core/schema/research-sprout';

// =============================================================================
// Types
// =============================================================================

/**
 * A candidate for spawning a child sprout
 */
export interface SpawnCandidate {
  /** The spark (research question) for the child */
  spark: string;

  /** Why this child should be spawned */
  rationale: string;

  /** Suggested branches for the child */
  suggestedBranches?: Partial<ResearchBranch>[];

  /** Priority (higher = more important) */
  priority: number;
}

/**
 * Configuration for child spawning
 */
export interface ChildSpawnerConfig {
  /** Maximum spawn depth (default: 2) */
  maxSpawnDepth?: number;

  /** Maximum children per sprout (default: 5) */
  maxChildrenPerSprout?: number;

  /** Whether to auto-spawn children (default: false for MVP) */
  autoSpawn?: boolean;

  /** Agent ID for spawned children (default: 'child-spawner') */
  agentId?: string;
}

/**
 * Spawn result
 */
export interface SpawnResult {
  /** Whether spawn was successful */
  success: boolean;

  /** The spawned child sprout (if successful) */
  child?: ResearchSprout;

  /** Error message (if failed) */
  error?: string;

  /** Reason for rejection (if at limit) */
  rejectionReason?: string;
}

/**
 * Callback to create a sprout in context
 */
export type CreateSproutFn = (
  input: CreateResearchSproutInput
) => Promise<ResearchSprout>;

/**
 * Callback to update parent with child ID
 */
export type UpdateParentFn = (
  parentId: string,
  childId: string
) => Promise<void>;

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_CONFIG: Required<ChildSpawnerConfig> = {
  maxSpawnDepth: DEFAULT_MAX_SPAWN_DEPTH,
  maxChildrenPerSprout: DEFAULT_MAX_BRANCHES,
  autoSpawn: false,
  agentId: 'child-spawner',
};

// =============================================================================
// Validation
// =============================================================================

/**
 * Check if a sprout can spawn children
 */
export function canSpawnChildren(
  sprout: ResearchSprout,
  config: ChildSpawnerConfig = {}
): { allowed: boolean; reason?: string } {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Check spawn depth
  if (sprout.spawnDepth >= cfg.maxSpawnDepth) {
    return {
      allowed: false,
      reason: `Maximum spawn depth (${cfg.maxSpawnDepth}) reached`,
    };
  }

  // Check children count
  if (sprout.childSproutIds.length >= cfg.maxChildrenPerSprout) {
    return {
      allowed: false,
      reason: `Maximum children (${cfg.maxChildrenPerSprout}) reached`,
    };
  }

  // Check status (only active sprouts can spawn)
  if (sprout.status !== 'active') {
    return {
      allowed: false,
      reason: `Sprout must be active to spawn children (current: ${sprout.status})`,
    };
  }

  return { allowed: true };
}

/**
 * Get remaining spawn capacity
 */
export function getRemainingSpawnCapacity(
  sprout: ResearchSprout,
  config: ChildSpawnerConfig = {}
): number {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (sprout.spawnDepth >= cfg.maxSpawnDepth) {
    return 0;
  }

  return Math.max(0, cfg.maxChildrenPerSprout - sprout.childSproutIds.length);
}

// =============================================================================
// Child Creation
// =============================================================================

/**
 * Create input for a child sprout
 */
export function createChildInput(
  parent: ResearchSprout,
  candidate: SpawnCandidate,
  sessionId: string
): CreateResearchSproutInput {
  // Child inherits grove config snapshot from parent
  const groveConfigSnapshot: GroveConfigSnapshot = {
    ...parent.groveConfigSnapshot,
    // Could extend with spawn-specific modifications
  };

  // Generate default branches if not provided
  const branches: ResearchBranch[] = candidate.suggestedBranches?.map((b, i) => ({
    id: `branch-${i}`,
    label: b.label || `Branch ${i + 1}`,
    queries: b.queries || [candidate.spark],
    priority: b.priority || 'secondary',
    status: 'pending' as const,
  })) || [{
    id: 'branch-0',
    label: 'Primary Investigation',
    queries: [candidate.spark],
    priority: 'primary' as const,
    status: 'pending' as const,
  }];

  // Child inherits strategy from parent
  const strategy: ResearchStrategy = { ...parent.strategy };

  return {
    spark: candidate.spark,
    groveId: parent.groveId,
    parentSproutId: parent.id,
    strategy,
    branches,
    appliedRuleIds: [...parent.appliedRuleIds, `spawn:${parent.id}`],
    inferenceConfidence: parent.inferenceConfidence * 0.9, // Slight degradation
    groveConfigSnapshot,
    sessionId,
    tags: [...parent.tags, 'spawned'],
    notes: `Spawned from: ${parent.title}\nRationale: ${candidate.rationale}`,
  };
}

/**
 * Spawn a single child sprout
 */
export async function spawnChild(
  parent: ResearchSprout,
  candidate: SpawnCandidate,
  createSprout: CreateSproutFn,
  updateParent: UpdateParentFn,
  sessionId: string,
  config: ChildSpawnerConfig = {}
): Promise<SpawnResult> {
  // Validate spawn allowed
  const canSpawn = canSpawnChildren(parent, config);
  if (!canSpawn.allowed) {
    return {
      success: false,
      rejectionReason: canSpawn.reason,
    };
  }

  try {
    // Create child input
    const input = createChildInput(parent, candidate, sessionId);

    // Create the child sprout
    const child = await createSprout(input);

    // Update parent with child reference
    await updateParent(parent.id, child.id);

    return {
      success: true,
      child,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Spawn multiple children (respecting limits)
 */
export async function spawnChildren(
  parent: ResearchSprout,
  candidates: SpawnCandidate[],
  createSprout: CreateSproutFn,
  updateParent: UpdateParentFn,
  sessionId: string,
  config: ChildSpawnerConfig = {}
): Promise<SpawnResult[]> {
  const results: SpawnResult[] = [];

  // Sort by priority (highest first)
  const sorted = [...candidates].sort((a, b) => b.priority - a.priority);

  // Get remaining capacity
  let remaining = getRemainingSpawnCapacity(parent, config);

  for (const candidate of sorted) {
    if (remaining <= 0) {
      results.push({
        success: false,
        rejectionReason: 'Spawn capacity exhausted',
      });
      continue;
    }

    const result = await spawnChild(
      parent,
      candidate,
      createSprout,
      updateParent,
      sessionId,
      config
    );

    results.push(result);

    if (result.success) {
      remaining--;
      // Update parent reference for subsequent spawns
      parent = {
        ...parent,
        childSproutIds: [...parent.childSproutIds, result.child!.id],
      };
    }
  }

  return results;
}

// =============================================================================
// Candidate Extraction (Placeholder for LLM-based extraction)
// =============================================================================

/**
 * Extract spawn candidates from research evidence
 * In production, this would use an LLM to identify new questions
 */
export function extractSpawnCandidates(
  sprout: ResearchSprout,
  _maxCandidates: number = 3
): SpawnCandidate[] {
  // For MVP, generate placeholder candidates based on branches
  // In production, an LLM would analyze evidence to find new questions

  const candidates: SpawnCandidate[] = [];

  for (const branch of sprout.branches) {
    if (branch.evidence && branch.evidence.length > 0) {
      // Generate a follow-up question candidate
      candidates.push({
        spark: `[Follow-up] Further investigation of ${branch.label}`,
        rationale: `Branch "${branch.label}" yielded ${branch.evidence.length} evidence items. ` +
          `A deeper investigation may reveal additional insights.`,
        priority: branch.priority === 'primary' ? 2 : 1,
        suggestedBranches: [{
          label: `Deep dive: ${branch.label}`,
          queries: branch.queries.map(q => `Expand on: ${q}`),
          priority: 'primary',
        }],
      });
    }
  }

  // Sort by priority and limit
  return candidates
    .sort((a, b) => b.priority - a.priority)
    .slice(0, _maxCandidates);
}

// =============================================================================
// Tree Utilities
// =============================================================================

/**
 * Calculate the spawn depth of a sprout
 * (Used when creating from Supabase where depth might need recalculation)
 */
export function calculateSpawnDepth(
  sproutId: string,
  getSprout: (id: string) => ResearchSprout | undefined,
  maxDepth: number = 10
): number {
  let depth = 0;
  let currentId: string | null = sproutId;

  while (currentId && depth < maxDepth) {
    const sprout = getSprout(currentId);
    if (!sprout || !sprout.parentSproutId) {
      break;
    }
    currentId = sprout.parentSproutId;
    depth++;
  }

  return depth;
}

/**
 * Get all ancestors of a sprout
 */
export function getAncestors(
  sproutId: string,
  getSprout: (id: string) => ResearchSprout | undefined,
  maxDepth: number = 10
): ResearchSprout[] {
  const ancestors: ResearchSprout[] = [];
  let currentId: string | null = sproutId;

  while (currentId && ancestors.length < maxDepth) {
    const sprout = getSprout(currentId);
    if (!sprout || !sprout.parentSproutId) {
      break;
    }
    const parent = getSprout(sprout.parentSproutId);
    if (parent) {
      ancestors.push(parent);
      currentId = sprout.parentSproutId;
    } else {
      break;
    }
  }

  return ancestors;
}

/**
 * Get all descendants of a sprout
 */
export function getDescendants(
  sproutId: string,
  getSprout: (id: string) => ResearchSprout | undefined,
  maxDepth: number = 10
): ResearchSprout[] {
  const descendants: ResearchSprout[] = [];
  const queue: Array<{ id: string; depth: number }> = [{ id: sproutId, depth: 0 }];

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (depth >= maxDepth) continue;

    const sprout = getSprout(id);
    if (!sprout) continue;

    for (const childId of sprout.childSproutIds) {
      const child = getSprout(childId);
      if (child) {
        descendants.push(child);
        queue.push({ id: childId, depth: depth + 1 });
      }
    }
  }

  return descendants;
}

// =============================================================================
// Exports
// =============================================================================

export type {
  SpawnCandidate,
  ChildSpawnerConfig,
  SpawnResult,
  CreateSproutFn,
  UpdateParentFn,
};
