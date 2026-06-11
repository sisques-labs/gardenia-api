import { JsonValueObject } from '@sisques-labs/nestjs-kit';

export class TaskPayloadValueObject extends JsonValueObject {
  constructor(value: Record<string, unknown>) {
    super(value);
  }
}
