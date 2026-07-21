import { Logger, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit/graphql';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { RegisterPushSubscriptionCommand } from '@contexts/notifications/application/commands/register-push-subscription/register-push-subscription.command';
import { UnregisterPushSubscriptionCommand } from '@contexts/notifications/application/commands/unregister-push-subscription/unregister-push-subscription.command';
import { RegisterPushSubscriptionGraphQLDto } from '@contexts/notifications/transport/graphql/dtos/requests/register-push-subscription-graphql.dto';
import { SkipSpace } from '@shared/decorators/skip-space.decorator';

@SkipSpace()
@UseGuards(JwtAuthGuard)
@Resolver()
export class PushSubscriptionMutationsResolver {
  private readonly logger = new Logger(PushSubscriptionMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
  ) {}

  @Mutation(() => MutationResponseDto)
  async registerPushSubscription(
    @Args('input') input: RegisterPushSubscriptionGraphQLDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Registering push subscription for user: ${user.userId}`);

    const id = await this.commandBus.execute<
      RegisterPushSubscriptionCommand,
      string
    >(
      new RegisterPushSubscriptionCommand({
        userId: user.userId,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        userAgent: input.userAgent,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Push subscription registered successfully',
      id,
    });
  }

  @Mutation(() => MutationResponseDto)
  async unregisterPushSubscription(
    @Args('id') id: string,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Unregistering push subscription: ${id}`);

    await this.commandBus.execute(
      new UnregisterPushSubscriptionCommand({ id }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Push subscription unregistered successfully',
      id,
    });
  }
}
