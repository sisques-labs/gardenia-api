import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { CreatePlantFromIdentificationCommand } from '@contexts/plant-identification/application/commands/create-plant-from-identification/create-plant-from-identification.command';
import { createPlantFromIdentificationSchema } from '../schemas/create-plant-from-identification.schema';

@McpTool()
@Injectable()
export class CreatePlantFromIdentificationMcpTool implements IMcpTool<IMcpToolContext> {
  private readonly logger = new Logger(
    CreatePlantFromIdentificationMcpTool.name,
  );

  readonly name = 'plant_identification_create_plant';
  readonly title = 'Create plant from identification';
  readonly description =
    'Converts a resolved plant identification into a tracked Plant.';
  readonly inputSchema = createPlantFromIdentificationSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const { identificationId, name, imageUrl } = args as {
      identificationId: string;
      name: string;
      imageUrl?: string;
    };
    this.logger.log(`Creating plant from identification: ${identificationId}`);

    const result = await this.commandBus.execute(
      new CreatePlantFromIdentificationCommand({
        identificationId,
        name,
        imageUrl: imageUrl ?? null,
        requestingUserId: context.userId,
      }),
    );

    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
}
