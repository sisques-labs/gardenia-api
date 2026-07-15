import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { FileAggregate } from '@contexts/files/domain/aggregates/file.aggregate';
import { FileMimeTypeEnum } from '@contexts/files/domain/enums/file-mime-type.enum';
import { FileIdValueObject } from '@contexts/files/domain/value-objects/file-id/file-id.value-object';
import { FileMimeTypeValueObject } from '@contexts/files/domain/value-objects/file-mime-type/file-mime-type.value-object';
import { FileNameValueObject } from '@contexts/files/domain/value-objects/file-name/file-name.value-object';
import { FileSizeValueObject } from '@contexts/files/domain/value-objects/file-size/file-size.value-object';
import { FileStorageKeyValueObject } from '@contexts/files/domain/value-objects/file-storage-key/file-storage-key.value-object';
import { FileUrlValueObject } from '@contexts/files/domain/value-objects/file-url/file-url.value-object';
import { FileViewModel } from '@contexts/files/domain/view-models/file.view-model';

@Injectable()
export class FileBuilder extends BaseBuilder<FileAggregate, FileViewModel> {
  private _filename!: string;
  private _mimeType!: string;
  private _size!: number;
  private _storageKey!: string;
  private _url!: string;
  private _userId!: string;
  private _spaceId!: string;

  withFilename(filename: string): this {
    this._filename = filename;
    return this;
  }

  withMimeType(mimeType: string): this {
    this._mimeType = mimeType;
    return this;
  }

  withSize(size: number): this {
    this._size = size;
    return this;
  }

  withStorageKey(storageKey: string): this {
    this._storageKey = storageKey;
    return this;
  }

  withUrl(url: string): this {
    this._url = url;
    return this;
  }

  withUserId(userId: string): this {
    this._userId = userId;
    return this;
  }

  withSpaceId(spaceId: string): this {
    this._spaceId = spaceId;
    return this;
  }

  public override build(): FileAggregate {
    this.validate();
    return new FileAggregate({
      id: new FileIdValueObject(this._id),
      filename: new FileNameValueObject(this._filename),
      mimeType: new FileMimeTypeValueObject(this._mimeType as FileMimeTypeEnum),
      size: new FileSizeValueObject(this._size),
      storageKey: new FileStorageKeyValueObject(this._storageKey),
      url: new FileUrlValueObject(this._url),
      userId: new UuidValueObject(this._userId),
      spaceId: new UuidValueObject(this._spaceId),
      createdAt: new DateValueObject(this._createdAt),
      updatedAt: new DateValueObject(this._updatedAt),
    });
  }

  public override buildViewModel(): FileViewModel {
    this.validate();
    return new FileViewModel({
      id: this._id,
      filename: this._filename,
      mimeType: this._mimeType,
      size: this._size,
      storageKey: this._storageKey,
      url: this._url,
      userId: this._userId,
      spaceId: this._spaceId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._filename) throw new FieldIsRequiredException('filename');
    if (!this._mimeType) throw new FieldIsRequiredException('mimeType');
    if (this._size === undefined) throw new FieldIsRequiredException('size');
    if (!this._storageKey) throw new FieldIsRequiredException('storageKey');
    if (!this._url) throw new FieldIsRequiredException('url');
    if (!this._userId) throw new FieldIsRequiredException('userId');
    if (!this._spaceId) throw new FieldIsRequiredException('spaceId');
  }
}
