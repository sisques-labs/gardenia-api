import { z } from 'zod';

/** Input schema for the `care_schedule_water_plant` MCP tool. */
export const careScheduleWaterPlantSchema = {
  plantId: z.string().uuid().describe('Id of the plant to water'),
  performedAt: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .describe('ISO timestamp of when the plant was watered (defaults to now)'),
};
