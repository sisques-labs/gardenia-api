import { z } from 'zod';

/** Input schema for the `plant_photo_delete` MCP tool. */
export const plantPhotoDeleteSchema = {
  id: z.string().uuid().describe('Id of the plant photo to delete'),
};
