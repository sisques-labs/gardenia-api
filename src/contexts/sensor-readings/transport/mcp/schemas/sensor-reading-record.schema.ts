import { z } from 'zod';

export const sensorReadingRecordSchema = {
  plantId: z.string().uuid().describe('Plant the reading belongs to'),
  metric: z
    .string()
    .min(1)
    .describe('Measured metric, e.g. moisture, temperature'),
  value: z.number().describe('Numeric measured value'),
  unit: z.string().optional().describe('Unit of measurement, e.g. %, °C'),
  measuredAt: z
    .string()
    .datetime()
    .optional()
    .describe('ISO timestamp of the measurement (defaults to now)'),
  source: z.string().optional().describe('Origin of the reading'),
};
