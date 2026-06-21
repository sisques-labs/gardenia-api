import { z } from 'zod';

/** Input schema for the `qr_create` MCP tool. */
export const qrCreateSchema = {
  targetUrl: z.string().url().describe('URL the QR code should point to'),
  expiresAt: z
    .string()
    .datetime()
    .optional()
    .describe('Optional ISO expiry timestamp'),
};
