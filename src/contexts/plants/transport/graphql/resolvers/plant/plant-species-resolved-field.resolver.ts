import { Inject, UseGuards } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import {
  IPlantSpeciesPort,
  PLANT_SPECIES_PORT,
} from '@contexts/plants/application/ports/plant-species.port';
import { PlantGraphQLMapper } from '../../mappers/plant/plant.mapper';
import {
  PlantLinkedSpeciesResponseDto,
  PlantResponseDto,
} from '../../dtos/responses/plant/plant.response.dto';

@UseGuards(JwtAuthGuard)
@Resolver(() => PlantResponseDto)
export class PlantSpeciesResolvedFieldResolver {
  constructor(
    @Inject(PLANT_SPECIES_PORT)
    private readonly plantSpeciesPort: IPlantSpeciesPort,
    private readonly plantGraphQLMapper: PlantGraphQLMapper,
  ) {}

  @ResolveField('species', () => PlantLinkedSpeciesResponseDto, {
    nullable: true,
  })
  async species(
    @Parent() plant: PlantResponseDto,
  ): Promise<PlantLinkedSpeciesResponseDto | null> {
    if (!plant.plantSpeciesId) return null;

    const vm = await this.plantSpeciesPort.findByPlantSpeciesId(
      plant.plantSpeciesId,
    );

    if (!vm) return null;

    return this.plantGraphQLMapper.toLinkedSpeciesResponseDto(vm);
  }
}
