import { BaseException } from '@sisques-labs/nestjs-kit';

export class LastOwnerRemovalException extends BaseException {
  constructor(spaceId: string) {
    super(
      `Cannot remove the last owner from space '${spaceId}'. Promote another member to owner first`,
    );
  }
}
