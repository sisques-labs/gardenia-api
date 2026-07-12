import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { ClaimBridgeCommand } from '@contexts/nodes/application/commands/claim-bridge/claim-bridge.command';
import { bridgeClaimSchema } from '../schemas/bridge-claim.schema';

@McpTool()
@Injectable()
export class BridgeClaimMcpTool implements IMcpTool<IMcpToolContext> {
  private readonly logger = new Logger(BridgeClaimMcpTool.name);

  readonly name = 'bridge_claim';
  readonly title = 'Claim a bridge';
  readonly description =
    'Claims an unclaimed bridge into the current space using its pairing code.';
  readonly inputSchema = bridgeClaimSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const { bridgeId, pairingCode } = args as {
      bridgeId: string;
      pairingCode: string;
    };
    this.logger.log(`Claiming bridge ${bridgeId} for space ${context.spaceId}`);

    await this.commandBus.execute(
      new ClaimBridgeCommand({
        bridgeId,
        pairingCode,
        spaceId: context.spaceId,
      }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true }) }],
    };
  }
}
