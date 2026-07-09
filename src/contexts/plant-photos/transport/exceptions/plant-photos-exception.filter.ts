import { HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

import { PlantPhotoForbiddenException } from '@contexts/plant-photos/domain/exceptions/plant-photo-forbidden.exception';
import { PlantPhotoNotFoundException } from '@contexts/plant-photos/domain/exceptions/plant-photo-not-found.exception';

export function resolvePlantPhotosExceptionStatus(
  exception: BaseException,
): HttpStatus | null {
  if (exception instanceof PlantPhotoNotFoundException) {
    return HttpStatus.NOT_FOUND;
  }
  if (exception instanceof PlantPhotoForbiddenException) {
    return HttpStatus.FORBIDDEN;
  }
  return null;
}
