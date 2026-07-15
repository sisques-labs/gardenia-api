import {
  Controller,
  Logger,
  MessageEvent,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Observable, Subject, interval, map, merge } from 'rxjs';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { NotificationSseConnectionRegistry } from '@contexts/notifications/infrastructure/realtime/notification-sse-connection.registry';
import { INotificationsConfig } from '@core/config/notifications.config';
import { SpaceContext } from '@shared/space-context/space-context.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsStreamController {
  private readonly logger = new Logger(NotificationsStreamController.name);

  constructor(
    private readonly registry: NotificationSseConnectionRegistry,
    private readonly spaceContext: SpaceContext,
    private readonly configService: ConfigService,
  ) {}

  @Sse('stream')
  @ApiOperation({
    summary: "Server-Sent Events stream of the current user's notifications",
  })
  stream(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ): Observable<MessageEvent> {
    const spaceId = this.spaceContext.require();
    this.logger.log(
      `SSE connection opened: user=${user.userId} space=${spaceId}`,
    );

    const subject = new Subject<MessageEvent>();
    this.registry.register(user.userId, spaceId, subject);

    req.on('close', () => {
      this.registry.deregister(user.userId, spaceId, subject);
      this.logger.log(
        `SSE connection closed: user=${user.userId} space=${spaceId}`,
      );
    });

    const heartbeatMs =
      this.configService.getOrThrow<INotificationsConfig>(
        'notifications',
      ).sseHeartbeatMs;
    const heartbeat$ = interval(heartbeatMs).pipe(
      map((): MessageEvent => ({ type: 'heartbeat', data: '' })),
    );

    return merge(subject.asObservable(), heartbeat$);
  }
}
