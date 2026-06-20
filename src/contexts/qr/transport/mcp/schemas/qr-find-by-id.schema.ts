import { z } from 'zod';

/** Input schema for the `qr_find_by_id` MCP tool. */
export const qrFindByIdSchema = {
  qrId: z.string().uuid().describe('Id of the QR code'),
};
