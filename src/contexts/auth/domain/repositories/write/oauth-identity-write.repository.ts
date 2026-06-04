import { OAuthIdentityAggregate } from '@contexts/auth/domain/aggregates/oauth-identity.aggregate';
import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

export const OAUTH_IDENTITY_WRITE_REPOSITORY = Symbol(
  'OAUTH_IDENTITY_WRITE_REPOSITORY',
);

export interface IOAuthIdentityWriteRepository extends IBaseWriteRepository<OAuthIdentityAggregate> {
  findByProviderUserId(
    provider: string,
    providerUserId: string,
  ): Promise<OAuthIdentityAggregate | null>;
  findByUserId(userId: string): Promise<OAuthIdentityAggregate[]>;
}
