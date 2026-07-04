import { NotPlantOwnerException } from '@contexts/plants/domain/exceptions/not-plant-owner.exception';
import { PlantLinkedSpeciesNotFoundException } from '@contexts/plants/domain/exceptions/plant-linked-species-not-found.exception';
import { PlantNotFoundException } from '@contexts/plants/domain/exceptions/plant-not-found.exception';
import { PlantPlantingSpotNotFoundException } from '@contexts/plants/domain/exceptions/plant-planting-spot-not-found.exception';
import { HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

export function resolvePlantsExceptionStatus(
  exception: BaseException,
): HttpStatus | null {
  if (
    exception instanceof PlantNotFoundException ||
    exception instanceof PlantLinkedSpeciesNotFoundException ||
    exception instanceof PlantPlantingSpotNotFoundException
  ) {
    return HttpStatus.NOT_FOUND;
  }
  if (exception instanceof NotPlantOwnerException) {
    return HttpStatus.FORBIDDEN;
  }
  return null;
}
