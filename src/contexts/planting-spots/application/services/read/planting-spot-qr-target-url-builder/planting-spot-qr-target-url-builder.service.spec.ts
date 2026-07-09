import { ConfigService } from '@nestjs/config';

import { PlantingSpotQrTargetUrlBuilderService } from './planting-spot-qr-target-url-builder.service';

const SPOT_ID = '550e8400-e29b-41d4-a716-446655440000';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

describe('PlantingSpotQrTargetUrlBuilderService', () => {
  let service: PlantingSpotQrTargetUrlBuilderService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      getOrThrow: jest.fn().mockReturnValue('https://gardenia.app'),
    } as unknown as jest.Mocked<ConfigService>;
    service = new PlantingSpotQrTargetUrlBuilderService(configService);
  });

  it('builds a deep-link URL from the configured base URL', async () => {
    const url = await service.execute({
      plantingSpotId: SPOT_ID,
      spaceId: SPACE_ID,
    });

    expect(configService.getOrThrow).toHaveBeenCalledWith('app.qrBaseUrl');
    expect(url).toBe(
      `https://gardenia.app/planting-spots/${SPOT_ID}?spaceId=${SPACE_ID}`,
    );
  });
});
