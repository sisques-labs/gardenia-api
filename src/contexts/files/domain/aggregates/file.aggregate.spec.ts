import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { FileMimeTypeEnum } from '@contexts/files/domain/enums/file-mime-type.enum';
import { FileDeletedEvent } from '@contexts/files/domain/events/file-deleted/file-deleted.event';
import { FileUploadedEvent } from '@contexts/files/domain/events/file-uploaded/file-uploaded.event';
import { FileIdValueObject } from '@contexts/files/domain/value-objects/file-id/file-id.value-object';
import { FileMimeTypeValueObject } from '@contexts/files/domain/value-objects/file-mime-type/file-mime-type.value-object';
import { FileNameValueObject } from '@contexts/files/domain/value-objects/file-name/file-name.value-object';
import { FileSizeValueObject } from '@contexts/files/domain/value-objects/file-size/file-size.value-object';
import { FileStorageKeyValueObject } from '@contexts/files/domain/value-objects/file-storage-key/file-storage-key.value-object';
import { FileUrlValueObject } from '@contexts/files/domain/value-objects/file-url/file-url.value-object';
import { FileAggregate } from './file.aggregate';

function buildFile(): FileAggregate {
  return new FileAggregate({
    id: new FileIdValueObject('550e8400-e29b-41d4-a716-446655440000'),
    filename: new FileNameValueObject('rose.png'),
    mimeType: new FileMimeTypeValueObject(FileMimeTypeEnum.IMAGE_PNG),
    size: new FileSizeValueObject(204800),
    storageKey: new FileStorageKeyValueObject(
      '550e8400-e29b-41d4-a716-446655440000',
    ),
    url: new FileUrlValueObject('/api/files/550e8400/content'),
    userId: new UuidValueObject('660e8400-e29b-41d4-a716-446655440001'),
    spaceId: new UuidValueObject('770e8400-e29b-41d4-a716-446655440002'),
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('FileAggregate', () => {
  it('create() applies FileUploadedEvent', () => {
    const file = buildFile();
    file.create();
    const events = file.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(FileUploadedEvent);
  });

  it('delete() applies FileDeletedEvent', () => {
    const file = buildFile();
    file.delete();
    const events = file.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(FileDeletedEvent);
  });

  it('toPrimitives() exposes all metadata fields', () => {
    const primitives = buildFile().toPrimitives();
    expect(primitives).toMatchObject({
      filename: 'rose.png',
      mimeType: 'image/png',
      size: 204800,
    });
  });
});
