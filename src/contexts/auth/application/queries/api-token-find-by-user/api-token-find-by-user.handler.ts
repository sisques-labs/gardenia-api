import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ApiTokenViewModel } from '@contexts/auth/domain/view-models/api-token.view-model';
import {
  API_TOKEN_WRITE_REPOSITORY,
  IApiTokenWriteRepository,
} from '@contexts/auth/domain/repositories/write/api-token-write.repository';

import { ApiTokenFindByUserQuery } from './api-token-find-by-user.query';

@QueryHandler(ApiTokenFindByUserQuery)
export class ApiTokenFindByUserQueryHandler implements IQueryHandler<
  ApiTokenFindByUserQuery,
  ApiTokenViewModel[]
> {
  private readonly logger = new Logger(ApiTokenFindByUserQueryHandler.name);

  constructor(
    @Inject(API_TOKEN_WRITE_REPOSITORY)
    private readonly repository: IApiTokenWriteRepository,
  ) {}

  async execute(query: ApiTokenFindByUserQuery): Promise<ApiTokenViewModel[]> {
    this.logger.log(`Listing API tokens for user ${query.userId}`);
    const tokens = await this.repository.findByUserId(query.userId);
    return tokens.map((token) => new ApiTokenViewModel(token.toPrimitives()));
  }
}
