import { BaseException } from '@sisques-labs/nestjs-kit';

export class PlantingSpotForbiddenException extends BaseException {
  constructor(userId: string, spotId: string) {
    super(`User '${userId}' is not the owner of planting spot '${spotId}'`);
  }
}
