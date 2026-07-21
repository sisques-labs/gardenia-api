import { z } from 'zod';

/** Input schema for the `push_subscription_register` MCP tool. */
export const pushSubscriptionRegisterSchema = {
  endpoint: z
    .string()
    .min(1)
    .describe("The browser's push subscription endpoint URL"),
  p256dh: z
    .string()
    .min(1)
    .describe('The p256dh key from the browser subscription'),
  auth: z
    .string()
    .min(1)
    .describe('The auth secret from the browser subscription'),
  userAgent: z.string().nullable().optional().describe('User agent string'),
};
