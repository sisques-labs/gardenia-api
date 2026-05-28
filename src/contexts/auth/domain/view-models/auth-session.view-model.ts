import { AuthSessionPrimitives } from '@contexts/auth/domain/primitives/auth-session.primitives';
import { BaseViewModel } from '@sisques-labs/nestjs-kit';

export class AuthSessionViewModel extends BaseViewModel {
  public readonly userId: string;
  public readonly tokenHash: string;
  public readonly expiresAt: Date;
  public readonly revokedAt: Date | null;
  public readonly deviceInfo: string | null;

  constructor(props: AuthSessionPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.userId = props.userId;
    this.tokenHash = props.tokenHash;
    this.expiresAt = props.expiresAt;
    this.revokedAt = props.revokedAt;
    this.deviceInfo = props.deviceInfo;
  }
}
