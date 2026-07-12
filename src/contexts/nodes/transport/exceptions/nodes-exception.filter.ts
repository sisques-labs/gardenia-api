import { HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

import { BridgeAlreadyClaimedException } from '@contexts/nodes/domain/exceptions/bridge-already-claimed.exception';
import { BridgeNotFoundException } from '@contexts/nodes/domain/exceptions/bridge-not-found.exception';
import { InvalidPairingCodeException } from '@contexts/nodes/domain/exceptions/invalid-pairing-code.exception';
import { NodeNotFoundException } from '@contexts/nodes/domain/exceptions/node-not-found.exception';

export function resolveNodesExceptionStatus(
  exception: BaseException,
): HttpStatus | null {
  if (
    exception instanceof BridgeNotFoundException ||
    exception instanceof NodeNotFoundException
  ) {
    return HttpStatus.NOT_FOUND;
  }
  if (exception instanceof InvalidPairingCodeException) {
    return HttpStatus.BAD_REQUEST;
  }
  if (exception instanceof BridgeAlreadyClaimedException) {
    return HttpStatus.CONFLICT;
  }
  return null;
}
