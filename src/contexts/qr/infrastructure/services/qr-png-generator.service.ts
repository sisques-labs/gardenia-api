import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';

import { IQrPngGenerator } from '@contexts/qr/domain/ports/qr-png-generator.port';

@Injectable()
export class QrPngGeneratorService implements IQrPngGenerator {
  private readonly logger = new Logger(QrPngGeneratorService.name);

  async generate(targetUrl: string): Promise<Buffer> {
    this.logger.log(`Generating QR PNG for URL: ${targetUrl}`);
    const buffer = await QRCode.toBuffer(targetUrl, { type: 'png', margin: 1 });
    this.logger.log(`QR PNG generated (${buffer.length} bytes)`);
    return buffer;
  }
}
