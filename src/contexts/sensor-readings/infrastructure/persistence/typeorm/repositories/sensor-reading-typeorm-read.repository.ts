import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ISensorReadingReadRepository } from '@contexts/sensor-readings/domain/repositories/read/sensor-reading-read.repository';
import { SensorReadingViewModel } from '@contexts/sensor-readings/domain/view-models/sensor-reading.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';

import { SensorReadingTypeOrmEntity } from '../entities/sensor-reading.entity';
import { SensorReadingTypeOrmMapper } from '../mappers/sensor-reading-typeorm.mapper';

@Injectable()
export class SensorReadingTypeOrmReadRepository implements ISensorReadingReadRepository {
  constructor(
    @InjectRepository(SensorReadingTypeOrmEntity)
    private readonly repo: Repository<SensorReadingTypeOrmEntity>,
    private readonly mapper: SensorReadingTypeOrmMapper,
    private readonly spaceContext: SpaceContext,
  ) {}

  async findLatestByPlant(plantId: string): Promise<SensorReadingViewModel[]> {
    // Latest reading per metric via Postgres DISTINCT ON, scoped to the space.
    const entities = await this.repo
      .createQueryBuilder('r')
      .distinctOn(['r.metric'])
      .where('r.space_id = :spaceId', { spaceId: this.spaceContext.require() })
      .andWhere('r.plant_id = :plantId', { plantId })
      .orderBy('r.metric', 'ASC')
      .addOrderBy('r.measured_at', 'DESC')
      .getMany();

    return entities.map((entity) => this.mapper.toViewModel(entity));
  }
}
