import { Injectable, MessageEvent } from '@nestjs/common';
import { Subject } from 'rxjs';

/**
 * In-process registry of open SSE connections, keyed by `"userId:spaceId"`.
 * A `Set` (not a single Subject) per key because the same user can have
 * multiple tabs/devices connected at once. Single-instance by design in v1
 * — see notifications-module design.md's "Real-time delivery: SSE over the
 * in-process EventBus" for the documented multi-instance follow-up.
 */
@Injectable()
export class NotificationSseConnectionRegistry {
  private readonly connections = new Map<string, Set<Subject<MessageEvent>>>();

  private key(userId: string, spaceId: string): string {
    return `${userId}:${spaceId}`;
  }

  register(
    userId: string,
    spaceId: string,
    subject: Subject<MessageEvent>,
  ): void {
    const key = this.key(userId, spaceId);
    if (!this.connections.has(key)) this.connections.set(key, new Set());
    this.connections.get(key)!.add(subject);
  }

  deregister(
    userId: string,
    spaceId: string,
    subject: Subject<MessageEvent>,
  ): void {
    const key = this.key(userId, spaceId);
    const subjects = this.connections.get(key);
    subjects?.delete(subject);
    if (subjects && subjects.size === 0) this.connections.delete(key);
  }

  publish(userId: string, spaceId: string, event: MessageEvent): void {
    const subjects = this.connections.get(this.key(userId, spaceId));
    subjects?.forEach((subject) => subject.next(event));
  }

  /** Test/observability helper — not used in the request path. */
  connectionCount(userId: string, spaceId: string): number {
    return this.connections.get(this.key(userId, spaceId))?.size ?? 0;
  }
}
