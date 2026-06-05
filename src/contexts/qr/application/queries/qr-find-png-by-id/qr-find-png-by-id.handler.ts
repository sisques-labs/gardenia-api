import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AssertQrViewModelExistsService } from '@contexts/qr/application/services/read/assert-qr-view-model-exists/assert-qr-view-model-exists.service';
import { QrNotFoundException } from '@contexts/qr/domain/exceptions/qr-not-found.exception';
import {
  IQrReadRepository,
  QR_READ_REPOSITORY,
} from '@contexts/qr/domain/repositories/read/qr-read.repository';
import { AssertQrNotExpiredService } from '@contexts/qr/domain/services/assert-qr-not-expired/assert-qr-not-expired.service';

import { QrFindPngByIdQuery } from './qr-find-png-by-id.query';

@QueryHandler(QrFindPngByIdQuery)
export class QrFindPngByIdQueryHandler implements IQueryHandler<
  QrFindPngByIdQuery,
  Buffer
> {
  private readonly logger = new Logger(QrFindPngByIdQueryHandler.name);

  constructor(
    @Inject(QR_READ_REPOSITORY)
    private readonly qrReadRepository: IQrReadRepository,
    private readonly assertQrViewModelExistsService: AssertQrViewModelExistsService,
    private readonly assertQrNotExpiredService: AssertQrNotExpiredService,
  ) {}

  async execute(query: QrFindPngByIdQuery): Promise<Buffer> {
    this.logger.log(`Finding QR PNG by id: ${query.qrId.value}`);
    const viewModel = await this.assertQrViewModelExistsService.execute(
      query.qrId,
    );
    await this.assertQrNotExpiredService.execute({
      id: viewModel.id,
      expiresAt: viewModel.expiresAt,
    });

    const png = await this.qrReadRepository.findPngById(query.qrId.value);
    if (!png) throw new QrNotFoundException(query.qrId.value);

    return png;
  }
}
