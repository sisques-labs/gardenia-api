import { PlantingSpotInUseException } from '@contexts/planting-spots/domain/exceptions/planting-spot-in-use.exception';
import { PlantingSpotNotFoundException } from '@contexts/planting-spots/domain/exceptions/planting-spot-not-found.exception';
import { HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

export function resolvePlantingSpotsExceptionStatus(
  exception: BaseException,
): HttpStatus | null {
  if (exception instanceof PlantingSpotInUseException) {
    return HttpStatus.CONFLICT;
  }
  if (exception instanceof PlantingSpotNotFoundException) {
    return HttpStatus.NOT_FOUND;
  }
  return null;
}
