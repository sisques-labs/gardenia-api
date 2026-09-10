export const TENANT_MEMBERSHIP_QUERY_PORT = Symbol(
  'TENANT_MEMBERSHIP_QUERY_PORT',
);

export interface ITenantMembershipQueryPort {
  /**
   * Relays the caller's own platform bearer token to
   * `GET /v1/tenants/{tenantId}/members` (design.md D4). `null` means the
   * platform said 403 — the caller is confirmed no longer a member, and the
   * local projection row MUST be deleted. Any other failure (5xx, timeout)
   * MUST reject so the caller can apply the fail-closed-unless-fresh-row
   * policy instead of silently treating it as a 403.
   */
  listMembers(
    tenantId: string,
    callerAccessToken: string,
  ): Promise<Array<{ userId: string; role: string }> | null>;
}
