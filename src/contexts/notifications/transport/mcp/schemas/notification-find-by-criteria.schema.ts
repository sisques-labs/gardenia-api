import { z } from 'zod';

import { NotificationStatusEnum } from '@contexts/notifications/domain/enums/notification-status.enum';

/** Input schema for the `notification_find_by_criteria` MCP tool. */
export const notificationFindByCriteriaSchema = {
  status: z
    .nativeEnum(NotificationStatusEnum)
    .optional()
    .describe('Filter by read state'),
  type: z.string().optional().describe('Filter by notification type'),
  page: z.number().int().positive().optional().describe('1-based page number'),
  perPage: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe('Number of items per page (max 100)'),
};
