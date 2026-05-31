import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IQrReadRepository } from '@contexts/qr/domain/repositories/read/qr-read.repository';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';
import { SpaceContext } from '../../../../../../shared/space-context/space-context.service';
import { createTenantRepository } from '../../../../../../shared/tenant-repository/create-tenant-repository.factory';
import { QrTypeOrmEntity } from '../entities/qr.entity';
import { QrTypeOrmMapper } from '../mappers/qr-typeorm.mapper';

@Injectable()
export class QrTypeOrmReadRepository implements IQrReadRepository {
  private readonly repository: Repository<QrTypeOrmEntity>;

  constructor(
    @InjectRepository(QrTypeOrmEntity)
    rawRepo: Repository<QrTypeOrmEntity>,
    private readonly mapper: QrTypeOrmMapper,
    private readonly spaceContext: SpaceContext,
  ) {
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async findById(id: string): Promise<QrViewModel | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findPngById(id: string): Promise<Buffer | null> {
    const entity = await this.repository.findOne({
      where: { id },
      select: { id: true, pngImage: true, spaceId: true },
    });
    return entity?.pngImage ?? null;
  }
}
