import { Inject, UseGuards } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import {
  CARE_LOG_PORT,
  ICareLogPort,
} from '@contexts/plants/application/ports/care-log.port';

import {
  PlantCareLogSummaryResponseDto,
  PlantResponseDto,
} from '../../dtos/responses/plant/plant.response.dto';

@UseGuards(JwtAuthGuard)
@Resolver(() => PlantResponseDto)
export class PlantCareLogResolvedFieldsResolver {
  constructor(
    @Inject(CARE_LOG_PORT)
    private readonly careLogPort: ICareLogPort,
  ) {}

  @ResolveField('careLog', () => PlantCareLogSummaryResponseDto, {
    nullable: true,
  })
  async careLog(
    @Parent() plant: PlantResponseDto,
  ): Promise<PlantCareLogSummaryResponseDto | null> {
    const summary = await this.careLogPort.getCareLogSummary(plant.id);
    const allNull = Object.values(summary).every((v) => v === null);
    if (allNull) return null;
    return summary;
  }
}
