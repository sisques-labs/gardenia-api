import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { API_TOKEN_PREFIX } from '@contexts/auth/application/constants/api-token.constants';
import { GenerateApiTokenService } from '@contexts/auth/application/services/write/generate-api-token/generate-api-token.service';
import {
  API_TOKEN_WRITE_REPOSITORY,
  IApiTokenWriteRepository,
} from '@contexts/auth/domain/repositories/write/api-token-write.repository';

import { ApiTokenAuthenticateQuery } from './api-token-authenticate.query';
import { ApiTokenAuthenticationResult } from './api-token-authentication.result';

@QueryHandler(ApiTokenAuthenticateQuery)
export class ApiTokenAuthenticateQueryHandler implements IQueryHandler<
  ApiTokenAuthenticateQuery,
  ApiTokenAuthenticationResult | null
> {
  private readonly logger = new Logger(ApiTokenAuthenticateQueryHandler.name);

  constructor(
    @Inject(API_TOKEN_WRITE_REPOSITORY)
    private readonly repository: IApiTokenWriteRepository,
  ) {}

  async execute(
    query: ApiTokenAuthenticateQuery,
  ): Promise<ApiTokenAuthenticationResult | null> {
    this.logger.debug('Authenticating API token');

    if (!query.rawToken.startsWith(API_TOKEN_PREFIX)) {
      return null;
    }

    const hash = GenerateApiTokenService.hash(query.rawToken);
    const token = await this.repository.findByTokenHash(hash);

    if (!token || token.isRevoked()) {
      return null;
    }

    return {
      tokenId: token.id.value,
      userId: token.userId.value,
      spaceId: token.spaceId.value,
    };
  }
}
