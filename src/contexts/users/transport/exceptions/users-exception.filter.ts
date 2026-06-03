import { BioExceedsMaxLengthException } from '@contexts/users/domain/exceptions/bio-exceeds-max-length.exception';
import { InvalidUsernameFormatException } from '@contexts/users/domain/exceptions/invalid-username-format.exception';
import { InvalidUsernameLengthException } from '@contexts/users/domain/exceptions/invalid-username-length.exception';
import { UserAlreadyExistsException } from '@contexts/users/domain/exceptions/user-already-exists.exception';
import { UserNotFoundException } from '@contexts/users/domain/exceptions/user-not-found.exception';
import { UsernameAlreadyTakenException } from '@contexts/users/domain/exceptions/username-already-taken.exception';
import { HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

export function resolveUsersExceptionStatus(
  exception: BaseException,
): HttpStatus | null {
  if (
    exception instanceof UserAlreadyExistsException ||
    exception instanceof UsernameAlreadyTakenException
  ) {
    return HttpStatus.CONFLICT;
  }
  if (exception instanceof UserNotFoundException) {
    return HttpStatus.NOT_FOUND;
  }
  if (
    exception instanceof InvalidUsernameFormatException ||
    exception instanceof InvalidUsernameLengthException ||
    exception instanceof BioExceedsMaxLengthException
  ) {
    return HttpStatus.UNPROCESSABLE_ENTITY;
  }
  return null;
}
