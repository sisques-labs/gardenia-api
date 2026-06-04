import { OAuthIdentityEntity } from '@contexts/auth/domain/entities/oauth-identity/oauth-identity.entity';
import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

export const OAUTH_IDENTITY_WRITE_REPOSITORY = Symbol(
  'OAUTH_IDENTITY_WRITE_REPOSITORY',
);

export interface IOAuthIdentityWriteRepository extends IBaseWriteRepository<OAuthIdentityEntity> {
  findByProviderUserId(
    provider: string,
    providerUserId: string,
  ): Promise<OAuthIdentityEntity | null>;
  findByUserId(userId: string): Promise<OAuthIdentityEntity[]>;
}
