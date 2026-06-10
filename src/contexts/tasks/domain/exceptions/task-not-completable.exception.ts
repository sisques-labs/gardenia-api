import { HttpException, HttpStatus } from '@nestjs/common';

export class TaskNotCompletableException extends HttpException {
  constructor(reason: string) {
    super(`Task cannot be completed: ${reason}`, HttpStatus.CONFLICT);
  }
}
