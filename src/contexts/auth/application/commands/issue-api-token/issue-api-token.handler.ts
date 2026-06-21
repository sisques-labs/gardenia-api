import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { GenerateApiTokenService } from '@contexts/auth/application/services/write/generate-api-token/generate-api-token.service';
import { ApiTokenBuilder } from '@contexts/auth/domain/builders/api-token.builder';
import {
  API_TOKEN_WRITE_REPOSITORY,
  IApiTokenWriteRepository,
} from '@contexts/auth/domain/repositories/write/api-token-write.repository';

import { IssueApiTokenCommand } from './issue-api-token.command';

export interface IssueApiTokenResult {
  id: string;
  /** Plaintext token — returned once, never recoverable afterwards. */
  token: string;
}

@CommandHandler(IssueApiTokenCommand)
export class IssueApiTokenCommandHandler implements ICommandHandler<
  IssueApiTokenCommand,
  IssueApiTokenResult
> {
  private readonly logger = new Logger(IssueApiTokenCommandHandler.name);

  constructor(
    @Inject(API_TOKEN_WRITE_REPOSITORY)
    private readonly repository: IApiTokenWriteRepository,
    private readonly apiTokenBuilder: ApiTokenBuilder,
    private readonly generateApiTokenService: GenerateApiTokenService,
  ) {}

  async execute(command: IssueApiTokenCommand): Promise<IssueApiTokenResult> {
    const { token, hash } = await this.generateApiTokenService.execute();
    const id = UuidValueObject.generate().value;

    const aggregate = this.apiTokenBuilder
      .withId(id)
      .withUserId(command.userId.value)
      .withSpaceId(command.spaceId.value)
      .withLabel(command.label.value)
      .withTokenHash(hash)
      .build();

    await this.repository.save(aggregate);

    this.logger.log(
      `Issued API token ${id} for user ${command.userId.value} in space ${command.spaceId.value}`,
    );

    return { id, token };
  }
}
