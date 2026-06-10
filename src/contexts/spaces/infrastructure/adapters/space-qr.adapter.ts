import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import {
  CreateInvitationQrInput,
  ISpaceQrPort,
} from '@contexts/spaces/application/ports/space-qr.port';
import { CreateQrCommand } from '@contexts/qr/application/commands/create-qr/create-qr.command';

@Injectable()
export class SpaceQrAdapter implements ISpaceQrPort {
  private readonly logger = new Logger(SpaceQrAdapter.name);

  constructor(private readonly commandBus: CommandBus) {}

  async createInvitationQr(input: CreateInvitationQrInput): Promise<string> {
    this.logger.log(
      `Creating invitation QR for space ${input.spaceId} expiring at ${input.expiresAt.toISOString()}`,
    );

    return this.commandBus.execute<CreateQrCommand, string>(
      new CreateQrCommand({
        targetUrl: input.targetUrl,
        spaceId: input.spaceId,
        expiresAt: input.expiresAt,
      }),
    );
  }
}
