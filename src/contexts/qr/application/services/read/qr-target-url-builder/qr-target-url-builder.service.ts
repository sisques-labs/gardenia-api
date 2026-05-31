import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QrTargetUrlBuilderService {
  constructor(private readonly configService: ConfigService) {}

  build(plantId: string, spaceId: string): string {
    const baseUrl = this.configService.getOrThrow<string>('app.qrBaseUrl');
    return `${baseUrl}/plants/${plantId}?spaceId=${spaceId}`;
  }
}
