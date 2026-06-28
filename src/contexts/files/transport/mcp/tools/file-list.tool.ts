import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Criteria, Filter, FilterOperator } from '@sisques-labs/nestjs-kit';

import { McpTool } from '@core/mcp/domain/decorators/mcp-tool.decorator';
import { IMcpTool } from '@core/mcp/domain/interfaces/mcp-tool.interface';
import { FileFindByCriteriaQuery } from '@contexts/files/application/queries/file-find-by-criteria/file-find-by-criteria.query';
import { FileMimeTypeEnum } from '@contexts/files/domain/enums/file-mime-type.enum';
import { fileListSchema } from '../schemas/file-list.schema';

@McpTool()
@Injectable()
export class FileListMcpTool implements IMcpTool {
  private readonly logger = new Logger(FileListMcpTool.name);

  readonly name = 'file_list';
  readonly title = 'List files';
  readonly description =
    'Returns a paginated list of file metadata in the current space.';
  readonly inputSchema = fileListSchema;

  constructor(private readonly queryBus: QueryBus) {}

  async execute(args: Record<string, unknown>): Promise<CallToolResult> {
    const { mimeType, filename, page, perPage } = args as {
      mimeType?: FileMimeTypeEnum;
      filename?: string;
      page?: number;
      perPage?: number;
    };
    this.logger.log(
      `Listing files: mimeType=${mimeType ?? '-'} filename=${filename ?? '-'}`,
    );

    const filters: Filter[] = [];
    if (mimeType)
      filters.push({
        field: 'mime_type',
        operator: FilterOperator.EQUALS,
        value: mimeType,
      });
    if (filename)
      filters.push({
        field: 'filename',
        operator: FilterOperator.LIKE,
        value: filename,
      });

    const pagination =
      page !== undefined && perPage !== undefined
        ? { page, perPage }
        : undefined;

    const result = await this.queryBus.execute(
      new FileFindByCriteriaQuery(new Criteria(filters, undefined, pagination)),
    );

    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
}
