import { BaseException } from '@sisques-labs/nestjs-kit';

export class CareScheduleNotFoundException extends BaseException {
  constructor(id: string) {
    super(`Care schedule with id '${id}' was not found`);
  }
}
