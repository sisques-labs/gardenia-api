import { resolveAuthExceptionStatus } from '@contexts/auth/transport/exceptions/auth-exception.filter';
import { resolveCareLogExceptionStatus } from '@contexts/care-log/transport/exceptions/care-log-exception.filter';
import { resolvePlantSpeciesExceptionStatus } from '@contexts/plant-species/transport/exceptions/plant-species-exception.filter';
import { resolvePlantingSpotsExceptionStatus } from '@contexts/planting-spots/transport/exceptions/planting-spots-exception.filter';
import { resolvePlantsExceptionStatus } from '@contexts/plants/transport/exceptions/plants-exception.filter';
import { resolveQrExceptionStatus } from '@contexts/qr/transport/exceptions/qr-exception.filter';
import { resolveSpacesExceptionStatus } from '@contexts/spaces/transport/exceptions/spaces-exception.filter';
import { resolveUsersExceptionStatus } from '@contexts/users/transport/exceptions/users-exception.filter';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { BaseException } from '@sisques-labs/nestjs-kit';
import { Response } from 'express';

@Catch(BaseException)
export class BaseExceptionFilter
  implements ExceptionFilter, GqlExceptionFilter
{
  catch(exception: BaseException, host: ArgumentsHost): void {
    const status = this.resolveStatus(exception);

    const type = host.getType<'http' | 'graphql'>();

    if (type === 'http') {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      response.status(status).json({
        statusCode: status,
        message: exception.message,
        error: exception.name,
      });
    } else {
      throw Object.assign(exception, { statusCode: status });
    }
  }

  private resolveStatus(exception: BaseException): number {
    return (
      resolveAuthExceptionStatus(exception) ??
      resolveUsersExceptionStatus(exception) ??
      resolveSpacesExceptionStatus(exception) ??
      resolvePlantsExceptionStatus(exception) ??
      resolvePlantSpeciesExceptionStatus(exception) ??
      resolvePlantingSpotsExceptionStatus(exception) ??
      resolveQrExceptionStatus(exception) ??
      resolveCareLogExceptionStatus(exception) ??
      HttpStatus.BAD_REQUEST
    );
  }
}
