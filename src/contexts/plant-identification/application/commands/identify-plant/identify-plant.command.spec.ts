import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationUnsupportedImageFormatException } from '@contexts/plant-identification/domain/exceptions/plant-identification-unsupported-image-format.exception';
import { IdentifyPlantCommand } from './identify-plant.command';

const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

const buildInput = (mimeType: string) => ({
  photos: [
    {
      filename: 'leaf.jpg',
      mimeType,
      size: 1024,
      content: Buffer.from('bytes'),
      organ: PlantIdentificationOrganEnum.LEAF,
    },
  ],
  userId: USER_ID,
  spaceId: SPACE_ID,
});

describe('IdentifyPlantCommand', () => {
  it('accepts image/jpeg photos', () => {
    const command = new IdentifyPlantCommand(buildInput('image/jpeg'));

    expect(command.photos[0].mimeType.value).toBe('image/jpeg');
  });

  it('accepts image/png photos', () => {
    const command = new IdentifyPlantCommand(buildInput('image/png'));

    expect(command.photos[0].mimeType.value).toBe('image/png');
  });

  it('accepts mime types regardless of casing', () => {
    const command = new IdentifyPlantCommand(buildInput('IMAGE/JPEG'));

    expect(command.photos[0].mimeType.value).toBe('image/jpeg');
  });

  it('rejects image/webp with PlantIdentificationUnsupportedImageFormatException', () => {
    expect(() => new IdentifyPlantCommand(buildInput('image/webp'))).toThrow(
      PlantIdentificationUnsupportedImageFormatException,
    );
  });

  it('rejects any other unsupported format', () => {
    expect(() => new IdentifyPlantCommand(buildInput('image/gif'))).toThrow(
      PlantIdentificationUnsupportedImageFormatException,
    );
  });
});
