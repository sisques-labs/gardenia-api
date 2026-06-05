import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { IQrPrimitives } from '@contexts/qr/domain/primitives/qr.primitives';

export class QrViewModel extends BaseViewModel {
  public readonly spaceId: string;
  public readonly targetUrl: string;
  public readonly generation: number;
  public readonly expiresAt: Date | null;

  constructor(props: IQrPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.spaceId = props.spaceId;
    this.targetUrl = props.targetUrl;
    this.generation = props.generation;
    this.expiresAt = props.expiresAt;
  }
}
