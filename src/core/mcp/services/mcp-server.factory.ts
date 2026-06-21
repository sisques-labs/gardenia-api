import { Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { IMcpToolContext } from '../interfaces/mcp-tool-context.interface';
import { MCP_SERVER_NAME, MCP_SERVER_VERSION } from '../mcp-tool.constants';
import { McpToolRegistry } from './mcp-tool-registry.service';

/**
 * Builds a fresh {@link McpServer} for each incoming MCP request.
 *
 * The server is created per request (stateless Streamable HTTP) so each tool
 * handler closes over the request's authenticated {@link IMcpToolContext}.
 * This keeps multi-tenancy isolation strict: a request can only act as its own
 * authenticated user within its own space.
 */
@Injectable()
export class McpServerFactory {
  constructor(private readonly toolRegistry: McpToolRegistry) {}

  create(context: IMcpToolContext): McpServer {
    const server = new McpServer({
      name: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
    });

    for (const tool of this.toolRegistry.getTools()) {
      server.registerTool(
        tool.name,
        {
          title: tool.title,
          description: tool.description,
          inputSchema: tool.inputSchema,
        },
        (args: Record<string, unknown>) => tool.execute(args, context),
      );
    }

    return server;
  }
}
