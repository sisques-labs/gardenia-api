import { Inject, UseGuards } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import {
  IPlantQrPort,
  PLANT_QR_PORT,
} from '@contexts/plants/application/ports/plant-qr.port';
import {
  IPlantSpeciesPort,
  PLANT_SPECIES_PORT,
} from '@contexts/plants/application/ports/plant-species.port';
import {
  IPlantingSpotPort,
  PLANTING_SPOT_PORT,
} from '@contexts/plants/application/ports/planting-spot.port';
import {
  PlantLinkedPlantingSpotResponseDto,
  PlantLinkedSpeciesResponseDto,
  PlantQrResponseDto,
  PlantResponseDto,
} from '../../dtos/responses/plant/plant.response.dto';
import { PlantGraphQLMapper } from '../../mappers/plant/plant.mapper';

@UseGuards(JwtAuthGuard)
@Resolver(() => PlantResponseDto)
export class PlantResolvedFieldsResolver {
  constructor(
    @Inject(PLANTING_SPOT_PORT)
    private readonly plantingSpotPort: IPlantingSpotPort,
    @Inject(PLANT_QR_PORT)
    private readonly plantQrPort: IPlantQrPort,
    @Inject(PLANT_SPECIES_PORT)
    private readonly plantSpeciesPort: IPlantSpeciesPort,
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

  @ResolveField('qr', () => PlantQrResponseDto, { nullable: true })
  async qr(
    @Parent() plant: PlantResponseDto,
  ): Promise<PlantQrResponseDto | null> {
    if (!plant.qrId) return null;

    const vm = await this.plantQrPort.findByQrId(plant.qrId);

    if (!vm) return null;

    return {
      id: vm.id,
      spaceId: vm.spaceId,
      targetUrl: vm.targetUrl,
      generation: vm.generation,
      image: vm.image,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }

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

    return {
      id: vm.id,
      name: vm.name,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }
}
