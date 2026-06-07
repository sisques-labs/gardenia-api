import { BaseException } from '@sisques-labs/nestjs-kit';

export class TaskTemplateNotFoundException extends BaseException {
  constructor(id: string) {
    super(`Task template with id '${id}' was not found`);
  }
}
