import { Inject, UseGuards } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import {
  IPlantingSpotPort,
  PLANTING_SPOT_PORT,
} from '@contexts/plants/application/ports/planting-spot.port';
import { PlantGraphQLMapper } from '../../mappers/plant/plant.mapper';
import {
  PlantLinkedPlantingSpotResponseDto,
  PlantResponseDto,
} from '../../dtos/responses/plant/plant.response.dto';

@UseGuards(JwtAuthGuard)
@Resolver(() => PlantResponseDto)
export class PlantResolvedFieldsResolver {
  constructor(
    @Inject(PLANTING_SPOT_PORT)
    private readonly plantingSpotPort: IPlantingSpotPort,
    private readonly plantGraphQLMapper: PlantGraphQLMapper,
  ) {}

  @ResolveField('plantingSpot', () => PlantLinkedPlantingSpotResponseDto, {
    nullable: true,
  })
  async plantingSpot(
    @Parent() plant: PlantResponseDto,
  ): Promise<PlantLinkedPlantingSpotResponseDto | null> {
    if (!plant.plantingSpotId) return null;

    const vm = await this.plantingSpotPort.findById(
      plant.plantingSpotId,
      plant.spaceId,
    );

    if (!vm) return null;

    return this.plantGraphQLMapper.toLinkedPlantingSpotResponseDto(vm);
  }
}
