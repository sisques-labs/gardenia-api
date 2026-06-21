import { z } from 'zod';

export const sensorReadingFindLatestSchema = {
  plantId: z.string().uuid().describe('Plant to read the latest metrics for'),
};
