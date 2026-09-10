import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface SyncSpaceMembershipProjectionCommandInput {
  /** The platform tenant id — equal to `space.id` for every Space within
   * this SDD change's scope (design.md D6: `external_tenant_id` stays NULL
   * for new tenant-parity Spaces; the bridge column only applies to
   * pre-existing Spaces, which have no code task in this change). */
  tenantId: string;
  userId: string;
  /** The caller's own raw platform bearer token, relayed verbatim to
   * `GET /v1/tenants/{tenantId}/members` per design.md D4 — never a
   * decoded/derived claim. */
  callerAccessToken: string;
}

export class SyncSpaceMembershipProjectionCommand {
  public readonly tenantId: UuidValueObject;
  public readonly userId: UuidValueObject;
  public readonly callerAccessToken: string;

  constructor(input: SyncSpaceMembershipProjectionCommandInput) {
    this.tenantId = new UuidValueObject(input.tenantId);
    this.userId = new UuidValueObject(input.userId);
    this.callerAccessToken = input.callerAccessToken;
  }
}
