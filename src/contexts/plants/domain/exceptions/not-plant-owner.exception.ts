import { BaseException } from '@sisques-labs/nestjs-kit';

export class NotPlantOwnerException extends BaseException {
  constructor(userId: string, plantId: string) {
    super(`User '${userId}' is not the owner of plant '${plantId}'`);
  }
}
