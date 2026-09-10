export const TENANT_PROVISIONING_PORT = Symbol('TENANT_PROVISIONING_PORT');

export interface CreateTenantInput {
  name: string;
}

/**
 * Seam to account-api's tenant creation endpoint (`POST /v1/tenants`).
 *
 * Per design.md D7, gardenia has no service-account/client-credentials path
 * into account-api. `callerAccessToken` MUST be the ACTING USER's own
 * already-verified platform bearer token (never minted, never a service
 * credential) — that user becomes the tenant `owner` on account-api's side.
 */
export interface ITenantProvisioningPort {
  createTenant(
    callerAccessToken: string,
    input: CreateTenantInput,
  ): Promise<string>;
}
