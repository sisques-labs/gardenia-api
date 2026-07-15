import { z } from 'zod';

/** Input schema for the `plant_photo_find_by_id` MCP tool. */
export const plantPhotoFindByIdSchema = {
  id: z.string().uuid().describe('Id of the plant photo'),
};
