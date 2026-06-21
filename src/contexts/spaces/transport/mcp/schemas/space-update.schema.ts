import { z } from 'zod';

import { SpaceEnvironmentEnum } from '@contexts/spaces/domain/enums/space-environment.enum';

/** Input schema for the `space_update` MCP tool. */
export const spaceUpdateSchema = {
  spaceId: z.string().uuid().describe('Id of the space to update'),
  name: z.string().min(1).optional().describe('New name'),
  latitude: z
    .number()
    .nullable()
    .optional()
    .describe('New latitude, or null to clear'),
  longitude: z
    .number()
    .nullable()
    .optional()
    .describe('New longitude, or null to clear'),
  environment: z
    .nativeEnum(SpaceEnvironmentEnum)
    .nullable()
    .optional()
    .describe('New environment, or null to clear'),
};
