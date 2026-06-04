import { IOAuthIdentityPrimitives } from '@contexts/auth/domain/primitives/oauth-identity.primitives';
import { BaseViewModel } from '@sisques-labs/nestjs-kit';

export class OAuthIdentityViewModel extends BaseViewModel {
  public readonly userId: string;
  public readonly provider: string;
  public readonly providerUserId: string;
  public readonly email: string | null;
  public readonly emailVerified: boolean;
  public readonly tokenExpiresAt: Date | null;

  constructor(props: IOAuthIdentityPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.userId = props.userId;
    this.provider = props.provider;
    this.providerUserId = props.providerUserId;
    this.email = props.email;
    this.emailVerified = props.emailVerified;
    this.tokenExpiresAt = props.tokenExpiresAt;
  }
}
