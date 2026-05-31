import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { QrNotFoundException } from '@contexts/qr/domain/exceptions/qr-not-found.exception';
import {
  IQrReadRepository,
  QR_READ_REPOSITORY,
} from '@contexts/qr/domain/repositories/read/qr-read.repository';

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
  ) {}

  async execute(query: QrFindPngByIdQuery): Promise<Buffer> {
    this.logger.log(`Finding QR PNG by id: ${query.qrId}`);
    const png = await this.qrReadRepository.findPngById(query.qrId);
    if (!png) throw new QrNotFoundException(query.qrId);

    return png;
  }
}
