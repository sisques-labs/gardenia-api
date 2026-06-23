import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { IMcpToolContext } from '@core/mcp/domain/interfaces/mcp-tool-context.interface';
import { UpdateSpaceCommand } from '@contexts/spaces/application/commands/update-space/update-space.command';
import { SpaceEnvironmentEnum } from '@contexts/spaces/domain/enums/space-environment.enum';
import { spaceUpdateSchema } from '../schemas/space-update.schema';

@McpTool()
@Injectable()
export class SpaceUpdateMcpTool implements IMcpTool {
  private readonly logger = new Logger(SpaceUpdateMcpTool.name);

  readonly name = 'space_update';
  readonly title = 'Update space';
  readonly description = 'Updates a space. Only provided fields are changed.';
  readonly inputSchema = spaceUpdateSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const { spaceId, name, latitude, longitude, environment } = args as {
      spaceId: string;
      name?: string;
      latitude?: number | null;
      longitude?: number | null;
      environment?: SpaceEnvironmentEnum | null;
    };
    this.logger.log(`Updating space: ${spaceId}`);

    await this.commandBus.execute(
      new UpdateSpaceCommand({
        spaceId,
        name,
        latitude,
        longitude,
        environment,
        requestingUserId: context.userId,
      }),
    );

    return {
      content: [
        { type: 'text', text: JSON.stringify({ success: true, id: spaceId }) },
      ],
    };
  }
}
