import { IMcpToolContext } from '@sisques-labs/nestjs-kit/mcp';

/**
 * gardenia-api's MCP tool context: the authenticated user and their active
 * space, resolved the same way as the rest of the API (JWT + X-Space-ID).
 * Built by {@link GardeniaMcpContextBuilder}.
 */
export interface IGardeniaMcpToolContext extends IMcpToolContext {
  readonly userId: string;
  readonly email: string;
  readonly spaceId: string;
}
