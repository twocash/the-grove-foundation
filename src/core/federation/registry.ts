// src/core/federation/registry.ts
// Service registry implementation
// Sprint: EPIC5-SL-Federation v1

import {
  SprintRegistration,
  SprintId,
  DiscoveryCriteria,
  RegistryHealth,
  Capability,
  FederationEvent,
  FederationEventType,
  DEFAULT_FEDERATION_CONFIG,
  calculateHealth,
  matchesCriteria,
  paginateResults,
  PaginatedResult,
} from './schema';
import { EventEmitter } from '@core/utils/event-emitter';

export interface RegisterOptions {
  force?: boolean;
  updateExisting?: boolean;
}

export interface UnregisterOptions {
  cleanup?: boolean;
}

/**
 * Federation Registry
 *
 * Manages sprint registration, discovery, and health monitoring.
 * Emits events on registration changes.
 */
export class FederationRegistry extends EventEmitter {
  private sprints: Map<string, SprintRegistration> = new Map();
  private config = DEFAULT_FEDERATION_CONFIG;
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map();
  private healthCheckTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;
  private startTime = Date.now();

  constructor(config = DEFAULT_FEDERATION_CONFIG) {
    super();
    this.config = config;
    this.startTimers();
  }

  /**
   * Register a sprint with the federation
   */
  async registerSprint(
    registration: Omit<SprintRegistration, 'registeredAt' | 'lastSeen' | 'status' | 'health'>,
    options: RegisterOptions = {}
  ): Promise<SprintRegistration> {
    const existing = this.sprints.get(registration.sprintId);

    if (existing && !options.force && !options.updateExisting) {
      throw new Error(`Sprint ${registration.sprintId} is already registered`);
    }

    const now = new Date().toISOString();
    const sprint: SprintRegistration = {
      ...registration,
      registeredAt: existing?.registeredAt || now,
      lastSeen: now,
      status: 'active',
      health: calculateHealth(now, this.config.registry.maxInactiveTime),
    };

    this.sprints.set(registration.sprintId, sprint);

    // Set up heartbeat monitoring
    this.setupHeartbeat(registration.sprintId);

    // Emit event
    this.emitEvent(FederationEventType.SPRINT_REGISTERED, {
      sprintId: registration.sprintId,
      sprint,
    });

    return sprint;
  }

  /**
   * Unregister a sprint from the federation
   */
  async unregisterSprint(sprintId: string, options: UnregisterOptions = {}): Promise<void> {
    const sprint = this.sprints.get(sprintId);

    if (!sprint) {
      throw new Error(`Sprint ${sprintId} is not registered`);
    }

    // Clear heartbeat timer
    this.clearHeartbeat(sprintId);

    // Remove from registry
    this.sprints.delete(sprintId);

    // Emit event
    this.emitEvent(FederationEventType.SPRINT_UNREGISTERED, {
      sprintId,
      sprint,
    });

    // Optionally cleanup data
    if (options.cleanup) {
      // TODO: Implement cleanup of associated data
    }
  }

  /**
   * Discover sprints based on criteria
   */
  async discoverSprints(criteria: DiscoveryCriteria): Promise<PaginatedResult<SprintRegistration>> {
    let sprints = Array.from(this.sprints.values());

    // Filter by criteria
    sprints = sprints.filter(sprint => matchesCriteria(sprint, criteria));

    // Apply pagination
    const limit = criteria.limit || 50;
    const offset = criteria.offset || 0;

    return paginateResults(sprints, limit, offset);
  }

  /**
   * Get all registered sprints
   */
  async listSprints(limit = 50, offset = 0): Promise<PaginatedResult<SprintRegistration>> {
    return paginateResults(Array.from(this.sprints.values()), limit, offset);
  }

  /**
   * Get a specific sprint by ID
   */
  async getSprint(sprintId: string): Promise<SprintRegistration | null> {
    return this.sprints.get(sprintId) || null;
  }

  /**
   * Update sprint capabilities
   */
  async updateCapabilities(
    sprintId: string,
    capabilities: Capability[]
  ): Promise<SprintRegistration> {
    const sprint = this.sprints.get(sprintId);

    if (!sprint) {
      throw new Error(`Sprint ${sprintId} is not registered`);
    }

    sprint.capabilities = capabilities;
    sprint.lastSeen = new Date().toISOString();
    sprint.health = calculateHealth(sprint.lastSeen, this.config.registry.maxInactiveTime);

    this.sprints.set(sprintId, sprint);

    return sprint;
  }

  /**
   * Send heartbeat for a sprint
   */
  async heartbeat(sprintId: string): Promise<SprintRegistration> {
    const sprint = this.sprints.get(sprintId);

    if (!sprint) {
      throw new Error(`Sprint ${sprintId} is not registered`);
    }

    sprint.lastSeen = new Date().toISOString();
    sprint.status = 'active';
    sprint.health = calculateHealth(sprint.lastSeen, this.config.registry.maxInactiveTime);

    this.sprints.set(sprintId, sprint);

    // Emit event
    this.emitEvent(FederationEventType.SPRINT_HEARTBEAT, {
      sprintId,
      sprint,
    });

    return sprint;
  }

  /**
   * Get registry health
   */
  async getHealth(): Promise<RegistryHealth> {
    const sprints = Array.from(this.sprints.values());
    const activeSprints = sprints.filter(s => s.status === 'active').length;
    const now = new Date().toISOString();

    // Determine overall status
    let status: RegistryHealth['status'] = 'healthy';
    const inactiveRatio = (sprints.length - activeSprints) / Math.max(sprints.length, 1);

    if (inactiveRatio > 0.5) {
      status = 'down';
    } else if (inactiveRatio > 0.2) {
      status = 'degraded';
    }

    return {
      status,
      totalSprints: sprints.length,
      activeSprints,
      lastUpdate: now,
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Search sprints by capability tags
   */
  async searchByCapability(tag: string, limit = 50): Promise<SprintRegistration[]> {
    const results = Array.from(this.sprints.values()).filter(sprint =>
      sprint.capabilities.some(c => c.tag === tag)
    );

    return results.slice(0, limit);
  }

  /**
   * Get sprints by organization
   */
  async getSprintsByOrganization(organization: string): Promise<SprintRegistration[]> {
    return Array.from(this.sprints.values()).filter(
      sprint => sprint.organization === organization
    );
  }

  /**
   * Check if sprint is healthy
   */
  isHealthy(sprintId: string): boolean {
    const sprint = this.sprints.get(sprintId);
    if (!sprint || !sprint.health) return false;
    return sprint.health.status === 'healthy';
  }

  /**
   * Get all capabilities across all sprints
   */
  async getAllCapabilities(): Promise<Set<string>> {
    const capabilities = new Set<string>();
    for (const sprint of this.sprints.values()) {
      sprint.capabilities.forEach(cap => capabilities.add(cap.tag));
    }
    return capabilities;
  }

  /**
   * Cleanup inactive sprints
   */
  async cleanup(): Promise<number> {
    const now = Date.now();
    const maxInactiveMs = this.config.registry.maxInactiveTime;
    const toDelete: string[] = [];

    for (const [sprintId, sprint] of this.sprints.entries()) {
      const lastSeenMs = new Date(sprint.lastSeen).getTime();
      const inactiveTime = now - lastSeenMs;

      if (inactiveTime > maxInactiveMs) {
        sprint.status = 'inactive';
        toDelete.push(sprintId);
      }
    }

    // Remove inactive sprints
    let removed = 0;
    for (const sprintId of toDelete) {
      await this.unregisterSprint(sprintId);
      removed++;
    }

    return removed;
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    total: number;
    active: number;
    inactive: number;
    degraded: number;
  } {
    const sprints = Array.from(this.sprints.values());
    return {
      total: sprints.length,
      active: sprints.filter(s => s.status === 'active').length,
      inactive: sprints.filter(s => s.status === 'inactive').length,
      degraded: sprints.filter(s => s.status === 'degraded').length,
    };
  }

  /**
   * Shutdown the registry
   */
  shutdown(): void {
    this.stopTimers();
    this.sprints.clear();
  }

  /**
   * Setup heartbeat monitoring for a sprint
   */
  private setupHeartbeat(sprintId: string): void {
    this.clearHeartbeat(sprintId);

    const timer = setInterval(() => {
      const sprint = this.sprints.get(sprintId);
      if (!sprint) return;

      const now = Date.now();
      const lastSeenMs = new Date(sprint.lastSeen).getTime();
      const inactiveTime = now - lastSeenMs;

      if (inactiveTime > this.config.registry.maxInactiveTime) {
        sprint.status = 'inactive';
        sprint.health = calculateHealth(sprint.lastSeen, this.config.registry.maxInactiveTime);
      }
    }, this.config.registry.heartbeatInterval);

    this.heartbeatTimers.set(sprintId, timer);
  }

  /**
   * Clear heartbeat timer for a sprint
   */
  private clearHeartbeat(sprintId: string): void {
    const timer = this.heartbeatTimers.get(sprintId);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(sprintId);
    }
  }

  /**
   * Start monitoring timers
   */
  private startTimers(): void {
    // Health check timer
    this.healthCheckTimer = setInterval(() => {
      this.checkHealth();
    }, this.config.registry.healthCheckInterval);

    // Cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch(err => {
        console.error('Federation registry cleanup error:', err);
      });
    }, this.config.registry.cleanupInterval);
  }

  /**
   * Stop monitoring timers
   */
  private stopTimers(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    for (const timer of this.heartbeatTimers.values()) {
      clearInterval(timer);
    }
    this.heartbeatTimers.clear();
  }

  /**
   * Check health of all sprints
   */
  private checkHealth(): void {
    const now = Date.now();
    const maxInactiveMs = this.config.registry.maxInactiveTime;

    for (const [sprintId, sprint] of this.sprints.entries()) {
      const lastSeenMs = new Date(sprint.lastSeen).getTime();
      const inactiveTime = now - lastSeenMs;

      const oldStatus = sprint.health?.status;
      const newStatus = inactiveTime > maxInactiveMs ? 'unhealthy' : 'healthy';

      if (oldStatus !== newStatus) {
        sprint.health = calculateHealth(sprint.lastSeen, maxInactiveMs);

        this.emitEvent(FederationEventType.HEALTH_CHANGED, {
          sprintId,
          oldStatus,
          newStatus,
          health: sprint.health,
        });
      }
    }
  }

  /**
   * Emit federation event
   */
  private emitEvent(event: FederationEventType, data: Record<string, unknown>): void {
    const federationEvent: FederationEvent = {
      event,
      source: { id: 'registry', name: 'Federation Registry', version: '1.0.0' },
      timestamp: new Date().toISOString(),
      data,
    };

    this.emit(event, federationEvent);
  }
}

/**
 * Singleton instance
 */
let registryInstance: FederationRegistry | null = null;

export function getFederationRegistry(): FederationRegistry {
  if (!registryInstance) {
    registryInstance = new FederationRegistry();
  }
  return registryInstance;
}

export function resetFederationRegistry(): void {
  if (registryInstance) {
    registryInstance.shutdown();
    registryInstance = null;
  }
}
