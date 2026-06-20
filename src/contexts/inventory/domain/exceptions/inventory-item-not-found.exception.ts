import { BaseException } from '@sisques-labs/nestjs-kit';

export class InventoryItemNotFoundException extends BaseException {
  constructor(id: string) {
    super(`Inventory item with id '${id}' was not found`);
  }
}
