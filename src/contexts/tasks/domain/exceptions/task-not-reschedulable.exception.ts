import { HttpException, HttpStatus } from '@nestjs/common';

export class TaskNotReschedulableException extends HttpException {
  constructor(reason: string) {
    super(`Task cannot be rescheduled: ${reason}`, HttpStatus.CONFLICT);
  }
}
