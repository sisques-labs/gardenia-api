import { z } from 'zod';

/** Input schema for the `space_create` MCP tool. */
export const spaceCreateSchema = {
  name: z.string().min(1).describe('Name of the new space'),
};
