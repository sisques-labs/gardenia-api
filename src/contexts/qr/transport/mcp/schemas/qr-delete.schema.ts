import { z } from 'zod';

/** Input schema for the `qr_delete` MCP tool. */
export const qrDeleteSchema = {
  qrId: z.string().uuid().describe('Id of the QR code to delete'),
};
