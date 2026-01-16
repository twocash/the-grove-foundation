// src/core/federation/provenance.ts
// Cross-sprint provenance tracking
// Sprint: EPIC5-SL-Federation v1

import { EventEmitter } from '@core/utils/event-emitter';
import type { GroveObject } from '@core/schema/grove-object';
import {
  FederatedProvenance,
  ProvenanceChain,
  ProvenanceNode,
  ProvenanceOrigin,
  ProvenanceTransformation,
  VerificationResult,
  FederatedGroveObject,
  FederationEvent,
  FederationEventType,
  DEFAULT_FEDERATION_CONFIG,
} from './schema';

export interface AttachOptions {
  operation?: string;
  metadata?: Record<string, unknown>;
}

export interface TraceOptions {
  maxDepth?: number;
  includeMetadata?: boolean;
  verify?: boolean;
}

export interface VerifyOptions {
  strict?: boolean;
  checkSignatures?: boolean;
}

/**
 * Provenance Bridge
 *
 * Tracks the movement and transformation of GroveObjects
 * across sprint boundaries in the federation.
 */
export class ProvenanceBridge extends EventEmitter {
  private provenanceStore: Map<string, FederatedProvenance> = new Map();
  private config = DEFAULT_FEDERATION_CONFIG;

  constructor(config = DEFAULT_FEDERATION_CONFIG) {
    super();
    this.config = config;
  }

  /**
   * Attach federation metadata to a GroveObject
   */
  attachMetadata<T>(
    object: GroveObject<T>,
    federationId: string,
    options: AttachOptions = {}
  ): FederatedGroveObject<T> {
    const federated = object as FederatedGroveObject<T>;

    // Ensure meta.federationId is set
    if (!federated.meta.federationId) {
      federated.meta.federationId = federationId;
    }

    // Initialize or extend federation path
    if (!federated.meta.federationPath) {
      federated.meta.federationPath = [];
    }

    // Add to path if not already present
    if (!federated.meta.federationPath.includes(federationId)) {
      federated.meta.federationPath.push(federationId);
    }

    // Limit path length
    if (federated.meta.federationPath.length > this.config.provenance.maxChainLength) {
      federated.meta.federationPath = federated.meta.federationPath.slice(-this.config.provenance.maxChainLength);
    }

    // Create provenance record
    const provenance: FederatedProvenance = {
      objectId: object.meta.id,
      federationPath: federated.meta.federationPath,
      origins: [],
      transformations: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    // Add origin if first time
    if (!this.provenanceStore.has(object.meta.id)) {
      provenance.origins.push({
        sprintId: federationId,
        createdAt: new Date().toISOString(),
        metadata: options.metadata,
      });
    } else {
      // Add transformation
      const existing = this.provenanceStore.get(object.meta.id)!;
      const lastSprint = existing.federationPath[existing.federationPath.length - 1];

      if (lastSprint !== federationId) {
        provenance.origins = [...existing.origins];
        provenance.transformations = [
          ...existing.transformations,
          {
            fromSprint: lastSprint,
            toSprint: federationId,
            operation: options.operation || 'transfer',
            timestamp: new Date().toISOString(),
            metadata: options.metadata,
          },
        ];
      }
    }

    // Store provenance
    this.provenanceStore.set(object.meta.id, provenance);

    // Emit event
    this.emitEvent(FederationEventType.PROVENANCE_ATTACHED, {
      objectId: object.meta.id,
      federationId,
      provenance,
    });

    return federated;
  }

  /**
   * Trace provenance chain for an object
   */
  async traceProvenance(
    objectId: string,
    options: TraceOptions = {}
  ): Promise<ProvenanceChain> {
    const provenance = this.provenanceStore.get(objectId);

    if (!provenance) {
      return {
        objectId,
        path: [],
        verified: false,
        createdAt: new Date().toISOString(),
      };
    }

    // Build provenance chain
    const chain: ProvenanceNode[] = [];

    // Add origins
    for (const origin of provenance.origins) {
      chain.push({
        sprintId: origin.sprintId,
        operation: 'created',
        timestamp: origin.createdAt,
        metadata: options.includeMetadata ? origin.metadata : undefined,
      });
    }

    // Add transformations
    for (const transform of provenance.transformations) {
      chain.push({
        sprintId: transform.toSprint,
        operation: transform.operation,
        timestamp: transform.timestamp,
        metadata: options.includeMetadata ? transform.metadata : undefined,
      });
    }

    // Limit depth if specified
    const maxDepth = options.maxDepth || this.config.provenance.maxChainLength;
    const limitedChain = chain.slice(0, maxDepth);

    // Verify chain if requested
    const verified = options.verify ? await this.verifyChain({ objectId, path: limitedChain, verified: false, createdAt: provenance.createdAt }) : false;

    return {
      objectId,
      path: limitedChain,
      verified,
      createdAt: provenance.createdAt,
    };
  }

  /**
   * Verify provenance chain integrity
   */
  async verifyChain(chain: ProvenanceChain, options: VerifyOptions = {}): Promise<VerificationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check chain structure
    if (!chain.path || chain.path.length === 0) {
      errors.push('Provenance chain is empty');
    }

    // Verify sequence
    for (let i = 1; i < chain.path.length; i++) {
      const prev = chain.path[i - 1];
      const curr = chain.path[i];

      // Check if there's a valid transformation
      if (prev.sprintId === curr.sprintId) {
        if (options.strict) {
          errors.push(`Duplicate sprint in chain at position ${i}`);
        } else {
          warnings.push(`Duplicate sprint in chain at position ${i}`);
        }
      }
    }

    // Check timestamps (should be increasing)
    for (let i = 1; i < chain.path.length; i++) {
      const prevTime = new Date(chain.path[i - 1].timestamp).getTime();
      const currTime = new Date(chain.path[i].timestamp).getTime();

      if (currTime < prevTime) {
        errors.push(`Timestamp regression at position ${i}`);
      }
    }

    // Verify each node
    for (let i = 0; i < chain.path.length; i++) {
      const node = chain.path[i];

      // Check sprint ID format
      if (!node.sprintId || typeof node.sprintId !== 'string') {
        errors.push(`Invalid sprint ID at position ${i}`);
      }

      // Check operation
      if (!node.operation || typeof node.operation !== 'string') {
        errors.push(`Missing operation at position ${i}`);
      }

      // Check timestamp
      try {
        new Date(node.timestamp).toISOString();
      } catch {
        errors.push(`Invalid timestamp at position ${i}`);
      }
    }

    const verified = errors.length === 0;

    return {
      verified,
      errors,
      warnings,
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Get provenance for an object
   */
  getProvenance(objectId: string): FederatedProvenance | null {
    return this.provenanceStore.get(objectId) || null;
  }

  /**
   * Get all provenance records
   */
  getAllProvenance(): FederatedProvenance[] {
    return Array.from(this.provenanceStore.values());
  }

  /**
   * Export provenance chain
   */
  exportProvenance(objectId: string, format: 'json' | 'dot' = 'json'): string | null {
    const provenance = this.provenanceStore.get(objectId);

    if (!provenance) {
      return null;
    }

    if (format === 'json') {
      return JSON.stringify(provenance, null, 2);
    }

    if (format === 'dot') {
      // Generate DOT graph format for visualization
      let dot = `digraph provenance_${objectId} {\n`;
      dot += '  rankdir=LR;\n';
      dot += '  node [shape=box];\n\n';

      // Add nodes for each sprint
      for (const node of provenance.federationPath) {
        dot += `  "${node}" [label="${node}"];\n`;
      }

      // Add edges for transformations
      for (let i = 1; i < provenance.federationPath.length; i++) {
        dot += `  "${provenance.federationPath[i - 1]}" -> "${provenance.federationPath[i]}";\n`;
      }

      dot += '}\n';
      return dot;
    }

    return null;
  }

  /**
   * Clear provenance for an object
   */
  clearProvenance(objectId: string): void {
    this.provenanceStore.delete(objectId);
  }

  /**
   * Cleanup old provenance records
   */
  cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let removed = 0;

    for (const [objectId, provenance] of this.provenanceStore.entries()) {
      const lastUpdated = new Date(provenance.lastUpdated).getTime();

      if (now - lastUpdated > maxAge) {
        this.provenanceStore.delete(objectId);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalObjects: number;
    totalTransformations: number;
    averageChainLength: number;
    federationCoverage: Set<string>;
  } {
    const coverage = new Set<string>();
    let totalTransformations = 0;
    let totalChainLength = 0;

    for (const provenance of this.provenanceStore.values()) {
      for (const sprint of provenance.federationPath) {
        coverage.add(sprint);
      }
      totalTransformations += provenance.transformations.length;
      totalChainLength += provenance.federationPath.length;
    }

    const totalObjects = this.provenanceStore.size;
    const averageChainLength = totalObjects > 0 ? totalChainLength / totalObjects : 0;

    return {
      totalObjects,
      totalTransformations,
      averageChainLength,
      federationCoverage: coverage,
    };
  }

  /**
   * Merge provenance from another sprint
   */
  async mergeProvenance(
    objectId: string,
    externalChain: ProvenanceChain,
    targetSprintId: string
  ): Promise<ProvenanceChain> {
    const existing = this.provenanceStore.get(objectId);

    if (!existing) {
      // No existing provenance, create new
      const chain: ProvenanceChain = {
        objectId,
        path: externalChain.path,
        verified: externalChain.verified,
        createdAt: new Date().toISOString(),
      };

      this.provenanceStore.set(objectId, {
        objectId,
        federationPath: externalChain.path.map(n => n.sprintId),
        origins: externalChain.path.map(n => ({
          sprintId: n.sprintId,
          createdAt: n.timestamp,
          metadata: n.metadata,
        })),
        transformations: [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      });

      return chain;
    }

    // Merge with existing
    const mergedPath = [...existing.federationPath];

    // Add new path elements
    for (const node of externalChain.path) {
      if (!mergedPath.includes(node.sprintId)) {
        mergedPath.push(node.sprintId);
      }
    }

    // Limit path length
    const limitedPath = mergedPath.slice(-this.config.provenance.maxChainLength);

    // Update provenance
    existing.federationPath = limitedPath;
    existing.lastUpdated = new Date().toISOString();

    this.provenanceStore.set(objectId, existing);

    return {
      objectId,
      path: externalChain.path,
      verified: externalChain.verified,
      createdAt: existing.createdAt,
    };
  }

  /**
   * Shutdown the provenance bridge
   */
  shutdown(): void {
    this.provenanceStore.clear();
  }

  /**
   * Emit federation event
   */
  private emitEvent(event: FederationEventType, data: Record<string, unknown>): void {
    const federationEvent: FederationEvent = {
      event,
      source: { id: 'provenance', name: 'Provenance Bridge', version: '1.0.0' },
      timestamp: new Date().toISOString(),
      data,
    };

    this.emit(event, federationEvent);
  }
}

/**
 * Singleton instance
 */
let provenanceInstance: ProvenanceBridge | null = null;

export function getProvenanceBridge(): ProvenanceBridge {
  if (!provenanceInstance) {
    provenanceInstance = new ProvenanceBridge();
  }
  return provenanceInstance;
}

export function resetProvenanceBridge(): void {
  if (provenanceInstance) {
    provenanceInstance.shutdown();
    provenanceInstance = null;
  }
}
