import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { IMcpToolContext } from '@core/mcp/domain/interfaces/mcp-tool-context.interface';
import { CreateSpaceCommand } from '@contexts/spaces/application/commands/create-space/create-space.command';
import { spaceCreateSchema } from '../schemas/space-create.schema';

@McpTool()
@Injectable()
export class SpaceCreateMcpTool implements IMcpTool {
  private readonly logger = new Logger(SpaceCreateMcpTool.name);

  readonly name = 'space_create';
  readonly title = 'Create space';
  readonly description = 'Creates a new space owned by the authenticated user.';
  readonly inputSchema = spaceCreateSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const { name } = args as { name: string };
    this.logger.log(`Creating space for owner: ${context.userId}`);

    const id = await this.commandBus.execute<CreateSpaceCommand, string>(
      new CreateSpaceCommand({ name, ownerId: context.userId }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
