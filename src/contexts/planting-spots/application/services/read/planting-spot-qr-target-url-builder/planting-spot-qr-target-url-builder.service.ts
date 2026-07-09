import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IBaseService } from '@sisques-labs/nestjs-kit';

export interface PlantingSpotQrTargetUrlBuilderServiceInput {
  plantingSpotId: string;
  spaceId: string;
}

/**
 * Builds deep-link URLs for planting spot detail pages.
 * Planting-spot-specific URL shape lives in the planting-spots context, not in qr.
 */
@Injectable()
export class PlantingSpotQrTargetUrlBuilderService implements IBaseService {
  private readonly logger = new Logger(
    PlantingSpotQrTargetUrlBuilderService.name,
  );

  constructor(private readonly configService: ConfigService) {}

  async execute(
    input: PlantingSpotQrTargetUrlBuilderServiceInput,
  ): Promise<string> {
    this.logger.log(
      `Building planting spot QR target URL for planting spot ${input.plantingSpotId} and space ${input.spaceId}`,
    );

    const baseUrl = this.configService.getOrThrow<string>('app.qrBaseUrl');
    return `${baseUrl}/planting-spots/${input.plantingSpotId}?spaceId=${input.spaceId}`;
  }
}
