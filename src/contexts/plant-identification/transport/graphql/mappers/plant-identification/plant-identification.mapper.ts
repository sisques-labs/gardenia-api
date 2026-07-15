import { Injectable, Logger } from '@nestjs/common';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { PlantIdentificationViewModel } from '@contexts/plant-identification/domain/view-models/plant-identification.view-model';
import {
  PaginatedPlantIdentificationResultDto,
  PlantIdentificationResponseDto,
} from '@contexts/plant-identification/transport/graphql/dtos/responses/plant-identification.response.dto';

@Injectable()
export class PlantIdentificationGraphQLMapper {
  private readonly logger = new Logger(PlantIdentificationGraphQLMapper.name);

  toResponseDto(
    vm: PlantIdentificationViewModel,
  ): PlantIdentificationResponseDto {
    this.logger.log(
      `Mapping plant identification view model to response dto: ${vm.id}`,
    );
    return {
      id: vm.id,
      requestedByUserId: vm.requestedByUserId,
      spaceId: vm.spaceId,
      status: vm.status as PlantIdentificationStatusEnum,
      resolvedGbifKey: vm.resolvedGbifKey,
      resolvedScientificName: vm.resolvedScientificName,
      convertedToPlantId: vm.convertedToPlantId,
      photos: vm.photos.map((photo) => ({
        fileId: photo.fileId,
        url: photo.url,
        organ: photo.organ as PlantIdentificationOrganEnum,
        position: photo.position,
      })),
      candidates: vm.candidates.map((candidate) => ({
        scientificName: candidate.scientificName,
        commonNames: candidate.commonNames,
        score: candidate.score,
        rank: candidate.rank,
      })),
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }

  toPaginatedResponseDto(
    paginatedResult: PaginatedResult<PlantIdentificationViewModel>,
  ): PaginatedPlantIdentificationResultDto {
    return {
      items: paginatedResult.items.map((vm) => this.toResponseDto(vm)),
      total: paginatedResult.total,
      page: paginatedResult.page,
      perPage: paginatedResult.perPage,
      totalPages: paginatedResult.totalPages,
    };
  }
}
