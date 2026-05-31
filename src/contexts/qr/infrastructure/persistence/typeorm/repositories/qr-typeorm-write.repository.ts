import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { QrAggregate } from '@contexts/qr/domain/aggregates/qr.aggregate';
import {
  IQrWriteRepository,
  QrSaveOptions,
} from '@contexts/qr/domain/repositories/write/qr-write.repository';
import { SpaceContext } from '../../../../../../shared/space-context/space-context.service';
import { createTenantRepository } from '../../../../../../shared/tenant-repository/create-tenant-repository.factory';
import { QrTypeOrmEntity } from '../entities/qr.entity';
import { QrTypeOrmMapper } from '../mappers/qr-typeorm.mapper';

@Injectable()
export class QrTypeOrmWriteRepository implements IQrWriteRepository {
  private readonly repository: Repository<QrTypeOrmEntity>;

  constructor(
    private readonly mapper: QrTypeOrmMapper,
    @InjectRepository(QrTypeOrmEntity)
    rawRepo: Repository<QrTypeOrmEntity>,
    private readonly spaceContext: SpaceContext,
  ) {
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async findById(id: string): Promise<QrAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toAggregate(entity) : null;
  }

  async save(
    aggregate: QrAggregate,
    pngImage: Buffer,
    options?: QrSaveOptions,
  ): Promise<QrAggregate> {
    const entity = this.mapper.toEntity(aggregate, pngImage, options);

    if (!options?.plantId) {
      const existing = await this.repository.findOne({
        where: { id: entity.id },
      });
      if (existing) {
        entity.plantId = existing.plantId;
      }
    }

    await this.repository.save(entity);
    return this.mapper.toAggregate(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
