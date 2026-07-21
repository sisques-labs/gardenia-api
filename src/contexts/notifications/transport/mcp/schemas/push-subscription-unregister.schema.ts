import { z } from 'zod';

/** Input schema for the `push_subscription_unregister` MCP tool. */
export const pushSubscriptionUnregisterSchema = {
  id: z.string().uuid().describe('Id of the push subscription to unregister'),
};
