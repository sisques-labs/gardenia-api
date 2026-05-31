import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Builds deep-link URLs for plant detail pages.
 * Plant-specific URL shape lives in the plants context, not in qr.
 */
@Injectable()
export class PlantQrTargetUrlBuilderService {
  constructor(private readonly configService: ConfigService) {}

  build(plantId: string, spaceId: string): string {
    const baseUrl = this.configService.getOrThrow<string>('app.qrBaseUrl');
    return `${baseUrl}/plants/${plantId}?spaceId=${spaceId}`;
  }
}
