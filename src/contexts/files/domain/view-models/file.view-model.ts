import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { IFilePrimitives } from '@contexts/files/domain/primitives/file.primitives';

export class FileViewModel extends BaseViewModel {
  public readonly filename: string;
  public readonly mimeType: string;
  public readonly size: number;
  public readonly storageKey: string;
  public readonly url: string;
  public readonly userId: string;
  public readonly spaceId: string;

  constructor(props: IFilePrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.filename = props.filename;
    this.mimeType = props.mimeType;
    this.size = props.size;
    this.storageKey = props.storageKey;
    this.url = props.url;
    this.userId = props.userId;
    this.spaceId = props.spaceId;
  }
}
