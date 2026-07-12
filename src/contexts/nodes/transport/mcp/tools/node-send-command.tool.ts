import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { SendNodeCommandCommand } from '@contexts/nodes/application/commands/send-node-command/send-node-command.command';
import { nodeSendCommandSchema } from '../schemas/node-send-command.schema';

@McpTool()
@Injectable()
export class NodeSendCommandMcpTool implements IMcpTool {
  private readonly logger = new Logger(NodeSendCommandMcpTool.name);

  readonly name = 'node_send_command';
  readonly title = 'Send a command to a node';
  readonly description =
    'Sends an opaque command to a node in the current space.';
  readonly inputSchema = nodeSendCommandSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { nodeId, commandType, payload } = args as {
      nodeId: string;
      commandType: string;
      payload?: unknown;
    };
    this.logger.log(`Sending command ${commandType} to node ${nodeId}`);

    const commandId = await this.commandBus.execute<
      SendNodeCommandCommand,
      string
    >(new SendNodeCommandCommand({ nodeId, commandType, payload }));

    return {
      content: [{ type: 'text', text: JSON.stringify({ commandId }) }],
    };
  }
}
