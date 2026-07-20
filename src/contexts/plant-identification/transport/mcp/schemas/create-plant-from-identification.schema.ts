import { z } from 'zod';

/** Input schema for the `plant_identification_create_plant` MCP tool. */
export const createPlantFromIdentificationSchema = {
  identificationId: z
    .string()
    .uuid()
    .describe('Id of the resolved plant identification'),
  name: z.string().min(1).describe('Name for the new tracked plant'),
  imageUrl: z
    .string()
    .optional()
    .describe('Optional cover image URL for the new plant'),
};
