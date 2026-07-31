import {
  Controller,
  Body,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { RegisterPushSubscriptionCommand } from '@contexts/notifications/application/commands/register-push-subscription/register-push-subscription.command';
import { UnregisterPushSubscriptionCommand } from '@contexts/notifications/application/commands/unregister-push-subscription/unregister-push-subscription.command';
import { SkipSpace } from '@shared/decorators/skip-space.decorator';

import { PushSubscriptionRestResponseDto } from '../dtos/push-subscription-rest-response.dto';
import { RegisterPushSubscriptionDto } from '../dtos/register-push-subscription.dto';

@ApiTags('push-subscriptions')
@ApiBearerAuth()
@Controller('push-subscriptions')
export class PushSubscriptionsController {
  private readonly logger = new Logger(PushSubscriptionsController.name);

  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @SkipSpace()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register (or re-register) a push subscription' })
  @ApiResponse({ status: 201, type: PushSubscriptionRestResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async registerPushSubscription(
    @Body() dto: RegisterPushSubscriptionDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<PushSubscriptionRestResponseDto> {
    this.logger.log(`Registering push subscription for user: ${user.userId}`);

    const id = await this.commandBus.execute<
      RegisterPushSubscriptionCommand,
      string
    >(
      new RegisterPushSubscriptionCommand({
        userId: user.userId,
        endpoint: dto.endpoint,
        p256dh: dto.p256dh,
        auth: dto.auth,
        userAgent: dto.userAgent,
      }),
    );

    return { id };
  }

  @Delete(':id')
  @SkipSpace()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unregister a push subscription' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async unregisterPushSubscription(@Param('id') id: string): Promise<void> {
    this.logger.log(`Unregistering push subscription: ${id}`);

    await this.commandBus.execute(
      new UnregisterPushSubscriptionCommand({ id }),
    );
  }
}
