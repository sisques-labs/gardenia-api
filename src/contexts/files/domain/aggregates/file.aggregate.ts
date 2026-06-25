import { BaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { FileDeletedEvent } from '@contexts/files/domain/events/file-deleted/file-deleted.event';
import { FileUploadedEvent } from '@contexts/files/domain/events/file-uploaded/file-uploaded.event';
import { IFile } from '@contexts/files/domain/interfaces/file.interface';
import { IFilePrimitives } from '@contexts/files/domain/primitives/file.primitives';
import { FileIdValueObject } from '@contexts/files/domain/value-objects/file-id/file-id.value-object';
import { FileMimeTypeValueObject } from '@contexts/files/domain/value-objects/file-mime-type/file-mime-type.value-object';
import { FileNameValueObject } from '@contexts/files/domain/value-objects/file-name/file-name.value-object';
import { FileSizeValueObject } from '@contexts/files/domain/value-objects/file-size/file-size.value-object';
import { FileStorageKeyValueObject } from '@contexts/files/domain/value-objects/file-storage-key/file-storage-key.value-object';
import { FileUrlValueObject } from '@contexts/files/domain/value-objects/file-url/file-url.value-object';

/**
 * A stored file (image) — metadata only. The raw bytes are owned by the storage
 * port, never by this aggregate. Files are immutable: there is no update path;
 * to change an image, upload a new file and delete the old one.
 */
export class FileAggregate extends BaseAggregate {
  private readonly _id: FileIdValueObject;
  private readonly _filename: FileNameValueObject;
  private readonly _mimeType: FileMimeTypeValueObject;
  private readonly _size: FileSizeValueObject;
  private readonly _storageKey: FileStorageKeyValueObject;
  private readonly _url: FileUrlValueObject;
  private readonly _userId: UuidValueObject;
  private readonly _spaceId: UuidValueObject;

  constructor(props: IFile) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._filename = props.filename;
    this._mimeType = props.mimeType;
    this._size = props.size;
    this._storageKey = props.storageKey;
    this._url = props.url;
    this._userId = props.userId;
    this._spaceId = props.spaceId;
  }

  public create(): void {
    this.apply(
      new FileUploadedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: FileAggregate.name,
          entityId: this._id.value,
          entityType: FileAggregate.name,
          eventType: FileUploadedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public delete(): void {
    this.apply(
      new FileDeletedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: FileAggregate.name,
          entityId: this._id.value,
          entityType: FileAggregate.name,
          eventType: FileDeletedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public toPrimitives(): IFilePrimitives {
    return {
      id: this._id.value,
      filename: this._filename.value,
      mimeType: this._mimeType.value,
      size: this._size.value,
      storageKey: this._storageKey.value,
      url: this._url.value,
      userId: this._userId.value,
      spaceId: this._spaceId.value,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }

  get id(): FileIdValueObject {
    return this._id;
  }
  get filename(): FileNameValueObject {
    return this._filename;
  }
  get mimeType(): FileMimeTypeValueObject {
    return this._mimeType;
  }
  get size(): FileSizeValueObject {
    return this._size;
  }
  get storageKey(): FileStorageKeyValueObject {
    return this._storageKey;
  }
  get url(): FileUrlValueObject {
    return this._url;
  }
  get userId(): UuidValueObject {
    return this._userId;
  }
  get spaceId(): UuidValueObject {
    return this._spaceId;
  }
}
