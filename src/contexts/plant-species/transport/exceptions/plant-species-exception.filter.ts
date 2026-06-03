import { PlantSpeciesInUseException } from '@contexts/plant-species/domain/exceptions/plant-species-in-use.exception';
import { PlantSpeciesNameAlreadyExistsException } from '@contexts/plant-species/domain/exceptions/plant-species-name-already-exists.exception';
import { PlantSpeciesNotFoundException } from '@contexts/plant-species/domain/exceptions/plant-species-not-found.exception';
import { HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

export function resolvePlantSpeciesExceptionStatus(
  exception: BaseException,
): HttpStatus | null {
  if (
    exception instanceof PlantSpeciesNameAlreadyExistsException ||
    exception instanceof PlantSpeciesInUseException
  ) {
    return HttpStatus.CONFLICT;
  }
  if (exception instanceof PlantSpeciesNotFoundException) {
    return HttpStatus.NOT_FOUND;
  }
  return null;
}
