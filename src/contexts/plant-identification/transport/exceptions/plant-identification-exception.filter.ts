import { HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

import { PlantIdentificationAlreadyConvertedException } from '@contexts/plant-identification/domain/exceptions/plant-identification-already-converted.exception';
import { PlantIdentificationForbiddenException } from '@contexts/plant-identification/domain/exceptions/plant-identification-forbidden.exception';
import { PlantIdentificationNotFoundException } from '@contexts/plant-identification/domain/exceptions/plant-identification-not-found.exception';
import { PlantIdentificationNotResolvedException } from '@contexts/plant-identification/domain/exceptions/plant-identification-not-resolved.exception';
import { PlantIdentificationProviderUnavailableException } from '@contexts/plant-identification/domain/exceptions/plant-identification-provider-unavailable.exception';
import { PlantIdentificationQuotaExceededException } from '@contexts/plant-identification/domain/exceptions/plant-identification-quota-exceeded.exception';

export function resolvePlantIdentificationExceptionStatus(
  exception: BaseException,
): HttpStatus | null {
  if (exception instanceof PlantIdentificationNotFoundException) {
    return HttpStatus.NOT_FOUND;
  }
  if (exception instanceof PlantIdentificationForbiddenException) {
    return HttpStatus.FORBIDDEN;
  }
  if (
    exception instanceof PlantIdentificationNotResolvedException ||
    exception instanceof PlantIdentificationAlreadyConvertedException
  ) {
    return HttpStatus.CONFLICT;
  }
  if (exception instanceof PlantIdentificationQuotaExceededException) {
    return HttpStatus.TOO_MANY_REQUESTS;
  }
  if (exception instanceof PlantIdentificationProviderUnavailableException) {
    return HttpStatus.BAD_GATEWAY;
  }
  return null;
}
