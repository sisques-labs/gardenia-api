import { z } from 'zod';

import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';

/** Input schema for the `care_log_find_last_by_type` MCP tool. */
export const careLogFindLastByTypeSchema = {
  plantId: z.string().uuid().describe('Id of the plant'),
  activityType: z
    .nativeEnum(CareLogActivityTypeEnum)
    .describe('Activity type to look up the last entry for'),
};
