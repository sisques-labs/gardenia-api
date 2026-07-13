import { z } from 'zod';

/** Input schema for the `notification_mark_read` MCP tool. */
export const notificationMarkReadSchema = {
  id: z.string().uuid().describe('UUID of the notification to mark as read'),
};
