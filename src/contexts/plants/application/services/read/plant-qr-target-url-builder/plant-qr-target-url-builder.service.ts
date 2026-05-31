import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IBaseService } from '@sisques-labs/nestjs-kit';

export interface PlantQrTargetUrlBuilderServiceInput {
  plantId: string;
  spaceId: string;
}

/**
 * Builds deep-link URLs for plant detail pages.
 * Plant-specific URL shape lives in the plants context, not in qr.
 */
@Injectable()
export class PlantQrTargetUrlBuilderService implements IBaseService {
  private readonly logger = new Logger(PlantQrTargetUrlBuilderService.name);

  constructor(private readonly configService: ConfigService) {}

  async execute(input: PlantQrTargetUrlBuilderServiceInput): Promise<string> {
    this.logger.log(
      `Building plant QR target URL for plant ${input.plantId} and space ${input.spaceId}`,
    );

    const baseUrl = this.configService.getOrThrow<string>('app.qrBaseUrl');
    return `${baseUrl}/plants/${input.plantId}?spaceId=${input.spaceId}`;
  }
}
