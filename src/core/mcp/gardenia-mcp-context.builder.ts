import { Injectable } from '@nestjs/common';
import { IMcpContextBuilder } from '@sisques-labs/nestjs-kit/mcp';
import { Request } from 'express';

import { CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { IGardeniaMcpToolContext } from './gardenia-mcp-context.interface';

/**
 * Builds the MCP tool context from the same identity the rest of the API
 * uses: `req.user` (set by the global `OptionalJwtAuthGuard`) and the active
 * space (set by the global `SpaceGuard` + `SpaceInterceptor`, read here via
 * `SpaceContext`). Both guards/interceptor run before this — see
 * `McpModule.forRoot({ contextBuilder: GardeniaMcpContextBuilder })` in
 * `AppModule`.
 */
@Injectable()
export class GardeniaMcpContextBuilder implements IMcpContextBuilder<IGardeniaMcpToolContext> {
  constructor(private readonly spaceContext: SpaceContext) {}

  build(req: Request): IGardeniaMcpToolContext {
    const user = req.user as CurrentUserPayload;
    return {
      userId: user.userId,
      email: user.email,
      spaceId: this.spaceContext.require(),
    };
  }
}
