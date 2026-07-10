import { PlantNotFoundException } from '@contexts/plants/domain/exceptions/plant-not-found.exception';
import { PlantPlantingSpotNotFoundException } from '@contexts/plants/domain/exceptions/plant-planting-spot-not-found.exception';
import { HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

export function resolvePlantsExceptionStatus(
  exception: BaseException,
): HttpStatus | null {
  if (
    exception instanceof PlantNotFoundException ||
    exception instanceof PlantPlantingSpotNotFoundException
  ) {
    return HttpStatus.NOT_FOUND;
  }
  return null;
}
