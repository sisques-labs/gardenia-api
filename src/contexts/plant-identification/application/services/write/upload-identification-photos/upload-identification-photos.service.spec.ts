import {
  FilenameValueObject,
  MimeTypeValueObject,
  NumberValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationOrganValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-organ/plant-identification-organ.value-object';
import { UploadIdentificationPhotosService } from './upload-identification-photos.service';

describe('UploadIdentificationPhotosService', () => {
  it('uploads every photo concurrently via the files port', async () => {
    const filesPort = {
      uploadFile: jest
        .fn()
        .mockResolvedValueOnce({ id: 'file-1', url: 'https://cdn/1.jpg' })
        .mockResolvedValueOnce({ id: 'file-2', url: 'https://cdn/2.jpg' }),
    };
    const service = new UploadIdentificationPhotosService(filesPort);

    const photo = {
      filename: new FilenameValueObject('a.jpg'),
      mimeType: new MimeTypeValueObject('image/jpeg'),
      size: new NumberValueObject(10),
      content: Buffer.from('a'),
      organ: new PlantIdentificationOrganValueObject(
        PlantIdentificationOrganEnum.LEAF,
      ),
    };

    const result = await service.execute({
      photos: [photo, photo],
      userId: new UuidValueObject('660e8400-e29b-41d4-a716-446655440001'),
      spaceId: new UuidValueObject('770e8400-e29b-41d4-a716-446655440002'),
    });

    expect(filesPort.uploadFile).toHaveBeenCalledTimes(2);
    expect(result).toEqual([
      { id: 'file-1', url: 'https://cdn/1.jpg' },
      { id: 'file-2', url: 'https://cdn/2.jpg' },
    ]);
  });
});
