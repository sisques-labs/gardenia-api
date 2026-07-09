import { Inject, UseGuards } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import {
  IPlantingSpotQrPort,
  PLANTING_SPOT_QR_PORT,
} from '@contexts/planting-spots/application/ports/planting-spot-qr.port';
import { PlantingSpotGraphQLMapper } from '../../mappers/planting-spot/planting-spot.mapper';
import {
  PlantingSpotQrResponseDto,
  PlantingSpotResponseDto,
} from '../../dtos/responses/planting-spot.response.dto';

@UseGuards(JwtAuthGuard)
@Resolver(() => PlantingSpotResponseDto)
export class PlantingSpotQrResolvedFieldResolver {
  constructor(
    @Inject(PLANTING_SPOT_QR_PORT)
    private readonly plantingSpotQrPort: IPlantingSpotQrPort,
    private readonly plantingSpotGraphQLMapper: PlantingSpotGraphQLMapper,
  ) {}

  @ResolveField('qr', () => PlantingSpotQrResponseDto, { nullable: true })
  async qr(
    @Parent() plantingSpot: PlantingSpotResponseDto,
  ): Promise<PlantingSpotQrResponseDto | null> {
    if (!plantingSpot.qrId) return null;

    const vm = await this.plantingSpotQrPort.findByQrId(plantingSpot.qrId);

    if (!vm) return null;

    return this.plantingSpotGraphQLMapper.toQrResponseDto(vm);
  }
}
