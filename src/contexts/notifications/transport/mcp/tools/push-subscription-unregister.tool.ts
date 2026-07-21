import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { UnregisterPushSubscriptionCommand } from '@contexts/notifications/application/commands/unregister-push-subscription/unregister-push-subscription.command';

import { pushSubscriptionUnregisterSchema } from '../schemas/push-subscription-unregister.schema';

@McpTool()
@Injectable()
export class PushSubscriptionUnregisterMcpTool implements IMcpTool {
  private readonly logger = new Logger(PushSubscriptionUnregisterMcpTool.name);

  readonly name = 'push_subscription_unregister';
  readonly title = 'Unregister push subscription';
  readonly description = 'Unregisters a browser push subscription.';
  readonly inputSchema = pushSubscriptionUnregisterSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { id } = args as { id: string };
    this.logger.log(`Unregistering push subscription: ${id}`);

    await this.commandBus.execute(
      new UnregisterPushSubscriptionCommand({ id }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
