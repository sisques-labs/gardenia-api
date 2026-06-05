import { Injectable } from '@nestjs/common';

import { QrExpiredError } from '@contexts/qr/domain/exceptions/qr-expired.error';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';

@Injectable()
export class AssertQrNotExpiredService {
  execute(viewModel: QrViewModel): void {
    if (viewModel.expiresAt !== null && viewModel.expiresAt < new Date()) {
      throw new QrExpiredError(viewModel.id);
    }
  }
}
