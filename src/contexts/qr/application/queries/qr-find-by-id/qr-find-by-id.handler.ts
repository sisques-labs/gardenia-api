import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AssertQrViewModelExistsService } from '@contexts/qr/application/services/read/assert-qr-view-model-exists/assert-qr-view-model-exists.service';
import { AssertQrNotExpiredService } from '@contexts/qr/domain/services/assert-qr-not-expired/assert-qr-not-expired.service';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';

import { QrFindByIdQuery } from './qr-find-by-id.query';

@QueryHandler(QrFindByIdQuery)
export class QrFindByIdQueryHandler implements IQueryHandler<
  QrFindByIdQuery,
  QrViewModel
> {
  private readonly logger = new Logger(QrFindByIdQueryHandler.name);

  constructor(
    private readonly assertQrViewModelExistsService: AssertQrViewModelExistsService,
    private readonly assertQrNotExpiredService: AssertQrNotExpiredService,
  ) {}

  async execute(query: QrFindByIdQuery): Promise<QrViewModel> {
    this.logger.log(`Finding QR by id: ${query.qrId.value}`);
    const viewModel = await this.assertQrViewModelExistsService.execute(
      query.qrId,
    );
    await this.assertQrNotExpiredService.execute({
      id: viewModel.id,
      expiresAt: viewModel.expiresAt,
    });
    return viewModel;
  }
}
