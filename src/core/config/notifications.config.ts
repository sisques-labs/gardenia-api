import { registerAs } from '@nestjs/config';

export interface INotificationsConfig {
  reconcileEnabled: boolean;
  reconcileCron: string;
  careScheduleDueWindowHours: number;
  inventoryExpiringWindowDays: number;
  sseHeartbeatMs: number;
}

/**
 * Reconciliation is opt-in via NOTIFICATIONS_RECONCILE_ENABLED (default
 * true) so it can be disabled in tests / early rollout without touching
 * code — mirrors the KAFKA_ENABLED opt-in pattern.
 */
export const notificationsConfig = registerAs(
  'notifications',
  (): INotificationsConfig => ({
    reconcileEnabled: process.env.NOTIFICATIONS_RECONCILE_ENABLED !== 'false',
    reconcileCron:
      process.env.NOTIFICATIONS_RECONCILE_CRON?.trim() || '*/15 * * * *',
    careScheduleDueWindowHours: Number(
      process.env.NOTIFICATIONS_CARE_SCHEDULE_DUE_WINDOW_HOURS ?? 24,
    ),
    inventoryExpiringWindowDays: Number(
      process.env.NOTIFICATIONS_INVENTORY_EXPIRING_WINDOW_DAYS ?? 7,
    ),
    sseHeartbeatMs: Number(process.env.NOTIFICATIONS_SSE_HEARTBEAT_MS ?? 20000),
  }),
);
