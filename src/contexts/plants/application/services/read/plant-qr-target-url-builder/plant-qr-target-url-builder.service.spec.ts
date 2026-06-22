import { ConfigService } from '@nestjs/config';

import { PlantQrTargetUrlBuilderService } from './plant-qr-target-url-builder.service';

const PLANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

describe('PlantQrTargetUrlBuilderService', () => {
  let service: PlantQrTargetUrlBuilderService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      getOrThrow: jest.fn().mockReturnValue('https://gardenia.app'),
    } as unknown as jest.Mocked<ConfigService>;
    service = new PlantQrTargetUrlBuilderService(configService);
  });

  it('builds a deep-link URL from the configured base URL', async () => {
    const url = await service.execute({ plantId: PLANT_ID, spaceId: SPACE_ID });

    expect(configService.getOrThrow).toHaveBeenCalledWith('app.qrBaseUrl');
    expect(url).toBe(
      `https://gardenia.app/plants/${PLANT_ID}?spaceId=${SPACE_ID}`,
    );
  });
});
