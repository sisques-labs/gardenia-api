import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ApiTokenNotFoundException } from '@contexts/auth/domain/exceptions/api-token-not-found.exception';
import {
  API_TOKEN_WRITE_REPOSITORY,
  IApiTokenWriteRepository,
} from '@contexts/auth/domain/repositories/write/api-token-write.repository';

import { RevokeApiTokenCommand } from './revoke-api-token.command';

@CommandHandler(RevokeApiTokenCommand)
export class RevokeApiTokenCommandHandler implements ICommandHandler<
  RevokeApiTokenCommand,
  void
> {
  private readonly logger = new Logger(RevokeApiTokenCommandHandler.name);

  constructor(
    @Inject(API_TOKEN_WRITE_REPOSITORY)
    private readonly repository: IApiTokenWriteRepository,
  ) {}

  async execute(command: RevokeApiTokenCommand): Promise<void> {
    const token = await this.repository.findById(command.tokenId.value);

    // Treat a token owned by someone else as not-found — never leak existence.
    if (!token || token.userId.value !== command.userId.value) {
      throw new ApiTokenNotFoundException(command.tokenId.value);
    }

    token.revoke();
    await this.repository.save(token);

    this.logger.log(
      `Revoked API token ${command.tokenId.value} for user ${command.userId.value}`,
    );
  }
}
