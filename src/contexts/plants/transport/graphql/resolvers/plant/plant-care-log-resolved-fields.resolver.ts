import { Inject, UseGuards } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import {
  CARE_LOG_PORT,
  ICareLogPort,
} from '@contexts/plants/application/ports/care-log.port';
import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';

import { PlantResponseDto } from '../../dtos/responses/plant/plant.response.dto';

@UseGuards(JwtAuthGuard)
@Resolver(() => PlantResponseDto)
export class PlantCareLogResolvedFieldsResolver {
  constructor(
    @Inject(CARE_LOG_PORT)
    private readonly careLogPort: ICareLogPort,
  ) {}

  @ResolveField('lastWateredAt', () => Date, { nullable: true })
  async lastWateredAt(@Parent() plant: PlantResponseDto): Promise<Date | null> {
    return this.careLogPort.findLastActivityByType(
      plant.id,
      CareLogActivityTypeEnum.WATERING,
    );
  }

  @ResolveField('lastFertilizedAt', () => Date, { nullable: true })
  async lastFertilizedAt(
    @Parent() plant: PlantResponseDto,
  ): Promise<Date | null> {
    return this.careLogPort.findLastActivityByType(
      plant.id,
      CareLogActivityTypeEnum.FERTILIZING,
    );
  }
}
