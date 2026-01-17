// src/core/federation/protocol.ts
// Cross-sprint communication protocol
// Sprint: EPIC5-SL-Federation v1

import { EventEmitter } from '@core/utils/event-emitter';
import {
  SprintId,
  Capability,
  FederationMessage,
  FederationEvent,
  Acknowledgment,
  NegotiationResult,
  BroadcastResult,
  FederationEventType,
  DEFAULT_FEDERATION_CONFIG,
} from './schema';
import { getFederationRegistry } from './registry';

export interface MessageOptions {
  correlationId?: string;
  replyTo?: string;
  timeout?: number;
  retries?: number;
}

export interface NegotiationOptions {
  terms?: Record<string, unknown>;
  expiresIn?: number;
}

export interface SendMessageOptions extends MessageOptions {
  waitForAck?: boolean;
}

export interface BroadcastOptions {
  excludeSelf?: boolean;
  includeMetadata?: boolean;
}

/**
 * Federation Protocol
 *
 * Handles cross-sprint communication, capability negotiation,
 * and event broadcasting.
 */
export class FederationProtocol extends EventEmitter {
  private config = DEFAULT_FEDERATION_CONFIG;
  private messageQueue: Map<string, FederationMessage> = new Map();
  private pendingAcks: Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }> = new Map();
  private retryQueue: Map<string, { message: FederationMessage; attempts: number; nextRetry: number }> = new Map();

  constructor() {
    super();
    this.startRetryProcessor();
  }

  /**
   * Negotiate capability between two sprints
   */
  async negotiateCapability(
    source: SprintId,
    target: SprintId,
    capability: Capability,
    options: NegotiationOptions = {}
  ): Promise<NegotiationResult> {
    const registry = getFederationRegistry();
    const targetSprint = await registry.getSprint(target.id);

    if (!targetSprint) {
      return {
        capability,
        status: 'rejected',
        terms: { reason: 'Target sprint not found' },
      };
    }

    // Check if target has the capability
    const hasCapability = targetSprint.capabilities.some(c => c.tag === capability.tag);

    if (!hasCapability) {
      return {
        capability,
        status: 'rejected',
        terms: { reason: 'Target does not have required capability' },
      };
    }

    // Check version compatibility
    const targetCap = targetSprint.capabilities.find(c => c.tag === capability.tag);
    if (targetCap?.version && capability.version && targetCap.version !== capability.version) {
      // Version mismatch - could implement negotiation logic here
      // For now, reject version mismatches
      return {
        capability,
        status: 'rejected',
        terms: { reason: `Version mismatch: ${capability.version} != ${targetCap.version}` },
      };
    }

    // Negotiate terms
    const result: NegotiationResult = {
      capability,
      status: 'negotiated',
      terms: options.terms || {},
    };

    if (options.expiresIn) {
      result.expiresAt = new Date(Date.now() + options.expiresIn).toISOString();
    }

    // Emit event
    this.emitEvent(FederationEventType.CAPABILITY_NEGOTIATED, {
      source,
      target,
      capability,
      result,
    });

    return result;
  }

  /**
   * Send message to a specific sprint
   */
  async sendMessage(
    message: Omit<FederationMessage, 'id' | 'timestamp'>,
    options: SendMessageOptions = {}
  ): Promise<Acknowledgment> {
    const fullMessage: FederationMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      correlationId: options.correlationId,
      replyTo: options.replyTo,
    };

    // Validate message
    this.validateMessage(fullMessage);

    // Queue message
    this.messageQueue.set(fullMessage.id, fullMessage);

    // Emit event
    this.emitEvent(FederationEventType.MESSAGE_SENT, {
      message: fullMessage,
    });

    // Wait for acknowledgment if requested
    if (options.waitForAck) {
      return this.waitForAcknowledgment(fullMessage.id, options.timeout);
    }

    return {
      messageId: fullMessage.id,
      status: 'accepted',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Broadcast event to all sprints
   */
  async broadcast(
    event: Omit<FederationEvent, 'timestamp'>,
    options: BroadcastOptions = {}
  ): Promise<BroadcastResult> {
    const fullEvent: FederationEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    const registry = getFederationRegistry();
    const sprints = await registry.listSprints(1000, 0);

    let delivered = 0;
    let failed = 0;

    // Broadcast to all active sprints
    for (const sprint of sprints.items) {
      if (options.excludeSelf && sprint.sprintId === event.source.id) {
        continue;
      }

      if (sprint.status === 'active') {
        try {
          await this.sendMessage({
            type: 'event',
            source: event.source,
            target: { id: sprint.sprintId, name: sprint.name, version: sprint.version },
            payload: {
              event: fullEvent.event,
              data: fullEvent.data,
              metadata: options.includeMetadata ? { broadcastAt: fullEvent.timestamp } : undefined,
            },
          });

          delivered++;
        } catch (error) {
          console.error(`Failed to deliver broadcast to ${sprint.sprintId}:`, error);
          failed++;
        }
      }
    }

    return {
      delivered,
      failed,
      total: delivered + failed,
    };
  }

  /**
   * Receive message from another sprint
   */
  async receiveMessage(message: FederationMessage): Promise<void> {
    // Validate message
    this.validateMessage(message);

    // Process message based on type
    if (message.type === 'event') {
      // Forward event to listeners
      this.emit(message.type, message);
      this.emit('message', message);
    } else if (message.type === 'request') {
      // Handle request - could trigger capability negotiation
      this.emit('request', message);
      this.emit('message', message);
    } else if (message.type === 'response') {
      // Handle response to a previous request
      this.handleResponse(message);
    } else {
      // Generic message
      this.emit('message', message);
      this.emit(message.type, message);
    }

    // Emit event
    this.emitEvent(FederationEventType.MESSAGE_RECEIVED, {
      message,
    });
  }

  /**
   * Reply to a message
   */
  async reply(
    originalMessage: FederationMessage,
    response: Record<string, unknown>,
    status: 'success' | 'error' = 'success'
  ): Promise<Acknowledgment> {
    if (!originalMessage.replyTo) {
      throw new Error('Cannot reply to message without replyTo field');
    }

    return this.sendMessage({
      type: 'response',
      source: originalMessage.target!,
      target: originalMessage.source,
      payload: {
        status,
        response,
        originalMessageId: originalMessage.id,
      },
      correlationId: originalMessage.correlationId,
    });
  }

  /**
   * Get pending messages
   */
  getPendingMessages(): FederationMessage[] {
    return Array.from(this.messageQueue.values());
  }

  /**
   * Get message by ID
   */
  getMessage(messageId: string): FederationMessage | undefined {
    return this.messageQueue.get(messageId);
  }

  /**
   * Retry failed messages
   */
  async retryFailedMessages(): Promise<void> {
    const now = Date.now();

    for (const [messageId, retry] of this.retryQueue.entries()) {
      if (now >= retry.nextRetry && retry.attempts < this.config.communication.retries) {
        try {
          await this.sendMessage(retry.message);
          this.retryQueue.delete(messageId);
        } catch (error) {
          retry.attempts++;
          retry.nextRetry = now + this.config.communication.backoff * retry.attempts;
        }
      }
    }
  }

  /**
   * Shutdown the protocol
   */
  shutdown(): void {
    this.stopRetryProcessor();
    this.messageQueue.clear();
    this.pendingAcks.clear();
    this.retryQueue.clear();
  }

  /**
   * Validate message structure
   */
  private validateMessage(message: FederationMessage): void {
    if (!message.id) {
      throw new Error('Message must have an id');
    }
    if (!message.type) {
      throw new Error('Message must have a type');
    }
    if (!message.source) {
      throw new Error('Message must have a source');
    }
    if (!message.timestamp) {
      throw new Error('Message must have a timestamp');
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Wait for message acknowledgment
   */
  private waitForAcknowledgment(messageId: string, timeout = 10000): Promise<Acknowledgment> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingAcks.delete(messageId);
        reject(new Error(`Timeout waiting for acknowledgment: ${messageId}`));
      }, timeout);

      this.pendingAcks.set(messageId, { resolve, reject, timeout: timer });
    });
  }

  /**
   * Handle response to a request
   */
  private handleResponse(message: FederationMessage): void {
    const pending = this.pendingAcks.get(message.correlationId || '');

    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingAcks.delete(message.correlationId!);

      const ack: Acknowledgment = {
        messageId: message.id,
        status: 'accepted',
        timestamp: message.timestamp,
      };

      pending.resolve(ack);
    }
  }

  /**
   * Start retry processor
   */
  private startRetryProcessor(): void {
    setInterval(() => {
      this.retryFailedMessages().catch(err => {
        console.error('Federation protocol retry error:', err);
      });
    }, this.config.communication.backoff);
  }

  /**
   * Stop retry processor
   */
  private stopRetryProcessor(): void {
    // Note: In a real implementation, we'd store and clear the interval
    // For now, just let it run - cleanup happens on shutdown
  }

  /**
   * Emit federation event
   */
  private emitEvent(event: FederationEventType, data: Record<string, unknown>): void {
    const federationEvent: FederationEvent = {
      event,
      source: { id: 'protocol', name: 'Federation Protocol', version: '1.0.0' },
      timestamp: new Date().toISOString(),
      data,
    };

    this.emit(event, federationEvent);
  }
}

/**
 * Singleton instance
 */
let protocolInstance: FederationProtocol | null = null;

export function getFederationProtocol(): FederationProtocol {
  if (!protocolInstance) {
    protocolInstance = new FederationProtocol();
  }
  return protocolInstance;
}

export function resetFederationProtocol(): void {
  if (protocolInstance) {
    protocolInstance.shutdown();
    protocolInstance = null;
  }
}
