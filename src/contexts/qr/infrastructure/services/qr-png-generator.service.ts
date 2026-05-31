import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

import { IQrPngGenerator } from '@contexts/qr/domain/ports/qr-png-generator.port';

@Injectable()
export class QrPngGeneratorService implements IQrPngGenerator {
  async generate(targetUrl: string): Promise<Buffer> {
    return QRCode.toBuffer(targetUrl, { type: 'png', margin: 1 });
  }
}
