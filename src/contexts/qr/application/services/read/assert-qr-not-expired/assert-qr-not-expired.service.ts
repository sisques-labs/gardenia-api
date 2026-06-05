import { Injectable } from '@nestjs/common';

import { QrExpiresAtDomainService } from '@contexts/qr/domain/services/qr-expires-at/qr-expires-at.domain-service';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';

@Injectable()
export class AssertQrNotExpiredService {
  constructor(
    private readonly qrExpiresAtDomainService: QrExpiresAtDomainService,
  ) {}

  execute(viewModel: QrViewModel): void {
    this.qrExpiresAtDomainService.assertNotExpired(
      viewModel.id,
      viewModel.expiresAt,
    );
  }
}
