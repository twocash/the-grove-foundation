// src/core/federation/schema.ts
// Federation data types and interfaces
// Sprint: EPIC5-SL-Federation v1

import type { GroveObject } from '@core/schema/grove-object';

/**
 * Federation Registry Types
 */

export interface SprintId {
  id: string;
  name: string;
  version: string;
  organization?: string;
}

export interface Capability {
  tag: string;
  description?: string;
  version?: string;
  metadata?: Record<string, unknown>;
}

export interface SprintRegistration {
  sprintId: string;
  name: string;
  version: string;
  organization?: string;
  endpoint: string;
  capabilities: Capability[];
  metadata?: Record<string, unknown>;
  registeredAt: string;
  lastSeen: string;
  status: 'active' | 'inactive' | 'degraded';
  health?: {
    status: 'healthy' | 'unhealthy' | 'unknown';
    lastCheck: string;
    responseTime?: number;
    message?: string;
  };
}

export interface DiscoveryCriteria {
  tags?: string[];
  organization?: string;
  version?: string;
  status?: SprintRegistration['status'];
  limit?: number;
  offset?: number;
}

export interface RegistryHealth {
  status: 'healthy' | 'degraded' | 'down';
  totalSprints: number;
  activeSprints: number;
  lastUpdate: string;
  uptime: number;
}

/**
 * Communication Protocol Types
 */

export interface FederationMessage {
  id: string;
  type: string;
  source: SprintId;
  target?: SprintId;
  timestamp: string;
  payload: Record<string, unknown>;
  correlationId?: string;
  replyTo?: string;
}

export interface FederationEvent {
  event: string;
  source: SprintId;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface Acknowledgment {
  messageId: string;
  status: 'accepted' | 'rejected' | 'pending';
  timestamp: string;
  details?: string;
}

export interface NegotiationResult {
  capability: Capability;
  status: 'negotiated' | 'rejected' | 'pending';
  terms?: Record<string, unknown>;
  expiresAt?: string;
}

export interface BroadcastResult {
  delivered: number;
  failed: number;
  total: number;
}

/**
 * Provenance Bridge Types
 */

export interface FederatedProvenance {
  objectId: string;
  federationPath: string[];
  origins: ProvenanceOrigin[];
  transformations: ProvenanceTransformation[];
  createdAt: string;
  lastUpdated: string;
}

export interface ProvenanceOrigin {
  sprintId: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ProvenanceTransformation {
  fromSprint: string;
  toSprint: string;
  operation: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ProvenanceChain {
  objectId: string;
  path: ProvenanceNode[];
  verified: boolean;
  createdAt: string;
}

export interface ProvenanceNode {
  sprintId: string;
  operation: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  children?: ProvenanceNode[];
}

export interface VerificationResult {
  verified: boolean;
  errors: string[];
  warnings: string[];
  completedAt: string;
}

/**
 * Federation Configuration
 */

export interface FederationConfig {
  registry: {
    heartbeatInterval: number;
    healthCheckInterval: number;
    cleanupInterval: number;
    maxInactiveTime: number;
  };
  communication: {
    timeout: number;
    retries: number;
    backoff: number;
  };
  provenance: {
    maxChainLength: number;
    verifyOnRead: boolean;
    compression: boolean;
  };
}

/**
 * Extended GroveObject with Federation Metadata
 */

export interface FederatedGroveObject<T> extends GroveObject<T> {
  meta: GroveObject<T>['meta'] & {
    federationId?: string;
    federationPath?: string[];
    provenanceChain?: ProvenanceChain;
  };
}

/**
 * Utility Types
 */

export type FederatedObject<T> = FederatedGroveObject<T>;

export interface FederationError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Event Types
 */

export enum FederationEventType {
  SPRINT_REGISTERED = 'sprint.registered',
  SPRINT_UNREGISTERED = 'sprint.unregistered',
  SPRINT_HEARTBEAT = 'sprint.heartbeat',
  MESSAGE_SENT = 'message.sent',
  MESSAGE_RECEIVED = 'message.received',
  CAPABILITY_NEGOTIATED = 'capability.negotiated',
  PROVENANCE_ATTACHED = 'provenance.attached',
  HEALTH_CHANGED = 'health.changed',
}

/**
 * Default Configuration
 */

export const DEFAULT_FEDERATION_CONFIG: FederationConfig = {
  registry: {
    heartbeatInterval: 30000, // 30 seconds
    healthCheckInterval: 60000, // 1 minute
    cleanupInterval: 300000, // 5 minutes
    maxInactiveTime: 300000, // 5 minutes
  },
  communication: {
    timeout: 10000, // 10 seconds
    retries: 3,
    backoff: 1000, // 1 second
  },
  provenance: {
    maxChainLength: 100,
    verifyOnRead: true,
    compression: true,
  },
};

/**
 * Helper Functions
 */

export function isValidSprintId(id: string): boolean {
  return /^[a-z0-9-]+$/.test(id);
}

export function isValidCapabilityTag(tag: string): boolean {
  return /^[a-z0-9.-]+$/.test(tag);
}

export function createSprintId(id: string, name: string, version: string): SprintId {
  return {
    id,
    name,
    version,
  };
}

export function createCapability(tag: string, description?: string, version?: string): Capability {
  return {
    tag,
    description,
    version,
  };
}

export function calculateHealth(
  lastSeen: string,
  maxInactiveTime: number = DEFAULT_FEDERATION_CONFIG.registry.maxInactiveTime
): SprintRegistration['health'] {
  const now = Date.now();
  const lastSeenMs = new Date(lastSeen).getTime();
  const inactiveTime = now - lastSeenMs;

  const healthy = inactiveTime < maxInactiveTime;

  return {
    status: healthy ? 'healthy' : 'unhealthy',
    lastCheck: new Date().toISOString(),
    responseTime: inactiveTime,
    message: healthy ? 'Sprint is responsive' : 'Sprint has not responded recently',
  };
}

export function hasCapability(sprint: SprintRegistration, tag: string): boolean {
  return sprint.capabilities.some(c => c.tag === tag);
}

export function matchesCriteria(
  sprint: SprintRegistration,
  criteria: DiscoveryCriteria
): boolean {
  if (criteria.tags && criteria.tags.length > 0) {
    const hasAllTags = criteria.tags.every(tag =>
      sprint.capabilities.some(c => c.tag === tag)
    );
    if (!hasAllTags) return false;
  }

  if (criteria.organization && sprint.organization !== criteria.organization) {
    return false;
  }

  if (criteria.version && sprint.version !== criteria.version) {
    return false;
  }

  if (criteria.status && sprint.status !== criteria.status) {
    return false;
  }

  return true;
}

export function paginateResults<T>(
  items: T[],
  limit: number,
  offset: number
): PaginatedResult<T> {
  const total = items.length;
  const hasMore = offset + limit < total;

  return {
    items: items.slice(offset, offset + limit),
    total,
    limit,
    offset,
    hasMore,
  };
}
