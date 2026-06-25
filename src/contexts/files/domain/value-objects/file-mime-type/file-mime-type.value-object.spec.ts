import { FileMimeTypeEnum } from '@contexts/files/domain/enums/file-mime-type.enum';
import { FileMimeTypeValueObject } from './file-mime-type.value-object';

describe('FileMimeTypeValueObject', () => {
  it.each([
    FileMimeTypeEnum.IMAGE_JPEG,
    FileMimeTypeEnum.IMAGE_PNG,
    FileMimeTypeEnum.IMAGE_WEBP,
  ])('accepts allowed image type %s', (mime) => {
    expect(() => new FileMimeTypeValueObject(mime)).not.toThrow();
  });

  it.each(['application/pdf', 'image/gif', 'image/heic', 'text/plain', 'junk'])(
    'rejects disallowed type %s',
    (mime) => {
      expect(
        () => new FileMimeTypeValueObject(mime as FileMimeTypeEnum),
      ).toThrow();
    },
  );
});
