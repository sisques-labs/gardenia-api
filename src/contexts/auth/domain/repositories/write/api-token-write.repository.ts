import { ApiTokenAggregate } from '@contexts/auth/domain/aggregates/api-token.aggregate';
import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

export const API_TOKEN_WRITE_REPOSITORY = Symbol('API_TOKEN_WRITE_REPOSITORY');

export interface IApiTokenWriteRepository extends IBaseWriteRepository<ApiTokenAggregate> {
  /** Looks up a token by its SHA-256 hash (the auth fast-path). */
  findByTokenHash(tokenHash: string): Promise<ApiTokenAggregate | null>;
  /** Lists every token belonging to a user (for management). */
  findByUserId(userId: string): Promise<ApiTokenAggregate[]>;
}
