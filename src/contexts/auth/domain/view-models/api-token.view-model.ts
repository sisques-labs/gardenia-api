import { ApiTokenPrimitives } from '@contexts/auth/domain/primitives/api-token.primitives';
import { BaseViewModel } from '@sisques-labs/nestjs-kit';

/**
 * Read model for an API token. Deliberately exposes the `tokenHash` (not the
 * plaintext, which is unrecoverable) so the auth path can match incoming
 * tokens; transport mappers MUST NOT surface the hash to clients.
 */
export class ApiTokenViewModel extends BaseViewModel {
  public readonly userId: string;
  public readonly spaceId: string;
  public readonly label: string;
  public readonly tokenHash: string;
  public readonly lastUsedAt: Date | null;
  public readonly revokedAt: Date | null;

  constructor(props: ApiTokenPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.userId = props.userId;
    this.spaceId = props.spaceId;
    this.label = props.label;
    this.tokenHash = props.tokenHash;
    this.lastUsedAt = props.lastUsedAt;
    this.revokedAt = props.revokedAt;
  }
}
