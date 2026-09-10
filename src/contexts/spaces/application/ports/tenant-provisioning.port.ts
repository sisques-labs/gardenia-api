import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';

export const TENANT_PROVISIONING_PORT = Symbol('TENANT_PROVISIONING_PORT');

export interface CreateTenantInput {
  name: string;
}

export interface AddTenantMemberInput {
  userId: string;
  role: MembershipRoleEnum;
}

export interface TenantMemberConfirmation {
  userId: string;
  role: string;
}

/**
 * Seam to account-api's tenant creation endpoint (`POST /v1/tenants`) and
 * membership-write operations.
 *
 * Per design.md D7, gardenia has no service-account/client-credentials path
 * into account-api. `callerAccessToken` MUST always be the ACTING USER's own
 * already-verified platform bearer token (never minted, never a service
 * credential) — that user becomes the tenant `owner` on account-api's side
 * for `createTenant`.
 *
 * ⚠️ `addMember`/`removeMember` endpoint shapes are NOT confirmed against
 * account-api source the way `createTenant`/`listMembers` were — design.md's
 * "Platform facts verified in account-api source" table explicitly states no
 * per-member write endpoint was found there, while the `space-tenant-mapping`
 * spec's "Platform Write Authority for Membership" requirement mandates
 * calling one. This is a DOCUMENTED design/spec conflict (see apply-progress
 * for `migrate-gardenia-to-sisques-account`), not an invented fact — confirm
 * the real endpoint shape before shipping to production, same caveat already
 * on file for `account-api-tenant.types.ts`'s `CreateTenantApiResponse`.
 */
export interface ITenantProvisioningPort {
  createTenant(
    callerAccessToken: string,
    input: CreateTenantInput,
  ): Promise<string>;

  addMember(
    callerAccessToken: string,
    tenantId: string,
    input: AddTenantMemberInput,
  ): Promise<TenantMemberConfirmation>;

  removeMember(
    callerAccessToken: string,
    tenantId: string,
    targetUserId: string,
  ): Promise<void>;
}
