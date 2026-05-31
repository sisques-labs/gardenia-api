import { Inject, Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { QrNotFoundException } from '@contexts/qr/domain/exceptions/qr-not-found.exception';
import {
  IQrReadRepository,
  QR_READ_REPOSITORY,
} from '@contexts/qr/domain/repositories/read/qr-read.repository';
import { QrIdValueObject } from '@contexts/qr/domain/value-objects/qr-id/qr-id.value-object';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';

@Injectable()
export class AssertQrViewModelExistsService implements IBaseService {
  constructor(
    @Inject(QR_READ_REPOSITORY)
    private readonly qrReadRepository: IQrReadRepository,
  ) {}

  async execute(id: QrIdValueObject): Promise<QrViewModel> {
    const qr = await this.qrReadRepository.findById(id.value);
    if (!qr) throw new QrNotFoundException(id.value);

    return qr;
  }
}
