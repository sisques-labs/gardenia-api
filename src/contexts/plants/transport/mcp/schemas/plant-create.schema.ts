import { z } from 'zod';

/** Input schema for the `plant_create` MCP tool. */
export const plantCreateSchema = {
  name: z.string().min(1).describe('Display name of the plant'),
  plantSpeciesId: z
    .string()
    .uuid()
    .optional()
    .describe('Optional id of the linked plant species'),
  imageUrl: z
    .string()
    .url()
    .optional()
    .describe('Optional image URL for the plant'),
};
