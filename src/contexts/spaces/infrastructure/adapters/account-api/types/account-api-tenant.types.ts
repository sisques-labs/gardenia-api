/**
 * ⚠️ Field names below (`appId`/`name`/`slug` request body, `{ id }`
 * response) are inferred from account-api's DTO naming conventions
 * (`create-tenant.dto.ts`, `tenants.controller.ts` — see design.md's
 * "Platform facts verified in account-api source" table) but this adapter
 * was not exercised against a live account-api instance. Confirm before
 * shipping to production — same caveat already on file for
 * `plantnet-identify-api.types.ts`.
 */
export interface CreateTenantApiResponse {
  id: string;
}

export interface TenantMemberApiEntry {
  userId?: string;
  role?: string;
}

export type TenantMembersApiResponse = TenantMemberApiEntry[];
