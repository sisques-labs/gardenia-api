import { IEventMetadata } from '@sisques-labs/nestjs-kit';

export function buildTaskJobEventMetadata(
  taskId: string,
  eventType: string,
): IEventMetadata {
  return {
    aggregateRootId: taskId,
    aggregateRootType: 'Task',
    entityId: taskId,
    entityType: 'Task',
    eventType,
  };
}
