import { Inject, Injectable } from '@nestjs/common';
import { IBaseService, UuidValueObject } from '@sisques-labs/nestjs-kit';
import { QrAggregate } from '@contexts/qr/domain/aggregates/qr.aggregate';
import { QrNotFoundException } from '@contexts/qr/domain/exceptions/qr-not-found.exception';
import {
  IQrWriteRepository,
  QR_WRITE_REPOSITORY,
} from '@contexts/qr/domain/repositories/write/qr-write.repository';

@Injectable()
export class AssertQrExistsService implements IBaseService {
  constructor(
    @Inject(QR_WRITE_REPOSITORY)
    private readonly qrWriteRepository: IQrWriteRepository,
  ) {}

  async execute(id: UuidValueObject): Promise<QrAggregate> {
    const qr = await this.qrWriteRepository.findById(id.value);
    if (!qr) throw new QrNotFoundException(id.value);

    return qr;
  }
}
