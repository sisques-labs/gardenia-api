import { HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

import { InventoryItemNotFoundException } from '@contexts/inventory/domain/exceptions/inventory-item-not-found.exception';

export function resolveInventoryExceptionStatus(
  exception: BaseException,
): HttpStatus | null {
  if (exception instanceof InventoryItemNotFoundException) {
    return HttpStatus.NOT_FOUND;
  }
  return null;
}
