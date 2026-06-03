import { Inject, UseGuards } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import {
  IPlantQrPort,
  PLANT_QR_PORT,
} from '@contexts/plants/application/ports/plant-qr.port';
import { PlantGraphQLMapper } from '../../mappers/plant/plant.mapper';
import {
  PlantQrResponseDto,
  PlantResponseDto,
} from '../../dtos/responses/plant/plant.response.dto';

@UseGuards(JwtAuthGuard)
@Resolver(() => PlantResponseDto)
export class PlantQrResolvedFieldResolver {
  constructor(
    @Inject(PLANT_QR_PORT)
    private readonly plantQrPort: IPlantQrPort,
    private readonly plantGraphQLMapper: PlantGraphQLMapper,
  ) {}

  @ResolveField('qr', () => PlantQrResponseDto, { nullable: true })
  async qr(
    @Parent() plant: PlantResponseDto,
  ): Promise<PlantQrResponseDto | null> {
    if (!plant.qrId) return null;

    const vm = await this.plantQrPort.findByQrId(plant.qrId);

    if (!vm) return null;

    return this.plantGraphQLMapper.toQrResponseDto(vm);
  }
}
