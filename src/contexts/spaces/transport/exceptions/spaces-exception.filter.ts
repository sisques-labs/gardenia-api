import { DuplicateMembershipException } from '@contexts/spaces/domain/exceptions/duplicate-membership.exception';
import { LastOwnerRemovalException } from '@contexts/spaces/domain/exceptions/last-owner-removal.exception';
import { NotASpaceMemberException } from '@contexts/spaces/domain/exceptions/not-a-space-member.exception';
import { NotSpaceOwnerException } from '@contexts/spaces/domain/exceptions/not-space-owner.exception';
import { SpaceContextMissingException } from '@contexts/spaces/domain/exceptions/space-context-missing.exception';
import { SpaceLimitExceededException } from '@contexts/spaces/domain/exceptions/space-limit-exceeded.exception';
import { SpaceNotFoundException } from '@contexts/spaces/domain/exceptions/space-not-found.exception';
import { HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

export function resolveSpacesExceptionStatus(
  exception: BaseException,
): HttpStatus | null {
  if (
    exception instanceof SpaceLimitExceededException ||
    exception instanceof DuplicateMembershipException
  ) {
    return HttpStatus.CONFLICT;
  }
  if (
    exception instanceof SpaceNotFoundException ||
    exception instanceof NotASpaceMemberException
  ) {
    return HttpStatus.NOT_FOUND;
  }
  if (exception instanceof NotSpaceOwnerException) {
    return HttpStatus.FORBIDDEN;
  }
  if (exception instanceof LastOwnerRemovalException) {
    return HttpStatus.UNPROCESSABLE_ENTITY;
  }
  if (exception instanceof SpaceContextMissingException) {
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
  return null;
}
