import { BaseException } from '@sisques-labs/nestjs-kit';

export class QrAlreadyExistsForPlantException extends BaseException {
  constructor(plantId: string) {
    super(`QR already exists for plant '${plantId}'`);
  }
}
