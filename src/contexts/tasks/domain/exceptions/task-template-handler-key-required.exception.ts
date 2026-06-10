import { BaseException } from '@sisques-labs/nestjs-kit';

export class TaskTemplateHandlerKeyRequiredException extends BaseException {
  constructor(templateId: string) {
    super(
      `TaskTemplate '${templateId}' has no handlerKey. A handlerKey is required to schedule an AutomationTask.`,
    );
  }
}
