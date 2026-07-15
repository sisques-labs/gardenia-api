import {
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  Criteria,
  Filter,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Response } from 'express';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { UploadFileCommand } from '@contexts/files/application/commands/upload-file/upload-file.command';
import { UploadFileResult } from '@contexts/files/application/commands/upload-file/upload-file.result';
import { DeleteFileCommand } from '@contexts/files/application/commands/delete-file/delete-file.command';
import { FileFindByCriteriaQuery } from '@contexts/files/application/queries/file-find-by-criteria/file-find-by-criteria.query';
import { FileFindByIdQuery } from '@contexts/files/application/queries/file-find-by-id/file-find-by-id.query';
import { FileFindContentByIdQuery } from '@contexts/files/application/queries/file-find-content-by-id/file-find-content-by-id.query';
import { FileContentResult } from '@contexts/files/application/queries/file-find-content-by-id/file-find-content-by-id.result';
import { FileViewModel } from '@contexts/files/domain/view-models/file.view-model';
import { FileCriteriaDto } from '../dtos/file-criteria.dto';
import { FileRestResponseDto } from '../dtos/file-rest-response.dto';
import { UploadFileResponseDto } from '../dtos/upload-file-response.dto';
import { FileRestMapper } from '../mappers/file/file.mapper';
import { ImageFileValidationPipe } from '../pipes/image-file-validation.pipe';
import { UploadedImageFile } from '../pipes/uploaded-image-file.interface';

/**
 * Hard ceiling on the buffered upload size, independent of the configurable
 * business limit (`FILES_MAX_SIZE_BYTES`, enforced by ImageFileValidationPipe).
 * Bounds memory use of the in-memory Multer storage; set well above the default
 * 10 MB business limit.
 */
const FILE_UPLOAD_HARD_LIMIT_BYTES = 50 * 1024 * 1024;

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  private readonly logger = new Logger(FilesController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly fileRestMapper: FileRestMapper,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: FILE_UPLOAD_HARD_LIMIT_BYTES },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload an image file' })
  @ApiResponse({ status: 201, type: UploadFileResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadFile(
    @UploadedFile(ImageFileValidationPipe) file: UploadedImageFile,
    @CurrentUser() user: CurrentUserPayload,
    @Headers('x-space-id') spaceId: string,
  ): Promise<UploadFileResponseDto> {
    this.logger.log(
      `Uploading file '${file.originalname}' (${file.mimetype}, ${file.size} bytes) for user: ${user.userId}`,
    );

    const result = await this.commandBus.execute<
      UploadFileCommand,
      UploadFileResult
    >(
      new UploadFileCommand({
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        content: file.buffer,
        userId: user.userId,
        spaceId,
      }),
    );

    return { id: result.id, url: result.url };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List files in the current space' })
  @ApiResponse({ status: 200 })
  async filesFindByCriteria(
    @Query() query: FileCriteriaDto,
  ): Promise<PaginatedResult<FileRestResponseDto>> {
    this.logger.log(`Listing files: ${JSON.stringify(query)}`);

    const filters: Filter[] = [];
    if (query.mimeType)
      filters.push({
        field: 'mime_type',
        operator: FilterOperator.EQUALS,
        value: query.mimeType,
      });
    if (query.filename)
      filters.push({
        field: 'filename',
        operator: FilterOperator.LIKE,
        value: query.filename,
      });

    const pagination =
      query.page || query.limit
        ? { page: query.page ?? 1, perPage: query.limit ?? 20 }
        : undefined;

    const result = await this.queryBus.execute<
      FileFindByCriteriaQuery,
      PaginatedResult<FileViewModel>
    >(
      new FileFindByCriteriaQuery(new Criteria(filters, undefined, pagination)),
    );

    return {
      items: result.items.map((vm) => this.fileRestMapper.toResponse(vm)),
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get file metadata by id' })
  @ApiResponse({ status: 200, type: FileRestResponseDto })
  @ApiResponse({ status: 404, description: 'File not found' })
  async fileFindById(@Param('id') id: string): Promise<FileRestResponseDto> {
    this.logger.log(`Fetching file metadata: ${id}`);

    const vm = await this.queryBus.execute<FileFindByIdQuery, FileViewModel>(
      new FileFindByIdQuery({ id }),
    );
    return this.fileRestMapper.toResponse(vm);
  }

  @Get(':id/content')
  @ApiOperation({ summary: 'Download the file bytes' })
  @ApiResponse({ status: 200, description: 'Raw file bytes' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async fileContent(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`Serving file content: ${id}`);

    const result = await this.queryBus.execute<
      FileFindContentByIdQuery,
      FileContentResult
    >(new FileFindContentByIdQuery({ id }));

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${result.filename}"`,
    );
    res.setHeader('Content-Length', result.bytes.length);
    res.send(result.bytes);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(@Param('id') id: string): Promise<{ success: boolean }> {
    this.logger.log(`Deleting file: ${id}`);

    await this.commandBus.execute(new DeleteFileCommand({ id }));
    return { success: true };
  }
}
