import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FilesInterceptor } from '@nestjs/platform-express';
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
import { IdentifyPlantCommand } from '@contexts/plant-identification/application/commands/identify-plant/identify-plant.command';
import { IdentifyPlantResult } from '@contexts/plant-identification/application/commands/identify-plant/identify-plant.result';
import { PlantIdentificationFindByCriteriaQuery } from '@contexts/plant-identification/application/queries/plant-identification-find-by-criteria/plant-identification-find-by-criteria.query';
import { PlantIdentificationFindByIdQuery } from '@contexts/plant-identification/application/queries/plant-identification-find-by-id/plant-identification-find-by-id.query';
import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationViewModel } from '@contexts/plant-identification/domain/view-models/plant-identification.view-model';
import { IdentifyPlantDto } from '../dtos/identify-plant.dto';
import { IdentifyPlantResponseDto } from '../dtos/identify-plant-response.dto';
import { PlantIdentificationCriteriaDto } from '../dtos/plant-identification-criteria.dto';
import { PlantIdentificationRestResponseDto } from '../dtos/plant-identification-rest-response.dto';
import { UploadedIdentificationPhotoFile } from '../interfaces/uploaded-identification-photo-file.interface';
import { PlantIdentificationRestMapper } from '../mappers/plant-identification/plant-identification.mapper';

/**
 * Hard ceiling on the buffered upload size per photo, independent of the
 * configurable business limit enforced inside `files`. Mirrors
 * `plant-photos.controller.ts`'s own hard limit.
 */
const PLANT_IDENTIFICATION_UPLOAD_HARD_LIMIT_BYTES = 50 * 1024 * 1024;

/**
 * Local cap on submitted photos per identification request. Not a PlantNet
 * API contract detail (unverified — see Phase 0 caveat), just a sane upper
 * bound to keep one request bounded.
 */
const MAX_PHOTOS_PER_IDENTIFICATION = 5;

const VALID_ORGANS = new Set<string>(
  Object.values(PlantIdentificationOrganEnum),
);

@ApiTags('plant-identifications')
@ApiBearerAuth()
@Controller('plant-identifications')
@UseGuards(JwtAuthGuard)
export class PlantIdentificationsController {
  private readonly logger = new Logger(PlantIdentificationsController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly plantIdentificationRestMapper: PlantIdentificationRestMapper,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('photos', MAX_PHOTOS_PER_IDENTIFICATION, {
      limits: { fileSize: PLANT_IDENTIFICATION_UPLOAD_HARD_LIMIT_BYTES },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        organs: {
          type: 'string',
          description: 'JSON-encoded array, index-aligned to "photos"',
          example: '["leaf","flower"]',
        },
        project: { type: 'string' },
      },
    },
  })
  @ApiOperation({ summary: 'Submit photos and run PlantNet identification' })
  @ApiResponse({ status: 201, type: IdentifyPlantResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Invalid photos, mime type, size, or organs',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'PlantNet quota exceeded' })
  @ApiResponse({ status: 502, description: 'PlantNet provider unavailable' })
  async identifyPlant(
    @UploadedFiles() files: UploadedIdentificationPhotoFile[],
    @Body() dto: IdentifyPlantDto,
    @CurrentUser() user: CurrentUserPayload,
    @Headers('x-space-id') spaceId: string,
  ): Promise<IdentifyPlantResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'At least one photo part named "photos" is required (multipart/form-data)',
      );
    }

    // Multipart form-data lets a client send the same field name (or
    // header) more than once, in which case Multer/Nest hands back an
    // array instead of a string. Only proceed inside this branch, where
    // every value has actually narrowed to a string — the sink for each
    // of them (below) must stay textually inside this same `if`, in this
    // same function, for the guard to actually cover it.
    if (
      typeof dto.organs === 'string' &&
      (dto.project === undefined || typeof dto.project === 'string') &&
      typeof spaceId === 'string'
    ) {
      const organs = this.parseOrgans(dto.organs, files.length);

      this.logger.log(
        `Identifying plant from ${files.length} photo(s) for user: ${user.userId}`,
      );

      const result = await this.commandBus.execute<
        IdentifyPlantCommand,
        IdentifyPlantResult
      >(
        new IdentifyPlantCommand({
          photos: files.map((file, index) => ({
            filename: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            content: file.buffer,
            organ: organs[index],
          })),
          project: dto.project,
          userId: user.userId,
          spaceId,
        }),
      );

      return this.plantIdentificationRestMapper.toIdentifyResponse(result);
    }

    throw new BadRequestException(
      '"organs", "project", and the "x-space-id" header must each be a single string value',
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List identification history in the current space' })
  @ApiResponse({ status: 200 })
  async plantIdentificationsFindByCriteria(
    @Query() query: PlantIdentificationCriteriaDto,
  ): Promise<PaginatedResult<PlantIdentificationRestResponseDto>> {
    this.logger.log(`Listing plant identifications: ${JSON.stringify(query)}`);

    const filters: Filter[] = [];
    if (query.status) {
      filters.push({
        field: 'status',
        operator: FilterOperator.EQUALS,
        value: query.status,
      });
    }

    const pagination =
      query.page || query.limit
        ? { page: query.page ?? 1, perPage: query.limit ?? 20 }
        : undefined;

    const result = await this.queryBus.execute<
      PlantIdentificationFindByCriteriaQuery,
      PaginatedResult<PlantIdentificationViewModel>
    >(
      new PlantIdentificationFindByCriteriaQuery(
        new Criteria(filters, undefined, pagination),
      ),
    );

    return {
      items: result.items.map((vm) =>
        this.plantIdentificationRestMapper.toResponse(vm),
      ),
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a plant identification by id' })
  @ApiResponse({ status: 200, type: PlantIdentificationRestResponseDto })
  @ApiResponse({ status: 404, description: 'Plant identification not found' })
  async plantIdentificationFindById(
    @Param('id') id: string,
  ): Promise<PlantIdentificationRestResponseDto> {
    this.logger.log(`Fetching plant identification: ${id}`);

    const vm = await this.queryBus.execute<
      PlantIdentificationFindByIdQuery,
      PlantIdentificationViewModel
    >(new PlantIdentificationFindByIdQuery({ id }));
    return this.plantIdentificationRestMapper.toResponse(vm);
  }

  private parseOrgans(
    raw: string,
    expectedCount: number,
  ): PlantIdentificationOrganEnum[] {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new BadRequestException(
        '"organs" must be a JSON-encoded array of strings',
      );
    }

    if (!Array.isArray(parsed) || parsed.length !== expectedCount) {
      throw new BadRequestException(
        `"organs" must be a JSON array with the same length as "photos" (expected ${expectedCount})`,
      );
    }

    for (const organ of parsed) {
      if (typeof organ !== 'string' || !VALID_ORGANS.has(organ)) {
        throw new BadRequestException(
          `Invalid organ "${String(organ)}" — must be one of: ${[...VALID_ORGANS].join(', ')}`,
        );
      }
    }

    return parsed as PlantIdentificationOrganEnum[];
  }
}
