import { z } from 'zod';

/** Input schema for the `user_update` MCP tool (updates the current user). */
export const userUpdateSchema = {
  username: z.string().min(1).optional().describe('New username'),
  firstName: z.string().nullable().optional().describe('First name, or null'),
  lastName: z.string().nullable().optional().describe('Last name, or null'),
  avatarUrl: z
    .string()
    .url()
    .nullable()
    .optional()
    .describe('Avatar URL, or null'),
  bio: z.string().nullable().optional().describe('Bio, or null'),
  locale: z.string().nullable().optional().describe('Locale, or null'),
  timezone: z.string().nullable().optional().describe('Timezone, or null'),
};
