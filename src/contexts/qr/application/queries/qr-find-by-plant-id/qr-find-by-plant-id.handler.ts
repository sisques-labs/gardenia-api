import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  IQrReadRepository,
  QR_READ_REPOSITORY,
} from '@contexts/qr/domain/repositories/read/qr-read.repository';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';

import { QrFindByPlantIdQuery } from './qr-find-by-plant-id.query';

@QueryHandler(QrFindByPlantIdQuery)
export class QrFindByPlantIdQueryHandler implements IQueryHandler<
  QrFindByPlantIdQuery,
  QrViewModel | null
> {
  constructor(
    @Inject(QR_READ_REPOSITORY)
    private readonly qrReadRepository: IQrReadRepository,
  ) {}

  async execute(query: QrFindByPlantIdQuery): Promise<QrViewModel | null> {
    return this.qrReadRepository.findByPlantId(query.plantId);
  }
}
