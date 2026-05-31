import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { QrIdValueObject } from '@contexts/qr/domain/value-objects/qr-id/qr-id.value-object';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';
import { AssertQrViewModelExistsService } from '@contexts/qr/application/services/read/assert-qr-view-model-exists/assert-qr-view-model-exists.service';

import { QrFindByIdQuery } from './qr-find-by-id.query';

@QueryHandler(QrFindByIdQuery)
export class QrFindByIdQueryHandler implements IQueryHandler<
  QrFindByIdQuery,
  QrViewModel
> {
  private readonly logger = new Logger(QrFindByIdQueryHandler.name);

  constructor(
    private readonly assertQrViewModelExistsService: AssertQrViewModelExistsService,
  ) {}

  async execute(query: QrFindByIdQuery): Promise<QrViewModel> {
    this.logger.log(`Finding QR by id: ${query.qrId}`);
    return this.assertQrViewModelExistsService.execute(
      new QrIdValueObject(query.qrId),
    );
  }
}
