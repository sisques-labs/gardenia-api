import {
  Controller,
  Delete,
  Get,
  Logger,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Request, Response } from 'express';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { McpServerFactory } from '../services/mcp-server.factory';

/**
 * MCP transport entry point (Streamable HTTP, stateless).
 *
 * Exposed at `POST /api/mcp`. The global `OptionalJwtAuthGuard` + `SpaceGuard`
 * enforce authentication and the X-Space-ID header before this runs, and the
 * global `SpaceInterceptor` wraps the handler in the tenant ALS frame — so the
 * Command/Query bus calls made by tools resolve against the correct space.
 *
 * A new MCP server + transport is created per request (no session state):
 * every request re-validates auth/tenancy, matching the rest of the API.
 */
@Controller('mcp')
export class McpController {
  private readonly logger = new Logger(McpController.name);

  constructor(
    private readonly mcpServerFactory: McpServerFactory,
    private readonly spaceContext: SpaceContext,
  ) {}

  @Post()
  async handleRequest(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<void> {
    const spaceId = this.spaceContext.require();
    this.logger.log(`MCP request from user ${user.userId} in space ${spaceId}`);

    const server = this.mcpServerFactory.create({
      userId: user.userId,
      email: user.email,
      spaceId,
    });
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on('close', () => {
      void transport.close();
      void server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }

  @Get()
  handleGet(@Res() res: Response): void {
    this.methodNotAllowed(res);
  }

  @Delete()
  handleDelete(@Res() res: Response): void {
    this.methodNotAllowed(res);
  }

  /**
   * Stateless transport keeps no session, so the SSE stream (GET) and session
   * termination (DELETE) defined by the spec are not supported.
   */
  private methodNotAllowed(res: Response): void {
    res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed.' },
      id: null,
    });
  }
}
