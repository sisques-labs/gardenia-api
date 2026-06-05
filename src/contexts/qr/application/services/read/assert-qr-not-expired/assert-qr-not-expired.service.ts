import { Injectable } from '@nestjs/common';

import { AssertQrNotExpiredDomainService } from '@contexts/qr/domain/services/assert-qr-not-expired/assert-qr-not-expired.domain-service';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';

@Injectable()
export class AssertQrNotExpiredService {
  constructor(
    private readonly assertQrNotExpiredDomainService: AssertQrNotExpiredDomainService,
  ) {}

  async execute(viewModel: QrViewModel): Promise<void> {
    await this.assertQrNotExpiredDomainService.execute({
      id: viewModel.id,
      expiresAt: viewModel.expiresAt,
    });
  }
}
