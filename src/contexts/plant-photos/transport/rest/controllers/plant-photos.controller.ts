import {
  BadRequestException,
  Body,
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

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { DeletePlantPhotoCommand } from '@contexts/plant-photos/application/commands/delete-plant-photo/delete-plant-photo.command';
import { UploadPlantPhotoCommand } from '@contexts/plant-photos/application/commands/upload-plant-photo/upload-plant-photo.command';
import { UploadPlantPhotoResult } from '@contexts/plant-photos/application/commands/upload-plant-photo/upload-plant-photo.result';
import { PlantPhotoFindByCriteriaQuery } from '@contexts/plant-photos/application/queries/plant-photo-find-by-criteria/plant-photo-find-by-criteria.query';
import { PlantPhotoFindByIdQuery } from '@contexts/plant-photos/application/queries/plant-photo-find-by-id/plant-photo-find-by-id.query';
import { PlantPhotoViewModel } from '@contexts/plant-photos/domain/view-models/plant-photo.view-model';
import { PlantPhotoCriteriaDto } from '../dtos/plant-photo-criteria.dto';
import { PlantPhotoRestResponseDto } from '../dtos/plant-photo-rest-response.dto';
import { UploadPlantPhotoDto } from '../dtos/upload-plant-photo.dto';
import { UploadedPhotoFile } from '../interfaces/uploaded-photo-file.interface';
import { PlantPhotoRestMapper } from '../mappers/plant-photo/plant-photo.mapper';

/**
 * Hard ceiling on the buffered upload size, independent of the configurable
 * business limit enforced inside the `files` context. Bounds memory use of
 * the in-memory Multer storage; set well above the default 10 MB business
 * limit (mirrors `files/transport/rest/controllers/files.controller.ts`).
 */
const PLANT_PHOTO_UPLOAD_HARD_LIMIT_BYTES = 50 * 1024 * 1024;

@ApiTags('plant-photos')
@ApiBearerAuth()
@Controller('plant-photos')
@UseGuards(JwtAuthGuard)
export class PlantPhotosController {
  private readonly logger = new Logger(PlantPhotosController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly plantPhotoRestMapper: PlantPhotoRestMapper,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: PLANT_PHOTO_UPLOAD_HARD_LIMIT_BYTES },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        plantId: { type: 'string' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload a photo for a plant' })
  @ApiResponse({ status: 201, type: PlantPhotoRestResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type, size, or plantId',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadPlantPhoto(
    @UploadedFile() file: UploadedPhotoFile,
    @Body() dto: UploadPlantPhotoDto,
    @CurrentUser() user: CurrentUserPayload,
    @Headers('x-space-id') spaceId: string,
  ): Promise<PlantPhotoRestResponseDto> {
    if (!file) {
      throw new BadRequestException(
        'A file part named "file" is required (multipart/form-data)',
      );
    }

    this.logger.log(
      `Uploading photo for plant: ${dto.plantId} by user: ${user.userId}`,
    );

    const result = await this.commandBus.execute<
      UploadPlantPhotoCommand,
      UploadPlantPhotoResult
    >(
      new UploadPlantPhotoCommand({
        plantId: dto.plantId,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        content: file.buffer,
        userId: user.userId,
        spaceId,
      }),
    );

    return {
      id: result.id,
      plantId: result.plantId,
      fileId: result.fileId,
      url: result.url,
      userId: user.userId,
      spaceId,
      createdAt: result.createdAt,
      updatedAt: result.createdAt,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List photos in the current space' })
  @ApiResponse({ status: 200 })
  async plantPhotosFindByCriteria(
    @Query() query: PlantPhotoCriteriaDto,
  ): Promise<PaginatedResult<PlantPhotoRestResponseDto>> {
    this.logger.log(`Listing plant photos: ${JSON.stringify(query)}`);

    const filters: Filter[] = [];
    if (query.plantId) {
      filters.push({
        field: 'plant_id',
        operator: FilterOperator.EQUALS,
        value: query.plantId,
      });
    }

    const pagination =
      query.page || query.limit
        ? { page: query.page ?? 1, perPage: query.limit ?? 20 }
        : undefined;

    const result = await this.queryBus.execute<
      PlantPhotoFindByCriteriaQuery,
      PaginatedResult<PlantPhotoViewModel>
    >(
      new PlantPhotoFindByCriteriaQuery(
        new Criteria(filters, undefined, pagination),
      ),
    );

    return {
      items: result.items.map((vm) => this.plantPhotoRestMapper.toResponse(vm)),
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a plant photo by id' })
  @ApiResponse({ status: 200, type: PlantPhotoRestResponseDto })
  @ApiResponse({ status: 404, description: 'Plant photo not found' })
  async plantPhotoFindById(
    @Param('id') id: string,
  ): Promise<PlantPhotoRestResponseDto> {
    this.logger.log(`Fetching plant photo: ${id}`);

    const vm = await this.queryBus.execute<
      PlantPhotoFindByIdQuery,
      PlantPhotoViewModel
    >(new PlantPhotoFindByIdQuery({ id }));
    return this.plantPhotoRestMapper.toResponse(vm);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a plant photo (uploader only)' })
  @ApiResponse({ status: 200, description: 'Plant photo deleted successfully' })
  @ApiResponse({ status: 403, description: 'Not the uploader' })
  @ApiResponse({ status: 404, description: 'Plant photo not found' })
  async deletePlantPhoto(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<{ success: boolean }> {
    this.logger.log(`Deleting plant photo: ${id}`);

    await this.commandBus.execute(
      new DeletePlantPhotoCommand({ id, requestingUserId: user.userId }),
    );
    return { success: true };
  }
}
