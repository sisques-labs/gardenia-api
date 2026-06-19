import { Inject, UseGuards } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import {
  IPlantingSpotPlantsPort,
  PLANTING_SPOT_PLANTS_PORT,
} from '@contexts/planting-spots/application/ports/planting-spot-plants.port';
import { PlantingSpotGraphQLMapper } from '../../mappers/planting-spot/planting-spot.mapper';
import {
  PlantInSpotResponseDto,
  PlantingSpotResponseDto,
} from '../../dtos/responses/planting-spot.response.dto';

@UseGuards(JwtAuthGuard)
@Resolver(() => PlantingSpotResponseDto)
export class PlantingSpotResolvedPlantsResolver {
  constructor(
    @Inject(PLANTING_SPOT_PLANTS_PORT)
    private readonly plantingSpotPlantsPort: IPlantingSpotPlantsPort,
    private readonly plantingSpotGraphQLMapper: PlantingSpotGraphQLMapper,
  ) {}

  @ResolveField('resolvedPlants', () => [PlantInSpotResponseDto], { nullable: true })
  async resolvedPlants(
    @Parent() spot: PlantingSpotResponseDto,
  ): Promise<PlantInSpotResponseDto[]> {
    const plants = await this.plantingSpotPlantsPort.findByPlantingSpotId(spot.id);
    return plants.map((p) => this.plantingSpotGraphQLMapper.toPlantInSpotResponseDto(p));
  }
}
