import { z } from 'zod';

import { FileMimeTypeEnum } from '@contexts/files/domain/enums/file-mime-type.enum';

/** Input schema for the `file_list` MCP tool. */
export const fileListSchema = {
  mimeType: z
    .nativeEnum(FileMimeTypeEnum)
    .optional()
    .describe('Filter by exact MIME type'),
  filename: z.string().optional().describe('Filter by partial filename match'),
  page: z.number().int().positive().optional().describe('1-based page number'),
  perPage: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe('Number of items per page (max 100)'),
};
