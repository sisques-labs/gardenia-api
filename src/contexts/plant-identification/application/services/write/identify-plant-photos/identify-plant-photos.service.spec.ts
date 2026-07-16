import {
  MimeTypeValueObject,
  NumberValueObject,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationOrganValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-organ/plant-identification-organ.value-object';
import { PlantIdentificationProjectValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-project/plant-identification-project.value-object';
import { IdentifyPlantPhotosService } from './identify-plant-photos.service';

describe('IdentifyPlantPhotosService', () => {
  const photo = {
    filename: new StringValueObject('a.jpg'),
    mimeType: new StringValueObject('image/jpeg'),
    size: new NumberValueObject(10),
    content: Buffer.from('a'),
    organ: new PlantIdentificationOrganValueObject(
      PlantIdentificationOrganEnum.LEAF,
    ),
  };
  const userId = new UuidValueObject('660e8400-e29b-41d4-a716-446655440001');

  it('calls the identification port with every photo and the project', async () => {
    const port = {
      identify: jest
        .fn()
        .mockResolvedValue([
          { scientificName: 'Monstera deliciosa', commonNames: [], score: 0.9 },
        ]),
    };
    const service = new IdentifyPlantPhotosService(port);

    const result = await service.execute({
      photos: [photo],
      project: new PlantIdentificationProjectValueObject('all'),
      userId,
    });

    expect(port.identify).toHaveBeenCalledWith(
      [
        {
          content: photo.content,
          mimeType: new MimeTypeValueObject('image/jpeg'),
          organ: 'leaf',
        },
      ],
      'all',
    );
    expect(result).toEqual([
      { scientificName: 'Monstera deliciosa', commonNames: [], score: 0.9 },
    ]);
  });

  it('re-throws provider errors', async () => {
    const port = {
      identify: jest.fn().mockRejectedValue(new Error('boom')),
    };
    const service = new IdentifyPlantPhotosService(port);

    await expect(
      service.execute({ photos: [photo], project: null, userId }),
    ).rejects.toThrow('boom');
  });
});
