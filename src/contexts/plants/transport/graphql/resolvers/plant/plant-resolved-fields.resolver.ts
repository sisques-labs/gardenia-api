import { Inject, UseGuards } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import {
  IPlantingSpotPort,
  PLANTING_SPOT_PORT,
} from '@contexts/plants/application/ports/planting-spot.port';
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

    return {
      id: vm.id,
      name: vm.name,
      type: vm.type,
      description: vm.description ?? null,
      userId: vm.userId,
      spaceId: vm.spaceId,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }
}
