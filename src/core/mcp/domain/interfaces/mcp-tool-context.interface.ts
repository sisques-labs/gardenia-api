/**
 * Per-request authentication and tenancy context handed to every MCP tool.
 *
 * Built by the MCP transport controller from the authenticated request
 * (JWT user) and the active space (X-Space-ID), so tools never read HTTP
 * primitives directly — they receive the resolved identity here.
 */
export interface IMcpToolContext {
  /** Authenticated user id (from the JWT). */
  readonly userId: string;
  /** Authenticated user email (from the JWT). */
  readonly email: string;
  /** Active space id (from the X-Space-ID header / SpaceContext). */
  readonly spaceId: string;
}
