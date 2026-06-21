import { z } from 'zod';

/** Input schema for the `qr_regenerate` MCP tool. */
export const qrRegenerateSchema = {
  qrId: z.string().uuid().describe('Id of the QR code to regenerate'),
};
