import { MimeTypeValueObject } from '@sisques-labs/nestjs-kit';

import { PlantNetIdentificationImageInput } from '@contexts/plant-identification/application/ports/plantnet-identification-image.input';
import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantNetImageTranscoderService } from './plantnet-image-transcoder.service';

// See plantnet-image-transcoder.service.ts for why sharp is required directly.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require('sharp');

const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);

const buildImage = async (
  format: 'jpeg' | 'png' | 'webp',
): Promise<PlantNetIdentificationImageInput> => {
  const content = await sharp({
    create: {
      width: 4,
      height: 4,
      channels: 3,
      background: { r: 10, g: 200, b: 30 },
    },
  })
    .toFormat(format)
    .toBuffer();

  return {
    content,
    mimeType: new MimeTypeValueObject(`image/${format}`),
    organ: PlantIdentificationOrganEnum.LEAF,
  };
};

describe('PlantNetImageTranscoderService', () => {
  let service: PlantNetImageTranscoderService;

  beforeEach(() => {
    service = new PlantNetImageTranscoderService();
  });

  it('returns image/jpeg photos unchanged', async () => {
    const image = await buildImage('jpeg');

    const result = await service.ensureAcceptedFormat(image);

    expect(result).toBe(image);
  });

  it('returns image/png photos unchanged', async () => {
    const image = await buildImage('png');

    const result = await service.ensureAcceptedFormat(image);

    expect(result).toBe(image);
  });

  it('transcodes image/webp photos to image/jpeg', async () => {
    const image = await buildImage('webp');

    const result = await service.ensureAcceptedFormat(image);

    expect(result.mimeType.value).toBe('image/jpeg');
    expect(result.content.subarray(0, 3).equals(JPEG_MAGIC)).toBe(true);
    expect(result.content).not.toBe(image.content);
  });

  it('preserves the organ when transcoding', async () => {
    const image = await buildImage('webp');

    const result = await service.ensureAcceptedFormat(image);

    expect(result.organ).toBe(image.organ);
  });
});
