import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { Response } from 'express';
import { BaseException } from '@sisques-labs/nestjs-kit';
import { AccountAlreadyExistsException } from '@contexts/auth/domain/exceptions/account-already-exists.exception';
import { AccountNotFoundException } from '@contexts/auth/domain/exceptions/account-not-found.exception';
import { InvalidCredentialsException } from '@contexts/auth/domain/exceptions/invalid-credentials.exception';
import { UserAlreadyExistsException } from '@contexts/users/domain/exceptions/user-already-exists.exception';
import { UserNotFoundException } from '@contexts/users/domain/exceptions/user-not-found.exception';

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
    }
    // For GraphQL: rethrow with status metadata attached so Apollo formats it correctly
    else {
      throw Object.assign(exception, { statusCode: status });
    }
  }

  private resolveStatus(exception: BaseException): number {
    if (
      exception instanceof AccountAlreadyExistsException ||
      exception instanceof UserAlreadyExistsException
    ) {
      return HttpStatus.CONFLICT; // 409
    }
    if (
      exception instanceof AccountNotFoundException ||
      exception instanceof UserNotFoundException
    ) {
      return HttpStatus.NOT_FOUND; // 404
    }
    if (exception instanceof InvalidCredentialsException) {
      return HttpStatus.UNAUTHORIZED; // 401
    }
    return HttpStatus.BAD_REQUEST; // 400 — BaseException fallback
  }
}
