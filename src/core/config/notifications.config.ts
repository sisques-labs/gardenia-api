import { registerAs } from '@nestjs/config';

export interface INotificationsConfig {
  sseHeartbeatMs: number;
}

export const notificationsConfig = registerAs(
  'notifications',
  (): INotificationsConfig => ({
    sseHeartbeatMs: Number(process.env.NOTIFICATIONS_SSE_HEARTBEAT_MS ?? 20000),
  }),
);
