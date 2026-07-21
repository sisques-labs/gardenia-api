import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IMcpTool, McpTool } from '@sisques-labs/nestjs-kit/mcp';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { RegisterPushSubscriptionCommand } from '@contexts/notifications/application/commands/register-push-subscription/register-push-subscription.command';

import { pushSubscriptionRegisterSchema } from '../schemas/push-subscription-register.schema';

@McpTool()
@Injectable()
export class PushSubscriptionRegisterMcpTool implements IMcpTool<IMcpToolContext> {
  private readonly logger = new Logger(PushSubscriptionRegisterMcpTool.name);

  readonly name = 'push_subscription_register';
  readonly title = 'Register push subscription';
  readonly description =
    'Registers (or re-registers) a browser push subscription for the current user, so care-schedule reminders can be delivered to it.';
  readonly inputSchema = pushSubscriptionRegisterSchema;

  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    args: Record<string, unknown>,
    context: IMcpToolContext,
  ): Promise<CallToolResult> {
    const { endpoint, p256dh, auth, userAgent } = args as {
      endpoint: string;
      p256dh: string;
      auth: string;
      userAgent?: string | null;
    };
    this.logger.log(
      `Registering push subscription for user: ${context.userId}`,
    );

    const id = await this.commandBus.execute<
      RegisterPushSubscriptionCommand,
      string
    >(
      new RegisterPushSubscriptionCommand({
        userId: context.userId,
        endpoint,
        p256dh,
        auth,
        userAgent: userAgent ?? undefined,
      }),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, id }) }],
    };
  }
}
